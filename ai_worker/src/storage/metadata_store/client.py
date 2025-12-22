"""
Metadata Store Client Module
DynamoDB 클라이언트 초기화 및 직렬화
"""

import os
import logging
from typing import Dict
from datetime import datetime

import boto3

logger = logging.getLogger(__name__)


class DuplicateError(Exception):
    """Raised when attempting to create a duplicate record."""
    pass


class MetadataStoreClient:
    """
    DynamoDB 클라이언트 기본 클래스

    직렬화/역직렬화 및 클라이언트 관리를 담당합니다.
    """

    def __init__(
        self,
        table_name: str = None,
        region: str = None,
        db_path: str = None  # Deprecated
    ):
        """
        MetadataStoreClient 초기화

        Args:
            table_name: DynamoDB 테이블명 (기본값: 환경변수 DYNAMODB_TABLE)
            region: AWS 리전 (기본값: 환경변수 AWS_REGION)
            db_path: Deprecated - ignored
        """
        if db_path:
            logger.warning(
                "db_path is deprecated and ignored. "
                "MetadataStore now uses DynamoDB."
            )
        self.db_path = db_path

        self.table_name = table_name or os.environ.get('DYNAMODB_TABLE', 'leh_evidence')
        self.region = region or os.environ.get('AWS_REGION', 'ap-northeast-2')
        self._client = None

    @property
    def client(self):
        """Lazy initialization of DynamoDB client"""
        if self._client is None:
            self._client = boto3.client('dynamodb', region_name=self.region)
        return self._client

    # ========== Serialization Helpers ==========

    def _serialize_value(self, value) -> Dict:
        """Convert Python value to DynamoDB type"""
        if value is None:
            return {'NULL': True}
        elif isinstance(value, bool):
            return {'BOOL': value}
        elif isinstance(value, str):
            return {'S': value}
        elif isinstance(value, (int, float)):
            return {'N': str(value)}
        elif isinstance(value, datetime):
            return {'S': value.isoformat()}
        elif isinstance(value, list):
            if not value:
                return {'L': []}
            return {'L': [self._serialize_value(v) for v in value]}
        elif isinstance(value, dict):
            return {'M': {k: self._serialize_value(v) for k, v in value.items()}}
        else:
            return {'S': str(value)}

    def _deserialize_value(self, dynamodb_value: Dict):
        """Convert DynamoDB type to Python value"""
        if 'NULL' in dynamodb_value:
            return None
        elif 'BOOL' in dynamodb_value:
            return dynamodb_value['BOOL']
        elif 'S' in dynamodb_value:
            return dynamodb_value['S']
        elif 'N' in dynamodb_value:
            num_str = dynamodb_value['N']
            return float(num_str) if '.' in num_str else int(num_str)
        elif 'L' in dynamodb_value:
            return [self._deserialize_value(v) for v in dynamodb_value['L']]
        elif 'M' in dynamodb_value:
            return {k: self._deserialize_value(v) for k, v in dynamodb_value['M'].items()}
        elif 'SS' in dynamodb_value:
            return list(dynamodb_value['SS'])
        elif 'NS' in dynamodb_value:
            return [float(n) if '.' in n else int(n) for n in dynamodb_value['NS']]
        else:
            return None

    def _serialize_item(self, data: Dict) -> Dict:
        """Convert Python dict to DynamoDB item format"""
        return {k: self._serialize_value(v) for k, v in data.items()}

    def _deserialize_item(self, item: Dict) -> Dict:
        """Convert DynamoDB item to Python dict"""
        return {k: self._deserialize_value(v) for k, v in item.items()}
