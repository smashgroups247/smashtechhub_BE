// src/domain/pricing/types/index.ts
import { Category } from '@prisma/client';

// Re-export the Prisma enum so consumers can import from one place
export { Category };

/**
 * Pricing Plan Interface
 */
export interface IPricing {
  id?: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string[];
  description?: string;
  isActive: boolean;
  displayOrder: number;
  category: Category;
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
  currency?: string;
  billingCycle?: string;
  features: string[];
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
  category: Category;
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
  category: Category;
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
  category?: Category;
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
  category?: Category;
}

/**
 * Pricing Response
 */
export interface PricingResponse {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string[];
  description?: string;
  isActive: boolean;
  displayOrder: number;
  category: Category;
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