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
  // Rating system
rating: {
  overall: { type: Number, default: 1000, min: 0, max: 3000 },
  attack: { type: Number, default: 50, min: 0, max: 100 },
  defense: { type: Number, default: 50, min: 0, max: 100 },
  teamwork: { type: Number, default: 50, min: 0, max: 100 },
  consistency: { type: Number, default: 50, min: 0, max: 100 },
  lastUpdated: { type: Date, default: Date.now }
},

// Ranking
rank: { 
  type: String,
  enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master'],
  default: 'bronze'
},
  
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});
refreshToken: { type: String }
refreshTokenExpiry: { type: Date }
// Indexi za performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ 'rating.overall': -1 }); // Za leaderboard
userSchema.index({ rank: 1 });
userSchema.index({ sport: 1 });
userSchema.index({ city: 1 });
userSchema.index({ lastActive: -1 });
userSchema.index({ createdAt: -1 });

// Compound index za search
userSchema.index({ username: 'text', email: 'text' });
module.exports = mongoose.model('User', userSchema);
