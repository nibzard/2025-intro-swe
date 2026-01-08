import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { getAllSports } from '../data/sports';
import { europeanCities } from '../data/cities';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams(); // Za gledanje tuđih profila
  const [profile, setProfile] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [toast, setToast] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    dateOfBirth: '',
    gender: '',
    sport: '',
    favoriteSports: [],
    skillLevel: '',
    position: '',
    country: '',
    city: '',
    phone: '',
    instagram: '',
    twitter: '',
    facebook: '',
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const sportsList = getAllSports();
  const countries = Object.keys(europeanCities).sort((a, b) => a.localeCompare(b, 'hr'));
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const availableAvatars = [
    '👤', '😀', '😎', '🤓', '🥳', '🤩', '😺', '🦁', '🐯', '🐻',
    '🦊', '🐼', '🐨', '🐸', '🦄', '🐲', '⚽', '🏀', '🎾', '🏐'
  ];

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const targetUserId = userId || currentUser._id || currentUser.id;
      
      const response = await fetch(`http://localhost:5000/api/profile/${targetUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setIsOwnProfile(!userId || userId === currentUser._id || userId === currentUser.id);
        
        // Popuni edit form
        setEditForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          bio: data.bio || '',
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
          gender: data.gender || '',
          sport: data.sport || '',
          favoriteSports: data.favoriteSports || [],
          skillLevel: data.skillLevel || '',
          position: data.position || '',
          country: data.country || '',
          city: data.city || '',
          phone: data.phone || '',
          instagram: data.instagram || '',
          twitter: data.twitter || '',
          facebook: data.facebook || '',
          profileVisibility: data.profileVisibility || 'public',
          showEmail: data.showEmail || false,
          showPhone: data.showPhone || false
        });
      } else {
        const error = await response.json();
        setToast({ message: error.message, type: 'error' });
      }
    } catch (error) {
      console.error('Load profile error:', error);
      setToast({ message: 'Greška pri učitavanju profila', type: 'error' });
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data.user);
        setIsEditing(false);
        setToast({ message: '✅ Profil ažuriran!', type: 'success' });
        
        // Ažuriraj localStorage
        const updatedUser = { ...currentUser, ...data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (error) {
      console.error('Save profile error:', error);
      setToast({ message: 'Greška pri spremanju profila', type: 'error' });
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setToast({ message: 'Popuni sva polja!', type: 'error' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToast({ message: 'Nova lozinka se ne podudara!', type: 'error' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setToast({ message: 'Nova lozinka mora imati barem 6 znakova!', type: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: '✅ Lozinka promijenjena!', type: 'success' });
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (error) {
      console.error('Change password error:', error);
      setToast({ message: 'Greška pri promjeni lozinke', type: 'error' });
    }
  };

  const handleChangeAvatar = async (newAvatar) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar: newAvatar })
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data.user);
        setShowAvatarModal(false);
        setToast({ message: '✅ Avatar ažuriran!', type: 'success' });
        
        // Ažuriraj localStorage
        const updatedUser = { ...currentUser, avatar: newAvatar };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (error) {
      console.error('Change avatar error:', error);
      setToast({ message: 'Greška pri promjeni avatara', type: 'error' });
    }
  };

  const handleToggleFavoriteSport = (sport) => {
    const sports = editForm.favoriteSports || [];
    if (sports.includes(sport)) {
      setEditForm({ ...editForm, favoriteSports: sports.filter(s => s !== sport) });
    } else {
      setEditForm({ ...editForm, favoriteSports: [...sports, sport] });
    }
  };

  const getSkillLevelLabel = (level) => {
    const labels = {
      beginner: 'Početnik',
      intermediate: 'Srednji',
      advanced: 'Napredan',
      professional: 'Profesionalac'
    };
    return labels[level] || level;
  };

  const getGenderLabel = (gender) => {
    const labels = {
      male: 'Muško',
      female: 'Žensko',
      other: 'Ostalo',
      prefer_not_to_say: 'Ne želim reći'
    };
    return labels[gender] || gender;
  };

  if (!profile) {
    return (
      <div className="profile-page">
        <Navbar />
        <div className="loading">Učitavanje profila...</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Navbar />
      
      <div className="profile-container">
        {/* Cover Photo */}
        <div 
          className="profile-cover"
          style={{ 
            backgroundImage: profile.coverPhoto 
              ? `url(${profile.coverPhoto})` 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          {isOwnProfile && (
            <button className="btn-edit-cover">
              📷 Promijeni naslovnu
            </button>
          )}
        </div>

        {/* Profile Header */}
        <div className="profile-header card">
          <div className="profile-avatar-section">
            <div 
              className="profile-avatar-large"
              onClick={() => isOwnProfile && setShowAvatarModal(true)}
              style={{ cursor: isOwnProfile ? 'pointer' : 'default' }}
            >
              {profile.avatar}
              {isOwnProfile && (
                <div className="avatar-edit-overlay">
                  <span>✏️</span>
                </div>
              )}
            </div>
            
            <div className="profile-header-info">
              <h1>
                {profile.firstName && profile.lastName 
                  ? `${profile.firstName} ${profile.lastName}`
                  : profile.username
                }
              </h1>
              <p className="profile-username">@{profile.username}</p>
              
              {profile.bio && (
                <p className="profile-bio">{profile.bio}</p>
              )}

              <div className="profile-meta">
                {profile.city && profile.country && (
                  <span>📍 {profile.city}, {profile.country}</span>
                )}
                {profile.sport && (
                  <span>{profile.sport}</span>
                )}
                {profile.skillLevel && (
                  <span>⭐ {getSkillLevelLabel(profile.skillLevel)}</span>
                )}
              </div>

              <div className="profile-stats-mini">
                <div className="stat-mini">
                  <strong>{profile.friends?.length || 0}</strong>
                  <span>Prijatelji</span>
                </div>
                <div className="stat-mini">
                  <strong>{profile.stats?.totalMatches || 0}</strong>
                  <span>Utakmica</span>
                </div>
                <div className="stat-mini">
                  <strong>{profile.stats?.totalWins || 0}</strong>
                  <span>Pobjeda</span>
                </div>
              </div>
            </div>

            {isOwnProfile && (
              <div className="profile-actions-header">
                <button 
                  className="btn btn-primary"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Odustani' : '✏️ Uredi profil'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowPasswordModal(true)}
                >
                  🔒 Promijeni lozinku
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="profile-tabs">
          <button 
            className={`tab ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            O meni
          </button>
          <button 
            className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistika
          </button>
          <button 
            className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Aktivnost
          </button>
          {isOwnProfile && (
            <button 
              className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Postavke
            </button>
          )}
        </div>

        {/* Profile Content */}
        <div className="profile-content">
          {activeTab === 'about' && (
            <div className="about-section">
              {isEditing ? (
                <div className="edit-profile-form card">
                  <h2>✏️ Uredi profil</h2>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Ime</label>
                      <input
                        type="text"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        placeholder="Ime"
                      />
                    </div>
                    <div className="form-group">
                      <label>Prezime</label>
                      <input
                        type="text"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        placeholder="Prezime"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Bio</label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Napiši nešto o sebi..."
                      rows="4"
                      maxLength="500"
                    />
                    <small>{editForm.bio.length}/500</small>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Datum rođenja</label>
                      <input
                        type="date"
                        value={editForm.dateOfBirth}
                        onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="form-group">
                      <label>Spol</label>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      >
                        <option value="">Odaberi</option>
                        <option value="male">Muško</option>
                        <option value="female">Žensko</option>
                        <option value="other">Ostalo</option>
                        <option value="prefer_not_to_say">Ne želim reći</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Glavni sport</label>
                    <select
                      value={editForm.sport}
                      onChange={(e) => setEditForm({ ...editForm, sport: e.target.value })}
                    >
                      <option value="">Odaberi</option>
                      {sportsList.map(sport => (
                        <option key={sport.id} value={sport.name}>{sport.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Omiljeni sportovi</label>
                    <div className="sports-checkboxes">
                      {sportsList.filter(s => s.popular).map(sport => (
                        <label key={sport.id} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={(editForm.favoriteSports || []).includes(sport.name)}
                            onChange={() => handleToggleFavoriteSport(sport.name)}
                          />
                          <span>{sport.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Razina vještine</label>
                      <select
                        value={editForm.skillLevel}
                        onChange={(e) => setEditForm({ ...editForm, skillLevel: e.target.value })}
                      >
                        <option value="">Odaberi</option>
                        <option value="beginner">Početnik</option>
                        <option value="intermediate">Srednji</option>
                        <option value="advanced">Napredan</option>
                        <option value="professional">Profesionalac</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Pozicija</label>
                      <input
                        type="text"
                        value={editForm.position}
                        onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                        placeholder="npr. Napadač"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Država</label>
                      <select
                        value={editForm.country}
                        onChange={(e) => setEditForm({ ...editForm, country: e.target.value, city: '' })}
                      >
                        <option value="">Odaberi</option>
                        {countries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Grad</label>
                      <select
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        disabled={!editForm.country}
                      >
                        <option value="">Odaberi</option>
                        {editForm.country && europeanCities[editForm.country]?.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Telefon</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="+385 91 234 5678"
                    />
                  </div>

                  <div className="form-group">
                    <label>Instagram</label>
                    <input
                      type="text"
                      value={editForm.instagram}
                      onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                      placeholder="@username"
                    />
                  </div>

                  <div className="form-group">
                    <label>Twitter</label>
                    <input
                      type="text"
                      value={editForm.twitter}
                      onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                      placeholder="@username"
                    />
                  </div>

                  <div className="form-group">
                    <label>Facebook</label>
                    <input
                      type="text"
                      value={editForm.facebook}
                      onChange={(e) => setEditForm({ ...editForm, facebook: e.target.value })}
                      placeholder="facebook.com/username"
                    />
                  </div>

                  <button 
                    className="btn btn-primary btn-large"
                    onClick={handleSaveProfile}
                  >
                    💾 Spremi promjene
                  </button>
                </div>
              ) : (
                <div className="about-info card">
                  <h2>📋 Osnovne informacije</h2>
                  
                  <div className="info-grid">
                    {profile.email && (
                      <div className="info-item">
                        <span className="info-label">Email:</span>
                        <span className="info-value">{profile.email}</span>
                      </div>
                    )}
                    {profile.phone && (
                      <div className="info-item">
                        <span className="info-label">Telefon:</span>
                        <span className="info-value">{profile.phone}</span>
                      </div>
                    )}
                    {profile.dateOfBirth && (
                      <div className="info-item">
                        <span className="info-label">Datum rođenja:</span>
                        <span className="info-value">
                          {new Date(profile.dateOfBirth).toLocaleDateString('hr-HR')}
                        </span>
                      </div>
                    )}
                    {profile.gender && (
                      <div className="info-item">
                        <span className="info-label">Spol:</span>
                        <span className="info-value">{getGenderLabel(profile.gender)}</span>
                      </div>
                    )}
                    {profile.position && (
                      <div className="info-item">
                        <span className="info-label">Pozicija:</span>
                        <span className="info-value">{profile.position}</span>
                      </div>
                    )}
                  </div>

                  {profile.favoriteSports && profile.favoriteSports.length > 0 && (
                    <>
                      <h3 style={{ marginTop: '30px' }}>❤️ Omiljeni sportovi</h3>
                      <div className="favorite-sports">
                        {profile.favoriteSports.map((sport, index) => (
                          <span key={index} className="sport-badge">{sport}</span>
                        ))}
                      </div>
                    </>
                  )}

                  {(profile.instagram || profile.twitter || profile.facebook) && (
                    <>
                      <h3 style={{ marginTop: '30px' }}>🔗 Social Media</h3>
                      <div className="social-links">
                        {profile.instagram && (
                          <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                            📷 Instagram
                          </a>
                        )}
                        {profile.twitter && (
                          <a href={`https://twitter.com/${profile.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                            🐦 Twitter
                          </a>
                        )}
                        {profile.facebook && (
                          <a href={profile.facebook.startsWith('http') ? profile.facebook : `https://facebook.com/${profile.facebook}`} target="_blank" rel="noopener noreferrer">
                            📘 Facebook
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="stats-tab card">
              <h2>📊 Statistika</h2>
              <p>Detaljnu statistiku možeš vidjeti na <button className="link-btn" onClick={() => navigate('/statistics')}>Statistici</button></p>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-tab card">
              <h2>📰 Nedavna aktivnost</h2>
              <p>Aktivnost dolazi uskoro...</p>
            </div>
          )}

          {activeTab === 'settings' && isOwnProfile && (
            <div className="settings-tab card">
              <h2>⚙️ Postavke privatnosti</h2>
              
              <div className="settings-section">
                <h3>👁️ Vidljivost profila</h3>
                <select
                  value={editForm.profileVisibility}
                  onChange={(e) => setEditForm({ ...editForm, profileVisibility: e.target.value })}
                >
                  <option value="public">Javno - Svi mogu vidjeti</option>
                  <option value="friends">Prijatelji - Samo prijatelji</option>
                  <option value="private">Privatno - Samo ja</option>
                </select>
              </div>

              <div className="settings-section">
                <h3>📧 Prikaz kontakt podataka</h3>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editForm.showEmail}
                    onChange={(e) => setEditForm({ ...editForm, showEmail: e.target.checked })}
                  />
                  <span>Prikaži email drugim korisnicima</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editForm.showPhone}
                    onChange={(e) => setEditForm({ ...editForm, showPhone: e.target.checked })}
                  />
                  <span>Prikaži telefon drugim korisnicima</span>
                </label>
              </div>

              <button 
                className="btn btn-primary"
                onClick={handleSaveProfile}
              >
                💾 Spremi postavke
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal za promjenu lozinke */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="password-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🔒 Promijeni lozinku</h2>

            <div className="form-group">
              <label>Trenutna lozinka</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Upiši trenutnu lozinku"
              />
            </div>

            <div className="form-group">
              <label>Nova lozinka</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Upiši novu lozinku (min 6 znakova)"
              />
            </div>

            <div className="form-group">
              <label>Potvrdi novu lozinku</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Ponovi novu lozinku"
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowPasswordModal(false)}
              >
                Odustani
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleChangePassword}
              >
                Promijeni lozinku
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal za odabir avatara */}
      {showAvatarModal && (
        <div className="modal-overlay" onClick={() => setShowAvatarModal(false)}>
          <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🎭 Odaberi avatar</h2>
            
            <div className="avatar-grid">
              {availableAvatars.map((avatar, index) => (
                <button
                  key={index}
                  className={`avatar-option ${profile.avatar === avatar ? 'selected' : ''}`}
                  onClick={() => handleChangeAvatar(avatar)}
                >
                  {avatar}
                </button>
              ))}
            </div>

            <button 
              className="btn btn-secondary"
              onClick={() => setShowAvatarModal(false)}
            >
              Zatvori
            </button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Profile;