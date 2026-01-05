import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import TeamCard from '../components/TeamCard';
import { teamsAPI } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sport: '',
    city: ''
  });

  const sportovi = [
    '⚽ Nogomet',
    '🏀 Košarka',
    '🏐 Odbojka',
    '🎾 Tenis',
    '🤾 Rukomet',
    '⚾ Baseball',
    '🏸 Badminton',
    '🏓 Stolni tenis'
  ];

  const gradovi = [
    'Zagreb',
    'Split',
    'Rijeka',
    'Osijek',
    'Zadar',
    'Pula',
    'Slavonski Brod',
    'Karlovac',
    'Varaždin',
    'Šibenik',
    'Sisak',
    'Dubrovnik'
  ];

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const response = await teamsAPI.getAll(filters);
      setTeams(response.data);
    } catch (err) {
      console.error('Greška pri dohvaćanju timova:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="dashboard-page">
      <Navbar />
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>🏀 Dostupni timovi</h1>
          <p>Pronađi svoj sljedeći tim ili kreiraj novi!</p>
        </div>

        <div className="filters-card card">
          <h3>🔍 Filtriraj timove</h3>
          <div className="filters-grid">
            <div className="form-group">
              <label>Sport</label>
              <select name="sport" value={filters.sport} onChange={handleFilterChange}>
                <option value="">Svi sportovi</option>
                {sportovi.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Grad</label>
              <select name="city" value={filters.city} onChange={handleFilterChange}>
                <option value="">Svi gradovi</option>
                {gradovi.map(grad => (
                  <option key={grad} value={grad}>{grad}</option>
                ))}
              </select>
            </div>
          </div>

          {(filters.sport || filters.city) && (
            <button 
              className="btn btn-secondary" 
              onClick={() => setFilters({ sport: '', city: '' })}
              style={{ marginTop: '15px' }}
            >
              Resetiraj filtere
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Učitavanje timova...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="empty-state card">
            <h2>😢 Nema timova</h2>
            <p>Još nema timova s ovim filterima. Budi prvi i kreiraj novi!</p>
            <button className="btn btn-primary" onClick={() => window.location.href = '/create-team'}>
              + Kreiraj tim
            </button>
          </div>
        ) : (
          <>
            <div className="teams-count">
              <p>Pronađeno <strong>{teams.length}</strong> {teams.length === 1 ? 'tim' : 'timova'}</p>
            </div>
            <div className="teams-grid">
              {teams.map(team => (
                <TeamCard key={team._id} team={team} onUpdate={fetchTeams} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;