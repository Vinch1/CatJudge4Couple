import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, Enum as SAEnum, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CaseStatus(str, enum.Enum):
    waiting_plaintiff = "waiting_plaintiff"
    waiting_defendant = "waiting_defendant"
    both_ready = "both_ready"
    in_session = "in_session"
    verdict = "verdict"


class EvidenceRole(str, enum.Enum):
    plaintiff = "plaintiff"
    defendant = "defendant"


class EvidenceType(str, enum.Enum):
    wechat_export = "wechat_export"
    screenshot = "screenshot"
    text = "text"


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    status: Mapped[CaseStatus] = mapped_column(
        SAEnum(CaseStatus), default=CaseStatus.waiting_plaintiff, nullable=False
    )
    plaintiff_name: Mapped[str] = mapped_column(String(100), nullable=False)
    defendant_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    plaintiff_token: Mapped[str] = mapped_column(
        String(36), unique=True, default=lambda: str(uuid.uuid4())
    )
    defendant_token: Mapped[str] = mapped_column(
        String(36), unique=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    verdict_content: Mapped[str | None] = mapped_column(Text, nullable=True)

    evidences: Mapped[list["Evidence"]] = relationship(
        back_populates="case", cascade="all, delete-orphan"
    )


class Evidence(Base):
    __tablename__ = "evidences"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id"), nullable=False
    )
    role: Mapped[EvidenceRole] = mapped_column(
        SAEnum(EvidenceRole), nullable=False
    )
    evidence_type: Mapped[EvidenceType] = mapped_column(
        SAEnum(EvidenceType), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False, default="")
    raw_file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    case: Mapped["Case"] = relationship(back_populates="evidences")
