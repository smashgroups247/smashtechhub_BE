// tests/setup/jest.setup.ts
/// <reference types="jest" />
import { prisma } from "../../core/database/prisma";

// ── Bootstrap ─────────────────────────────────────────────────────────────────
beforeAll(async () => {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error("Failed to connect to Prisma:", error);
    throw error;
  }
}, 60000);

// ── Teardown ──────────────────────────────────────────────────────────────────
afterAll(async () => {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error("Failed to cleanup Prisma connection:", error);
    throw error;
  }
}, 60000);

// ── Isolation: wipe every table before each test ──────────────────────────────
beforeEach(async () => {
  // Clear all data
  await prisma.user.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.pricing.deleteMany({});
});
