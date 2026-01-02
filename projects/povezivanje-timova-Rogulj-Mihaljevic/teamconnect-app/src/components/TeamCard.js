import React from 'react';
import { teamsAPI } from '../services/api';
import './TeamCard.css';

function TeamCard({ team, onUpdate }) {
  const user = JSON.parse(localStorage.getItem('user'));
  const isJoined = team.players?.some(p => p._id === user.id);
  const isFull = team.currentPlayers >= team.maxPlayers;
  const isCreator = team.creator?._id === user.id;

  const handleJoin = async () => {
    try {
      await teamsAPI.join(team._id);
      alert('Uspješno si se pridružio timu! 🎉');
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Greška pri pridruživanju');
    }
  };

  const handleLeave = async () => {
    if (window.confirm('Sigurno želiš napustiti tim?')) {
      try {
        await teamsAPI.leave(team._id);
        alert('Napustio si tim');
        if (onUpdate) onUpdate();
      } catch (err) {
        alert(err.response?.data?.message || 'Greška');
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Sigurno želiš obrisati tim?')) {
      try {
        await teamsAPI.delete(team._id);
        alert('Tim je obrisan');
        if (onUpdate) onUpdate();
      } catch (err) {
        alert(err.response?.data?.message || 'Greška');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="team-card">
      <div className="team-header">
        <h3>{team.name}</h3>
        <span className="team-sport">{team.sport}</span>
      </div>

      <div className="team-info">
        <p className="team-location">📍 {team.city}, {team.location}</p>
        <p className="team-date">📅 {formatDate(team.date)}</p>
        <p className="team-time">🕐 {team.time}</p>
        
        {team.description && (
          <p className="team-description">{team.description}</p>
        )}

        <div className="team-players">
          <p>👥 {team.currentPlayers}/{team.maxPlayers} igrača</p>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(team.currentPlayers / team.maxPlayers) * 100}%` }}
            />
          </div>
        </div>

        <p className="team-creator">Kreirao: {team.creator?.username || 'Nepoznato'}</p>
      </div>

      <div className="team-actions">
        {isCreator ? (
          <button onClick={handleDelete} className="btn btn-danger">
            Obriši tim
          </button>
        ) : isJoined ? (
          <button onClick={handleLeave} className="btn btn-secondary">
            Napusti tim
          </button>
        ) : isFull ? (
          <button disabled className="btn btn-disabled">
            Puno
          </button>
        ) : (
          <button onClick={handleJoin} className="btn btn-primary">
            Pridruži se
          </button>
        )}
      </div>
    </div>
  );
}

export default TeamCard;