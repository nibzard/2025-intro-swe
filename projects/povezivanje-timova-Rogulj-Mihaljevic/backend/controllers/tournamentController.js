const Tournament = require('../models/Tournament');
const User = require('../models/User');

// Dohvati sve turnire
exports.getTournaments = async (req, res) => {
  try {
    const { status, sport, city } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (sport) query.sport = sport;
    if (city) query.city = city;

    const tournaments = await Tournament.find(query)
      .populate('creator', 'username avatar')
      .sort({ startDate: 1 });

    res.json(tournaments);
  } catch (error) {
    console.error('Get tournaments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dohvati jedan turnir
exports.getTournament = async (req, res) => {
  try {
    const { id } = req.params;

    const tournament = await Tournament.findById(id)
      .populate('creator', 'username email avatar')
      .populate('registeredTeams.captain', 'username email avatar');

    if (!tournament) {
      return res.status(404).json({ message: 'Turnir ne postoji' });
    }

    res.json(tournament);
  } catch (error) {
    console.error('Get tournament error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Kreiraj turnir
exports.createTournament = async (req, res) => {
  try {
    const userId = req.user.id;
    const tournamentData = req.body;

    // Validacija
    if (!tournamentData.name || !tournamentData.sport || !tournamentData.startDate) {
      return res.status(400).json({ message: 'Popuni sva obavezna polja!' });
    }

    // Provjeri je li maxTeams custom ili standard
    let maxTeams = tournamentData.maxTeams;
    if (maxTeams === 'custom' && tournamentData.customMaxTeams) {
      maxTeams = parseInt(tournamentData.customMaxTeams);
    }

    const tournament = new Tournament({
      ...tournamentData,
      maxTeams,
      creator: userId,
      status: new Date(tournamentData.startDate) > new Date() ? 'upcoming' : 'active'
    });

    await tournament.save();
    await tournament.populate('creator', 'username avatar');

    res.status(201).json({ 
      message: 'Turnir kreiran!', 
      tournament 
    });
  } catch (error) {
    console.error('Create tournament error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Registriraj tim na turnir
exports.registerTeam = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { teamName, players } = req.body;
    const userId = req.user.id;

    if (!teamName || !players || players.length === 0) {
      return res.status(400).json({ message: 'Popuni sve podatke o timu!' });
    }

    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) {
      return res.status(404).json({ message: 'Turnir ne postoji' });
    }

    // Provjeri je li turnir pun
    if (tournament.registeredTeams.length >= tournament.maxTeams) {
      return res.status(400).json({ message: 'Turnir je pun!' });
    }

    // Provjeri je li tim već registriran
    const alreadyRegistered = tournament.registeredTeams.some(
      team => team.teamName === teamName
    );

    if (alreadyRegistered) {
      return res.status(400).json({ message: 'Tim s tim imenom već postoji!' });
    }

    // Provjeri broj igrača
    if (players.length !== tournament.teamSize) {
      return res.status(400).json({ 
        message: `Tim mora imati točno ${tournament.teamSize} igrača!` 
      });
    }

    // Dodaj tim
    tournament.registeredTeams.push({
      teamName,
      captain: userId,
      players,
      registeredAt: new Date()
    });

    await tournament.save();
    await tournament.populate('registeredTeams.captain', 'username avatar');

    res.json({ 
      message: 'Tim uspješno registriran!', 
      tournament 
    });
  } catch (error) {
    console.error('Register team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generiraj bracket
exports.generateBracket = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const userId = req.user.id;

    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) {
      return res.status(404).json({ message: 'Turnir ne postoji' });
    }

    // Provjeri je li kreator
    if (tournament.creator.toString() !== userId) {
      return res.status(403).json({ message: 'Samo kreator može generirati bracket!' });
    }

    // Provjeri ima li dovoljno timova
    if (tournament.registeredTeams.length < 2) {
      return res.status(400).json({ message: 'Treba barem 2 tima za bracket!' });
    }

    // Generiraj bracket (knockout format)
    const teams = tournament.registeredTeams.map(t => t.teamName);
    const bracket = [];
    
    // Round 1
    let matchNumber = 1;
    for (let i = 0; i < teams.length; i += 2) {
      if (teams[i + 1]) {
        bracket.push({
          round: 1,
          matchNumber: matchNumber++,
          team1: teams[i],
          team2: teams[i + 1],
          score1: null,
          score2: null,
          winner: null
        });
      }
    }

    // Ostali roundovi (placeholder)
    let currentRound = 1;
    let matchesInRound = bracket.length;
    
    while (matchesInRound > 1) {
      currentRound++;
      const nextRoundMatches = Math.ceil(matchesInRound / 2);
      
      for (let i = 0; i < nextRoundMatches; i++) {
        bracket.push({
          round: currentRound,
          matchNumber: matchNumber++,
          team1: null, // TBD
          team2: null, // TBD
          score1: null,
          score2: null,
          winner: null
        });
      }
      
      matchesInRound = nextRoundMatches;
    }

    tournament.bracket = bracket;
    tournament.status = 'active';
    await tournament.save();

    res.json({ 
      message: 'Bracket generiran!', 
      tournament 
    });
  } catch (error) {
    console.error('Generate bracket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Ažuriraj rezultat utakmice
exports.updateMatch = async (req, res) => {
  try {
    const { tournamentId, matchId } = req.params;
    const { score1, score2 } = req.body;
    const userId = req.user.id;

    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) {
      return res.status(404).json({ message: 'Turnir ne postoji' });
    }

    // Provjeri je li kreator
    if (tournament.creator.toString() !== userId) {
      return res.status(403).json({ message: 'Samo kreator može ažurirati rezultate!' });
    }

    // Pronađi utakmicu
    const match = tournament.bracket.id(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Utakmica ne postoji' });
    }

    // Ažuriraj rezultat
    match.score1 = score1;
    match.score2 = score2;
    match.winner = score1 > score2 ? match.team1 : match.team2;
    match.playedDate = new Date();

    // Ažuriraj sljedeću rundu
    const nextRound = match.round + 1;
    const nextMatchNumber = Math.ceil(match.matchNumber / 2);
    const nextMatch = tournament.bracket.find(
      m => m.round === nextRound && m.matchNumber === nextMatchNumber
    );

    if (nextMatch) {
      if (match.matchNumber % 2 === 1) {
        nextMatch.team1 = match.winner;
      } else {
        nextMatch.team2 = match.winner;
      }
    }

    await tournament.save();

    res.json({ 
      message: 'Rezultat ažuriran!', 
      tournament 
    });
  } catch (error) {
    console.error('Update match error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Obriši turnir
exports.deleteTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const userId = req.user.id;

    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) {
      return res.status(404).json({ message: 'Turnir ne postoji' });
    }

    // Provjeri je li kreator
    if (tournament.creator.toString() !== userId) {
      return res.status(403).json({ message: 'Samo kreator može obrisati turnir!' });
    }

    await Tournament.findByIdAndDelete(tournamentId);

    res.json({ message: 'Turnir obrisan!' });
  } catch (error) {
    console.error('Delete tournament error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;