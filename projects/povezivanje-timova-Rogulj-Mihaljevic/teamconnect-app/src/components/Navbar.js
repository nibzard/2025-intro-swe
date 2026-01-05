import React from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#667eea" stroke="#764ba2" strokeWidth="2"/>
            <path d="M12 10L20 16L12 22V10Z" fill="white"/>
          </svg>
          <span>TeamConnect</span>
        </div>

        <div className="navbar-menu">
          <button className="nav-link" onClick={() => navigate('/dashboard')}>
            Svi timovi
          </button>
          <button className="nav-link" onClick={() => navigate('/my-teams')}>
            Moji timovi
          </button>
          <button className="nav-link" onClick={() => navigate('/activity')}>
            📰 Aktivnosti
          </button>
          <button className="nav-link" onClick={() => navigate('/create-team')}>
            + Kreiraj tim
          </button>
        </div>

        <div className="navbar-user">
          <NotificationBell />
          <button className="user-avatar" onClick={() => navigate('/profile')}>
            {user.avatar || '👤'}
          </button>
          <span className="user-name" onClick={() => navigate('/profile')}>
            {user.username}
          </span>
          <button className="btn-logout" onClick={handleLogout}>
            Odjava
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;