import React, { useState } from 'react';
import { teamsAPI } from '../services/api';
import Modal from './Modal';
import Toast from './Toast';
import './TeamCard.css';

function TeamCard({ team, onUpdate }) {
  const user = JSON.parse(localStorage.getItem('user'));
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState(null);

  const isJoined = team.players?.some(p => {
    return p._id === user._id || p === user._id || p._id === user.id || p === user.id;
  });
  const isFull = team.currentPlayers >= team.maxPlayers;
  const isCreator = team.creator?._id === user._id || team.creator?._id === user.id;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleJoin = async () => {
    try {
      await teamsAPI.join(team._id);
       const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const newNotif = {
      id: Date.now(),
      type: 'team_join',
      message: `Uspješno si se pridružio timu "${team.name}"! 🎉`,
      timestamp: new Date().toISOString(),
      read: false
    };
    notifications.unshift(newNotif);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
      showToast('Uspješno si se pridružio timu! 🎉', 'success');
      if (onUpdate) onUpdate();
    } catch (err) {
      showToast(err.response?.data?.message || 'Greška pri pridruživanju', 'error');
    }
  };

  const handleLeaveConfirm = async () => {
    try {
      await teamsAPI.leave(team._id);
       const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const newNotif = {
      id: Date.now(),
      type: 'team_leave',
      message: `Napustio si tim "${team.name}" 👋`,
      timestamp: new Date().toISOString(),
      read: false
    };
    notifications.unshift(newNotif);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    setShowLeaveModal(false);
    showToast('Uspješno si napustio tim', 'success');
    if (onUpdate) onUpdate();
  } catch (err) {
      setShowLeaveModal(false);
      showToast(err.response?.data?.message || 'Greška', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await teamsAPI.delete(team._id);
      setShowDeleteModal(false);
      showToast('Tim je obrisan', 'success');
      if (onUpdate) onUpdate();
    } catch (err) {
      setShowDeleteModal(false);
      showToast(err.response?.data?.message || 'Greška', 'error');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <>
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
            <button onClick={() => setShowDeleteModal(true)} className="btn btn-danger">
              Obriši tim
            </button>
          ) : isJoined ? (
            <button onClick={() => setShowLeaveModal(true)} className="btn btn-secondary">
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

      {/* Modal za napuštanje tima */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={handleLeaveConfirm}
        title="Napusti tim?"
        message={`Sigurno želiš napustiti tim "${team.name}"? Moći ćeš se ponovno pridružiti kasnije.`}
        confirmText="Da, napusti"
        cancelText="Ne, ostani"
      />

      {/* Modal za brisanje tima */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Obriši tim?"
        message={`Sigurno želiš obrisati tim "${team.name}"? Ova radnja se ne može poništiti!`}
        confirmText="Da, obriši"
        cancelText="Odustani"
      />

      {/* Toast notifikacija */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

export default TeamCard;