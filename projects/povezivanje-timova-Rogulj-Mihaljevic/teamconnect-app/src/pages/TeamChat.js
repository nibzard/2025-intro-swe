import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import './TeamChat.css';

function TeamChat() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [toast, setToast] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadTeamAndMessages();
  }, [teamId]);

  const loadTeamAndMessages = () => {
    // Učitaj tim podatke (simulacija - u pravoj app bi ovo bilo iz API-ja)
    const mockTeam = {
      id: teamId,
      name: 'Odbojaška Ekipa',
      sport: '🏐 Odbojka',
      members: [
        { id: 1, username: currentUser.username, avatar: currentUser.avatar || '👤' },
        { id: 2, username: 'danana', avatar: '👨' },
        { id: 3, username: 'marko123', avatar: '🧑' }
      ]
    };
    setTeam(mockTeam);

    // Učitaj poruke
    const savedMessages = localStorage.getItem(`chat_${teamId}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      // Demo poruke
      const demo = [
        {
          id: 1,
          userId: 2,
          username: 'danana',
          avatar: '👨',
          message: 'Hej ekipa! Spremni za večeras?',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          type: 'text'
        },
        {
          id: 2,
          userId: 3,
          username: 'marko123',
          avatar: '🧑',
          message: 'Da! U 18h na Poljudu?',
          timestamp: new Date(Date.now() - 5400000).toISOString(),
          type: 'text'
        }
      ];
      setMessages(demo);
      localStorage.setItem(`chat_${teamId}`, JSON.stringify(demo));
    }
  };

  const saveMessages = (msgs) => {
    localStorage.setItem(`chat_${teamId}`, JSON.stringify(msgs));
    setMessages(msgs);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const newMsg = {
      id: Date.now(),
      userId: currentUser.id,
      username: currentUser.username,
      avatar: currentUser.avatar || '👤',
      message: newMessage,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    const updated = [...messages, newMsg];
    saveMessages(updated);
    setNewMessage('');

    // Scroll to bottom
    setTimeout(() => {
      const chatMessages = document.querySelector('.chat-messages');
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }, 100);
  };

  const handleSendLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const newMsg = {
          id: Date.now(),
          userId: currentUser.id,
          username: currentUser.username,
          avatar: currentUser.avatar || '👤',
          message: `Lokacija: ${position.coords.latitude}, ${position.coords.longitude}`,
          timestamp: new Date().toISOString(),
          type: 'location',
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        };

        const updated = [...messages, newMsg];
        saveMessages(updated);
      }, (error) => {
        setToast({ message: 'Ne mogu pristupiti lokaciji!', type: 'error' });
      });
    } else {
      setToast({ message: 'Geolokacija nije podržana!', type: 'error' });
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Upravo sad';
    if (diffMins < 60) return `Prije ${diffMins} min`;
    
    return date.toLocaleTimeString('hr-HR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!team) {
    return (
      <div className="team-chat-page">
        <Navbar />
        <div className="loading">Učitavanje...</div>
      </div>
    );
  }

  return (
    <div className="team-chat-page">
      <Navbar />
      
      <div className="chat-container">
        <div className="chat-header card">
          <div className="chat-header-left">
            <button className="back-btn" onClick={() => navigate('/my-teams')}>
              ← Natrag
            </button>
            <div>
              <h2>{team.name}</h2>
              <p>{team.sport} • {team.members.length} članova</p>
            </div>
          </div>
          <div className="chat-members">
            {team.members.map(member => (
              <div key={member.id} className="member-avatar" title={member.username}>
                {member.avatar}
              </div>
            ))}
          </div>
        </div>

        <div className="chat-content card">
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="no-messages">
                <span className="empty-icon">💬</span>
                <p>Još nema poruka</p>
                <small>Budi prvi koji će nešto poslati!</small>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isOwn = msg.userId === currentUser.id;
                const showAvatar = index === 0 || messages[index - 1].userId !== msg.userId;

                return (
                  <div 
                    key={msg.id} 
                    className={`message ${isOwn ? 'own-message' : 'other-message'}`}
                  >
                    {!isOwn && showAvatar && (
                      <div className="message-avatar">{msg.avatar}</div>
                    )}
                    
                    <div className="message-content">
                      {!isOwn && showAvatar && (
                        <div className="message-username">{msg.username}</div>
                      )}
                      
                      {msg.type === 'text' && (
                        <div className="message-bubble">
                          {msg.message}
                        </div>
                      )}

                      {msg.type === 'location' && (
                        <div className="message-bubble location-message">
                          📍 Lokacija
                          <a 
                            href={`https://www.google.com/maps?q=${msg.location.lat},${msg.location.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Otvori u Google Maps
                          </a>
                        </div>
                      )}

                      <div className="message-timestamp">
                        {formatTimestamp(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form className="chat-input" onSubmit={handleSendMessage}>
            <button 
              type="button" 
              className="btn-icon"
              onClick={handleSendLocation}
              title="Pošalji lokaciju"
            >
              📍
            </button>
            
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Napiši poruku..."
            />
            
            <button type="submit" className="btn-send">
              ➤
            </button>
          </form>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default TeamChat;