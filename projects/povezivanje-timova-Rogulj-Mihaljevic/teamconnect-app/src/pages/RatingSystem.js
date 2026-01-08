import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import './RatingSystem.css';

function RatingSystem() {
  const navigate = useNavigate();
  
  // ============ STATE ============
  const [players, setPlayers] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [activeTab, setActiveTab] = useState('leaderboard'); // leaderboard, achievements
  const [toast, setToast] = useState(null);

  // ============ EFFECTS ============
  useEffect(() => {
    loadRatings();
    if (activeTab === 'achievements') {
      loadAchievements();
    }
  }, [activeTab]);

  // ============ API FUNCTIONS ============
  const loadRatings = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/ratings/leaderboard?limit=100');

      if (response.ok) {
        const data = await response.json();
        setPlayers(data);
      } else {
        console.error('Failed to load ratings');
        loadDemoPlayers();
      }
    } catch (error) {
      console.error('Load ratings error:', error);
      loadDemoPlayers();
    } finally {
      setLoading(false);
    }
  };

  const loadAchievements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/ratings/achievements', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAchievements(data);
      } else {
        loadDemoAchievements();
      }
    } catch (error) {
      console.error('Load achievements error:', error);
      loadDemoAchievements();
    }
  };

  const handleRecalculateRating = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/ratings/recalculate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: '✅ Rating preračunat!', type: 'success' });
        loadRatings();
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (error) {
      console.error('Recalculate error:', error);
      setToast({ message: 'Greška pri preračunavanju ratinga', type: 'error' });
    }
  };

  // ============ DEMO DATA FUNCTIONS ============
  const loadDemoPlayers = () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const demo = [
      {
        _id: '1',
        username: currentUser.username || 'danana',
        avatar: currentUser.avatar || '👤',
        location: 'Zagreb, HR',
        position: 1,
        rank: 'pro',
        rating: {
          overall: 85,
          attack: 88,
          defense: 82,
          teamwork: 90,
          consistency: 85
        }
      },
      {
        _id: '2',
        username: 'marko123',
        avatar: '🧑',
        location: 'Split, HR',
        position: 2,
        rank: 'advanced',
        rating: {
          overall: 78,
          attack: 80,
          defense: 75,
          teamwork: 82,
          consistency: 76
        }
      },
      {
        _id: '3',
        username: 'ana_kos',
        avatar: '👩',
        location: 'Rijeka, HR',
        position: 3,
        rank: 'pro',
        rating: {
          overall: 82,
          attack: 85,
          defense: 80,
          teamwork: 83,
          consistency: 81
        }
      }
    ];
    setPlayers(demo);
  };

  const loadDemoAchievements = () => {
    const demo = [
      {
        id: '1',
        icon: '👑',
        name: 'MVP',
        description: 'Najbolji igrač utakmice 10+ puta',
        unlocked: true,
        progress: 12,
        required: 10
      },
      {
        id: '2',
        icon: '🤝',
        name: 'Team Player',
        description: '15+ asistencija u karijeri',
        unlocked: false,
        progress: 8,
        required: 15
      },
      {
        id: '3',
        icon: '⚽⚽⚽',
        name: 'Hat-trick Hero',
        description: '3+ gola u jednoj utakmici',
        unlocked: true,
        progress: 5,
        required: 1
      },
      {
        id: '4',
        icon: '🎯',
        name: 'Top Scorer',
        description: '50+ golova u karijeri',
        unlocked: false,
        progress: 32,
        required: 50
      },
      {
        id: '5',
        icon: '🛡️',
        name: 'Defender',
        description: '10+ clean sheets',
        unlocked: false,
        progress: 6,
        required: 10
      },
      {
        id: '6',
        icon: '🥅',
        name: 'Goalkeeper',
        description: '20+ obrana u jednoj utakmici',
        unlocked: false,
        progress: 0,
        required: 20
      }
    ];
    setAchievements(demo);
  };

  // ============ HELPER FUNCTIONS ============
  const getRankColor = (rank) => {
    const colors = {
      beginner: '#9e9e9e',
      intermediate: '#4caf50',
      advanced: '#ff9800',
      pro: '#e91e63',
      elite: '#9c27b0'
    };
    return colors[rank?.toLowerCase()] || colors.beginner;
  };

  const getRankIcon = (rank) => {
    const icons = {
      beginner: '🌱',
      intermediate: '⭐',
      advanced: '🔥',
      pro: '👑',
      elite: '💎'
    };
    return icons[rank?.toLowerCase()] || icons.beginner;
  };

  const filterPlayers = () => {
    let filtered = [...players];

    if (filter !== 'all') {
      filtered = filtered.filter(p => p.rank?.toLowerCase() === filter.toLowerCase());
    }

    filtered.sort((a, b) => {
      if (sortBy === 'rating') return (b.rating?.overall || 0) - (a.rating?.overall || 0);
      if (sortBy === 'position') return (a.position || 999) - (b.position || 999);
      return 0;
    });

    return filtered;
  };

  const filteredPlayers = filterPlayers();

  // ============ LOADING STATE ============
  if (loading && players.length === 0) {
    return (
      <div className="rating-system-page">
        <Navbar />
        <div className="loading">Učitavanje ratinga...</div>
      </div>
    );
  }

  // ============ RENDER ============
  return (
    <div className="rating-system-page">
      <Navbar />
      
      <div className="rating-container">
        {/* HEADER */}
        <div className="rating-header">
          <h1>⭐ Rating System</h1>
          <p>Leaderboard najboljih igrača</p>
        </div>

        {/* TABS */}
        <div className="rating-tabs">
          <button 
            className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            🏆 Leaderboard
          </button>
          <button 
            className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            🎖️ Achievements
          </button>
        </div>

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <>
            {/* FILTERS */}
            <div className="rating-filters card">
              <div className="filter-section">
                <label>Skill Level:</label>
                <div className="filter-buttons">
                  <button 
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                  >
                    Svi
                  </button>
                  <button 
                    className={`filter-btn ${filter === 'pro' ? 'active' : ''}`}
                    onClick={() => setFilter('pro')}
                  >
                    Pro
                  </button>
                  <button 
                    className={`filter-btn ${filter === 'advanced' ? 'active' : ''}`}
                    onClick={() => setFilter('advanced')}
                  >
                    Advanced
                  </button>
                  <button 
                    className={`filter-btn ${filter === 'intermediate' ? 'active' : ''}`}
                    onClick={() => setFilter('intermediate')}
                  >
                    Intermediate
                  </button>
                  <button 
                    className={`filter-btn ${filter === 'beginner' ? 'active' : ''}`}
                    onClick={() => setFilter('beginner')}
                  >
                    Beginner
                  </button>
                </div>
              </div>

              <div className="filter-section">
                <label>Sortiraj po:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="rating">Rating</option>
                  <option value="position">Pozicija</option>
                </select>
              </div>
            </div>

            {/* CONTROLS */}
            <div className="rating-controls">
              <button 
                className="btn btn-secondary"
                onClick={handleRecalculateRating}
              >
                🔄 Preračunaj moj rating
              </button>
            </div>

            {/* LEADERBOARD */}
            <div className="leaderboard">
              {filteredPlayers.length === 0 ? (
                <div className="empty-leaderboard card">
                  <span className="empty-icon">⭐</span>
                  <p>Nema igrača s ovim filterima</p>
                </div>
              ) : (
                filteredPlayers.map((player, index) => (
                  <div key={player._id} className="player-rating-card card">
                    <div className="rank-badge" style={{ background: getRankColor(player.rank) }}>
                      #{player.position}
                    </div>
                    
                    <div className="player-rating-info">
                      <div className="player-rating-header">
                        <div className="player-rating-avatar">{player.avatar}</div>
                        <div className="player-rating-details">
                          <h4>{player.username}</h4>
                          {player.location && <p className="player-rating-location">📍 {player.location}</p>}
                        </div>
                      </div>

                      <div className="rating-overall">
                        <span className="rating-label">Overall Rating</span>
                        <span className="rating-value">{player.rating?.overall || 0}</span>
                      </div>

                      <div className="rating-breakdown">
                        <div className="rating-stat">
                          <span className="stat-name">Attack</span>
                          <div className="stat-bar">
                            <div 
                              className="stat-fill"
                              style={{ width: `${player.rating?.attack || 0}%`, background: '#4caf50' }}
                            />
                          </div>
                          <span className="stat-value">{player.rating?.attack || 0}</span>
                        </div>

                        <div className="rating-stat">
                          <span className="stat-name">Defense</span>
                          <div className="stat-bar">
                            <div 
                              className="stat-fill"
                              style={{ width: `${player.rating?.defense || 0}%`, background: '#2196f3' }}
                            />
                          </div>
                          <span className="stat-value">{player.rating?.defense || 0}</span>
                        </div>

                        <div className="rating-stat">
                          <span className="stat-name">Teamwork</span>
                          <div className="stat-bar">
                            <div 
                              className="stat-fill"
                              style={{ width: `${player.rating?.teamwork || 0}%`, background: '#ff9800' }}
                            />
                          </div>
                          <span className="stat-value">{player.rating?.teamwork || 0}</span>
                        </div>

                        <div className="rating-stat">
                          <span className="stat-name">Consistency</span>
                          <div className="stat-bar">
                            <div 
                              className="stat-fill"
                              style={{ width: `${player.rating?.consistency || 0}%`, background: '#9c27b0' }}
                            />
                          </div>
                          <span className="stat-value">{player.rating?.consistency || 0}</span>
                        </div>
                      </div>

                      <div className="player-rank-badge" style={{ background: getRankColor(player.rank) }}>
                        {getRankIcon(player.rank)} {player.rank?.toUpperCase() || 'BEGINNER'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ACHIEVEMENTS TAB */}
        {activeTab === 'achievements' && (
          <div className="achievements-section">
            <div className="achievements-header">
              <h2>🏆 Moji Achievements</h2>
              <p>Otkljućaj achievements igranjem utakmica i postizanjem ciljeva</p>
            </div>

            {achievements.length === 0 ? (
              <div className="no-achievements card">
                <span className="empty-icon">🎖️</span>
                <p>Još nemaš achievements. Igraj utakmice da ih otkljućaš!</p>
              </div>
            ) : (
              <div className="achievements-grid">
                {achievements.map(achievement => (
                  <div 
                    key={achievement.id} 
                    className={`achievement-card card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className="achievement-icon">{achievement.icon}</div>
                    <h4>{achievement.name}</h4>
                    <p>{achievement.description}</p>
                    
                    {!achievement.unlocked && (
                      <div className="achievement-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${(achievement.progress / achievement.required) * 100}%` }}
                          />
                        </div>
                        <span className="progress-text">
                          {achievement.progress}/{achievement.required}
                        </span>
                      </div>
                    )}
                    
                    {achievement.unlocked && (
                      <div className="achievement-unlocked">
                        ✅ Otkljućano!
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default RatingSystem;