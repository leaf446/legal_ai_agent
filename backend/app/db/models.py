"""
SQLAlchemy ORM Models for LEH Backend
Database tables: users, cases, case_members, audit_logs
"""

from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, ForeignKey, Integer, Boolean, Text, JSON, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, backref
from datetime import datetime, timezone
import uuid
import enum


Base = declarative_base()


# ============================================
# Enums
# ============================================
class UserRole(str, enum.Enum):
    """User role enum"""
    LAWYER = "lawyer"
    STAFF = "staff"
    ADMIN = "admin"
    CLIENT = "client"          # 의뢰인
    DETECTIVE = "detective"    # 탐정/조사원


class UserStatus(str, enum.Enum):
    """User status enum"""
    ACTIVE = "active"
    INACTIVE = "inactive"


class CaseStatus(str, enum.Enum):
    """Case status enum"""
    ACTIVE = "active"
    OPEN = "open"              # 진행 중 (open and active)
    IN_PROGRESS = "in_progress"  # 검토 대기 (being actively worked)
    CLOSED = "closed"


class CaseMemberRole(str, enum.Enum):
    """Case member role enum"""
    OWNER = "owner"
    MEMBER = "member"
    VIEWER = "viewer"


class DocumentType(str, enum.Enum):
    """Legal document type enum (민법 840조 관련)"""
    COMPLAINT = "complaint"      # 소장
    MOTION = "motion"            # 신청서
    BRIEF = "brief"              # 준비서면
    RESPONSE = "response"        # 답변서


class DraftStatus(str, enum.Enum):
    """Draft document status enum"""
    DRAFT = "draft"              # Initial AI-generated
    REVIEWED = "reviewed"        # Lawyer has reviewed/edited
    EXPORTED = "exported"        # Has been exported at least once


class ExportFormat(str, enum.Enum):
    """Export file format enum"""
    DOCX = "docx"
    PDF = "pdf"


