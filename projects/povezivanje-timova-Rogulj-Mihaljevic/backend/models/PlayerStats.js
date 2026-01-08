const mongoose = require('mongoose');

const playerStatsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sport: { type: String, required: true },
  
  // Osnovne statistike
  totalMatches: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  
  // Sportske statistike
  goalsScored: { type: Number, default: 0 },
  assists: { type: Number, default: 0 },
  cleanSheets: { type: Number, default: 0 },
  yellowCards: { type: Number, default: 0 },
  redCards: { type: Number, default: 0 },
  
  // Pozicije
  positionStats: {
    forward: { type: Number, default: 0 },
    midfielder: { type: Number, default: 0 },
    defender: { type: Number, default: 0 },
    goalkeeper: { type: Number, default: 0 }
  },
  
  // Povijest utakmica
  matchHistory: [{
    date: { type: Date },
    opponent: { type: String },
    result: { type: String, enum: ['win', 'loss', 'draw'] },
    score: { type: String },
    goalsScored: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    position: { type: String }
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-update updatedAt
playerStatsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('PlayerStats', playerStatsSchema);