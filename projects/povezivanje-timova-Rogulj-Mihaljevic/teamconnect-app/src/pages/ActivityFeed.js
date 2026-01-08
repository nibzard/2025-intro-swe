import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import './ActivityFeed.css';

function ActivityFeed() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [filter, page]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = `http://localhost:5000/api/activities/feed?page=${page}&limit=20`;
      if (filter !== 'all') {
        url += `&type=${filter}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (page === 1) {
          setActivities(data.activities);
        } else {
          setActivities([...activities, ...data.activities]);
        }
        
        setHasMore(data.pagination.page < data.pagination.pages);
      } else {
        const error = await response.json();
        setToast({ message: error.message, type: 'error' });
      }
    } catch (error) {
      console.error('Load activities error:', error);
      setToast({ message: 'Greška pri učitavanju aktivnosti', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
    setActivities([]);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(page + 1);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      team_created: '👥',
      team_joined: '🤝',
      match_played: '⚽',
      video_uploaded: '📹',
      tournament_created: '🏆',
      tournament_joined: '🎯',
      field_added: '🏟️',
      friend_added: '👋',
      achievement_unlocked: '🎖️',
      rank_up: '⬆️',
      goal_scored: '⚽',
      match_won: '🏆'
    };
    return icons[type] || '📌';
  };

  const getActivityText = (activity) => {
    const username = activity.user.username;
    
    switch (activity.type) {
      case 'team_created':
        return (
          <>
            <strong>{username}</strong> je kreirao tim{' '}
            <span className="highlight">{activity.data.teamName}</span>
          </>
        );
      case 'team_joined':
        return (
          <>
            <strong>{username}</strong> se pridružio timu{' '}
            <span className="highlight">{activity.data.teamName}</span>
          </>
        );
      case 'match_played':
        return (
          <>
            <strong>{username}</strong> je odigrao utakmicu protiv{' '}
            <span className="highlight">{activity.data.opponent}</span>
          </>
        );
      case 'match_won':
        return (
          <>
            <strong>{username}</strong> je pobijedio{' '}
            <span className="highlight">{activity.data.opponent}</span> rezultatom{' '}
            <span className="highlight">{activity.data.score}</span>
          </>
        );
      case 'video_uploaded':
        return (
          <>
            <strong>{username}</strong> je uploadao video{' '}
            <span className="highlight">{activity.data.videoTitle}</span>
          </>
        );
      case 'tournament_created':
        return (
          <>
            <strong>{username}</strong> je kreirao turnir{' '}
            <span className="highlight">{activity.data.tournamentName}</span>
          </>
        );
      case 'tournament_joined':
        return (
          <>
            <strong>{username}</strong> se prijavio na turnir{' '}
            <span className="highlight">{activity.data.tournamentName}</span> s timom{' '}
            <span className="highlight">{activity.data.teamName}</span>
          </>
        );
      case 'field_added':
        return (
          <>
            <strong>{username}</strong> je dodao teren{' '}
            <span className="highlight">{activity.data.fieldName}</span>
          </>
        );
      case 'friend_added':
        return (
          <>
            <strong>{username}</strong> i{' '}
            <strong>{activity.data.friendName}</strong> su sada prijatelji
          </>
        );
      case 'achievement_unlocked':
        return (
          <>
            <strong>{username}</strong> je otkljućao achievement{' '}
            <span className="highlight">{activity.data.achievementName}</span>
          </>
        );
      case 'rank_up':
        return (
          <>
            <strong>{username}</strong> je napredovao iz{' '}
            <span className="highlight">{activity.data.oldRank}</span> u{' '}
            <span className="highlight">{activity.data.newRank}</span> rank
          </>
        );
      case 'goal_scored':
        return (
          <>
            <strong>{username}</strong> je postigao gol
          </>
        );
      default:
        return (
          <>
            <strong>{username}</strong> je napravio nešto
          </>
        );
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Upravo sada';
    if (diffMins < 60) return `Prije ${diffMins} min`;
    if (diffHours < 24) return `Prije ${diffHours}h`;
    if (diffDays < 7) return `Prije ${diffDays} dana`;
    return date.toLocaleDateString('hr-HR');
  };

  if (loading && activities.length === 0) {
    return (
      <div className="activity-feed-page">
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Učitavanje aktivnosti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-feed-page">
      <Navbar />
      
      <div className="activity-feed-container">
        <div className="activity-feed-header">
          <h1>📰 Activity Feed</h1>
          <p>Vidi što se događa u TeamConnect zajednici</p>
        </div>

        <div className="activity-filters card">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            Sve aktivnosti
          </button>
          <button 
            className={`filter-btn ${filter === 'team_created' ? 'active' : ''}`}
            onClick={() => handleFilterChange('team_created')}
          >
            👥 Timovi
          </button>
          <button 
            className={`filter-btn ${filter === 'match_won' ? 'active' : ''}`}
            onClick={() => handleFilterChange('match_won')}
          >
            ⚽ Utakmice
          </button>
          <button 
            className={`filter-btn ${filter === 'video_uploaded' ? 'active' : ''}`}
            onClick={() => handleFilterChange('video_uploaded')}
          >
            📹 Videi
          </button>
          <button 
            className={`filter-btn ${filter === 'tournament_created' ? 'active' : ''}`}
            onClick={() => handleFilterChange('tournament_created')}
          >
            🏆 Turniri
          </button>
          <button 
            className={`filter-btn ${filter === 'rank_up' ? 'active' : ''}`}
            onClick={() => handleFilterChange('rank_up')}
          >
            ⬆️ Rank Up
          </button>
        </div>

        {activities.length === 0 ? (
          <div className="no-activities card">
            <span className="empty-icon">📰</span>
            <h3>Nema aktivnosti</h3>
            <p>Kada ti ili tvoji prijatelji nešto napravite, vidjet ćeš to ovdje!</p>
          </div>
        ) : (
          <>
            <div className="activities-list">
              {activities.map(activity => (
                <div key={activity._id} className="activity-item card">
                  <div className="activity-icon">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="activity-content">
                    <div className="activity-avatar">
                      {activity.user.avatar}
                    </div>
                    
                    <div className="activity-text">
                      <p>{getActivityText(activity)}</p>
                      <span className="activity-time">
                        {formatTime(activity.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="load-more-container">
                <button 
                  className="btn btn-secondary"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? 'Učitavanje...' : 'Učitaj više'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default ActivityFeed;