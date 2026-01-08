import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TeamCard from '../components/TeamCard';
import Toast from '../components/Toast';
import { getAllSports } from '../data/sports';
import { europeanCities } from '../data/cities';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({
    sport: '',
    country: '',
    city: ''
  });

  const sportsList = getAllSports();
  const countries = Object.keys(europeanCities).sort((a, b) => a.localeCompare(b, 'hr'));

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [teams, filters]);

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/teams', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Fetch teams error:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...teams];

    if (filters.sport) {
      filtered = filtered.filter(team => team.sport === filters.sport);
    }

    if (filters.country) {
      filtered = filtered.filter(team => team.country === filters.country);
    }

    if (filters.city) {
      filtered = filtered.filter(team => team.city === filters.city);
    }

    setFilteredTeams(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    if (filterName === 'country') {
      setFilters({ ...filters, country: value, city: '' });
    } else {
      setFilters({ ...filters, [filterName]: value });
    }
  };

  const handleJoinTeam = async (teamId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/teams/${teamId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: 'Uspješno si se pridružio timu! 🎉', type: 'success' });
        fetchTeams();
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (error) {
      console.error('Join team error:', error);
      setToast({ message: 'Greška pri pridruživanju timu', type: 'error' });
    }
  };

  const handleJoinWaitlist = async (teamId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/waitlist/${teamId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: '📧 ' + data.message, type: 'success' });
        fetchTeams();
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (error) {
      console.error('Join waitlist error:', error);
      setToast({ message: 'Greška pri dodavanju na listu čekanja', type: 'error' });
    }
  };

  return (
    <div className="dashboard-page">
      <Navbar />
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dostupni timovi</h1>
          <p>Pronađi tim i pridruži se utakmici!</p>
          <button className="btn btn-primary btn-large" onClick={() => navigate('/create-team')}>
            + Kreiraj novi tim
          </button>
        </div>

        <div className="filters-section card">
          <h3>🔍 Filtriraj timove</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Sport</label>
              <select 
                value={filters.sport} 
                onChange={(e) => handleFilterChange('sport', e.target.value)}
              >
                <option value="">Svi sportovi</option>
                <optgroup label="Popularni">
                  {sportsList.filter(s => s.popular).map(sport => (
                    <option key={sport.id} value={sport.name}>{sport.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Ostali">
                  {sportsList.filter(s => !s.popular).map(sport => (
                    <option key={sport.id} value={sport.name}>{sport.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="filter-group">
              <label>Država</label>
              <select 
                value={filters.country} 
                onChange={(e) => handleFilterChange('country', e.target.value)}
              >
                <option value="">Sve države</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Grad</label>
              <select 
                value={filters.city} 
                onChange={(e) => handleFilterChange('city', e.target.value)}
                disabled={!filters.country}
              >
                <option value="">Svi gradovi</option>
                {filters.country && europeanCities[filters.country]?.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {(filters.sport || filters.country || filters.city) && (
              <button 
                className="btn btn-secondary"
                onClick={() => setFilters({ sport: '', country: '', city: '' })}
              >
                Resetiraj filtere
              </button>
            )}
          </div>
        </div>

        {filteredTeams.length === 0 ? (
          <div className="no-teams card">
            <span className="empty-icon">⚽</span>
            <h2>Nema timova</h2>
            <p>
              {filters.sport || filters.country || filters.city 
                ? 'Nema timova koji odgovaraju tvojim filterima. Pokušaj promijeniti kriterije.'
                : 'Trenutno nema dostupnih timova. Budi prvi i kreiraj novi tim!'}
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/create-team')}>
              Kreiraj novi tim
            </button>
          </div>
        ) : (
          <div className="teams-grid">
            {filteredTeams.map(team => (
              <TeamCard 
                key={team._id} 
                team={team} 
                onJoin={handleJoinTeam}
                onJoinWaitlist={handleJoinWaitlist}
              />
            ))}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Dashboard;