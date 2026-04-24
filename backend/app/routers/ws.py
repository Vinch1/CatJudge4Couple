import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.models import Case, CaseStatus, Evidence
from app.ws.room_manager import room_manager

router = APIRouter()


def _resolve_role(case: Case, token: str) -> str | None:
    if token == case.plaintiff_token:
        return "plaintiff"
    if token == case.defendant_token:
        return "defendant"
    return None


def _get_case(case_id: str) -> Case | None:
    db: Session = SessionLocal()
    try:
        return db.query(Case).filter(Case.id == case_id).first()
    finally:
        db.close()


def _update_case_status(case_id: str, status: CaseStatus) -> None:
    db: Session = SessionLocal()
    try:
        case = db.query(Case).filter(Case.id == case_id).first()
        if case:
            case.status = status
            db.commit()
    finally:
        db.close()


def _get_evidences(case_id: str):
    db: Session = SessionLocal()
    try:
        return db.query(Evidence).filter(Evidence.case_id == case_id).all()
    finally:
        db.close()


async def _run_trial(case_id: str, case: Case) -> None:
    """Run the full AI trial and push results via WebSocket."""
    from app.ai.factory import get_provider
    from app.services.ai_engine import AIEngine

    _update_case_status(case_id, CaseStatus.in_session)

    provider = get_provider()
    engine = AIEngine(provider)

    evidences = _get_evidences(case_id)
    plaintiff_evidence = [e.content for e in evidences if e.role == "plaintiff"]
    defendant_evidence = [e.content for e in evidences if e.role == "defendant"]

    full_text = ""
    async for event in engine.run_trial(
        plaintiff_evidence=plaintiff_evidence,
        defendant_evidence=defendant_evidence,
        plaintiff_name=case.plaintiff_name,
        defendant_name=case.defendant_name or "被告",
    ):
        await room_manager.send_to_room(case_id, event)

        if event.get("type") == "analysis_chunk":
            full_text += event.get("content", "")
        elif event.get("type") == "verdict_complete":
            full_text = event.get("verdict", full_text)

    # Save verdict
    db: Session = SessionLocal()
    try:
        case_obj = db.query(Case).filter(Case.id == case_id).first()
        if case_obj:
            case_obj.verdict_content = full_text
            case_obj.status = CaseStatus.verdict
            db.commit()
    finally:
        db.close()


@router.websocket("/ws/cases/{case_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    case_id: str,
    token: str = Query(...),
):
    case = _get_case(case_id)
    if case is None:
        await websocket.close(code=4004, reason="Case not found")
        return

    role = _resolve_role(case, token)
    if role is None:
        await websocket.close(code=4003, reason="Invalid token")
        return

    await room_manager.connect(case_id, role, websocket)

    await room_manager.send_to_room(
        case_id, room_manager.participant_status_message(case_id)
    )

    # Both connected and ready → start trial in background
    if room_manager.is_both_connected(case_id) and case.status == CaseStatus.both_ready:
        await room_manager.send_to_room(case_id, {
            "type": "stage_change",
            "stage": "evidence_review",
        })
        asyncio.create_task(_run_trial(case_id, case))

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue

            if data.get("type") == "heartbeat":
                await room_manager.send_to_role(case_id, role, {
                    "type": "heartbeat",
                })

    except WebSocketDisconnect:
        pass
    finally:
        room_manager.disconnect(case_id, role)
        await room_manager.send_to_room(
            case_id, room_manager.participant_status_message(case_id)
        )
