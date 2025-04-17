import express from "express";
import {
  cancelSubscription,
  createCustomCheckoutSession,
} from "../Controllers/StripeController";
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_token:
 *                 type: string
 *                 description: Google ID token from mobile client
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   description: The ID of the created checkout session
 *                 redirectUrl:
 *                   type: string
 *                   description: The URL to redirect to after checkout
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

/**
 * @swagger
 * /api/stripe/cancel-subscription:
 *   post:
 *     summary: Cancel a Stripe subscription
 *     tags: [Stripe]
 *     security:
 *       - sessionAuth: []
 *       - idTokenAuth: []
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post("/cancel-subscription", isAuthenticated, cancelSubscription);

export default router;
