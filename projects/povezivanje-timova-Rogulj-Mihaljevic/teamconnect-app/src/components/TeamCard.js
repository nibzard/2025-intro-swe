import React from 'react';
import './TeamCard.css';

function TeamCard({ team, onJoin, onLeave, onDelete, onJoinWaitlist, showActions = true }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isCreator = team.creator === user._id || team.creator === user.id;
  const isJoined = team.players?.some(p => p._id === user._id || p._id === user.id || p === user._id || p === user.id);
  const isFull = team.currentPlayers >= team.maxPlayers;
  const isOnWaitlist = team.waitlist?.some(w => w.user === user._id || w.user === user.id);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('hr-HR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getProgressColor = () => {
    const percentage = (team.currentPlayers / team.maxPlayers) * 100;
    if (percentage >= 90) return '#f44336';
    if (percentage >= 70) return '#ff9800';
    return '#4caf50';
  };

  return (
    <div className="team-card card">
      <div className="team-card-header">
        <div className="team-sport">{team.sport}</div>
        {isFull && <div className="team-full-badge">PUNO</div>}
        {isOnWaitlist && <div className="team-waitlist-badge">📧 Na listi čekanja</div>}
      </div>

      <h3>{team.name}</h3>
      
      <div className="team-info">
        <p>📅 {formatDate(team.date)}</p>
        <p>🕐 {team.time}</p>
        <p>📍 {team.city}, {team.country || 'Hrvatska'}</p>
        <p>🏟️ {team.location}</p>
      </div>

      {team.description && (
        <p className="team-description">{team.description}</p>
      )}

      <div className="team-players">
        <div className="players-count">
          Igrači: {team.currentPlayers}/{team.maxPlayers}
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${(team.currentPlayers / team.maxPlayers) * 100}%`,
              background: getProgressColor()
            }}
          />
        </div>
      </div>

      {team.waitlist && team.waitlist.length > 0 && (
        <div className="waitlist-info">
          📧 {team.waitlist.length} {team.waitlist.length === 1 ? 'osoba' : 'osoba'} na listi čekanja
        </div>
      )}

      {showActions && (
        <div className="team-actions">
          {isCreator ? (
            <>
              <button className="btn btn-secondary" disabled>
                Kreator
              </button>
              {onDelete && (
                <button className="btn btn-danger" onClick={() => onDelete(team._id)}>
                  Obriši
                </button>
              )}
            </>
          ) : isJoined ? (
            onLeave && (
              <button className="btn btn-secondary" onClick={() => onLeave(team._id)}>
                Napusti tim
              </button>
            )
          ) : isFull ? (
            isOnWaitlist ? (
              <button className="btn btn-disabled" disabled>
                Na listi čekanja
              </button>
            ) : (
              onJoinWaitlist && (
                <button className="btn btn-secondary" onClick={() => onJoinWaitlist(team._id)}>
                  📧 Dodaj me na listu čekanja
                </button>
              )
            )
          ) : (
            onJoin && (
              <button className="btn btn-primary" onClick={() => onJoin(team._id)}>
                Pridruži se
              </button>
            )
          )}
        </div>
      )}

      <div className="team-creator">
        Kreator: {team.creator?.username || 'Unknown'}
      </div>
    </div>
  );
}

export default TeamCard;