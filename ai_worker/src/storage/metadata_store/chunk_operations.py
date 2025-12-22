"""
Metadata Store Chunk Operations Module
증거 청크 메타데이터 CRUD
"""

import logging
from typing import List, Optional
from datetime import datetime, timezone

from botocore.exceptions import ClientError

from ..schemas import EvidenceChunk
from .file_operations import MetadataStoreFileOperations

logger = logging.getLogger(__name__)


class MetadataStoreChunkOperations(MetadataStoreFileOperations):
    """
    청크 메타데이터 CRUD 작업

    MetadataStoreFileOperations를 상속받아 청크 관련 작업을 제공합니다.

    Note: 청크는 Qdrant에 벡터와 함께 저장하는 것을 권장합니다.
    """

    def save_chunk(self, chunk: EvidenceChunk) -> None:
        """
        증거 청크 메타데이터 저장

        Args:
            chunk: EvidenceChunk 객체
        """
        item_data = {
            'evidence_id': f"chunk_{chunk.chunk_id}",
            'chunk_id': chunk.chunk_id,
            'file_id': chunk.file_id,
            'content': chunk.content,
            'score': chunk.score,
            'timestamp': chunk.timestamp.isoformat(),
            'sender': chunk.sender,
            'vector_id': chunk.vector_id,
            'case_id': chunk.case_id,
            'record_type': 'chunk',
            'created_at': datetime.now(timezone.utc).isoformat()
        }

        try:
            self.client.put_item(
                TableName=self.table_name,
                Item=self._serialize_item(item_data)
            )
        except ClientError as e:
            logger.error(f"DynamoDB put_item error for chunk {chunk.chunk_id}: {e}")
            raise

    def save_chunks(self, chunks: List[EvidenceChunk]) -> None:
        """
        여러 청크 일괄 저장

        Args:
            chunks: EvidenceChunk 리스트
        """
        for chunk in chunks:
            item_data = {
                'evidence_id': f"chunk_{chunk.chunk_id}",
                'chunk_id': chunk.chunk_id,
                'file_id': chunk.file_id,
                'content': chunk.content,
                'score': chunk.score,
                'timestamp': chunk.timestamp.isoformat(),
                'sender': chunk.sender,
                'vector_id': chunk.vector_id,
                'case_id': chunk.case_id,
                'record_type': 'chunk',
                'created_at': datetime.now(timezone.utc).isoformat()
            }

            try:
                self.client.put_item(
                    TableName=self.table_name,
                    Item=self._serialize_item(item_data)
                )
            except ClientError as e:
                logger.error(f"DynamoDB put_item error for chunk {chunk.chunk_id}: {e}")
                raise

    def get_chunk(self, chunk_id: str) -> Optional[EvidenceChunk]:
        """
        청크 ID로 조회

        Args:
            chunk_id: 청크 ID

        Returns:
            EvidenceChunk 또는 None
        """
        try:
            response = self.client.get_item(
                TableName=self.table_name,
                Key={'evidence_id': {'S': f"chunk_{chunk_id}"}}
            )

            item = response.get('Item')
            if not item:
                return None

            data = self._deserialize_item(item)
            return EvidenceChunk(
                chunk_id=data.get('chunk_id'),
                file_id=data.get('file_id'),
                content=data.get('content', ''),
                score=data.get('score'),
                timestamp=datetime.fromisoformat(data['timestamp']) if data.get('timestamp') else datetime.now(),
                sender=data.get('sender', ''),
                vector_id=data.get('vector_id'),
                case_id=data.get('case_id', '')
            )
        except ClientError as e:
            logger.error(f"DynamoDB get_item error for chunk {chunk_id}: {e}")
            raise

    def get_chunks_by_file(self, file_id: str) -> List[EvidenceChunk]:
        """
        파일 ID로 청크 목록 조회

        Args:
            file_id: 파일 ID

        Returns:
            EvidenceChunk 리스트
        """
        try:
            response = self.client.scan(
                TableName=self.table_name,
                FilterExpression='file_id = :file_id AND record_type = :record_type',
                ExpressionAttributeValues={
                    ':file_id': {'S': file_id},
                    ':record_type': {'S': 'chunk'}
                }
            )

            chunks = []
            for item in response.get('Items', []):
                data = self._deserialize_item(item)
                chunks.append(EvidenceChunk(
                    chunk_id=data.get('chunk_id'),
                    file_id=data.get('file_id'),
                    content=data.get('content', ''),
                    score=data.get('score'),
                    timestamp=datetime.fromisoformat(data['timestamp']) if data.get('timestamp') else datetime.now(),
                    sender=data.get('sender', ''),
                    vector_id=data.get('vector_id'),
                    case_id=data.get('case_id', '')
                ))

            chunks.sort(key=lambda x: x.timestamp)
            return chunks

        except ClientError as e:
            logger.error(f"DynamoDB scan error for file {file_id}: {e}")
            raise

    def get_chunks_by_case(self, case_id: str) -> List[EvidenceChunk]:
        """
        케이스 ID로 청크 목록 조회 (GSI 사용)

        Args:
            case_id: 케이스 ID

        Returns:
            EvidenceChunk 리스트
        """
        try:
            response = self.client.query(
                TableName=self.table_name,
                IndexName='case_id-index',
                KeyConditionExpression='case_id = :case_id',
                FilterExpression='record_type = :record_type',
                ExpressionAttributeValues={
                    ':case_id': {'S': case_id},
                    ':record_type': {'S': 'chunk'}
                }
            )

            chunks = []
            for item in response.get('Items', []):
                data = self._deserialize_item(item)
                chunks.append(EvidenceChunk(
                    chunk_id=data.get('chunk_id'),
                    file_id=data.get('file_id'),
                    content=data.get('content', ''),
                    score=data.get('score'),
                    timestamp=datetime.fromisoformat(data['timestamp']) if data.get('timestamp') else datetime.now(),
                    sender=data.get('sender', ''),
                    vector_id=data.get('vector_id'),
                    case_id=data.get('case_id', '')
                ))

            chunks.sort(key=lambda x: x.timestamp)
            return chunks

        except ClientError as e:
            logger.error(f"DynamoDB query error for case {case_id}: {e}")
            raise

    def update_chunk_score(self, chunk_id: str, score: float) -> None:
        """
        청크 점수 업데이트

        Args:
            chunk_id: 청크 ID
            score: 새로운 점수
        """
        try:
            self.client.update_item(
                TableName=self.table_name,
                Key={'evidence_id': {'S': f"chunk_{chunk_id}"}},
                UpdateExpression='SET score = :score',
                ExpressionAttributeValues={':score': {'N': str(score)}}
            )
        except ClientError as e:
            logger.error(f"DynamoDB update_item error for chunk {chunk_id}: {e}")
            raise

    def delete_chunk(self, chunk_id: str) -> None:
        """
        청크 메타데이터 삭제

        Args:
            chunk_id: 삭제할 청크 ID
        """
        try:
            self.client.delete_item(
                TableName=self.table_name,
                Key={'evidence_id': {'S': f"chunk_{chunk_id}"}}
            )
        except ClientError as e:
            logger.error(f"DynamoDB delete_item error for chunk {chunk_id}: {e}")
            raise
