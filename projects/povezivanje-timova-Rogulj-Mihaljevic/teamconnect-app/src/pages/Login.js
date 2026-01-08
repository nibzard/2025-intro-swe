import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🔐 Attempting login with:', formData.email);

    try {
      const response = await authAPI.login(formData);

      console.log('✅ Login response:', response.data);

      // ✅ Check if we got tokens
      if (!response.data.accessToken) {
        throw new Error('No access token received from server');
      }

      // ✅ Clear old data first
      localStorage.clear();

      // ✅ Save new tokens and user data
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      console.log('💾 Tokens saved to localStorage');
      console.log('👤 User:', response.data.user.username);

      // ✅ Verify tokens were saved
      const savedToken = localStorage.getItem('token');
      if (!savedToken) {
        throw new Error('Failed to save token to localStorage');
      }

      console.log('✅ Token verified in localStorage');

      // ✅ PROMJENA OVDJE - LINIJA 56
      // Koristi window.location.href umjesto navigate
      window.location.href = '/dashboard';

    } catch (err) {
      console.error('❌ Login error:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'Greška pri prijavi';
      setError(errorMessage);
      
      alert('❌ Login greška: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <h1 className="auth-title">🏀 TeamConnect</h1>
        <h2>Dobrodošao/la natrag!</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Tvoj email"
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
              placeholder="Tvoja lozinka"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Prijavljivanje...' : 'Prijavi se'}
          </button>
        </form>

        <p className="auth-link">
          Nemaš račun? <a href="/">Registriraj se</a>
        </p>
      </div>
    </div>
  );
}

export default Login;