"""
Vector Store CRUD Module
기본 CRUD 작업 (add, search, get, delete, count, clear)
"""

import uuid
import logging
from typing import List, Dict, Optional, Any

from qdrant_client.http import models
from qdrant_client.http.models import (
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)

from .client import VectorStoreClient

logger = logging.getLogger(__name__)


class VectorStoreCRUD(VectorStoreClient):
    """
    벡터 저장소 CRUD 작업

    VectorStoreClient를 상속받아 기본 CRUD 작업을 제공합니다.
    """

    def add_evidence(
        self,
        text: str,
        embedding: List[float],
        metadata: Dict[str, Any],
        collection_name: str = None
    ) -> str:
        """
        단일 증거 추가

        Args:
            text: 증거 텍스트
            embedding: 벡터 임베딩
            metadata: 메타데이터 (chunk_id, file_id, case_id 등)
            collection_name: 컬렉션명 (선택)

        Returns:
            str: 생성된 벡터 ID
        """
        collection = self._ensure_collection(collection_name)
        vector_id = str(uuid.uuid4())

        payload = {**metadata, "document": text}

        try:
            self.client.upsert(
                collection_name=collection,
                points=[
                    PointStruct(
                        id=vector_id,
                        vector=embedding,
                        payload=payload
                    )
                ]
            )
            return vector_id

        except Exception as e:
            logger.error(f"Failed to add evidence: {e}")
            raise

    def add_evidences(
        self,
        texts: List[str],
        embeddings: List[List[float]],
        metadatas: List[Dict[str, Any]],
        collection_name: Optional[str] = None
    ) -> List[str]:
        """
        여러 증거 일괄 추가

        Args:
            texts: 증거 텍스트 리스트
            embeddings: 벡터 임베딩 리스트
            metadatas: 메타데이터 리스트
            collection_name: 컬렉션명 (선택)

        Returns:
            List[str]: 생성된 벡터 ID 리스트

        Raises:
            ValueError: 입력 리스트 길이가 일치하지 않는 경우
        """
        if not (len(texts) == len(embeddings) == len(metadatas)):
            raise ValueError(
                f"Input lists must have the same length: "
                f"texts={len(texts)}, embeddings={len(embeddings)}, metadatas={len(metadatas)}"
            )

        collection = self._ensure_collection(collection_name)
        vector_ids = [str(uuid.uuid4()) for _ in texts]

        points = []
        for i, (text, embedding, metadata) in enumerate(zip(texts, embeddings, metadatas)):
            payload = {**metadata, "document": text}
            points.append(
                PointStruct(
                    id=vector_ids[i],
                    vector=embedding,
                    payload=payload
                )
            )

        try:
            self.client.upsert(
                collection_name=collection,
                points=points
            )
            return vector_ids

        except Exception as e:
            logger.error(f"Failed to add evidences: {e}")
            raise

    def search(
        self,
        query_embedding: List[float],
        n_results: int = 10,
        where: Optional[Dict[str, Any]] = None,
        collection_name: str = None
    ) -> List[Dict[str, Any]]:
        """
        벡터 유사도 검색

        Args:
            query_embedding: 쿼리 임베딩
            n_results: 반환할 결과 개수
            where: 메타데이터 필터 (예: {"case_id": "xxx"})
            collection_name: 컬렉션명 (선택)

        Returns:
            List[Dict]: 검색 결과
        """
        collection = self._ensure_collection(collection_name)

        query_filter = None
        if where:
            conditions = []
            for key, value in where.items():
                conditions.append(
                    FieldCondition(
                        key=key,
                        match=MatchValue(value=value)
                    )
                )
            query_filter = Filter(must=conditions)

        try:
            results = self.client.search(
                collection_name=collection,
                query_vector=query_embedding,
                limit=n_results,
                query_filter=query_filter,
                with_payload=True
            )

            formatted_results = []
            for hit in results:
                payload = hit.payload or {}
                document = payload.pop("document", "")
                formatted_results.append({
                    "id": str(hit.id),
                    "distance": 1 - hit.score,
                    "metadata": payload,
                    "document": document
                })

            return formatted_results

        except Exception as e:
            logger.error(f"Search failed: {e}")
            raise

    def get_by_id(
        self,
        vector_id: str,
        collection_name: str = None
    ) -> Optional[Dict[str, Any]]:
        """
        ID로 벡터 조회

        Args:
            vector_id: 벡터 ID
            collection_name: 컬렉션명 (선택)

        Returns:
            Dict: 벡터 정보 (metadata, document)
        """
        collection = self._ensure_collection(collection_name)

        try:
            results = self.client.retrieve(
                collection_name=collection,
                ids=[vector_id],
                with_payload=True
            )

            if results:
                payload = results[0].payload or {}
                document = payload.pop("document", "")
                return {
                    "id": str(results[0].id),
                    "metadata": payload,
                    "document": document
                }

            return None

        except Exception as e:
            logger.error(f"Get by ID failed: {e}")
            return None

    def delete_by_id(
        self,
        vector_id: str,
        collection_name: str = None
    ) -> None:
        """
        ID로 벡터 삭제

        Args:
            vector_id: 삭제할 벡터 ID
            collection_name: 컬렉션명 (선택)
        """
        collection = self._ensure_collection(collection_name)

        try:
            self.client.delete(
                collection_name=collection,
                points_selector=models.PointIdsList(
                    points=[vector_id]
                )
            )

        except Exception as e:
            logger.error(f"Delete failed: {e}")
            raise

    def count(self, collection_name: str = None) -> int:
        """
        컬렉션 내 벡터 개수 반환

        Args:
            collection_name: 컬렉션명 (선택)

        Returns:
            int: 벡터 개수
        """
        collection = self._ensure_collection(collection_name)

        try:
            info = self.client.get_collection(collection_name=collection)
            return info.points_count

        except Exception as e:
            logger.error(f"Count failed: {e}")
            return 0

    def clear(self, collection_name: str = None) -> None:
        """
        컬렉션 전체 삭제 (모든 벡터 제거)

        Args:
            collection_name: 컬렉션명 (선택)
        """
        collection = self._ensure_collection(collection_name)

        try:
            self.client.delete_collection(collection_name=collection)
            self._initialized_collections.discard(collection)
            self._ensure_collection(collection)

        except Exception as e:
            logger.error(f"Clear failed: {e}")
            raise
