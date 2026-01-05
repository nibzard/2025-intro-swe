import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import './VideoHighlights.css';

function VideoHighlights() {
  const navigate = useNavigate();
  const [highlights, setHighlights] = useState([]);
  const [filter, setFilter] = useState('all'); // all, myVideos, trending, goals, saves
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'goal',
    file: null
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadHighlights();
  }, []);

  const loadHighlights = () => {
    const saved = localStorage.getItem('videoHighlights');
    if (saved) {
      setHighlights(JSON.parse(saved));
    } else {
      const demoHighlights = [
        {
          id: 1,
          title: 'Nevjerovatan gol s polovice terena!',
          description: 'Incredible shot from midfield',
          category: 'goal',
          thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600',
          author: currentUser.username || 'danana',
          authorAvatar: currentUser.avatar || '👤',
          views: 1247,
          likes: 89,
          comments: 23,
          uploadDate: new Date(Date.now() - 172800000).toISOString(),
          duration: '0:15',
          trending: true
        },
        {
          id: 2,
          title: 'Top 5 golova tjedna',
          description: 'Best goals from this week',
          category: 'compilation',
          thumbnail: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600',
          author: 'marko123',
          authorAvatar: '🧑',
          views: 2834,
          likes: 156,
          comments: 45,
          uploadDate: new Date(Date.now() - 345600000).toISOString(),
          duration: '2:34',
          trending: true
        },
        {
          id: 3,
          title: 'Spektakularna obrana golmana',
          description: 'Amazing save by goalkeeper',
          category: 'save',
          thumbnail: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600',
          author: 'ana_kos',
          authorAvatar: '👩',
          views: 892,
          likes: 67,
          comments: 12,
          uploadDate: new Date(Date.now() - 518400000).toISOString(),
          duration: '0:08',
          trending: false
        },
        {
          id: 4,
          title: 'Hat-trick u finalnoj utakmici',
          description: '3 goals in final match',
          category: 'goal',
          thumbnail: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600',
          author: currentUser.username || 'danana',
          authorAvatar: currentUser.avatar || '👤',
          views: 1567,
          likes: 112,
          comments: 34,
          uploadDate: new Date(Date.now() - 691200000).toISOString(),
          duration: '1:12',
          trending: false
        }
      ];
      setHighlights(demoHighlights);
      localStorage.setItem('videoHighlights', JSON.stringify(demoHighlights));
    }
  };

  const handleUpload = () => {
    if (!uploadForm.title || !uploadForm.category) {
      setToast({ message: 'Popuni naslov i kategoriju!', type: 'error' });
      return;
    }

    const newHighlight = {
      id: Date.now(),
      title: uploadForm.title,
      description: uploadForm.description,
      category: uploadForm.category,
      thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600',
      author: currentUser.username || 'User',
      authorAvatar: currentUser.avatar || '👤',
      views: 0,
      likes: 0,
      comments: 0,
      uploadDate: new Date().toISOString(),
      duration: '0:' + Math.floor(Math.random() * 60).toString().padStart(2, '0'),
      trending: false
    };

    const updated = [newHighlight, ...highlights];
    setHighlights(updated);
    localStorage.setItem('videoHighlights', JSON.stringify(updated));

    setShowUploadModal(false);
    setUploadForm({
      title: '',
      description: '',
      category: 'goal',
      file: null
    });
    setToast({ message: 'Video uspješno uploadano! 🎉', type: 'success' });
  };

  const handleLike = (highlightId) => {
    const updated = highlights.map(h => 
      h.id === highlightId 
        ? { ...h, likes: h.likes + 1 }
        : h
    );
    setHighlights(updated);
    localStorage.setItem('videoHighlights', JSON.stringify(updated));
    setToast({ message: '❤️ Sviđa ti se!', type: 'success' });
  };

  const filterHighlights = () => {
    let filtered = [...highlights];

    if (filter === 'myVideos') {
      filtered = filtered.filter(h => h.author === currentUser.username);
    } else if (filter === 'trending') {
      filtered = filtered.filter(h => h.trending);
    } else if (filter === 'goals') {
      filtered = filtered.filter(h => h.category === 'goal');
    } else if (filter === 'saves') {
      filtered = filtered.filter(h => h.category === 'save');
    }

    return filtered.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
  };

  const getCategoryLabel = (category) => {
    const labels = {
      goal: '⚽ Gol',
      save: '🥅 Obrana',
      skill: '⭐ Skill',
      compilation: '🎬 Kompilacija',
      fail: '😅 Fail',
      other: '📹 Ostalo'
    };
    return labels[category] || labels.other;
  };

  const formatViews = (views) => {
    if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Danas';
    if (diffDays === 1) return 'Jučer';
    if (diffDays < 7) return `Prije ${diffDays} dana`;
    if (diffDays < 30) return `Prije ${Math.floor(diffDays / 7)} tjedana`;
    return date.toLocaleDateString('hr-HR');
  };

  const filteredHighlights = filterHighlights();

  return (
    <div className="video-highlights-page">
      <Navbar />
      
      <div className="highlights-container">
        <div className="highlights-header">
          <h1>📹 Video Highlights</h1>
          <p>Podijeli najbolje trenutke s utakmica</p>
          <button 
            className="btn btn-primary btn-large"
            onClick={() => setShowUploadModal(true)}
          >
            + Upload Video
          </button>
        </div>

        <div className="highlights-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Svi videi
          </button>
          <button 
            className={`filter-btn ${filter === 'trending' ? 'active' : ''}`}
            onClick={() => setFilter('trending')}
          >
            🔥 Trending
          </button>
          <button 
            className={`filter-btn ${filter === 'goals' ? 'active' : ''}`}
            onClick={() => setFilter('goals')}
          >
            ⚽ Golovi
          </button>
          <button 
            className={`filter-btn ${filter === 'saves' ? 'active' : ''}`}
            onClick={() => setFilter('saves')}
          >
            🥅 Obrane
          </button>
          <button 
            className={`filter-btn ${filter === 'myVideos' ? 'active' : ''}`}
            onClick={() => setFilter('myVideos')}
          >
            Moji videi
          </button>
        </div>

        {filteredHighlights.length === 0 ? (
          <div className="empty-highlights card">
            <span className="empty-icon">📹</span>
            <h3>Nema videa</h3>
            <p>
              {filter === 'myVideos' 
                ? 'Uploadaj svoj prvi video highlight!' 
                : 'Trenutno nema videa u ovoj kategoriji'}
            </p>
            {filter === 'myVideos' && (
              <button 
                className="btn btn-primary"
                onClick={() => setShowUploadModal(true)}
              >
                Upload Video
              </button>
            )}
          </div>
        ) : (
          <div className="highlights-grid">
            {filteredHighlights.map(highlight => (
              <div key={highlight.id} className="highlight-card card">
                <div 
                  className="highlight-thumbnail"
                  style={{ backgroundImage: `url(${highlight.thumbnail})` }}
                >
                  {highlight.trending && (
                    <div className="trending-badge">🔥 TRENDING</div>
                  )}
                  <div className="video-duration">{highlight.duration}</div>
                  <div className="play-overlay">
                    <div className="play-button">▶</div>
                  </div>
                </div>

                <div className="highlight-content">
                  <div className="highlight-category">
                    {getCategoryLabel(highlight.category)}
                  </div>

                  <h3>{highlight.title}</h3>
                  
                  {highlight.description && (
                    <p className="highlight-description">{highlight.description}</p>
                  )}

                  <div className="highlight-author">
                    <div className="author-avatar">{highlight.authorAvatar}</div>
                    <span className="author-name">{highlight.author}</span>
                    <span className="upload-date">{formatDate(highlight.uploadDate)}</span>
                  </div>

                  <div className="highlight-stats">
                    <div className="stat-item">
                      <span className="stat-icon">👁️</span>
                      <span className="stat-value">{formatViews(highlight.views)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">❤️</span>
                      <span className="stat-value">{highlight.likes}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">💬</span>
                      <span className="stat-value">{highlight.comments}</span>
                    </div>
                  </div>

                  <div className="highlight-actions">
                    <button 
                      className="btn btn-secondary btn-small"
                      onClick={() => handleLike(highlight.id)}
                    >
                      ❤️ Like
                    </button>
                    <button 
                      className="btn btn-secondary btn-small"
                      onClick={() => setToast({ message: 'Player dolazi uskoro!', type: 'info' })}
                    >
                      ▶️ Pogledaj
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="weekly-top card">
          <h2>🏆 Top videi tjedna</h2>
          <div className="top-videos-list">
            {highlights
              .sort((a, b) => b.views - a.views)
              .slice(0, 5)
              .map((highlight, index) => (
                <div key={highlight.id} className="top-video-item">
                  <div className="top-rank">#{index + 1}</div>
                  <div 
                    className="top-thumbnail"
                    style={{ backgroundImage: `url(${highlight.thumbnail})` }}
                  />
                  <div className="top-info">
                    <h4>{highlight.title}</h4>
                    <p>{highlight.author} • {formatViews(highlight.views)} pregleda</p>
                  </div>
                  <div className="top-medal">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Modal za upload */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <h2>📹 Upload Video Highlight</h2>

            <div className="form-group">
              <label>Naslov videa *</label>
              <input
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder="npr. Nevjerovatan gol s polovice terena"
              />
            </div>

            <div className="form-group">
              <label>Kategorija *</label>
              <select 
                value={uploadForm.category}
                onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
              >
                <option value="goal">⚽ Gol</option>
                <option value="save">🥅 Obrana</option>
                <option value="skill">⭐ Skill</option>
                <option value="compilation">🎬 Kompilacija</option>
                <option value="fail">😅 Fail</option>
                <option value="other">📹 Ostalo</option>
              </select>
            </div>

            <div className="form-group">
              <label>Opis (opcionalno)</label>
              <textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                placeholder="Dodaj kratak opis videa..."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Video datoteka</label>
              <div className="file-upload-area">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                  style={{ display: 'none' }}
                  id="video-upload"
                />
                <label htmlFor="video-upload" className="file-upload-label">
                  <div className="upload-icon">📁</div>
                  <p>{uploadForm.file ? uploadForm.file.name : 'Klikni za odabir videa'}</p>
                  <small>Podržani formati: MP4, MOV, AVI (max 100MB)</small>
                </label>
              </div>
            </div>

            <div className="upload-notice">
              <p>💡 <strong>Napomena:</strong> Video upload funkcionalnost trenutno radi s demo podacima. Pravi upload dolazi uskoro!</p>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowUploadModal(false)}
              >
                Odustani
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleUpload}
              >
                Upload Video
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default VideoHighlights;