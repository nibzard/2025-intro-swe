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
  // Chat messages
messages: [{
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['text', 'image', 'location', 'system'],
    default: 'text'
  },
  // Za location tip
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String }
  },
  // Za image tip
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
}],
  createdAt: { type: Date, default: Date.now }
});
// Indexi
teamSchema.index({ sport: 1 });
teamSchema.index({ city: 1 });
teamSchema.index({ date: 1 });
teamSchema.index({ creator: 1 });
teamSchema.index({ status: 1 });
teamSchema.index({ date: 1, city: 1, sport: 1 }); // Compound za filter
teamSchema.index({ name: 'text', description: 'text' }); // Full-text search
module.exports = mongoose.model('Team', teamSchema);