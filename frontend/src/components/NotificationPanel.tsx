import React, { useState, useEffect } from 'react';
import { Bell, Trash2, Check, Loader, AlertCircle, Mail, CheckCircle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

interface Notification {
  id: number;
  recipient_email: string;
  notification_type: string;
  subject: string;
  message: string;
  status: 'pending' | 'sent' | 'failed' | 'read';
  sent_at?: string;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { showSuccess, showError } = useNotification();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/notifications?limit=10'), {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
        const unread = (data.data || []).filter((n: Notification) => n.status !== 'read').length;
        setUnreadCount(unread);
      }
    } catch (error: any) {
      showError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(`/notifications/${notificationId}/read`), {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setNotifications(
          notifications.map((n) =>
            n.id === notificationId ? { ...n, status: 'read' } : n
          )
        );
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      showError('Failed to mark notification as read');
    }
  };

  const handleClearAll = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/notifications'), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
        showSuccess('All notifications cleared');
      }
    } catch (error) {
      showError('Failed to clear notifications');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'account_verification':
        return <CheckCircle size={16} />;
      case 'account_deletion':
        return <AlertCircle size={16} />;
      case 'survey_reminder':
        return <Bell size={16} />;
      case 'submission_confirmation':
        return <Check size={16} />;
      default:
        return <Mail size={16} />;
    }
  };

  const getNotificationColor = (status: string): string => {
    switch (status) {
      case 'read':
        return '#7a9a8a';
      case 'failed':
        return '#dc2626';
      default:
        return '#329D9C';
    }
  };

  return (
    <>
      <style>{css}</style>
      {isOpen && <div className="notification-overlay" onClick={onClose} />}
      <div className={`notification-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="notification-header">
          <h2>Notifications</h2>
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
          <button className="notification-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="notification-loading">
            <Loader size={24} className="spin" />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">
            <Bell size={32} />
            <p>No notifications yet</p>
          </div>
        ) : (
          <>
            <div className="notification-list">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.status === 'read' ? 'read' : ''}`}
                >
                  <div className="notification-icon" style={{ color: getNotificationColor(notification.status) }}>
                    {getNotificationIcon(notification.notification_type)}
                  </div>

                  <div className="notification-content">
                    <h4>{notification.subject}</h4>
                    <p>{notification.message}</p>
                    <small>
                      {new Date(notification.created_at).toLocaleString()}
                    </small>
                  </div>

                  {notification.status !== 'read' && (
                    <button
                      className="notification-action"
                      onClick={() => handleMarkAsRead(notification.id)}
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="notification-footer">
              <button
                className="notification-clear-btn"
                onClick={handleClearAll}
              >
                <Trash2 size={14} /> Clear All
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .notification-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 998;
  }

  .notification-panel {
    position: fixed;
    right: -400px;
    top: 0;
    width: 400px;
    height: 100vh;
    background: white;
    box-shadow: -4px 0 16px rgba(0, 0, 0, 0.15);
    z-index: 999;
    display: flex;
    flex-direction: column;
    transition: right 0.3s ease;
    font-family: 'DM Sans', sans-serif;
  }

  .notification-panel.open {
    right: 0;
    animation: slideIn 0.3s ease;
  }

  .notification-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1.5px solid #e2ede8;
    background: #f6fbf8;
  }

  .notification-header h2 {
    font-size: 18px;
    font-weight: 600;
    color: #205072;
    margin: 0;
  }

  .notification-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #329D9C 0%, #56C596 100%);
    color: white;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 700;
  }

  .notification-close {
    background: none;
    border: none;
    font-size: 24px;
    color: #7a9a8a;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .notification-close:hover {
    color: #dc2626;
  }

  .notification-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 60px 20px;
    color: #7a9a8a;
  }

  .notification-loading .spin {
    animation: spin 1s linear infinite;
  }

  .notification-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 60px 20px;
    color: #7a9a8a;
    text-align: center;
  }

  .notification-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .notification-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
    transition: all 0.2s;
    background: white;
  }

  .notification-item:hover {
    background: #f9fbfa;
  }

  .notification-item.read {
    opacity: 0.7;
  }

  .notification-icon {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .notification-content {
    flex: 1;
    min-width: 0;
  }

  .notification-content h4 {
    font-size: 14px;
    font-weight: 600;
    color: #205072;
    margin: 0 0 4px 0;
  }

  .notification-content p {
    font-size: 13px;
    color: #1c3a2e;
    margin: 0 0 4px 0;
    line-height: 1.4;
    word-break: break-word;
  }

  .notification-content small {
    font-size: 11px;
    color: #7a9a8a;
  }

  .notification-action {
    flex-shrink: 0;
    background: none;
    border: none;
    color: #329D9C;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .notification-action:hover {
    color: #16a34a;
  }

  .notification-footer {
    padding: 12px 20px;
    border-top: 1.5px solid #e2ede8;
    background: #f6fbf8;
    display: flex;
    justify-content: center;
  }

  .notification-clear-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: white;
    border: 1.5px solid #e2ede8;
    border-radius: 6px;
    color: #dc2626;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }

  .notification-clear-btn:hover {
    background: #fee2e2;
    border-color: #fca5a5;
  }

  @media (max-width: 768px) {
    .notification-panel {
      width: 100%;
      right: -100%;
    }
  }
`;
