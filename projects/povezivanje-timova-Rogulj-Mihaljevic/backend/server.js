const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Učitaj .env varijable
dotenv.config();

// Inicijaliziraj Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Spoji se na MongoDB
connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));

// Test ruta
app.get('/', (req, res) => {
  res.json({ message: '🏀 TeamConnect API radi!' });
});

// Port
const PORT = process.env.PORT || 5000;

// Pokreni server
app.listen(PORT, () => {
  console.log(`🚀 Server radi na portu ${PORT}`);
});