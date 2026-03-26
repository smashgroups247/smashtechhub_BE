// src/api/v1/routes/pricing.routes.ts
import { Router } from 'express';
import { pricingController } from '../controllers/pricing.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/admin.middleware';
import {
  validateCreatePricing,
  validatePutPricing,
  validatePatchPricing,
  validatePricingQuery,
  validatePricingId,
  validateCategoryParam,
} from '../validators/pricing.validator';

export const pricingRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Pricing
 *   description: Pricing plans management endpoints
 */

// ─── POST /pricing ────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/pricing:
 *   post:
 *     summary: Create a new pricing plan
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - features
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 example: Professional Plan
 *               price:
 *                 type: number
 *                 example: 350000
 *               currency:
 *                 type: string
 *                 enum: [NGN, USD, EUR, GBP]
 *                 default: NGN
 *               billingCycle:
 *                 type: string
 *                 enum: [monthly, yearly, one-time]
 *                 default: monthly
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Unlimited QRA codes", "Priority Support"]
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               displayOrder:
 *                 type: number
 *                 default: 0
 *               category:
 *                 type: string
 *                 enum: [WEBSITE, WEB_APP, MOBILE_APP, BRANDING]
 *                 example: WEBSITE
 *     responses:
 *       201:
 *         description: Pricing plan created successfully
 *       400:
 *         description: Validation error or duplicate name
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – admin access required
 */
pricingRouter.post(
  '/',
  authenticate,
  isAdmin,
  validateCreatePricing,
  pricingController.createPricing
);

// ─── GET /pricing ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/pricing:
 *   get:
 *     summary: Get all pricing plans with pagination
 *     tags: [Pricing]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, displayOrder, createdAt, updatedAt]
 *           default: displayOrder
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [WEBSITE, WEB_APP, MOBILE_APP, BRANDING]
 *     responses:
 *       200:
 *         description: Pricing plans retrieved successfully
 */
pricingRouter.get(
  '/',
  validatePricingQuery,
  pricingController.getAllPricing
);

// ─── GET /pricing/active ──────────────────────────────────────────────────────
// NOTE: Static paths (/active, /category/:category) MUST be registered before
// the dynamic /:id route so Express doesn't treat "active" as an id.
/**
 * @swagger
 * /api/v1/pricing/active:
 *   get:
 *     summary: Get only active pricing plans (no pagination – lightweight list)
 *     tags: [Pricing]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [WEBSITE, WEB_APP, MOBILE_APP, BRANDING]
 *     responses:
 *       200:
 *         description: Active pricing plans retrieved successfully
 */
pricingRouter.get(
  '/active',
  pricingController.getActivePricing
);

// ─── GET /pricing/category/:category ─────────────────────────────────────────
/**
 * @swagger
 * /api/v1/pricing/category/{category}:
 *   get:
 *     summary: Get all plans in a specific category
 *     tags: [Pricing]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [WEBSITE, WEB_APP, MOBILE_APP, BRANDING]
 *     responses:
 *       200:
 *         description: Pricing plans retrieved successfully
 *       400:
 *         description: Invalid category value
 */
pricingRouter.get(
  '/category/:category',
  validateCategoryParam,
  pricingController.getPricingByCategory
);

// ─── GET /pricing/:id ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/pricing/{id}:
 *   get:
 *     summary: Get pricing plan by ID
 *     tags: [Pricing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the pricing plan
 *     responses:
 *       200:
 *         description: Pricing plan retrieved successfully
 *       404:
 *         description: Pricing plan not found
 */
pricingRouter.get(
  '/:id',
  validatePricingId,
  pricingController.getPricingById
);

// ─── PUT /pricing/:id ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/pricing/{id}:
 *   put:
 *     summary: Full-replace a pricing plan (all fields required)
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - currency
 *               - billingCycle
 *               - features
 *               - description
 *               - isActive
 *               - displayOrder
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *                 enum: [NGN, USD, EUR, GBP]
 *               billingCycle:
 *                 type: string
 *                 enum: [monthly, yearly, one-time]
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               displayOrder:
 *                 type: number
 *               category:
 *                 type: string
 *                 enum: [WEBSITE, WEB_APP, MOBILE_APP, BRANDING]
 *     responses:
 *       200:
 *         description: Pricing plan updated successfully
 *       400:
 *         description: Validation error – missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – admin access required
 *       404:
 *         description: Pricing plan not found
 */
pricingRouter.put(
  '/:id',
  authenticate,
  isAdmin,
  validatePricingId,
  validatePutPricing,
  pricingController.updatePricing
);

// ─── PATCH /pricing/:id/toggle-status ────────────────────────────────────────
// NOTE: Must be registered BEFORE the bare /:id PATCH so Express matches the
// longer path first.
/**
 * @swagger
 * /api/v1/pricing/{id}/toggle-status:
 *   patch:
 *     summary: Toggle pricing plan isActive flag (no body required)
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pricing plan status toggled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – admin access required
 *       404:
 *         description: Pricing plan not found
 */
pricingRouter.patch(
  '/:id/toggle-status',
  authenticate,
  isAdmin,
  validatePricingId,
  pricingController.togglePricingStatus
);

// ─── PATCH /pricing/:id ───────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/pricing/{id}:
 *   patch:
 *     summary: Partially update a pricing plan (only sent fields change)
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *                 enum: [NGN, USD, EUR, GBP]
 *               billingCycle:
 *                 type: string
 *                 enum: [monthly, yearly, one-time]
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               displayOrder:
 *                 type: number
 *               category:
 *                 type: string
 *                 enum: [WEBSITE, WEB_APP, MOBILE_APP, BRANDING]
 *     responses:
 *       200:
 *         description: Pricing plan patched successfully
 *       400:
 *         description: Validation error or empty body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – admin access required
 *       404:
 *         description: Pricing plan not found
 */
pricingRouter.patch(
  '/:id',
  authenticate,
  isAdmin,
  validatePricingId,
  validatePatchPricing,
  pricingController.patchPricing
);

// ─── DELETE /pricing/:id ──────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/pricing/{id}:
 *   delete:
 *     summary: Soft-delete a pricing plan
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pricing plan deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – admin access required
 *       404:
 *         description: Pricing plan not found
 */
pricingRouter.delete(
  '/:id',
  authenticate,
  isAdmin,
  validatePricingId,
  pricingController.deletePricing
);

// ─── Swagger component schema ─────────────────────────────────────────────────
/**
 * @swagger
 * components:
 *   schemas:
 *     Pricing:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: 550e8400-e29b-41d4-a716-446655440000
 *         name:
 *           type: string
 *         price:
 *           type: number
 *         currency:
 *           type: string
 *         billingCycle:
 *           type: string
 *         features:
 *           type: array
 *           items:
 *             type: string
 *         description:
 *           type: string
 *         isActive:
 *           type: boolean
 *         displayOrder:
 *           type: number
 *         category:
 *           type: string
 *           enum: [WEBSITE, WEB_APP, MOBILE_APP, BRANDING]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */