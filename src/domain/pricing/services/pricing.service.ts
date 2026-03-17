// src/domain/pricing/services/pricing.service.ts
import { pricingRepository } from '../repositories/pricing.repository';
import { AppError } from '@/shared/errors/AppError';
import {
  CreatePricingRequest,
  UpdatePricingRequest,
  PatchPricingRequest,
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
    const existingPricing = await pricingRepository.existsByName(data.name);

    if (existingPricing) {
      throw new AppError('Pricing plan with this name already exists', 400);
    }

    if (data.price < 0) {
      throw new AppError('Price cannot be negative', 400);
    }

    if (!data.features || data.features.length === 0) {
      throw new AppError('At least one feature is required', 400);
    }

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
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 10));

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
   * Update pricing plan (PUT — full replace)
   */
  updatePricing: async (
    id: string,
    data: UpdatePricingRequest
  ): Promise<PricingResponse> => {
    const existingPricing = await pricingRepository.findById(id);

    if (!existingPricing) {
      throw new AppError('Pricing plan not found', 404);
    }

    // Only check for name duplicates if the name is actually changing
    if (data.name && data.name !== existingPricing.name) {
      const nameExists = await pricingRepository.existsByName(data.name, id);
      if (nameExists) {
        throw new AppError('Pricing plan with this name already exists', 400);
      }
    }

    if (data.price !== undefined && data.price < 0) {
      throw new AppError('Price cannot be negative', 400);
    }

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
   * Patch pricing plan (PATCH — partial update, only sent fields change)
   */
  patchPricing: async (
    id: string,
    data: PatchPricingRequest
  ): Promise<PricingResponse> => {
    const existingPricing = await pricingRepository.findById(id);

    if (!existingPricing) {
      throw new AppError('Pricing plan not found', 404);
    }

    // Duplicate-name guard only fires when name is actually being changed
    if (data.name !== undefined && data.name !== existingPricing.name) {
      const nameExists = await pricingRepository.existsByName(data.name, id);
      if (nameExists) {
        throw new AppError('Pricing plan with this name already exists', 400);
      }
    }

    if (data.price !== undefined && data.price < 0) {
      throw new AppError('Price cannot be negative', 400);
    }

    if (data.features !== undefined && data.features.length === 0) {
      throw new AppError('At least one feature is required', 400);
    }

    const patchedPricing = await pricingRepository.patch(id, data);

    if (!patchedPricing) {
      throw new AppError('Failed to patch pricing plan', 500);
    }

    return patchedPricing.toJSON() as PricingResponse;
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

    const updatedPricing = await pricingRepository.patch(id, {
      isActive: !pricing.isActive,
    });

    if (!updatedPricing) {
      throw new AppError('Failed to update pricing plan', 500);
    }

    return updatedPricing.toJSON() as PricingResponse;
  },
};