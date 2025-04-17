import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export const createStripeCustomer = async (email: string) => {
  const customer = await stripe.customers.create({
    email,
  });
  return customer;
};

export const createStripeCheckoutSession = async (
  user: { email: string; customerId: string },
  priceId: string
) => {
  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/success`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    customer: user.customerId,
    mode: "subscription",
  });
  return session;
};

export const cancelStripeSubscription = async (subscriptionId: string) => {
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return subscription;
};
