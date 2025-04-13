import { Request, Response } from "express";
import Stripe from "stripe";
import { UserModel } from "../Models/UserModel";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const createCustomCheckoutSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  const priceId = "price_1RDMI6GgXXesDmMsYQvh5rIT";

  const user = await UserModel.findById(req.user._id);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${process.env.FRONTEND_URL}/success`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    customer_email: user.email,
    metadata: {
      userId: user._id.toString(),
    },
  });
  res.json({ sessionId: session.id, redirectUrl: session.url });
};

export const handleStripeWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  const sig = req.headers["stripe-signature"];

  // Add debugging
  // console.log("-----------------------------------------:");
  // console.log("Webhook Secret:", endpointSecret);
  // console.log("Stripe Signature:", sig);
  // console.log("Request Body:", req.body);
  // console.log("-----------------------------------------:");

  try {
    if (!sig) {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    console.log("Stripe Event:", event.type);

    // Handle the event
    switch (event.type) {
      case "customer.subscription.created": {
        const session = event.data.object as Stripe.Subscription;
        console.log("Subscription Created:", session);
        // Update user's subscription status
        if (session.customer) {
          const customer = session.customer as Stripe.Customer;
          console.log("Customer:", customer);
          console.log("Customer ID:", customer.id);
          await UserModel.findOneAndUpdate(
            { stripeCustomerId: customer },
            {
              $set: {
                isPremium: true,
                premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                stripeCustomerId: session.customer,
              },
            }
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription Deleted:", subscription);
        // Handle subscription cancellation and update user's subscription status
        if (subscription.customer) {
          const customer = subscription.customer as Stripe.Customer;
          await UserModel.findOneAndUpdate(
            { stripeCustomerId: customer },
            {
              $set: {
                isPremium: false,
                premiumUntil: new Date(),
              },
            }
          );
        }
        break;
      }

      default:
        // console.log("Unhandled event type:", event.type);
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Error processing webhook:", err);
    // Add more detailed error logging
    if (err instanceof Stripe.errors.StripeSignatureVerificationError) {
      console.error("Signature verification failed:", {
        message: err.message,
        headers: err.headers,
      });
    }
    res.status(400).json({
      error: `Webhook Error: ${
        err instanceof Error ? err.message : "Unknown error"
      }`,
    });
  }
};
