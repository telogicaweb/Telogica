const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn('MongoDB URI not provided. Email logs will not be saved.');
      return null;
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected for Email Service');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Don't crash the service if MongoDB is unavailable
    return null;
  }
};

module.exports = connectDB;
