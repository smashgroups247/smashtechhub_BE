// src/core/database/prisma.ts
import { PrismaClient } from '@prisma/client';
import { logger } from '@/monitoring/logger/logger';
import { config } from '../config/env';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.database.url,
    },
  },
});

export const initializeDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('PostgreSQL connected successfully via Prisma');
  } catch (error) {
    logger.error('PostgreSQL connection error:', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    logger.info('PostgreSQL disconnected gracefully');
  } catch (error) {
    logger.error('Error disconnecting from PostgreSQL:', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};
