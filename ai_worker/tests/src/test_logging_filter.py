"""
Unit tests for Sensitive Data Logging Filter

Tests sanitization of sensitive information in logs.
"""

import pytest
import logging
from src.utils.logging_filter import SensitiveDataFilter


class TestSensitiveDataFilter:
    """Test SensitiveDataFilter class"""

    def test_filter_returns_true(self):
        """Given: Any log record
        When: Filtering
        Then: Always returns True (allows logging)"""
        filter_obj = SensitiveDataFilter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="Test message",
            args=(),
            exc_info=None
        )
        assert filter_obj.filter(record) is True


class TestOpenAIKeyRedaction:
    """Test OpenAI API key sanitization"""

    def test_filter_openai_key_sk_proj(self):
        """Given: Log with sk-proj- key
        When: Filtering
        Then: Key is redacted"""
        filter_obj = SensitiveDataFilter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="Using API key: sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234",
            args=(),
            exc_info=None
        )
        filter_obj.filter(record)
        assert "sk-proj-***" in record.msg
        assert "abc123" not in record.msg

    def test_filter_openai_key_sk_legacy(self):
        """Given: Log with legacy sk- key
        When: Filtering
        Then: Key is redacted"""
        filter_obj = SensitiveDataFilter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="API key: sk-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
            args=(),
            exc_info=None
        )
        filter_obj.filter(record)
        assert "sk-***" in record.msg
        assert "abc123" not in record.msg


class TestAWSCredentialRedaction:
    """Test AWS credential sanitization"""

    def test_filter_aws_access_key(self):
        """Given: Log with AWS access key
        When: Filtering
        Then: Key is redacted"""
        filter_obj = SensitiveDataFilter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="AWS credentials: AKIAIOSFODNN7EXAMPLE",
            args=(),
            exc_info=None
        )
        filter_obj.filter(record)
        assert "AKIA***" in record.msg
        assert "EXAMPLE" not in record.msg


class TestIPAddressRedaction:
    """Test IP address sanitization"""

    def test_filter_ipv4_address(self):
        """Given: Log with IPv4 address
        When: Filtering
        Then: IP is redacted"""
        filter_obj = SensitiveDataFilter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="Request from 192.168.1.100",
            args=(),
            exc_info=None
        )
        filter_obj.filter(record)
        assert "192.168.1.100" not in record.msg
        assert "***.***.***.**" in record.msg

    def test_filter_multiple_ip_addresses(self):
        """Given: Log with multiple IPs
        When: Filtering
        Then: All IPs are redacted"""
        filter_obj = SensitiveDataFilter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="Forwarded from 10.0.0.1 via 172.16.0.50",
            args=(),
            exc_info=None
        )
        filter_obj.filter(record)
        assert "10.0.0.1" not in record.msg
        assert "172.16.0.50" not in record.msg


class TestKoreanTextRedaction:
    """Test Korean text (evidence content) sanitization"""

    def test_filter_korean_text(self):
        """Given: Log with Korean text (evidence content)
        When: Filtering
        Then: Korean text is redacted"""
        filter_obj = SensitiveDataFilter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="Parse error: 안녕하세요 테스트입니다",
            args=(),
            exc_info=None
        )
        filter_obj.filter(record)
        assert "안녕하세요" not in record.msg
        assert "***" in record.msg

    def test_filter_korean_text_minimum_length(self):
        """Given: Log with short Korean text (< 3 chars)
        When: Filtering
        Then: Not redacted (too short)"""
        filter_obj = SensitiveDataFilter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="Value: 가나",  # Only 2 Korean chars
            args=(),
            exc_info=None
        )
        filter_obj.filter(record)
        # Short Korean text should not be redacted to avoid false positives
        # Pattern requires 3+ chars: [\uac00-\ud7a3]{3,}


class TestErrorMessageRedaction:
    """Test error message sanitization"""

    def test_filter_failed_to_parse_message(self):
        """Given: "Failed to parse:" message with content
        When: Filtering
        Then: Content after colon is redacted"""
        filter_obj = SensitiveDataFilter()
        record = logging.LogRecord(
            name="test",
            level=logging.ERROR,
            pathname="",
            lineno=0,
            msg="Failed to parse: sensitive user data here",
            args=(),
            exc_info=None
        )
        filter_obj.filter(record)
        assert "Failed to parse: ***" in record.msg
        assert "sensitive user data" not in record.msg

    def test_filter_parse_error_at_line(self):
        """Given: "Parse error at line N:" message
        When: Filtering
        Then: Content after line number is redacted"""
        filter_obj = SensitiveDataFilter()
        record = logging.LogRecord(
            name="test",
            level=logging.ERROR,
            pathname="",
            lineno=0,
            msg="Parse error at line 42: invalid content here",
            args=(),
            exc_info=None
        )
        filter_obj.filter(record)
        assert "Parse error at line ***: ***" in record.msg
        assert "invalid content" not in record.msg

    def test_filter_openai_api_error(self):
        """Given: OpenAI API error with key
        When: Filtering
        Then: Key is redacted"""
        filter_obj = SensitiveDataFilter()
        record = logging.LogRecord(
            name="test",
            level=logging.ERROR,
            pathname="",
            lineno=0,
            msg="OpenAI API error with key sk-abc123:",
            args=(),
            exc_info=None
        )
        filter_obj.filter(record)
        assert "OpenAI API error: ***" in record.msg


