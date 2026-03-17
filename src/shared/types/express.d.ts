// src/shared/types/express.d.ts

/**
 * Extend Express Request type to include authenticated user
 * This file provides a single, unified type declaration for req.user
 */

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role?: string;
        iat?: number;
        exp?: number;
      };
    }
  }
}

export {};