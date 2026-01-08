const Team = require('../models/Team');
const nodemailer = require('nodemailer');

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Dodaj se na waitlist
exports.joinWaitlist = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;
    const userEmail = req.user.email;

    const team = await Team.findById(teamId);
    
    if (!team) {
      return res.status(404).json({ message: 'Tim ne postoji' });
    }

    // Provjeri je li već na waitlistu
    const alreadyOnWaitlist = team.waitlist.some(
      item => item.user.toString() === userId
    );

    if (alreadyOnWaitlist) {
      return res.status(400).json({ message: 'Već si na listi čekanja!' });
    }

    // Provjeri je li već igrač
    if (team.players.includes(userId)) {
      return res.status(400).json({ message: 'Već si u timu!' });
    }

    // Dodaj na waitlist
    team.waitlist.push({
      user: userId,
      email: userEmail,
      addedAt: new Date()
    });

    await team.save();

    res.json({ message: 'Dodan si na listu čekanja! Obavijestit ćemo te emailom kada se oslobodi mjesto.' });
  } catch (error) {
    console.error('Waitlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Ukloni se s waitlista
exports.leaveWaitlist = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    const team = await Team.findById(teamId);
    
    if (!team) {
      return res.status(404).json({ message: 'Tim ne postoji' });
    }

    team.waitlist = team.waitlist.filter(
      item => item.user.toString() !== userId
    );

    await team.save();

    res.json({ message: 'Uklonjen si s liste čekanja' });
  } catch (error) {
    console.error('Leave waitlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Pošalji notifikaciju waitlist korisnicima kada se mjesto oslobodi
exports.notifyWaitlist = async (teamId) => {
  try {
    const team = await Team.findById(teamId).populate('waitlist.user');
    
    if (!team || team.waitlist.length === 0) {
      return;
    }

    // Ako tim nije pun, obavijesti sve na waitlistu
    if (team.currentPlayers < team.maxPlayers) {
      const promises = team.waitlist.map(item => {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: item.email,
          subject: `🎉 Oslobodilo se mjesto u timu: ${team.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px;">
              <h1 style="color: white; text-align: center;">🎉 Dobra vijest!</h1>
              
              <div style="background: white; padding: 30px; border-radius: 10px; margin: 20px 0;">
                <h2 style="color: #667eea;">Oslobodilo se mjesto u timu!</h2>
                
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                  Upravo se oslobodilo mjesto u timu na koji si bio zainteresiran:
                </p>
                
                <div style="background: #f5f7fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                  <p style="margin: 10px 0;"><strong>Tim:</strong> ${team.name}</p>
                  <p style="margin: 10px 0;"><strong>Sport:</strong> ${team.sport}</p>
                  <p style="margin: 10px 0;"><strong>Lokacija:</strong> ${team.city}, ${team.location}</p>
                  <p style="margin: 10px 0;"><strong>Datum:</strong> ${new Date(team.date).toLocaleDateString('hr-HR')}</p>
                  <p style="margin: 10px 0;"><strong>Vrijeme:</strong> ${team.time}</p>
                  <p style="margin: 10px 0;"><strong>Slobodna mjesta:</strong> ${team.maxPlayers - team.currentPlayers}/${team.maxPlayers}</p>
                </div>
                
                <p style="font-size: 16px; color: #333;">
                  Žuri! Prijavi se što prije jer mjesta brzo nestaju.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="http://localhost:3000/dashboard" 
                     style="background: linear-gradient(135deg, #667eea, #764ba2); 
                            color: white; 
                            padding: 15px 40px; 
                            text-decoration: none; 
                            border-radius: 25px; 
                            font-weight: bold;
                            display: inline-block;">
                    Prijavi se u tim
                  </a>
                </div>
              </div>
              
              <p style="color: white; text-align: center; font-size: 14px;">
                TeamConnect - Povežite se s igračima 🏆
              </p>
            </div>
          `
        };

        return transporter.sendMail(mailOptions);
      });

      await Promise.all(promises);
      console.log(`Waitlist notifikacije poslane za tim: ${team.name}`);
    }
  } catch (error) {
    console.error('Notify waitlist error:', error);
  }
};

module.exports = exports;