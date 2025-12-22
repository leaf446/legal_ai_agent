"""
Metadata Store Module

DynamoDB 메타데이터 저장소 구현

Usage:
    from ai_worker.src.storage.metadata_store import MetadataStore

    store = MetadataStore(
        table_name="leh_evidence",
        region="ap-northeast-2"
    )

    # Save file metadata
    store.save_file(evidence_file)

    # Get files by case
    files = store.get_files_by_case(case_id)

    # Case management
    store.delete_case(case_id)
"""

from .case_management import MetadataStoreCaseManagement

# Backwards compatibility: MetadataStore is the full-featured class
MetadataStore = MetadataStoreCaseManagement

__all__ = [
    "MetadataStore",
    "MetadataStoreCaseManagement",
]
