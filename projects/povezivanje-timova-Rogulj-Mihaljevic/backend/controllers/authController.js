const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Funkcija za slanje emaila
const sendVerificationEmail = async (email, code) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '🏀 TeamConnect - Verifikacijski kod',
    html: `
      <h1>Dobrodošao/la u TeamConnect!</h1>
      <p>Tvoj verifikacijski kod je:</p>
      <h2 style="color: #667eea; font-size: 32px;">${code}</h2>
      <p>Kod vrijedi 15 minuta.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Registracija
exports.register = async (req, res) => {
  try {
    const { username, email, password, sport, location } = req.body;

    // Provjeri postoji li username
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'Username ili email već postoje!' 
      });
    }

    // Hashiraj lozinku
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generiraj verifikacijski kod (6 brojeva)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Kreiraj korisnika
    const user = new User({
      username,
      email,
      password: hashedPassword,
      sport,
      location,
      verificationCode,
      
    });

    await user.save();

    // Pošalji email
   await sendVerificationEmail(email, verificationCode);

    res.status(201).json({ 
      message: 'Registracija uspješna! Provjeri email za verifikacijski kod.',
      userId: user._id 
    });

  } catch (error) {
    console.error('Greška pri registraciji:', error);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};

// Verifikacija koda
exports.verifyCode = async (req, res) => {
  try {
    const { userId, code } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Korisnik ne postoji' });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: 'Pogrešan kod!' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();

    // Generiraj JWT token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({ 
      message: 'Email verificiran!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        sport: user.sport,
        location: user.location
      }
    });

  } catch (error) {
    console.error('Greška pri verifikaciji:', error);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: 'Pogrešno korisničko ime ili lozinka' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Email nije verificiran!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Pogrešno korisničko ime ili lozinka' });
    }

    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({ 
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        sport: user.sport,
        location: user.location
      }
    });

  } catch (error) {
    console.error('Greška pri loginu:', error);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};