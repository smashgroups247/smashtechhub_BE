// src/api/v1/routes/pricing.routes.ts
import { Router } from 'express';
import { pricingController } from '../controllers/pricing.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/admin.middleware';
import {
  validateCreatePricing,
  validateUpdatePricing,
  validatePricingQuery,
  validatePricingId,
} from '../validators/pricing.validator';

export const pricingRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Pricing
 *   description: Pricing plans management endpoints
 */

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
 *                 example: NGN
 *               billingCycle:
 *                 type: string
 *                 enum: [monthly, yearly, one-time]
 *                 default: monthly
 *                 example: monthly
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Unlimited QRA codes", "Priority Support", "Analytics Dashboard"]
 *               description:
 *                 type: string
 *                 example: Perfect for growing businesses
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               displayOrder:
 *                 type: number
 *                 default: 0
 *                 example: 2
 *     responses:
 *       201:
 *         description: Pricing plan created successfully
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
 *                   example: Pricing plan created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Pricing'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
pricingRouter.post(
  '/',
  authenticate,
  isAdmin,
  validateCreatePricing,
  pricingController.createPricing
);

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
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, displayOrder, createdAt, updatedAt]
 *           default: displayOrder
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Pricing plans retrieved successfully
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
 *                   example: Pricing plans retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pricing'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     total:
 *                       type: number
 *                     totalPages:
 *                       type: number
 */
pricingRouter.get(
  '/',
  validatePricingQuery,
  pricingController.getAllPricing
);

/**
 * @swagger
 * /api/v1/pricing/active:
 *   get:
 *     summary: Get only active pricing plans
 *     tags: [Pricing]
 *     responses:
 *       200:
 *         description: Active pricing plans retrieved successfully
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
 *                   example: Active pricing plans retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pricing'
 */
pricingRouter.get(
  '/active',
  pricingController.getActivePricing
);

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
 *         description: Pricing plan ID
 *     responses:
 *       200:
 *         description: Pricing plan retrieved successfully
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
 *                   example: Pricing plan retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Pricing'
 *       404:
 *         description: Pricing plan not found
 */
pricingRouter.get(
  '/:id',
  validatePricingId,
  pricingController.getPricingById
);

/**
 * @swagger
 * /api/v1/pricing/{id}:
 *   put:
 *     summary: Update pricing plan
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pricing plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *     responses:
 *       200:
 *         description: Pricing plan updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Pricing plan not found
 */
pricingRouter.put(
  '/:id',
  authenticate,
  isAdmin,
  validatePricingId,
  validateUpdatePricing,
  pricingController.updatePricing
);

/**
 * @swagger
 * /api/v1/pricing/{id}:
 *   delete:
 *     summary: Delete pricing plan (soft delete)
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pricing plan ID
 *     responses:
 *       200:
 *         description: Pricing plan deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
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

/**
 * @swagger
 * /api/v1/pricing/{id}/toggle-status:
 *   patch:
 *     summary: Toggle pricing plan active status
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pricing plan ID
 *     responses:
 *       200:
 *         description: Pricing plan status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
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

/**
 * @swagger
 * components:
 *   schemas:
 *     Pricing:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         name:
 *           type: string
 *           example: Professional Plan
 *         price:
 *           type: number
 *           example: 350000
 *         currency:
 *           type: string
 *           example: NGN
 *         billingCycle:
 *           type: string
 *           example: monthly
 *         features:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Unlimited QRA codes", "Priority Support"]
 *         description:
 *           type: string
 *           example: Perfect for growing businesses
 *         isActive:
 *           type: boolean
 *           example: true
 *         displayOrder:
 *           type: number
 *           example: 2
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */