// src/tests/setup/models.ts
import { prisma } from "@/core/database/prisma";

export const ContactModel = {
  create: async (data: any) => prisma.contact.create({ data }),
  findById: async (id: string) => prisma.contact.findFirst({ where: { id } }),
  deleteMany: async () => prisma.contact.deleteMany({}),
};

export const PricingModel = {
  create: async (data: any) => prisma.pricing.create({ data }),
  findById: async (id: string) => prisma.pricing.findFirst({ where: { id } }),
  deleteMany: async () => prisma.pricing.deleteMany({}),
};
