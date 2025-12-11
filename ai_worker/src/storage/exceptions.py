"""
Storage Exceptions

Custom exceptions for VectorStore and MetadataStore operations.
"""


class DuplicateError(Exception):
    """
    중복 레코드 발견

    이미 처리된 파일이나 증거를 다시 처리하려고 할 때 발생
    """
    def __init__(self, message: str, existing_id: str = None):
        self.existing_id = existing_id
        super().__init__(message)


class QdrantStorageError(Exception):
    """
    Qdrant 저장 실패 (재시도 소진)

    지수 백오프 재시도 후에도 Qdrant 저장에 실패한 경우 발생
    """
    def __init__(self, message: str, retry_count: int = 0, last_error: Exception = None):
        self.retry_count = retry_count
        self.last_error = last_error
        super().__init__(message)

    def __str__(self):
        base = super().__str__()
        return f"{base} (retries: {self.retry_count})"


class MetadataStoreError(Exception):
    """
    DynamoDB 작업 실패

    DynamoDB 읽기/쓰기 작업 중 발생한 오류
    """
    def __init__(self, message: str, operation: str = None, table: str = None):
        self.operation = operation
        self.table = table
        super().__init__(message)


class PartialFailureError(Exception):
    """
    부분 실패 에러

    파이프라인 처리 중 일부 단계만 성공한 경우
    partial_data에 성공한 부분의 데이터가 포함됨
    """
    def __init__(
        self,
        message: str,
        failed_stage: str,
        partial_data: dict = None
    ):
        self.failed_stage = failed_stage
        self.partial_data = partial_data or {}
        super().__init__(message)
