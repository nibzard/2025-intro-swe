const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http'); // NOVO
const socketIo = require('socket.io'); // NOVO
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const { apiLimiter } = require('./middleware/ratelimiter');
require('dotenv').config();

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
const activityRoutes = require('./routes/activityRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const server = http.createServer(app); // NOVO

// Socket.io setup - NOVO
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());
// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:5000", "ws://localhost:5000"]
    }
  }
})); // Secure HTTP headers

app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Rate limiting - primijeni na sve rute
app.use('/api/', apiLimiter);

// Serviraj uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make io accessible to routes - NOVO
app.set('io', io);

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
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teamconnect')
  .then(() => console.log('✅ MongoDB spojen!'))
  .catch(err => console.error('❌ MongoDB greška:', err));

// Socket.io event handlers - NOVO
io.on('connection', (socket) => {
  console.log('🔌 Novi korisnik spojen:', socket.id);

  // Join team chat room
  socket.on('join_team', (teamId) => {
    socket.join(`team_${teamId}`);
    console.log(`👤 Korisnik ${socket.id} joined team ${teamId}`);
  });

  // Leave team chat room
  socket.on('leave_team', (teamId) => {
    socket.leave(`team_${teamId}`);
    console.log(`👤 Korisnik ${socket.id} left team ${teamId}`);
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      const { teamId, userId, text, type, location, imageUrl } = data;
      
      // Spremi poruku u bazu
      const Team = require('./models/Team');
      const team = await Team.findById(teamId);
      
      if (!team) {
        socket.emit('error', { message: 'Tim ne postoji' });
        return;
      }

      // Provjeri je li korisnik član tima
      const isMember = team.players.includes(userId) || team.creator.toString() === userId;
      
      if (!isMember) {
        socket.emit('error', { message: 'Nisi član tima' });
        return;
      }

      // Dodaj poruku
      const message = {
        user: userId,
        text,
        type: type || 'text',
        location,
        imageUrl,
        createdAt: new Date()
      };

      team.messages.push(message);
      await team.save();

      // Populate user data za poslanu poruku
      await team.populate('messages.user', 'username avatar');
      const populatedMessage = team.messages[team.messages.length - 1];

      // Broadcast poruku svima u sobi
      io.to(`team_${teamId}`).emit('new_message', populatedMessage);
      
      console.log(`💬 Nova poruka u team ${teamId}`);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Greška pri slanju poruke' });
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    socket.to(`team_${data.teamId}`).emit('user_typing', {
      userId: data.userId,
      username: data.username
    });
  });

  socket.on('stop_typing', (data) => {
    socket.to(`team_${data.teamId}`).emit('user_stop_typing', {
      userId: data.userId
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('🔌 Korisnik odspojen:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server radi na portu ${PORT}`);
});