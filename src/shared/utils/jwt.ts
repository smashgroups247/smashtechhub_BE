import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { config } from '@/core/config/env';
import { AppError } from '@/shared/errors/AppError';

export interface JwtPayload {
  id: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * Sign a JWT token
 */
export const signToken = (payload: object, expiresIn: string = '1h') => {
  return jwt.sign(payload, config.jwt.secret || 'default-secret', { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
};

/**
 * Verify a JWT token
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, config.jwt.secret) as JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError('Token expired', 401);
    }
    throw new AppError('Invalid token', 401);
  }
};

/**
 * Express middleware to authenticate requests
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return next(new AppError('No token provided', 401));
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    next(err);
  }
};
