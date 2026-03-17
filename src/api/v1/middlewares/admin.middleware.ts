// src/api/v1/middlewares/admin.middleware.ts
/// <reference path="../../../shared/types/express.d.ts" />

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/shared/errors/AppError';

/**
 * Admin Authorization Middleware
 * Checks if the authenticated user has admin role
 * 
 * Note: This is a basic implementation. In production, you should:
 * 1. Fetch user role from database based on req.user.id
 * 2. Check against a proper role-based access control (RBAC) system
 * 3. Consider using a more sophisticated permission system
 */

/**
 * Check if user is admin
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated (should be handled by authenticate middleware first)
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Check role from JWT token (if role is included in token)
    const userRole = req.user.role;
    
    if (userRole !== 'admin') {
      throw new AppError('Access denied. Admin privileges required', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user is admin or owner of resource
 */
export const isAdminOrOwner = (resourceUserIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const userRole = req.user.role;
      const userId = req.user.id;
      const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField];

      // Allow if user is admin or owns the resource
      if (userRole === 'admin' || userId === resourceUserId) {
        return next();
      }

      throw new AppError('Access denied. Insufficient permissions', 403);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Helper function to check multiple roles
 */
export const hasAnyRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const userRole = req.user.role;

      if (!userRole || !allowedRoles.includes(userRole)) {
        throw new AppError('Access denied. Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * IMPORTANT NOTES FOR PRODUCTION:
 * 
 * 1. User Role Management:
 *    - Add a 'role' field to your User model/schema
 *    - Store roles in database: 'admin', 'user', 'moderator', etc.
 *    - Include role in JWT token payload when signing tokens
 * 
 * 2. Example User Model with Role:
 *    ```typescript
 *    {
 *      id: string;
 *      email: string;
 *      password: string;
 *      role: 'admin' | 'user' | 'moderator';
 *      createdAt: Date;
 *    }
 *    ```
 * 
 * 3. Example JWT Token Signing (in auth.service.ts):
 *    ```typescript
 *    const token = jwt.sign(
 *      { 
 *        id: user.id, 
 *        email: user.email,
 *        role: user.role  // Include role in token
 *      },
 *      config.jwt.secret,
 *      { expiresIn: config.jwt.expiresIn }
 *    );
 *    ```
 * 
 * 4. For more advanced scenarios:
 *    - Consider implementing RBAC (Role-Based Access Control)
 *    - Use permission-based access instead of role-based
 *    - Implement resource-level permissions
 *    - Use libraries like 'casbin' for complex authorization
 */