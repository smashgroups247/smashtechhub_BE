// src/domain/pricing/types/index.ts

/**
 * Pricing Plan Interface
 */
export interface IPricing {
  _id?: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string[];
  description?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

/**
 * Create Pricing Request
 */
export interface CreatePricingRequest {
  name: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string[];
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
}

/**
 * Update Pricing Request
 */
export interface UpdatePricingRequest {
  name?: string;
  price?: number;
  currency?: string;
  billingCycle?: string;
  features?: string[];
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
}

/**
 * Pricing Query Filters
 */
export interface PricingQueryFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
}

/**
 * Pricing Response
 */
export interface PricingResponse {
  _id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string[];
  description?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Paginated Pricing Response
 */
export interface PaginatedPricingResponse {
  data: PricingResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}