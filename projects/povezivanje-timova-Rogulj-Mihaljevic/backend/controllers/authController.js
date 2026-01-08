const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Funkcija za generiranje access i refresh tokena
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Funkcija za slanje verifikacijskog emaila
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

// ----------------- CONTROLLER FUNKCIJE -----------------

// Registracija
exports.register = async (req, res) => {
  try {
    const { username, email, password, sport, location } = req.body;

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) return res.status(400).json({ message: 'Username ili email već postoje!' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      username,
      email,
      password: hashedPassword,
      sport,
      location,
      verificationCode
    });

    await user.save();
    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({ message: 'Registracija uspješna! Provjeri email za verifikacijski kod.', userId: user._id });
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
    if (!user) return res.status(404).json({ message: 'Korisnik ne postoji' });

    if (user.verificationCode !== code) return res.status(400).json({ message: 'Pogrešan kod!' });

    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

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
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Nevažeći email ili lozinka' });
    if (!user.isVerified) return res.status(401).json({ message: 'Email nije verificiran. Provjerite inbox.' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Nevažeći email ili lozinka' });

    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
    user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.lastActive = new Date();
    await user.save();

    res.json({
      message: 'Uspješna prijava!',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        sport: user.sport
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token je obavezan' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh');
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) return res.status(401).json({ message: 'Nevažeći refresh token' });
    if (new Date() > user.refreshTokenExpiry) return res.status(401).json({ message: 'Refresh token je istekao' });

    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();

    res.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Nevažeći refresh token' });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;
    await User.findByIdAndUpdate(userId, { refreshToken: null, refreshTokenExpiry: null });
    res.json({ message: 'Uspješna odjava' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ----------------- PLACEHOLDER FUNKCIJE -----------------
exports.resendVerificationCode = async (req, res) => {
  res.status(200).json({ message: 'Resend verification code route works!' });
};

exports.forgotPassword = async (req, res) => {
  res.status(200).json({ message: 'Forgot password route works!' });
};
