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

async function createUsers() {
  try {
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const users = [
      {
        name: 'Admin User',
        email: 'admin@telogica.com',
        password: hashedPassword,
        role: 'admin',
        isApproved: true,
        phone: '1234567890',
        address: 'Admin Office'
      },
      {
        name: 'Retailer User',
        email: 'retailer@telogica.com',
        password: hashedPassword,
        role: 'retailer',
        isApproved: true,
        phone: '0987654321',
        address: 'Retailer Office'
      },
      {
        name: 'Regular User',
        email: 'user@telogica.com',
        password: hashedPassword,
        role: 'user',
        isApproved: true,
        phone: '5555555555',
        address: 'User Home'
      }
    ];

    console.log('Creating users...\n');
    
    for (const userData of users) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists - skipping`);
      } else {
        await User.create(userData);
        console.log(`✅ Created: ${userData.email} (${userData.role})`);
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 All Users Created Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nCredentials:');
    console.log('1. admin@telogica.com / 123456 (Admin)');
    console.log('2. retailer@telogica.com / 123456 (Retailer)');
    console.log('3. user@telogica.com / 123456 (User)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating users:', error);
    process.exit(1);
  }
}

createUsers();
