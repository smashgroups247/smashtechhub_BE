import { Response } from 'express';

interface ResponseData {
  [key: string]: any;
}

interface ApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data?: ResponseData | ResponseData[];
}

/**
 * Send a success response
 * @param res - Express response object
 * @param statusCode - HTTP status code
 * @param message - Success message
 * @param data - Optional data to include in response
 */
export const successResponse = (
  res: Response,
  statusCode: number,
  message: string,
  data?: ResponseData | ResponseData[]
): Response => {
  const response: ApiResponse = {
    statusCode,
    success: true,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param res - Express response object
 * @param statusCode - HTTP status code
 * @param message - Error message
 * @param errors - Optional error details
 */
export const errorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: any
): Response => {
  const response: any = {
    statusCode,
    success: false,
    message,
  };

  if (errors !== undefined) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a paginated success response
 * @param res - Express response object
 * @param statusCode - HTTP status code
 * @param message - Success message
 * @param data - Data array
 * @param pagination - Pagination metadata
 */
export const paginatedResponse = (
  res: Response,
  statusCode: number,
  message: string,
  data: ResponseData[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
): Response => {
  return res.status(statusCode).json({
    statusCode,
    success: true,
    message,
    data,
    pagination,
  });
};