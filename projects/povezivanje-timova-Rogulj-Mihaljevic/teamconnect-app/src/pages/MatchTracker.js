import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import './MatchTracker.css';

function MatchTracker() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [toast, setToast] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    type: 'goal',
    team: 'home',
    player: '',
    minute: '',
    description: ''
  });

  useEffect(() => {
    loadMatch();
  }, [matchId]);

  const loadMatch = () => {
    const saved = localStorage.getItem('matches');
    if (saved) {
      const matches = JSON.parse(saved);
      const found = matches.find(m => m.id === parseInt(matchId));
      if (found) {
        setMatch(found);
      } else {
        createDemoMatch();
      }
    } else {
      createDemoMatch();
    }
  };

  const createDemoMatch = () => {
    const demoMatch = {
      id: matchId ? parseInt(matchId) : Date.now(),
      homeTeam: {
        name: 'Plavi Lavovi',
        logo: '🦁',
        score: 2,
        players: ['Marko', 'Ivan', 'Luka', 'Tomislav', 'Petar']
      },
      awayTeam: {
        name: 'Crveni Tigrovi',
        logo: '🐯',
        score: 1,
        players: ['Ana', 'Maja', 'Petra', 'Nina', 'Sara']
      },
      sport: '⚽ Nogomet',
      date: new Date().toISOString(),
      status: 'live', // live, finished, scheduled
      currentMinute: 67,
      events: [
        {
          id: 1,
          type: 'goal',
          team: 'home',
          player: 'Marko',
          minute: 15,
          description: 'Pogodak glavom nakon kornera',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 2,
          type: 'goal',
          team: 'away',
          player: 'Ana',
          minute: 34,
          description: 'Prekrasan udarac s 20 metara',
          timestamp: new Date(Date.now() - 2400000).toISOString()
        },
        {
          id: 3,
          type: 'yellow_card',
          team: 'home',
          player: 'Ivan',
          minute: 52,
          description: 'Fauliranje protivničkog igrača',
          timestamp: new Date(Date.now() - 900000).toISOString()
        },
        {
          id: 4,
          type: 'goal',
          team: 'home',
          player: 'Luka',
          minute: 65,
          description: 'Kontranapada i precizno izvođenje',
          timestamp: new Date(Date.now() - 120000).toISOString()
        }
      ],
      statistics: {
        home: {
          possession: 58,
          shots: 14,
          shotsOnTarget: 7,
          corners: 6,
          fouls: 8
        },
        away: {
          possession: 42,
          shots: 9,
          shotsOnTarget: 4,
          corners: 3,
          fouls: 12
        }
      }
    };
    setMatch(demoMatch);
    saveMatch(demoMatch);
  };

  const saveMatch = (matchData) => {
    const saved = localStorage.getItem('matches');
    let matches = saved ? JSON.parse(saved) : [];
    const index = matches.findIndex(m => m.id === matchData.id);
    
    if (index >= 0) {
      matches[index] = matchData;
    } else {
      matches.push(matchData);
    }
    
    localStorage.setItem('matches', JSON.stringify(matches));
    setMatch(matchData);
  };

  const handleAddEvent = () => {
    if (!eventForm.player || !eventForm.minute) {
      setToast({ message: 'Popuni sva obavezna polja!', type: 'error' });
      return;
    }

    const newEvent = {
      id: Date.now(),
      ...eventForm,
      minute: parseInt(eventForm.minute),
      timestamp: new Date().toISOString()
    };

    const updatedMatch = {
      ...match,
      events: [...match.events, newEvent].sort((a, b) => a.minute - b.minute)
    };

    // Ažuriraj rezultat ako je gol
    if (eventForm.type === 'goal') {
      if (eventForm.team === 'home') {
        updatedMatch.homeTeam.score += 1;
      } else {
        updatedMatch.awayTeam.score += 1;
      }
    }

    saveMatch(updatedMatch);
    setShowEventModal(false);
    setEventForm({
      type: 'goal',
      team: 'home',
      player: '',
      minute: '',
      description: ''
    });
    setToast({ message: 'Event dodan! ⚽', type: 'success' });
  };

  const getEventIcon = (type) => {
    const icons = {
      goal: '⚽',
      yellow_card: '🟨',
      red_card: '🟥',
      substitution: '🔄',
      injury: '🏥',
      penalty: '🎯'
    };
    return icons[type] || '📌';
  };

  const getEventLabel = (type) => {
    const labels = {
      goal: 'Gol',
      yellow_card: 'Žuti karton',
      red_card: 'Crveni karton',
      substitution: 'Izmjena',
      injury: 'Ozljeda',
      penalty: 'Penal'
    };
    return labels[type] || 'Event';
  };

  const endMatch = () => {
    const updatedMatch = {
      ...match,
      status: 'finished',
      currentMinute: 90
    };
    saveMatch(updatedMatch);
    setToast({ message: 'Utakmica završena! 🏁', type: 'success' });
  };

  if (!match) {
    return (
      <div className="match-tracker-page">
        <Navbar />
        <div className="loading">Učitavanje utakmice...</div>
      </div>
    );
  }

  return (
    <div className="match-tracker-page">
      <Navbar />
      
      <div className="match-tracker-container">
        <div className="match-header">
          <button className="back-btn" onClick={() => navigate('/my-teams')}>
            ← Natrag
          </button>
          <div className="match-date">
            {new Date(match.date).toLocaleDateString('hr-HR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </div>
          <div className="match-status-badge" data-status={match.status}>
            {match.status === 'live' && `⚡ UŽIVO - ${match.currentMinute}'`}
            {match.status === 'finished' && '🏁 ZAVRŠENO'}
            {match.status === 'scheduled' && '📅 NADOLAZEĆE'}
          </div>
        </div>

        <div className="scoreboard card">
          <div className="team-section home-team">
            <div className="team-logo">{match.homeTeam.logo}</div>
            <h2>{match.homeTeam.name}</h2>
            <div className="team-score">{match.homeTeam.score}</div>
          </div>

          <div className="scoreboard-center">
            <div className="vs-divider">VS</div>
            <div className="match-sport">{match.sport}</div>
          </div>

          <div className="team-section away-team">
            <div className="team-logo">{match.awayTeam.logo}</div>
            <h2>{match.awayTeam.name}</h2>
            <div className="team-score">{match.awayTeam.score}</div>
          </div>
        </div>

        <div className="match-controls card">
          {match.status === 'live' && (
            <>
              <button 
                className="btn btn-primary"
                onClick={() => setShowEventModal(true)}
              >
                + Dodaj event
              </button>
              <button 
                className="btn btn-secondary"
                onClick={endMatch}
              >
                🏁 Završi utakmicu
              </button>
            </>
          )}
          {match.status === 'finished' && (
            <div className="match-finished-notice">
              <span className="finish-icon">🏁</span>
              <p>Utakmica je završena</p>
            </div>
          )}
        </div>

        <div className="match-content">
          <div className="match-timeline card">
            <h3>⏱️ Timeline događaja</h3>
            {match.events.length === 0 ? (
              <div className="no-events">
                <p>Još nema događaja</p>
              </div>
            ) : (
              <div className="timeline-events">
                {match.events.map(event => (
                  <div 
                    key={event.id} 
                    className={`timeline-event ${event.team}-event`}
                  >
                    <div className="event-minute">{event.minute}'</div>
                    <div className="event-icon">{getEventIcon(event.type)}</div>
                    <div className="event-details">
                      <div className="event-header">
                        <span className="event-type">{getEventLabel(event.type)}</span>
                        <span className="event-player">{event.player}</span>
                      </div>
                      {event.description && (
                        <p className="event-description">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="match-statistics card">
            <h3>📊 Statistika</h3>
            <div className="stat-bars">
              <div className="stat-item">
                <div className="stat-label">Posjed lopte</div>
                <div className="stat-bar-container">
                  <div className="stat-value home">{match.statistics.home.possession}%</div>
                  <div className="stat-bar">
                    <div 
                      className="stat-fill home-fill"
                      style={{ width: `${match.statistics.home.possession}%` }}
                    />
                    <div 
                      className="stat-fill away-fill"
                      style={{ width: `${match.statistics.away.possession}%` }}
                    />
                  </div>
                  <div className="stat-value away">{match.statistics.away.possession}%</div>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-label">Udarci</div>
                <div className="stat-bar-container">
                  <div className="stat-value home">{match.statistics.home.shots}</div>
                  <div className="stat-bar">
                    <div 
                      className="stat-fill home-fill"
                      style={{ 
                        width: `${(match.statistics.home.shots / (match.statistics.home.shots + match.statistics.away.shots)) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="stat-value away">{match.statistics.away.shots}</div>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-label">Udarci u okvir</div>
                <div className="stat-bar-container">
                  <div className="stat-value home">{match.statistics.home.shotsOnTarget}</div>
                  <div className="stat-bar">
                    <div 
                      className="stat-fill home-fill"
                      style={{ 
                        width: `${(match.statistics.home.shotsOnTarget / (match.statistics.home.shotsOnTarget + match.statistics.away.shotsOnTarget)) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="stat-value away">{match.statistics.away.shotsOnTarget}</div>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-label">Korneri</div>
                <div className="stat-bar-container">
                  <div className="stat-value home">{match.statistics.home.corners}</div>
                  <div className="stat-bar">
                    <div 
                      className="stat-fill home-fill"
                      style={{ 
                        width: `${(match.statistics.home.corners / (match.statistics.home.corners + match.statistics.away.corners)) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="stat-value away">{match.statistics.away.corners}</div>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-label">Faulovi</div>
                <div className="stat-bar-container">
                  <div className="stat-value home">{match.statistics.home.fouls}</div>
                  <div className="stat-bar">
                    <div 
                      className="stat-fill home-fill"
                      style={{ 
                        width: `${(match.statistics.home.fouls / (match.statistics.home.fouls + match.statistics.away.fouls)) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="stat-value away">{match.statistics.away.fouls}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal za dodavanje eventa */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="add-event-modal" onClick={(e) => e.stopPropagation()}>
            <h2>+ Dodaj event</h2>
            
            <div className="form-group">
              <label>Tip eventa *</label>
              <select 
                value={eventForm.type}
                onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
              >
                <option value="goal">⚽ Gol</option>
                <option value="yellow_card">🟨 Žuti karton</option>
                <option value="red_card">🟥 Crveni karton</option>
                <option value="substitution">🔄 Izmjena</option>
                <option value="injury">🏥 Ozljeda</option>
                <option value="penalty">🎯 Penal</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tim *</label>
              <select 
                value={eventForm.team}
                onChange={(e) => setEventForm({ ...eventForm, team: e.target.value })}
              >
                <option value="home">{match.homeTeam.name}</option>
                <option value="away">{match.awayTeam.name}</option>
              </select>
            </div>

            <div className="form-group">
              <label>Igrač *</label>
              <select 
                value={eventForm.player}
                onChange={(e) => setEventForm({ ...eventForm, player: e.target.value })}
              >
                <option value="">Odaberi igrača</option>
                {(eventForm.team === 'home' ? match.homeTeam.players : match.awayTeam.players).map(player => (
                  <option key={player} value={player}>{player}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Minuta *</label>
              <input
                type="number"
                value={eventForm.minute}
                onChange={(e) => setEventForm({ ...eventForm, minute: e.target.value })}
                placeholder="npr. 45"
                min="1"
                max="120"
              />
            </div>

            <div className="form-group">
              <label>Opis (opcionalno)</label>
              <textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Dodaj kratak opis događaja..."
                rows="3"
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowEventModal(false)}
              >
                Odustani
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleAddEvent}
              >
                Dodaj event
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default MatchTracker;