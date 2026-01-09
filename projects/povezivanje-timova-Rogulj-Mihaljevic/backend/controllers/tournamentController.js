const Tournament = require('../models/Tournament');
const User = require('../models/User');
const { createActivityHelper } = require('./activityController');

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

    console.log(`✅ Fetched ${tournaments.length} tournaments`);

    res.json(tournaments);
  } catch (error) {
    console.error('❌ Get tournaments error:', error);
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
      console.log('❌ Tournament not found:', id);
      return res.status(404).json({ message: 'Turnir ne postoji' });
    }

    console.log('✅ Tournament fetched:', tournament._id);

    res.json(tournament);
  } catch (error) {
    console.error('❌ Get tournament error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Kreiraj turnir
exports.createTournament = async (req, res) => {
  try {
    const userId = req.user._id;
    const tournamentData = req.body;

    console.log('📥 Create tournament request:', tournamentData);
    console.log('👤 User ID:', userId);

    // Detaljnija validacija
    const missingFields = [];
    
    if (!tournamentData.name || tournamentData.name.trim() === '') {
      missingFields.push('name');
    }
    if (!tournamentData.sport || tournamentData.sport.trim() === '') {
      missingFields.push('sport');
    }
    if (!tournamentData.startDate) {
      missingFields.push('startDate');
    }
    if (!tournamentData.endDate) {
      missingFields.push('endDate');
    }
    if (!tournamentData.location || tournamentData.location.trim() === '') {
      missingFields.push('location');
    }
    if (!tournamentData.city || tournamentData.city.trim() === '') {
      missingFields.push('city');
    }

    if (missingFields.length > 0) {
      console.log('❌ Missing fields:', missingFields);
      return res.status(400).json({ 
        message: 'Popuni sva obavezna polja!',
        missingFields
      });
    }

    // Provjeri je li maxTeams custom ili standard
    let maxTeams = tournamentData.maxTeams;
    if (maxTeams === 'custom' && tournamentData.customMaxTeams) {
      maxTeams = parseInt(tournamentData.customMaxTeams);
    } else if (maxTeams) {
      maxTeams = parseInt(maxTeams);
    } else {
      maxTeams = 8;
    }

    // ✅ NOVO - Min i Max igrača
    const minPlayers = parseInt(tournamentData.minPlayersPerTeam) || 5;
    const maxPlayers = parseInt(tournamentData.maxPlayersPerTeam) || 7;

    // Validacija - max mora biti >= min
    if (maxPlayers < minPlayers) {
      return res.status(400).json({
        message: 'Maksimalan broj igrača mora biti veći ili jednak minimalnom broju!'
      });
    }

    console.log('✅ Max teams:', maxTeams);
    console.log('✅ Players range:', minPlayers, '-', maxPlayers);

    const tournament = new Tournament({
      name: tournamentData.name.trim(),
      sport: tournamentData.sport.trim(),
      location: tournamentData.location.trim(),
      city: tournamentData.city.trim(),
      country: tournamentData.country || 'Hrvatska',
      startDate: tournamentData.startDate,
      endDate: tournamentData.endDate,
      maxTeams,
      minPlayersPerTeam: minPlayers,
      maxPlayersPerTeam: maxPlayers,
      teamSize: minPlayers,
      format: tournamentData.format || 'knockout',
      prizePool: tournamentData.prizePool || 0,
      entryFee: tournamentData.entryFee || 0,
      prize: tournamentData.prize || '',
      rules: tournamentData.rules || '',
      description: tournamentData.description?.trim() || '',
      creator: userId,
      status: new Date(tournamentData.startDate) > new Date() ? 'upcoming' : 'active',
      registeredTeams: [],
      bracket: []
    });

    await tournament.save();
    await tournament.populate('creator', 'username avatar');

    console.log('✅ Tournament created:', tournament._id);

    // Kreiraj aktivnost
    try {
      await createActivityHelper(
        userId,
        'tournament_created',
        {
          tournamentId: tournament._id,
          tournamentName: tournament.name
        },
        'public'
      );
    } catch (activityErr) {
      console.error('Greška pri kreiranju aktivnosti:', activityErr);
    }

    res.status(201).json({ 
      message: 'Turnir kreiran!', 
      tournament 
    });
  } catch (error) {
    console.error('❌ Create tournament error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Registriraj tim na turnir
exports.registerTeam = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { teamName, players } = req.body;
    const userId = req.user._id;

    console.log('📥 Register team request:', { tournamentId, teamName, userId });

    if (!teamName || !players || players.length === 0) {
      return res.status(400).json({ message: 'Popuni sve podatke o timu!' });
    }

    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) {
      console.log('❌ Tournament not found:', tournamentId);
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

    // ✅ NOVO - Provjeri min/max igrača
    const minPlayers = tournament.minPlayersPerTeam || tournament.teamSize || 5;
    const maxPlayers = tournament.maxPlayersPerTeam || tournament.teamSize || 5;

    if (players.length < minPlayers) {
      return res.status(400).json({ 
        message: `Tim mora imati minimalno ${minPlayers} igrača!` 
      });
    }

    if (players.length > maxPlayers) {
      return res.status(400).json({ 
        message: `Tim može imati maksimalno ${maxPlayers} igrača (sa zamjenama)!` 
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

    console.log('✅ Team registered to tournament');

    // Kreiraj aktivnost
    try {
      await createActivityHelper(
        userId,
        'tournament_joined',
        {
          tournamentId: tournament._id,
          tournamentName: tournament.name,
          teamName: teamName
        },
        'public'
      );
    } catch (activityErr) {
      console.error('Greška pri kreiranju aktivnosti:', activityErr);
    }

    res.json({ 
      message: 'Tim uspješno registriran!', 
      tournament 
    });
  } catch (error) {
    console.error('❌ Register team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generiraj bracket
exports.generateBracket = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const userId = req.user._id;

    console.log('📥 Generate bracket request:', { tournamentId, userId });

    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) {
      console.log('❌ Tournament not found:', tournamentId);
      return res.status(404).json({ message: 'Turnir ne postoji' });
    }

    // Provjeri je li kreator
    if (tournament.creator.toString() !== userId.toString()) {
      console.log('⚠️ User is not creator');
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
          team1: null,
          team2: null,
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

    console.log('✅ Bracket generated');

    res.json({ 
      message: 'Bracket generiran!', 
      tournament 
    });
  } catch (error) {
    console.error('❌ Generate bracket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Ažuriraj rezultat utakmice
exports.updateMatch = async (req, res) => {
  try {
    const { tournamentId, matchId } = req.params;
    const { score1, score2 } = req.body;
    const userId = req.user._id;

    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) {
      return res.status(404).json({ message: 'Turnir ne postoji' });
    }

    // Provjeri je li kreator
    if (tournament.creator.toString() !== userId.toString()) {
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

    console.log('✅ Match updated');

    res.json({ 
      message: 'Rezultat ažuriran!', 
      tournament 
    });
  } catch (error) {
    console.error('❌ Update match error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Obriši turnir
exports.deleteTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const userId = req.user._id;

    console.log('📥 Delete tournament request:', { tournamentId, userId });

    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) {
      console.log('❌ Tournament not found:', tournamentId);
      return res.status(404).json({ message: 'Turnir ne postoji' });
    }

    // Provjeri je li kreator
    if (tournament.creator.toString() !== userId.toString()) {
      console.log('⚠️ User is not creator');
      return res.status(403).json({ message: 'Samo kreator može obrisati turnir!' });
    }

    await Tournament.findByIdAndDelete(tournamentId);

    console.log('✅ Tournament deleted:', tournamentId);

    res.json({ message: 'Turnir obrisan!' });
  } catch (error) {
    console.error('❌ Delete tournament error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// Odjavi tim sa turnira
exports.unregisterTeam = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const userId = req.user._id;

    console.log('📥 Unregister team request:', { tournamentId, userId });

    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) {
      console.log('❌ Tournament not found:', tournamentId);
      return res.status(404).json({ message: 'Turnir ne postoji' });
    }

    // Pronađi tim gdje je korisnik kapetan
    const teamIndex = tournament.registeredTeams.findIndex(
      team => team.captain && team.captain.toString() === userId.toString()
    );

    if (teamIndex === -1) {
      return res.status(404).json({ message: 'Nisi registriran na ovom turniru' });
    }

    // Ukloni tim
    const removedTeam = tournament.registeredTeams[teamIndex];
    tournament.registeredTeams.splice(teamIndex, 1);
    await tournament.save();

    console.log('✅ Team unregistered from tournament');

    // Kreiraj aktivnost
    try {
      await createActivityHelper(
        userId,
        'tournament_left',
        {
          tournamentId: tournament._id,
          tournamentName: tournament.name,
          teamName: removedTeam.teamName
        },
        'public'
      );
    } catch (activityErr) {
      console.error('Greška pri kreiranju aktivnosti:', activityErr);
    }

    res.json({ 
      message: 'Tim uspješno odjavljen!', 
      tournament 
    });
  } catch (error) {
    console.error('❌ Unregister team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
module.exports = exports;