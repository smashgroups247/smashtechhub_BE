// src/domain/pricing/services/pricing.service.ts
import { pricingRepository } from '../repositories/pricing.repository';
import { AppError } from '@/shared/errors/AppError';
import {
  CreatePricingRequest,
  UpdatePricingRequest,
  PricingQueryFilters,
  PricingResponse,
  PaginatedPricingResponse,
} from '../types';

/**
 * Pricing Service
 * Contains business logic for pricing operations
 */
export const pricingService = {
  /**
   * Create a new pricing plan
   */
  createPricing: async (data: CreatePricingRequest): Promise<PricingResponse> => {
    // Check if pricing plan with same name already exists
    const existingPricing = await pricingRepository.existsByName(data.name);
    
    if (existingPricing) {
      throw new AppError('Pricing plan with this name already exists', 400);
    }

    // Validate price
    if (data.price < 0) {
      throw new AppError('Price cannot be negative', 400);
    }

    // Validate features
    if (!data.features || data.features.length === 0) {
      throw new AppError('At least one feature is required', 400);
    }

    // Set default values
    const pricingData = {
      ...data,
      isActive: data.isActive !== undefined ? data.isActive : true,
      displayOrder: data.displayOrder !== undefined ? data.displayOrder : 0,
      currency: data.currency || 'NGN',
      billingCycle: data.billingCycle || 'monthly',
    };

    const pricing = await pricingRepository.create(pricingData);
    return pricing.toJSON() as PricingResponse;
  },

  /**
   * Get all pricing plans with pagination
   */
  getAllPricing: async (
    filters: PricingQueryFilters
  ): Promise<PaginatedPricingResponse> => {
    // Validate and set defaults
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 10)); // Max 100 items per page

    const { data, total } = await pricingRepository.findAll({
      ...filters,
      page,
      limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((item) => item.toJSON() as PricingResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  },

  /**
   * Get pricing plan by ID
   */
  getPricingById: async (id: string): Promise<PricingResponse> => {
    const pricing = await pricingRepository.findById(id);

    if (!pricing) {
      throw new AppError('Pricing plan not found', 404);
    }

    return pricing.toJSON() as PricingResponse;
  },

  /**
   * Update pricing plan
   */
  updatePricing: async (
    id: string,
    data: UpdatePricingRequest
  ): Promise<PricingResponse> => {
    // Check if pricing plan exists
    const existingPricing = await pricingRepository.findById(id);

    if (!existingPricing) {
      throw new AppError('Pricing plan not found', 404);
    }

    // If name is being updated, check for duplicates
    if (data.name && data.name !== existingPricing.name) {
      const nameExists = await pricingRepository.existsByName(data.name, id);
      
      if (nameExists) {
        throw new AppError('Pricing plan with this name already exists', 400);
      }
    }

    // Validate price if provided
    if (data.price !== undefined && data.price < 0) {
      throw new AppError('Price cannot be negative', 400);
    }

    // Validate features if provided
    if (data.features && data.features.length === 0) {
      throw new AppError('At least one feature is required', 400);
    }

    const updatedPricing = await pricingRepository.update(id, data);

    if (!updatedPricing) {
      throw new AppError('Failed to update pricing plan', 500);
    }

    return updatedPricing.toJSON() as PricingResponse;
  },

  /**
   * Delete pricing plan (soft delete)
   */
  deletePricing: async (id: string): Promise<void> => {
    const pricing = await pricingRepository.findById(id);

    if (!pricing) {
      throw new AppError('Pricing plan not found', 404);
    }

    await pricingRepository.softDelete(id);
  },

  /**
   * Get only active pricing plans
   */
  getActivePricing: async (): Promise<PricingResponse[]> => {
    const activePlans = await pricingRepository.findActive();
    return activePlans.map((plan) => plan.toJSON() as PricingResponse);
  },

  /**
   * Toggle pricing plan active status
   */
  toggleActiveStatus: async (id: string): Promise<PricingResponse> => {
    const pricing = await pricingRepository.findById(id);

    if (!pricing) {
      throw new AppError('Pricing plan not found', 404);
    }

    const updatedPricing = await pricingRepository.update(id, {
      isActive: !pricing.isActive,
    });

    if (!updatedPricing) {
      throw new AppError('Failed to update pricing plan', 500);
    }

    return updatedPricing.toJSON() as PricingResponse;
  },
};