"""
Processing Result Schema

Defines the result structure for AI Worker pipeline processing.
Supports multiple status types including partial_failure for robust error handling.
"""

from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class ProcessingStatus(str, Enum):
    """
    처리 상태 (FR-013)

    - PROCESSING: 처리 중
    - COMPLETED: 완료
    - FAILED: 실패
    - PARTIAL_FAILURE: 부분 실패 (FR-012) - Qdrant 저장 실패 등
    """
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL_FAILURE = "partial_failure"


class ProcessingResult(BaseModel):
    """
    파이프라인 처리 결과 (FR-011)

    Attributes:
        status: 처리 상태
        evidence_id: Backend evidence ID
        case_id: 케이스 ID
        ai_summary: AI 생성 요약
        labels: 감지된 라벨 (840조 태그)
        evidence_score: 증거 점수
        qdrant_id: Qdrant 벡터 ID
        chunks_indexed: 인덱싱된 청크 수
        file_hash: 파일 해시
        processed_at: 처리 완료 시간
        error_message: 에러 메시지 (실패 시)
        failed_stage: 실패 단계
        partial_data: 부분 성공 데이터 (FR-012)
    """
    status: ProcessingStatus
    evidence_id: str
    case_id: str

    # AI 분석 결과 (FR-011)
    ai_summary: Optional[str] = None
    labels: List[str] = Field(default_factory=list)
    evidence_score: Optional[float] = None
    qdrant_id: Optional[str] = None

    # 처리 메타데이터
    chunks_indexed: int = 0
    file_hash: Optional[str] = None
    processed_at: Optional[datetime] = None

    # 에러 정보 (partial_failure용)
    error_message: Optional[str] = None
    failed_stage: Optional[str] = None  # "qdrant" | "analysis" | "parse"

    # 부분 성공 데이터 (FR-012)
    partial_data: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        use_enum_values = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

    def is_success(self) -> bool:
        """완전 성공 여부"""
        return self.status == ProcessingStatus.COMPLETED

    def is_partial_success(self) -> bool:
        """부분 성공 여부 (일부 데이터는 저장됨)"""
        return self.status == ProcessingStatus.PARTIAL_FAILURE

    def has_qdrant_data(self) -> bool:
        """Qdrant에 데이터가 저장되었는지"""
        return self.qdrant_id is not None
