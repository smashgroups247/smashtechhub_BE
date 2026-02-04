// tests/setup/jest.setup.ts
/// <reference types="jest" />
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer: MongoMemoryServer;

// ── Bootstrap ─────────────────────────────────────────────────────────────────
beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create({ spawn: { timeout: 30000 } });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  } catch (error) {
    console.error("Failed to start MongoDB Memory Server:", error);
    throw error;
  }
}, 60000);

// ── Teardown ──────────────────────────────────────────────────────────────────
afterAll(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error("Failed to cleanup MongoDB Memory Server:", error);
    throw error;
  }
}, 60000);

// ── Isolation: wipe every collection before each test ────────────────────────
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
