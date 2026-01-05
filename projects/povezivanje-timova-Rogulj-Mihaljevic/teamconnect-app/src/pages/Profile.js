import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    sport: '',
    location: '',
    bio: ''
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
    'Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar', 'Pula',
    'Slavonski Brod', 'Karlovac', 'Varaždin', 'Šibenik', 'Sisak', 'Dubrovnik'
  ];

  const avatars = [
    '👤', '🧑', '👨', '👩', '🧔', '👨‍🦱', '👩‍🦰', '👨‍🦳', '👩‍🦳',
    '⚽', '🏀', '🏐', '🎾', '🏈', '⚾', '🥎', '🏏'
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        sport: userData.sport || '',
        location: userData.location || '',
        bio: userData.bio || '',
        avatar: userData.avatar || '👤'
      });
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarSelect = (avatar) => {
    setFormData({ ...formData, avatar });
  };

  const handleSave = () => {
    const updatedUser = { ...user, ...formData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setIsEditing(false);
    setToast({ message: 'Profil uspješno ažuriran! 🎉', type: 'success' });
  };

  if (!user) return <div className="loading">Učitavanje...</div>;

  return (
    <div className="profile-page">
      <Navbar />
      
      <div className="profile-container">
        <div className="profile-card card">
          <div className="profile-header">
            <div className="avatar-section">
              <div className="avatar-large">{formData.avatar || '👤'}</div>
              {isEditing && (
                <div className="avatar-picker">
                  <p>Odaberi avatar:</p>
                  <div className="avatar-grid">
                    {avatars.map((av, idx) => (
                      <div
                        key={idx}
                        className={`avatar-option ${formData.avatar === av ? 'selected' : ''}`}
                        onClick={() => handleAvatarSelect(av)}
                      >
                        {av}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="profile-info">
              {!isEditing ? (
                <>
                  <h1>{user.username}</h1>
                  <p className="profile-email">📧 {user.email}</p>
                  <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                    ✏️ Uredi profil
                  </button>
                </>
              ) : (
                <div className="edit-actions">
                  <button className="btn btn-primary" onClick={handleSave}>
                    💾 Spremi promjene
                  </button>
                  <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                    ❌ Odustani
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="profile-details">
            {!isEditing ? (
              <>
                <div className="detail-item">
                  <span className="detail-label">Sport:</span>
                  <span className="detail-value">{user.sport || 'Nije postavljeno'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Lokacija:</span>
                  <span className="detail-value">{user.location || 'Nije postavljeno'}</span>
                </div>
                {user.bio && (
                  <div className="detail-item bio">
                    <span className="detail-label">Bio:</span>
                    <p className="detail-value">{user.bio}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="edit-form">
                <div className="form-group">
                  <label>Korisničko ime</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    disabled
                  />
                  <small>Korisničko ime se ne može mijenjati</small>
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                  />
                  <small>Email se ne može mijenjati</small>
                </div>

                <div className="form-group">
                  <label>Sport</label>
                  <select name="sport" value={formData.sport} onChange={handleChange}>
                    <option value="">Odaberi sport</option>
                    {sportovi.map(sport => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Grad</label>
                  <select name="location" value={formData.location} onChange={handleChange}>
                    <option value="">Odaberi grad</option>
                    {gradovi.map(grad => (
                      <option key={grad} value={grad}>{grad}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Bio (opcionalno)</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Napiši nešto o sebi..."
                    rows="4"
                    maxLength="200"
                  />
                  <small>{formData.bio.length}/200 znakova</small>
                </div>
              </div>
            )}
          </div>

          <div className="profile-stats">
            <div className="stat-card">
              <div className="stat-number">0</div>
              <div className="stat-label">Timova</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">0</div>
              <div className="stat-label">Prijatelja</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">0</div>
              <div className="stat-label">Utakmica</div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default Profile;