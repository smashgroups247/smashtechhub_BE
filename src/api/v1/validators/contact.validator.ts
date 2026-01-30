// src/api/v1/validators/contact.validator.ts
import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '@/shared/utils/response.util';
import { SERVICE_OPTIONS } from '@/domain/contact/types';

/**
 * Validation Schema for Creating Contact Submission
 */
const createContactSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Full name is required',
    'string.min': 'Full name must be at least 2 characters',
    'string.max': 'Full name cannot exceed 100 characters',
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Invalid email format',
  }),
  serviceOfInterest: Joi.string()
    .valid(...SERVICE_OPTIONS)
    .required()
    .messages({
      'any.only': 'Invalid service option selected',
      'string.empty': 'Service of interest is required',
    }),
  projectDetails: Joi.string().trim().min(10).max(2000).required().messages({
    'string.empty': 'Project details are required',
    'string.min': 'Project details must be at least 10 characters',
    'string.max': 'Project details cannot exceed 2000 characters',
  }),
});

/**
 * Validation Schema for Updating Contact Status
 */
const updateContactStatusSchema = Joi.object({
  status: Joi.string().valid('new', 'in-progress', 'resolved').required().messages({
    'any.only': 'Invalid status value',
    'string.empty': 'Status is required',
  }),
  adminNotes: Joi.string().trim().max(1000).optional().allow('').messages({
    'string.max': 'Admin notes cannot exceed 1000 characters',
  }),
});

/**
 * Validation Schema for Query Parameters
 */
const queryContactSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string()
    .valid('fullName', 'email', 'status', 'createdAt', 'updatedAt')
    .default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  status: Joi.string().valid('new', 'in-progress', 'resolved').optional(),
  startDate: Joi.date().iso().optional().messages({
    'date.format': 'Invalid start date format. Use ISO 8601 format (YYYY-MM-DD)',
  }),
  endDate: Joi.date().iso().optional().messages({
    'date.format': 'Invalid end date format. Use ISO 8601 format (YYYY-MM-DD)',
  }),
  search: Joi.string().trim().max(100).optional(),
});

/**
 * Validation Schema for MongoDB ObjectId
 */
const idParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid contact submission ID format',
    'string.length': 'Invalid contact submission ID format',
    'any.required': 'Contact submission ID is required',
  }),
});

/**
 * Middleware: Validate Create Contact Request
 */
export const validateCreateContact = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = createContactSchema.validate(req.body, {
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
 * Middleware: Validate Update Contact Status Request
 */
export const validateUpdateContactStatus = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = updateContactStatusSchema.validate(req.body, {
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
export const validateContactQuery = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = queryContactSchema.validate(req.query, {
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
export const validateContactId = (
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