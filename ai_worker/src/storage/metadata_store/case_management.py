"""
Metadata Store Case Management Module
케이스 관리 및 통계
"""

import logging
from typing import List, Dict, Any

from botocore.exceptions import ClientError

from .chunk_operations import MetadataStoreChunkOperations

logger = logging.getLogger(__name__)


class MetadataStoreCaseManagement(MetadataStoreChunkOperations):
    """
    케이스 관리 및 통계 작업

    MetadataStoreChunkOperations를 상속받아 케이스 관리 기능을 제공합니다.
    """

    # ========== Statistics & Aggregation ==========

    def count_files_by_case(self, case_id: str) -> int:
        """케이스별 파일 개수"""
        try:
            response = self.client.query(
                TableName=self.table_name,
                IndexName='case_id-index',
                KeyConditionExpression='case_id = :case_id',
                FilterExpression='record_type = :record_type',
                ExpressionAttributeValues={
                    ':case_id': {'S': case_id},
                    ':record_type': {'S': 'file'}
                },
                Select='COUNT'
            )
            return response.get('Count', 0)
        except ClientError as e:
            logger.error(f"DynamoDB count error for case {case_id}: {e}")
            return 0

    def count_chunks_by_case(self, case_id: str) -> int:
        """케이스별 청크 개수"""
        try:
            response = self.client.query(
                TableName=self.table_name,
                IndexName='case_id-index',
                KeyConditionExpression='case_id = :case_id',
                FilterExpression='record_type = :record_type',
                ExpressionAttributeValues={
                    ':case_id': {'S': case_id},
                    ':record_type': {'S': 'chunk'}
                },
                Select='COUNT'
            )
            return response.get('Count', 0)
        except ClientError as e:
            logger.error(f"DynamoDB count error for case {case_id}: {e}")
            return 0

    def get_case_summary(self, case_id: str) -> Dict[str, Any]:
        """케이스 요약 정보"""
        return {
            "case_id": case_id,
            "file_count": self.count_files_by_case(case_id),
            "chunk_count": self.count_chunks_by_case(case_id)
        }

    def get_case_stats(self, case_id: str) -> Dict[str, Any]:
        """케이스 통계 정보 (get_case_summary 별칭)"""
        return self.get_case_summary(case_id)

    # ========== Case Management ==========

    def list_cases(self) -> List[str]:
        """
        전체 케이스 ID 목록 조회

        Returns:
            케이스 ID 리스트 (중복 제거)
        """
        try:
            response = self.client.scan(
                TableName=self.table_name,
                ProjectionExpression='case_id',
                FilterExpression='record_type = :record_type',
                ExpressionAttributeValues={':record_type': {'S': 'file'}}
            )

            case_ids = set()
            for item in response.get('Items', []):
                if 'case_id' in item:
                    case_ids.add(item['case_id']['S'])

            return sorted(list(case_ids))

        except ClientError as e:
            logger.error(f"DynamoDB scan error for list_cases: {e}")
            return []

    def list_cases_with_stats(self) -> List[Dict[str, Any]]:
        """전체 케이스 ID 목록과 통계 조회"""
        cases = self.list_cases()
        return [self.get_case_stats(case_id) for case_id in cases]

    def delete_case(self, case_id: str) -> None:
        """
        케이스 메타데이터 완전 삭제

        Args:
            case_id: 삭제할 케이스 ID

        Note:
            - 해당 케이스의 모든 파일 및 청크 메타데이터 삭제
            - 벡터는 삭제하지 않음 (delete_case_complete 사용)
        """
        try:
            response = self.client.query(
                TableName=self.table_name,
                IndexName='case_id-index',
                KeyConditionExpression='case_id = :case_id',
                ExpressionAttributeValues={':case_id': {'S': case_id}},
                ProjectionExpression='evidence_id'
            )

            for item in response.get('Items', []):
                evidence_id = item['evidence_id']['S']
                self.client.delete_item(
                    TableName=self.table_name,
                    Key={'evidence_id': {'S': evidence_id}}
                )

            logger.info(f"Deleted all metadata for case: {case_id}")

        except ClientError as e:
            logger.error(f"DynamoDB delete_case error for case {case_id}: {e}")
            raise

    def delete_case_complete(self, case_id: str, vector_store) -> None:
        """
        케이스 완전 삭제 (메타데이터 + 벡터)

        Args:
            case_id: 삭제할 케이스 ID
            vector_store: VectorStore 인스턴스 (벡터 삭제용)
        """
        # 1. Get chunk vector_ids before deleting metadata
        chunks = self.get_chunks_by_case(case_id)
        vector_ids = [chunk.vector_id for chunk in chunks if chunk.vector_id]

        # 2. Delete vectors from VectorStore
        failed_deletions = []
        for vector_id in vector_ids:
            try:
                vector_store.delete_by_id(vector_id)
            except Exception as e:
                logger.warning(f"Failed to delete vector {vector_id}: {e}")
                failed_deletions.append(vector_id)

        if failed_deletions:
            logger.error(
                f"Failed to delete {len(failed_deletions)} vectors for case {case_id}: {failed_deletions}"
            )

        # 3. Delete metadata
        self.delete_case(case_id)
