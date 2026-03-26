// scripts/seed-pricing.ts

import { PrismaClient, Category } from '@prisma/client';

const prisma = new PrismaClient();

const basePlans = [
  {
    name: 'Starter Plan',
    price: 150000,
    currency: 'NGN',
    billingCycle: 'monthly',
    features: [
      '3 QRA codes',
      'Email Designs',
      '24/7 Customer Support',
      'Basic Analytics',
      '1 User Account',
    ],
    description: 'Perfect for individuals and small businesses getting started',
    isActive: true,
    displayOrder: 1,
  },
  {
    name: 'Professional Plan',
    price: 350000,
    currency: 'NGN',
    billingCycle: 'monthly',
    features: [
      'Unlimited QRA codes',
      'Priority Support',
      'Analytics Dashboard',
      'Custom Email Templates',
      'Up to 5 User Accounts',
      'API Access',
    ],
    description: 'Ideal for growing businesses with advanced needs',
    isActive: true,
    displayOrder: 2,
  },
  {
    name: 'Business Plan',
    price: 650000,
    currency: 'NGN',
    billingCycle: 'monthly',
    features: [
      'Everything in Professional',
      'Dedicated Account Manager',
      'Advanced Analytics & Reporting',
      'White-label Solutions',
      'Unlimited User Accounts',
      'Premium API Access',
      'Custom Integrations',
      'SLA Guarantee',
    ],
    description: 'Enterprise-grade solution for large organizations',
    isActive: true,
    displayOrder: 3,
  },
  {
    name: 'Custom Plan',
    price: 0,
    currency: 'NGN',
    billingCycle: 'one-time',
    features: [
      'Tailored to your specific needs',
      'Custom pricing',
      'Dedicated support team',
      'Flexible terms',
    ],
    description: 'Contact us for a custom solution tailored to your business',
    isActive: true,
    displayOrder: 4,
  },
];

const categories: { value: Category; label: string }[] = [
  { value: Category.WEBSITE,    label: 'Website'    },
  { value: Category.WEB_APP,    label: 'Web App'    },
  { value: Category.MOBILE_APP, label: 'Mobile App' },
  { value: Category.BRANDING,   label: 'Branding'   },
];

const generatedPlans = categories.flatMap(({ value, label }) =>
  basePlans.map((plan) => ({
    ...plan,
    name: `${plan.name} (${label})`,
    category: value,
  }))
);

async function seedPricing() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to Database');

    await prisma.pricing.deleteMany({});
    console.log('🗑️  Cleared existing pricing plans');

    await prisma.pricing.createMany({
      data: generatedPlans,
    });

    const result = await prisma.pricing.findMany();
    console.log(`✅ Seeded ${result.length} pricing plans`);

    result.forEach((plan) => {
      console.log(`   - ${plan.name}: ₦${plan.price.toLocaleString()}/month`);
    });

    console.log('\n🎉 Pricing plans seeded successfully!');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding pricing plans:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedPricing();