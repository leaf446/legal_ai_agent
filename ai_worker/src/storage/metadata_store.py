"""
Metadata Store Module - Backwards Compatibility Wrapper

이 파일은 하위 호환성을 위해 유지됩니다.
새 코드에서는 아래와 같이 import하세요:

    from ai_worker.src.storage.metadata_store import MetadataStore

모듈이 분리되었습니다:
- metadata_store/client.py: DynamoDB 클라이언트 및 직렬화
- metadata_store/file_operations.py: 파일 CRUD
- metadata_store/chunk_operations.py: 청크 CRUD
- metadata_store/case_management.py: 케이스 관리 및 통계
"""

# Re-export from new module structure
from .metadata_store import MetadataStore

__all__ = ["MetadataStore"]
