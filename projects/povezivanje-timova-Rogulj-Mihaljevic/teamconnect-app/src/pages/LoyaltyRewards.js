import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import './LoyaltyRewards.css';

function LoyaltyRewards() {
  const navigate = useNavigate();
  const [userProgress, setUserProgress] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, achievements, rewards, shop
  const [toast, setToast] = useState(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  const loadLoyaltyData = () => {
    // Učitaj korisnikov progress
    const savedProgress = localStorage.getItem('loyaltyProgress');
    if (savedProgress) {
      setUserProgress(JSON.parse(savedProgress));
    } else {
      const demoProgress = {
        level: 5,
        currentXP: 2850,
        nextLevelXP: 4000,
        totalXP: 12850,
        coins: 4580,
        tier: 'Gold', // Bronze, Silver, Gold, Platinum, Diamond
        streakDays: 12,
        totalMatches: 67,
        totalWins: 42,
        memberSince: '2024-06-15'
      };
      setUserProgress(demoProgress);
      localStorage.setItem('loyaltyProgress', JSON.stringify(demoProgress));
    }

    // Učitaj achievements
    const savedAchievements = localStorage.getItem('loyaltyAchievements');
    if (savedAchievements) {
      setAchievements(JSON.parse(savedAchievements));
    } else {
      const demoAchievements = [
        {
          id: 1,
          name: 'Dobrodošlica',
          description: 'Registriraj se i kreiraj prvi tim',
          icon: '🎉',
          xpReward: 100,
          coinReward: 50,
          unlocked: true,
          unlockedDate: '2024-06-15',
          rarity: 'common'
        },
        {
          id: 2,
          name: 'Winning Streak',
          description: 'Pobijedi 5 utakmica uzastopno',
          icon: '🔥',
          xpReward: 250,
          coinReward: 150,
          unlocked: true,
          unlockedDate: '2024-08-20',
          rarity: 'rare'
        },
        {
          id: 3,
          name: 'Team Builder',
          description: 'Kreiraj 10 različitih timova',
          icon: '👥',
          xpReward: 300,
          coinReward: 200,
          unlocked: true,
          unlockedDate: '2024-10-05',
          rarity: 'rare'
        },
        {
          id: 4,
          name: 'Tournament Champion',
          description: 'Osvoji turnir',
          icon: '🏆',
          xpReward: 500,
          coinReward: 500,
          unlocked: false,
          progress: 1,
          total: 1,
          rarity: 'epic'
        },
        {
          id: 5,
          name: 'Hat-trick Master',
          description: 'Postići 3 gola u jednoj utakmici 5 puta',
          icon: '⚽',
          xpReward: 400,
          coinReward: 300,
          unlocked: false,
          progress: 2,
          total: 5,
          rarity: 'epic'
        },
        {
          id: 6,
          name: 'Social Butterfly',
          description: 'Dodaj 50 prijatelja',
          icon: '🦋',
          xpReward: 350,
          coinReward: 250,
          unlocked: false,
          progress: 12,
          total: 50,
          rarity: 'rare'
        },
        {
          id: 7,
          name: 'Perfect Season',
          description: 'Završi sezonu bez poraza',
          icon: '💎',
          xpReward: 1000,
          coinReward: 1000,
          unlocked: false,
          progress: 0,
          total: 1,
          rarity: 'legendary'
        },
        {
          id: 8,
          name: 'Century Club',
          description: 'Igraj 100 utakmica',
          icon: '💯',
          xpReward: 600,
          coinReward: 400,
          unlocked: false,
          progress: 67,
          total: 100,
          rarity: 'epic'
        }
      ];
      setAchievements(demoAchievements);
      localStorage.setItem('loyaltyAchievements', JSON.stringify(demoAchievements));
    }

    // Učitaj rewards shop
    const savedRewards = localStorage.getItem('loyaltyRewards');
    if (savedRewards) {
      setRewards(JSON.parse(savedRewards));
    } else {
      const demoRewards = [
        {
          id: 1,
          name: 'Premium Avatar Pack',
          description: '10 ekskluzivnih avatara',
          icon: '🎭',
          cost: 500,
          type: 'cosmetic',
          available: true
        },
        {
          id: 2,
          name: 'VIP Status (7 dana)',
          description: 'Pristup VIP funkcijama',
          icon: '👑',
          cost: 1000,
          type: 'premium',
          available: true
        },
        {
          id: 3,
          name: 'Custom Team Badge',
          description: 'Kreiraj vlastiti badge',
          icon: '🛡️',
          cost: 750,
          type: 'cosmetic',
          available: true
        },
        {
          id: 4,
          name: 'Tournament Entry Voucher',
          description: 'Besplatna prijava na turnir',
          icon: '🎫',
          cost: 300,
          type: 'utility',
          available: true
        },
        {
          id: 5,
          name: 'XP Boost (24h)',
          description: '+50% XP na 24 sata',
          icon: '⚡',
          cost: 400,
          type: 'boost',
          available: true
        },
        {
          id: 6,
          name: 'Profile Theme Pack',
          description: '5 premium tema za profil',
          icon: '🎨',
          cost: 600,
          type: 'cosmetic',
          available: true
        },
        {
          id: 7,
          name: 'MVP Badge',
          description: 'Poseban badge za profil',
          icon: '⭐',
          cost: 800,
          type: 'cosmetic',
          available: true
        },
        {
          id: 8,
          name: 'Premium Emotes Pack',
          description: '15 ekskluzivnih emotea',
          icon: '😎',
          cost: 450,
          type: 'cosmetic',
          available: true
        }
      ];
      setRewards(demoRewards);
      localStorage.setItem('loyaltyRewards', JSON.stringify(demoRewards));
    }
  };

  const getTierColor = (tier) => {
    const colors = {
      Bronze: '#cd7f32',
      Silver: '#c0c0c0',
      Gold: '#ffd700',
      Platinum: '#e5e4e2',
      Diamond: '#b9f2ff'
    };
    return colors[tier] || colors.Bronze;
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#9e9e9e',
      rare: '#2196f3',
      epic: '#9c27b0',
      legendary: '#ff9800'
    };
    return colors[rarity] || colors.common;
  };

  const getRarityLabel = (rarity) => {
    const labels = {
      common: 'Obični',
      rare: 'Rijedak',
      epic: 'Epski',
      legendary: 'Legendarni'
    };
    return labels[rarity] || labels.common;
  };

  const handleRedeemReward = (reward) => {
    if (userProgress.coins < reward.cost) {
      setToast({ message: 'Nemaš dovoljno coina!', type: 'error' });
      return;
    }
    setSelectedReward(reward);
    setShowRedeemModal(true);
  };

  const confirmRedeem = () => {
    const updatedProgress = {
      ...userProgress,
      coins: userProgress.coins - selectedReward.cost
    };
    setUserProgress(updatedProgress);
    localStorage.setItem('loyaltyProgress', JSON.stringify(updatedProgress));

    setShowRedeemModal(false);
    setToast({ message: `${selectedReward.name} otkupljen! 🎉`, type: 'success' });
    setSelectedReward(null);
  };

  const calculateProgress = () => {
    return ((userProgress.currentXP / userProgress.nextLevelXP) * 100).toFixed(1);
  };

  if (!userProgress) {
    return (
      <div className="loyalty-rewards-page">
        <Navbar />
        <div className="loading">Učitavanje...</div>
      </div>
    );
  }

  return (
    <div className="loyalty-rewards-page">
      <Navbar />
      
      <div className="loyalty-container">
        <div className="loyalty-header">
          <h1>🏅 Loyalty Rewards</h1>
          <p>Zaradite nagrade kroz igru i aktivnost</p>
        </div>

        <div className="user-status-card card">
          <div className="status-header">
            <div className="user-avatar-large">
              {currentUser.avatar || '👤'}
            </div>
            <div className="user-info">
              <h2>{currentUser.username}</h2>
              <div 
                className="user-tier"
                style={{ background: getTierColor(userProgress.tier) }}
              >
                {userProgress.tier} Tier
              </div>
            </div>
          </div>

          <div className="status-stats">
            <div className="status-stat">
              <div className="stat-icon">🔥</div>
              <div className="stat-content">
                <span className="stat-value">{userProgress.streakDays}</span>
                <span className="stat-label">Dana Streak</span>
              </div>
            </div>

            <div className="status-stat">
              <div className="stat-icon">⚡</div>
              <div className="stat-content">
                <span className="stat-value">Level {userProgress.level}</span>
                <span className="stat-label">Razina</span>
              </div>
            </div>

            <div className="status-stat">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <span className="stat-value">{userProgress.coins}</span>
                <span className="stat-label">Coins</span>
              </div>
            </div>

            <div className="status-stat">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <span className="stat-value">{userProgress.totalXP}</span>
                <span className="stat-label">Total XP</span>
              </div>
            </div>
          </div>

          <div className="level-progress">
            <div className="progress-header">
              <span>Level {userProgress.level}</span>
              <span>{userProgress.currentXP} / {userProgress.nextLevelXP} XP</span>
            </div>
            <div className="progress-bar-large">
              <div 
                className="progress-fill-large"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
            <div className="progress-footer">
              <span>{calculateProgress()}% do Level {userProgress.level + 1}</span>
            </div>
          </div>
        </div>

        <div className="loyalty-tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Pregled
          </button>
          <button 
            className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            Achievements ({achievements.filter(a => a.unlocked).length}/{achievements.length})
          </button>
          <button 
            className={`tab ${activeTab === 'rewards' ? 'active' : ''}`}
            onClick={() => setActiveTab('rewards')}
          >
            Rewards Shop
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="overview-grid">
              <div className="overview-card card">
                <h3>📈 Tvoj Napredak</h3>
                <div className="overview-stats">
                  <p><strong>Član od:</strong> {new Date(userProgress.memberSince).toLocaleDateString('hr-HR')}</p>
                  <p><strong>Ukupno utakmica:</strong> {userProgress.totalMatches}</p>
                  <p><strong>Pobjede:</strong> {userProgress.totalWins}</p>
                  <p><strong>Win Rate:</strong> {((userProgress.totalWins / userProgress.totalMatches) * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div className="overview-card card">
                <h3>🎯 Kako zaraditi XP & Coins</h3>
                <div className="earning-methods">
                  <div className="earning-item">
                    <span>⚽ Igraj utakmice</span>
                    <span className="earning-reward">+50 XP, +10 Coins</span>
                  </div>
                  <div className="earning-item">
                    <span>🏆 Pobijedi utakmicu</span>
                    <span className="earning-reward">+100 XP, +25 Coins</span>
                  </div>
                  <div className="earning-item">
                    <span>🎖️ Otključaj achievement</span>
                    <span className="earning-reward">Varira</span>
                  </div>
                  <div className="earning-item">
                    <span>👥 Dodaj prijatelja</span>
                    <span className="earning-reward">+20 XP, +5 Coins</span>
                  </div>
                  <div className="earning-item">
                    <span>🔥 Dnevni login</span>
                    <span className="earning-reward">+10 XP, +5 Coins</span>
                  </div>
                </div>
              </div>

              <div className="overview-card card">
                <h3>🌟 Tier Benefiti</h3>
                <div className="tier-benefits">
                  <div className="tier-item bronze">
                    <span className="tier-name">Bronze</span>
                    <span className="tier-perk">Osnovne funkcije</span>
                  </div>
                  <div className="tier-item silver">
                    <span className="tier-name">Silver</span>
                    <span className="tier-perk">+10% XP bonus</span>
                  </div>
                  <div className="tier-item gold">
                    <span className="tier-name">Gold</span>
                    <span className="tier-perk">+25% XP, Custom badge</span>
                  </div>
                  <div className="tier-item platinum">
                    <span className="tier-name">Platinum</span>
                    <span className="tier-perk">+50% XP, Premium features</span>
                  </div>
                  <div className="tier-item diamond">
                    <span className="tier-name">Diamond</span>
                    <span className="tier-perk">+100% XP, Sve unlocked</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="achievements-section">
            <div className="achievements-grid">
              {achievements.map(achievement => (
                <div 
                  key={achievement.id} 
                  className={`achievement-card card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                  style={{ borderColor: getRarityColor(achievement.rarity) }}
                >
                  <div className="achievement-icon-large">{achievement.icon}</div>
                  
                  <div className="achievement-content">
                    <div className="achievement-header-detail">
                      <h4>{achievement.name}</h4>
                      <div 
                        className="achievement-rarity"
                        style={{ background: getRarityColor(achievement.rarity) }}
                      >
                        {getRarityLabel(achievement.rarity)}
                      </div>
                    </div>

                    <p className="achievement-description">{achievement.description}</p>

                    {achievement.unlocked ? (
                      <div className="achievement-unlocked">
                        <span className="unlocked-badge">✓ Otključano</span>
                        <span className="unlocked-date">
                          {new Date(achievement.unlockedDate).toLocaleDateString('hr-HR')}
                        </span>
                      </div>
                    ) : (
                      <div className="achievement-progress">
                        <div className="progress-text">
                          {achievement.progress}/{achievement.total}
                        </div>
                        <div className="progress-bar-small">
                          <div 
                            className="progress-fill-small"
                            style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="achievement-rewards">
                      <span className="reward-item">+{achievement.xpReward} XP</span>
                      <span className="reward-item">+{achievement.coinReward} Coins</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="rewards-section">
            <div className="rewards-balance">
              <span className="balance-label">Dostupno:</span>
              <span className="balance-value">💰 {userProgress.coins} Coins</span>
            </div>

            <div className="rewards-grid">
              {rewards.map(reward => (
                <div key={reward.id} className="reward-card card">
                  <div className="reward-icon-large">{reward.icon}</div>
                  
                  <div className="reward-content">
                    <h4>{reward.name}</h4>
                    <p className="reward-description">{reward.description}</p>
                    
                    <div className="reward-type-badge" data-type={reward.type}>
                      {reward.type === 'cosmetic' && '🎨 Kozmetika'}
                      {reward.type === 'premium' && '👑 Premium'}
                      {reward.type === 'utility' && '🔧 Alat'}
                      {reward.type === 'boost' && '⚡ Boost'}
                    </div>

                    <div className="reward-footer">
                      <span className="reward-cost">💰 {reward.cost}</span>
                      <button 
                        className="btn btn-primary btn-small"
                        onClick={() => handleRedeemReward(reward)}
                        disabled={userProgress.coins < reward.cost}
                      >
                        {userProgress.coins < reward.cost ? 'Premalo coina' : 'Otkupi'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal za potvrdu otkupa */}
      {showRedeemModal && selectedReward && (
        <div className="modal-overlay" onClick={() => setShowRedeemModal(false)}>
          <div className="redeem-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🎁 Potvrdi otkup</h2>
            
            <div className="redeem-item">
              <div className="redeem-icon">{selectedReward.icon}</div>
              <h3>{selectedReward.name}</h3>
              <p>{selectedReward.description}</p>
            </div>

            <div className="redeem-cost">
              <span>Cijena:</span>
              <span className="cost-value">💰 {selectedReward.cost} Coins</span>
            </div>

            <div className="redeem-balance">
              <span>Preostalo nakon kupnje:</span>
              <span className="balance-after">
                💰 {userProgress.coins - selectedReward.cost} Coins
              </span>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowRedeemModal(false)}
              >
                Odustani
              </button>
              <button 
                className="btn btn-primary"
                onClick={confirmRedeem}
              >
                Potvrdi otkup
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default LoyaltyRewards;