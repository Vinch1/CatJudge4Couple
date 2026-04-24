from datetime import datetime

from pydantic import BaseModel

from app.models.models import CaseStatus


class CaseCreate(BaseModel):
    plaintiff_name: str
    title: str


class CaseJoin(BaseModel):
    defendant_name: str


class CaseResponse(BaseModel):
    id: str
    status: CaseStatus
    plaintiff_name: str
    defendant_name: str | None = None
    title: str
    created_at: datetime
    plaintiff_token: str | None = None
    defendant_token: str | None = None

    model_config = {"from_attributes": True}


class CaseStatusResponse(BaseModel):
    id: str
    status: CaseStatus

    model_config = {"from_attributes": True}
