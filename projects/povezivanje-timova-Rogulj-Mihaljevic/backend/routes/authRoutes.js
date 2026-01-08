const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  verifyCode, 
  resendVerificationCode,
  refreshToken,
  logout
} = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../middleware/validators');
const { authLimiter, emailLimiter } = require('../middleware/rateLimiter');
const auth = require('../middleware/auth');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-code', authLimiter, verifyCode);
router.post('/verify', authLimiter, verifyCode); // ✅ ALIAS za frontend
router.post('/resend-code', emailLimiter, resendVerificationCode);
router.post('/refresh-token', refreshToken);
router.post('/logout', auth, logout);

module.exports = router;