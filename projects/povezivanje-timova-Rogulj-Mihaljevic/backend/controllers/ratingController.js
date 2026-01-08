const User = require('../models/User');
const PlayerStats = require('../models/PlayerStats');
const { calculateUserRating } = require('../utils/ratingCalculator');
const { createActivityHelper } = require('./activityController');
const { createNotificationHelper } = require('./notificationController'); // ✅ DODANO

// Dohvati leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const { sport, limit = 100, rank } = req.query;
    
    const query = {};
    if (rank) query.rank = rank;

    const users = await User.find(query)
      .select('username avatar rating rank sport location stats')
      .sort({ 'rating.overall': -1 })
      .limit(parseInt(limit));

    const leaderboard = users.map((user, index) => ({
      ...user.toObject(),
      position: index + 1
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dohvati rating korisnika
exports.getUserRating = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('username avatar rating rank sport location stats');

    if (!user) {
      return res.status(404).json({ message: 'Korisnik ne postoji' });
    }

    const betterPlayers = await User.countDocuments({
      'rating.overall': { $gt: user.rating.overall }
    });

    res.json({
      ...user.toObject(),
      leaderboardPosition: betterPlayers + 1
    });
  } catch (error) {
    console.error('Get user rating error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Ručno preračunaj rating
exports.recalculateRating = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    const oldRank = user.rank;

    const allStats = await PlayerStats.find({ user: userId });
    
    if (allStats.length === 0) {
      return res.status(400).json({ message: 'Nemaš statistike za izračun ratinga!' });
    }

    const totalStats = {
      totalMatches: 0,
      totalWins: 0,
      totalGoals: 0,
      totalAssists: 0,
      totalCleanSheets: 0,
      totalYellowCards: 0,
      totalRedCards: 0
    };

    allStats.forEach(stat => {
      totalStats.totalMatches += stat.totalMatches || 0;
      totalStats.totalWins += stat.wins || 0;
      totalStats.totalGoals += stat.goalsScored || 0;
      totalStats.totalAssists += stat.assists || 0;
      totalStats.totalCleanSheets += stat.cleanSheets || 0;
      totalStats.totalYellowCards += stat.yellowCards || 0;
      totalStats.totalRedCards += stat.redCards || 0;
    });

    const newRating = calculateUserRating(totalStats);
    const newRank = newRating.rank;

    user.rating = newRating;
    user.rank = newRank;
    user.stats = {
      totalMatches: totalStats.totalMatches,
      totalWins: totalStats.totalWins,
      totalGoals: totalStats.totalGoals
    };
    
    await user.save();

    // ✅ Provjeri je li rank up
    if (oldRank !== newRank) {
      // Kreiraj aktivnost
      try {
        await createActivityHelper(
          userId,
          'rank_up',
          {
            oldRank: oldRank,
            newRank: newRank
          },
          'public'
        );
      } catch (activityErr) {
        console.error('Greška pri kreiranju aktivnosti za rank up:', activityErr);
      }

      // ✅ NOVO - Notifikacija za rank up
      try {
        await createNotificationHelper(
          userId,
          'rank_up',
          '⬆️ Rank Up!',
          `Čestitamo! Napredovao si u ${newRank.toUpperCase()} rank!`,
          '/ratings',
          { oldRank, newRank }
        );
      } catch (notifErr) {
        console.error('Greška pri kreiranju notifikacije za rank up:', notifErr);
      }
    }

    res.json({ 
      message: 'Rating preračunat!', 
      rating: newRating,
      rankChanged: oldRank !== newRank,
      oldRank,
      newRank
    });
  } catch (error) {
    console.error('Recalculate rating error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dohvati achievements
exports.getAchievements = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    const allStats = await PlayerStats.find({ user: userId });

    const totalStats = {
      totalMatches: 0,
      totalWins: 0,
      totalGoals: 0
    };

    allStats.forEach(stat => {
      totalStats.totalMatches += stat.totalMatches || 0;
      totalStats.totalWins += stat.wins || 0;
      totalStats.totalGoals += stat.goalsScored || 0;
    });

    const achievements = [
      {
        id: 'first_match',
        name: 'Prva utakmica',
        description: 'Odigraj prvu utakmicu',
        icon: '⚽',
        unlocked: totalStats.totalMatches >= 1,
        progress: Math.min(totalStats.totalMatches, 1),
        required: 1
      },
      {
        id: 'veteran',
        name: 'Veteran',
        description: 'Odigraj 50 utakmica',
        icon: '🎖️',
        unlocked: totalStats.totalMatches >= 50,
        progress: totalStats.totalMatches,
        required: 50
      },
      {
        id: 'legend',
        name: 'Legenda',
        description: 'Odigraj 100 utakmica',
        icon: '👑',
        unlocked: totalStats.totalMatches >= 100,
        progress: totalStats.totalMatches,
        required: 100
      },
      {
        id: 'first_win',
        name: 'Prva pobjeda',
        description: 'Pobijedi u prvoj utakmici',
        icon: '🏆',
        unlocked: totalStats.totalWins >= 1,
        progress: Math.min(totalStats.totalWins, 1),
        required: 1
      },
      {
        id: 'champion',
        name: 'Prvak',
        description: 'Pobijedi u 25 utakmica',
        icon: '🥇',
        unlocked: totalStats.totalWins >= 25,
        progress: totalStats.totalWins,
        required: 25
      },
      {
        id: 'scorer',
        name: 'Strijelac',
        description: 'Postigni 10 golova',
        icon: '⚽',
        unlocked: totalStats.totalGoals >= 10,
        progress: totalStats.totalGoals,
        required: 10
      },
      {
        id: 'top_scorer',
        name: 'Najbolji strijelac',
        description: 'Postigni 50 golova',
        icon: '🔥',
        unlocked: totalStats.totalGoals >= 50,
        progress: totalStats.totalGoals,
        required: 50
      },
      {
        id: 'gold_rank',
        name: 'Gold Rank',
        description: 'Dosegni Gold rank',
        icon: '🥇',
        unlocked: user.rank === 'gold' || user.rank === 'platinum' || user.rank === 'diamond' || user.rank === 'master',
        progress: user.rating.overall,
        required: 1800
      },
      {
        id: 'diamond_rank',
        name: 'Diamond Rank',
        description: 'Dosegni Diamond rank',
        icon: '💎',
        unlocked: user.rank === 'diamond' || user.rank === 'master',
        progress: user.rating.overall,
        required: 2600
      }
    ];

    res.json(achievements);
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;