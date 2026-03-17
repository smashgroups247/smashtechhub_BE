// src/api/v1/routes/contact.routes.ts
import { Router } from "express";
import { contactController } from "../controllers/contact.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/admin.middleware";
import { contactRateLimiter } from "../middlewares/rateLimit.middleware";
import {
  validateCreateContact,
  validateUpdateContactStatus,
  validatePatchContact,
  validateContactId,
  validateContactQuery,
} from "../validators/contact.validator";

export const contactRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Contact Us endpoints
 */

// ─── POST /contact ────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/contact:
 *   post:
 *     summary: Submit a contact form
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
 *               projectDetails:
 *                 type: string
 *                 example: We need a full-stack e-commerce platform built with React and Node.js
 *     responses:
 *       201:
 *         description: Contact form submitted successfully
 *       400:
 *         description: Validation error
 *       429:
 *         description: Rate limited – recent submission exists
 */
contactRouter.post(
  "/",
  validateCreateContact,
  contactRateLimiter,
  contactController.createContact,
);

// ─── GET /contact/stats ───────────────────────────────────────────────────────
// NOTE: /stats must come BEFORE /:id so Express doesn't treat "stats" as an id.
/**
 * @swagger
 * /api/v1/contact/stats:
 *   get:
 *     summary: Get contact submission counts by status
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
 *                 new:
 *                   type: number
 *                 inProgress:
 *                   type: number
 *                 resolved:
 *                   type: number
 *                 total:
 *                   type: number
 */
contactRouter.get(
  "/stats",
  authenticate,
  isAdmin,
  contactController.getContactStats,
);

// ─── GET /contact/email/:email ────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/contact/email/{email}:
 *   get:
 *     summary: Get all submissions from a specific email address
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *     responses:
 *       200:
 *         description: Contact submissions retrieved successfully
 */
contactRouter.get(
  "/email/:email",
  authenticate,
  isAdmin,
  contactController.getContactsByEmail,
);

// ─── GET /contact ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/contact:
 *   get:
 *     summary: Get all contact submissions with pagination & filters
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, status, fullName]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, in-progress, resolved]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contact submissions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
contactRouter.get(
  "/",
  authenticate,
  isAdmin,
  validateContactQuery,
  contactController.getAllContacts,
);

// ─── GET /contact/:id ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/contact/{id}:
 *   get:
 *     summary: Get a single contact submission by ID
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contact submission retrieved successfully
 *       404:
 *         description: Not found
 */
contactRouter.get(
  "/:id",
  authenticate,
  isAdmin,
  validateContactId,
  contactController.getContactById,
);

// ─── PATCH /contact/:id/status ────────────────────────────────────────────────
// NOTE: /status sub-route must come BEFORE the bare /:id PATCH so Express
// matches the longer path first.
/**
 * @swagger
 * /api/v1/contact/{id}/status:
 *   patch:
 *     summary: Update contact status (narrow action – status + optional notes)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contact status updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Not found
 */
contactRouter.patch(
  "/:id/status",
  authenticate,
  isAdmin,
  validateContactId,
  validateUpdateContactStatus,
  contactController.updateContactStatus,
);

// ─── PATCH /contact/:id ───────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/contact/{id}:
 *   patch:
 *     summary: Partially update a contact submission (only sent fields change)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               serviceOfInterest:
 *                 type: string
 *                 enum: [Web Development, Mobile App Development, UI/UX Design, Digital Marketing, E-commerce Solutions, Custom Software, Consulting, Other]
 *               projectDetails:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [new, in-progress, resolved]
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contact submission patched successfully
 *       400:
 *         description: Validation error or empty body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
contactRouter.patch(
  "/:id",
  authenticate,
  isAdmin,
  validateContactId,
  validatePatchContact,
  contactController.patchContact,
);

// ─── DELETE /contact/:id ──────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/contact/{id}:
 *   delete:
 *     summary: Soft-delete a contact submission
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contact submission deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
contactRouter.delete(
  "/:id",
  authenticate,
  isAdmin,
  validateContactId,
  contactController.deleteContact,
);
