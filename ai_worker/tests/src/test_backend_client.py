"""
Unit tests for Backend API Client

Tests AI Worker's communication with Backend API.
"""

import pytest
from unittest.mock import patch, Mock
import requests
from requests.exceptions import Timeout, ConnectionError

from src.api.backend_client import (
    AutoExtractedParty,
    AutoExtractedRelationship,
    BackendAPIClient,
)


class TestAutoExtractedParty:
    """Test AutoExtractedParty dataclass"""

    def test_party_to_dict_minimal(self):
        """Given: Party with minimal fields
        When: Converting to dict
        Then: Returns required fields only"""
        party = AutoExtractedParty(
            name="김철수",
            type="plaintiff",
            extraction_confidence=0.85,
            source_evidence_id="ev_123"
        )
        data = party.to_dict()
        assert data["name"] == "김철수"
        assert data["type"] == "plaintiff"
        assert data["extraction_confidence"] == 0.85
        assert data["source_evidence_id"] == "ev_123"
        assert "alias" not in data
        assert "birth_year" not in data

    def test_party_to_dict_with_optional_fields(self):
        """Given: Party with all fields
        When: Converting to dict
        Then: Returns all fields"""
        party = AutoExtractedParty(
            name="김철수",
            type="plaintiff",
            extraction_confidence=0.9,
            source_evidence_id="ev_123",
            alias="철수",
            birth_year=1980,
            occupation="변호사"
        )
        data = party.to_dict()
        assert data["alias"] == "철수"
        assert data["birth_year"] == 1980
        assert data["occupation"] == "변호사"


class TestAutoExtractedRelationship:
    """Test AutoExtractedRelationship dataclass"""

    def test_relationship_to_dict_minimal(self):
        """Given: Relationship with minimal fields
        When: Converting to dict
        Then: Returns required fields only"""
        rel = AutoExtractedRelationship(
            source_party_id="party_1",
            target_party_id="party_2",
            type="marriage",
            extraction_confidence=0.95
        )
        data = rel.to_dict()
        assert data["source_party_id"] == "party_1"
        assert data["target_party_id"] == "party_2"
        assert data["type"] == "marriage"
        assert data["extraction_confidence"] == 0.95
        assert "evidence_text" not in data

    def test_relationship_to_dict_with_evidence(self):
        """Given: Relationship with evidence text
        When: Converting to dict
        Then: Includes evidence text"""
        rel = AutoExtractedRelationship(
            source_party_id="party_1",
            target_party_id="party_2",
            type="affair",
            extraction_confidence=0.88,
            evidence_text="2023년 1월부터 부적절한 관계"
        )
        data = rel.to_dict()
        assert data["evidence_text"] == "2023년 1월부터 부적절한 관계"


class TestBackendAPIClientInit:
    """Test BackendAPIClient initialization"""

    def test_client_init_default_values(self, monkeypatch):
        """Given: No parameters
        When: Creating client
        Then: Uses environment variables or defaults"""
        monkeypatch.setenv("BACKEND_API_URL", "http://test-backend:8000/api")
        monkeypatch.setenv("INTERNAL_API_KEY", "test-internal-key")
        
        client = BackendAPIClient()
        assert client.base_url == "http://test-backend:8000/api"
        assert client.internal_api_key == "test-internal-key"

    def test_client_init_custom_values(self):
        """Given: Custom parameters
        When: Creating client
        Then: Uses provided values"""
        client = BackendAPIClient(
            base_url="http://custom:9000/api",
            internal_api_key="custom-key"
        )
        assert client.base_url == "http://custom:9000/api"
        assert client.internal_api_key == "custom-key"

    def test_client_init_strips_trailing_slash(self):
        """Given: URL with trailing slash
        When: Creating client
        Then: Removes trailing slash"""
        client = BackendAPIClient(base_url="http://test:8000/api/")
        assert client.base_url == "http://test:8000/api"

    def test_client_init_default_url(self, monkeypatch):
        """Given: No URL in env
        When: Creating client
        Then: Uses localhost default"""
        monkeypatch.delenv("BACKEND_API_URL", raising=False)
        client = BackendAPIClient()
        assert "localhost:8000" in client.base_url


