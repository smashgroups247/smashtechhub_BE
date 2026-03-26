// scripts/create-admin.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Connect to Database
    await prisma.$connect();
    console.log('✅ Connected to Database');

    // Admin credentials
    const adminEmail = 'admin@smashtechhub.com';
    const adminPassword = 'Admin@123456'; // Change this in production!

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`   Email: ${adminEmail}`);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      }
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📧 Admin Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n🔐 Use these credentials to:');
    console.log('   1. Login via POST /api/v1/auth/login');
    console.log('   2. Get JWT token with admin role');
    console.log('   3. Access admin-protected endpoints');

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the function
createAdmin();