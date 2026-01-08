const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter, emailLimiter } = require('../middleware/ratelimiter');
// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/verify
router.post('/verify', authController.verifyCode);

// POST /api/auth/login
router.post('/login', authController.login);
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-code', authLimiter, verifyCode);
router.post('/resend-code', emailLimiter, resendVerificationCode);
router.post('/forgot-password', emailLimiter, forgotPassword);
module.exports = router;