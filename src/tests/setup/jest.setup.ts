// tests/setup/jest.setup.ts
/// <reference types="jest" />
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

// ── Bootstrap ─────────────────────────────────────────────────────────────────
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

// ── Teardown ──────────────────────────────────────────────────────────────────
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// ── Isolation: wipe every collection before each test ────────────────────────
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});