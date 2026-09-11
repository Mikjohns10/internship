import { useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { getNotifications, getUnreadCount, markAsRead as markAsReadApi, markAllAsRead as markAllAsReadApi } from '../../api/notifications.api';
import { formatDistanceToNow } from 'date-fns';
import './NotificationBell.css';
import { useState } from 'react';

export default function NotificationBell() {
  const { notifications, unreadCount, setNotifications, setUnreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const [notifs, count] = await Promise.all([
          getNotifications(),
          getUnreadCount(),
        ]);
        setNotifications(notifs);
        setUnreadCount(count);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };

    loadNotifications();
  }, [setNotifications, setUnreadCount]);

  const handleMarkRead = async (id: string) => {
    try {
      await markAsReadApi(id);
      markAsRead(id);
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsReadApi();
      markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const typeIcon: Record<string, string> = {
    TASK_ASSIGNED: '📋',
    TASK_STATUS_CHANGED: '🔄',
    TASK_OVERDUE: '⚠️',
  };

  return (
    <div className="notification-wrapper">
      <button className="notification-bell" onClick={() => setIsOpen(!isOpen)} id="notification-bell-btn">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="notification-backdrop" onClick={() => setIsOpen(false)} />
          <div className="notification-dropdown animate-slide-down" id="notification-dropdown">
            <div className="notification-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="btn btn-ghost btn-sm">
                  <Check size={14} /> Mark all read
                </button>
              )}
            </div>

            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="notification-empty">
                  <Bell size={24} strokeWidth={1.5} />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                    onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                  >
                    <span className="notification-type-icon">{typeIcon[notif.type] || '📌'}</span>
                    <div className="notification-content">
                      <p className="notification-message">{notif.message}</p>
                      <span className="notification-time">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {!notif.isRead && <div className="notification-dot" />}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
