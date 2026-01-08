import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './Auth.css';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Lozinke se ne podudaraju!');
      return;
    }

    if (formData.password.length < 6) {
      setError('Lozinka mora imati minimalno 6 znakova!');
      return;
    }

    setLoading(true);

    try {
      // ✅ PROMJENA: Dodao sport i location (backend sada ih prihvaća)
      const response = await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        sport: 'Football', // Možeš promijeniti ili dodati dropdown
        location: 'Zagreb'  // Možeš promijeniti ili dodati input
      });

      // ✅ Spremi userId i accessToken
      if (response.data.userId) {
        localStorage.setItem('tempUserId', response.data.userId);
      }
      
      if (response.data.accessToken) {
        localStorage.setItem('token', response.data.accessToken);
      }

      alert('✅ Registracija uspješna! Provjeri email za verifikacijski kod.');
      navigate('/verify');
    } catch (err) {
      console.error('Register error:', err);
      setError(err.response?.data?.message || 'Greška pri registraciji');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <h1 className="auth-title">🏀 TeamConnect</h1>
        <h2>Kreiraj račun</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Korisničko ime</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Odaberi svoje korisničko ime"
              required
              minLength={3}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tvoj@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Lozinka</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimalno 6 znakova"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label>Potvrdi lozinku</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Ponovno upiši lozinku"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registracija...' : 'Registriraj se'}
          </button>
        </form>

        <p className="auth-link">
          Već imaš račun? <a href="/login">Prijavi se</a>
        </p>
      </div>
    </div>
  );
}

export default Register;