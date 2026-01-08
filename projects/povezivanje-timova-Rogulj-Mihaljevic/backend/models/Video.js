const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { 
    type: String, 
    enum: ['goal', 'save', 'skill', 'compilation', 'fail', 'other'],
    default: 'other'
  },
  
  // File info
  filename: { type: String, required: true },
  filepath: { type: String, required: true },
  thumbnail: { type: String },
  duration: { type: String },
  fileSize: { type: Number },
  mimeType: { type: String },
  
  // Metadata
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Comments
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  
  trending: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Video', videoSchema);