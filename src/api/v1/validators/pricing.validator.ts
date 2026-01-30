// src/api/v1/validators/pricing.validator.ts
import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '@/shared/utils/response.util';

/**
 * Validation Schema for Creating Pricing Plan
 */
const createPricingSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required().messages({
    'string.empty': 'Plan name is required',
    'string.min': 'Plan name must be at least 3 characters',
    'string.max': 'Plan name cannot exceed 100 characters',
  }),
  price: Joi.number().min(0).required().messages({
    'number.base': 'Price must be a number',
    'number.min': 'Price cannot be negative',
    'any.required': 'Price is required',
  }),
  currency: Joi.string().uppercase().valid('NGN', 'USD', 'EUR', 'GBP').default('NGN'),
  billingCycle: Joi.string().lowercase().valid('monthly', 'yearly', 'one-time').default('monthly'),
  features: Joi.array().items(Joi.string().trim()).min(1).required().messages({
    'array.min': 'At least one feature is required',
    'any.required': 'Features are required',
  }),
  description: Joi.string().trim().max(500).optional(),
  isActive: Joi.boolean().default(true),
  displayOrder: Joi.number().min(0).default(0),
});

/**
 * Validation Schema for Updating Pricing Plan
 */
const updatePricingSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).optional(),
  price: Joi.number().min(0).optional(),
  currency: Joi.string().uppercase().valid('NGN', 'USD', 'EUR', 'GBP').optional(),
  billingCycle: Joi.string().lowercase().valid('monthly', 'yearly', 'one-time').optional(),
  features: Joi.array().items(Joi.string().trim()).min(1).optional(),
  description: Joi.string().trim().max(500).optional().allow(''),
  isActive: Joi.boolean().optional(),
  displayOrder: Joi.number().min(0).optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Validation Schema for Query Parameters
 */
const queryPricingSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('name', 'price', 'displayOrder', 'createdAt', 'updatedAt').default('displayOrder'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  isActive: Joi.boolean().optional(),
});

/**
 * Validation Schema for MongoDB ObjectId
 */
const idParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid pricing plan ID format',
    'string.length': 'Invalid pricing plan ID format',
    'any.required': 'Pricing plan ID is required',
  }),
});

/**
 * Middleware: Validate Create Pricing Request
 */
export const validateCreatePricing = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = createPricingSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors: Record<string, string> = {};
    error.details.forEach((detail) => {
      errors[detail.path.join('.')] = detail.message;
    });
    return errorResponse(res, 400, 'Validation error', errors);
  }

  req.body = value;
  next();
};

/**
 * Middleware: Validate Update Pricing Request
 */
export const validateUpdatePricing = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = updatePricingSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors: Record<string, string> = {};
    error.details.forEach((detail) => {
      errors[detail.path.join('.')] = detail.message;
    });
    return errorResponse(res, 400, 'Validation error', errors);
  }

  req.body = value;
  next();
};

/**
 * Middleware: Validate Query Parameters
 */
export const validatePricingQuery = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = queryPricingSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors: Record<string, string> = {};
    error.details.forEach((detail) => {
      errors[detail.path.join('.')] = detail.message;
    });
    return errorResponse(res, 400, 'Validation error', errors);
  }

  req.query = value;
  next();
};

/**
 * Middleware: Validate ID Parameter
 */
export const validatePricingId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = idParamSchema.validate(req.params, {
    abortEarly: false,
  });

  if (error) {
    const errors: Record<string, string> = {};
    error.details.forEach((detail) => {
      errors[detail.path.join('.')] = detail.message;
    });
    return errorResponse(res, 400, 'Validation error', errors);
  }

  req.params = value;
  next();
};