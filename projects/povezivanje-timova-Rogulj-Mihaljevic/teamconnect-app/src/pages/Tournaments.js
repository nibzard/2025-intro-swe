import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import './Tournaments.css';

function Tournaments() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // active, upcoming, finished

  const [formData, setFormData] = useState({
    name: '',
    sport: '',
    location: '',
    city: '',
    startDate: '',
    endDate: '',
    maxTeams: 8,
    teamSize: 5,
    format: 'knockout', // knockout, league
    entryFee: 0,
    prize: '',
    description: ''
  });

  const sportovi = ['⚽ Nogomet', '🏀 Košarka', '🏐 Odbojka', '🎾 Tenis', '🤾 Rukomet'];
  const gradovi = ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar', 'Pula'];

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = () => {
    const saved = localStorage.getItem('tournaments');
    if (saved) {
      setTournaments(JSON.parse(saved));
    } else {
      // Demo turniri
      const demo = [
        {
          id: 1,
          name: 'Ljetni Nogometni Turnir 2026',
          sport: '⚽ Nogomet',
          city: 'Split',
          location: 'Stadion Poljud',
          startDate: '2026-02-01',
          endDate: '2026-02-15',
          maxTeams: 16,
          teamSize: 11,
          registeredTeams: 8,
          format: 'knockout',
          status: 'upcoming',
          entryFee: 500,
          prize: '10,000 kn',
          teams: [],
          matches: [],
          creator: JSON.parse(localStorage.getItem('user') || '{}').username,
          createdAt: new Date().toISOString()
        }
      ];
      setTournaments(demo);
      localStorage.setItem('tournaments', JSON.stringify(demo));
    }
  };

  const saveTournaments = (data) => {
    localStorage.setItem('tournaments', JSON.stringify(data));
    setTournaments(data);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateTournament = () => {
    if (!formData.name || !formData.sport || !formData.city || !formData.startDate) {
      setToast({ message: 'Popuni sva obavezna polja!', type: 'error' });
      return;
    }

    const newTournament = {
      id: Date.now(),
      ...formData,
      registeredTeams: 0,
      status: new Date(formData.startDate) > new Date() ? 'upcoming' : 'active',
      teams: [],
      matches: [],
      creator: JSON.parse(localStorage.getItem('user') || '{}').username,
      createdAt: new Date().toISOString()
    };

    const updated = [...tournaments, newTournament];
    saveTournaments(updated);
    setShowCreateModal(false);
    setFormData({
      name: '',
      sport: '',
      location: '',
      city: '',
      startDate: '',
      endDate: '',
      maxTeams: 8,
      teamSize: 5,
      format: 'knockout',
      entryFee: 0,
      prize: '',
      description: ''
    });
    setToast({ message: 'Turnir uspješno kreiran! 🏆', type: 'success' });
  };

  const handleRegisterTeam = (tournamentId) => {
    navigate(`/tournament/${tournamentId}/register`);
  };

  const filterTournaments = (status) => {
    if (status === 'active') {
      return tournaments.filter(t => t.status === 'active');
    } else if (status === 'upcoming') {
      return tournaments.filter(t => t.status === 'upcoming');
    } else {
      return tournaments.filter(t => t.status === 'finished');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { text: 'U tijeku', color: '#4caf50' },
      upcoming: { text: 'Uskoro', color: '#ff9800' },
      finished: { text: 'Završeno', color: '#999' }
    };
    return badges[status] || badges.upcoming;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('hr-HR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const filteredTournaments = filterTournaments(activeTab);

  return (
    <div className="tournaments-page">
      <Navbar />
      
      <div className="tournaments-container">
        <div className="tournaments-header">
          <h1>🏆 Turniri</h1>
          <p>Natjecanja, pobjednici, slava!</p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + Kreiraj turnir
          </button>
        </div>

        <div className="tournaments-tabs">
          <button 
            className={`tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            U tijeku ({filterTournaments('active').length})
          </button>
          <button 
            className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Uskoro ({filterTournaments('upcoming').length})
          </button>
          <button 
            className={`tab ${activeTab === 'finished' ? 'active' : ''}`}
            onClick={() => setActiveTab('finished')}
          >
            Završeni ({filterTournaments('finished').length})
          </button>
        </div>

        <div className="tournaments-grid">
          {filteredTournaments.length === 0 ? (
            <div className="empty-tournaments card">
              <span className="empty-icon">🏆</span>
              <h2>Nema turnira</h2>
              <p>
                {activeTab === 'active' && 'Trenutno nema aktivnih turnira.'}
                {activeTab === 'upcoming' && 'Nema nadolazećih turnira.'}
                {activeTab === 'finished' && 'Nema završenih turnira.'}
              </p>
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                Kreiraj prvi turnir
              </button>
            </div>
          ) : (
            filteredTournaments.map(tournament => (
              <div key={tournament.id} className="tournament-card card">
                <div className="tournament-header-card">
                  <div className="tournament-sport">{tournament.sport}</div>
                  <div 
                    className="tournament-status"
                    style={{ background: getStatusBadge(tournament.status).color }}
                  >
                    {getStatusBadge(tournament.status).text}
                  </div>
                </div>

                <h3>{tournament.name}</h3>
                
                <div className="tournament-info">
                  <p>📍 {tournament.city}, {tournament.location}</p>
                  <p>📅 {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</p>
                  <p>👥 Format: {tournament.format === 'knockout' ? 'Knockout' : 'Liga'}</p>
                  <p>🎯 Timovi: {tournament.registeredTeams}/{tournament.maxTeams}</p>
                  {tournament.prize && <p>🏆 Nagrada: {tournament.prize}</p>}
                  {tournament.entryFee > 0 && <p>💰 Kotizacija: {tournament.entryFee} kn</p>}
                </div>

                {tournament.description && (
                  <p className="tournament-description">{tournament.description}</p>
                )}

                <div className="tournament-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${(tournament.registeredTeams / tournament.maxTeams) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="tournament-actions">
                  {tournament.registeredTeams < tournament.maxTeams ? (
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleRegisterTeam(tournament.id)}
                    >
                      Prijavi tim
                    </button>
                  ) : (
                    <button className="btn btn-disabled" disabled>
                      Popunjeno
                    </button>
                  )}
                  <button 
                    className="btn btn-secondary"
                    onClick={() => navigate(`/tournament/${tournament.id}`)}
                  >
                    Detalji
                  </button>
                </div>

                <div className="tournament-creator">
                  Organizator: {tournament.creator}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal za kreiranje turnira */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="create-tournament-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🏆 Kreiraj novi turnir</h2>
            
            <div className="modal-form">
              <div className="form-group">
                <label>Naziv turnira *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="npr. Ljetni Turnir 2026"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Sport *</label>
                  <select name="sport" value={formData.sport} onChange={handleChange}>
                    <option value="">Odaberi</option>
                    {sportovi.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Grad *</label>
                  <select name="city" value={formData.city} onChange={handleChange}>
                    <option value="">Odaberi</option>
                    {gradovi.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Lokacija/Teren *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="npr. Stadion Poljud"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Početak *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label>Kraj *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Broj timova</label>
                  <select name="maxTeams" value={formData.maxTeams} onChange={handleChange}>
                    <option value={4}>4 tima</option>
                    <option value={8}>8 timova</option>
                    <option value={16}>16 timova</option>
                    <option value={32}>32 tima</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Igrača po timu</label>
                  <input
                    type="number"
                    name="teamSize"
                    value={formData.teamSize}
                    onChange={handleChange}
                    min={2}
                    max={22}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Format</label>
                  <select name="format" value={formData.format} onChange={handleChange}>
                    <option value="knockout">Knockout (Eliminacije)</option>
                    <option value="league">Liga (Svi protiv svih)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Kotizacija (kn)</label>
                  <input
                    type="number"
                    name="entryFee"
                    value={formData.entryFee}
                    onChange={handleChange}
                    min={0}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Nagrada (opcionalno)</label>
                <input
                  type="text"
                  name="prize"
                  value={formData.prize}
                  onChange={handleChange}
                  placeholder="npr. 10,000 kn + trofej"
                />
              </div>

              <div className="form-group">
                <label>Opis (opcionalno)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Dodaj dodatne informacije o turniru..."
                />
              </div>

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Odustani
                </button>
                <button className="btn btn-primary" onClick={handleCreateTournament}>
                  Kreiraj turnir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Tournaments;