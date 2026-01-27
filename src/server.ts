// src/server.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './core/config/env';
import { errorHandler } from './api/v1/middlewares/errorHandler.middleware';
import { v1Router } from './api/v1/routes';
import { logger } from './monitoring/logger/logger';
import { setupSwagger } from './api/v1/docs/swagger';
import './tsconfig-paths-bootstrap';

const app = express();

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
    message: 'Welcome to ExpressJS API version 1',
    version: '1.0.0',
    documentation: {
      swagger: `http://localhost:${config.port}/api/docs`,
      scalar: `http://localhost:${config.port}/api/docs/scalar`,
      openapi: `http://localhost:${config.port}/api/docs/json`,
    },
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

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
  logger.info(`Swagger UI: http://localhost:${PORT}/api/docs`);
  logger.info(`Scalar Docs: http://localhost:${PORT}/api/docs/scalar`);
  logger.info(`OpenAPI JSON: http://localhost:${PORT}/api/docs/json`);
});

export default app;