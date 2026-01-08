const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sport: { type: String, required: true },
  location: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  
  maxTeams: { type: Number, required: true },
  teamSize: { type: Number, required: true },
  format: { 
    type: String, 
    enum: ['knockout', 'league'],
    default: 'knockout'
  },
  
  entryFee: { type: Number, default: 0 }, // U eurima
  prize: { type: String },
  description: { type: String },
  
  status: {
    type: String,
    enum: ['upcoming', 'active', 'finished'],
    default: 'upcoming'
  },
  
  // Registrirani timovi
  registeredTeams: [{
    teamName: { type: String, required: true },
    captain: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    players: [{
      name: { type: String },
      position: { type: String }
    }],
    registeredAt: { type: Date, default: Date.now }
  }],
  
  // Bracket i utakmice
  bracket: [{
    round: { type: Number },
    matchNumber: { type: Number },
    team1: { type: String },
    team2: { type: String },
    score1: { type: Number },
    score2: { type: Number },
    winner: { type: String },
    scheduledDate: { type: Date },
    playedDate: { type: Date }
  }],
  
  // Metadata
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-update timestamp
tournamentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});// Indexi
tournamentSchema.index({ sport: 1 });
tournamentSchema.index({ city: 1 });
tournamentSchema.index({ startDate: 1 });
tournamentSchema.index({ status: 1 });
tournamentSchema.index({ creator: 1 });
tournamentSchema.index({ startDate: 1, city: 1, sport: 1 });
tournamentSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Tournament', tournamentSchema);