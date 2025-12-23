"""
Unit tests for Notification Service

Tests notification business logic operations.
"""

import pytest
from unittest.mock import Mock
from sqlalchemy.orm import Session

from app.services.notification_service import NotificationService
from app.db.models import NotificationType
from app.db.schemas import (
    NotificationResponse,
    NotificationListResponse,
    NotificationReadAllResponse,
)


class TestNotificationServiceInit:
    """Test NotificationService initialization"""

    def test_init_creates_repository(self):
        """Given: Database session
        When: Creating service
        Then: Initializes repository"""
        mock_db = Mock(spec=Session)
        service = NotificationService(mock_db)
        assert service.db is mock_db
        assert service.repository is not None


class TestCreateNotification:
    """Test create_notification method"""

    def test_create_notification_minimal(self):
        """Given: Minimal notification data
        When: Creating notification
        Then: Returns NotificationResponse"""
        mock_db = Mock(spec=Session)
        service = NotificationService(mock_db)
        
        mock_notification = Mock()
        mock_notification.id = "notif_123"
        mock_notification.user_id = "user_456"
        mock_notification.title = "Test Notification"
        mock_notification.content = "Test content"
        mock_notification.notification_type = NotificationType.SYSTEM
        mock_notification.is_read = False
        mock_notification.created_at = "2024-01-01T00:00:00"
        
        service.repository.create = Mock(return_value=mock_notification)
        
        result = service.create_notification(
            user_id="user_456",
            title="Test Notification",
            content="Test content"
        )
        
        service.repository.create.assert_called_once_with(
            user_id="user_456",
            title="Test Notification",
            content="Test content",
            notification_type=NotificationType.SYSTEM,
            related_id=None
        )
        assert isinstance(result, NotificationResponse)

    def test_create_notification_with_type(self):
        """Given: Notification with specific type
        When: Creating notification
        Then: Uses specified type"""
        mock_db = Mock(spec=Session)
        service = NotificationService(mock_db)
        
        mock_notification = Mock()
        mock_notification.id = "notif_123"
        mock_notification.user_id = "user_456"
        mock_notification.title = "Case Update"
        mock_notification.content = "New evidence added"
        mock_notification.notification_type = NotificationType.CASE_UPDATE
        mock_notification.is_read = False
        mock_notification.created_at = "2024-01-01T00:00:00"
        
        service.repository.create = Mock(return_value=mock_notification)
        
        result = service.create_notification(
            user_id="user_456",
            title="Case Update",
            content="New evidence added",
            notification_type=NotificationType.CASE_UPDATE
        )
        
        assert result.notification_type == NotificationType.CASE_UPDATE

    def test_create_notification_with_related_id(self):
        """Given: Notification with related entity ID
        When: Creating notification
        Then: Stores related_id"""
        mock_db = Mock(spec=Session)
        service = NotificationService(mock_db)
        
        mock_notification = Mock()
        mock_notification.id = "notif_123"
        mock_notification.user_id = "user_456"
        mock_notification.title = "Case Shared"
        mock_notification.content = "Case was shared with you"
        mock_notification.notification_type = NotificationType.CASE_SHARED
        mock_notification.related_id = "case_789"
        mock_notification.is_read = False
        mock_notification.created_at = "2024-01-01T00:00:00"
        
        service.repository.create = Mock(return_value=mock_notification)
        
        result = service.create_notification(
            user_id="user_456",
            title="Case Shared",
            content="Case was shared with you",
            notification_type=NotificationType.CASE_SHARED,
            related_id="case_789"
        )
        
        service.repository.create.assert_called_once()
        call_kwargs = service.repository.create.call_args[1]
        assert call_kwargs["related_id"] == "case_789"


