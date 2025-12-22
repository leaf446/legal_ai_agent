"""
Vector Store Search Module
하이브리드 검색 및 청크 메타데이터 저장
"""

import logging
from typing import List

from qdrant_client.http.models import PointStruct

from .case_isolation import VectorStoreCaseIsolation

logger = logging.getLogger(__name__)


class VectorStoreSearch(VectorStoreCaseIsolation):
    """
    하이브리드 검색 기능

    VectorStoreCaseIsolation을 상속받아 고급 검색 기능을 제공합니다.
    """

    def add_chunk_with_metadata(
        self,
        chunk_id: str,
        file_id: str,
        case_id: str,
        content: str,
        embedding: List[float],
        timestamp: str,
        sender: str,
        score: float = None,
        collection_name: str = None
    ) -> str:
        """
        청크 메타데이터와 함께 벡터 저장

        이 메서드는 MetadataStore의 chunk 저장을 대체합니다.
        벡터와 메타데이터를 Qdrant payload에 함께 저장합니다.

        Args:
            chunk_id: 청크 ID
            file_id: 파일 ID
            case_id: 케이스 ID
            content: 청크 내용
            embedding: 벡터 임베딩
            timestamp: 타임스탬프 (ISO format)
            sender: 발신자
            score: 증거 점수 (선택)
            collection_name: 컬렉션명 (선택)

        Returns:
            str: 벡터 ID (chunk_id와 동일하게 사용)
        """
        collection = self._ensure_collection(collection_name)

        payload = {
            "chunk_id": chunk_id,
            "file_id": file_id,
            "case_id": case_id,
            "document": content,
            "timestamp": timestamp,
            "sender": sender,
        }
        if score is not None:
            payload["score"] = score

        try:
            self.client.upsert(
                collection_name=collection,
                points=[
                    PointStruct(
                        id=chunk_id,
                        vector=embedding,
                        payload=payload
                    )
                ]
            )
            return chunk_id

        except Exception as e:
            logger.error(f"Failed to add chunk with metadata: {e}")
            raise
