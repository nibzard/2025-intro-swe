import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import './Statistics.css';

function Statistics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [timeRange, setTimeRange] = useState('all'); // all, month, week
  const [toast, setToast] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadStatistics();
  }, [timeRange]);

  const loadStatistics = () => {
    const saved = localStorage.getItem('playerStatistics');
    if (saved) {
      setStats(JSON.parse(saved));
    } else {
      // Demo statistika
      const demoStats = {
        overview: {
          totalMatches: 67,
          wins: 42,
          losses: 18,
          draws: 7,
          winRate: 62.7,
          goalsScored: 124,
          goalsAgainst: 89,
          assists: 45,
          cleanSheets: 12
        },
        form: [
          { match: 1, result: 'win', score: '3-1', opponent: 'Crveni Tigrovi' },
          { match: 2, result: 'win', score: '2-0', opponent: 'Zeleni Zmajevi' },
          { match: 3, result: 'loss', score: '1-2', opponent: 'Plavi Orlovi' },
          { match: 4, result: 'win', score: '4-1', opponent: 'Žuti Lavovi' },
          { match: 5, result: 'draw', score: '2-2', opponent: 'Bijeli Tigrovi' }
        ],
        monthlyPerformance: [
          { month: 'Siječanj', matches: 8, wins: 5, losses: 2, draws: 1 },
          { month: 'Veljača', matches: 10, wins: 7, losses: 2, draws: 1 },
          { month: 'Ožujak', matches: 12, wins: 8, losses: 3, draws: 1 },
          { month: 'Travanj', matches: 9, wins: 6, losses: 2, draws: 1 },
          { month: 'Svibanj', matches: 11, wins: 7, losses: 3, draws: 1 },
          { month: 'Lipanj', matches: 10, wins: 6, losses: 3, draws: 1 },
          { month: 'Srpanj', matches: 7, wins: 3, losses: 3, draws: 1 }
        ],
        topPerformances: [
          { stat: 'Golovi u jednoj utakmici', value: 4, match: 'vs Žuti Lavovi', date: '2026-12-15' },
          { stat: 'Asistencije u jednoj utakmici', value: 3, match: 'vs Zeleni Zmajevi', date: '2026-12-01' },
          { stat: 'Najduža pobjeda', value: '5-0', match: 'vs Bijeli Tigrovi', date: '2026-11-20' },
          { stat: 'Najduži niz pobjeda', value: 7, match: 'Studeni-Prosinac', date: '2026-11' }
        ],
        positionStats: {
          forward: { matches: 45, goals: 89, assists: 12 },
          midfielder: { matches: 15, goals: 18, assists: 25 },
          defender: { matches: 5, goals: 2, assists: 5 },
          goalkeeper: { matches: 2, goals: 0, assists: 0 }
        },
        predictions: [
          { opponent: 'Crveni Tigrovi', winProbability: 72, drawProbability: 18, lossProbability: 10 },
          { opponent: 'Plavi Orlovi', winProbability: 45, drawProbability: 30, lossProbability: 25 },
          { opponent: 'Zeleni Zmajevi', winProbability: 68, drawProbability: 20, lossProbability: 12 }
        ]
      };
      setStats(demoStats);
      localStorage.setItem('playerStatistics', JSON.stringify(demoStats));
    }
  };

  const getFormIcon = (result) => {
    if (result === 'win') return '🟢';
    if (result === 'loss') return '🔴';
    return '🟡';
  };

  const getFormClass = (result) => {
    if (result === 'win') return 'form-win';
    if (result === 'loss') return 'form-loss';
    return 'form-draw';
  };

  if (!stats) {
    return (
      <div className="statistics-page">
        <Navbar />
        <div className="loading">Učitavanje statistike...</div>
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <Navbar />
      
      <div className="statistics-container">
        <div className="statistics-header">
          <h1>📊 Statistika & Analytics</h1>
          <p>Analiziraj svoje performanse i predvidi buduće rezultate</p>
        </div>

        <div className="time-range-selector">
          <button 
            className={`time-btn ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            Ovaj tjedan
          </button>
          <button 
            className={`time-btn ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            Ovaj mjesec
          </button>
          <button 
            className={`time-btn ${timeRange === 'all' ? 'active' : ''}`}
            onClick={() => setTimeRange('all')}
          >
            Sve vrijeme
          </button>
        </div>

        <div className="overview-stats">
          <div className="stat-card card">
            <div className="stat-icon">⚽</div>
            <div className="stat-content">
              <h3>{stats.overview.totalMatches}</h3>
              <p>Ukupno utakmica</p>
            </div>
          </div>

          <div className="stat-card card win-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <h3>{stats.overview.wins}</h3>
              <p>Pobjede</p>
            </div>
          </div>

          <div className="stat-card card loss-card">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <h3>{stats.overview.losses}</h3>
              <p>Porazi</p>
            </div>
          </div>

          <div className="stat-card card draw-card">
            <div className="stat-icon">🤝</div>
            <div className="stat-content">
              <h3>{stats.overview.draws}</h3>
              <p>Neriješeno</p>
            </div>
          </div>

          <div className="stat-card card rate-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>{stats.overview.winRate}%</h3>
              <p>Win Rate</p>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon">⚽</div>
            <div className="stat-content">
              <h3>{stats.overview.goalsScored}</h3>
              <p>Golovi</p>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h3>{stats.overview.assists}</h3>
              <p>Asistencije</p>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon">🛡️</div>
            <div className="stat-content">
              <h3>{stats.overview.cleanSheets}</h3>
              <p>Clean Sheets</p>
            </div>
          </div>
        </div>

        <div className="statistics-content">
          <div className="form-section card">
            <h2>📉 Forma (zadnjih 5 utakmica)</h2>
            <div className="form-visualization">
              {stats.form.map((match, index) => (
                <div key={index} className={`form-item ${getFormClass(match.result)}`}>
                  <div className="form-icon">{getFormIcon(match.result)}</div>
                  <div className="form-details">
                    <span className="form-score">{match.score}</span>
                    <span className="form-opponent">{match.opponent}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="form-summary">
              <div className="summary-item">
                <span className="summary-label">Pobjede:</span>
                <span className="summary-value">{stats.form.filter(m => m.result === 'win').length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Porazi:</span>
                <span className="summary-value">{stats.form.filter(m => m.result === 'loss').length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Neriješeno:</span>
                <span className="summary-value">{stats.form.filter(m => m.result === 'draw').length}</span>
              </div>
            </div>
          </div>

          <div className="monthly-performance card">
            <h2>📅 Mjesečne performanse</h2>
            <div className="performance-chart">
              {stats.monthlyPerformance.map((month, index) => {
                const winPercentage = (month.wins / month.matches) * 100;
                return (
                  <div key={index} className="month-bar">
                    <div className="month-label">{month.month}</div>
                    <div className="month-bar-container">
                      <div 
                        className="month-bar-fill"
                        style={{ height: `${winPercentage}%` }}
                        title={`${month.wins}/${month.matches} pobjeda`}
                      >
                        <span className="bar-value">{month.wins}</span>
                      </div>
                    </div>
                    <div className="month-matches">{month.matches} utakmica</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="position-stats card">
          <h2>🎯 Statistika po pozicijama</h2>
          <div className="positions-grid">
            <div className="position-item">
              <div className="position-header">
                <span className="position-icon">⚽</span>
                <h3>Napadač</h3>
              </div>
              <div className="position-stats-grid">
                <div className="pos-stat">
                  <span className="pos-stat-value">{stats.positionStats.forward.matches}</span>
                  <span className="pos-stat-label">Utakmica</span>
                </div>
                <div className="pos-stat">
                  <span className="pos-stat-value">{stats.positionStats.forward.goals}</span>
                  <span className="pos-stat-label">Golovi</span>
                </div>
                <div className="pos-stat">
                  <span className="pos-stat-value">{stats.positionStats.forward.assists}</span>
                  <span className="pos-stat-label">Asistencije</span>
                </div>
              </div>
              <div className="position-bar">
                <div 
                  className="position-bar-fill forward"
                  style={{ width: `${(stats.positionStats.forward.matches / stats.overview.totalMatches) * 100}%` }}
                />
              </div>
            </div>

            <div className="position-item">
              <div className="position-header">
                <span className="position-icon">🎨</span>
                <h3>Vezni</h3>
              </div>
              <div className="position-stats-grid">
                <div className="pos-stat">
                  <span className="pos-stat-value">{stats.positionStats.midfielder.matches}</span>
                  <span className="pos-stat-label">Utakmica</span>
                </div>
                <div className="pos-stat">
                  <span className="pos-stat-value">{stats.positionStats.midfielder.goals}</span>
                  <span className="pos-stat-label">Golovi</span>
                </div>
                <div className="pos-stat">
                  <span className="pos-stat-value">{stats.positionStats.midfielder.assists}</span>
                  <span className="pos-stat-label">Asistencije</span>
                </div>
              </div>
              <div className="position-bar">
                <div 
                  className="position-bar-fill midfielder"
                  style={{ width: `${(stats.positionStats.midfielder.matches / stats.overview.totalMatches) * 100}%` }}
                />
              </div>
            </div>

            <div className="position-item">
              <div className="position-header">
                <span className="position-icon">🛡️</span>
                <h3>Obrambeni</h3>
              </div>
              <div className="position-stats-grid">
                <div className="pos-stat">
                  <span className="pos-stat-value">{stats.positionStats.defender.matches}</span>
                  <span className="pos-stat-label">Utakmica</span>
                </div>
                <div className="pos-stat">
                  <span className="pos-stat-value">{stats.positionStats.defender.goals}</span>
                  <span className="pos-stat-label">Golovi</span>
                </div>
                <div className="pos-stat">
                  <span className="pos-stat-value">{stats.positionStats.defender.assists}</span>
                  <span className="pos-stat-label">Asistencije</span>
                </div>
              </div>
              <div className="position-bar">
                <div 
                  className="position-bar-fill defender"
                  style={{ width: `${(stats.positionStats.defender.matches / stats.overview.totalMatches) * 100}%` }}
                />
              </div>
            </div>

            <div className="position-item">
              <div className="position-header">
                <span className="position-icon">🥅</span>
                <h3>Golman</h3>
              </div>
              <div className="position-stats-grid">
                <div className="pos-stat">
                  <span className="pos-stat-value">{stats.positionStats.goalkeeper.matches}</span>
                  <span className="pos-stat-label">Utakmica</span>
                </div>
                <div className="pos-stat">
                  <span className="pos-stat-value">{stats.positionStats.goalkeeper.goals}</span>
                  <span className="pos-stat-label">Golovi</span>
                </div>
                <div className="pos-stat">
                  <span className="pos-stat-value">{stats.positionStats.goalkeeper.assists}</span>
                  <span className="pos-stat-label">Asistencije</span>
                </div>
              </div>
              <div className="position-bar">
                <div 
                  className="position-bar-fill goalkeeper"
                  style={{ width: `${(stats.positionStats.goalkeeper.matches / stats.overview.totalMatches) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="top-performances card">
          <h2>🏆 Top Performanse</h2>
          <div className="performances-list">
            {stats.topPerformances.map((perf, index) => (
              <div key={index} className="performance-item">
                <div className="performance-rank">#{index + 1}</div>
                <div className="performance-details">
                  <h4>{perf.stat}</h4>
                  <p className="performance-value">{perf.value}</p>
                  <p className="performance-match">{perf.match}</p>
                  <p className="performance-date">
                    {new Date(perf.date).toLocaleDateString('hr-HR')}
                  </p>
                </div>
                <div className="performance-medal">
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index === 3 && '🏅'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="predictions-section card">
          <h2>🔮 AI Predikcije</h2>
          <p className="predictions-subtitle">Predviđanja ishoda na temelju povijesti i forme</p>
          
          <div className="predictions-grid">
            {stats.predictions.map((pred, index) => (
              <div key={index} className="prediction-card">
                <h4>vs {pred.opponent}</h4>
                
                <div className="prediction-bars">
                  <div className="prediction-bar-item">
                    <span className="prediction-label">Pobjeda</span>
                    <div className="prediction-bar">
                      <div 
                        className="prediction-bar-fill win-fill"
                        style={{ width: `${pred.winProbability}%` }}
                      />
                    </div>
                    <span className="prediction-value">{pred.winProbability}%</span>
                  </div>

                  <div className="prediction-bar-item">
                    <span className="prediction-label">Neriješeno</span>
                    <div className="prediction-bar">
                      <div 
                        className="prediction-bar-fill draw-fill"
                        style={{ width: `${pred.drawProbability}%` }}
                      />
                    </div>
                    <span className="prediction-value">{pred.drawProbability}%</span>
                  </div>

                  <div className="prediction-bar-item">
                    <span className="prediction-label">Poraz</span>
                    <div className="prediction-bar">
                      <div 
                        className="prediction-bar-fill loss-fill"
                        style={{ width: `${pred.lossProbability}%` }}
                      />
                    </div>
                    <span className="prediction-value">{pred.lossProbability}%</span>
                  </div>
                </div>

                <div className="prediction-recommendation">
                  {pred.winProbability > 60 ? (
                    <span className="rec-positive">✓ Preporučena utakmica</span>
                  ) : pred.winProbability > 40 ? (
                    <span className="rec-neutral">⚠ Izjednačena utakmica</span>
                  ) : (
                    <span className="rec-negative">⚡ Izazovna utakmica</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="prediction-disclaimer">
            <small>* Predikcije su bazirane na AI analizi povijesti utakmica, trenutne forme i drugih faktora</small>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Statistics;