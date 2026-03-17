// src/api/v1/routes/index.ts
import { Router } from 'express';
import { authRouter } from './auth.routes';
import { pricingRouter } from './pricing.routes';
import { contactRouter } from './contact.routes';

export const v1Router = Router();

// Health check route
v1Router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API v1 is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount auth routes
v1Router.use('/auth', authRouter);

// Mount pricing routes
v1Router.use('/pricing', pricingRouter);

// Mount contact routes
v1Router.use('/contact', contactRouter);