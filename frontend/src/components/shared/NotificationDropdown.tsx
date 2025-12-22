'use client';

/**
 * NotificationDropdown Component
 * Displays user notifications in a dropdown menu
 */

import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationDropdownProps {
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDismiss?: (id: string) => void;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: '새 증거 업로드',
    message: '김의뢰인님이 새 증거 파일을 업로드했습니다.',
    timestamp: '방금 전',
    read: false,
    type: 'info',
  },
  {
    id: '2',
    title: '초안 생성 완료',
    message: '이혼소송 답변서 초안이 생성되었습니다.',
    timestamp: '10분 전',
    read: false,
    type: 'success',
  },
  {
    id: '3',
    title: '일정 알림',
    message: '내일 오후 2시 법원 출석 예정입니다.',
    timestamp: '1시간 전',
    read: true,
    type: 'warning',
  },
];

const typeStyles = {
  info: 'bg-blue-50 border-blue-200',
  success: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  error: 'bg-red-50 border-red-200',
};

export function NotificationDropdown({
  notifications = MOCK_NOTIFICATIONS,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="알림"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-accent text-white text-xs font-medium rounded-full flex items-center justify-center transform translate-x-1 -translate-y-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">알림</h3>
            {unreadCount > 0 && onMarkAllAsRead && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-accent hover:underline"
              >
                모두 읽음
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                알림이 없습니다
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-accent/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-accent rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.timestamp}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.read && onMarkAsRead && (
                        <button
                          onClick={() => onMarkAsRead(notification.id)}
                          className="p-1 text-gray-400 hover:text-accent rounded"
                          aria-label="읽음 표시"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {onDismiss && (
                        <button
                          onClick={() => onDismiss(notification.id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded"
                          aria-label="삭제"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-gray-100">
            <button className="w-full text-center text-sm text-accent hover:underline py-1">
              모든 알림 보기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
