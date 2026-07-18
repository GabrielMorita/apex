import "server-only";
import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function billingEnabled() {
  return process.env.APEX_BILLING_ENABLED === "true";
}

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!billingEnabled() || !secretKey) throw new Error("BILLING_NOT_CONFIGURED");
  if (!stripeClient) stripeClient = new Stripe(secretKey, { maxNetworkRetries: 2, timeout: 20_000 });
  return stripeClient;
}

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_NOT_CONFIGURED");
  return secret;
}

export function appBaseUrl(requestOrigin: string) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return configured || requestOrigin.replace(/\/$/, "");
}