class TestGetNotifications:
    """Test get_notifications method"""

    def test_get_notifications_default_params(self):
        """Given: User ID
        When: Getting notifications
        Then: Returns NotificationListResponse"""
        mock_db = Mock(spec=Session)
        service = NotificationService(mock_db)
        
        mock_notifications = [Mock(id=f"notif_{i}") for i in range(5)]
        service.repository.get_by_user = Mock(return_value=mock_notifications)
        service.repository.get_unread_count = Mock(return_value=3)
        
        result = service.get_notifications("user_123")
        
        assert isinstance(result, NotificationListResponse)
        assert len(result.notifications) == 5
        assert result.unread_count == 3
        service.repository.get_by_user.assert_called_once_with(
            user_id="user_123",
            limit=10,
            unread_only=False
        )

    def test_get_notifications_with_limit(self):
        """Given: Custom limit
        When: Getting notifications
        Then: Applies limit"""
        mock_db = Mock(spec=Session)
        service = NotificationService(mock_db)
        
        mock_notifications = [Mock(id=f"notif_{i}") for i in range(20)]
        service.repository.get_by_user = Mock(return_value=mock_notifications)
        service.repository.get_unread_count = Mock(return_value=10)
        
        result = service.get_notifications("user_123", limit=20)
        
        service.repository.get_by_user.assert_called_once_with(
            user_id="user_123",
            limit=20,
            unread_only=False
        )
        assert len(result.notifications) == 20

    def test_get_notifications_unread_only(self):
        """Given: unread_only=True
        When: Getting notifications
        Then: Filters to unread only"""
        mock_db = Mock(spec=Session)
        service = NotificationService(mock_db)
        
        mock_notifications = [Mock(id=f"notif_{i}", is_read=False) for i in range(3)]
        service.repository.get_by_user = Mock(return_value=mock_notifications)
        service.repository.get_unread_count = Mock(return_value=3)
        
        result = service.get_notifications("user_123", unread_only=True)
        
        service.repository.get_by_user.assert_called_once_with(
            user_id="user_123",
            limit=10,
            unread_only=True
        )
        assert len(result.notifications) == 3

    def test_get_notifications_empty_list(self):
        """Given: User with no notifications
        When: Getting notifications
        Then: Returns empty list"""
        mock_db = Mock(spec=Session)
        service = NotificationService(mock_db)
        
        service.repository.get_by_user = Mock(return_value=[])
        service.repository.get_unread_count = Mock(return_value=0)
        
        result = service.get_notifications("user_123")
        
        assert len(result.notifications) == 0
        assert result.unread_count == 0


class TestMarkAsRead:
    """Test mark_as_read method"""

    def test_mark_as_read_success(self):
        """Given: Valid notification ID and user ID
        When: Marking as read
        Then: Updates notification and returns response"""
        mock_db = Mock(spec=Session)
        service = NotificationService(mock_db)
        
        mock_notification = Mock()
        mock_notification.id = "notif_123"
        mock_notification.user_id = "user_456"
        mock_notification.is_read = False
        
        mock_updated = Mock()
        mock_updated.id = "notif_123"
        mock_updated.user_id = "user_456"
        mock_updated.is_read = True
        
        service.repository.get_by_id = Mock(return_value=mock_notification)
        service.repository.mark_as_read = Mock(return_value=mock_updated)
        
        result = service.mark_as_read("notif_123", "user_456")
        
        assert isinstance(result, NotificationResponse)
        service.repository.mark_as_read.assert_called_once_with("notif_123")

    def test_mark_as_read_not_found(self):
        """Given: Nonexistent notification ID
        When: Marking as read
        Then: Raises KeyError"""
        mock_db = Mock(spec=Session)
        service = NotificationService(mock_db)
        
        service.repository.get_by_id = Mock(return_value=None)
        
        with pytest.raises(KeyError, match="Notification not found"):
            service.mark_as_read("notif_999", "user_456")

    def test_mark_as_read_wrong_user(self):
        """Given: Notification belonging to different user
        When: Marking as read
        Then: Raises PermissionError"""
        mock_db = Mock(spec=Session)
        service = NotificationService(mock_db)
        
        mock_notification = Mock()
        mock_notification.id = "notif_123"
        mock_notification.user_id = "user_456"
        
        service.repository.get_by_id = Mock(return_value=mock_notification)
        
        with pytest.raises(PermissionError, match="Not authorized"):
            service.mark_as_read("notif_123", "user_999")


