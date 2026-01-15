import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { teamsAPI } from '../services/api';
import './CreateTeam.css';

function CreateTeam() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    sport: '',
    city: '',
    location: '',
    date: '',
    time: '',
    maxPlayers: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.maxPlayers < 2 || formData.maxPlayers > 22) {
      setError('Broj igrača mora biti između 2 i 22!');
      return;
    }

    setLoading(true);

    try {
      await teamsAPI.create(formData);
      alert('Tim uspješno kreiran! 🎉');
      navigate('/my-teams');
    } catch (err) {
      setError(err.response?.data?.message || 'Greška pri kreiranju tima');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-team-page">
      <Navbar />
      
      <div className="create-team-container">
        <div className="create-team-card card">
          <h1>+ Kreiraj novi tim</h1>
          <p className="subtitle">Napravi novi termin i pozovi druge da se pridruže!</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Naziv tima *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="npr. Večernji fudbal Split"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Sport *</label>
                <select name="sport" value={formData.sport} onChange={handleChange} required>
                  <option value="">-- Odaberi sport --</option>
                  {sportovi.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Grad *</label>
                <select name="city" value={formData.city} onChange={handleChange} required>
                  <option value="">-- Odaberi grad --</option>
                  {gradovi.map(grad => (
                    <option key={grad} value={grad}>{grad}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Lokacija/Kvart *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="npr. Bačvice, Spinut, Centar..."
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Datum *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label>Vrijeme *</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Broj igrača (uključujući tebe) *</label>
              <input
                type="number"
                name="maxPlayers"
                value={formData.maxPlayers}
                onChange={handleChange}
                placeholder="npr. 10"
                min="2"
                max="22"
                required
              />
              <small>Od 2 do 22 igrača</small>
            </div>

            <div className="form-group">
              <label>Opis (opcionalno)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Dodaj bilo kakve dodatne informacije..."
                rows="4"
                maxLength="500"
              />
              <small>{formData.description.length}/500 znakova</small>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => navigate('/dashboard')}
              >
                Odustani
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Kreiranje...' : 'Kreiraj tim'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateTeam;