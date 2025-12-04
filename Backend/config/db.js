const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://telogicaweb_db_user:pRcyCSCk2kHnSIze@clustertelogica.yc5hply.mongodb.net/?appName=Clustertelogica");
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