class TestMarkAllAsRead:
    """Test mark_all_as_read method"""

    def test_mark_all_as_read_success(self):
        """Given: User with unread notifications
        When: Marking all as read
        Then: Updates all and returns count"""
        mock_db = Mock(spec=Session)
        service = NotificationService(mock_db)
        
        service.repository.mark_all_as_read = Mock(return_value=5)
        
        result = service.mark_all_as_read("user_123")
        
        assert isinstance(result, NotificationReadAllResponse)
        assert result.updated_count == 5
        service.repository.mark_all_as_read.assert_called_once_with("user_123")

    def test_mark_all_as_read_no_unread(self):
        """Given: User with no unread notifications
        When: Marking all as read
        Then: Returns count of 0"""
        mock_db = Mock(spec=Session)
        service = NotificationService(mock_db)
        
        service.repository.mark_all_as_read = Mock(return_value=0)
        
        result = service.mark_all_as_read("user_123")
        
        assert result.updated_count == 0


class TestGetUnreadCount:
    """Test get_unread_count method"""

    def test_get_unread_count_with_unread(self):
        """Given: User with unread notifications
        When: Getting count
        Then: Returns correct count"""
        mock_db = Mock(spec=Session)
        service = NotificationService(mock_db)
        
        service.repository.get_unread_count = Mock(return_value=7)
        
        result = service.get_unread_count("user_123")
        
        assert result == 7
        service.repository.get_unread_count.assert_called_once_with("user_123")

    def test_get_unread_count_no_unread(self):
        """Given: User with no unread notifications
        When: Getting count
        Then: Returns 0"""
        mock_db = Mock(spec=Session)
        service = NotificationService(mock_db)
        
        service.repository.get_unread_count = Mock(return_value=0)
        
        result = service.get_unread_count("user_123")
        
        assert result == 0


class TestEdgeCases:
    """Test edge cases and boundary conditions"""

    def test_create_notification_long_content(self):
        """Given: Notification with very long content
        When: Creating notification
        Then: Handles long content"""
        mock_db = Mock(spec=Session)
        service = NotificationService(mock_db)
        
        long_content = "A" * 10000
        mock_notification = Mock()
        mock_notification.id = "notif_123"
        mock_notification.user_id = "user_456"
        mock_notification.title = "Long Notification"
        mock_notification.content = long_content
        mock_notification.notification_type = NotificationType.SYSTEM
        mock_notification.is_read = False
        mock_notification.created_at = "2024-01-01T00:00:00"
        
        service.repository.create = Mock(return_value=mock_notification)
        
        result = service.create_notification(
            user_id="user_456",
            title="Long Notification",
            content=long_content
        )
        
        assert len(result.content) == 10000

    def test_get_notifications_with_zero_limit(self):
        """Given: Limit of 0
        When: Getting notifications
        Then: Handles gracefully"""
        mock_db = Mock(spec=Session)
        service = NotificationService(mock_db)
        
        service.repository.get_by_user = Mock(return_value=[])
        service.repository.get_unread_count = Mock(return_value=5)
        
        result = service.get_notifications("user_123", limit=0)
        
        service.repository.get_by_user.assert_called_once_with(
            user_id="user_123",
            limit=0,
            unread_only=False
        )


class TestNotificationTypes:
    """Test different notification types"""

    @pytest.mark.parametrize("notif_type", [
        NotificationType.SYSTEM,
        NotificationType.CASE_UPDATE,
        NotificationType.CASE_SHARED,
        NotificationType.EVIDENCE_PROCESSED,
        NotificationType.MESSAGE,
    ])
    def test_create_notification_all_types(self, notif_type):
        """Given: Different notification types
        When: Creating notifications
        Then: Handles all types correctly"""
        mock_db = Mock(spec=Session)
        service = NotificationService(mock_db)
        
        mock_notification = Mock()
        mock_notification.id = "notif_123"
        mock_notification.user_id = "user_456"
        mock_notification.title = f"{notif_type.value} Notification"
        mock_notification.content = "Test content"
        mock_notification.notification_type = notif_type
        mock_notification.is_read = False
        mock_notification.created_at = "2024-01-01T00:00:00"
        
        service.repository.create = Mock(return_value=mock_notification)
        
        result = service.create_notification(
            user_id="user_456",
            title=f"{notif_type.value} Notification",
            content="Test content",
            notification_type=notif_type
        )
        
        assert result.notification_type == notif_type


if __name__ == "__main__":
    pytest.main([__file__, "-v"])