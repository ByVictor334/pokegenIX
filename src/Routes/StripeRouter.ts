import express from "express";
import { createCustomCheckoutSession } from "../Controllers/StripeController";
import isAuthenticated from "../Middlewares/AuthMiddleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Stripe
 *   description: Stripe payment processing endpoints
 */

/**
 * @swagger
 * /api/stripe/create-checkout-session:
 *   post:
 *     summary: Create a Stripe checkout session
 *     tags: [Stripe]
 *     description: Creates a new Stripe checkout session for premium subscription purchase
 *     security:
 *       - sessionAuth: []
 *       - idTokenAuth: []
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:

 *       401:
 *         description: User not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post(
  "/create-checkout-session",
  isAuthenticated,
  createCustomCheckoutSession
);

export default router;
