import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [showMenu, setShowMenu] = useState(false);

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

        <button 
          className="menu-toggle"
          onClick={() => setShowMenu(!showMenu)}
        >
          ☰
        </button>

        <div className={`navbar-menu ${showMenu ? 'show' : ''}`}>
          <button className="nav-link" onClick={() => { navigate('/dashboard'); setShowMenu(false); }}>
            🏠 Dashboard
          </button>
          
          <button className="nav-link" onClick={() => { navigate('/my-teams'); setShowMenu(false); }}>
            👥 Moji timovi
          </button>
          
          <button className="nav-link" onClick={() => { navigate('/tournaments'); setShowMenu(false); }}>
            🏆 Turniri
          </button>
          
          <button className="nav-link" onClick={() => { navigate('/ratings'); setShowMenu(false); }}>
            ⭐ Ratings
          </button>
          
          <button className="nav-link" onClick={() => { navigate('/fields'); setShowMenu(false); }}>
            📍 Tereni
          </button>
          
          <button className="nav-link" onClick={() => { navigate('/friends'); setShowMenu(false); }}>
            👫 Prijatelji
          </button>
          
          <button className="nav-link" onClick={() => { navigate('/statistics'); setShowMenu(false); }}>
            📊 Statistika
          </button>
          
          <button className="nav-link" onClick={() => { navigate('/events'); setShowMenu(false); }}>
            🎫 Eventi
          </button>
          
          <button className="nav-link" onClick={() => { navigate('/rewards'); setShowMenu(false); }}>
            🏅 Rewards
          </button>
          
          <button className="nav-link" onClick={() => { navigate('/highlights'); setShowMenu(false); }}>
            📹 Highlights
          </button>
          
          <button className="nav-link" onClick={() => { navigate('/activity'); setShowMenu(false); }}>
            📰 Aktivnosti
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