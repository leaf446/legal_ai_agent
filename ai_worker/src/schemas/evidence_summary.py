"""
Evidence Summary Schema

Defines summary structures for legal evidence analysis,
including Article 840 relevance and source references.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class Article840Relevance(BaseModel):
    """
    민법 840조 관련성 (FR-008)

    민법 840조 이혼 사유:
    1호: 배우자의 부정한 행위 (adultery)
    2호: 배우자의 악의의 유기 (desertion)
    3호: 배우자 또는 그 직계존속으로부터의 심히 부당한 대우 (abuse)
    4호: 자기의 직계존속에 대한 배우자의 심히 부당한 대우 (in_law_abuse)
    5호: 배우자의 생사가 3년 이상 분명하지 아니한 때 (missing)
    6호: 기타 혼인을 계속하기 어려운 중대한 사유 (other)
    """
    categories: List[str] = Field(
        default_factory=list,
        description="관련 840조 항목 (adultery, desertion, abuse, etc.)"
    )
    confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="관련성 신뢰도 (0-1)"
    )
    matched_keywords: List[str] = Field(
        default_factory=list,
        description="매칭된 키워드"
    )
    relevance_explanation: Optional[str] = Field(
        None,
        description="관련성 설명 (LLM 생성)"
    )

    def has_relevance(self) -> bool:
        """법적 관련성 존재 여부"""
        return len(self.categories) > 0

    def to_dict(self) -> Dict[str, Any]:
        """딕셔너리 변환"""
        return {
            "categories": self.categories,
            "confidence": self.confidence,
            "matched_keywords": self.matched_keywords,
            "relevance_explanation": self.relevance_explanation
        }


class SourceReference(BaseModel):
    """
    소스 참조 ID (FR-009)

    증거 요약에서 원본 위치를 추적하기 위한 참조 정보
    """
    chunk_id: str = Field(..., description="청크 ID")
    file_id: str = Field(..., description="파일 ID")
    line_number: Optional[int] = Field(None, description="라인 번호")
    page_number: Optional[int] = Field(None, description="페이지 번호")
    timestamp: Optional[str] = Field(None, description="타임스탬프")
    content_preview: str = Field(
        ...,
        max_length=200,
        description="내용 미리보기 (200자 제한)"
    )

    def to_citation(self) -> str:
        """인용 형식으로 변환"""
        location = ""
        if self.line_number:
            location = f"Line {self.line_number}"
        elif self.page_number:
            location = f"Page {self.page_number}"
        elif self.timestamp:
            location = f"@ {self.timestamp}"

        preview = self.content_preview[:50] + "..." if len(self.content_preview) > 50 else self.content_preview
        return f"[{self.chunk_id}] {location}: \"{preview}\""


class EvidenceSummary(BaseModel):
    """
    증거 요약 데이터 (FR-008, FR-009)

    Spec 기준:
    - summary_text: 요약문
    - key_facts: 핵심 사실
    - article_840_relevance: 840조 관련성
    - source_refs: 소스 참조
    """
    summary_text: str = Field(
        ...,
        description="요약문 (3문장 이내)"
    )
    key_facts: List[str] = Field(
        default_factory=list,
        description="핵심 사실 리스트"
    )
    article_840_relevance: Article840Relevance = Field(
        default_factory=Article840Relevance,
        description="840조 관련성 분석"
    )
    source_refs: List[SourceReference] = Field(
        default_factory=list,
        description="소스 참조 ID 리스트"
    )
    word_count: int = Field(default=0, description="단어 수")

    @property
    def has_legal_relevance(self) -> bool:
        """법적 관련성이 있는지 확인"""
        return self.article_840_relevance.has_relevance()

    def get_categories(self) -> List[str]:
        """840조 카테고리 리스트 반환"""
        return self.article_840_relevance.categories

    def to_dict(self) -> Dict[str, Any]:
        """딕셔너리 변환 (DynamoDB 저장용)"""
        return {
            "summary_text": self.summary_text,
            "key_facts": self.key_facts,
            "article_840_relevance": self.article_840_relevance.to_dict(),
            "source_refs": [ref.model_dump() for ref in self.source_refs],
            "word_count": self.word_count
        }
