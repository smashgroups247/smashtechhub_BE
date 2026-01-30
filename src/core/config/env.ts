// src/core/config/env.ts
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.PORT || 3000,
  port: process.env.PORT || 3000, // Added lowercase alias
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'mydb',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    // MongoDB
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/smashtechhub',
    mongoTestUri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/smashtechhub_test',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-this',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    // Contact form specific rate limiting
    contact: {
      windowMs: parseInt(process.env.CONTACT_RATE_LIMIT_WINDOW_MS || '3600000'), // 1 hour
      max: parseInt(process.env.CONTACT_RATE_LIMIT_MAX || '5'), // 5 requests per hour
    },
  },
};