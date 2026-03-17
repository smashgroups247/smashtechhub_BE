// tests/setup/test-helpers.ts
import jwt from 'jsonwebtoken';
import { PricingModel } from '@/domain/pricing/models/pricing.model';
import { ContactModel } from '@/domain/contact/models/contact.model';

// ── Env defaults used by the boilerplate ─────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_unit_tests';

// ── Token factories ───────────────────────────────────────────────────────────
export const generateAdminToken = (id = 'admin_000000000000000001'): string =>
  jwt.sign(
    { id, email: 'admin@smashtechhub.com', role: 'admin' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

export const generateUserToken = (id = 'user_0000000000000000001'): string =>
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
    deletedAt: null,
  }));
  return PricingModel.insertMany(plans);
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
  return ContactModel.insertMany(contacts);
};

// ── Utility ───────────────────────────────────────────────────────────────────
export const clearDatabase = async () => {
  await PricingModel.deleteMany({});
  await ContactModel.deleteMany({});
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
};

export const VALID_CONTACT_CREATE = {
  fullName: 'Jane Smith',
  email: 'jane@example.com',
  serviceOfInterest: 'Web Development',
  projectDetails: 'We need a full-stack e-commerce solution with payment integration.',
};