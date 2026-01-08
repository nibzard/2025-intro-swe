const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuta
  max: 100, // 100 requestova po IP
  message: {
    message: 'Previše zahtjeva s ovog IP-a, pokušaj ponovno za 15 minuta'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strožiji limiter za login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuta
  max: 5, // 5 pokušaja
  message: {
    message: 'Previše pokušaja prijave, pokušaj ponovno za 15 minuta'
  },
  skipSuccessfulRequests: true, // Ne broji uspješne requestove
});

// Limiter za file upload
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 sat
  max: 10, // 10 uploada po satu
  message: {
    message: 'Previše uploada, pokušaj ponovno za 1 sat'
  }
});

// Limiter za chat poruke
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuta
  max: 20, // 20 poruka po minuti
  message: {
    message: 'Previše poruka, uspori malo!'
  }
});

// Limiter za email sending
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 sat
  max: 5, // 5 emailova po satu
  message: {
    message: 'Previše poslanih emailova, pokušaj kasnije'
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  chatLimiter,
  emailLimiter
};