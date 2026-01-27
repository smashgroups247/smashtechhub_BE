import { Router } from 'express';
import { authRouter } from './auth.routes';

export const v1Router = Router();

// Health check route
v1Router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount auth routes
v1Router.use('/auth', authRouter);
