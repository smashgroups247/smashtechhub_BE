// src/api/v1/controllers/pricing.controller.ts
/// <reference path="../../../shared/types/express.d.ts" />

import { Request, Response, NextFunction } from 'express';
import { pricingService } from '@/domain/pricing/services/pricing.service';
import { successResponse, paginatedResponse } from '@/shared/utils/response.util';
import {
  CreatePricingRequest,
  UpdatePricingRequest,
  PatchPricingRequest,
  PricingQueryFilters,
  Category,
} from '@/domain/pricing/types';

/**
 * Pricing Controller
 * Handles HTTP requests for pricing endpoints
 */
export const pricingController = {
  /**
   * Create new pricing plan
   * POST /api/v1/pricing
   * @access Admin
   */
  createPricing: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: CreatePricingRequest = req.body;

      const pricing = await pricingService.createPricing(data);

      return successResponse(res, 201, 'Pricing plan created successfully', pricing);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all pricing plans with pagination
   * GET /api/v1/pricing
   * @access Public
   */
  getAllPricing: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // req.query is already validated & typed by validatePricingQuery middleware
      const query = req.query as any;

      const filters: PricingQueryFilters = {
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 10,
        sortBy: query.sortBy as string,
        sortOrder: query.sortOrder as 'asc' | 'desc',
        // Joi already coerces to boolean; guard in case middleware is bypassed
        isActive: query.isActive === undefined ? undefined : Boolean(query.isActive),
        category: query.category as Category | undefined,
      };

      const result = await pricingService.getAllPricing(filters);

      return paginatedResponse(
        res,
        200,
        'Pricing plans retrieved successfully',
        result.data,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single pricing plan by ID
   * GET /api/v1/pricing/:id
   * @access Public
   */
  getPricingById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const pricing = await pricingService.getPricingById(id);

      return successResponse(res, 200, 'Pricing plan retrieved successfully', pricing);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update pricing plan (full replace)
   * PUT /api/v1/pricing/:id
   * @access Admin
   */
  updatePricing: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data: UpdatePricingRequest = req.body;

      const pricing = await pricingService.updatePricing(id, data);

      return successResponse(res, 200, 'Pricing plan updated successfully', pricing);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Patch pricing plan (partial update — only sent fields change)
   * PATCH /api/v1/pricing/:id
   * @access Admin
   */
  patchPricing: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data: PatchPricingRequest = req.body;

      const pricing = await pricingService.patchPricing(id, data);

      return successResponse(res, 200, 'Pricing plan patched successfully', pricing);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete pricing plan (soft delete)
   * DELETE /api/v1/pricing/:id
   * @access Admin
   */
  deletePricing: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      await pricingService.deletePricing(id);

      return successResponse(res, 200, 'Pricing plan deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get only active pricing plans (lightweight, no pagination)
   * Supports optional ?category=WEBSITE filter
   * GET /api/v1/pricing/active
   * @access Public
   */
  getActivePricing: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = req.query.category as Category | undefined;

      const pricing = await pricingService.getActivePricing(category);

      return successResponse(
        res,
        200,
        'Active pricing plans retrieved successfully',
        pricing
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all plans in a specific category
   * GET /api/v1/pricing/category/:category
   * @access Public
   */
  getPricingByCategory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // req.params.category is already uppercased & validated by validateCategoryParam
      const category = req.params.category as Category;

      const pricing = await pricingService.getPricingByCategory(category);

      return successResponse(
        res,
        200,
        `Pricing plans for category "${category}" retrieved successfully`,
        pricing
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Toggle pricing plan active status
   * PATCH /api/v1/pricing/:id/toggle-status
   * @access Admin
   */
  togglePricingStatus: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const pricing = await pricingService.toggleActiveStatus(id);

      return successResponse(
        res,
        200,
        'Pricing plan status updated successfully',
        pricing
      );
    } catch (error) {
      next(error);
    }
  },
};
