// src/api/v1/controllers/contact.controller.ts
import { Request, Response, NextFunction } from 'express';
import { contactService } from '@/domain/contact/services/contact.service';
import { successResponse } from '@/shared/utils/response.util';
import { CreateContactRequest, UpdateContactStatusRequest, ContactQueryFilters } from '@/domain/contact/types';

/**
 * Contact Controller
 * Handles HTTP requests for contact endpoints
 */
export const contactController = {
  /**
   * Submit contact form
   * POST /api/v1/contact
   * @access Public (with rate limiting)
   */
  createContact: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: CreateContactRequest = req.body;
      
      const contact = await contactService.createContact(data);
      
      return successResponse(
        res,
        201,
        "Contact form submitted successfully. We'll get back to you soon!",
        contact
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all contact submissions with pagination
   * GET /api/v1/contact
   * @access Admin
   */
  getAllContacts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: ContactQueryFilters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        status: req.query.status as 'new' | 'in-progress' | 'resolved',
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        search: req.query.search as string,
      };

      const result = await contactService.getAllContacts(filters);
      
      return res.status(200).json({
        statusCode: 200,
        success: true,
        message: 'Contact submissions retrieved successfully',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single contact submission by ID
   * GET /api/v1/contact/:id
   * @access Admin
   */
  getContactById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      const contact = await contactService.getContactById(id);
      
      return successResponse(
        res,
        200,
        'Contact submission retrieved successfully',
        contact
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update contact submission status
   * PATCH /api/v1/contact/:id/status
   * @access Admin
   */
  updateContactStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data: UpdateContactStatusRequest = req.body;
      const adminId = req.user?.id; // Get admin ID from authenticated user
      
      const contact = await contactService.updateContactStatus(id, data, adminId);
      
      return successResponse(
        res,
        200,
        'Contact submission status updated successfully',
        contact
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete contact submission (soft delete)
   * DELETE /api/v1/contact/:id
   * @access Admin
   */
  deleteContact: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      await contactService.deleteContact(id);
      
      return successResponse(
        res,
        200,
        'Contact submission deleted successfully'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get contact statistics
   * GET /api/v1/contact/stats
   * @access Admin
   */
  getContactStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await contactService.getContactStats();
      
      return successResponse(
        res,
        200,
        'Contact statistics retrieved successfully',
        stats
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get contact submissions by email
   * GET /api/v1/contact/email/:email
   * @access Admin
   */
  getContactsByEmail: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.params;
      
      const contacts = await contactService.getContactsByEmail(email);
      
      return successResponse(
        res,
        200,
        'Contact submissions retrieved successfully',
        contacts
      );
    } catch (error) {
      next(error);
    }
  },
};