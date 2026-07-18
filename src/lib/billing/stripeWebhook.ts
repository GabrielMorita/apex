import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/database.types";

type AdminClient = ReturnType<typeof createAdminClient>;
type SubscriptionInsert = Database["public"]["Tables"]["billing_subscriptions"]["Insert"];
type InvoiceInsert = Database["public"]["Tables"]["billing_invoices"]["Insert"];

function isoTimestamp(value: number | null | undefined) {
  return typeof value === "number" ? new Date(value * 1000).toISOString() : null;
}

function objectId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function safeMetadata(value: Stripe.Metadata | null | undefined): Json {
  if (!value) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

async function beginEvent(admin: AdminClient, event: Stripe.Event) {
  const { data: existing, error: existingError } = await admin.from("billing_webhook_events").select("id,processing_status,attempts").eq("provider", "stripe").eq("provider_event_id", event.id).maybeSingle();
  if (existingError) throw existingError;
  if (existing?.processing_status === "processed") return false;
  if (existing) {
    const { error } = await admin.from("billing_webhook_events").update({ processing_status: "processing", attempts: Math.min(existing.attempts + 1, 100), last_error: null }).eq("id", existing.id);
    if (error) throw error;
    return true;
  }
  const { error } = await admin.from("billing_webhook_events").insert({
    provider: "stripe",
    provider_event_id: event.id,
    event_type: event.type,
    processing_status: "processing",
    event_metadata: { api_version: event.api_version ?? null, livemode: event.livemode },
  });
  if (error?.code === "23505") return false;
  if (error) throw error;
  return true;
}

async function finishEvent(admin: AdminClient, event: Stripe.Event, userId: string | null) {
  const { error } = await admin.from("billing_webhook_events").update({ processing_status: "processed", processed_at: new Date().toISOString(), user_id: userId, last_error: null }).eq("provider", "stripe").eq("provider_event_id", event.id);
  if (error) throw error;
}

async function failEvent(admin: AdminClient, event: Stripe.Event, error: unknown) {
  const message = error instanceof Error ? error.message : "Webhook processing failed";
  await admin.from("billing_webhook_events").update({ processing_status: "failed", last_error: message.slice(0, 1000) }).eq("provider", "stripe").eq("provider_event_id", event.id);
}

async function userForCustomer(admin: AdminClient, customerId: string | null) {
  if (!customerId) return null;
  const { data, error } = await admin.from("billing_customers").select("user_id").eq("provider", "stripe").eq("provider_customer_id", customerId).maybeSingle();
  if (error) throw error;
  return data?.user_id ?? null;
}

async function planForSubscription(admin: AdminClient, subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id ?? null;
  const planCode = subscription.metadata.apex_plan_code;
  let query = admin.from("billing_plans").select("id,code");
  query = planCode ? query.eq("code", planCode) : query.eq("provider", "stripe").eq("provider_price_id", priceId ?? "");
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("BILLING_PLAN_NOT_FOUND");
  return { planId: data.id, planCode: data.code, priceId };
}

async function syncCustomer(admin: AdminClient, userId: string, customerId: string, email: string | null) {
  const { error } = await admin.from("billing_customers").upsert({
    user_id: userId,
    provider: "stripe",
    provider_customer_id: customerId,
    email_snapshot: email,
  }, { onConflict: "user_id,provider" });
  if (error) throw error;
}

async function syncSubscription(admin: AdminClient, subscription: Stripe.Subscription) {
  const customerId = objectId(subscription.customer);
  const userId = subscription.metadata.apex_user_id || await userForCustomer(admin, customerId);
  if (!userId || !customerId) throw new Error("BILLING_USER_NOT_FOUND");
  const plan = await planForSubscription(admin, subscription);
  const periodItem = subscription.items.data[0];
  const payload: SubscriptionInsert = {
    user_id: userId,
    plan_id: plan.planId,
    provider: "stripe",
    provider_subscription_id: subscription.id,
    provider_price_id: plan.priceId,
    status: subscription.status,
    current_period_start: isoTimestamp(periodItem?.current_period_start),
    current_period_end: isoTimestamp(periodItem?.current_period_end),
    trial_start: isoTimestamp(subscription.trial_start),
    trial_end: isoTimestamp(subscription.trial_end),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: isoTimestamp(subscription.canceled_at),
    ended_at: isoTimestamp(subscription.ended_at),
    metadata: safeMetadata(subscription.metadata),
  };
  const { error } = await admin.from("billing_subscriptions").upsert(payload, { onConflict: "provider,provider_subscription_id" });
  if (error) throw error;
  return userId;
}

async function notifyTrialWillEnd(admin: AdminClient, userId: string, subscription: Stripe.Subscription) {
  const trialEnd = isoTimestamp(subscription.trial_end);
  if (!trialEnd) return;
  const trialEndLabel = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(trialEnd));
  const { error } = await admin.from("notifications").upsert({
    user_id: userId,
    kind: "system",
    title: "Seu teste gratuito termina em breve",
    body: `Seu período gratuito termina em ${trialEndLabel}. Cancele antes dessa data se não quiser iniciar a cobrança.`,
    action_destination: "configuracoes",
    source_type: "system",
    scheduled_for: new Date().toISOString(),
    expires_at: trialEnd,
    dedupe_key: `billing-trial-ending:${subscription.id}`,
    payload: { subscription_id: subscription.id, trial_end: trialEnd },
  }, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true });
  if (error) throw error;
}

