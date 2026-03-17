// scripts/create-admin.ts
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { config } from '../src/core/config/env';

interface AdminUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin';
  createdAt: Date;
  updatedAt: Date;
}

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.database.mongoUri);
    console.log('✅ Connected to MongoDB');

    // Admin credentials
    const adminEmail = 'admin@smashtechhub.com';
    const adminPassword = 'Admin@123456'; // Change this in production!

    // Check if admin already exists
    const db = mongoose.connection.db;
    const usersCollection = db?.collection('users');
    
    if (!usersCollection) {
      throw new Error('Users collection not found');
    }

    const existingAdmin = await usersCollection.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`   Email: ${adminEmail}`);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const adminUser: AdminUser = {
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await usersCollection.insertOne(adminUser);

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📧 Admin Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n🔐 Use these credentials to:');
    console.log('   1. Login via POST /api/v1/auth/login');
    console.log('   2. Get JWT token with admin role');
    console.log('   3. Access admin-protected endpoints');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the function
createAdmin();