// src/domain/contact/services/contact.service.ts
import { contactRepository } from '../repositories/contact.repository';
import { AppError } from '@/shared/errors/AppError';
import {
  CreateContactRequest,
  UpdateContactStatusRequest,
  ContactQueryFilters,
  ContactResponse,
  PaginatedContactResponse,
} from '../types';

/**
 * Contact Service
 * Contains business logic for contact operations
 */
export const contactService = {
  /**
   * Create a new contact submission
   */
  createContact: async (data: CreateContactRequest): Promise<ContactResponse> => {
    // Validate email format (additional validation)
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(data.email)) {
      throw new AppError('Invalid email format', 400);
    }

    // Check for recent submissions from same email (additional spam prevention)
    const hasRecent = await contactRepository.hasRecentSubmission(data.email, 60);
    if (hasRecent) {
      throw new AppError(
        'You have already submitted a contact form recently. Please wait before submitting again.',
        429
      );
    }

    // Validate project details length
    if (data.projectDetails.length < 10) {
      throw new AppError('Project details must be at least 10 characters', 400);
    }

    const contact = await contactRepository.create(data);
    return contact.toJSON() as ContactResponse;
  },

  /**
   * Get all contact submissions with pagination
   */
  getAllContacts: async (
    filters: ContactQueryFilters
  ): Promise<PaginatedContactResponse> => {
    // Validate and set defaults
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20)); // Max 100 items per page

    // Validate date range if provided
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);

      if (start > end) {
        throw new AppError('Start date cannot be after end date', 400);
      }
    }

    const { data, total } = await contactRepository.findAll({
      ...filters,
      page,
      limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((item) => item.toJSON() as ContactResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  },

  /**
   * Get contact submission by ID
   */
  getContactById: async (id: string): Promise<ContactResponse> => {
    const contact = await contactRepository.findById(id);

    if (!contact) {
      throw new AppError('Contact submission not found', 404);
    }

    return contact.toJSON() as ContactResponse;
  },

  /**
   * Update contact submission status
   */
  updateContactStatus: async (
    id: string,
    data: UpdateContactStatusRequest,
    adminId?: string
  ): Promise<ContactResponse> => {
    // Check if contact exists
    const existingContact = await contactRepository.findById(id);

    if (!existingContact) {
      throw new AppError('Contact submission not found', 404);
    }

    // If status is being set to resolved, set resolvedBy
    if (data.status === 'resolved' && adminId) {
      data.resolvedBy = adminId;
    }

    const updatedContact = await contactRepository.updateStatus(id, data);

    if (!updatedContact) {
      throw new AppError('Failed to update contact submission', 500);
    }

    return updatedContact.toJSON() as ContactResponse;
  },

  /**
   * Delete contact submission (soft delete)
   */
  deleteContact: async (id: string): Promise<void> => {
    const contact = await contactRepository.findById(id);

    if (!contact) {
      throw new AppError('Contact submission not found', 404);
    }

    await contactRepository.softDelete(id);
  },

  /**
   * Get contact statistics
   */
  getContactStats: async (): Promise<{
    new: number;
    inProgress: number;
    resolved: number;
    total: number;
  }> => {
    return await contactRepository.getCountByStatus();
  },

  /**
   * Get contact submissions by email
   */
  getContactsByEmail: async (email: string): Promise<ContactResponse[]> => {
    const contacts = await contactRepository.findByEmail(email, 10);
    return contacts.map((contact) => contact.toJSON() as ContactResponse);
  },
};