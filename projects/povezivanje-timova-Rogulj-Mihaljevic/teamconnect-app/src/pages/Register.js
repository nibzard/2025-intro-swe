import React, { useState } from 'react';
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    sport: '',
    location: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password || !formData.sport || !formData.location) {
      alert('Popuni sva polja!');
      return;
    }

    // Spremi korisnika
    localStorage.setItem('currentUser', JSON.stringify(formData));
    
    alert('Registracija uspješna! 🎉');
    window.location.href = '/dashboard';
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1>TeamConnect</h1>
        <h2>Registracija</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Korisničko ime</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Upiši svoje ime..."
            />
          </div>

          <div className="form-group">
            <label>Lozinka</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Upiši lozinku..."
            />
          </div>

          <div className="form-group">
            <label>Odaberi sport</label>
            <select name="sport" value={formData.sport} onChange={handleChange}>
              <option value="">-- Odaberi sport --</option>
              <option value="nogomet">⚽ Nogomet</option>
              <option value="kosarka">🏀 Košarka</option>
              <option value="odbojka">🏐 Odbojka</option>
              <option value="tenis">🎾 Tenis</option>
              <option value="rukomet">🤾 Rukomet</option>
            </select>
          </div>

          <div className="form-group">
            <label>Odaberi lokaciju</label>
            <select name="location" value={formData.location} onChange={handleChange}>
              <option value="">-- Odaberi kvart --</option>
              <option value="split-centar">Split - Centar</option>
              <option value="split-spinut">Split - Spinut</option>
              <option value="split-poljud">Split - Poljud</option>
              <option value="split-meje">Split - Meje</option>
              <option value="split-gripe">Split - Gripe</option>
            </select>
          </div>

          <button type="submit" className="btn-primary">
            Registriraj se
          </button>
        </form>

        <p className="login-link">
          Već imaš račun? <a href="/login">Prijavi se</a>
        </p>
      </div>
    </div>
  );
}

export default Register;