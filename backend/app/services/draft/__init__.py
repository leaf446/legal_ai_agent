"""
Draft Service Module

RAG 기반 초안 생성 서비스

Usage:
    from app.services.draft import DraftService

    service = DraftService(db)
    response = service.generate_draft_preview(case_id, request, user_id)

모듈 구조:
- generator.py: RAG 기반 초안 생성
- exporter.py: DOCX/PDF 내보내기
- formatter.py: 프롬프트 포매팅 및 인용 추출
"""

from .generator import DraftGenerator

# Backwards compatibility: DraftService is an alias for DraftGenerator
DraftService = DraftGenerator

__all__ = [
    "DraftService",
    "DraftGenerator",
]
