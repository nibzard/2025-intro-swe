const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  type: {
    type: String,
    enum: [
      'team_created',
      'team_joined',
      'match_played',
      'video_uploaded',
      'tournament_created',
      'tournament_joined',
      'field_added',
      'friend_added',
      'achievement_unlocked',
      'rank_up',
      'goal_scored',
      'match_won'
    ],
    required: true
  },
  
  // Dinamički podaci o aktivnosti
  data: {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    teamName: { type: String },
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    videoTitle: { type: String },
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
    tournamentName: { type: String },
    fieldId: { type: mongoose.Schema.Types.ObjectId, ref: 'Field' },
    fieldName: { type: String },
    friendId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    friendName: { type: String },
    achievementName: { type: String },
    oldRank: { type: String },
    newRank: { type: String },
    score: { type: String },
    opponent: { type: String }
  },
  
  // Vidljivost
  visibility: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public'
  },
  
  createdAt: { type: Date, default: Date.now }
});

// Index za brži query
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });
activitySchema.index({ type: 1 });
activitySchema.index({ visibility: 1 });
module.exports = mongoose.model('Activity', activitySchema);