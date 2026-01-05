import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

function NotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Učitaj notifikacije iz localStorage
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      const notifs = JSON.parse(savedNotifications);
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    }

    // Dodaj test notifikacije (samo za demo)
    const hasTestNotifs = localStorage.getItem('hasTestNotifs');
    if (!hasTestNotifs) {
      const testNotifications = [
        {
          id: 1,
          type: 'team_join',
          message: 'Dobrodošao/la u TeamConnect! 🎉',
          timestamp: new Date().toISOString(),
          read: false
        }
      ];
      localStorage.setItem('notifications', JSON.stringify(testNotifications));
      localStorage.setItem('hasTestNotifs', 'true');
      setNotifications(testNotifications);
      setUnreadCount(1);
    }
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Označi sve kao pročitano kad otvoriš
      const updatedNotifs = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updatedNotifs);
      localStorage.setItem('notifications', JSON.stringify(updatedNotifs));
      setUnreadCount(0);
    }
  };

  const handleClearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('notifications');
    localStorage.removeItem('hasTestNotifs');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'team_join': return '🎉';
      case 'team_leave': return '👋';
      case 'new_team': return '✨';
      case 'team_full': return '✅';
      default: return '📢';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Upravo sad';
    if (diffMins < 60) return `Prije ${diffMins} min`;
    if (diffHours < 24) return `Prije ${diffHours}h`;
    return `Prije ${diffDays} dana`;
  };

  return (
    <div className="notification-bell">
      <button className="bell-button" onClick={handleToggle}>
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="notification-overlay" onClick={() => setIsOpen(false)} />
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>Notifikacije</h3>
              {notifications.length > 0 && (
                <button className="clear-all" onClick={handleClearAll}>
                  Obriši sve
                </button>
              )}
            </div>

            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="no-notifications">
                  <span className="empty-icon">🔕</span>
                  <p>Nemaš novih notifikacija</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    className={`notification-item ${!notif.read ? 'unread' : ''}`}
                  >
                    <span className="notif-icon">{getNotificationIcon(notif.type)}</span>
                    <div className="notif-content">
                      <p className="notif-message">{notif.message}</p>
                      <span className="notif-time">{formatTime(notif.timestamp)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="notification-footer">
                <button onClick={() => { setIsOpen(false); navigate('/my-teams'); }}>
                  Vidi sve
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;