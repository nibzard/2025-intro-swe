import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import './TournamentRegister.css';

function TournamentRegister() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    teamName: '',
    captain: '',
    captainPhone: '',
    captainEmail: '',
    players: [''],
    registrationType: 'create' // create ili join
  });

  useEffect(() => {
    loadTournament();
  }, [id]);

  const loadTournament = () => {
    const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
    const found = tournaments.find(t => t.id === parseInt(id));
    if (found) {
      setTournament(found);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setFormData(prev => ({
        ...prev,
        captain: user.username || '',
        captainEmail: user.email || ''
      }));
    } else {
      setToast({ message: 'Turnir ne postoji!', type: 'error' });
      setTimeout(() => navigate('/tournaments'), 2000);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlayerChange = (index, value) => {
    const newPlayers = [...formData.players];
    newPlayers[index] = value;
    setFormData({ ...formData, players: newPlayers });
  };

  const addPlayerField = () => {
    if (formData.players.length < tournament.teamSize) {
      setFormData({ ...formData, players: [...formData.players, ''] });
    }
  };

  const removePlayerField = (index) => {
    const newPlayers = formData.players.filter((_, i) => i !== index);
    setFormData({ ...formData, players: newPlayers });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.teamName || !formData.captain || !formData.captainPhone) {
      setToast({ message: 'Popuni sva obavezna polja!', type: 'error' });
      return;
    }

    const filledPlayers = formData.players.filter(p => p.trim() !== '');
    if (filledPlayers.length < 2) {
      setToast({ message: 'Tim mora imati minimalno 2 igrača!', type: 'error' });
      return;
    }

    // Spremi prijavu
    const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
    const updatedTournaments = tournaments.map(t => {
      if (t.id === parseInt(id)) {
        return {
          ...t,
          teams: [...(t.teams || []), {
            name: formData.teamName,
            captain: formData.captain,
            captainPhone: formData.captainPhone,
            captainEmail: formData.captainEmail,
            players: filledPlayers,
            registeredAt: new Date().toISOString()
          }],
          registeredTeams: (t.registeredTeams || 0) + 1
        };
      }
      return t;
    });

    localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));

    // Dodaj notifikaciju
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications.unshift({
      id: Date.now(),
      type: 'team_join',
      message: `Tim "${formData.teamName}" prijavljen na turnir "${tournament.name}"! 🏆`,
      timestamp: new Date().toISOString(),
      read: false
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));

    setToast({ message: 'Tim uspješno prijavljen! 🎉', type: 'success' });
    setTimeout(() => navigate(`/tournament/${id}`), 2000);
  };

  if (!tournament) {
    return (
      <div className="tournament-register-page">
        <Navbar />
        <div className="loading">Učitavanje...</div>
      </div>
    );
  }

  return (
    <div className="tournament-register-page">
      <Navbar />
      
      <div className="register-container">
        <div className="register-card card">
          <div className="register-header">
            <h1>🏆 Prijava tima</h1>
            <h2>{tournament.name}</h2>
            <p>{tournament.sport} • {tournament.city}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Informacije o timu</h3>
              
              <div className="form-group">
                <label>Naziv tima *</label>
                <input
                  type="text"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleChange}
                  placeholder="npr. Plavi Lavovi"
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Kapetan tima</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Ime i prezime *</label>
                  <input
                    type="text"
                    name="captain"
                    value={formData.captain}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Telefon *</label>
                  <input
                    type="tel"
                    name="captainPhone"
                    value={formData.captainPhone}
                    onChange={handleChange}
                    placeholder="+385 91 234 5678"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="captainEmail"
                  value={formData.captainEmail}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Igrači ({formData.players.filter(p => p.trim()).length}/{tournament.teamSize})</h3>
              
              {formData.players.map((player, index) => (
                <div key={index} className="player-field">
                  <input
                    type="text"
                    value={player}
                    onChange={(e) => handlePlayerChange(index, e.target.value)}
                    placeholder={`Igrač ${index + 1}`}
                  />
                  {formData.players.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removePlayerField(index)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {formData.players.length < tournament.teamSize && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addPlayerField}
                >
                  + Dodaj igrača
                </button>
              )}
            </div>

            {tournament.entryFee > 0 && (
              <div className="fee-notice">
                <p>💰 Kotizacija: <strong>{tournament.entryFee} kn</strong></p>
                <small>Plaćanje na dan turnira</small>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(`/tournament/${id}`)}
              >
                Odustani
              </button>
              <button type="submit" className="btn btn-primary">
                Prijavi tim
              </button>
            </div>
          </form>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default TournamentRegister;