const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authLimiter, emailLimiter } = require('../middleware/ratelimiter');
const { registerValidator, loginValidator } = require('../middleware/validators');
const auth = require('../middleware/auth');

// Auth routes
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', auth, authController.logout);
router.post('/register', authLimiter, registerValidator, authController.register);
router.post('/login', authLimiter, loginValidator, authController.login);
router.post('/verify-code', authLimiter, authController.verifyCode);
router.post('/resend-code', emailLimiter, authController.resendVerificationCode);
router.post('/forgot-password', emailLimiter, authController.forgotPassword);

module.exports = router;
