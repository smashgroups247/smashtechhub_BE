// src/domain/pricing/repositories/pricing.repository.ts
import { PricingModel, IPricing } from '../models/pricing.model';
import { CreatePricingRequest, UpdatePricingRequest, PricingQueryFilters } from '../types';

/**
 * Pricing Repository
 * Handles all database operations for Pricing collection
 */
export const pricingRepository = {
  /**
   * Create a new pricing plan
   */
  create: async (data: CreatePricingRequest): Promise<IPricing> => {
    const pricing = new PricingModel(data);
    return await pricing.save();
  },

  /**
   * Find all pricing plans with pagination and filters
   */
  findAll: async (filters: PricingQueryFilters): Promise<{
    data: IPricing[];
    total: number;
  }> => {
    const {
      page = 1,
      limit = 10,
      sortBy = 'displayOrder',
      sortOrder = 'asc',
      isActive,
    } = filters;

    // Build query
    const query: any = { deletedAt: null };
    
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const [data, total] = await Promise.all([
      PricingModel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      PricingModel.countDocuments(query),
    ]);

    return { data, total };
  },

  /**
   * Find pricing plan by ID
   */
  findById: async (id: string): Promise<IPricing | null> => {
    return await PricingModel.findOne({ _id: id, deletedAt: null }).exec();
  },

  /**
   * Find pricing plan by name
   */
  findByName: async (name: string): Promise<IPricing | null> => {
    return await PricingModel.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      deletedAt: null 
    }).exec();
  },

  /**
   * Update pricing plan by ID
   */
  update: async (
    id: string,
    data: UpdatePricingRequest
  ): Promise<IPricing | null> => {
    return await PricingModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
  },

  /**
   * Soft delete pricing plan by ID
   */
  softDelete: async (id: string): Promise<IPricing | null> => {
    return await PricingModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    ).exec();
  },

  /**
   * Hard delete pricing plan by ID (use with caution)
   */
  hardDelete: async (id: string): Promise<IPricing | null> => {
    return await PricingModel.findByIdAndDelete(id).exec();
  },

  /**
   * Check if pricing plan exists by name (excluding current ID)
   */
  existsByName: async (name: string, excludeId?: string): Promise<boolean> => {
    const query: any = {
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      deletedAt: null,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await PricingModel.countDocuments(query);
    return count > 0;
  },

  /**
   * Get active pricing plans only
   */
  findActive: async (): Promise<IPricing[]> => {
    return await PricingModel.find({ isActive: true, deletedAt: null })
      .sort({ displayOrder: 1 })
      .exec();
  },

  /**
   * Update display order
   */
  updateDisplayOrder: async (id: string, displayOrder: number): Promise<IPricing | null> => {
    return await PricingModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { displayOrder } },
      { new: true }
    ).exec();
  },
};