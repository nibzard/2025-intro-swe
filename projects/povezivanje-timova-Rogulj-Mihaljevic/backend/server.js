const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const morgan = require('morgan');
const logger = require('./utils/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const config = require('./config/config');
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
const adminRoutes = require('./routes/adminRoutes'); // ✅ NOVO

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
}));

app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(hpp()); // Prevent HTTP Parameter Pollution

// HTTP request logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  }));
}

// Serviraj uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make io accessible to routes
app.set('io', io);

// Rate limiting - primijeni na sve API rute
app.use('/api/', apiLimiter);

// Health Check Endpoint
app.get('/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: config.env,
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
      chat: '/api/chat',
      admin: '/api/admin' // ✅ NOVO
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
app.use('/api/admin', adminRoutes); // ✅ NOVO - admin endpoints

// MongoDB Connection
mongoose.connect(config.mongoUri)
  .then(() => console.log('✅ MongoDB spojen!'))
  .catch(err => console.error('❌ MongoDB greška:', err));

// Socket.io event handlers
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
      
      const Team = require('./models/Team');
      const team = await Team.findById(teamId);
      
      if (!team) {
        socket.emit('error', { message: 'Tim ne postoji' });
        return;
      }

      const isMember = team.players.includes(userId) || team.creator.toString() === userId;
      
      if (!isMember) {
        socket.emit('error', { message: 'Nisi član tima' });
        return;
      }

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

      await team.populate('messages.user', 'username avatar');
      const populatedMessage = team.messages[team.messages.length - 1];

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

// Error Handling Middleware (MORA biti zadnje!)
app.use(notFound);
app.use(errorHandler);

const PORT = config.port;
server.listen(PORT, () => {
  console.log(`🚀 Server radi na portu ${PORT}`);
});

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
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⏰ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});