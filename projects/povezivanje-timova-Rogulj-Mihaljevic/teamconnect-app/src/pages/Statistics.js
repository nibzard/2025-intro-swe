import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { getAllSports } from '../data/sports';
import './Statistics.css';

function Statistics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [selectedSport, setSelectedSport] = useState('');
  const [toast, setToast] = useState(null);
  const [showAddMatchModal, setShowAddMatchModal] = useState(false);
  const [showEditStatsModal, setShowEditStatsModal] = useState(false);
  
  const [matchForm, setMatchForm] = useState({
    date: new Date().toISOString().split('T')[0],
    opponent: '',
    result: 'win',
    score: '',
    goalsScored: 0,
    assists: 0,
    position: 'Napadač'
  });

  const [editForm, setEditForm] = useState({
    totalMatches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    goalsScored: 0,
    assists: 0,
    cleanSheets: 0,
    yellowCards: 0,
    redCards: 0
  });

  const sportsList = getAllSports();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadStats();
  }, [selectedSport]);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = selectedSport 
        ? `http://localhost:5000/api/stats?sport=${encodeURIComponent(selectedSport)}`
        : 'http://localhost:5000/api/stats';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setStats(data[0]); // Uzmi prvu statistiku (za odabrani sport)
          setEditForm({
            totalMatches: data[0].totalMatches || 0,
            wins: data[0].wins || 0,
            losses: data[0].losses || 0,
            draws: data[0].draws || 0,
            goalsScored: data[0].goalsScored || 0,
            assists: data[0].assists || 0,
            cleanSheets: data[0].cleanSheets || 0,
            yellowCards: data[0].yellowCards || 0,
            redCards: data[0].redCards || 0
          });
        } else {
          setStats(null);
        }
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const handleAddMatch = async () => {
    if (!selectedSport) {
      setToast({ message: 'Odaberi sport!', type: 'error' });
      return;
    }

    if (!matchForm.opponent || !matchForm.score) {
      setToast({ message: 'Popuni sva obavezna polja!', type: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/stats/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sport: selectedSport,
          matchData: matchForm
        })
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: '✅ Utakmica dodana!', type: 'success' });
        setShowAddMatchModal(false);
        setMatchForm({
          date: new Date().toISOString().split('T')[0],
          opponent: '',
          result: 'win',
          score: '',
          goalsScored: 0,
          assists: 0,
          position: 'Napadač'
        });
        loadStats();
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (error) {
      console.error('Add match error:', error);
      setToast({ message: 'Greška pri dodavanju utakmice', type: 'error' });
    }
  };

  const handleEditStats = async () => {
    if (!selectedSport) {
      setToast({ message: 'Odaberi sport!', type: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sport: selectedSport,
          stats: editForm
        })
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: '✅ Statistika ažurirana!', type: 'success' });
        setShowEditStatsModal(false);
        loadStats();
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (error) {
      console.error('Edit stats error:', error);
      setToast({ message: 'Greška pri ažuriranju statistike', type: 'error' });
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('Jesi li siguran da želiš obrisati ovu utakmicu?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/stats/match/${matchId}?sport=${encodeURIComponent(selectedSport)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        setToast({ message: 'Utakmica obrisana', type: 'info' });
        loadStats();
      }
    } catch (error) {
      console.error('Delete match error:', error);
      setToast({ message: 'Greška pri brisanju utakmice', type: 'error' });
    }
  };

  const calculateWinRate = () => {
    if (!stats || stats.totalMatches === 0) return 0;
    return ((stats.wins / stats.totalMatches) * 100).toFixed(1);
  };

  return (
    <div className="statistics-page">
      <Navbar />
      
      <div className="statistics-container">
        <div className="statistics-header">
          <h1>📊 Moja Statistika</h1>
          <p>Prati svoj napredak i performanse</p>
        </div>

        <div className="stats-controls card">
          <div className="form-group">
            <label>Odaberi sport</label>
            <select 
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
            >
              <option value="">-- Odaberi sport --</option>
              {sportsList.map(sport => (
                <option key={sport.id} value={sport.name}>{sport.name}</option>
              ))}
            </select>
          </div>

          {selectedSport && (
            <div className="stats-action-buttons">
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddMatchModal(true)}
              >
                + Dodaj utakmicu
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowEditStatsModal(true)}
              >
                ✏️ Uredi statistiku
              </button>
            </div>
          )}
        </div>

        {!selectedSport ? (
          <div className="empty-stats card">
            <span className="empty-icon">📊</span>
            <h3>Odaberi sport</h3>
            <p>Odaberi sport gore da vidiš svoju statistiku</p>
          </div>
        ) : !stats ? (
          <div className="empty-stats card">
            <span className="empty-icon">📊</span>
            <h3>Nema statistike</h3>
            <p>Dodaj svoju prvu utakmicu ili unesi statistiku ručno</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddMatchModal(true)}
            >
              + Dodaj utakmicu
            </button>
          </div>
        ) : (
          <>
            <div className="overview-stats">
              <div className="stat-card card">
                <div className="stat-icon">⚽</div>
                <div className="stat-content">
                  <h3>{stats.totalMatches}</h3>
                  <p>Ukupno utakmica</p>
                </div>
              </div>

              <div className="stat-card card win-card">
                <div className="stat-icon">🏆</div>
                <div className="stat-content">
                  <h3>{stats.wins}</h3>
                  <p>Pobjede</p>
                </div>
              </div>

              <div className="stat-card card loss-card">
                <div className="stat-icon">❌</div>
                <div className="stat-content">
                  <h3>{stats.losses}</h3>
                  <p>Porazi</p>
                </div>
              </div>

              <div className="stat-card card draw-card">
                <div className="stat-icon">🤝</div>
                <div className="stat-content">
                  <h3>{stats.draws}</h3>
                  <p>Neriješeno</p>
                </div>
              </div>

              <div className="stat-card card rate-card">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <h3>{calculateWinRate()}%</h3>
                  <p>Win Rate</p>
                </div>
              </div>

              <div className="stat-card card">
                <div className="stat-icon">⚽</div>
                <div className="stat-content">
                  <h3>{stats.goalsScored}</h3>
                  <p>Golovi</p>
                </div>
              </div>

              <div className="stat-card card">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <h3>{stats.assists}</h3>
                  <p>Asistencije</p>
                </div>
              </div>

              <div className="stat-card card">
                <div className="stat-icon">🛡️</div>
                <div className="stat-content">
                  <h3>{stats.cleanSheets}</h3>
                  <p>Clean Sheets</p>
                </div>
              </div>
            </div>

            {stats.matchHistory && stats.matchHistory.length > 0 && (
              <div className="match-history card">
                <h2>📅 Povijest utakmica</h2>
                <div className="matches-list">
                  {stats.matchHistory.slice().reverse().map((match) => (
                    <div key={match._id} className="match-item">
                      <div className="match-date">
                        {new Date(match.date).toLocaleDateString('hr-HR')}
                      </div>
                      <div className="match-details">
                        <div className={`match-result ${match.result}`}>
                          {match.result === 'win' && '🏆 Pobjeda'}
                          {match.result === 'loss' && '❌ Poraz'}
                          {match.result === 'draw' && '🤝 Neriješeno'}
                        </div>
                        <div className="match-opponent">vs {match.opponent}</div>
                        <div className="match-score">{match.score}</div>
                        {match.goalsScored > 0 && (
                          <div className="match-stats">
                            ⚽ {match.goalsScored} {match.assists > 0 && `| 🎯 ${match.assists}`}
                          </div>
                        )}
                      </div>
                      <button 
                        className="btn-delete-match"
                        onClick={() => handleDeleteMatch(match._id)}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal za dodavanje utakmice */}
      {showAddMatchModal && (
        <div className="modal-overlay" onClick={() => setShowAddMatchModal(false)}>
          <div className="add-match-modal" onClick={(e) => e.stopPropagation()}>
            <h2>⚽ Dodaj utakmicu</h2>

            <div className="form-group">
              <label>Datum *</label>
              <input
                type="date"
                value={matchForm.date}
                onChange={(e) => setMatchForm({ ...matchForm, date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label>Protivnik *</label>
              <input
                type="text"
                value={matchForm.opponent}
                onChange={(e) => setMatchForm({ ...matchForm, opponent: e.target.value })}
                placeholder="npr. Crveni Tigrovi"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Rezultat *</label>
                <select
                  value={matchForm.result}
                  onChange={(e) => setMatchForm({ ...matchForm, result: e.target.value })}
                >
                  <option value="win">🏆 Pobjeda</option>
                  <option value="loss">❌ Poraz</option>
                  <option value="draw">🤝 Neriješeno</option>
                </select>
              </div>

              <div className="form-group">
                <label>Rezultat *</label>
                <input
                  type="text"
                  value={matchForm.score}
                  onChange={(e) => setMatchForm({ ...matchForm, score: e.target.value })}
                  placeholder="npr. 3-2"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Golovi</label>
                <input
                  type="number"
                  value={matchForm.goalsScored}
                  onChange={(e) => setMatchForm({ ...matchForm, goalsScored: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Asistencije</label>
                <input
                  type="number"
                  value={matchForm.assists}
                  onChange={(e) => setMatchForm({ ...matchForm, assists: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Pozicija</label>
              <select
                value={matchForm.position}
                onChange={(e) => setMatchForm({ ...matchForm, position: e.target.value })}
              >
                <option value="Napadač">Napadač</option>
                <option value="Vezni">Vezni</option>
                <option value="Obrambeni">Obrambeni</option>
                <option value="Golman">Golman</option>
              </select>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowAddMatchModal(false)}
              >
                Odustani
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleAddMatch}
              >
                Dodaj utakmicu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal za uređivanje statistike */}
      {showEditStatsModal && (
        <div className="modal-overlay" onClick={() => setShowEditStatsModal(false)}>
          <div className="edit-stats-modal" onClick={(e) => e.stopPropagation()}>
            <h2>✏️ Uredi statistiku</h2>
            <p>Ručno unesi ili ažuriraj svoju statistiku</p>

            <div className="form-row">
              <div className="form-group">
                <label>Ukupno utakmica</label>
                <input
                  type="number"
                  value={editForm.totalMatches}
                  onChange={(e) => setEditForm({ ...editForm, totalMatches: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Pobjede</label>
                <input
                  type="number"
                  value={editForm.wins}
                  onChange={(e) => setEditForm({ ...editForm, wins: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Porazi</label>
                <input
                  type="number"
                  value={editForm.losses}
                  onChange={(e) => setEditForm({ ...editForm, losses: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Neriješeno</label>
                <input
                  type="number"
                  value={editForm.draws}
                  onChange={(e) => setEditForm({ ...editForm, draws: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Golovi</label>
                <input
                  type="number"
                  value={editForm.goalsScored}
                  onChange={(e) => setEditForm({ ...editForm, goalsScored: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Asistencije</label>
                <input
                  type="number"
                  value={editForm.assists}
                  onChange={(e) => setEditForm({ ...editForm, assists: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Clean Sheets</label>
                <input
                  type="number"
                  value={editForm.cleanSheets}
                  onChange={(e) => setEditForm({ ...editForm, cleanSheets: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Žuti kartoni</label>
                <input
                  type="number"
                  value={editForm.yellowCards}
                  onChange={(e) => setEditForm({ ...editForm, yellowCards: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowEditStatsModal(false)}
              >
                Odustani
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleEditStats}
              >
                Spremi promjene
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Statistics;