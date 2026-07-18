import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";
import type { BillingAccess, BillingInvoice, BillingPlan, BillingState, BillingSubscription } from "@/lib/billing/types";

function stringArray(value: Json): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export async function loadBillingState(userId: string): Promise<BillingState> {
  const supabase = createClient();
  const [accessResult, plansResult, subscriptionsResult, invoicesResult, customerResult] = await Promise.all([
    supabase.rpc("my_billing_access", {}),
    supabase.from("billing_plans").select("*").order("sort_order"),
    supabase.from("billing_subscriptions").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
    supabase.from("billing_invoices").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(12),
    supabase.from("billing_customers").select("user_id").eq("user_id", userId).limit(1),
  ]);
  const error = accessResult.error ?? plansResult.error ?? subscriptionsResult.error ?? invoicesResult.error ?? customerResult.error;
  if (error) throw error;
  const accessRow = accessResult.data?.[0];
  if (!accessRow) throw new Error("BILLING_ACCESS_UNAVAILABLE");

  const plans: BillingPlan[] = (plansResult.data ?? []).map((row) => ({
    id: row.id, code: row.code, name: row.name, description: row.description, tier: row.tier,
    billingInterval: row.billing_interval, currency: row.currency, unitAmount: row.unit_amount,
    trialDays: row.trial_days, provider: row.provider, providerPriceId: row.provider_price_id,
    features: stringArray(row.features), isActive: row.is_active,
  }));
  const subscriptions: BillingSubscription[] = (subscriptionsResult.data ?? []).map((row) => ({
    id: row.id, planId: row.plan_id, provider: row.provider, status: row.status, trialStart: row.trial_start,
    currentPeriodEnd: row.current_period_end, cancelAtPeriodEnd: row.cancel_at_period_end, canceledAt: row.canceled_at,
  }));
  const invoices: BillingInvoice[] = (invoicesResult.data ?? []).map((row) => ({
    id: row.id, status: row.status, currency: row.currency, amountDue: row.amount_due, amountPaid: row.amount_paid,
    hostedInvoiceUrl: row.hosted_invoice_url, invoicePdfUrl: row.invoice_pdf_url, paidAt: row.paid_at, createdAt: row.created_at,
  }));
  const access: BillingAccess = {
    tier: accessRow.tier, status: accessRow.status, planCode: accessRow.plan_code, planName: accessRow.plan_name,
    accessUntil: accessRow.access_until, cancelAtPeriodEnd: accessRow.cancel_at_period_end, source: accessRow.source,
  };
  return { access, plans, subscriptions, invoices, hasProviderCustomer: (customerResult.data ?? []).length > 0 };
}

async function billingRequest(endpoint: string, body?: object) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({})) as { url?: string; error?: string };
  if (!response.ok || !payload.url) throw new Error(payload.error || "BILLING_REQUEST_FAILED");
  return payload.url;
}

export function startCheckout(planCode: string) {
  return billingRequest("/api/billing/checkout", { planCode });
}

export function openBillingPortal() {
  return billingRequest("/api/billing/portal");
}

export function canUseBillingFeature(access: BillingAccess, feature: string) {
  if (access.tier === "beta") return true;
  return access.tier === "pro" || feature === "core";
}
