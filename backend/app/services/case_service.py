from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.models import Case, CaseStatus, Evidence, EvidenceRole
from app.schemas.case import CaseCreate, CaseJoin
from app.schemas.evidence import EvidenceCreate


class CaseService:
    @staticmethod
    def create_case(db: Session, data: CaseCreate) -> tuple[Case, str]:
        case = Case(
            plaintiff_name=data.plaintiff_name,
            title=data.title,
            plaintiff_token=str(uuid4()),
            defendant_token=str(uuid4()),
            status=CaseStatus.waiting_plaintiff,
        )
        db.add(case)
        db.commit()
        db.refresh(case)
        return case, case.plaintiff_token

    @staticmethod
    def join_case(db: Session, case_id: str, data: CaseJoin) -> tuple[Case, str]:
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise ValueError("Case not found")
        if case.defendant_name is not None:
            raise ValueError("Defendant has already joined")
        case.defendant_name = data.defendant_name
        case.status = CaseStatus.waiting_defendant
        db.commit()
        db.refresh(case)
        return case, case.defendant_token

    @staticmethod
    def submit_evidence(
        db: Session, case_id: str, data: EvidenceCreate, role: EvidenceRole
    ) -> Evidence:
        evidence = Evidence(
            case_id=case_id,
            role=role,
            evidence_type=data.evidence_type,
            content=data.content,
        )
        db.add(evidence)
        db.commit()
        db.refresh(evidence)
        return evidence

    @staticmethod
    def get_case(db: Session, case_id: str) -> Case | None:
        return db.query(Case).filter(Case.id == case_id).first()

    @staticmethod
    def get_evidences(db: Session, case_id: str) -> list[Evidence]:
        return db.query(Evidence).filter(Evidence.case_id == case_id).all()

    @staticmethod
    def check_both_ready(db: Session, case_id: str) -> bool:
        evidences = db.query(Evidence).filter(Evidence.case_id == case_id).all()
        roles = {e.role for e in evidences}
        if EvidenceRole.plaintiff in roles and EvidenceRole.defendant in roles:
            case = db.query(Case).filter(Case.id == case_id).first()
            if case and case.status in (
                CaseStatus.waiting_plaintiff,
                CaseStatus.waiting_defendant,
            ):
                case.status = CaseStatus.both_ready
                db.commit()
            return True
        return False

    @staticmethod
    def update_status(db: Session, case_id: str, status: CaseStatus) -> Case:
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise ValueError("Case not found")
        case.status = status
        db.commit()
        db.refresh(case)
        return case

    @staticmethod
    def save_verdict(db: Session, case_id: str, content: str) -> Case:
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise ValueError("Case not found")
        case.verdict_content = content
        case.status = CaseStatus.verdict
        db.commit()
        db.refresh(case)
        return case
