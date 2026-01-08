const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  // Osnovni podaci
  team1: { 
    name: { type: String, required: true },
    logo: { type: String },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  team2: { 
    name: { type: String, required: true },
    logo: { type: String },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  
  sport: { type: String, required: true },
  
  // Lokacija
  venue: { type: String, required: true },
  city: { type: String },
  country: { type: String },
  
  // Vrijeme
  scheduledDate: { type: Date, required: true },
  startTime: { type: Date },
  endTime: { type: Date },
  
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'live', 'finished', 'cancelled'],
    default: 'scheduled'
  },
  
  // Rezultat
  score: {
    team1: { type: Number, default: 0 },
    team2: { type: Number, default: 0 }
  },
  
  // Statistika
  stats: {
    team1: {
      possession: { type: Number, default: 0 }, // Postotak
      shots: { type: Number, default: 0 },
      shotsOnTarget: { type: Number, default: 0 },
      corners: { type: Number, default: 0 },
      fouls: { type: Number, default: 0 },
      yellowCards: { type: Number, default: 0 },
      redCards: { type: Number, default: 0 }
    },
    team2: {
      possession: { type: Number, default: 0 },
      shots: { type: Number, default: 0 },
      shotsOnTarget: { type: Number, default: 0 },
      corners: { type: Number, default: 0 },
      fouls: { type: Number, default: 0 },
      yellowCards: { type: Number, default: 0 },
      redCards: { type: Number, default: 0 }
    }
  },
  
  // Eventi (golovi, kartoni, zamjene...)
  events: [{
    type: { 
      type: String, 
      enum: ['goal', 'yellow_card', 'red_card', 'substitution', 'injury', 'other'],
      required: true 
    },
    team: { type: String, required: true }, // 'team1' ili 'team2'
    player: { type: String },
    minute: { type: Number, required: true },
    description: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Komentari / Live updates
  liveCommentary: [{
    minute: { type: Number, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Metadata
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Tko može uređivati
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-update timestamp
matchSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});
// Indexi
matchSchema.index({ sport: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ scheduledDate: 1 });
matchSchema.index({ createdBy: 1 });
matchSchema.index({ 'team1.players': 1 });
matchSchema.index({ 'team2.players': 1 });
module.exports = mongoose.model('Match', matchSchema);