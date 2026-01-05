import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import './RatingSystem.css';

function RatingSystem() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pro, advanced, intermediate, beginner
  const [sortBy, setSortBy] = useState('rating'); // rating, matches, achievements
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = () => {
    const saved = localStorage.getItem('playerRatings');
    if (saved) {
      setPlayers(JSON.parse(saved));
    } else {
      // Demo igrači
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const demo = [
        {
          id: 1,
          username: currentUser.username || 'danana',
          avatar: currentUser.avatar || '👤',
          rating: 4.8,
          skillLevel: 'Pro',
          matches: 45,
          wins: 32,
          losses: 13,
          goalsScored: 67,
          assists: 28,
          achievements: ['MVP', 'Team Player', 'Hat-trick Hero'],
          sport: '⚽ Nogomet'
        },
        {
          id: 2,
          username: 'marko123',
          avatar: '🧑',
          rating: 4.5,
          skillLevel: 'Napredan',
          matches: 38,
          wins: 25,
          losses: 13,
          goalsScored: 52,
          assists: 19,
          achievements: ['Team Player'],
          sport: '⚽ Nogomet'
        },
        {
          id: 3,
          username: 'ana_kos',
          avatar: '👩',
          rating: 4.7,
          skillLevel: 'Pro',
          matches: 41,
          wins: 30,
          losses: 11,
          goalsScored: 61,
          assists: 24,
          achievements: ['MVP', 'Top Scorer'],
          sport: '🏀 Košarka'
        }
      ];
      setPlayers(demo);
      localStorage.setItem('playerRatings', JSON.stringify(demo));
    }
  };

  const getSkillLevelColor = (level) => {
    const colors = {
      'Početnik': '#9e9e9e',
      'Srednji': '#4caf50',
      'Napredan': '#ff9800',
      'Pro': '#e91e63'
    };
    return colors[level] || colors['Početnik'];
  };

  const getAchievementIcon = (achievement) => {
    const icons = {
      'MVP': '👑',
      'Team Player': '🤝',
      'Hat-trick Hero': '⚽⚽⚽',
      'Top Scorer': '🎯',
      'Defender': '🛡️',
      'Goalkeeper': '🥅',
      'Playmaker': '🎨'
    };
    return icons[achievement] || '🏆';
  };

  const filterPlayers = () => {
    let filtered = [...players];

    if (filter !== 'all') {
      filtered = filtered.filter(p => p.skillLevel.toLowerCase() === filter.toLowerCase());
    }

    filtered.sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'matches') return b.matches - a.matches;
      if (sortBy === 'achievements') return b.achievements.length - a.achievements.length;
      return 0;
    });

    return filtered;
  };

  const filteredPlayers = filterPlayers();

  return (
    <div className="rating-system-page">
      <Navbar />
      
      <div className="rating-container">
        <div className="rating-header">
          <h1>⭐ Rating System</h1>
          <p>Leaderboard najboljih igrača</p>
        </div>

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
                className={`filter-btn ${filter === 'napredan' ? 'active' : ''}`}
                onClick={() => setFilter('napredan')}
              >
                Napredan
              </button>
              <button 
                className={`filter-btn ${filter === 'srednji' ? 'active' : ''}`}
                onClick={() => setFilter('srednji')}
              >
                Srednji
              </button>
              <button 
                className={`filter-btn ${filter === 'početnik' ? 'active' : ''}`}
                onClick={() => setFilter('početnik')}
              >
                Početnik
              </button>
            </div>
          </div>

          <div className="filter-section">
            <label>Sortiraj po:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="rating">Rating</option>
              <option value="matches">Broj utakmica</option>
              <option value="achievements">Achievements</option>
            </select>
          </div>
        </div>

        <div className="leaderboard">
          {filteredPlayers.length === 0 ? (
            <div className="empty-leaderboard card">
              <span className="empty-icon">⭐</span>
              <p>Nema igrača s ovim filterima</p>
            </div>
          ) : (
            filteredPlayers.map((player, index) => (
              <div key={player.id} className="player-card card">
                <div className="player-rank">
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && `#${index + 1}`}
                </div>

                <div className="player-avatar-large">
                  {player.avatar}
                </div>

                <div className="player-info">
                  <h3>{player.username}</h3>
                  <div className="player-sport">{player.sport}</div>
                </div>

                <div className="player-rating">
                  <div className="rating-value">
                    {'⭐'.repeat(Math.floor(player.rating))}
                    <span className="rating-number">{player.rating.toFixed(1)}</span>
                  </div>
                  <div 
                    className="skill-level"
                    style={{ background: getSkillLevelColor(player.skillLevel) }}
                  >
                    {player.skillLevel}
                  </div>
                </div>

                <div className="player-stats">
                  <div className="stat-item">
                    <span className="stat-value">{player.matches}</span>
                    <span className="stat-label">Utakmica</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{player.wins}</span>
                    <span className="stat-label">Pobjede</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{((player.wins / player.matches) * 100).toFixed(0)}%</span>
                    <span className="stat-label">Win Rate</span>
                  </div>
                </div>

                <div className="player-achievements">
                  {player.achievements.map((ach, idx) => (
                    <div key={idx} className="achievement-badge" title={ach}>
                      {getAchievementIcon(ach)}
                    </div>
                  ))}
                </div>

                <button 
                  className="btn btn-secondary btn-small"
                  onClick={() => setToast({ message: 'Profil stranica dolazi uskoro!', type: 'info' })}
                >
                  Vidi profil
                </button>
              </div>
            ))
          )}
        </div>

        <div className="achievement-list card">
          <h2>🏆 Dostupni Achievements</h2>
          <div className="achievements-grid">
            <div className="achievement-item">
              <span className="ach-icon">👑</span>
              <div>
                <h4>MVP</h4>
                <p>Najbolji igrač utakmice 10+ puta</p>
              </div>
            </div>
            <div className="achievement-item">
              <span className="ach-icon">🤝</span>
              <div>
                <h4>Team Player</h4>
                <p>15+ asistencija u karijeri</p>
              </div>
            </div>
            <div className="achievement-item">
              <span className="ach-icon">⚽⚽⚽</span>
              <div>
                <h4>Hat-trick Hero</h4>
                <p>3+ gola u jednoj utakmici</p>
              </div>
            </div>
            <div className="achievement-item">
              <span className="ach-icon">🎯</span>
              <div>
                <h4>Top Scorer</h4>
                <p>50+ golova u karijeri</p>
              </div>
            </div>
            <div className="achievement-item">
              <span className="ach-icon">🛡️</span>
              <div>
                <h4>Defender</h4>
                <p>10+ clean sheets</p>
              </div>
            </div>
            <div className="achievement-item">
              <span className="ach-icon">🥅</span>
              <div>
                <h4>Goalkeeper</h4>
                <p>20+ obrana u jednoj utakmici</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default RatingSystem;