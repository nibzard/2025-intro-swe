import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import TeamCard from '../components/TeamCard';
import { teamsAPI } from '../services/api';
import './MyTeams.css';

function MyTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyTeams = async () => {
    setLoading(true);
    try {
      const response = await teamsAPI.getMy();
      setTeams(response.data);
    } catch (err) {
      console.error('Greška pri dohvaćanju mojih timova:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTeams();
  }, []);

  return (
    <div className="my-teams-page">
      <Navbar />
      
      <div className="my-teams-container">
        <div className="my-teams-header">
          <h1>Moji timovi</h1>
          <p>Timovi u kojima si član ili koje si kreirao/la</p>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Učitavanje tvojih timova...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="empty-state card">
            <h2>📭 Još nemaš timova</h2>
            <p>Pridruži se nekom postojećem timu ili kreiraj svoj!</p>
            <div className="empty-actions">
              <button className="btn btn-primary" onClick={() => window.location.href = '/dashboard'}>
                Pregledaj timove
              </button>
              <button className="btn btn-secondary" onClick={() => window.location.href = '/create-team'}>
                + Kreiraj tim
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="teams-count">
              <p>Ukupno <strong>{teams.length}</strong> {teams.length === 1 ? 'tim' : 'timova'}</p>
            </div>
            <div className="teams-grid">
              {teams.map(team => (
                <TeamCard key={team._id} team={team} onUpdate={fetchMyTeams} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MyTeams;