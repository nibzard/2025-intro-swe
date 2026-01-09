const Team = require('../models/Team');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const { notifyWaitlist } = require('./waitlistController');
const { createActivityHelper } = require('./activityController');
const { createNotificationHelper } = require('./notificationController');

// Funkcija za slanje emaila kada se pridružiš timu
const sendTeamJoinEmail = async (userEmail, teamName, teamDate, teamTime, teamLocation) => {
  try {
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
    console.log('✅ Team join email sent to:', userEmail);
  } catch (error) {
    console.error('❌ Failed to send team join email:', error);
  }
};

// Funkcija za slanje emaila kada napustiš tim
const sendTeamLeaveEmail = async (userEmail, teamName, teamDate, teamTime) => {
  try {
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
    console.log('✅ Team leave email sent to:', userEmail);
  } catch (error) {
    console.error('❌ Failed to send team leave email:', error);
  }
};

// Kreiraj novi tim
exports.createTeam = async (req, res) => {
  try {
    const { name, sport, location, city, date, time, maxPlayers, description } = req.body;

    if (!name || !sport || !location || !city || !date || !time || !maxPlayers) {
      return res.status(400).json({ message: 'Popuni sva obavezna polja!' });
    }

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

    console.log('✅ Team created:', team._id, 'by', req.user._id);

    try {
      await createActivityHelper(
        req.user._id,
        'team_created',
        {
          teamId: team._id,
          teamName: team.name
        },
        'public'
      );
    } catch (activityErr) {
      console.error('Greška pri kreiranju aktivnosti:', activityErr);
    }

    res.status(201).json({ 
      message: 'Tim uspješno kreiran!',
      team 
    });

  } catch (error) {
    console.error('❌ Create team error:', error);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};

// Dohvati sve timove (s filterima)
exports.getTeams = async (req, res) => {
  try {
    const { sport, city, location } = req.query;

    let filter = {};
    if (sport) filter.sport = sport;
    if (city) filter.city = city;
    if (location) filter.location = location;

    const teams = await Team.find(filter)
      .populate('creator', 'username')
      .populate('players', 'username')
      .sort({ createdAt: -1 });

    console.log(`✅ Fetched ${teams.length} teams with filter:`, filter);

    res.json(teams);

  } catch (error) {
    console.error('❌ Get teams error:', error);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};

// Dohvati jedan tim
exports.getTeam = async (req, res) => {
  try {
    const teamId = req.params.id || req.params.teamId;  // ✅ Support both

    const team = await Team.findById(teamId)
      .populate('creator', 'username email sport location')
      .populate('players', 'username sport location');

    if (!team) {
      console.log('❌ Team not found:', teamId);
      return res.status(404).json({ message: 'Tim ne postoji' });
    }

    console.log('✅ Team fetched:', team._id);

    res.json(team);

  } catch (error) {
    console.error('❌ Get team error:', error);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};

// Pridruži se timu
exports.joinTeam = async (req, res) => {
  try {
    const teamId = req.params.id || req.params.teamId;  // ✅ Support both
    const userId = req.user._id;  // ✅ Use _id consistently

    console.log('🔍 Join team request:', { teamId, userId });

    const team = await Team.findById(teamId);

    if (!team) {
      console.log('❌ Team not found:', teamId);
      return res.status(404).json({ message: 'Tim ne postoji' });
    }

    console.log('✅ Team found:', team.name);

    if (team.currentPlayers >= team.maxPlayers) {
      return res.status(400).json({ message: 'Tim je pun!' });
    }

    // ✅ Check if already member (proper comparison)
    const isAlreadyMember = team.players.some(
      player => player.toString() === userId.toString()
    );

    if (isAlreadyMember) {
      console.log('⚠️ User already in team');
      return res.status(400).json({ message: 'Već si u ovom timu!' });
    }

    // Dodaj igrača
    team.players.push(userId);
    team.currentPlayers += 1;
    await team.save();

    console.log('✅ User joined team:', userId, '→', team._id);

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
    }

    // Kreiraj aktivnost
    try {
      await createActivityHelper(
        userId,
        'team_joined',
        {
          teamId: team._id,
          teamName: team.name
        },
        'public'
      );
    } catch (activityErr) {
      console.error('Greška pri kreiranju aktivnosti:', activityErr);
    }

    // Notifikacija za kreatora tima
    try {
      const user = await User.findById(userId).select('username');
      
      await createNotificationHelper(
        team.creator,
        'team_joined',
        '🤝 Novi član tima',
        `${user.username} se pridružio tvom timu "${team.name}"`,
        `/teams/${team._id}`,
        { teamId: team._id },
        userId
      );
    } catch (notifErr) {
      console.error('Greška pri kreiranju notifikacije:', notifErr);
    }

    res.json({ 
      message: 'Uspješno si se pridružio timu!',
      team 
    });

  } catch (error) {
    console.error('❌ Join team error:', error);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};

// Napusti tim
exports.leaveTeam = async (req, res) => {
  try {
    const teamId = req.params.id || req.params.teamId;  // ✅ FIX: Support both
    const userId = req.user._id;  // ✅ FIX: Use _id

    console.log('🔍 Leave team request:', { teamId, userId });

    const team = await Team.findById(teamId);
    
    if (!team) {
      console.log('❌ Team not found:', teamId);
      return res.status(404).json({ message: 'Tim ne postoji' });
    }

    // ✅ Check if user is in team
    const isMember = team.players.some(
      player => player.toString() === userId.toString()
    );

    if (!isMember) {
      console.log('⚠️ User not in team');
      return res.status(400).json({ message: 'Nisi u ovom timu' });
    }

    // ✅ Remove player
    team.players = team.players.filter(
      p => p.toString() !== userId.toString()
    );
    team.currentPlayers = team.players.length;
    await team.save();

    console.log('✅ User left team:', userId, '←', team._id);

    try {
      await notifyWaitlist(teamId);
    } catch (waitlistErr) {
      console.error('Greška pri notifikaciji waitlista:', waitlistErr);
    }

    try {
      await sendTeamLeaveEmail(
        req.user.email,
        team.name,
        team.date,
        team.time
      );
    } catch (emailErr) {
      console.error('Greška pri slanju emaila:', emailErr);
    }

    res.json({ message: 'Napustio si tim' });
  } catch (error) {
    console.error('❌ Leave team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Obriši tim (samo kreator)
exports.deleteTeam = async (req, res) => {
  try {
    const teamId = req.params.id || req.params.teamId;  // ✅ Support both
    const userId = req.user._id;  // ✅ Use _id

    console.log('🔍 Delete team request:', { teamId, userId });

    const team = await Team.findById(teamId);

    if (!team) {
      console.log('❌ Team not found:', teamId);
      return res.status(404).json({ message: 'Tim ne postoji' });
    }

    // ✅ Check if user is creator
    if (team.creator.toString() !== userId.toString()) {
      console.log('⚠️ User is not creator');
      return res.status(403).json({ message: 'Samo kreator može obrisati tim!' });
    }

    await team.deleteOne();

    console.log('✅ Team deleted:', teamId);

    res.json({ message: 'Tim je obrisan' });

  } catch (error) {
    console.error('❌ Delete team error:', error);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};

// Dohvati moje timove
exports.getMyTeams = async (req, res) => {
  try {
    const userId = req.user._id;  // ✅ FIX: Use _id

    console.log('🔍 Get my teams request:', userId);

    const teams = await Team.find({
      $or: [
        { creator: userId },
        { players: userId }
      ]
    })
    .populate('creator', 'username email avatar')
    .populate('players', 'username email avatar')
    .sort({ date: 1 });

    console.log(`✅ Found ${teams.length} teams for user:`, userId);

    res.json(teams);
  } catch (error) {
    console.error('❌ Get my teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};