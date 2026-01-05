import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import './Friends.css';

function Friends() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('friends'); // friends, rivals, requests, search
  const [friends, setFriends] = useState([]);
  const [rivals, setRivals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedRival, setSelectedRival] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Učitaj prijatelje
    const savedFriends = localStorage.getItem('friends');
    if (savedFriends) {
      setFriends(JSON.parse(savedFriends));
    } else {
      const demoFriends = [
        {
          id: 1,
          username: 'marko123',
          avatar: '🧑',
          sport: '⚽ Nogomet',
          status: 'online',
          wins: 45,
          losses: 12,
          winRate: 78.9,
          lastPlayed: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 2,
          username: 'ana_kos',
          avatar: '👩',
          sport: '🏀 Košarka',
          status: 'offline',
          wins: 38,
          losses: 15,
          winRate: 71.7,
          lastPlayed: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      setFriends(demoFriends);
      localStorage.setItem('friends', JSON.stringify(demoFriends));
    }

    // Učitaj rivalske timove
    const savedRivals = localStorage.getItem('rivals');
    if (savedRivals) {
      setRivals(JSON.parse(savedRivals));
    } else {
      const demoRivals = [
        {
          id: 1,
          teamName: 'Crveni Tigrovi',
          logo: '🐯',
          sport: '⚽ Nogomet',
          captain: 'petar456',
          headToHead: {
            wins: 5,
            losses: 3,
            draws: 2
          },
          lastMatch: {
            date: new Date(Date.now() - 604800000).toISOString(),
            result: 'win',
            score: '3-2'
          }
        }
      ];
      setRivals(demoRivals);
      localStorage.setItem('rivals', JSON.stringify(demoRivals));
    }

    // Učitaj zahtjeve
    const savedRequests = localStorage.getItem('friendRequests');
    if (savedRequests) {
      setRequests(JSON.parse(savedRequests));
    } else {
      const demoRequests = [
        {
          id: 1,
          username: 'luka789',
          avatar: '👨',
          sport: '🏐 Odbojka',
          message: 'Vidio sam te na utakmici prošli tjedan, odlično si igrao!',
          timestamp: new Date(Date.now() - 7200000).toISOString()
        }
      ];
      setRequests(demoRequests);
      localStorage.setItem('friendRequests', JSON.stringify(demoRequests));
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setToast({ message: 'Upiši korisničko ime!', type: 'error' });
      return;
    }

    // Simulacija pretrage (u pravoj app bi ovo bilo API call)
    const results = [
      {
        id: 3,
        username: searchQuery,
        avatar: '🧑‍🦱',
        sport: '🎾 Tenis',
        mutualFriends: 2,
        teams: 5
      },
      {
        id: 4,
        username: `${searchQuery}_pro`,
        avatar: '👨‍🦳',
        sport: '⚽ Nogomet',
        mutualFriends: 0,
        teams: 8
      }
    ];
    setSearchResults(results);
    setActiveTab('search');
  };

  const handleAddFriend = (user) => {
    const newFriend = {
      ...user,
      status: 'offline',
      wins: 0,
      losses: 0,
      winRate: 0,
      lastPlayed: new Date().toISOString()
    };
    
    const updated = [...friends, newFriend];
    setFriends(updated);
    localStorage.setItem('friends', JSON.stringify(updated));
    
    setToast({ message: `${user.username} dodan u prijatelje! 🤝`, type: 'success' });
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleRemoveFriend = (friendId) => {
    const updated = friends.filter(f => f.id !== friendId);
    setFriends(updated);
    localStorage.setItem('friends', JSON.stringify(updated));
    setToast({ message: 'Prijatelj uklonjen', type: 'info' });
  };

  const handleAcceptRequest = (requestId) => {
    const request = requests.find(r => r.id === requestId);
    if (request) {
      const newFriend = {
        id: Date.now(),
        username: request.username,
        avatar: request.avatar,
        sport: request.sport,
        status: 'offline',
        wins: 0,
        losses: 0,
        winRate: 0,
        lastPlayed: new Date().toISOString()
      };
      
      const updatedFriends = [...friends, newFriend];
      const updatedRequests = requests.filter(r => r.id !== requestId);
      
      setFriends(updatedFriends);
      setRequests(updatedRequests);
      
      localStorage.setItem('friends', JSON.stringify(updatedFriends));
      localStorage.setItem('friendRequests', JSON.stringify(updatedRequests));
      
      setToast({ message: `${request.username} je sada tvoj prijatelj! 🎉`, type: 'success' });
    }
  };

  const handleRejectRequest = (requestId) => {
    const updated = requests.filter(r => r.id !== requestId);
    setRequests(updated);
    localStorage.setItem('friendRequests', JSON.stringify(updated));
    setToast({ message: 'Zahtjev odbijen', type: 'info' });
  };

  const handleChallengeRival = (rival) => {
    setSelectedRival(rival);
    setShowChallengeModal(true);
  };

  const handleSendChallenge = () => {
    setShowChallengeModal(false);
    setToast({ message: `Challenge poslan timu ${selectedRival.teamName}! ⚔️`, type: 'success' });
    setSelectedRival(null);
  };

  const formatLastPlayed = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 24) return `Prije ${diffHours}h`;
    return `Prije ${diffDays} dana`;
  };

  return (
    <div className="friends-page">
      <Navbar />
      
      <div className="friends-container">
        <div className="friends-header">
          <h1>👥 Prijatelji & Rivali</h1>
          <p>Povežite se s igračima i izazovite rivale</p>
        </div>

        <div className="search-section card">
          <h3>🔍 Pretraži igrače</h3>
          <div className="search-bar">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Upiši korisničko ime..."
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn btn-primary" onClick={handleSearch}>
              Pretraži
            </button>
          </div>
        </div>

        <div className="friends-tabs">
          <button 
            className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            Prijatelji ({friends.length})
          </button>
          <button 
            className={`tab ${activeTab === 'rivals' ? 'active' : ''}`}
            onClick={() => setActiveTab('rivals')}
          >
            Rivali ({rivals.length})
          </button>
          <button 
            className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Zahtjevi ({requests.length})
            {requests.length > 0 && <span className="notification-dot"></span>}
          </button>
        </div>

        <div className="friends-content">
          {activeTab === 'friends' && (
            <div className="friends-list">
              {friends.length === 0 ? (
                <div className="empty-state card">
                  <span className="empty-icon">👥</span>
                  <h3>Nemaš prijatelja</h3>
                  <p>Pretraži igrače i dodaj ih u prijatelje!</p>
                </div>
              ) : (
                <div className="friends-grid">
                  {friends.map(friend => (
                    <div key={friend.id} className="friend-card card">
                      <div className="friend-header">
                        <div className="friend-avatar-wrapper">
                          <div className="friend-avatar">{friend.avatar}</div>
                          <div className={`status-indicator ${friend.status}`}></div>
                        </div>
                        <div className="friend-info">
                          <h4>{friend.username}</h4>
                          <p className="friend-sport">{friend.sport}</p>
                        </div>
                      </div>

                      <div className="friend-stats">
                        <div className="stat-box">
                          <span className="stat-value">{friend.wins}</span>
                          <span className="stat-label">Pobjede</span>
                        </div>
                        <div className="stat-box">
                          <span className="stat-value">{friend.losses}</span>
                          <span className="stat-label">Porazi</span>
                        </div>
                        <div className="stat-box">
                          <span className="stat-value">{friend.winRate.toFixed(1)}%</span>
                          <span className="stat-label">Win Rate</span>
                        </div>
                      </div>

                      <div className="friend-last-played">
                        Zadnja igra: {formatLastPlayed(friend.lastPlayed)}
                      </div>

                      <div className="friend-actions">
                        <button className="btn btn-secondary btn-small">
                          💬 Poruka
                        </button>
                        <button 
                          className="btn btn-danger btn-small"
                          onClick={() => handleRemoveFriend(friend.id)}
                        >
                          Ukloni
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'rivals' && (
            <div className="rivals-list">
              {rivals.length === 0 ? (
                <div className="empty-state card">
                  <span className="empty-icon">⚔️</span>
                  <h3>Nemaš rivalskih timova</h3>
                  <p>Izazovi druge timove i kreiraj rivalstva!</p>
                </div>
              ) : (
                <div className="rivals-grid">
                  {rivals.map(rival => (
                    <div key={rival.id} className="rival-card card">
                      <div className="rival-header">
                        <div className="rival-logo">{rival.logo}</div>
                        <div className="rival-info">
                          <h3>{rival.teamName}</h3>
                          <p className="rival-sport">{rival.sport}</p>
                          <p className="rival-captain">Kapetan: {rival.captain}</p>
                        </div>
                      </div>

                      <div className="head-to-head">
                        <h4>Head-to-Head</h4>
                        <div className="h2h-stats">
                          <div className="h2h-item win">
                            <span className="h2h-value">{rival.headToHead.wins}</span>
                            <span className="h2h-label">Pobjede</span>
                          </div>
                          <div className="h2h-item draw">
                            <span className="h2h-value">{rival.headToHead.draws}</span>
                            <span className="h2h-label">Neriješeno</span>
                          </div>
                          <div className="h2h-item loss">
                            <span className="h2h-value">{rival.headToHead.losses}</span>
                            <span className="h2h-label">Porazi</span>
                          </div>
                        </div>
                      </div>

                      {rival.lastMatch && (
                        <div className="last-match">
                          <h5>Zadnja utakmica</h5>
                          <div className="match-result">
                            <span className={`result-badge ${rival.lastMatch.result}`}>
                              {rival.lastMatch.result === 'win' && '🏆 Pobjeda'}
                              {rival.lastMatch.result === 'loss' && '❌ Poraz'}
                              {rival.lastMatch.result === 'draw' && '🤝 Neriješeno'}
                            </span>
                            <span className="match-score">{rival.lastMatch.score}</span>
                          </div>
                          <p className="match-date">
                            {new Date(rival.lastMatch.date).toLocaleDateString('hr-HR')}
                          </p>
                        </div>
                      )}

                      <button 
                        className="btn btn-primary"
                        onClick={() => handleChallengeRival(rival)}
                      >
                        ⚔️ Izazovi
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="requests-list">
              {requests.length === 0 ? (
                <div className="empty-state card">
                  <span className="empty-icon">📭</span>
                  <h3>Nemaš novih zahtjeva</h3>
                  <p>Kada te netko doda, vidjet ćeš to ovdje</p>
                </div>
              ) : (
                <div className="requests-grid">
                  {requests.map(request => (
                    <div key={request.id} className="request-card card">
                      <div className="request-header">
                        <div className="request-avatar">{request.avatar}</div>
                        <div className="request-info">
                          <h4>{request.username}</h4>
                          <p className="request-sport">{request.sport}</p>
                        </div>
                      </div>

                      {request.message && (
                        <p className="request-message">"{request.message}"</p>
                      )}

                      <p className="request-time">
                        {formatLastPlayed(request.timestamp)}
                      </p>

                      <div className="request-actions">
                        <button 
                          className="btn btn-primary"
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          ✓ Prihvati
                        </button>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          ✕ Odbij
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'search' && (
            <div className="search-results">
              {searchResults.length === 0 ? (
                <div className="empty-state card">
                  <span className="empty-icon">🔍</span>
                  <h3>Pretraži igrače</h3>
                  <p>Upiši korisničko ime gore i klikni Pretraži</p>
                </div>
              ) : (
                <div className="search-results-grid">
                  {searchResults.map(user => (
                    <div key={user.id} className="search-result-card card">
                      <div className="result-header">
                        <div className="result-avatar">{user.avatar}</div>
                        <div className="result-info">
                          <h4>{user.username}</h4>
                          <p className="result-sport">{user.sport}</p>
                        </div>
                      </div>

                      <div className="result-stats">
                        <p>👥 {user.mutualFriends} zajedničkih prijatelja</p>
                        <p>⚽ {user.teams} timova</p>
                      </div>

                      <button 
                        className="btn btn-primary"
                        onClick={() => handleAddFriend(user)}
                      >
                        + Dodaj prijatelja
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal za challenge */}
      {showChallengeModal && selectedRival && (
        <div className="modal-overlay" onClick={() => setShowChallengeModal(false)}>
          <div className="challenge-modal" onClick={(e) => e.stopPropagation()}>
            <h2>⚔️ Izazovi {selectedRival.teamName}</h2>
            
            <div className="challenge-info">
              <div className="challenge-logo">{selectedRival.logo}</div>
              <p>Pošalji challenge rivalskom timu i dogovori utakmicu!</p>
            </div>

            <div className="form-group">
              <label>Predloženi datum</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label>Vrijeme</label>
              <input type="time" />
            </div>

            <div className="form-group">
              <label>Lokacija</label>
              <input
                type="text"
                placeholder="npr. Stadion Poljud"
              />
            </div>

            <div className="form-group">
              <label>Poruka (opcionalno)</label>
              <textarea
                placeholder="Dodaj poruku protivničkom timu..."
                rows="3"
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowChallengeModal(false)}
              >
                Odustani
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSendChallenge}
              >
                Pošalji Challenge
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Friends;