// src/domain/auth/repositories/user.repository.ts
import { UserModel, IUser } from '../models/user.model';
import type { RegisterRequest } from '../types';

export const userRepository = {
  /**
   * Find user by email
   */
  findByEmail: async (email: string): Promise<IUser | null> => {
    try {
      return await UserModel.findOne({ email }).exec();
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  },

  /**
   * Find user by ID
   */
  findById: async (id: string): Promise<IUser | null> => {
    try {
      return await UserModel.findById(id).exec();
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  },

  /**
   * Create new user
   */
  create: async (data: RegisterRequest & { password: string }): Promise<IUser> => {
    try {
      const user = new UserModel({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || 'user', // Default role
      });
      
      return await user.save();
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
      await UserModel.findByIdAndUpdate(
        userId,
        { lastLogout: timestamp },
        { new: true }
      ).exec();
    } catch (error) {
      console.error('Error updating last logout:', error);
      throw error;
    }
  },
};