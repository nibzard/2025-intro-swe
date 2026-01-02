import React, { useState, useEffect } from 'react';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  
  const [teams, setTeams] = useState([
    { id: 1, name: 'Noćni fudbaleri', sport: 'nogomet', location: 'split-centar', players: 8, maxPlayers: 11, time: 'Utorak 19:00' },
    { id: 2, name: 'Street Ballers', sport: 'kosarka', location: 'split-spinut', players: 4, maxPlayers: 5, time: 'Srijeda 18:00' },
    { id: 3, name: 'Odbojka Squad', sport: 'odbojka', location: 'split-poljud', players: 5, maxPlayers: 6, time: 'Četvrtak 20:00' },
    { id: 4, name: 'Meje Runners', sport: 'nogomet', location: 'split-meje', players: 6, maxPlayers: 11, time: 'Petak 19:30' },
    { id: 5, name: 'Gripe Dunkers', sport: 'kosarka', location: 'split-gripe', players: 3, maxPlayers: 5, time: 'Subota 17:00' },
  ]);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      window.location.href = '/';
    }
  }, []);

  const handleJoinTeam = (teamId) => {
    setTeams(teams.map(team => 
      team.id === teamId && team.players < team.maxPlayers
        ? { ...team, players: team.players + 1 }
        : team
    ));
    alert('Uspješno si se pridružio/la timu! 🎉');
  };

  const filteredTeams = teams.filter(team => {
    const sportMatch = !selectedSport || team.sport === selectedSport;
    const locationMatch = !selectedLocation || team.location === selectedLocation;
    return sportMatch && locationMatch;
  });

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };

  if (!user) return <div>Učitavanje...</div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🏀 TeamConnect</h1>
        <div className="user-info">
          <span>Pozdrav, <strong>{user.username}</strong>!</span>
          <button onClick={handleLogout} className="btn-logout">Odjava</button>
        </div>
      </header>

      <div className="dashboard-content">
        <section className="user-profile">
          <h2>Tvoj profil</h2>
          <div className="profile-card">
            <p><strong>Sport:</strong> {user.sport}</p>
            <p><strong>Lokacija:</strong> {user.location}</p>
          </div>
        </section>

        <section className="filters">
          <h2>Pretraži timove</h2>
          <div className="filter-group">
            <select 
              value={selectedSport} 
              onChange={(e) => setSelectedSport(e.target.value)}
            >
              <option value="">Svi sportovi</option>
              <option value="nogomet">⚽ Nogomet</option>
              <option value="kosarka">🏀 Košarka</option>
              <option value="odbojka">🏐 Odbojka</option>
              <option value="tenis">🎾 Tenis</option>
            </select>

            <select 
              value={selectedLocation} 
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">Sve lokacije</option>
              <option value="split-centar">Split - Centar</option>
              <option value="split-spinut">Split - Spinut</option>
              <option value="split-poljud">Split - Poljud</option>
              <option value="split-meje">Split - Meje</option>
              <option value="split-gripe">Split - Gripe</option>
            </select>
          </div>
        </section>

        <section className="teams">
          <h2>Dostupni timovi ({filteredTeams.length})</h2>
          <div className="teams-grid">
            {filteredTeams.length === 0 ? (
              <p className="no-teams">Nema timova za odabrane filtere.</p>
            ) : (
              filteredTeams.map(team => (
                <div key={team.id} className="team-card">
                  <h3>{team.name}</h3>
                  <p className="team-sport">
                    {team.sport === 'nogomet' && '⚽'}
                    {team.sport === 'kosarka' && '🏀'}
                    {team.sport === 'odbojka' && '🏐'}
                    {' '}{team.sport}
                  </p>
                  <p className="team-location">📍 {team.location}</p>
                  <p className="team-time">🕐 {team.time}</p>
                  <p className="team-players">
                    👥 {team.players}/{team.maxPlayers} igrača
                  </p>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(team.players / team.maxPlayers) * 100}%` }}
                    />
                  </div>
                  <button
                    onClick={() => handleJoinTeam(team.id)}
                    disabled={team.players >= team.maxPlayers}
                    className={team.players >= team.maxPlayers ? 'btn-disabled' : 'btn-join'}
                  >
                    {team.players >= team.maxPlayers ? '✓ Popunjeno' : 'Pridruži se'}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <footer className="dashboard-footer">
        <p>© 2025 TeamConnect | Đana Rogulj & Karolina Mihaljević</p>
      </footer>
    </div>
  );
}

export default Dashboard;