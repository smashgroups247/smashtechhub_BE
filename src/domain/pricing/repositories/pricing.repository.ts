// src/domain/pricing/repositories/pricing.repository.ts
import { prisma } from '../../../core/database/prisma';
import type { Pricing } from '@prisma/client';
import { Category } from '@prisma/client';
import {
  CreatePricingRequest,
  UpdatePricingRequest,
  PatchPricingRequest,
  PricingQueryFilters,
} from '../types';
import { Prisma } from '@prisma/client';

export const pricingRepository = {
  create: async (data: CreatePricingRequest): Promise<Pricing> => {
    return await prisma.pricing.create({
      data: {
        name: data.name,
        price: data.price,
        currency: data.currency ?? 'NGN',
        billingCycle: data.billingCycle ?? 'monthly',
        features: data.features,
        description: data.description ?? '',
        isActive: data.isActive !== undefined ? data.isActive : true,
        displayOrder: data.displayOrder ?? 0,
        category: data.category,
      },
    });
  },

  findAll: async (filters: PricingQueryFilters): Promise<{ data: Pricing[]; total: number }> => {
    const {
      page = 1,
      limit = 10,
      sortBy = 'displayOrder',
      sortOrder = 'asc',
      isActive,
      category,
    } = filters;

    const where: Prisma.PricingWhereInput = { deletedAt: null };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (category) {
      where.category = category;
    }

    const skip = (page - 1) * limit;

    const orderBy: Prisma.PricingOrderByWithRelationInput = {
      [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc',
    };

    const [data, total] = await Promise.all([
      prisma.pricing.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.pricing.count({ where }),
    ]);

    return { data, total };
  },

  findById: async (id: string): Promise<Pricing | null> => {
    return await prisma.pricing.findFirst({
      where: { id, deletedAt: null },
    });
  },

  findByName: async (name: string): Promise<Pricing | null> => {
    return await prisma.pricing.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null,
      },
    });
  },

  update: async (id: string, data: UpdatePricingRequest): Promise<Pricing | null> => {
    try {
      return await prisma.pricing.update({
        where: { id },
        data,
      });
    } catch {
      return null;
    }
  },

  patch: async (id: string, data: PatchPricingRequest): Promise<Pricing | null> => {
    const cleanPayload: Prisma.PricingUpdateInput = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        (cleanPayload as any)[key] = value;
      }
    }

    try {
      return await prisma.pricing.update({
        where: { id },
        data: cleanPayload,
      });
    } catch {
      return null;
    }
  },

  softDelete: async (id: string): Promise<Pricing | null> => {
    try {
      return await prisma.pricing.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch {
      return null;
    }
  },

  hardDelete: async (id: string): Promise<Pricing | null> => {
    try {
      return await prisma.pricing.delete({
        where: { id },
      });
    } catch {
      return null;
    }
  },

  existsByName: async (name: string, excludeId?: string): Promise<boolean> => {
    const where: Prisma.PricingWhereInput = {
      name: { equals: name, mode: 'insensitive' },
      deletedAt: null,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await prisma.pricing.count({ where });
    return count > 0;
  },

  findActive: async (category?: Category): Promise<Pricing[]> => {
    const where: Prisma.PricingWhereInput = { isActive: true, deletedAt: null };

    if (category) {
      where.category = category;
    }

    return await prisma.pricing.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
    });
  },

  findByCategory: async (category: Category): Promise<Pricing[]> => {
    return await prisma.pricing.findMany({
      where: { category, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });
  },

  updateDisplayOrder: async (id: string, displayOrder: number): Promise<Pricing | null> => {
    try {
      return await prisma.pricing.update({
        where: { id },
        data: { displayOrder },
      });
    } catch {
      return null;
    }
  },
};