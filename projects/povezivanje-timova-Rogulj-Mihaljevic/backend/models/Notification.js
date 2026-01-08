const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  
  type: {
    type: String,
    enum: [
      'friend_request',
      'friend_accepted',
      'team_invite',
      'team_joined',
      'match_starting',
      'tournament_starting',
      'waitlist_spot_available',
      'achievement_unlocked',
      'rank_up',
      'video_liked',
      'video_commented',
      'mention',
      'system'
    ],
    required: true
  },
  
  title: { type: String, required: true },
  message: { type: String, required: true },
  
  // Link za navigaciju
  link: { type: String },
  
  // Dodatni podaci
  data: {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    friendRequestId: { type: String }
  },
  
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  
  createdAt: { type: Date, default: Date.now }
});

// Index za brži query
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);