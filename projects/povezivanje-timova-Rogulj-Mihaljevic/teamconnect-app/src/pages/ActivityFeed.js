import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './ActivityFeed.css';

function ActivityFeed() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Učitaj aktivnosti iz localStorage
    const savedActivities = localStorage.getItem('activities');
    if (savedActivities) {
      setActivities(JSON.parse(savedActivities));
    } else {
      // Demo aktivnosti
      const demoActivities = [
        {
          id: 1,
          type: 'user_join',
          user: 'danana',
          action: 'se pridružio/la aplikaciji',
          icon: '🎉',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 2,
          type: 'team_create',
          user: 'danana',
          action: 'kreirao/la novi tim',
          target: 'odbojaksi',
          icon: '✨',
          timestamp: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: 3,
          type: 'team_join',
          user: JSON.parse(localStorage.getItem('user') || '{}').username,
          action: 'se pridružio/la timu',
          target: 'odbojaksi',
          icon: '🤝',
          timestamp: new Date(Date.now() - 10800000).toISOString()
        }
      ];
      setActivities(demoActivities);
      localStorage.setItem('activities', JSON.stringify(demoActivities));
    }
  }, []);

  const getActivityColor = (type) => {
    switch (type) {
      case 'user_join': return '#4caf50';
      case 'team_create': return '#667eea';
      case 'team_join': return '#ff9800';
      case 'team_leave': return '#f44336';
      case 'team_full': return '#2196f3';
      default: return '#999';
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
    if (diffDays === 1) return 'Jučer';
    return `Prije ${diffDays} dana`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('hr-HR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupByDate = (activities) => {
    const groups = {};
    activities.forEach(activity => {
      const date = new Date(activity.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });
    return groups;
  };

  const groupedActivities = groupByDate(activities);

  return (
    <div className="activity-feed-page">
      <Navbar />
      
      <div className="activity-container">
        <div className="activity-header">
          <h1>📰 Aktivnosti</h1>
          <p>Vidi što se događa u TeamConnect zajednici</p>
        </div>

        <div className="activity-content">
          {activities.length === 0 ? (
            <div className="empty-feed card">
              <span className="empty-icon">📭</span>
              <h2>Nema aktivnosti</h2>
              <p>Kada se nešto dogodi, vidjet ćeš to ovdje!</p>
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                Istraži timove
              </button>
            </div>
          ) : (
            <div className="timeline">
              {Object.entries(groupedActivities).map(([date, dayActivities]) => (
                <div key={date} className="timeline-section">
                  <div className="timeline-date">
                    {new Date(date).toLocaleDateString('hr-HR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </div>
                  
                  {dayActivities.map(activity => (
                    <div key={activity.id} className="activity-item">
                      <div 
                        className="activity-icon" 
                        style={{ background: getActivityColor(activity.type) }}
                      >
                        {activity.icon}
                      </div>
                      
                      <div className="activity-content-box card">
                        <div className="activity-main">
                          <span className="activity-user">{activity.user}</span>
                          <span className="activity-action">{activity.action}</span>
                          {activity.target && (
                            <span className="activity-target">"{activity.target}"</span>
                          )}
                        </div>
                        <div className="activity-time">
                          {formatTime(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="activity-stats card">
          <h3>📊 Statistika</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{activities.filter(a => a.type === 'team_create').length}</div>
              <div className="stat-label">Kreirano timova</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{activities.filter(a => a.type === 'team_join').length}</div>
              <div className="stat-label">Pridruživanja</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{activities.filter(a => a.type === 'user_join').length}</div>
              <div className="stat-label">Novih korisnika</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityFeed;