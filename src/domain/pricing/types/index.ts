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
 * Update Pricing Request (PUT — full replace, all fields expected)
 */
export interface UpdatePricingRequest {
  name: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string[];
  description?: string;
  isActive: boolean;
  displayOrder: number;
}

/**
 * Patch Pricing Request (PATCH — partial update, only sent fields change)
 */
export interface PatchPricingRequest {
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