"""
Vector Store Client Module
Qdrant 클라이언트 초기화 및 컬렉션 관리
"""

import os
import logging
from typing import Set

from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import (
    Distance,
    VectorParams,
)

logger = logging.getLogger(__name__)


class VectorStoreClient:
    """
    Qdrant 클라이언트 기본 클래스

    컬렉션 생성 및 관리를 담당합니다.
    """

    def __init__(
        self,
        url: str = None,
        api_key: str = None,
        collection_name: str = "leh_evidence",
        vector_size: int = None,
        persist_directory: str = None  # Deprecated
    ):
        """
        VectorStoreClient 초기화

        Args:
            url: Qdrant Cloud URL (기본값: 환경변수 QDRANT_URL)
            api_key: Qdrant API Key (기본값: 환경변수 QDRANT_API_KEY)
            collection_name: 기본 컬렉션명
            vector_size: 벡터 차원 (기본값: 환경변수 VECTOR_SIZE 또는 1536)
            persist_directory: Deprecated - ignored
        """
        if persist_directory:
            logger.warning(
                "persist_directory is deprecated and ignored. "
                "VectorStore now uses Qdrant Cloud."
            )
        self.persist_directory = persist_directory

        self.url = url or os.environ.get('QDRANT_URL')
        self.api_key = api_key or os.environ.get('QDRANT_API_KEY')
        self.collection_name = collection_name
        self.vector_size = vector_size or int(os.environ.get('VECTOR_SIZE', '1536'))

        if not self.url:
            raise ValueError("QDRANT_URL is required")

        self._client = None
        self._initialized_collections: Set[str] = set()

    @property
    def client(self) -> QdrantClient:
        """Lazy initialization of Qdrant client"""
        if self._client is None:
            self._client = QdrantClient(
                url=self.url,
                api_key=self.api_key,
                timeout=30
            )
        return self._client

    def _ensure_collection(self, collection_name: str = None) -> str:
        """
        컬렉션 존재 확인 및 생성

        Args:
            collection_name: 컬렉션명 (None이면 기본 컬렉션)

        Returns:
            str: 사용할 컬렉션명
        """
        name = collection_name or self.collection_name

        if name in self._initialized_collections:
            return name

        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == name for c in collections)

            if not exists:
                self.client.create_collection(
                    collection_name=name,
                    vectors_config=VectorParams(
                        size=self.vector_size,
                        distance=Distance.COSINE
                    )
                )
                logger.info(f"Created Qdrant collection: {name}")
                self._create_payload_indexes(name)

            self._initialized_collections.add(name)
            return name

        except Exception as e:
            logger.error(f"Failed to ensure collection {name}: {e}")
            raise

    def _create_payload_indexes(self, collection_name: str) -> None:
        """
        필터링용 payload 인덱스 생성

        Args:
            collection_name: 컬렉션명
        """
        index_fields = ["case_id", "file_id", "chunk_id", "sender"]

        for field in index_fields:
            try:
                self.client.create_payload_index(
                    collection_name=collection_name,
                    field_name=field,
                    field_schema=models.PayloadSchemaType.KEYWORD
                )
                logger.info(f"Created index for {field} in {collection_name}")
            except Exception as e:
                logger.debug(f"Index creation skipped for {field}: {e}")

    def get_or_create_case_collection(self, case_id: str) -> str:
        """
        케이스별 컬렉션 생성/조회

        Args:
            case_id: 케이스 ID

        Returns:
            str: 컬렉션명 (leh_{case_id})
        """
        collection_name = f"leh_{case_id}"
        return self._ensure_collection(collection_name)
