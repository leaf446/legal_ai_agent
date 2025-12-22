"""
Metadata Store File Operations Module
증거 파일 메타데이터 CRUD
"""

import logging
from typing import List, Optional
from datetime import datetime, timezone

from botocore.exceptions import ClientError

from ..schemas import EvidenceFile
from .client import MetadataStoreClient

logger = logging.getLogger(__name__)


class MetadataStoreFileOperations(MetadataStoreClient):
    """
    파일 메타데이터 CRUD 작업

    MetadataStoreClient를 상속받아 파일 관련 작업을 제공합니다.
    """

    def save_file(self, file: EvidenceFile) -> None:
        """
        증거 파일 메타데이터 저장

        Args:
            file: EvidenceFile 객체
        """
        item_data = {
            'evidence_id': file.file_id,
            'file_id': file.file_id,
            'filename': file.filename,
            'file_type': file.file_type,
            'parsed_at': file.parsed_at.isoformat(),
            'total_messages': file.total_messages,
            'case_id': file.case_id,
            'filepath': file.filepath,
            'record_type': 'file',
            'created_at': datetime.now(timezone.utc).isoformat(),
            'status': 'done'
        }

        try:
            self.client.put_item(
                TableName=self.table_name,
                Item=self._serialize_item(item_data)
            )
            logger.info(f"Saved file metadata: {file.file_id}")
        except ClientError as e:
            logger.error(f"DynamoDB put_item error for file {file.file_id}: {e}")
            raise

    def update_evidence_status(
        self,
        evidence_id: str,
        status: str = "processed",
        ai_summary: Optional[str] = None,
        article_840_tags: Optional[dict] = None,
        qdrant_id: Optional[str] = None
    ) -> None:
        """
        Backend가 생성한 evidence 레코드의 상태 업데이트

        Args:
            evidence_id: Backend에서 생성한 evidence ID
            status: 새 상태 (기본값: "processed")
            ai_summary: AI 생성 요약
            article_840_tags: 민법 840조 태그 딕셔너리
            qdrant_id: Qdrant에 저장된 벡터 ID
        """
        update_expression = "SET #status = :status, processed_at = :processed_at"
        expression_names = {"#status": "status"}
        expression_values = {
            ":status": {"S": status},
            ":processed_at": {"S": datetime.now(timezone.utc).isoformat()}
        }

        if ai_summary is not None:
            update_expression += ", ai_summary = :ai_summary"
            expression_values[":ai_summary"] = {"S": ai_summary}

        if article_840_tags is not None:
            update_expression += ", article_840_tags = :tags"
            expression_values[":tags"] = self._serialize_value(article_840_tags)

        if qdrant_id is not None:
            update_expression += ", qdrant_id = :qdrant_id"
            expression_values[":qdrant_id"] = {"S": qdrant_id}

        try:
            self.client.update_item(
                TableName=self.table_name,
                Key={"evidence_id": {"S": evidence_id}},
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_names,
                ExpressionAttributeValues=expression_values
            )
            logger.info(f"Updated evidence status: {evidence_id} → {status}")
        except ClientError as e:
            logger.error(f"DynamoDB update_item error for {evidence_id}: {e}")
            raise

    def get_file(self, file_id: str) -> Optional[EvidenceFile]:
        """
        파일 ID로 조회

        Args:
            file_id: 파일 ID

        Returns:
            EvidenceFile 또는 None
        """
        try:
            response = self.client.get_item(
                TableName=self.table_name,
                Key={'evidence_id': {'S': file_id}}
            )

            item = response.get('Item')
            if not item:
                return None

            data = self._deserialize_item(item)
            return EvidenceFile(
                file_id=data.get('file_id', data.get('evidence_id')),
                filename=data.get('filename', ''),
                file_type=data.get('file_type', ''),
                parsed_at=datetime.fromisoformat(data['parsed_at']) if data.get('parsed_at') else datetime.now(),
                total_messages=data.get('total_messages', 0),
                case_id=data.get('case_id', ''),
                filepath=data.get('filepath')
            )
        except ClientError as e:
            logger.error(f"DynamoDB get_item error for file {file_id}: {e}")
            raise

    def get_files_by_case(self, case_id: str) -> List[EvidenceFile]:
        """
        케이스 ID로 파일 목록 조회 (GSI 사용)

        Args:
            case_id: 케이스 ID

        Returns:
            EvidenceFile 리스트
        """
        try:
            response = self.client.query(
                TableName=self.table_name,
                IndexName='case_id-index',
                KeyConditionExpression='case_id = :case_id',
                FilterExpression='record_type = :record_type',
                ExpressionAttributeValues={
                    ':case_id': {'S': case_id},
                    ':record_type': {'S': 'file'}
                }
            )

            files = []
            for item in response.get('Items', []):
                data = self._deserialize_item(item)
                files.append(EvidenceFile(
                    file_id=data.get('file_id', data.get('evidence_id')),
                    filename=data.get('filename', ''),
                    file_type=data.get('file_type', ''),
                    parsed_at=datetime.fromisoformat(data['parsed_at']) if data.get('parsed_at') else datetime.now(),
                    total_messages=data.get('total_messages', 0),
                    case_id=data.get('case_id', ''),
                    filepath=data.get('filepath')
                ))

            files.sort(key=lambda x: x.parsed_at, reverse=True)
            return files

        except ClientError as e:
            logger.error(f"DynamoDB query error for case {case_id}: {e}")
            raise

    def delete_file(self, file_id: str) -> None:
        """
        파일 메타데이터 삭제

        Args:
            file_id: 삭제할 파일 ID
        """
        try:
            self.client.delete_item(
                TableName=self.table_name,
                Key={'evidence_id': {'S': file_id}}
            )
            logger.info(f"Deleted file metadata: {file_id}")
        except ClientError as e:
            logger.error(f"DynamoDB delete_item error for file {file_id}: {e}")
            raise
