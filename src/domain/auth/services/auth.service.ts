import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '@/shared/errors/AppError';
import { config } from '@/core/config/env';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types';

export const authService = {
  /**
   * Login user with credentials
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    // Find user by email
    const user = await userRepository.findByEmail(data.email);
    
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
      refreshToken,
    };
  },

  /**
   * Register new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    // Check if user exists
    const existingUser = await userRepository.findByEmail(data.email);
    
    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await userRepository.create({
      ...data,
      password: hashedPassword,
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
    };
  },

  /**
   * Logout user
   */
  logout: async (userId: string): Promise<void> => {
    // Implement token blacklisting or session invalidation
    // For now, just a placeholder
    await userRepository.updateLastLogout(userId, new Date());
  },

  /**
   * Get current user by ID
   */
  getCurrentUser: async (userId: string) => {
    const user = await userRepository.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  },
};