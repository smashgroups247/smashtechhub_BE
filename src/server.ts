// src/server.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './core/config/env';
import { errorHandler } from './api/v1/middlewares/errorHandler.middleware';
import { v1Router } from './api/v1/routes';
import { logger } from './monitoring/logger/logger';
import { setupSwagger } from './api/v1/docs/swagger';
import { mongoDBConnection } from './core/database/mongodb';
import './tsconfig-paths-bootstrap';

const app = express();

// --------------------
// Database Connection
// --------------------
const initializeDatabase = async () => {
  try {
    await mongoDBConnection.connect();
    logger.info('Database initialization completed');
  } catch (error) {
    logger.error('Database initialization failed:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1); // Exit if database connection fails
  }
};

// --------------------
// Security Middleware
// --------------------
app.use(helmet());
app.use(cors(config.cors || {}));

// --------------------
// Body Parsing
// --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------
// Request Logging
// --------------------
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// --------------------
// Home Route
// --------------------
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to SmashTechHub API',
    version: '1.0.0',
    documentation: {
      swagger: `http://localhost:${config.port}/api/docs`,
      openapi: `http://localhost:${config.port}/api/docs/json`,
    },
    status: 'running',
  });
});

// --------------------
// API Documentation
// --------------------
setupSwagger(app);

// --------------------
// API Routes (Versioned)
// --------------------
app.use('/api/v1', v1Router);

// --------------------
// Health Check
// --------------------
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
    database: mongoDBConnection.getConnectionStatus() ? 'connected' : 'disconnected',
  });
});

// --------------------
// 404 Handler
// --------------------
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// --------------------
// Error Handler
// --------------------
app.use(errorHandler);

// --------------------
// Start Server
// --------------------
const PORT = config.port || 3000;

const startServer = async () => {
  try {
    // Initialize database first
    await initializeDatabase();

    // Then start the server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`Swagger UI: http://localhost:${PORT}/api/docs`);
      logger.info(`OpenAPI JSON: http://localhost:${PORT}/api/docs/json`);
      logger.info(`Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;