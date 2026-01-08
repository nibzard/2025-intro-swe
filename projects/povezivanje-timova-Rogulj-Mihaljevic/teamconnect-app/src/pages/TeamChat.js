import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { getSocket } from '../utils/socket';
import './TeamChat.css';

function TeamChat() {
  const { teamId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    socketRef.current = getSocket();
    loadTeam();
    loadMessages();

    socketRef.current.emit('join_team', teamId);

    socketRef.current.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    socketRef.current.on('user_typing', ({ userId, username }) => {
      if (userId !== currentUser._id && userId !== currentUser.id) {
        setTypingUsers(prev => {
          if (!prev.find(u => u.userId === userId)) {
            return [...prev, { userId, username }];
          }
          return prev;
        });
      }
    });

    socketRef.current.on('user_stop_typing', ({ userId }) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== userId));
    });

    socketRef.current.on('message_deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    return () => {
      socketRef.current.emit('leave_team', teamId);
      socketRef.current.off('new_message');
      socketRef.current.off('user_typing');
      socketRef.current.off('user_stop_typing');
      socketRef.current.off('message_deleted');
    };
  }, [teamId, currentUser._id, currentUser.id]);

  const loadTeam = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/teams/${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setTeam(data);
      } else {
        setToast({ message: 'Tim ne postoji', type: 'error' });
        setTimeout(() => navigate('/my-teams'), 2000);
      }
    } catch (error) {
      console.error('Load team error:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/chat/${teamId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socketRef.current.emit('send_message', {
      teamId,
      userId: currentUser._id || currentUser.id,
      text: newMessage.trim(),
      type: 'text'
    });

    setNewMessage('');
    socketRef.current.emit('stop_typing', {
      teamId,
      userId: currentUser._id || currentUser.id
    });
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing', {
        teamId,
        userId: currentUser._id || currentUser.id,
        username: currentUser.username
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current.emit('stop_typing', {
        teamId,
        userId: currentUser._id || currentUser.id
      });
    }, 2000);
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setToast({ message: 'Geolokacija nije podržana', type: 'error' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        socketRef.current.emit('send_message', {
          teamId,
          userId: currentUser._id || currentUser.id,
          type: 'location',
          text: '📍 Lokacija',
          location: { latitude, longitude }
        });
        setToast({ message: 'Lokacija poslana!', type: 'success' });
      },
      () => setToast({ message: 'Nije moguće dohvatiti lokaciju', type: 'error' })
    );
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Obriši poruku?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/chat/${teamId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error(error);
    }
  };

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Danas';
    if (date.toDateString() === yesterday.toDateString()) return 'Jučer';
    return date.toLocaleDateString('hr-HR');
  };

  const renderMessage = (message, index) => {
    const isOwnMessage =
      message.user._id === currentUser._id || message.user._id === currentUser.id;

    const showDateSeparator =
      index === 0 ||
      formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt);

    return (
      <React.Fragment key={message._id}>
        {showDateSeparator && (
          <div className="date-separator">
            <span>{formatDate(message.createdAt)}</span>
          </div>
        )}

        <div className={`message-wrapper ${isOwnMessage ? 'own' : 'other'}`}>
          {!isOwnMessage && (
            <div className="message-avatar">{message.user.avatar}</div>
          )}

          <div className={`message-bubble ${isOwnMessage ? 'own' : 'other'}`}>
            {!isOwnMessage && (
              <div className="message-sender">{message.user.username}</div>
            )}

            {message.type === 'location' ? (
              <div className="message-location">
                <span className="location-icon">📍</span>
                <a
                  href={`https://www.google.com/maps?q=${message.location.latitude},${message.location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Vidi lokaciju na mapi
                </a>
              </div>
            ) : (
              <div className="message-text">{message.text}</div>
            )}

            <div className="message-time">{formatTime(message.createdAt)}</div>

            {isOwnMessage && (
              <button
                className="message-delete-btn"
                onClick={() => handleDeleteMessage(message._id)}
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </React.Fragment>
    );
  };

  if (loading) {
    return (
      <div className="team-chat-page">
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Učitavanje chata...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="team-chat-page">
      <Navbar />

      <div className="chat-container">
        <div className="chat-header card">
          <button className="back-button" onClick={() => navigate('/my-teams')}>
            ← Natrag
          </button>

          <div className="chat-header-info">
            <h2>💬 {team?.name}</h2>
            <p>{team?.currentPlayers}/{team?.maxPlayers} igrača</p>
          </div>
        </div>

        <div className="chat-messages-container card">
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="no-messages">
                <span className="empty-icon">💬</span>
                <p>Nema poruka</p>
                <p>Budi prvi koji će nešto napisati!</p>
              </div>
            ) : (
              messages.map(renderMessage)
            )}

            {typingUsers.length > 0 && (
              <div className="typing-indicator">
                <div className="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="typing-text">
                  {typingUsers[0].username} piše...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-container" onSubmit={handleSendMessage}>
            <button
              type="button"
              className="btn-location"
              onClick={handleShareLocation}
              title="Podijeli lokaciju"
            >
              📍
            </button>

            <input
              type="text"
              className="chat-input"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Napiši poruku..."
            />

            <button
              type="submit"
              className="btn-send"
              disabled={!newMessage.trim()}
            >
              Pošalji
            </button>
          </form>
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

export default TeamChat;
