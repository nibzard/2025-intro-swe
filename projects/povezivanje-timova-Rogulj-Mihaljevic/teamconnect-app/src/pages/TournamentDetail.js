import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import './TournamentDetail.css';

function TournamentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [activeTab, setActiveTab] = useState('info'); // info, teams, bracket
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

  const generateBracket = () => {
    if (!tournament || tournament.registeredTeams < tournament.maxTeams) {
      return <p>Bracket će biti dostupan kada se svi timovi prijave.</p>;
    }

    // Generiraj knockout bracket
    const rounds = Math.log2(tournament.maxTeams);
    return (
      <div className="bracket-container">
        <h3>Knockout Bracket</h3>
        <p className="bracket-info">Bracket će biti prikazan ovdje nakon završetka prijava</p>
        <div className="bracket-placeholder">
          <span className="bracket-icon">🏆</span>
          <p>Bracket sistem dolazi uskoro!</p>
        </div>
      </div>
    );
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
            🏆 Bracket
          </button>
        </div>

        <div className="tournament-content card">
          {activeTab === 'info' && (
            <div className="tournament-info-tab">
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
              </div>

              {tournament.description && (
                <div className="tournament-full-description">
                  <h3>O turniru</h3>
                  <p>{tournament.description}</p>
                </div>
              )}

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

          {activeTab === 'teams' && (
            <div className="teams-tab">
              {tournament.teams && tournament.teams.length > 0 ? (
                <div className="teams-list">
                  {tournament.teams.map((team, idx) => (
                    <div key={idx} className="team-item">
                      <div className="team-number">#{idx + 1}</div>
                      <div className="team-details">
                        <h4>{team.name}</h4>
                        <p>Kapetan: {team.captain}</p>
                        <p>Igrača: {team.players.length}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-teams">
                  <span className="empty-icon">👥</span>
                  <p>Još nema prijavljenih timova</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate(`/tournament/${tournament.id}/register`)}
                  >
                    Budi prvi!
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bracket' && (
            <div className="bracket-tab">
              {generateBracket()}
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default TournamentDetail;