// src/domain/contact/repositories/contact.repository.ts
import { ContactModel, IContact } from '../models/contact.model';
import { CreateContactRequest, UpdateContactStatusRequest, PatchContactRequest, ContactQueryFilters } from '../types';

/**
 * Contact Repository
 * Handles all database operations for Contact collection
 */
export const contactRepository = {
  /**
   * Create a new contact submission
   */
  create: async (data: CreateContactRequest): Promise<IContact> => {
    const contact = new ContactModel({
      ...data,
      status: 'new',
    });
    return await contact.save();
  },

  /**
   * Find all contact submissions with pagination and filters
   */
  findAll: async (filters: ContactQueryFilters): Promise<{
    data: IContact[];
    total: number;
  }> => {
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

    const query: any = { deletedAt: null };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { serviceOfInterest: { $regex: search, $options: 'i' } },
        { projectDetails: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      ContactModel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('resolvedBy', 'email firstName lastName')
        .exec(),
      ContactModel.countDocuments(query),
    ]);

    return { data, total };
  },

  /**
   * Find contact submission by ID
   */
  findById: async (id: string): Promise<IContact | null> => {
    return await ContactModel.findOne({ _id: id, deletedAt: null })
      .populate('resolvedBy', 'email firstName lastName')
      .exec();
  },

  /**
   * Update contact status (PATCH /:id/status — narrow status-only action)
   */
  updateStatus: async (
    id: string,
    data: UpdateContactStatusRequest
  ): Promise<IContact | null> => {
    const updateData: any = {
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

    return await ContactModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  },

  /**
   * Patch contact by ID (PATCH /:id — general partial update, only provided keys touch DB)
   */
  patch: async (
    id: string,
    data: PatchContactRequest
  ): Promise<IContact | null> => {
    const cleanPayload: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanPayload[key] = value;
      }
    }

    // If status is being set to resolved, auto-stamp resolvedAt
    if (cleanPayload.status === 'resolved') {
      cleanPayload.resolvedAt = new Date();
    }

    return await ContactModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: cleanPayload },
      { new: true, runValidators: true }
    ).exec();
  },

  /**
   * Soft delete contact submission by ID
   */
  softDelete: async (id: string): Promise<IContact | null> => {
    return await ContactModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    ).exec();
  },

  /**
   * Get contact submissions count by status
   */
  getCountByStatus: async (): Promise<{
    new: number;
    inProgress: number;
    resolved: number;
    total: number;
  }> => {
    const [newCount, inProgressCount, resolvedCount, total] = await Promise.all([
      ContactModel.countDocuments({ status: 'new', deletedAt: null }),
      ContactModel.countDocuments({ status: 'in-progress', deletedAt: null }),
      ContactModel.countDocuments({ status: 'resolved', deletedAt: null }),
      ContactModel.countDocuments({ deletedAt: null }),
    ]);

    return {
      new: newCount,
      inProgress: inProgressCount,
      resolved: resolvedCount,
      total,
    };
  },

  /**
   * Check if email has submitted recently (for rate limiting)
   */
  hasRecentSubmission: async (email: string, withinMinutes: number = 60): Promise<boolean> => {
    const timeAgo = new Date(Date.now() - withinMinutes * 60 * 1000);

    const count = await ContactModel.countDocuments({
      email,
      createdAt: { $gte: timeAgo },
      deletedAt: null,
    });

    return count > 0;
  },

  /**
   * Get recent submissions by email
   */
  findByEmail: async (email: string, limit: number = 5): Promise<IContact[]> => {
    return await ContactModel.find({ email, deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  },
};