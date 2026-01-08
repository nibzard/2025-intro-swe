const Team = require('../models/Team');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const { notifyWaitlist } = require('./waitlistController');

// Funkcija za slanje emaila kada se pridružiš timu
const sendTeamJoinEmail = async (userEmail, teamName, teamDate, teamTime, teamLocation) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: '🏀 TeamConnect - Uspješno si se pridružio timu!',
    html: `
      <h1>Čestitamo! 🎉</h1>
      <p>Uspješno si se pridružio timu:</p>
      <h2 style="color: #667eea;">${teamName}</h2>
      <p><strong>📅 Datum:</strong> ${new Date(teamDate).toLocaleDateString('hr-HR')}</p>
      <p><strong>🕐 Vrijeme:</strong> ${teamTime}</p>
      <p><strong>📍 Lokacija:</strong> ${teamLocation}</p>
      <br>
      <p>Vidimo se na terenu! 💪</p>
      <p style="color: #999; font-size: 12px;">TeamConnect © 2025</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Funkcija za slanje emaila kada napustiš tim
const sendTeamLeaveEmail = async (userEmail, teamName, teamDate, teamTime) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: '🏀 TeamConnect - Napustio si tim',
    html: `
      <h1>Napustio si tim</h1>
      <p>Potvrdujemo da si napustio tim:</p>
      <h2 style="color: #667eea;">${teamName}</h2>
      <p><strong>📅 Datum:</strong> ${new Date(teamDate).toLocaleDateString('hr-HR')}</p>
      <p><strong>🕐 Vrijeme:</strong> ${teamTime}</p>
      <br>
      <p>Nadamo se da ćeš se pridružiti drugim timovima uskoro!</p>
      <p style="color: #999; font-size: 12px;">TeamConnect © 2025</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

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

    // Pošalji email
    try {
      await sendTeamJoinEmail(
        req.user.email,
        team.name,
        team.date,
        team.time,
        `${team.city}, ${team.location}`
      );
    } catch (emailErr) {
      console.error('Greška pri slanju emaila:', emailErr);
      // Nastavi dalje iako email nije poslan
    }

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
    const { teamId } = req.params;
    const userId = req.user.id;

    const team = await Team.findById(teamId);
    
    if (!team) {
      return res.status(404).json({ message: 'Tim ne postoji' });
    }

    if (!team.players.includes(userId)) {
      return res.status(400).json({ message: 'Nisi u ovom timu' });
    }

    team.players = team.players.filter(p => p.toString() !== userId);
    team.currentPlayers = team.players.length;
    await team.save();

    // NOVO - Obavijesti waitlist korisnike
    await notifyWaitlist(teamId);

    // Pošalji email notifikaciju ostalim članovima
    await sendTeamLeaveEmail(team, req.user);

    res.json({ message: 'Napustio si tim' });
  } catch (error) {
    console.error('Leave team error:', error);
    res.status(500).json({ message: 'Server error' });
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