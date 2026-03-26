// src/api/v1/validators/pricing.validator.ts
import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '@/shared/utils/response.util';

const VALID_CATEGORIES = ['WEBSITE', 'WEB_APP', 'MOBILE_APP', 'BRANDING'] as const;

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
  category: Joi.string()
    .uppercase()
    .valid(...VALID_CATEGORIES)
    .required()
    .messages({
      'any.only': `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
      'any.required': 'Category is required',
    }),
});

/**
 * PUT — full resource replacement.
 * Every mutable field is required; the response will be exactly this payload persisted.
 */
const putPricingSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required().messages({
    'string.empty': 'Plan name is required',
    'string.min': 'Plan name must be at least 3 characters',
    'string.max': 'Plan name cannot exceed 100 characters',
    'any.required': 'Plan name is required',
  }),
  price: Joi.number().min(0).required().messages({
    'number.base': 'Price must be a number',
    'number.min': 'Price cannot be negative',
    'any.required': 'Price is required',
  }),
  currency: Joi.string().uppercase().valid('NGN', 'USD', 'EUR', 'GBP').required().messages({
    'any.only': 'Currency must be one of: NGN, USD, EUR, GBP',
    'any.required': 'Currency is required',
  }),
  billingCycle: Joi.string().lowercase().valid('monthly', 'yearly', 'one-time').required().messages({
    'any.only': 'Billing cycle must be one of: monthly, yearly, one-time',
    'any.required': 'Billing cycle is required',
  }),
  features: Joi.array().items(Joi.string().trim()).min(1).required().messages({
    'array.min': 'At least one feature is required',
    'any.required': 'Features are required',
  }),
  description: Joi.string().trim().max(500).allow('').required().messages({
    'any.required': 'Description is required (use empty string if none)',
  }),
  isActive: Joi.boolean().required().messages({
    'any.required': 'isActive is required',
  }),
  displayOrder: Joi.number().min(0).required().messages({
    'any.required': 'displayOrder is required',
  }),
  category: Joi.string()
    .uppercase()
    .valid(...VALID_CATEGORIES)
    .required()
    .messages({
      'any.only': `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
      'any.required': 'Category is required',
    }),
});

/**
 * PATCH — partial update.
 * All fields optional, but at least one must be present.
 */
const patchPricingSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).optional(),
  price: Joi.number().min(0).optional(),
  currency: Joi.string().uppercase().valid('NGN', 'USD', 'EUR', 'GBP').optional(),
  billingCycle: Joi.string().lowercase().valid('monthly', 'yearly', 'one-time').optional(),
  features: Joi.array().items(Joi.string().trim()).min(1).optional(),
  description: Joi.string().trim().max(500).optional().allow(''),
  isActive: Joi.boolean().optional(),
  displayOrder: Joi.number().min(0).optional(),
  category: Joi.string()
    .uppercase()
    .valid(...VALID_CATEGORIES)
    .optional()
    .messages({
      'any.only': `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for patch',
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
  category: Joi.string()
    .uppercase()
    .valid(...VALID_CATEGORIES)
    .optional()
    .messages({
      'any.only': `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
    }),
});

/**
 * Validation Schema for UUID (Prisma @default(uuid()))
 */
const idParamSchema = Joi.object({
  id: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
    'string.guid': 'Invalid pricing plan ID format (must be a valid UUID)',
    'any.required': 'Pricing plan ID is required',
  }),
});

/**
 * Validation Schema for category path param
 */
const categoryParamSchema = Joi.object({
  category: Joi.string()
    .uppercase()
    .valid(...VALID_CATEGORIES)
    .required()
    .messages({
      'any.only': `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
      'any.required': 'Category is required',
    }),
});

// ---------------------------------------------------------------------------
// Generic middleware factory — keeps every exported validator DRY
// ---------------------------------------------------------------------------
const validate = (
  schema: Joi.ObjectSchema,
  target: 'body' | 'query' | 'params'
) => (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = schema.validate(req[target], {
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

  (req as any)[target] = value;
  next();
};

// ---------------------------------------------------------------------------
// Exported middleware
// ---------------------------------------------------------------------------

/** POST /pricing */
export const validateCreatePricing = validate(createPricingSchema, 'body');

/** PUT /pricing/:id  — requires every field */
export const validatePutPricing = validate(putPricingSchema, 'body');

/** PATCH /pricing/:id — requires at least one field */
export const validatePatchPricing = validate(patchPricingSchema, 'body');

/** GET /pricing  (query string) */
export const validatePricingQuery = validate(queryPricingSchema, 'query');

/** Any route that takes :id */
export const validatePricingId = validate(idParamSchema, 'params');

/** GET /pricing/category/:category */
export const validateCategoryParam = validate(categoryParamSchema, 'params');

// ---------------------------------------------------------------------------
// Kept for backwards compat — points to the PUT validator.
// Remove once all consumers migrate to validatePutPricing.
// ---------------------------------------------------------------------------
/** @deprecated Use validatePutPricing */
export const validateUpdatePricing = validatePutPricing;