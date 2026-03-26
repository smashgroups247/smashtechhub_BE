// scripts/seed-contacts.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleContacts = [
  {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    serviceOfInterest: 'Web Development',
    projectDetails: 'I need a custom e-commerce website with payment integration, inventory management, and customer portal. Timeline: 3 months.',
    status: 'new',
  },
  {
    fullName: 'Jane Smith',
    email: 'jane.smith@techcorp.com',
    serviceOfInterest: 'Mobile App Development',
    projectDetails: 'Looking for a mobile app for iOS and Android to manage our field service operations. Need real-time tracking and offline mode.',
    status: 'in-progress',
    adminNotes: 'Scheduled discovery call for next week',
  },
  {
    fullName: 'Michael Johnson',
    email: 'mjohnson@startup.io',
    serviceOfInterest: 'UI/UX Design',
    projectDetails: 'Need complete UI/UX redesign of our SaaS platform. Current design is outdated and not user-friendly.',
    status: 'new',
  },
  {
    fullName: 'Sarah Williams',
    email: 'sarah.w@marketing.com',
    serviceOfInterest: 'Digital Marketing',
    projectDetails: 'Require comprehensive digital marketing strategy including SEO, social media, and email campaigns for product launch.',
    status: 'resolved',
    adminNotes: 'Proposal sent and accepted. Project started.',
    resolvedAt: new Date('2026-01-25'),
  },
  {
    fullName: 'David Brown',
    email: 'david.brown@retail.com',
    serviceOfInterest: 'E-commerce Solutions',
    projectDetails: 'Want to migrate our existing store to a modern platform with better performance and mobile optimization.',
    status: 'new',
  },
  {
    fullName: 'Emma Davis',
    email: 'emma.davis@enterprise.com',
    serviceOfInterest: 'Custom Software',
    projectDetails: 'Need custom CRM solution integrated with our existing ERP system. Must support 500+ concurrent users.',
    status: 'in-progress',
    adminNotes: 'Requirements gathering in progress',
  },
  {
    fullName: 'James Wilson',
    email: 'james.w@consulting.biz',
    serviceOfInterest: 'Consulting',
    projectDetails: 'Looking for technology consulting to modernize our legacy systems and migrate to cloud infrastructure.',
    status: 'new',
  },
  {
    fullName: 'Olivia Martinez',
    email: 'olivia.m@design.studio',
    serviceOfInterest: 'Web Development',
    projectDetails: 'Portfolio website for our design studio. Need something modern, fast, and showcasing our work beautifully.',
    status: 'resolved',
    adminNotes: 'Project completed successfully',
    resolvedAt: new Date('2026-01-20'),
  },
  {
    fullName: 'William Taylor',
    email: 'william.t@fintech.com',
    serviceOfInterest: 'Mobile App Development',
    projectDetails: 'Financial app with secure payment processing, biometric authentication, and real-time transaction tracking.',
    status: 'in-progress',
    adminNotes: 'Security review scheduled',
  },
  {
    fullName: 'Sophia Anderson',
    email: 'sophia.a@health.org',
    serviceOfInterest: 'Custom Software',
    projectDetails: 'Patient management system for our clinic network. HIPAA compliance required.',
    status: 'new',
  },
];

async function seedContacts() {
  try {
    // Connect to Database
    await prisma.$connect();
    console.log('✅ Connected to Database');

    // Clear existing contacts
    await prisma.contact.deleteMany({});
    console.log('🗑️  Cleared existing contact submissions');

    // Insert new contacts
    await prisma.contact.createMany({
      data: sampleContacts
    });
    
    const result = await prisma.contact.findMany();
    console.log(`✅ Seeded ${result.length} contact submissions`);

    // Display statistics
    const stats = {
      new: result.filter((c) => c.status === 'new').length,
      inProgress: result.filter((c) => c.status === 'in-progress').length,
      resolved: result.filter((c) => c.status === 'resolved').length,
    };

    console.log('\n📊 Contact Statistics:');
    console.log(`   - New: ${stats.new}`);
    console.log(`   - In Progress: ${stats.inProgress}`);
    console.log(`   - Resolved: ${stats.resolved}`);

    console.log('\n🎉 Contact submissions seeded successfully!');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding contacts:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the seed function
seedContacts();