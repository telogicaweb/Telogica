const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: false,           // Don't block queries waiting for index creation on startup
      serverSelectionTimeoutMS: 60000, // Wait up to 60 s for Atlas to wake from pause
      socketTimeoutMS: 90000,     // Match the request timeout
      connectTimeoutMS: 60000,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
