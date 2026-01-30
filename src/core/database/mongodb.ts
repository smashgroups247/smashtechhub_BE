// src/core/database/mongodb.ts
import mongoose from 'mongoose';
import { config } from '../config/env';
import { logger } from '@/monitoring/logger/logger';

/**
 * MongoDB Connection Configuration
 * Handles connection, reconnection, and error handling
 */
class MongoDBConnection {
  private static instance: MongoDBConnection;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  /**
   * Connect to MongoDB with retry logic
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('MongoDB already connected');
      return;
    }

    const mongoURI = config.database.mongoUri;

    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    try {
      await mongoose.connect(mongoURI, {
        // Connection options
        maxPoolSize: 10,
        minPoolSize: 5,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
      });

      this.isConnected = true;
      logger.info('MongoDB connected successfully');
      logger.info(`Database: ${mongoose.connection.name}`);
    } catch (error) {
      logger.error('MongoDB connection error:', error);
      throw error;
    }

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Disconnect from MongoDB
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('MongoDB disconnected gracefully');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get mongoose instance
   */
  public getMongoose(): typeof mongoose {
    return mongoose;
  }
}

// Export singleton instance
export const mongoDBConnection = MongoDBConnection.getInstance();
export default mongoDBConnection;