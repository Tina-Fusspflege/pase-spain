import Stripe from "stripe";

let client: Stripe | undefined;

/** Build-time page collection must not require payment credentials. */
export function getStripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured in this environment.");
  client = new Stripe(key);
  return client;
}