class ExportJobStatus(str, enum.Enum):
    """Export job status enum"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class CalendarEventType(str, enum.Enum):
    """Calendar event type enum"""
    COURT = "court"          # 재판/출석
    MEETING = "meeting"      # 상담/회의
    DEADLINE = "deadline"    # 마감
    INTERNAL = "internal"    # 내부 업무
    OTHER = "other"


class InvestigationRecordType(str, enum.Enum):
    """Investigation record type enum"""
    LOCATION = "location"    # 위치 기록
    PHOTO = "photo"          # 사진
    VIDEO = "video"          # 영상
    AUDIO = "audio"          # 음성 메모
    MEMO = "memo"            # 텍스트 메모
    EVIDENCE = "evidence"    # 증거 수집


class InvoiceStatus(str, enum.Enum):
    """Invoice status enum"""
    PENDING = "pending"      # 대기중
    PAID = "paid"            # 결제완료
    OVERDUE = "overdue"      # 연체
    CANCELLED = "cancelled"  # 취소


class JobType(str, enum.Enum):
    """Job type enum for async processing"""
    OCR = "ocr"                      # Image/PDF text extraction
    STT = "stt"                      # Audio transcription
    VISION_ANALYSIS = "vision"       # GPT-4o image understanding
    DRAFT_GENERATION = "draft"       # RAG + GPT-4o legal document
    EVIDENCE_ANALYSIS = "analysis"   # Evidence re-analysis
    PDF_EXPORT = "pdf_export"        # Export draft to PDF
    DOCX_EXPORT = "docx_export"      # Export draft to DOCX


class JobStatus(str, enum.Enum):
    """Job status enum"""
    QUEUED = "queued"          # Waiting to be processed
    PROCESSING = "processing"  # Currently running
    COMPLETED = "completed"    # Success
    FAILED = "failed"          # Error occurred
    RETRY = "retry"            # Waiting to retry
    CANCELLED = "cancelled"    # User cancelled


class EvidenceStatus(str, enum.Enum):
    """Evidence processing status enum"""
    PENDING = "pending"        # Upload URL generated, waiting for file
    UPLOADED = "uploaded"      # File uploaded, waiting for processing
    PROCESSING = "processing"  # AI processing in progress
    COMPLETED = "completed"    # AI processing complete
    FAILED = "failed"          # Processing failed

# ============================================
# Models
# ============================================
class User(Base):
    """
    User model - lawyers, staff, admins
    """
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: f"user_{uuid.uuid4().hex[:12]}")
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.LAWYER)
    status = Column(SQLEnum(UserStatus), nullable=False, default=UserStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    created_cases = relationship("Case", back_populates="owner", foreign_keys="Case.created_by")
    case_memberships = relationship("CaseMember", back_populates="user")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"


class Case(Base):
    """
    Case model - divorce cases
    Supports soft delete via deleted_at field
    """
    __tablename__ = "cases"

    id = Column(String, primary_key=True, default=lambda: f"case_{uuid.uuid4().hex[:12]}")
    title = Column(String, nullable=False)
    client_name = Column(String, nullable=True)  # 의뢰인 이름
    description = Column(String, nullable=True)
    status = Column(SQLEnum(CaseStatus), nullable=False, default=CaseStatus.ACTIVE)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)  # Soft delete timestamp

    # Relationships
    owner = relationship("User", back_populates="created_cases", foreign_keys=[created_by])
    members = relationship("CaseMember", back_populates="case")

    @property
    def is_deleted(self) -> bool:
        """Check if case is soft deleted"""
        return self.deleted_at is not None

    def __repr__(self):
        return f"<Case(id={self.id}, title={self.title}, status={self.status}, deleted={self.is_deleted})>"


class CaseMember(Base):
    """
    Case membership model - user access to cases
    """
    __tablename__ = "case_members"

    case_id = Column(String, ForeignKey("cases.id"), primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    role = Column(SQLEnum(CaseMemberRole), nullable=False, default=CaseMemberRole.VIEWER)

    # Relationships
    case = relationship("Case", back_populates="members")
    user = relationship("User", back_populates="case_memberships")

    def __repr__(self):
        return f"<CaseMember(case_id={self.case_id}, user_id={self.user_id}, role={self.role})>"


class CaseChecklistStatus(Base):
    """Tracks per-case completion state for mid-demo feedback checklist."""

    __tablename__ = "case_checklist_statuses"
    __table_args__ = (UniqueConstraint("case_id", "item_id", name="uq_case_checklist_item"),)

    id = Column(String, primary_key=True, default=lambda: f"cfbk_{uuid.uuid4().hex[:12]}")
    case_id = Column(String, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    item_id = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")
    notes = Column(Text, nullable=True)
    updated_by = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    case = relationship("Case", backref="checklist_statuses")
    updater = relationship("User")

    def __repr__(self):
        return f"<CaseChecklistStatus(case_id={self.case_id}, item_id={self.item_id}, status={self.status})>"


class InviteToken(Base):
    """
    Invite token model - user invitation tokens
    """
    __tablename__ = "invite_tokens"

    id = Column(String, primary_key=True, default=lambda: f"invite_{uuid.uuid4().hex[:12]}")
    email = Column(String, nullable=False, index=True)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.LAWYER)
    token = Column(String, unique=True, nullable=False, index=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self):
        return f"<InviteToken(id={self.id}, email={self.email}, token={self.token[:8]}...)>"


class PasswordResetToken(Base):
    """
    Password reset token model - for password recovery
    """
    __tablename__ = "password_reset_tokens"

    id = Column(String, primary_key=True, default=lambda: f"pwreset_{uuid.uuid4().hex[:12]}")
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self):
        return f"<PasswordResetToken(id={self.id}, user_id={self.user_id})>"


class AuditLog(Base):
    """
    Audit log model - tracks all user actions
    """
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: f"audit_{uuid.uuid4().hex[:12]}")
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # e.g., "VIEW_EVIDENCE", "CREATE_CASE", "EXPORT_DRAFT"
    object_id = Column(String, nullable=True)  # evidence_id or case_id
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self):
        return f"<AuditLog(id={self.id}, user_id={self.user_id}, action={self.action})>"


class DraftDocument(Base):
    """
    Draft document model - AI-generated legal document drafts
    Linked to a case, can be edited and exported
    """
    __tablename__ = "draft_documents"

    id = Column(String, primary_key=True, default=lambda: f"draft_{uuid.uuid4().hex[:12]}")
    case_id = Column(String, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    document_type = Column(SQLEnum(DocumentType), nullable=False, default=DocumentType.BRIEF)
    content = Column(JSON, nullable=False)  # Structured content with sections
    version = Column(Integer, nullable=False, default=1)
    status = Column(SQLEnum(DraftStatus), nullable=False, default=DraftStatus.DRAFT, index=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    case = relationship("Case", backref="draft_documents")
    creator = relationship("User", foreign_keys=[created_by])
    export_jobs = relationship("ExportJob", back_populates="draft", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<DraftDocument(id={self.id}, title={self.title}, status={self.status})>"


class ExportJob(Base):
    """
    Export job model - tracks document export operations
    Used for audit trail and async export handling
    """
    __tablename__ = "export_jobs"

    id = Column(String, primary_key=True, default=lambda: f"export_{uuid.uuid4().hex[:12]}")
    draft_id = Column(String, ForeignKey("draft_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    case_id = Column(String, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    format = Column(SQLEnum(ExportFormat), nullable=False)
    status = Column(SQLEnum(ExportJobStatus), nullable=False, default=ExportJobStatus.PENDING, index=True)
    file_key = Column(String(500), nullable=True)  # S3 key for generated file
    file_size = Column(Integer, nullable=True)  # File size in bytes
    page_count = Column(Integer, nullable=True)  # Number of pages
    error_message = Column(Text, nullable=True)  # Error details if failed
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)  # When S3 file expires

    # Relationships
    draft = relationship("DraftDocument", back_populates="export_jobs")
    case = relationship("Case", backref="export_jobs")
    user = relationship("User", foreign_keys=[user_id])

    def __repr__(self):
        return f"<ExportJob(id={self.id}, format={self.format}, status={self.status})>"


class DocumentTemplate(Base):
    """
    Document template model - pre-configured legal document formatting templates
    """
    __tablename__ = "document_templates"

    id = Column(String, primary_key=True, default=lambda: f"template_{uuid.uuid4().hex[:12]}")
    name = Column(String(100), unique=True, nullable=False)
    document_type = Column(SQLEnum(DocumentType), nullable=False)
    description = Column(Text, nullable=True)
    html_template = Column(Text, nullable=False)  # Jinja2 HTML template for PDF
    css_styles = Column(Text, nullable=False)  # CSS for PDF formatting
    docx_template_key = Column(String(500), nullable=True)  # S3 key for Word template
    margins = Column(JSON, nullable=False, default=lambda: {"top": 25, "bottom": 25, "left": 20, "right": 20, "unit": "mm"})
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self):
        return f"<DocumentTemplate(id={self.id}, name={self.name}, document_type={self.document_type})>"


class Message(Base):
    """
    Message model - real-time communication between users
    """
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=lambda: f"msg_{uuid.uuid4().hex[:12]}")
    case_id = Column(String, ForeignKey("cases.id"), nullable=False, index=True)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    recipient_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    content = Column(String, nullable=False)
    attachments = Column(String, nullable=True)  # JSON string of attachment URLs
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])

    def __repr__(self):
        return f"<Message(id={self.id}, sender_id={self.sender_id}, case_id={self.case_id})>"


class CalendarEvent(Base):
    """
    Calendar event model - for scheduling court dates, meetings, deadlines
    """
    __tablename__ = "calendar_events"

    id = Column(String, primary_key=True, default=lambda: f"event_{uuid.uuid4().hex[:12]}")
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    case_id = Column(String, ForeignKey("cases.id"), nullable=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    event_type = Column(SQLEnum(CalendarEventType), nullable=False, default=CalendarEventType.OTHER)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    location = Column(String, nullable=True)
    reminder_minutes = Column(String, default="30")  # Minutes before event
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User")
    case = relationship("Case")

    def __repr__(self):
        return f"<CalendarEvent(id={self.id}, title={self.title}, type={self.event_type})>"


class InvestigationRecord(Base):
    """
    Investigation record model - for detective field recordings
    GPS tracking, photos, memos, evidence collection
    """
    __tablename__ = "investigation_records"

    id = Column(String, primary_key=True, default=lambda: f"inv_{uuid.uuid4().hex[:12]}")
    case_id = Column(String, ForeignKey("cases.id"), nullable=False, index=True)
    detective_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    record_type = Column(SQLEnum(InvestigationRecordType), nullable=False)
    content = Column(String, nullable=True)  # Text content or description
    location_lat = Column(String, nullable=True)  # Latitude
    location_lng = Column(String, nullable=True)  # Longitude
    location_address = Column(String, nullable=True)
    attachments = Column(String, nullable=True)  # JSON string of file URLs
    recorded_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    case = relationship("Case")
    detective = relationship("User")

    def __repr__(self):
        return f"<InvestigationRecord(id={self.id}, type={self.record_type}, case_id={self.case_id})>"


class Invoice(Base):
    """
    Invoice model - billing and payment tracking
    """
    __tablename__ = "invoices"

    id = Column(String, primary_key=True, default=lambda: f"inv_{uuid.uuid4().hex[:12]}")
    case_id = Column(String, ForeignKey("cases.id"), nullable=False, index=True)
    client_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    lawyer_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(String, nullable=False)  # Amount in KRW (stored as string for precision)
    description = Column(String, nullable=True)
    status = Column(SQLEnum(InvoiceStatus), nullable=False, default=InvoiceStatus.PENDING)
    due_date = Column(DateTime(timezone=True), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    case = relationship("Case")
    client = relationship("User", foreign_keys=[client_id])
    lawyer = relationship("User", foreign_keys=[lawyer_id])

    def __repr__(self):
        return f"<Invoice(id={self.id}, amount={self.amount}, status={self.status})>"
class Evidence(Base):
    """
    Evidence model - uploaded evidence files for cases
    Metadata is stored here, actual files in S3, AI analysis results in DynamoDB/Qdrant
    """
    __tablename__ = "evidence"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("cases.id"), nullable=False, index=True)

    # File info
    file_name = Column(String, nullable=False)
    s3_key = Column(String, nullable=False)
    file_type = Column(String, nullable=True)  # MIME type
    file_size = Column(String, nullable=True)  # Size in bytes (stored as string for SQLite compatibility)
    description = Column(String, nullable=True)

    # Processing status
    status = Column(String, nullable=False, default="pending")  # pending, uploaded, processing, completed, failed

    # AI analysis results (stored as JSON strings for SQLite compatibility)
    ai_labels = Column(String, nullable=True)  # JSON array: ["폭언", "불륜", ...]
    ai_summary = Column(String, nullable=True)  # AI-generated summary
    ai_score = Column(String, nullable=True)  # Evidence strength score

    # Upload tracking
    uploaded_by = Column(String, ForeignKey("users.id"), nullable=True, index=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    case = relationship("Case", backref="evidence_items")
    uploader = relationship("User")

    @property
    def ai_labels_list(self) -> list:
        """Parse ai_labels JSON string to list"""
        import json
        if not self.ai_labels:
            return []
        try:
            return json.loads(self.ai_labels)
        except (json.JSONDecodeError, TypeError):
            return []

    def __repr__(self):
        return f"<Evidence(id={self.id}, file_name={self.file_name}, status={self.status})>"


class Job(Base):
    """
    Job model - tracks async processing tasks (OCR, STT, draft generation, etc.)
    """
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=lambda: f"job_{uuid.uuid4().hex[:12]}")
    case_id = Column(String, ForeignKey("cases.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    job_type = Column(SQLEnum(JobType), nullable=False)
    status = Column(SQLEnum(JobStatus), nullable=False, default=JobStatus.QUEUED)

    # Related resources
    evidence_id = Column(String, nullable=True, index=True)  # For evidence-related jobs

    # Job data (stored as JSON strings)
    input_data = Column(String, nullable=True)   # JSON: {s3_key, file_type, parameters, ...}
    output_data = Column(String, nullable=True)  # JSON: Result from AI processing
    error_details = Column(String, nullable=True)  # JSON: {error_code, message, traceback, ...}

    # Progress tracking
    progress = Column(String, default="0")  # 0-100 for long-running jobs

    # Retry tracking
    retry_count = Column(String, default="0")
    max_retries = Column(String, default="3")

    # AWS Lambda correlation
    lambda_request_id = Column(String, nullable=True)  # For CloudWatch logs correlation

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    case = relationship("Case")
    user = relationship("User")

    def __repr__(self):
        return f"<Job(id={self.id}, type={self.job_type}, status={self.status})>"


# ============================================
# US2: Asset Division (재산분할) Models
# ============================================
class AssetCategory(str, enum.Enum):
    """Asset category types for divorce property division"""
    REAL_ESTATE = "real_estate"     # 부동산
    SAVINGS = "savings"             # 예금/적금
    STOCKS = "stocks"               # 주식/증권
    RETIREMENT = "retirement"       # 퇴직금/연금
    VEHICLE = "vehicle"             # 차량
    INSURANCE = "insurance"         # 보험
    DEBT = "debt"                   # 부채
    OTHER = "other"                 # 기타


class AssetOwnership(str, enum.Enum):
    """Asset ownership types"""
    PLAINTIFF = "plaintiff"         # 원고 소유
    DEFENDANT = "defendant"         # 피고 소유
    JOINT = "joint"                 # 공동 소유
    THIRD_PARTY = "third_party"     # 제3자 명의


class AssetNature(str, enum.Enum):
    """Asset nature classification for Korean divorce law"""
    MARITAL = "marital"             # 공동재산 (혼인 중 취득)
    SEPARATE = "separate"           # 특유재산 (혼전, 상속, 증여)
    MIXED = "mixed"                 # 혼합재산


class Asset(Base):
    """
    Asset model for divorce property division
    재산분할을 위한 자산 모델 (민법 제839조의2)
    """
    __tablename__ = "assets"

    id = Column(String, primary_key=True, default=lambda: f"asset_{uuid.uuid4().hex[:12]}")
    case_id = Column(String, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)

    # Asset classification
    category = Column(SQLEnum(AssetCategory), nullable=False)
    ownership = Column(SQLEnum(AssetOwnership), nullable=False)
    nature = Column(SQLEnum(AssetNature), nullable=False, default=AssetNature.MARITAL)

    # Asset details
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    # Valuation
    acquisition_date = Column(DateTime(timezone=True), nullable=True)
    acquisition_value = Column(Integer, nullable=True)  # 취득가액 (KRW)
    current_value = Column(Integer, nullable=False)     # 현재가액 (KRW)
    valuation_date = Column(DateTime(timezone=True), nullable=True)
    valuation_source = Column(String(200), nullable=True)  # 감정기관, KB시세 등

    # Division proposal
    division_ratio_plaintiff = Column(Integer, nullable=True, default=50)
    division_ratio_defendant = Column(Integer, nullable=True, default=50)
    proposed_allocation = Column(SQLEnum(AssetOwnership), nullable=True)

    # Evidence linkage
    evidence_id = Column(String(100), nullable=True)  # Link to supporting evidence

    # Notes
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)

    # Relationships
    case = relationship("Case", backref="assets")
    creator = relationship("User", foreign_keys=[created_by])

    def __repr__(self):
        return f"<Asset(id={self.id}, name={self.name}, value={self.current_value})>"


class AssetDivisionSummary(Base):
    """
    Asset Division Summary - stores calculated division results
    재산분할 정산 결과 저장
    """
    __tablename__ = "asset_division_summaries"

    id = Column(String, primary_key=True, default=lambda: f"div_{uuid.uuid4().hex[:12]}")
    case_id = Column(String, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)

    # Calculation results
    total_marital_assets = Column(Integer, nullable=False, default=0)
    total_separate_plaintiff = Column(Integer, nullable=False, default=0)
    total_separate_defendant = Column(Integer, nullable=False, default=0)
    total_debts = Column(Integer, nullable=False, default=0)
    net_marital_value = Column(Integer, nullable=False, default=0)

    # Division calculation
    plaintiff_share = Column(Integer, nullable=False, default=0)
    defendant_share = Column(Integer, nullable=False, default=0)
    settlement_amount = Column(Integer, nullable=False, default=0)  # 정산금

    # Ratios used
    plaintiff_ratio = Column(Integer, nullable=False, default=50)
    defendant_ratio = Column(Integer, nullable=False, default=50)

    # Current holdings
    plaintiff_holdings = Column(Integer, nullable=False, default=0)
    defendant_holdings = Column(Integer, nullable=False, default=0)

    # Notes
    notes = Column(Text, nullable=True)

    # Timestamps
    calculated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    calculated_by = Column(String, ForeignKey("users.id"), nullable=True)

    # Relationships
    case = relationship("Case", backref="division_summaries")
    calculator = relationship("User", foreign_keys=[calculated_by])

    def __repr__(self):
        return f"<AssetDivisionSummary(id={self.id}, settlement={self.settlement_amount})>"


# ============================================
# US3: Procedure Stage (절차 단계) Models
# ============================================
class ProcedureStageType(str, enum.Enum):
    """Korean family litigation procedure stages"""
    FILED = "filed"                       # 소장 접수
    SERVED = "served"                     # 송달
    ANSWERED = "answered"                 # 답변서
    MEDIATION = "mediation"               # 조정 회부
    MEDIATION_CLOSED = "mediation_closed" # 조정 종결
    TRIAL = "trial"                       # 본안 이행
    JUDGMENT = "judgment"                 # 판결 선고
    APPEAL = "appeal"                     # 항소심
    FINAL = "final"                       # 확정


class StageStatus(str, enum.Enum):
    """Procedure stage status"""
    PENDING = "pending"           # 대기
    IN_PROGRESS = "in_progress"   # 진행중
    COMPLETED = "completed"       # 완료
    SKIPPED = "skipped"           # 건너뜀


class ProcedureStageRecord(Base):
    """
    Procedure Stage Record - tracks case procedure progress
    절차 단계 기록 (한국 가사소송법 기반)
    """
    __tablename__ = "procedure_stages"

    id = Column(String, primary_key=True, default=lambda: f"stage_{uuid.uuid4().hex[:12]}")
    case_id = Column(String, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)

    # Stage information
    stage = Column(SQLEnum(ProcedureStageType), nullable=False)
    status = Column(SQLEnum(StageStatus), nullable=False, default=StageStatus.PENDING)

    # Dates
    scheduled_date = Column(DateTime(timezone=True), nullable=True)  # 예정일
    completed_date = Column(DateTime(timezone=True), nullable=True)  # 완료일

    # Court information
    court_reference = Column(String(100), nullable=True)  # 법원 사건번호
    judge_name = Column(String(50), nullable=True)        # 담당 판사
    court_room = Column(String(50), nullable=True)        # 법정

    # Notes and documents
    notes = Column(Text, nullable=True)
    documents = Column(JSON, nullable=True, default=list)  # [{name, s3_key, uploaded_at}]

    # Outcome (for mediation, judgment)
    outcome = Column(String(100), nullable=True)  # 조정성립/불성립, 인용/기각 등

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)

    # Unique constraint: one stage per case
    __table_args__ = (
        UniqueConstraint('case_id', 'stage', name='uq_case_stage'),
    )

    # Relationships
    case = relationship("Case", backref=backref("procedure_stages", passive_deletes=True))
    creator = relationship("User", foreign_keys=[created_by])

    def __repr__(self):
        return f"<ProcedureStageRecord(id={self.id}, stage={self.stage}, status={self.status})>"
