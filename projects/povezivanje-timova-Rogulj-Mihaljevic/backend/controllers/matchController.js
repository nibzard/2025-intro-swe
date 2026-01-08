const Match = require('../models/Match');
const User = require('../models/User');

// Dohvati sve utakmice
exports.getMatches = async (req, res) => {
  try {
    const { status, sport, upcoming } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (sport) query.sport = sport;
    
    // Filtriraj samo nadolazeće
    if (upcoming === 'true') {
      query.scheduledDate = { $gte: new Date() };
      query.status = { $in: ['scheduled', 'live'] };
    }

    const matches = await Match.find(query)
      .populate('createdBy', 'username avatar')
      .populate('team1.players', 'username avatar')
      .populate('team2.players', 'username avatar')
      .sort({ scheduledDate: 1 });

    res.json(matches);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dohvati jednu utakmicu
exports.getMatch = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId)
      .populate('createdBy', 'username avatar')
      .populate('team1.players', 'username avatar')
      .populate('team2.players', 'username avatar')
      .populate('moderators', 'username avatar');

    if (!match) {
      return res.status(404).json({ message: 'Utakmica ne postoji' });
    }

    res.json(match);
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Kreiraj utakmicu
exports.createMatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const matchData = req.body;

    // Validacija
    if (!matchData.team1?.name || !matchData.team2?.name || !matchData.scheduledDate) {
      return res.status(400).json({ message: 'Popuni sva obavezna polja!' });
    }

    const match = new Match({
      ...matchData,
      createdBy: userId,
      moderators: [userId] // Kreator je automatski moderator
    });

    await match.save();
    await match.populate('createdBy', 'username avatar');

    res.status(201).json({ 
      message: 'Utakmica kreirana!', 
      match 
    });
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Ažuriraj rezultat
exports.updateScore = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { team1Score, team2Score } = req.body;
    const userId = req.user.id;

    const match = await Match.findById(matchId);
    
    if (!match) {
      return res.status(404).json({ message: 'Utakmica ne postoji' });
    }

    // Provjeri je li moderator
    if (!match.moderators.includes(userId) && match.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Nemaš pravo ažurirati rezultat!' });
    }

    match.score.team1 = team1Score;
    match.score.team2 = team2Score;
    await match.save();

    res.json({ 
      message: 'Rezultat ažuriran!', 
      match 
    });
  } catch (error) {
    console.error('Update score error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dodaj event (gol, karton, itd.)
exports.addEvent = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { type, team, player, minute, description } = req.body;
    const userId = req.user.id;

    if (!type || !team || !minute) {
      return res.status(400).json({ message: 'Popuni obavezna polja!' });
    }

    const match = await Match.findById(matchId);
    
    if (!match) {
      return res.status(404).json({ message: 'Utakmica ne postoji' });
    }

    // Provjeri je li moderator
    if (!match.moderators.includes(userId) && match.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Nemaš pravo dodavati evente!' });
    }

    // Dodaj event
    match.events.push({
      type,
      team,
      player,
      minute,
      description,
      timestamp: new Date()
    });

    // Ako je gol, ažuriraj rezultat
    if (type === 'goal') {
      if (team === 'team1') {
        match.score.team1 += 1;
      } else {
        match.score.team2 += 1;
      }
    }

    await match.save();

    res.json({ 
      message: 'Event dodan!', 
      match 
    });
  } catch (error) {
    console.error('Add event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Ažuriraj statistiku
exports.updateStats = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { stats } = req.body;
    const userId = req.user.id;

    const match = await Match.findById(matchId);
    
    if (!match) {
      return res.status(404).json({ message: 'Utakmica ne postoji' });
    }

    // Provjeri je li moderator
    if (!match.moderators.includes(userId) && match.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Nemaš pravo ažurirati statistiku!' });
    }

    match.stats = stats;
    await match.save();

    res.json({ 
      message: 'Statistika ažurirana!', 
      match 
    });
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Promijeni status utakmice
exports.updateStatus = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['scheduled', 'live', 'finished', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Nevažeći status!' });
    }

    const match = await Match.findById(matchId);
    
    if (!match) {
      return res.status(404).json({ message: 'Utakmica ne postoji' });
    }

    // Provjeri je li moderator
    if (!match.moderators.includes(userId) && match.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Nemaš pravo mijenjati status!' });
    }

    match.status = status;
    
    if (status === 'live' && !match.startTime) {
      match.startTime = new Date();
    }
    
    if (status === 'finished' && !match.endTime) {
      match.endTime = new Date();
    }

    await match.save();

    res.json({ 
      message: 'Status ažuriran!', 
      match 
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dodaj live komentar
exports.addCommentary = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { minute, text } = req.body;
    const userId = req.user.id;

    if (!minute || !text) {
      return res.status(400).json({ message: 'Popuni obavezna polja!' });
    }

    const match = await Match.findById(matchId);
    
    if (!match) {
      return res.status(404).json({ message: 'Utakmica ne postoji' });
    }

    // Provjeri je li moderator
    if (!match.moderators.includes(userId) && match.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Nemaš pravo dodavati komentare!' });
    }

    match.liveCommentary.push({
      minute,
      text,
      timestamp: new Date()
    });

    await match.save();

    res.json({ 
      message: 'Komentar dodan!', 
      match 
    });
  } catch (error) {
    console.error('Add commentary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Obriši utakmicu
exports.deleteMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    const match = await Match.findById(matchId);
    
    if (!match) {
      return res.status(404).json({ message: 'Utakmica ne postoji' });
    }

    // Samo kreator može obrisati
    if (match.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Nemaš pravo obrisati ovu utakmicu!' });
    }

    await Match.findByIdAndDelete(matchId);

    res.json({ message: 'Utakmica obrisana!' });
  } catch (error) {
    console.error('Delete match error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;