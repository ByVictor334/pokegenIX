import express from "express";
import { handleStripeWebhook } from "../Controllers/WebHookController";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: WebHook
 *   description: WebHook endpoints
 */

/**
 * @swagger
 * /api/webhook:
 *   post:
 *     summary: Handle Stripe webhook events
 *     tags: [WebHook]
 *     description: Processes various Stripe webhook events for payment and subscription management
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature or payload
 *       500:
 *         description: Server error
 */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

export default router;
