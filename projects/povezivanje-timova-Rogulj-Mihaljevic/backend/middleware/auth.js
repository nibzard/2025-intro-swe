const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Nema tokena, pristup odbijen' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);  // ✅ PROMJENA: userId → id

    if (!user) {
      return res.status(401).json({ message: 'Korisnik ne postoji' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token nije valjan' });
  }
};

module.exports = auth;