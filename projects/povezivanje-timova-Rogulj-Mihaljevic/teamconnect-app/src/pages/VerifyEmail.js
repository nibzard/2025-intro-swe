import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './Auth.css';

function VerifyEmail() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError('Kod mora imati 6 znamenki!');
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem('tempUserId');
      const response = await authAPI.verify({ userId, code });

      // Spremi token i korisnika
     localStorage.clear();  // ✅ Clear first
    localStorage.setItem('token', response.data.accessToken);  // ✅ accessToken, ne token
    localStorage.setItem('refreshToken', response.data.refreshToken);  // ✅ Dodaj refresh token
    localStorage.setItem('user', JSON.stringify(response.data.user));
    localStorage.removeItem('tempUserId');

      // Preusmjeri na profile setup
  window.location.href = '/dashboard';  // ✅ window.location umjesto navigate
  } catch (err) {
    setError(err.response?.data?.message || 'Pogrešan kod!');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <h1 className="auth-title">📧</h1>
        <h2>Verifikacija emaila</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
          Upiši 6-znamenkasti kod koji si primio/la na email
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              style={{ fontSize: '2rem', textAlign: 'center', letterSpacing: '10px' }}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Verificiranje...' : 'Verificiraj'}
          </button>
        </form>

        <p className="auth-link">
          Nisi primio kod? <a href="#" onClick={() => alert('Funkcija dolazi uskoro!')}>Pošalji ponovno</a>
        </p>
      </div>
    </div>
  );
}

export default VerifyEmail;