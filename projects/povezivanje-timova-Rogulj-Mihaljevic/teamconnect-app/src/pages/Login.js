import React, { useState } from 'react';
import './Register.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    
    const savedUser = localStorage.getItem('currentUser');
    
    if (!savedUser) {
      alert('Korisnik ne postoji! Registriraj se prvo.');
      return;
    }

    const user = JSON.parse(savedUser);
    
    if (user.username === username && user.password === password) {
      alert('Uspješna prijava! 🎉');
      window.location.href = '/dashboard';
    } else {
      alert('Pogrešno korisničko ime ili lozinka!');
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1>TeamConnect</h1>
        <h2>Prijava</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Korisničko ime</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Upiši svoje ime..."
            />
          </div>

          <div className="form-group">
            <label>Lozinka</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Upiši lozinku..."
            />
          </div>

          <button type="submit" className="btn-primary">
            Prijavi se
          </button>
        </form>

        <p className="login-link">
          Nemaš račun? <a href="/">Registriraj se</a>
        </p>
      </div>
    </div>
  );
}

export default Login;