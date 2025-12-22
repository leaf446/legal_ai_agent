"""
Vector Store Module - Backwards Compatibility Wrapper

이 파일은 하위 호환성을 위해 유지됩니다.
새 코드에서는 아래와 같이 import하세요:

    from ai_worker.src.storage.vector_store import VectorStore

모듈이 분리되었습니다:
- vector_store/client.py: 클라이언트 초기화 및 컬렉션 관리
- vector_store/crud.py: CRUD 기본 작업
- vector_store/case_isolation.py: 케이스별 격리 작업
- vector_store/search.py: 하이브리드 검색
"""

# Re-export from new module structure
from .vector_store import VectorStore

__all__ = ["VectorStore"]
