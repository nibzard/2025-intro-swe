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
const morgan = require('morgan');
const logger = require('./utils/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');
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

// **App i Server definicija**
const app = express();
const server = http.createServer(app);

// Socket.io setup
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

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  }));
}

// Security
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
}));
app.use(mongoSanitize());
app.use(hpp());

// Rate limiting
app.use('/api/', apiLimiter);

// Serviraj uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make io accessible in routes
app.set('io', io);

// Health Check Endpoint
app.get('/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  };
  
  try {
    res.send(healthcheck);
  } catch (error) {
    healthcheck.message = error;
    res.status(503).send(healthcheck);
  }
});

// API Info Endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'TeamConnect API',
    version: '1.0.0',
    description: 'API za organizaciju sportskih timova',
    endpoints: {
      auth: '/api/auth',
      teams: '/api/teams',
      tournaments: '/api/tournaments',
      fields: '/api/fields',
      matches: '/api/matches',
      videos: '/api/videos',
      profile: '/api/profile',
      friends: '/api/friends',
      stats: '/api/stats',
      ratings: '/api/ratings',
      activities: '/api/activities',
      notifications: '/api/notifications',
      chat: '/api/chat'
    },
    health: '/health'
  });
});

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

// Socket.io Event Handlers
io.on('connection', (socket) => {
  console.log('🔌 Novi korisnik spojen:', socket.id);

  socket.on('join_team', (teamId) => {
    socket.join(`team_${teamId}`);
    console.log(`👤 Korisnik ${socket.id} joined team ${teamId}`);
  });

  socket.on('leave_team', (teamId) => {
    socket.leave(`team_${teamId}`);
    console.log(`👤 Korisnik ${socket.id} left team ${teamId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { teamId, userId, text, type, location, imageUrl } = data;
      const Team = require('./models/Team');
      const team = await Team.findById(teamId);
      if (!team) return socket.emit('error', { message: 'Tim ne postoji' });

      const isMember = team.players.includes(userId) || team.creator.toString() === userId;
      if (!isMember) return socket.emit('error', { message: 'Nisi član tima' });

      const message = { user: userId, text, type: type || 'text', location, imageUrl, createdAt: new Date() };
      team.messages.push(message);
      await team.save();

      await team.populate('messages.user', 'username avatar');
      const populatedMessage = team.messages[team.messages.length - 1];
      io.to(`team_${teamId}`).emit('new_message', populatedMessage);
      console.log(`💬 Nova poruka u team ${teamId}`);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Greška pri slanju poruke' });
    }
  });

  socket.on('typing', (data) => {
    socket.to(`team_${data.teamId}`).emit('user_typing', { userId: data.userId, username: data.username });
  });

  socket.on('stop_typing', (data) => {
    socket.to(`team_${data.teamId}`).emit('user_stop_typing', { userId: data.userId });
  });

  socket.on('disconnect', () => {
    console.log('🔌 Korisnik odspojen:', socket.id);
  });
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server radi na portu ${PORT}`));

// Graceful Shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log('📭 Graceful shutdown initiated...');
  server.close(() => {
    console.log('🔌 HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('💾 MongoDB connection closed');
      process.exit(0);
    });
  });
  setTimeout(() => {
    console.error('⏰ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});
