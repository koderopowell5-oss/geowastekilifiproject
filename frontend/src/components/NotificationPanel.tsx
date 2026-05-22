import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../context/NotificationContext';
import { buildApiUrl } from '../config/api';

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

const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
};

const formatFullDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// ── Morphic logo loader (replaces Lucide <Loader>) ──
const MorphicLoader: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 180.2 180.2" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path className="ml-arc1-stroke"
      d="M90.1,25.79v21.44c-23.68,0-42.87,19.19-42.87,42.87h-21.44c0-35.52,28.79-64.31,64.31-64.31Z"
      fill="none" stroke="#329d9c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path className="ml-arc1-fill"
      d="M90.1,25.79v21.44c-23.68,0-42.87,19.19-42.87,42.87h-21.44c0-35.52,28.79-64.31,64.31-64.31Z"
      fill="#329d9c"/>
    <path className="ml-arc2-stroke"
      d="M154.4,90.1c0,5.76-.76,11.35-2.18,16.66-7.34,27.44-32.37,47.65-62.13,47.65v-21.44c17.77,0,33.01-10.81,39.51-26.21h-18.53c-4.91,6.18-12.48,10.13-20.99,10.13s-16.08-3.96-20.99-10.13c-3.63-4.57-5.8-10.35-5.81-16.63-.01-14.59,11.82-26.61,26.4-26.82,14.98-.21,27.18,11.86,27.18,26.79h37.51Z"
      fill="none" stroke="#329d9c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path className="ml-arc2-fill"
      d="M154.4,90.1c0,5.76-.76,11.35-2.18,16.66-7.34,27.44-32.37,47.65-62.13,47.65v-21.44c17.77,0,33.01-10.81,39.51-26.21h-18.53c-4.91,6.18-12.48,10.13-20.99,10.13s-16.08-3.96-20.99-10.13c-3.63-4.57-5.8-10.35-5.81-16.63-.01-14.59,11.82-26.61,26.4-26.82,14.98-.21,27.18,11.86,27.18,26.79h37.51Z"
      fill="#329d9c"/>
    <g className="ml-ticks">
      <line x1="180.2" y1="90.1" x2="154.4" y2="90.1" stroke="#329d9c" strokeWidth="2" strokeLinecap="round"/>
      <line x1="25.79" y1="90.1" x2="0"     y2="90.1" stroke="#329d9c" strokeWidth="2" strokeLinecap="round"/>
      <line x1="90.1"  y1="25.79" x2="90.1"  y2="0"   stroke="#329d9c" strokeWidth="2" strokeLinecap="round"/>
      <line x1="90.1"  y1="180.2" x2="90.1"  y2="154.4" stroke="#329d9c" strokeWidth="2" strokeLinecap="round"/>
    </g>
  </svg>
);

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { showSuccess, showError } = useNotification();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const unreadCount = notifications.filter(n => n.status !== 'read').length;

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/notifications?limit=20'), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
      }
    } catch (error: any) {
      showError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    } else {
      setTimeout(() => setSelectedNotification(null), 300);
    }
  }, [isOpen, fetchNotifications]);

  const handleSelectNotification = async (notification: Notification) => {
    setSelectedNotification(notification);
    if (notification.status !== 'read') {
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, status: 'read' } : n));
      try {
        const token = localStorage.getItem('token');
        await fetch(buildApiUrl(`/notifications/${notification.id}/read`), {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      } catch (error) {
        console.error('Failed to mark read on server');
      }
    }
  };

  const handleDelete = async (notificationId: number) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (selectedNotification?.id === notificationId) setSelectedNotification(null);
    try {
      const token = localStorage.getItem('token');
      await fetch(buildApiUrl(`/notifications/${notificationId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      showSuccess('Notification deleted');
    } catch (error) {
      console.error('Failed to delete on server');
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
    try {
      const token = localStorage.getItem('token');
      await fetch(buildApiUrl('/notifications/read-all'), {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      showSuccess('All notifications marked as read');
    } catch (error) {}
  };

  const handleClearAll = async () => {
    setNotifications([]);
    try {
      const token = localStorage.getItem('token');
      await fetch(buildApiUrl('/notifications'), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      showSuccess('All notifications cleared');
    } catch (error) {
      showError('Failed to clear notifications');
    }
  };

  const filteredNotifications = notifications.filter(n => filter === 'all' || n.status !== 'read');

  return (
    <>
      <style>{css}</style>
      {isOpen && <div className="notif-overlay" onClick={onClose} />}

      <div className={`notif-panel ${isOpen ? 'open' : ''}`}>

        {/* DETAIL VIEW */}
        <div className={`notif-detail-view ${selectedNotification ? 'active' : ''}`}>
          {selectedNotification && (
            <>
              <div className="notif-detail-header">
                <button className="notif-back-btn" onClick={() => setSelectedNotification(null)}>
                  ← Back
                </button>
              </div>
              <div className="notif-detail-body">
                <div className="notif-detail-meta">
                  {formatFullDate(selectedNotification.created_at)}
                </div>
                <h2 className="notif-detail-title">{selectedNotification.subject}</h2>
                <div className="notif-detail-message">
                  {selectedNotification.message}
                </div>
              </div>
              <div className="notif-detail-actions">
                <button
                  className="notif-text-btn danger"
                  onClick={() => handleDelete(selectedNotification.id)}
                >
                  Delete this notification
                </button>
              </div>
            </>
          )}
        </div>

        {/* LIST VIEW */}
        <div className="notif-list-view">
          <div className="notif-header">
            <div className="notif-header-left">
              <h2>Notifications</h2>
              {unreadCount > 0 && <span className="notif-badge">{unreadCount} unread</span>}
            </div>
            <button className="notif-close-btn" onClick={onClose}>Close</button>
          </div>

          <div className="notif-filters">
            <button
              className={`notif-filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`notif-filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread
            </button>
          </div>

          <div className="notif-scroll-area">
            {isLoading ? (
              <div className="notif-empty-state">
                <MorphicLoader />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="notif-empty-state">
                <p>No {filter === 'unread' ? 'unread ' : ''}notifications yet.</p>
              </div>
            ) : (
              <div className="notif-items">
                {filteredNotifications.map((notification) => {
                  const isUnread = notification.status !== 'read';
                  return (
                    <div
                      key={notification.id}
                      className={`notif-item ${!isUnread ? 'is-read' : ''}`}
                      onClick={() => handleSelectNotification(notification)}
                    >
                      <div className="notif-item-top">
                        <span className="notif-time">{timeAgo(notification.created_at)}</span>
                      </div>
                      <h4 className="notif-subject">
                        {isUnread && <span className="notif-dot" />}
                        {notification.subject}
                      </h4>
                      <p className="notif-snippet">{notification.message}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notif-footer">
              <button
                className="notif-text-btn"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
              >
                Mark all read
              </button>
              <button className="notif-text-btn danger" onClick={handleClearAll}>
                Clear all
              </button>
            </div>
          )}
        </div>

      </div>
    </>
  );
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* ── Morphic loader keyframes ── */
  @keyframes ml-draw { to { stroke-dashoffset: 0; } }

  @keyframes ml-arc1-loop {
    0%   { stroke-dashoffset: 600; }
    40%  { stroke-dashoffset: 0;   }
    60%  { stroke-dashoffset: 0;   }
    100% { stroke-dashoffset: 600; }
  }
  @keyframes ml-arc2-loop {
    0%   { stroke-dashoffset: 700; }
    40%  { stroke-dashoffset: 0;   }
    60%  { stroke-dashoffset: 0;   }
    100% { stroke-dashoffset: 700; }
  }
  @keyframes ml-fill1-loop {
    0%   { opacity: 0; }
    42%  { opacity: 0; }
    52%  { opacity: 1; }
    88%  { opacity: 1; }
    98%  { opacity: 0; }
    100% { opacity: 0; }
  }
  @keyframes ml-fill2-loop {
    0%   { opacity: 0; }
    46%  { opacity: 0; }
    56%  { opacity: 1; }
    88%  { opacity: 1; }
    98%  { opacity: 0; }
    100% { opacity: 0; }
  }
  @keyframes ml-tick-loop {
    0%   { stroke-dashoffset: 26; }
    40%  { stroke-dashoffset: 0;  }
    60%  { stroke-dashoffset: 0;  }
    100% { stroke-dashoffset: 26; }
  }

  .ml-arc1-stroke {
    stroke-dasharray: 600;
    stroke-dashoffset: 600;
    animation: ml-arc1-loop 3.2s cubic-bezier(0.4,0,0.2,1) infinite;
  }
  .ml-arc2-stroke {
    stroke-dasharray: 700;
    stroke-dashoffset: 700;
    animation: ml-arc2-loop 3.2s cubic-bezier(0.4,0,0.2,1) 0.18s infinite;
  }
  .ml-arc1-fill {
    opacity: 0;
    animation: ml-fill1-loop 3.2s ease-in-out infinite;
  }
  .ml-arc2-fill {
    opacity: 0;
    animation: ml-fill2-loop 3.2s ease-in-out 0.18s infinite;
  }
  .ml-ticks line {
    stroke-dasharray: 26;
    stroke-dashoffset: 26;
  }
  .ml-ticks line:nth-child(1) { animation: ml-tick-loop 3.2s ease-in-out 0.05s infinite; }
  .ml-ticks line:nth-child(2) { animation: ml-tick-loop 3.2s ease-in-out 0.10s infinite; }
  .ml-ticks line:nth-child(3) { animation: ml-tick-loop 3.2s ease-in-out 0.15s infinite; }
  .ml-ticks line:nth-child(4) { animation: ml-tick-loop 3.2s ease-in-out 0.20s infinite; }

  .notif-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(15, 33, 26, 0.2);
    backdrop-filter: blur(2px);
    z-index: 998;
    animation: fadeIn 0.3s ease;
  }

  .notif-panel {
    position: fixed;
    right: 0; top: 0;
    width: 440px;
    max-width: 100vw;
    height: 100vh;
    background: #ffffff;
    box-shadow: -8px 0 40px rgba(0, 0, 0, 0.08);
    z-index: 999;
    font-family: 'DM Sans', sans-serif;
    transform: translateX(100%);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    overflow: hidden;
  }

  .notif-panel.open {
    transform: translateX(0);
  }

  .notif-list-view {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .notif-detail-view {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: #ffffff;
    z-index: 10;
    display: flex;
    flex-direction: column;
    transform: translateX(100%);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .notif-detail-view.active {
    transform: translateX(0);
  }

  .notif-detail-view.active ~ .notif-list-view {
    transform: translateX(-20%);
  }

  .notif-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32px 28px 24px;
  }

  .notif-header-left {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  .notif-header h2 {
    font-size: 24px;
    font-weight: 500;
    color: #1c3a2e;
    margin: 0;
    letter-spacing: -0.5px;
  }

  .notif-badge {
    font-size: 12px;
    font-weight: 500;
    color: #329D9C;
    background: #e8f5f2;
    padding: 2px 10px;
    border-radius: 20px;
  }

  .notif-close-btn {
    background: none;
    border: none;
    font-size: 14px;
    color: #7a9a8a;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
    transition: color 0.2s;
  }

  .notif-close-btn:hover { color: #1c3a2e; }

  .notif-filters {
    display: flex;
    gap: 24px;
    padding: 0 28px;
    border-bottom: 1px solid #f0f4f2;
  }

  .notif-filter-btn {
    background: none;
    border: none;
    padding: 0 0 12px 0;
    font-size: 14px;
    font-weight: 500;
    color: #a0baba;
    cursor: pointer;
    font-family: inherit;
    position: relative;
    transition: color 0.2s;
  }

  .notif-filter-btn:hover { color: #1c3a2e; }
  .notif-filter-btn.active { color: #1c3a2e; }

  .notif-filter-btn.active::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 0;
    width: 100%; height: 2px;
    background: #1c3a2e;
  }

  .notif-scroll-area {
    flex: 1;
    overflow-y: auto;
  }

  .notif-items {
    display: flex;
    flex-direction: column;
  }

  .notif-item {
    padding: 20px 28px;
    border-bottom: 1px solid #f9fbfa;
    cursor: pointer;
    transition: background 0.2s;
  }

  .notif-item:hover { background: #fcfdfd; }
  .notif-item.is-read { opacity: 0.6; }
  .notif-item.is-read:hover { opacity: 1; }

  .notif-item-top { margin-bottom: 6px; }

  .notif-time {
    font-size: 11px;
    font-weight: 600;
    color: #a0baba;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .notif-subject {
    font-size: 16px;
    font-weight: 500;
    color: #1c3a2e;
    margin: 0 0 4px 0;
    line-height: 1.4;
  }

  .notif-dot {
    display: inline-block;
    width: 6px; height: 6px;
    background: #329D9C;
    border-radius: 50%;
    margin-right: 8px;
    vertical-align: middle;
    transform: translateY(-2px);
  }

  .notif-snippet {
    font-size: 14px;
    color: #7a9a8a;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.5;
  }

  .notif-detail-header { padding: 32px 28px 24px; }

  .notif-back-btn {
    background: none;
    border: none;
    font-size: 14px;
    color: #7a9a8a;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
    transition: color 0.2s;
  }

  .notif-back-btn:hover { color: #1c3a2e; }

  .notif-detail-body {
    flex: 1;
    padding: 0 28px;
    overflow-y: auto;
  }

  .notif-detail-meta {
    font-size: 12px;
    color: #a0baba;
    margin-bottom: 12px;
  }

  .notif-detail-title {
    font-size: 22px;
    font-weight: 500;
    color: #1c3a2e;
    margin: 0 0 24px;
    line-height: 1.3;
    letter-spacing: -0.5px;
  }

  .notif-detail-message {
    font-size: 15px;
    color: #4a6358;
    line-height: 1.8;
    white-space: pre-wrap;
  }

  .notif-detail-actions {
    padding: 24px 28px;
    border-top: 1px solid #f0f4f2;
  }

  .notif-footer {
    display: flex;
    justify-content: space-between;
    padding: 20px 28px;
    border-top: 1px solid #f0f4f2;
    background: #ffffff;
  }

  .notif-text-btn {
    background: none;
    border: none;
    font-size: 13px;
    font-weight: 500;
    color: #7a9a8a;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
    transition: color 0.2s;
  }

  .notif-text-btn:hover:not(:disabled) { color: #1c3a2e; }
  .notif-text-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .notif-text-btn.danger:hover:not(:disabled) { color: #dc2626; }

  .notif-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #a0baba;
    font-size: 14px;
  }
`;