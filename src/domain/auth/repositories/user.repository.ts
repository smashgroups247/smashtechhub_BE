// src/domain/auth/repositories/user.repository.ts
import { prisma } from '../../../core/database/prisma';
import type { User } from '@prisma/client';
import type { RegisterRequest } from '../types';

export const userRepository = {
  /**
   * Find user by email
   */
  findByEmail: async (email: string): Promise<User | null> => {
    try {
      return await prisma.user.findUnique({ where: { email } });
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  },

  /**
   * Find user by ID
   */
  findById: async (id: string): Promise<User | null> => {
    try {
      return await prisma.user.findUnique({ where: { id } });
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  },

  /**
   * Create new user
   */
  create: async (data: RegisterRequest & { password: string }): Promise<User> => {
    try {
      return await prisma.user.create({
        data: {
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role || 'user',
        },
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  /**
   * Update user's last logout timestamp
   */
  updateLastLogout: async (userId: string, timestamp: Date): Promise<void> => {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastLogout: timestamp },
      });
    } catch (error) {
      console.error('Error updating last logout:', error);
      throw error;
    }
  },
};