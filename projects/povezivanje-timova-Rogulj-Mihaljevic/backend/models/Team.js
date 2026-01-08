const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sport: { type: String, required: true },
  location: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, default: 'Hrvatska' },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  maxPlayers: { type: Number, required: true },
  currentPlayers: { type: Number, default: 1 },
  description: { type: String },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  waitlist: [{  // NOVO - waitlist
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String },
    addedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Team', teamSchema);