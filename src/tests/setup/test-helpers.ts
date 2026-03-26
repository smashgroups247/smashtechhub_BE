// tests/setup/test-helpers.ts
import jwt from 'jsonwebtoken';
import { prisma } from '../../core/database/prisma';

// ── Env defaults used by the boilerplate ─────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_unit_tests';

// ── Token factories ───────────────────────────────────────────────────────────
export const generateAdminToken = (id = 'admin-id-1'): string =>
  jwt.sign(
    { id, email: 'admin@smashtechhub.com', role: 'admin' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

export const generateUserToken = (id = 'user-id-1'): string =>
  jwt.sign(
    { id, email: 'user@example.com', role: 'user' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

// ── Seed factories ────────────────────────────────────────────────────────────
export const seedPricingPlans = async (count = 3) => {
  const plans = Array.from({ length: count }, (_, i) => ({
    name: `Test Plan ${i + 1}`,
    price: 10000 * (i + 1),
    currency: 'NGN',
    billingCycle: 'monthly',
    features: [`Feature A${i}`, `Feature B${i}`],
    description: `Description for plan ${i + 1}`,
    isActive: i !== count - 1, // last plan is inactive
    displayOrder: i,
    category: 'WEBSITE' as const,
    deletedAt: null,
  }));
  return prisma.pricing.createMany({ data: plans });
};

export const seedContacts = async (count = 3) => {
  const contacts = Array.from({ length: count }, (_, i) => ({
    fullName: `Contact User ${i + 1}`,
    email: `contact${i + 1}@example.com`,
    serviceOfInterest: 'Web Development',
    projectDetails: `Project details for contact ${i + 1} – enough length here.`,
    status: i === 0 ? 'new' : i === 1 ? 'in-progress' : 'resolved',
    adminNotes: i > 0 ? `Note for contact ${i + 1}` : '',
    deletedAt: null,
  }));
  return prisma.contact.createMany({ data: contacts });
};

// ── Utility ───────────────────────────────────────────────────────────────────
export const clearDatabase = async () => {
  await prisma.pricing.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.user.deleteMany({});
};

// ── Shared valid payloads (reused across tests) ──────────────────────────────
export const VALID_PRICING_CREATE = {
  name: 'Starter Plan',
  price: 15000,
  currency: 'NGN',
  billingCycle: 'monthly',
  features: ['3 QRA codes', 'Email Designs', '24/7 Support'],
  description: 'Entry-level plan',
  isActive: true,
  displayOrder: 0,
  category: 'WEBSITE' as const,
};

export const VALID_PRICING_PUT = {
  name: 'Starter Plan Updated',
  price: 18000,
  currency: 'USD',
  billingCycle: 'yearly',
  features: ['5 QRA codes', 'Priority Support'],
  description: 'Updated description',
  isActive: true,
  displayOrder: 1,
  category: 'WEBSITE' as const,
};

export const VALID_CONTACT_CREATE = {
  fullName: 'Jane Smith',
  email: 'jane@example.com',
  serviceOfInterest: 'Web Development',
  projectDetails: 'We need a full-stack e-commerce solution with payment integration.',
};