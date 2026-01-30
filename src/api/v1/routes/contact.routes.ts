// src/api/v1/routes/contact.routes.ts
import { Router } from 'express';
import { contactController } from '../controllers/contact.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/admin.middleware';
import { contactRateLimiter } from '../middlewares/rateLimit.middleware';
import {
  validateCreateContact,
  validateUpdateContactStatus,
  validateContactQuery,
  validateContactId,
} from '../validators/contact.validator';

export const contactRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Contact form submissions management endpoints
 */

/**
 * @swagger
 * /api/v1/contact:
 *   post:
 *     summary: Submit contact form
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - serviceOfInterest
 *               - projectDetails
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               serviceOfInterest:
 *                 type: string
 *                 enum: [Web Development, Mobile App Development, UI/UX Design, Digital Marketing, E-commerce Solutions, Custom Software, Consulting, Other]
 *                 example: Web Development
 *               projectDetails:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *                 example: I need a custom e-commerce website with payment integration
 *     responses:
 *       201:
 *         description: Contact form submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: number
 *                   example: 201
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Contact form submitted successfully. We'll get back to you soon!
 *                 data:
 *                   $ref: '#/components/schemas/Contact'
 *       400:
 *         description: Validation error
 *       429:
 *         description: Too many requests (rate limit exceeded)
 */
contactRouter.post(
  '/',
  contactRateLimiter,
  validateCreateContact,
  contactController.createContact
);

/**
 * @swagger
 * /api/v1/contact:
 *   get:
 *     summary: Get all contact submissions with pagination
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [fullName, email, status, createdAt, updatedAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, in-progress, resolved]
 *         description: Filter by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (ISO 8601 format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (ISO 8601 format)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name, email, service, or project details
 *     responses:
 *       200:
 *         description: Contact submissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Contact submissions retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contact'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
contactRouter.get(
  '/',
  authenticate,
  isAdmin,
  validateContactQuery,
  contactController.getAllContacts
);

/**
 * @swagger
 * /api/v1/contact/stats:
 *   get:
 *     summary: Get contact submissions statistics
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contact statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Contact statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     new:
 *                       type: number
 *                       example: 25
 *                     inProgress:
 *                       type: number
 *                       example: 10
 *                     resolved:
 *                       type: number
 *                       example: 50
 *                     total:
 *                       type: number
 *                       example: 85
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
contactRouter.get(
  '/stats',
  authenticate,
  isAdmin,
  contactController.getContactStats
);

/**
 * @swagger
 * /api/v1/contact/{id}:
 *   get:
 *     summary: Get contact submission by ID
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact submission ID
 *     responses:
 *       200:
 *         description: Contact submission retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Contact submission not found
 */
contactRouter.get(
  '/:id',
  authenticate,
  isAdmin,
  validateContactId,
  contactController.getContactById
);

/**
 * @swagger
 * /api/v1/contact/{id}/status:
 *   patch:
 *     summary: Update contact submission status
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [new, in-progress, resolved]
 *                 example: in-progress
 *               adminNotes:
 *                 type: string
 *                 maxLength: 1000
 *                 example: Contacted customer via email
 *     responses:
 *       200:
 *         description: Contact submission status updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Contact submission not found
 */
contactRouter.patch(
  '/:id/status',
  authenticate,
  isAdmin,
  validateContactId,
  validateUpdateContactStatus,
  contactController.updateContactStatus
);

/**
 * @swagger
 * /api/v1/contact/{id}:
 *   delete:
 *     summary: Delete contact submission (soft delete)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact submission ID
 *     responses:
 *       200:
 *         description: Contact submission deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Contact submission not found
 */
contactRouter.delete(
  '/:id',
  authenticate,
  isAdmin,
  validateContactId,
  contactController.deleteContact
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Contact:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439013
 *         fullName:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           example: john@example.com
 *         serviceOfInterest:
 *           type: string
 *           example: Web Development
 *         projectDetails:
 *           type: string
 *           example: I need a custom e-commerce website
 *         status:
 *           type: string
 *           enum: [new, in-progress, resolved]
 *           example: new
 *         adminNotes:
 *           type: string
 *           example: Contacted customer via email
 *         resolvedBy:
 *           type: string
 *           example: 507f1f77bcf86cd799439014
 *         resolvedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: number
 *           example: 1
 *         limit:
 *           type: number
 *           example: 20
 *         total:
 *           type: number
 *           example: 45
 *         totalPages:
 *           type: number
 *           example: 3
 */