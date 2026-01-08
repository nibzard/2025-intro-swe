const PlayerStats = require('../models/PlayerStats');
const { calculateUserRating } = require('../utils/ratingCalculator');
// Dohvati statistiku
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sport } = req.query;

    const query = { user: userId };
    if (sport) {
      query.sport = sport;
    }

    const stats = await PlayerStats.find(query);
    
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Kreiraj/ažuriraj statistiku za sport
exports.upsertStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sport, stats } = req.body;

    let playerStats = await PlayerStats.findOne({ user: userId, sport });

    if (!playerStats) {
      playerStats = new PlayerStats({
        user: userId,
        sport,
        ...stats
      });
    } else {
      Object.assign(playerStats, stats);
    }

    await playerStats.save();

    res.json({ message: 'Statistika ažurirana!', stats: playerStats });
  } catch (error) {
    console.error('Upsert stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dodaj utakmicu
// Dodaj utakmicu
exports.addMatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sport, matchData } = req.body;

    let playerStats = await PlayerStats.findOne({ user: userId, sport });

    if (!playerStats) {
      playerStats = new PlayerStats({ user: userId, sport });
    }

    // Dodaj utakmicu u povijest
    playerStats.matchHistory.push(matchData);

    // Ažuriraj statistiku
    playerStats.totalMatches += 1;
    if (matchData.result === 'win') playerStats.wins += 1;
    if (matchData.result === 'loss') playerStats.losses += 1;
    if (matchData.result === 'draw') playerStats.draws += 1;
    
    playerStats.goalsScored += matchData.goalsScored || 0;
    playerStats.assists += matchData.assists || 0;

    // Ažuriraj pozicije
    if (matchData.position) {
      const positionMap = {
        'Napadač': 'forward',
        'Vezni': 'midfielder',
        'Obrambeni': 'defender',
        'Golman': 'goalkeeper'
      };
      const pos = positionMap[matchData.position];
      if (pos) {
        playerStats.positionStats[pos] += 1;
      }
    }

    await playerStats.save();

    // NOVO - Ažuriraj rating u User modelu
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    // Agregiraj stats iz svih sportova
    const allStats = await PlayerStats.find({ user: userId });
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

    // Izračunaj rating
    const newRating = calculateUserRating(totalStats);
    
    // Ažuriraj user rating
    user.rating = newRating;
    user.rank = newRating.rank;
    user.stats = {
      totalMatches: totalStats.totalMatches,
      totalWins: totalStats.totalWins,
      totalGoals: totalStats.totalGoals
    };
    
    await user.save();

    res.json({ 
      message: 'Utakmica dodana!', 
      stats: playerStats,
      rating: newRating 
    });
  } catch (error) {
    console.error('Add match error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// Obriši utakmicu
exports.deleteMatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { matchId } = req.params;
    const { sport } = req.query;

    const playerStats = await PlayerStats.findOne({ user: userId, sport });

    if (!playerStats) {
      return res.status(404).json({ message: 'Statistika ne postoji' });
    }

    const match = playerStats.matchHistory.id(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Utakmica ne postoji' });
    }

    // Oduzmi statistiku
    playerStats.totalMatches -= 1;
    if (match.result === 'win') playerStats.wins -= 1;
    if (match.result === 'loss') playerStats.losses -= 1;
    if (match.result === 'draw') playerStats.draws -= 1;
    
    playerStats.goalsScored -= match.goalsScored || 0;
    playerStats.assists -= match.assists || 0;

    // Obriši utakmicu
    playerStats.matchHistory.pull(matchId);

    await playerStats.save();

    res.json({ message: 'Utakmica obrisana!', stats: playerStats });
  } catch (error) {
    console.error('Delete match error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;