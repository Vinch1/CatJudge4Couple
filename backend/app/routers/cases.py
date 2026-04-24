import os
import shutil
import uuid

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.config import UPLOAD_DIR
from app.database import get_db
from app.models.models import EvidenceRole, EvidenceType
from app.schemas.case import CaseCreate, CaseJoin, CaseResponse
from app.schemas.evidence import EvidenceResponse
from app.services.case_service import CaseService

router = APIRouter(prefix="/api/cases", tags=["cases"])


@router.post("", response_model=dict)
def create_case(data: CaseCreate, db: Session = Depends(get_db)):
    case, plaintiff_token = CaseService.create_case(db, data)
    return {
        "case": CaseResponse.model_validate(case),
        "plaintiff_token": plaintiff_token,
    }


@router.post("/{case_id}/join", response_model=dict)
def join_case(case_id: str, data: CaseJoin, db: Session = Depends(get_db)):
    try:
        case, defendant_token = CaseService.join_case(db, case_id, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {
        "case": CaseResponse.model_validate(case),
        "defendant_token": defendant_token,
    }


@router.post("/{case_id}/evidence", response_model=EvidenceResponse)
def submit_evidence(
    case_id: str,
    role: EvidenceRole = Form(...),
    evidence_type: EvidenceType = Form(...),
    content: str = Form(""),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    case = CaseService.get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    from app.schemas.evidence import EvidenceCreate

    actual_content = content
    raw_file_path = None

    if file and evidence_type in (EvidenceType.wechat_export, EvidenceType.screenshot):
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        case_upload_dir = os.path.join(UPLOAD_DIR, case_id)
        os.makedirs(case_upload_dir, exist_ok=True)

        ext = os.path.splitext(file.filename or "upload")[1]
        filename = f"{role.value}_{evidence_type.value}_{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(case_upload_dir, filename)

        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        raw_file_path = file_path

        if not actual_content:
            actual_content = f"[File uploaded: {file.filename}]"

    evidence_data = EvidenceCreate(
        role=role,
        evidence_type=evidence_type,
        content=actual_content,
    )
    evidence = CaseService.submit_evidence(db, case_id, evidence_data, role)

    if raw_file_path:
        evidence.raw_file_path = raw_file_path
        db.commit()
        db.refresh(evidence)

    CaseService.check_both_ready(db, case_id)

    return evidence


@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: str, db: Session = Depends(get_db)):
    case = CaseService.get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return CaseResponse.model_validate(case)


@router.get("/{case_id}/evidences", response_model=list[EvidenceResponse])
def get_evidences(case_id: str, db: Session = Depends(get_db)):
    case = CaseService.get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return [EvidenceResponse.model_validate(e) for e in CaseService.get_evidences(db, case_id)]


@router.get("/{case_id}/verdict")
def get_verdict(case_id: str, db: Session = Depends(get_db)):
    case = CaseService.get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if not case.verdict_content:
        raise HTTPException(status_code=404, detail="Verdict not available yet")
    return {"content": case.verdict_content}
