// src/api/v1/middlewares/auth.middleware.ts
/// <reference path="../../../shared/types/express.d.ts" />

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/core/config/env';
import { AppError } from '@/shared/errors/AppError';

export interface JwtPayload {
  id: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
};