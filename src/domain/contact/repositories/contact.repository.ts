// src/domain/contact/repositories/contact.repository.ts
import { prisma } from '../../../core/database/prisma';
import type { Contact } from '@prisma/client';
import { CreateContactRequest, UpdateContactStatusRequest, PatchContactRequest, ContactQueryFilters } from '../types';
import { Prisma } from '@prisma/client';

export const contactRepository = {
  create: async (data: CreateContactRequest): Promise<Contact> => {
    return await prisma.contact.create({
      data: {
        ...data,
        status: 'new',
      },
    });
  },

  findAll: async (filters: ContactQueryFilters): Promise<{ data: Contact[]; total: number }> => {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      startDate,
      endDate,
      search,
    } = filters;

    const where: Prisma.ContactWhereInput = { deletedAt: null };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { serviceOfInterest: { contains: search, mode: 'insensitive' } },
        { projectDetails: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const orderBy: Prisma.ContactOrderByWithRelationInput = {
      [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc',
    };

    const [data, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ]);

    return { data, total };
  },

  findById: async (id: string): Promise<Contact | null> => {
    return await prisma.contact.findFirst({
      where: { id, deletedAt: null },
    });
  },

  updateStatus: async (id: string, data: UpdateContactStatusRequest): Promise<Contact | null> => {
    const updateData: Prisma.ContactUpdateInput = {
      status: data.status,
    };

    if (data.adminNotes) {
      updateData.adminNotes = data.adminNotes;
    }
    if (data.resolvedBy) {
      updateData.resolvedBy = data.resolvedBy;
    }
    if (data.status === 'resolved') {
      updateData.resolvedAt = new Date();
    }

    try {
      return await prisma.contact.update({
        where: { id },
        data: updateData,
      });
    } catch {
      return null;
    }
  },

  patch: async (id: string, data: PatchContactRequest): Promise<Contact | null> => {
    const cleanPayload: Prisma.ContactUpdateInput = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        (cleanPayload as any)[key] = value;
      }
    }

    if (cleanPayload.status === 'resolved') {
      cleanPayload.resolvedAt = new Date();
    }

    try {
      return await prisma.contact.update({
        where: { id },
        data: cleanPayload,
      });
    } catch {
      return null;
    }
  },

  softDelete: async (id: string): Promise<Contact | null> => {
    try {
      return await prisma.contact.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch {
      return null;
    }
  },

  getCountByStatus: async (): Promise<{ new: number; inProgress: number; resolved: number; total: number }> => {
    const [newCount, inProgressCount, resolvedCount, total] = await Promise.all([
      prisma.contact.count({ where: { status: 'new', deletedAt: null } }),
      prisma.contact.count({ where: { status: 'in-progress', deletedAt: null } }),
      prisma.contact.count({ where: { status: 'resolved', deletedAt: null } }),
      prisma.contact.count({ where: { deletedAt: null } }),
    ]);

    return { new: newCount, inProgress: inProgressCount, resolved: resolvedCount, total };
  },

  hasRecentSubmission: async (email: string, withinMinutes: number = 60): Promise<boolean> => {
    const timeAgo = new Date(Date.now() - withinMinutes * 60 * 1000);
    const count = await prisma.contact.count({
      where: {
        email,
        createdAt: { gte: timeAgo },
        deletedAt: null,
      },
    });
    return count > 0;
  },

  findByEmail: async (email: string, limit: number = 5): Promise<Contact[]> => {
    return await prisma.contact.findMany({
      where: { email, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};