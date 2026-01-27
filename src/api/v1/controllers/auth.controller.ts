import { Request, Response, NextFunction } from 'express';
import { authService } from '@/domain/auth/services/auth.service';
import { AppError } from '@/shared/errors/AppError';
import { successResponse } from '@shared/utils/response.util';

export const authController = {
  /**
   * Login user
   */
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      
      const result = await authService.login({ email, password });
      
      return successResponse(res, 200, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Register new user
   */
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData = req.body;
      
      const result = await authService.register(userData);
      
      return successResponse(res, 201, 'Registration successful', result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Logout user
   */
  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      
      await authService.logout(userId);
      
      return successResponse(res, 200, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get current user
   */
  me: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      
      const user = await authService.getCurrentUser(userId);
      
      return successResponse(res, 200, 'User retrieved successfully', user);
    } catch (error) {
      next(error);
    }
  },
};