class TestGetHeaders:
    """Test header generation"""

    def test_get_headers_with_internal_api_key(self):
        """Given: Internal API key set
        When: Getting headers
        Then: Includes X-Internal-API-Key"""
        client = BackendAPIClient(internal_api_key="test-internal-key")
        headers = client._get_headers()
        assert headers["X-Internal-API-Key"] == "test-internal-key"
        assert "Authorization" not in headers

    def test_get_headers_with_service_token(self):
        """Given: Service token set (legacy)
        When: Getting headers
        Then: Includes Authorization Bearer"""
        client = BackendAPIClient(service_token="test-token")
        headers = client._get_headers()
        assert headers["Authorization"] == "Bearer test-token"

    def test_get_headers_with_api_key(self):
        """Given: API key set
        When: Getting headers
        Then: Includes X-API-Key"""
        client = BackendAPIClient(api_key="test-api-key")
        headers = client._get_headers()
        assert headers["X-API-Key"] == "test-api-key"

    def test_get_headers_priority_internal_over_service_token(self):
        """Given: Both internal key and service token
        When: Getting headers
        Then: Prioritizes internal key"""
        client = BackendAPIClient(
            internal_api_key="internal-key",
            service_token="service-token"
        )
        headers = client._get_headers()
        assert headers["X-Internal-API-Key"] == "internal-key"
        assert "Authorization" not in headers

    def test_get_headers_common_fields(self):
        """Given: Any client
        When: Getting headers
        Then: Includes common headers"""
        client = BackendAPIClient()
        headers = client._get_headers()
        assert headers["Content-Type"] == "application/json"
        assert headers["Accept"] == "application/json"
        assert headers["User-Agent"] == "LEH-AI-Worker/1.0"


