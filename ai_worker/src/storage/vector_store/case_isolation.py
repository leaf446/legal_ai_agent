"""
Vector Store Case Isolation Module
케이스별 격리 작업 (count_by_case, delete_by_case, verify_isolation)
"""

import logging
from typing import List, Dict, Any

from qdrant_client.http import models
from qdrant_client.http.models import (
    Filter,
    FieldCondition,
    MatchValue,
)

from .crud import VectorStoreCRUD

logger = logging.getLogger(__name__)


class VectorStoreCaseIsolation(VectorStoreCRUD):
    """
    케이스별 격리 작업

    VectorStoreCRUD를 상속받아 케이스 격리 기능을 제공합니다.
    """

    def count_by_case(
        self,
        case_id: str,
        collection_name: str = None
    ) -> int:
        """
        케이스별 벡터 개수 반환

        Args:
            case_id: 케이스 ID
            collection_name: 컬렉션명 (선택)

        Returns:
            int: 해당 케이스의 벡터 개수
        """
        collection = self._ensure_collection(collection_name)

        try:
            result = self.client.count(
                collection_name=collection,
                count_filter=Filter(
                    must=[
                        FieldCondition(
                            key="case_id",
                            match=MatchValue(value=case_id)
                        )
                    ]
                )
            )
            return result.count

        except Exception as e:
            logger.error(f"Count by case failed: {e}")
            return 0

    def delete_by_case(
        self,
        case_id: str,
        collection_name: str = None
    ) -> int:
        """
        케이스별 벡터 삭제

        Args:
            case_id: 삭제할 케이스 ID
            collection_name: 컬렉션명 (선택)

        Returns:
            int: 삭제된 벡터 개수
        """
        collection = self._ensure_collection(collection_name)

        try:
            count = self.count_by_case(case_id, collection)

            if count > 0:
                self.client.delete(
                    collection_name=collection,
                    points_selector=models.FilterSelector(
                        filter=Filter(
                            must=[
                                FieldCondition(
                                    key="case_id",
                                    match=MatchValue(value=case_id)
                                )
                            ]
                        )
                    )
                )

            return count

        except Exception as e:
            logger.error(f"Delete by case failed: {e}")
            return 0

    def delete_case_collection(self, case_id: str) -> bool:
        """
        케이스 전용 컬렉션 삭제

        Args:
            case_id: 케이스 ID

        Returns:
            bool: 삭제 성공 여부
        """
        collection_name = f"leh_{case_id}"

        try:
            self.client.delete_collection(collection_name=collection_name)
            self._initialized_collections.discard(collection_name)
            return True

        except Exception as e:
            logger.warning(f"Delete case collection failed: {e}")
            return False

    def verify_case_isolation(
        self,
        case_id: str,
        collection_name: str = None
    ) -> bool:
        """
        케이스 격리 검증

        Args:
            case_id: 검증할 케이스 ID
            collection_name: 컬렉션명 (선택)

        Returns:
            bool: 격리되어 있으면 True
        """
        collection = self._ensure_collection(collection_name)

        try:
            results, _ = self.client.scroll(
                collection_name=collection,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(
                            key="case_id",
                            match=MatchValue(value=case_id)
                        )
                    ]
                ),
                limit=100,
                with_payload=True
            )

            if not results:
                return True

            for point in results:
                if point.payload and point.payload.get("case_id") != case_id:
                    return False

            return True

        except Exception as e:
            logger.error(f"Verify case isolation failed: {e}")
            return False

    def get_chunks_by_case(
        self,
        case_id: str,
        collection_name: str = None
    ) -> List[Dict[str, Any]]:
        """
        케이스의 모든 청크 조회 (메타데이터 포함)

        Args:
            case_id: 케이스 ID
            collection_name: 컬렉션명 (선택)

        Returns:
            List[Dict]: 청크 정보 리스트
        """
        collection = self._ensure_collection(collection_name)

        try:
            results = []
            offset = None

            while True:
                points, offset = self.client.scroll(
                    collection_name=collection,
                    scroll_filter=Filter(
                        must=[
                            FieldCondition(
                                key="case_id",
                                match=MatchValue(value=case_id)
                            )
                        ]
                    ),
                    limit=100,
                    offset=offset,
                    with_payload=True
                )

                for point in points:
                    payload = point.payload or {}
                    document = payload.pop("document", "")
                    results.append({
                        "id": str(point.id),
                        "document": document,
                        **payload
                    })

                if offset is None:
                    break

            return results

        except Exception as e:
            logger.error(f"Get chunks by case failed: {e}")
            return []
