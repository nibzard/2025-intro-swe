const Team = require('../models/Team');
const User = require('../models/User');

// Kreiraj novi tim
exports.createTeam = async (req, res) => {
  try {
    const { name, sport, location, city, date, time, maxPlayers, description } = req.body;

    // Provjeri da li su sva polja popunjena
    if (!name || !sport || !location || !city || !date || !time || !maxPlayers) {
      return res.status(400).json({ message: 'Popuni sva obavezna polja!' });
    }

    // Kreiraj tim
    const team = new Team({
      name,
      sport,
      location,
      city,
      date,
      time,
      maxPlayers,
      description,
      creator: req.user._id,
      players: [req.user._id]
    });

    await team.save();

    res.status(201).json({ 
      message: 'Tim uspješno kreiran!',
      team 
    });

  } catch (error) {
    console.error('Greška pri kreiranju tima:', error);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};

// Dohvati sve timove (s filterima)
exports.getTeams = async (req, res) => {
  try {
    const { sport, city, location } = req.query;

    // Filtriraj timove
    let filter = {};
    if (sport) filter.sport = sport;
    if (city) filter.city = city;
    if (location) filter.location = location;

    // Prikaži samo timove koji nisu puni
    filter.currentPlayers = { $lt: maxPlayers };

    const teams = await Team.find(filter)
      .populate('creator', 'username')
      .populate('players', 'username')
      .sort({ createdAt: -1 });

    res.json(teams);

  } catch (error) {
    console.error('Greška pri dohvaćanju timova:', error);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};

// Dohvati jedan tim
exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('creator', 'username email sport location')
      .populate('players', 'username sport location');

    if (!team) {
      return res.status(404).json({ message: 'Tim ne postoji' });
    }

    res.json(team);

  } catch (error) {
    console.error('Greška pri dohvaćanju tima:', error);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};

// Pridruži se timu
exports.joinTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Tim ne postoji' });
    }

    // Provjeri je li tim pun
    if (team.currentPlayers >= team.maxPlayers) {
      return res.status(400).json({ message: 'Tim je pun!' });
    }

    // Provjeri je li korisnik već u timu
    if (team.players.includes(req.user._id)) {
      return res.status(400).json({ message: 'Već si u ovom timu!' });
    }

    // Dodaj igrača
    team.players.push(req.user._id);
    team.currentPlayers += 1;
    await team.save();

    res.json({ 
      message: 'Uspješno si se pridružio timu!',
      team 
    });

  } catch (error) {
    console.error('Greška pri pridruživanju timu:', error);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};

// Napusti tim
exports.leaveTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Tim ne postoji' });
    }

    // Provjeri je li korisnik u timu
    if (!team.players.includes(req.user._id)) {
      return res.status(400).json({ message: 'Nisi u ovom timu!' });
    }

    // Kreator ne može napustiti tim
    if (team.creator.equals(req.user._id)) {
      return res.status(400).json({ message: 'Kreator ne može napustiti tim! Obriši ga umjesto toga.' });
    }

    // Ukloni igrača
    team.players = team.players.filter(player => !player.equals(req.user._id));
    team.currentPlayers -= 1;
    await team.save();

    res.json({ 
      message: 'Napustio si tim',
      team 
    });

  } catch (error) {
    console.error('Greška pri napuštanju tima:', error);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};

// Obriši tim (samo kreator)
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Tim ne postoji' });
    }

    // Samo kreator može obrisati tim
    if (!team.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'Samo kreator može obrisati tim!' });
    }

    await team.deleteOne();

    res.json({ message: 'Tim je obrisan' });

  } catch (error) {
    console.error('Greška pri brisanju tima:', error);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};

// Dohvati moje timove
exports.getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({ 
      players: req.user._id 
    })
      .populate('creator', 'username')
      .populate('players', 'username')
      .sort({ createdAt: -1 });

    res.json(teams);

  } catch (error) {
    console.error('Greška pri dohvaćanju mojih timova:', error);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};