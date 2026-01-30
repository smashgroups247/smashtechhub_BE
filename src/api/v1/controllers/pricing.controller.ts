// src/api/v1/controllers/pricing.controller.ts
import { Request, Response, NextFunction } from 'express';
import { pricingService } from '@/domain/pricing/services/pricing.service';
import { successResponse } from '@/shared/utils/response.util';
import { CreatePricingRequest, UpdatePricingRequest, PricingQueryFilters } from '@/domain/pricing/types';

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
      
      return successResponse(
        res,
        201,
        'Pricing plan created successfully',
        pricing
      );
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
      const filters: PricingQueryFilters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        isActive: req.query.isActive === 'true' ? true : 
                  req.query.isActive === 'false' ? false : undefined,
      };

      const result = await pricingService.getAllPricing(filters);
      
      return res.status(200).json({
        statusCode: 200,
        success: true,
        message: 'Pricing plans retrieved successfully',
        data: result.data,
        pagination: result.pagination,
      });
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
      
      return successResponse(
        res,
        200,
        'Pricing plan retrieved successfully',
        pricing
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update pricing plan
   * PUT /api/v1/pricing/:id
   * @access Admin
   */
  updatePricing: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data: UpdatePricingRequest = req.body;
      
      const pricing = await pricingService.updatePricing(id, data);
      
      return successResponse(
        res,
        200,
        'Pricing plan updated successfully',
        pricing
      );
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
      
      return successResponse(
        res,
        200,
        'Pricing plan deleted successfully'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get only active pricing plans
   * GET /api/v1/pricing/active
   * @access Public
   */
  getActivePricing: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pricing = await pricingService.getActivePricing();
      
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
   * Toggle pricing plan active status
   * PATCH /api/v1/pricing/:id/toggle-status
   * @access Admin
   */
  togglePricingStatus: async (req: Request, res: Response, next: NextFunction) => {
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