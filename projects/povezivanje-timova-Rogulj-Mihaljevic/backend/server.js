const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Routes - SAMO JEDNOM svaki import!
const authRoutes = require('./routes/authRoutes');
const teamRoutes = require('./routes/teamRoutes');
const waitlistRoutes = require('./routes/waitlistRoutes');
const friendsRoutes = require('./routes/friendsRoutes');
const statsRoutes = require('./routes/statsRoutes');
const videoRoutes = require('./routes/videoRoutes');
const profileRoutes = require('./routes/profileRoutes'); // Nedostajao je import za ovo!

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

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teamconnect')
  .then(() => console.log('✅ MongoDB spojen!'))
  .catch(err => console.error('❌ MongoDB greška:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server radi na portu ${PORT}`);
});