require('dotenv').config();

const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  
  // Database
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/teamconnect',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
  jwtExpiry: '15m',
  jwtRefreshExpiry: '7d',
  
  // Email
  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  
  // File Upload
  upload: {
    maxVideoSize: parseInt(process.env.MAX_FILE_SIZE_MB || 100) * 1024 * 1024,
    maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE_MB || 10) * 1024 * 1024,
    storageLimit: parseInt(process.env.STORAGE_LIMIT_MB || 500) * 1024 * 1024
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100)
  },
  
  // URLs
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  
  // Security
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || 10),
  
  // Validation
  validate: function() {
    const required = ['jwtSecret', 'email.user', 'email.pass'];
    const missing = [];
    
    required.forEach(key => {
      const keys = key.split('.');
      let value = this;
      
      for (const k of keys) {
        value = value[k];
        if (!value) {
          missing.push(key);
          break;
        }
      }
    });
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
};

// Validiraj config pri startu
config.validate();

module.exports = config;