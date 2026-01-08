const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Osnovne info
  firstName: { type: String },
  lastName: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
  
  // Sportske preference
  sport: { type: String },
  favoriteSports: [{ type: String }],
  skillLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'professional'] },
  position: { type: String },
  
  // Lokacija
  location: { type: String },
  city: { type: String },
  country: { type: String },
  
  // Profil
  avatar: { type: String, default: '👤' },
  bio: { type: String, maxlength: 500 },
  coverPhoto: { type: String },
  
  // Kontakt
  phone: { type: String },
  
  // Social media
  instagram: { type: String },
  twitter: { type: String },
  facebook: { type: String },
  
  // Privatnost
  profileVisibility: { 
    type: String, 
    enum: ['public', 'friends', 'private'],
    default: 'public'
  },
  showEmail: { type: Boolean, default: false },
  showPhone: { type: Boolean, default: false },
  
  // Verifikacija
  verificationCode: { type: String },
  isVerified: { type: Boolean, default: true },
  
  // Prijatelji
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String },
    sentAt: { type: Date, default: Date.now }
  }],
  
  // Statistike (brzi pregled)
  stats: {
    totalMatches: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
    totalGoals: { type: Number, default: 0 }
  },
  
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);