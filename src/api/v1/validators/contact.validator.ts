// src/api/v1/validators/contact.validator.ts
import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '@/shared/utils/response.util';

const SERVICE_OPTIONS = [
  'Web Development',
  'Mobile App Development',
  'UI/UX Design',
  'Digital Marketing',
  'E-commerce Solutions',
  'Custom Software',
  'Consulting',
  'Other',
];

/**
 * Validation Schema for Creating Contact Submission
 */
const createContactSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Full name is required',
    'string.min': 'Full name must be at least 2 characters',
    'string.max': 'Full name cannot exceed 100 characters',
  }),
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required',
  }),
  serviceOfInterest: Joi.string().valid(...SERVICE_OPTIONS).required().messages({
    'any.only': `Service of interest must be one of: ${SERVICE_OPTIONS.join(', ')}`,
    'any.required': 'Service of interest is required',
  }),
  projectDetails: Joi.string().trim().min(10).max(2000).required().messages({
    'string.min': 'Project details must be at least 10 characters',
    'string.max': 'Project details cannot exceed 2000 characters',
    'any.required': 'Project details are required',
  }),
});

/**
 * Validation Schema for Updating Contact Status (PATCH /:id/status)
 */
const updateContactStatusSchema = Joi.object({
  status: Joi.string().valid('new', 'in-progress', 'resolved').required().messages({
    'any.only': 'Status must be one of: new, in-progress, resolved',
    'any.required': 'Status is required',
  }),
  adminNotes: Joi.string().trim().max(2000).optional().allow(''),
});

/**
 * PATCH /:id — general partial update.
 * All fields optional, but at least one must be present.
 */
const patchContactSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).optional(),
  email: Joi.string().email({ tlds: { allow: false } }).optional(),
  serviceOfInterest: Joi.string().valid(...SERVICE_OPTIONS).optional(),
  projectDetails: Joi.string().trim().min(10).max(2000).optional(),
  status: Joi.string().valid('new', 'in-progress', 'resolved').optional(),
  adminNotes: Joi.string().trim().max(2000).optional().allow(''),
}).min(1).messages({
  'object.min': 'At least one field must be provided for patch',
});

/**
 * Validation Schema for UUID (Prisma @default(uuid()))
 */
const idParamSchema = Joi.object({
  id: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
    'string.guid': 'Invalid contact submission ID format (must be a valid UUID)',
    'any.required': 'Contact submission ID is required',
  }),
});

/**
 * Validation Schema for Query Parameters
 */
const queryContactSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'status', 'fullName').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  status: Joi.string().valid('new', 'in-progress', 'resolved').optional(),
  startDate: Joi.string().isoDate().optional(),
  endDate: Joi.string().isoDate().optional(),
  search: Joi.string().trim().optional(),
});

// ---------------------------------------------------------------------------
// Generic middleware factory
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

/** POST /contact */
export const validateCreateContact = validate(createContactSchema, 'body');

/** PATCH /contact/:id/status */
export const validateUpdateContactStatus = validate(updateContactStatusSchema, 'body');

/** PATCH /contact/:id  — general partial update */
export const validatePatchContact = validate(patchContactSchema, 'body');

/** Any route that takes :id */
export const validateContactId = validate(idParamSchema, 'params');

/** GET /contact (query string) */
export const validateContactQuery = validate(queryContactSchema, 'query');