class TestSaveAutoExtractedParty:
    """Test save_auto_extracted_party method"""

    @patch('src.api.backend_client.requests.post')
    def test_save_party_success(self, mock_post):
        """Given: Valid party data
        When: Saving party
        Then: Returns PartyResponse"""
        mock_response = Mock()
        mock_response.status_code = 201
        mock_response.json.return_value = {
            "id": "party_123",
            "name": "김철수",
            "is_duplicate": False
        }
        mock_post.return_value = mock_response
        
        client = BackendAPIClient(internal_api_key="test-key")
        party = AutoExtractedParty(
            name="김철수",
            type="plaintiff",
            extraction_confidence=0.85,
            source_evidence_id="ev_123"
        )
        
        result = client.save_auto_extracted_party("case_001", party)
        assert result.id == "party_123"
        assert result.name == "김철수"
        assert result.is_duplicate is False

    @patch('src.api.backend_client.requests.post')
    def test_save_party_duplicate_detected(self, mock_post):
        """Given: Duplicate party
        When: Saving party
        Then: Returns response with is_duplicate=True"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "party_new",
            "name": "김철수",
            "is_duplicate": True,
            "matched_party_id": "party_existing"
        }
        mock_post.return_value = mock_response
        
        client = BackendAPIClient(internal_api_key="test-key")
        party = AutoExtractedParty(
            name="김철수",
            type="plaintiff",
            extraction_confidence=0.85,
            source_evidence_id="ev_123"
        )
        
        result = client.save_auto_extracted_party("case_001", party)
        assert result.is_duplicate is True
        assert result.matched_party_id == "party_existing"

    @patch('src.api.backend_client.requests.post')
    def test_save_party_with_retry_success(self, mock_post):
        """Given: First request fails, second succeeds
        When: Saving party with retry
        Then: Retries and returns success"""
        # First call fails, second succeeds
        mock_response_fail = Mock()
        mock_response_fail.status_code = 500
        mock_response_fail.raise_for_status.side_effect = requests.HTTPError()
        
        mock_response_success = Mock()
        mock_response_success.status_code = 201
        mock_response_success.json.return_value = {
            "id": "party_123",
            "name": "김철수",
            "is_duplicate": False
        }
        
        mock_post.side_effect = [mock_response_fail, mock_response_success]
        
        client = BackendAPIClient(internal_api_key="test-key")
        party = AutoExtractedParty(
            name="김철수",
            type="plaintiff",
            extraction_confidence=0.85,
            source_evidence_id="ev_123"
        )
        
        with patch('src.api.backend_client.time.sleep'):  # Skip sleep in tests
            result = client.save_auto_extracted_party("case_001", party)
        
        assert result.id == "party_123"
        assert mock_post.call_count == 2

    @patch('src.api.backend_client.requests.post')
    def test_save_party_max_retries_exceeded(self, mock_post):
        """Given: All retries fail
        When: Saving party
        Then: Returns None"""
        mock_post.side_effect = Timeout("Request timeout")
        
        client = BackendAPIClient(internal_api_key="test-key")
        party = AutoExtractedParty(
            name="김철수",
            type="plaintiff",
            extraction_confidence=0.85,
            source_evidence_id="ev_123"
        )
        
        with patch('src.api.backend_client.time.sleep'):
            result = client.save_auto_extracted_party("case_001", party)
        
        assert result is None
        assert mock_post.call_count == 3  # MAX_RETRIES


class TestSaveAutoExtractedRelationship:
    """Test save_auto_extracted_relationship method"""

    @patch('src.api.backend_client.requests.post')
    def test_save_relationship_success(self, mock_post):
        """Given: Valid relationship data
        When: Saving relationship
        Then: Returns RelationshipResponse"""
        mock_response = Mock()
        mock_response.status_code = 201
        mock_response.json.return_value = {
            "id": "rel_123",
            "created": True
        }
        mock_post.return_value = mock_response
        
        client = BackendAPIClient(internal_api_key="test-key")
        rel = AutoExtractedRelationship(
            source_party_id="party_1",
            target_party_id="party_2",
            type="marriage",
            extraction_confidence=0.95
        )
        
        result = client.save_auto_extracted_relationship("case_001", rel)
        assert result.id == "rel_123"
        assert result.created is True

    @patch('src.api.backend_client.requests.post')
    def test_save_relationship_connection_error(self, mock_post, caplog):
        """Given: Connection error
        When: Saving relationship
        Then: Logs error and returns None"""
        mock_post.side_effect = ConnectionError("Connection refused")
        
        client = BackendAPIClient(internal_api_key="test-key")
        rel = AutoExtractedRelationship(
            source_party_id="party_1",
            target_party_id="party_2",
            type="marriage",
            extraction_confidence=0.95
        )
        
        with patch('src.api.backend_client.time.sleep'):
            result = client.save_auto_extracted_relationship("case_001", rel)
        
        assert result is None
        assert "Connection refused" in caplog.text


class TestSaveBatchAutoExtractedParties:
    """Test save_batch_auto_extracted_parties method"""

    @patch('src.api.backend_client.requests.post')
    def test_save_batch_parties_success(self, mock_post):
        """Given: List of parties
        When: Saving batch
        Then: Returns list of responses"""
        mock_response = Mock()
        mock_response.status_code = 201
        mock_response.json.return_value = {
            "results": [
                {"id": "party_1", "name": "김철수", "is_duplicate": False},
                {"id": "party_2", "name": "이영희", "is_duplicate": False}
            ]
        }
        mock_post.return_value = mock_response
        
        client = BackendAPIClient(internal_api_key="test-key")
        parties = [
            AutoExtractedParty("김철수", "plaintiff", 0.9, "ev_1"),
            AutoExtractedParty("이영희", "defendant", 0.85, "ev_2")
        ]
        
        results = client.save_batch_auto_extracted_parties("case_001", parties)
        assert len(results) == 2
        assert results[0].id == "party_1"
        assert results[1].id == "party_2"

    @patch('src.api.backend_client.requests.post')
    def test_save_batch_parties_empty_list(self, mock_post):
        """Given: Empty party list
        When: Saving batch
        Then: Returns empty list without API call"""
        client = BackendAPIClient(internal_api_key="test-key")
        results = client.save_batch_auto_extracted_parties("case_001", [])
        assert results == []
        mock_post.assert_not_called()


class TestHealthCheck:
    """Test health_check method"""

    @patch('src.api.backend_client.requests.get')
    def test_health_check_success(self, mock_get):
        """Given: Healthy backend
        When: Checking health
        Then: Returns True"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "ok"}
        mock_get.return_value = mock_response
        
        client = BackendAPIClient(internal_api_key="test-key")
        result = client.health_check()
        assert result is True

    @patch('src.api.backend_client.requests.get')
    def test_health_check_failure(self, mock_get):
        """Given: Unhealthy backend
        When: Checking health
        Then: Returns False"""
        mock_get.side_effect = ConnectionError("Connection refused")
        
        client = BackendAPIClient(internal_api_key="test-key")
        result = client.health_check()
        assert result is False