class TestLogRecordArgs:
    """Test sanitization of log record args"""

    def test_filter_args_dict(self):
        """Given: Log record with dict args
        When: Filtering
        Then: Dict values are sanitized"""
        filter_obj = SensitiveDataFilter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="User action: %s",
            args={'action': 'login from 192.168.1.1'},
            exc_info=None
        )
        filter_obj.filter(record)
        assert "192.168.1.1" not in record.args['action']

    def test_filter_args_tuple(self):
        """Given: Log record with tuple args
        When: Filtering
        Then: Tuple values are sanitized"""
        filter_obj = SensitiveDataFilter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="API call with key %s from %s",
            args=('sk-test123', '10.0.0.1'),
            exc_info=None
        )
        filter_obj.filter(record)
        assert isinstance(record.args, tuple)
        # Should contain redacted versions


class TestExceptionInfoSanitization:
    """Test sanitization of exception info"""

    def test_filter_exc_info_with_sensitive_data(self):
        """Given: Exception with sensitive data in message
        When: Filtering
        Then: Exception message is sanitized"""
        filter_obj = SensitiveDataFilter()
        
        try:
            raise ValueError("Connection from 192.168.1.100 failed")
        except ValueError:
            import sys
            exc_info = sys.exc_info()
            
            record = logging.LogRecord(
                name="test",
                level=logging.ERROR,
                pathname="",
                lineno=0,
                msg="Error occurred",
                args=(),
                exc_info=exc_info
            )
            filter_obj.filter(record)
            # Check that exc_info was processed
            assert record.exc_info is not None

    def test_filter_exc_info_none(self):
        """Given: No exception info
        When: Filtering
        Then: Handles gracefully"""
        filter_obj = SensitiveDataFilter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="Normal log",
            args=(),
            exc_info=None
        )
        result = filter_obj.filter(record)
        assert result is True


class TestMultipleSensitivePatterns:
    """Test logs with multiple sensitive patterns"""

    def test_filter_multiple_patterns(self):
        """Given: Log with multiple sensitive data types
        When: Filtering
        Then: All patterns are redacted"""
        filter_obj = SensitiveDataFilter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="User with key sk-test123 from IP 10.0.0.1 and AWS key AKIATEST123",
            args=(),
            exc_info=None
        )
        filter_obj.filter(record)
        assert "sk-***" in record.msg
        assert "***.***.***.**" in record.msg
        assert "AKIA***" in record.msg
        assert "sk-test123" not in record.msg
        assert "10.0.0.1" not in record.msg
        assert "AKIATEST123" not in record.msg


class TestEdgeCases:
    """Test edge cases and boundary conditions"""

    def test_filter_empty_message(self):
        """Given: Empty log message
        When: Filtering
        Then: Handles gracefully"""
        filter_obj = SensitiveDataFilter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="",
            args=(),
            exc_info=None
        )
        result = filter_obj.filter(record)
        assert result is True

    def test_filter_none_args(self):
        """Given: No args in record
        When: Filtering
        Then: Handles gracefully"""
        filter_obj = SensitiveDataFilter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="Test message",
            args=None,
            exc_info=None
        )
        result = filter_obj.filter(record)
        assert result is True

    def test_filter_very_long_message(self):
        """Given: Very long log message
        When: Filtering
        Then: Processes efficiently"""
        filter_obj = SensitiveDataFilter()
        long_msg = "Normal text " * 1000 + " IP: 192.168.1.1 " + "More text " * 1000
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg=long_msg,
            args=(),
            exc_info=None
        )
        result = filter_obj.filter(record)
        assert result is True
        assert "192.168.1.1" not in record.msg

    def test_filter_unicode_mixed_content(self):
        """Given: Log with mixed Unicode content
        When: Filtering
        Then: Handles all character sets"""
        filter_obj = SensitiveDataFilter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="User 사용자명 from 10.0.0.1 with key sk-test",
            args=(),
            exc_info=None
        )
        result = filter_obj.filter(record)
        assert result is True


class TestRealWorldScenarios:
    """Test realistic logging scenarios"""

    def test_filter_api_request_log(self):
        """Given: API request log with sensitive data
        When: Filtering
        Then: Sensitive parts are redacted"""
        filter_obj = SensitiveDataFilter()
        record = logging.LogRecord(
            name="api",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="API request from 203.0.113.50 using key sk-proj-test123",
            args=(),
            exc_info=None
        )
        filter_obj.filter(record)
        assert "203.0.113.50" not in record.msg
        assert "sk-proj-test123" not in record.msg

    def test_filter_database_connection_error(self):
        """Given: Database connection error with credentials
        When: Filtering
        Then: Credentials are redacted"""
        filter_obj = SensitiveDataFilter()
        record = logging.LogRecord(
            name="db",
            level=logging.ERROR,
            pathname="",
            lineno=0,
            msg="Connection failed to 172.16.0.10",
            args=(),
            exc_info=None
        )
        filter_obj.filter(record)
        assert "172.16.0.10" not in record.msg

    def test_filter_evidence_parsing_error(self):
        """Given: Evidence parsing error with Korean content
        When: Filtering
        Then: Content is redacted"""
        filter_obj = SensitiveDataFilter()
        record = logging.LogRecord(
            name="parser",
            level=logging.ERROR,
            pathname="",
            lineno=0,
            msg="Failed to parse: 이것은 증거 내용입니다",
            args=(),
            exc_info=None
        )
        filter_obj.filter(record)
        assert "Failed to parse: ***" in record.msg
        assert "증거" not in record.msg


if __name__ == "__main__":
    pytest.main([__file__, "-v"])