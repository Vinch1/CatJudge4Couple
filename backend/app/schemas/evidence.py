from datetime import datetime

from pydantic import BaseModel

from app.models.models import EvidenceRole, EvidenceType


class EvidenceCreate(BaseModel):
    role: EvidenceRole
    evidence_type: EvidenceType
    content: str = ""


class EvidenceResponse(BaseModel):
    id: str
    case_id: str
    role: EvidenceRole
    evidence_type: EvidenceType
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