async function syncCheckout(admin: AdminClient, stripe: Stripe, session: Stripe.Checkout.Session, completed: boolean) {
  const userId = session.client_reference_id || session.metadata?.apex_user_id || null;
  const customerId = objectId(session.customer);
  if (completed && (!userId || !customerId)) throw new Error("BILLING_CHECKOUT_IDENTITY_MISSING");
  if (userId && customerId) await syncCustomer(admin, userId, customerId, session.customer_details?.email ?? session.customer_email ?? null);
  const { error } = await admin.from("billing_checkout_attempts").update({
    status: completed ? "completed" : "expired",
    completed_at: completed ? new Date().toISOString() : null,
  }).eq("provider", "stripe").eq("provider_checkout_id", session.id);
  if (error) throw error;
  if (completed) {
    const subscriptionId = objectId(session.subscription);
    if (subscriptionId) await syncSubscription(admin, await stripe.subscriptions.retrieve(subscriptionId));
  }
  return userId;
}

function invoiceStatus(invoice: Stripe.Invoice, eventType: string): InvoiceInsert["status"] {
  if (eventType === "invoice.payment_failed") return "failed";
  return invoice.status ?? "draft";
}

async function syncInvoice(admin: AdminClient, invoice: Stripe.Invoice, eventType: string) {
  const customerId = objectId(invoice.customer);
  const subscriptionRef = invoice.parent?.subscription_details?.subscription;
  const providerSubscriptionId = objectId(subscriptionRef);
  let userId = await userForCustomer(admin, customerId);
  let subscriptionId: string | null = null;
  if (providerSubscriptionId) {
    const { data, error } = await admin.from("billing_subscriptions").select("id,user_id").eq("provider", "stripe").eq("provider_subscription_id", providerSubscriptionId).maybeSingle();
    if (error) throw error;
    subscriptionId = data?.id ?? null;
    userId = data?.user_id ?? userId;
  }
  if (!userId) throw new Error("BILLING_INVOICE_USER_NOT_FOUND");
  const payload: InvoiceInsert = {
    user_id: userId,
    subscription_id: subscriptionId,
    provider: "stripe",
    provider_invoice_id: invoice.id,
    status: invoiceStatus(invoice, eventType),
    currency: invoice.currency,
    amount_due: invoice.amount_due,
    amount_paid: invoice.amount_paid,
    hosted_invoice_url: invoice.hosted_invoice_url ?? null,
    invoice_pdf_url: invoice.invoice_pdf ?? null,
    due_at: isoTimestamp(invoice.due_date),
    paid_at: isoTimestamp(invoice.status_transitions.paid_at),
  };
  const { error } = await admin.from("billing_invoices").upsert(payload, { onConflict: "provider,provider_invoice_id" });
  if (error) throw error;
  return userId;
}

export async function processStripeEvent(stripe: Stripe, event: Stripe.Event) {
  const admin = createAdminClient();
  if (!await beginEvent(admin, event)) return { duplicate: true };
  let userId: string | null = null;
  try {
    switch (event.type) {
      case "checkout.session.completed":
        userId = await syncCheckout(admin, stripe, event.data.object, true);
        break;
      case "checkout.session.expired":
        userId = await syncCheckout(admin, stripe, event.data.object, false);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        userId = await syncSubscription(admin, event.data.object);
        break;
      case "customer.subscription.trial_will_end":
        userId = await syncSubscription(admin, event.data.object);
        await notifyTrialWillEnd(admin, userId, event.data.object);
        break;
      case "invoice.created":
      case "invoice.finalized":
      case "invoice.paid":
      case "invoice.payment_failed":
      case "invoice.voided":
      case "invoice.marked_uncollectible":
        userId = await syncInvoice(admin, event.data.object, event.type);
        break;
      default:
        break;
    }
    await finishEvent(admin, event, userId);
    return { duplicate: false };
  } catch (error) {
    await failEvent(admin, event, error);
    throw error;
  }
}
