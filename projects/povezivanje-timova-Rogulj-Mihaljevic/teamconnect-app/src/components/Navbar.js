import React from 'react';
import { useNavigate } from 'react-router-dom';
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
          🏀 TeamConnect
        </div>

        <div className="navbar-menu">
          <button className="nav-link" onClick={() => navigate('/dashboard')}>
            Svi timovi
          </button>
          <button className="nav-link" onClick={() => navigate('/my-teams')}>
            Moji timovi
          </button>
          <button className="nav-link" onClick={() => navigate('/create-team')}>
            + Kreiraj tim
          </button>
        </div>

        <div className="navbar-user">
          <span className="user-name">Pozdrav, {user.username}!</span>
          <button className="btn-logout" onClick={handleLogout}>
            Odjava
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;