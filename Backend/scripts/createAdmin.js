/**
 * Seed Script: Create Initial Admin User
 * 
 * This script creates an initial admin user for the Telogica platform.
 * It can be run using: node scripts/createAdmin.js
 * 
 * Usage:
 * 1. Ensure MongoDB is running and .env is configured
 * 2. Run: node scripts/createAdmin.js
 * 3. Use the credentials to login as admin
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ MongoDB Connected');
  } catch (error) {
    console.error('✗ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Create Admin User
const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@telogica.com' });
    
    if (existingAdmin) {
      console.log('⚠ Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      console.log('\nTo create a new admin, delete the existing one first or use a different email.');
      return;
    }

    // Get password from environment variable or use default
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    
    if (!process.env.ADMIN_PASSWORD) {
      console.log('⚠ WARNING: Using default password. Set ADMIN_PASSWORD environment variable for production.');
    }

    // Create new admin user
    const adminUser = await User.create({
      name: 'Admin',
      email: 'admin@telogica.com',
      password: adminPassword, // This will be hashed automatically by the User model pre-save hook
      role: 'admin',
      isApproved: true,
      phone: '+91-1234567890',
      address: 'Telogica HQ, India'
    });

    console.log('✓ Admin user created successfully!');
    console.log('\n=================================');
    console.log('Admin Login Credentials:');
    console.log('=================================');
    console.log('Email:', adminUser.email);
    console.log('Password:', adminPassword === 'Admin@123' ? 'Admin@123 (default)' : '****** (from ADMIN_PASSWORD env var)');
    console.log('Role:', adminUser.role);
    console.log('=================================');
    console.log('\n⚠ IMPORTANT: Change the password after first login!');
    
  } catch (error) {
    console.error('✗ Error creating admin user:', error.message);
  }
};

// Main execution
const main = async () => {
  console.log('\n=================================');
  console.log('Telogica Admin User Setup');
  console.log('=================================\n');
  
  await connectDB();
  await createAdminUser();
  
  // Close database connection
  await mongoose.connection.close();
  console.log('\n✓ Database connection closed');
  process.exit(0);
};

// Run the script
main();
