// src/api/v1/middlewares/rateLimit.middleware.ts
/// <reference path="../../../shared/types/express.d.ts" />

import rateLimit from 'express-rate-limit';
import { config } from '@/core/config/env';
import { errorResponse } from '@/shared/utils/response.util';
import { Request, Response } from 'express';

/**
 * Rate Limiter for Contact Form Submissions
 * Limits: 5 submissions per IP per hour
 */
export const contactRateLimiter = rateLimit({
  windowMs: config.rateLimit.contact.windowMs, // 1 hour
  max: config.rateLimit.contact.max, // 5 requests per window
  message: 'Too many contact form submissions from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Custom handler for rate limit exceeded
  handler: (req: Request, res: Response) => {
    return errorResponse(
      res,
      429,
      'Too many contact form submissions. Please try again later.',
      {
        retryAfter: Math.ceil(config.rateLimit.contact.windowMs / 1000 / 60), // minutes
      }
    );
  },
  // Skip rate limiting for certain conditions
  skip: (req: Request) => {
    // Skip rate limiting for admin users (if they have admin role)
    if (req.user && req.user.role === 'admin') {
      return true;
    }
    return false;
  },
  // Use default IP-based key generation (handles IPv6 correctly)
});

/**
 * General API Rate Limiter
 * Limits: 100 requests per IP per 15 minutes
 */
export const generalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes
  max: config.rateLimit.max, // 100 requests per window
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    return errorResponse(
      res,
      429,
      'Too many requests. Please try again later.',
      {
        retryAfter: Math.ceil(config.rateLimit.windowMs / 1000 / 60), // minutes
      }
    );
  },
});

/**
 * Strict Rate Limiter for Auth Endpoints
 * Limits: 5 requests per IP per 15 minutes
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    return errorResponse(
      res,
      429,
      'Too many authentication attempts. Please try again later.',
      {
        retryAfter: 15, // minutes
      }
    );
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});