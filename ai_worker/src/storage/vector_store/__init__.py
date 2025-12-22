"""
Vector Store Module

Qdrant 벡터 저장소 구현

Usage:
    from ai_worker.src.storage.vector_store import VectorStore

    store = VectorStore(
        url="https://xxx.qdrant.io",
        api_key="your-api-key"
    )

    # Add evidence
    store.add_evidence(text, embedding, metadata)

    # Search
    results = store.search(query_embedding, n_results=10)

    # Case isolation
    store.delete_by_case(case_id)
"""

from qdrant_client import QdrantClient
from .search import VectorStoreSearch

# Backwards compatibility: VectorStore is the full-featured class
VectorStore = VectorStoreSearch

__all__ = [
    "VectorStore",
    "VectorStoreSearch",
    "QdrantClient",
]
