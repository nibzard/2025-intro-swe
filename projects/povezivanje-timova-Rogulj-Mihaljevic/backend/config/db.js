const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB spojen!');
  } catch (error) {
    console.error('❌ MongoDB greška:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
