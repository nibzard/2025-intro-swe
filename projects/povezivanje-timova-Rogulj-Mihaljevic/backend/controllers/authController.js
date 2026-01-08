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
  // ✅ DEBUG LOGS
  console.log('🔍 DEBUG - sendVerificationEmail called');
  console.log('🔍 DEBUG - Email parameter:', email);
  console.log('🔍 DEBUG - Verification code:', code);
  console.log('🔍 DEBUG - EMAIL_USER from .env:', process.env.EMAIL_USER);
  
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
      to: email,  // ✅ This MUST be the user's email!
      subject: '🏀 TeamConnect - Verifikacijski kod',
      html: `
        <h1>Dobrodošao/la u TeamConnect!</h1>
        <p>Tvoj verifikacijski kod je:</p>
        <h2 style="color: #667eea; font-size: 32px;">${code}</h2>
        <p>Kod vrijedi 15 minuta.</p>
      `
    };

    // ✅ DEBUG - Log exact email details
    console.log('📧 SENDING EMAIL:');
    console.log('   FROM:', mailOptions.from);
    console.log('   TO:', mailOptions.to);
    console.log('   CODE:', code);

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email successfully sent to: ${email}`);
  } catch (error) {
    // Ako email sending faila, ispiši kod u terminalu
    console.log(`❌ Email sending FAILED for ${email}`);
    console.log(`📧 Verifikacijski kod za ${email}: ${code}`);
    console.error('Email error details:', error.message);
  }
};

// ----------------- CONTROLLER FUNKCIJE -----------------

// Registracija
exports.register = async (req, res) => {
  try {
    console.log('📥 Register request:', req.body);

    const { username, email, password, sport, location } = req.body;

    // ✅ DEBUG - Log extracted email
    console.log('🔍 Extracted email from request:', email);

    // Provjeri postoji li user
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      console.log('❌ User already exists:', { username, email });
      return res.status(400).json({ message: 'Username ili email već postoje!' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generiraj 6-znamenkasti kod
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Kreiraj usera
    const user = new User({
      username,
      email,
      password: hashedPassword,
      sport: sport || 'Football',
      location: location || 'Zagreb',
      verificationCode,
      isVerified: false
    });

    await user.save();
    console.log('✅ User created:', user._id);
    console.log('✅ User email in database:', user.email); // ✅ DEBUG

    // ✅ DEBUG - Log before sending email
    console.log('🔍 About to send email to:', email);
    console.log('🔍 User object email:', user.email);

    // Pošalji email (ili ispiši kod u terminalu ako email ne radi)
    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({ 
      message: 'Registracija uspješna! Provjeri email za verifikacijski kod.', 
      userId: user._id 
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};

// Verifikacija koda
exports.verifyCode = async (req, res) => {
  try {
    console.log('📧 Verify request:', req.body);

    const { userId, code } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID je obavezan' });
    }

    if (!code) {
      return res.status(400).json({ message: 'Verifikacijski kod je obavezan' });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ message: 'Korisnik ne postoji' });
    }

    if (user.isVerified) {
      console.log('⚠️ User already verified:', user.email);
      return res.status(400).json({ message: 'Email je već verificiran' });
    }

    if (user.verificationCode !== code.toString()) {
      console.log('❌ Wrong code. Expected:', user.verificationCode, 'Got:', code);
      return res.status(400).json({ message: 'Pogrešan verifikacijski kod!' });
    }

    // Verifikacija uspješna!
    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();

    console.log('✅ User verified:', user.email);

    // Generiraj tokene
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Spremi refresh token
    user.refreshToken = refreshToken;
    user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();

    res.json({
      message: 'Email uspješno verificiran!',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        sport: user.sport,
        location: user.location,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('❌ Verify error:', error);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};

// Resend verification code
exports.resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Korisnik ne postoji' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email je već verificiran' });
    }

    // Generiraj novi kod
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = verificationCode;
    await user.save();

    // Pošalji email
    await sendVerificationEmail(email, verificationCode);

    res.json({ message: 'Novi verifikacijski kod je poslan!' });
  } catch (error) {
    console.error('Resend code error:', error);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    console.log('🔐 Login request:', req.body.email);

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ message: 'Nevažeći email ili lozinka' });
    }

    if (!user.isVerified) {
      console.log('⚠️ User not verified:', email);
      return res.status(401).json({ 
        message: 'Email nije verificiran. Provjeri svoj inbox za verifikacijski kod.',
        userId: user._id
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('❌ Wrong password for:', email);
      return res.status(401).json({ message: 'Nevažeći email ili lozinka' });
    }

    // Generiraj tokene
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Spremi refresh token i update lastActive
    user.refreshToken = refreshToken;
    user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.lastActive = new Date();
    await user.save();

    console.log('✅ Login successful:', user.email);

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
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token je obavezan' });
    }

    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'
    );

    const user = await User.findById(decoded.id);
    
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Nevažeći refresh token' });
    }

    if (new Date() > user.refreshTokenExpiry) {
      return res.status(401).json({ message: 'Refresh token je istekao' });
    }

    // Generiraj nove tokene
    const tokens = generateTokens(user._id);

    // Spremi novi refresh token
    user.refreshToken = tokens.refreshToken;
    user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Nevažeći refresh token' });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, {
      refreshToken: null,
      refreshTokenExpiry: null
    });

    res.json({ message: 'Uspješna odjava' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  res.status(200).json({ message: 'Forgot password route works! (Not implemented yet)' });
};