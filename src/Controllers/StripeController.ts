import { Request, Response } from "express";
import { UserModel } from "../Models/UserModel";
import { createStripeCheckoutSession } from "../Utils/Stripe";

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

  const session = await createStripeCheckoutSession(
    {
      email: user.email,
      customerId: user.stripeCustomerId,
    },
    priceId
  );

  res.json({ sessionId: session.id, redirectUrl: session.url });
};
