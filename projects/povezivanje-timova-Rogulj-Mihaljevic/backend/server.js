process.on('uncaughtException', (err) => {
  console.error('💥 Neuhvaćena greška:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Odbijeni Promise:', err);
});
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/authRoutes');
const teamRoutes = require('./routes/teamRoutes');
const waitlistRoutes = require('./routes/waitlistRoutes');
const friendsRoutes = require('./routes/friendsRoutes');
const statsRoutes = require('./routes/statsRoutes');
const videoRoutes = require('./routes/videoRoutes');
const profileRoutes = require('./routes/profileRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const fieldRoutes = require('./routes/fieldRoutes'); 
const matchRoutes = require('./routes/matchRoutes');
const ratingRoutes = require('./routes/ratingRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/ratings', ratingRoutes);

// MongoDB Connection - PRVO spoji MongoDB, PA TEK ONDA pokreni server
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teamconnect')
  .then(() => {
    console.log('✅ MongoDB uspješno spojen!');
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server radi na portu ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB greška:', err);
    console.error('💡 Provjeri je li mongod.exe pokrenut!');
    process.exit(1);
  });