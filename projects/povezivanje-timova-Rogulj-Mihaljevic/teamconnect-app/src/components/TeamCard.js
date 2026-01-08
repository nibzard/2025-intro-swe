import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TeamCard.css';

function TeamCard({ team, onJoin, onLeave, onDelete, onJoinWaitlist, showActions = true }) {
  const navigate = useNavigate();
  
  // ✅ SAFE: Dohvati user iz localStorage
  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  };

  const user = getUserFromStorage();
  
  // ✅ SAFE: Dohvati userId
  const getUserId = () => {
    if (!user) return null;
    return user._id || user.id || null;
  };

  const userId = getUserId();

  // ✅ SAFE: Provjeri je li korisnik kreator tima
  const isTeamCreator = () => {
    if (!userId) return false;
    if (!team || !team.creator) return false;
    
    const creatorId = team.creator._id || team.creator.id || team.creator;
    return creatorId === userId;
  };

  // ✅ SAFE: Provjeri je li korisnik član tima
  const isJoined = () => {
    if (!userId) return false;
    if (!team || !team.players) return false;
    
    return team.players.some(player => {
      const playerId = player._id || player.id || player;
      return playerId === userId;
    });
  };

  // ✅ SAFE: Provjeri je li korisnik na waitlistu
  const isOnWaitlist = () => {
    if (!userId) return false;
    if (!team || !team.waitlist) return false;
    
    return team.waitlist.some(w => {
      const waitlistUserId = w.user?._id || w.user?.id || w.user;
      return waitlistUserId === userId;
    });
  };

  const isFull = team.currentPlayers >= team.maxPlayers;
  const creator = isTeamCreator();
  const joined = isJoined();
  const onWaitlist = isOnWaitlist();

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('hr-HR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getProgressColor = () => {
    const percentage = (team.currentPlayers / team.maxPlayers) * 100;
    if (percentage >= 90) return '#f44336';
    if (percentage >= 70) return '#ff9800';
    return '#4caf50';
  };

  // ✅ SAFE: Handle akcije samo ako je user logiran
  const handleAction = (action, teamId) => {
    if (!userId) {
      alert('Molimo prijavite se kako biste pristupili ovoj funkciji!');
      navigate('/login');
      return;
    }
    
    if (action) {
      action(teamId);
    }
  };

  return (
    <div className="team-card card">
      <div className="team-card-header">
        <div className="team-sport">{team.sport}</div>
        {isFull && <div className="team-full-badge">PUNO</div>}
        {onWaitlist && <div className="team-waitlist-badge">📧 Na listi čekanja</div>}
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
          📧 {team.waitlist.length} {team.waitlist.length === 1 ? 'osoba' : 'osobe'} na listi čekanja
        </div>
      )}

      {showActions && (
        <div className="team-actions">
          {!userId ? (
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/login')}
            >
              Prijavi se za pristup
            </button>
          ) : creator ? (
            <>
              <button className="btn btn-secondary" disabled>
                Kreator
              </button>
              {onDelete && (
                <button 
                  className="btn btn-danger" 
                  onClick={() => handleAction(onDelete, team._id)}
                >
                  Obriši
                </button>
              )}
            </>
          ) : joined ? (
            onLeave && (
              <button 
                className="btn btn-secondary" 
                onClick={() => handleAction(onLeave, team._id)}
              >
                Napusti tim
              </button>
            )
          ) : isFull ? (
            onWaitlist ? (
              <button className="btn btn-disabled" disabled>
                Na listi čekanja
              </button>
            ) : (
              onJoinWaitlist && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleAction(onJoinWaitlist, team._id)}
                >
                  📧 Dodaj me na listu čekanja
                </button>
              )
            )
          ) : (
            onJoin && (
              <button 
                className="btn btn-primary" 
                onClick={() => handleAction(onJoin, team._id)}
              >
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