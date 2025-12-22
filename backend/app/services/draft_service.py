"""
Draft Service - Backwards Compatibility Wrapper

이 파일은 하위 호환성을 위해 유지됩니다.
새 코드에서는 아래와 같이 import하세요:

    from app.services.draft import DraftService

모듈이 분리되었습니다:
- draft/generator.py: RAG 기반 초안 생성
- draft/exporter.py: DOCX/PDF 내보내기
- draft/formatter.py: 프롬프트 포매팅 및 인용 추출
"""

# Re-export from new module structure
from .draft import DraftService

# Re-export utils for backward compatibility with tests
from app.utils.dynamo import get_evidence_by_case
from app.utils.qdrant import search_evidence_by_semantic
from app.utils.openai_client import generate_chat_completion
from app.services.draft.exporter import DOCX_AVAILABLE

# Re-export Document class for backward compatibility
try:
    from docx import Document
except ImportError:
    Document = None

__all__ = [
    "DraftService",
    "get_evidence_by_case",
    "search_evidence_by_semantic",
    "generate_chat_completion",
    "DOCX_AVAILABLE",
    "Document",
]
