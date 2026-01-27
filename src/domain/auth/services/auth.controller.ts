import { Request, Response, NextFunction } from 'express';
import { authService } from '@/domain/auth/services/auth.service';
import { AppError } from '@/shared/errors/AppError';

export const authController = {
  /**
   * Login user
   */
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      
      const result = await authService.login({ email, password });
      
      res.json({
        success: true,
        data: result,
      });
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
      
      res.status(201).json({
        success: true,
        data: result,
      });
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
      
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
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
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },
};
