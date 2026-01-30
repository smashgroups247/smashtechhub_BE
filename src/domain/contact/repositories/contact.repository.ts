// src/domain/contact/repositories/contact.repository.ts
import { ContactModel, IContactDocument } from '../models/contact.model';
import { CreateContactRequest, UpdateContactStatusRequest, ContactQueryFilters } from '../types';

/**
 * Contact Repository
 * Handles all database operations for Contact collection
 */
export const contactRepository = {
  /**
   * Create a new contact submission
   */
  create: async (data: CreateContactRequest): Promise<IContactDocument> => {
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
    data: IContactDocument[];
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

    // Build query
    const query: any = { deletedAt: null };
    
    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Search in fullName, email, serviceOfInterest, projectDetails
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { serviceOfInterest: { $regex: search, $options: 'i' } },
        { projectDetails: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const [data, total] = await Promise.all([
      ContactModel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('resolvedBy', 'email firstName lastName')
        .lean()
        .exec(),
      ContactModel.countDocuments(query),
    ]);

    return { data: data as IContactDocument[], total };
  },

  /**
   * Find contact submission by ID
   */
  findById: async (id: string): Promise<IContactDocument | null> => {
    return await ContactModel.findOne({ _id: id, deletedAt: null })
      .populate('resolvedBy', 'email firstName lastName')
      .exec();
  },

  /**
   * Update contact status
   */
  updateStatus: async (
    id: string,
    data: UpdateContactStatusRequest
  ): Promise<IContactDocument | null> => {
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
   * Soft delete contact submission by ID
   */
  softDelete: async (id: string): Promise<IContactDocument | null> => {
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
  findByEmail: async (email: string, limit: number = 5): Promise<IContactDocument[]> => {
    return await ContactModel.find({ email, deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  },
};