class TestEdgeCases:
    """Test edge cases and error handling"""

    @patch('src.api.backend_client.requests.post')
    def test_unicode_in_party_name(self, mock_post):
        """Given: Party with Unicode name
        When: Saving party
        Then: Handles correctly"""
        mock_response = Mock()
        mock_response.status_code = 201
        mock_response.json.return_value = {
            "id": "party_123",
            "name": "김철수 🎉",
            "is_duplicate": False
        }
        mock_post.return_value = mock_response
        
        client = BackendAPIClient(internal_api_key="test-key")
        party = AutoExtractedParty(
            name="김철수 🎉",
            type="plaintiff",
            extraction_confidence=0.85,
            source_evidence_id="ev_123"
        )
        
        result = client.save_auto_extracted_party("case_001", party)
        assert result.name == "김철수 🎉"

    @patch('src.api.backend_client.requests.post')
    def test_very_high_confidence(self, mock_post):
        """Given: Party with 1.0 confidence
        When: Saving party
        Then: Accepts high confidence"""
        mock_response = Mock()
        mock_response.status_code = 201
        mock_response.json.return_value = {
            "id": "party_123",
            "name": "김철수",
            "is_duplicate": False
        }
        mock_post.return_value = mock_response
        
        client = BackendAPIClient(internal_api_key="test-key")
        party = AutoExtractedParty(
            name="김철수",
            type="plaintiff",
            extraction_confidence=1.0,
            source_evidence_id="ev_123"
        )
        
        result = client.save_auto_extracted_party("case_001", party)
        assert result is not None

    @patch('src.api.backend_client.requests.post')
    def test_very_low_confidence(self, mock_post):
        """Given: Party with low confidence
        When: Saving party
        Then: Accepts low confidence (validation on backend)"""
        mock_response = Mock()
        mock_response.status_code = 201
        mock_response.json.return_value = {
            "id": "party_123",
            "name": "김철수",
            "is_duplicate": False
        }
        mock_post.return_value = mock_response
        
        client = BackendAPIClient(internal_api_key="test-key")
        party = AutoExtractedParty(
            name="김철수",
            type="plaintiff",
            extraction_confidence=0.1,
            source_evidence_id="ev_123"
        )
        
        result = client.save_auto_extracted_party("case_001", party)
        assert result is not None


class TestTimeout:
    """Test timeout handling"""

    @patch('src.api.backend_client.requests.post')
    def test_request_timeout(self, mock_post, caplog):
        """Given: Request timeout
        When: Saving party
        Then: Retries and logs timeout"""
        mock_post.side_effect = Timeout("Request timeout")
        
        client = BackendAPIClient(internal_api_key="test-key")
        party = AutoExtractedParty(
            name="김철수",
            type="plaintiff",
            extraction_confidence=0.85,
            source_evidence_id="ev_123"
        )
        
        with patch('src.api.backend_client.time.sleep'):
            result = client.save_auto_extracted_party("case_001", party)
        
        assert result is None
        assert "timeout" in caplog.text.lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])