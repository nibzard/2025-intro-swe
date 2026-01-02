import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

function ProfileSetup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    sport: '',
    location: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Ažuriraj korisnika u localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    const updatedUser = { ...user, ...formData };
    localStorage.setItem('user', JSON.stringify(updatedUser));

    navigate('/dashboard');
  };

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

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <h1 className="auth-title">⚙️</h1>
        <h2>Postavi svoj profil</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
          Odaberi sport i lokaciju kako bi pronašao/la timove
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Koji sport te zanima?</label>
            <select name="sport" value={formData.sport} onChange={handleChange} required>
              <option value="">-- Odaberi sport --</option>
              {sportovi.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>U kojem gradu si?</label>
            <select name="location" value={formData.location} onChange={handleChange} required>
              <option value="">-- Odaberi grad --</option>
              {gradovi.map(grad => (
                <option key={grad} value={grad}>{grad}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            Nastavi na Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfileSetup;