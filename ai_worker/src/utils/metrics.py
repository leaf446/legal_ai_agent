"""
CloudWatch Custom Metrics for AI Worker Lambda (T057)

Provides:
- Lambda execution time tracking
- Memory usage tracking
- Error rate tracking
- Processing stage metrics

Usage:
    from src.utils.metrics import MetricsPublisher

    metrics = MetricsPublisher()

    # Track execution time
    with metrics.track_execution():
        process_file(...)

    # Record custom metric
    metrics.record_metric("ParsedMessages", 150, unit="Count")

    # Record error
    metrics.record_error("PARSE_ERROR")
"""

import os
import time
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from contextlib import contextmanager
from dataclasses import dataclass, field

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger("ai_worker.metrics")

# Metric namespace for CloudWatch
METRIC_NAMESPACE = "LEH/AIWorker"


@dataclass
class MetricData:
    """Single metric data point"""
    name: str
    value: float
    unit: str = "None"
    dimensions: Dict[str, str] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class MetricsPublisher:
    """
    CloudWatch Metrics Publisher for AI Worker.

    Batches metrics and publishes to CloudWatch for monitoring.
    """

    # Valid CloudWatch units
    VALID_UNITS = {
        "Seconds", "Microseconds", "Milliseconds",
        "Bytes", "Kilobytes", "Megabytes", "Gigabytes",
        "Bits", "Kilobits", "Megabits", "Gigabits",
        "Percent", "Count", "None"
    }

    def __init__(
        self,
        namespace: str = METRIC_NAMESPACE,
        enabled: bool = True,
        batch_size: int = 20
    ):
        """
        Initialize metrics publisher.

        Args:
            namespace: CloudWatch metric namespace
            enabled: Whether to actually publish metrics (disable for local dev)
            batch_size: Number of metrics to batch before publishing
        """
        self.namespace = namespace
        self.enabled = enabled and os.getenv("AWS_LAMBDA_FUNCTION_NAME") is not None
        self.batch_size = batch_size
        self._metrics_buffer: List[MetricData] = []
        self._client = None

        # Default dimensions (added to all metrics)
        self._default_dimensions = {
            "FunctionName": os.getenv("AWS_LAMBDA_FUNCTION_NAME", "local"),
            "Environment": os.getenv("ENVIRONMENT", "dev"),
        }

    @property
    def client(self):
        """Lazy-load CloudWatch client"""
        if self._client is None:
            self._client = boto3.client("cloudwatch")
        return self._client

    def record_metric(
        self,
        name: str,
        value: float,
        unit: str = "None",
        dimensions: Optional[Dict[str, str]] = None
    ) -> None:
        """
        Record a metric value.

        Args:
            name: Metric name (e.g., "ExecutionTime", "ParsedMessages")
            value: Metric value
            unit: CloudWatch unit (Milliseconds, Count, Percent, etc.)
            dimensions: Additional dimensions
        """
        if unit not in self.VALID_UNITS:
            logger.warning(f"Invalid unit '{unit}', using 'None'")
            unit = "None"

        all_dimensions = {**self._default_dimensions}
        if dimensions:
            all_dimensions.update(dimensions)

        metric = MetricData(
            name=name,
            value=value,
            unit=unit,
            dimensions=all_dimensions
        )

        self._metrics_buffer.append(metric)

        # Auto-flush if buffer is full
        if len(self._metrics_buffer) >= self.batch_size:
            self.flush()

    def record_execution_time(self, duration_ms: float, stage: Optional[str] = None) -> None:
        """Record Lambda execution time"""
        dimensions = {"Stage": stage} if stage else None
        self.record_metric("ExecutionTime", duration_ms, "Milliseconds", dimensions)

    def record_memory_usage(self, memory_mb: float) -> None:
        """Record memory usage"""
        self.record_metric("MemoryUsed", memory_mb, "Megabytes")

    def record_error(self, error_type: str) -> None:
        """Record an error occurrence"""
        self.record_metric("ErrorCount", 1, "Count", {"ErrorType": error_type})

    def record_success(self) -> None:
        """Record successful processing"""
        self.record_metric("SuccessCount", 1, "Count")

    def record_processed_messages(self, count: int) -> None:
        """Record number of messages processed"""
        self.record_metric("ProcessedMessages", count, "Count")

    def record_embedding_count(self, count: int, is_fallback: bool = False) -> None:
        """Record embeddings generated"""
        metric_name = "FallbackEmbeddings" if is_fallback else "Embeddings"
        self.record_metric(metric_name, count, "Count")

    @contextmanager
    def track_execution(self, stage: Optional[str] = None):
        """
        Context manager to track execution time.

        Usage:
            with metrics.track_execution("PARSE"):
                result = parser.parse(file)
        """
        start_time = time.time()
        try:
            yield
            self.record_success()
        except Exception as e:
            error_type = type(e).__name__
            self.record_error(error_type)
            raise
        finally:
            duration_ms = (time.time() - start_time) * 1000
            self.record_execution_time(duration_ms, stage)

    def flush(self) -> None:
        """Publish all buffered metrics to CloudWatch"""
        if not self._metrics_buffer:
            return

        if not self.enabled:
            logger.debug(f"Metrics disabled, skipping {len(self._metrics_buffer)} metrics")
            self._metrics_buffer.clear()
            return

        try:
            # Convert to CloudWatch format
            metric_data = []
            for m in self._metrics_buffer:
                data = {
                    "MetricName": m.name,
                    "Value": m.value,
                    "Unit": m.unit,
                    "Timestamp": m.timestamp,
                }
                if m.dimensions:
                    data["Dimensions"] = [
                        {"Name": k, "Value": v}
                        for k, v in m.dimensions.items()
                    ]
                metric_data.append(data)

            # Publish in batches of 20 (CloudWatch limit)
            for i in range(0, len(metric_data), 20):
                batch = metric_data[i:i + 20]
                self.client.put_metric_data(
                    Namespace=self.namespace,
                    MetricData=batch
                )
                logger.debug(f"Published {len(batch)} metrics to CloudWatch")

            self._metrics_buffer.clear()

        except ClientError as e:
            logger.error(f"Failed to publish metrics: {e}")
            # Don't raise - metrics should not break the main flow
            self._metrics_buffer.clear()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.flush()
        return False


# Singleton instance for convenience
_default_publisher: Optional[MetricsPublisher] = None


def get_metrics_publisher() -> MetricsPublisher:
    """Get the default metrics publisher singleton"""
    global _default_publisher
    if _default_publisher is None:
        _default_publisher = MetricsPublisher()
    return _default_publisher


def record_metric(name: str, value: float, unit: str = "None", **dimensions) -> None:
    """Convenience function to record a metric"""
    get_metrics_publisher().record_metric(name, value, unit, dimensions or None)


def record_error(error_type: str) -> None:
    """Convenience function to record an error"""
    get_metrics_publisher().record_error(error_type)


def flush_metrics() -> None:
    """Convenience function to flush all metrics"""
    get_metrics_publisher().flush()


__all__ = [
    "MetricsPublisher",
    "MetricData",
    "METRIC_NAMESPACE",
    "get_metrics_publisher",
    "record_metric",
    "record_error",
    "flush_metrics",
]
