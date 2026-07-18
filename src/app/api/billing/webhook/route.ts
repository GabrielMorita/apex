import { NextResponse, type NextRequest } from "next/server";
import { getStripe, getStripeWebhookSecret } from "@/lib/billing/stripe";
import { processStripeEvent } from "@/lib/billing/stripeWebhook";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "MISSING_SIGNATURE" }, { status: 400 });
  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(await request.text(), signature, getStripeWebhookSecret());
    const result = await processStripeEvent(stripe, event);
    return NextResponse.json({ received: true, duplicate: result.duplicate });
  } catch (error) {
    const message = error instanceof Error ? error.message : "WEBHOOK_FAILED";
    const invalid = message.toLowerCase().includes("signature") || message.includes("MISSING_SIGNATURE");
    return NextResponse.json({ error: invalid ? "INVALID_SIGNATURE" : "WEBHOOK_PROCESSING_FAILED" }, { status: invalid ? 400 : 500 });
  }
}

