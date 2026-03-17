// scripts/seed-pricing.ts
import mongoose from 'mongoose';
import { PricingModel } from '../src/domain/pricing/models/pricing.model';
import { config } from '../src/core/config/env';

const pricingPlans = [
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

async function seedPricing() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.database.mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing pricing plans
    await PricingModel.deleteMany({});
    console.log('🗑️  Cleared existing pricing plans');

    // Insert new pricing plans
    const result = await PricingModel.insertMany(pricingPlans);
    console.log(`✅ Seeded ${result.length} pricing plans`);

    // Display seeded plans
    result.forEach((plan) => {
      console.log(`   - ${plan.name}: ₦${plan.price.toLocaleString()}/month`);
    });

    console.log('\n🎉 Pricing plans seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding pricing plans:', error);
    process.exit(1);
  }
}

// Run the seed function
seedPricing();