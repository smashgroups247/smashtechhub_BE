import jwt from 'jsonwebtoken';
import { config } from '@/core/config/env';
import { AppError } from '@/shared/errors/AppError';

export interface JwtPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Sign a JWT token
 */
export const signToken = (payload: object, expiresIn: string = '1h') => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
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
export const authenticate = (req: Express.Request, _res: Express.Response, next: Function) => {
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
