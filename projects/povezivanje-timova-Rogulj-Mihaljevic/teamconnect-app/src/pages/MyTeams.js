import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TeamCard from '../components/TeamCard';
import Toast from '../components/Toast';
import './MyTeams.css';

function MyTeams() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchMyTeams();
  }, []);

  const fetchMyTeams = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/teams/my-teams', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      } else {
        const error = await response.json();
        setToast({ message: error.message || 'Greška pri učitavanju timova', type: 'error' });
      }
    } catch (error) {
      console.error('Fetch teams error:', error);
      setToast({ message: 'Greška pri učitavanju timova', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTeam = async (teamId) => {
    if (!window.confirm('Jesi li siguran da želiš napustiti ovaj tim?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/teams/${teamId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: 'Napustio si tim', type: 'info' });
        fetchMyTeams(); // Refresh
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (error) {
      console.error('Leave team error:', error);
      setToast({ message: 'Greška pri napuštanju tima', type: 'error' });
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Jesi li siguran da želiš obrisati ovaj tim? Ova akcija je nepovratna!')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ message: 'Tim obrisan', type: 'success' });
        fetchMyTeams(); // Refresh
      } else {
        setToast({ message: data.message, type: 'error' });
      }
    } catch (error) {
      console.error('Delete team error:', error);
      setToast({ message: 'Greška pri brisanju tima', type: 'error' });
    }
  };

  const myCreatedTeams = teams.filter(t => 
    t.creator._id === currentUser._id || t.creator._id === currentUser.id
  );
  
  const myJoinedTeams = teams.filter(t => 
    t.creator._id !== currentUser._id && t.creator._id !== currentUser.id
  );

  if (loading) {
    return (
      <div className="my-teams-page">
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Učitavanje timova...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-teams-page">
      <Navbar />
      
      <div className="my-teams-container">
        <div className="my-teams-header">
          <h1>👥 Moji timovi</h1>
          <p>Upravljaj svojim timovima</p>
          <button className="btn btn-primary btn-large" onClick={() => navigate('/create-team')}>
            + Kreiraj novi tim
          </button>
        </div>

        {teams.length === 0 ? (
          <div className="no-teams card">
            <span className="empty-icon">⚽</span>
            <h2>Nemaš timova</h2>
            <p>Kreiraj novi tim ili se pridruži postojećem na Dashboardu</p>
            <div className="empty-actions">
              <button className="btn btn-primary" onClick={() => navigate('/create-team')}>
                Kreiraj tim
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                Pregledaj timove
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Kreirani timovi */}
            {myCreatedTeams.length > 0 && (
              <div className="teams-section">
                <h2 className="section-title">🎯 Timovi koje sam kreirao ({myCreatedTeams.length})</h2>
                <div className="teams-grid">
                  {myCreatedTeams.map(team => (
                    <TeamCard 
                      key={team._id} 
                      team={team}
                      onDelete={handleDeleteTeam}
                      showActions={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Timovi kojima sam se pridružio */}
            {myJoinedTeams.length > 0 && (
              <div className="teams-section">
                <h2 className="section-title">🤝 Timovi u kojima igram ({myJoinedTeams.length})</h2>
                <div className="teams-grid">
                  {myJoinedTeams.map(team => (
                    <TeamCard 
                      key={team._id} 
                      team={team}
                      onLeave={handleLeaveTeam}
                      showActions={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default MyTeams;