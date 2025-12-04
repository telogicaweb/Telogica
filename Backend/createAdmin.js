require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI);

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isApproved: Boolean,
  phone: String,
  address: String
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@telogica.com' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@telogica.com');
      console.log('Update password if needed or use existing credentials');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@telogica.com',
      password: hashedPassword,
      role: 'admin',
      isApproved: true,
      phone: '1234567890',
      address: 'Admin Office'
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: admin@telogica.com');
    console.log('🔑 Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nNext steps:');
    console.log('1. Go to http://localhost:5174/login');
    console.log('2. Login with the credentials above');
    console.log('3. Navigate to http://localhost:5174/admin');
    console.log('4. Click the "Content" tab to manage content');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
