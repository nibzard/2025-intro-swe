import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import './TournamentDetail.css';
import BracketGenerator from '../components/Bracketgenerator';

function TournamentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadTournament();
  }, [id]);

  const loadTournament = () => {
    const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
    const found = tournaments.find(t => t.id === parseInt(id));
    if (found) {
      setTournament(found);
    } else {
      setToast({ message: 'Turnir ne postoji!', type: 'error' });
      setTimeout(() => navigate('/tournaments'), 2000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('hr-HR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { text: 'U tijeku', color: '#4caf50' },
      upcoming: { text: 'Uskoro', color: '#ff9800' },
      finished: { text: 'Završeno', color: '#999' }
    };
    return badges[status] || badges.upcoming;
  };

  if (!tournament) {
    return (
      <div className="tournament-detail-page">
        <Navbar />
        <div className="loading">Učitavanje turnira...</div>
      </div>
    );
  }

  return (
    <div className="tournament-detail-page">
      <Navbar />
      
      <div className="tournament-detail-container">
        <div className="tournament-hero">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-sport">{tournament.sport}</span>
              <span 
                className="hero-status"
                style={{ 
                  background: tournament.status === 'active' ? '#4caf50' : 
                              tournament.status === 'upcoming' ? '#ff9800' : '#999' 
                }}
              >
                {tournament.status === 'active' ? 'U tijeku' : 
                 tournament.status === 'upcoming' ? 'Uskoro' : 'Završeno'}
              </span>
            </div>
            <h1>{tournament.name}</h1>
            <p className="hero-location">📍 {tournament.city}, {tournament.location}</p>
            <p className="hero-dates">
              📅 {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
            </p>
          </div>
        </div>

        <div className="tournament-tabs">
          <button 
            className={`tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            ℹ️ Informacije
          </button>
          <button 
            className={`tab ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            👥 Timovi ({tournament.registeredTeams}/{tournament.maxTeams})
          </button>
          <button 
            className={`tab ${activeTab === 'bracket' ? 'active' : ''}`}
            onClick={() => setActiveTab('bracket')}
          >
            🏆 Raspored
          </button>
          <button 
            className={`tab ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            ⚽ Utakmice
          </button>
        </div>

        <div className="tournament-content card">
          {/* INFO TAB */}
          {activeTab === 'info' && (
            <div className="tournament-info-tab">
              <h2>ℹ️ O turniru</h2>
              
              {tournament.description && (
                <div className="tournament-full-description">
                  <p>{tournament.description}</p>
                </div>
              )}

              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Format:</span>
                  <span className="info-value">
                    {tournament.format === 'knockout' ? 'Knockout (Eliminacije)' : 'Liga'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Broj timova:</span>
                  <span className="info-value">{tournament.maxTeams}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Igrača po timu:</span>
                  <span className="info-value">{tournament.teamSize}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Kotizacija:</span>
                  <span className="info-value">
                    {tournament.entryFee > 0 ? `${tournament.entryFee} kn` : 'Besplatno'}
                  </span>
                </div>
                {tournament.prize && (
                  <div className="info-item">
                    <span className="info-label">Nagrada:</span>
                    <span className="info-value">{tournament.prize}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-label">Organizator:</span>
                  <span className="info-value">{tournament.creator}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className="info-value">{getStatusBadge(tournament.status).text}</span>
                </div>
              </div>

              <div className="tournament-register-section">
                {tournament.registeredTeams < tournament.maxTeams ? (
                  <>
                    <p className="register-info">
                      Još uvijek ima mjesta! Prijavi svoj tim i sudjeluj u turniru.
                    </p>
                    <button 
                      className="btn btn-primary btn-large"
                      onClick={() => navigate(`/tournament/${tournament.id}/register`)}
                    >
                      🏆 Prijavi tim
                    </button>
                  </>
                ) : (
                  <div className="register-full">
                    <span className="full-icon">✓</span>
                    <p>Turnir je popunjen. Svi timovi su prijavljeni!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TEAMS TAB */}
          {activeTab === 'teams' && (
            <div className="teams-list-tab">
              <h2>👥 Prijavljeni timovi</h2>
              {tournament.teams && tournament.teams.length > 0 ? (
                <div className="registered-teams-list">
                  {tournament.teams.map((team, index) => (
                    <div key={index} className="registered-team-item">
                      <div className="team-number">#{index + 1}</div>
                      <div className="team-details">
                        <h4>{team.name}</h4>
                        <p>{team.players} igrača</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-teams-registered">Još nema prijavljenih timova</p>
              )}
            </div>
          )}

          {/* BRACKET TAB */}
          {activeTab === 'bracket' && (
            <div className="bracket-tab">
              {tournament.teams && tournament.teams.length >= 2 ? (
                <BracketGenerator 
                  teams={tournament.teams}
                  matches={tournament.matches || []}
                  onUpdateMatch={(match) => console.log('Update match:', match)}
                />
              ) : (
                <div className="no-bracket-container">
                  <p className="no-bracket">Bracket će biti generiran kada se prijavi dovoljno timova</p>
                </div>
              )}
            </div>
          )}

          {/* MATCHES TAB */}
          {activeTab === 'matches' && (
            <div className="matches-tab">
              <h2>⚽ Utakmice</h2>
              <p>Utakmice će biti prikazane ovdje kada turnir počne</p>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default TournamentDetail;