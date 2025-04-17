import { Request, Response } from "express";
import { UserModel } from "../Models/UserModel";
import {
  createStripeCheckoutSession,
  cancelStripeSubscription,
} from "../Utils/Stripe";

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

  if (user.isPremium) {
    res.status(400).json({ error: "User already has a premium subscription" });
    return;
  }

  const session = await createStripeCheckoutSession(
    {
      email: user.email,
      customerId: user.stripeCustomerId,
    },
    priceId
  );

  res.json({ sessionId: session.id, redirectUrl: session.url });
};

export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findById(req.user._id);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const subscription = await cancelStripeSubscription(
      user.stripeSubscriptionId
    );

    if (subscription.status === "canceled") {
      user.updateOne({
        $set: {
          isPremium: false,
        },
      });
    }

    res.json({ message: "Subscription cancelled" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
