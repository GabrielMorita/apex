export type BillingTier = "beta" | "pro";
export type BillingProvider = "manual" | "stripe" | "mercado_pago";
export type BillingInterval = "none" | "month" | "year";
export type BillingSubscriptionStatus = "incomplete" | "incomplete_expired" | "trialing" | "active" | "past_due" | "paused" | "canceled" | "unpaid";

export interface BillingPlan {
  id: string;
  code: string;
  name: string;
  description: string;
  tier: BillingTier;
  billingInterval: BillingInterval;
  currency: string;
  unitAmount: number | null;
  trialDays: number;
  provider: BillingProvider;
  providerPriceId: string | null;
  features: string[];
  isActive: boolean;
}

export interface BillingAccess {
  tier: BillingTier;
  status: string;
  planCode: string;
  planName: string;
  accessUntil: string | null;
  cancelAtPeriodEnd: boolean;
  source: string;
}

export interface BillingSubscription {
  id: string;
  planId: string | null;
  provider: BillingProvider;
  status: BillingSubscriptionStatus;
  trialStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
}

export interface BillingInvoice {
  id: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible" | "failed";
  currency: string;
  amountDue: number;
  amountPaid: number;
  hostedInvoiceUrl: string | null;
  invoicePdfUrl: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface BillingState {
  access: BillingAccess;
  plans: BillingPlan[];
  subscriptions: BillingSubscription[];
  invoices: BillingInvoice[];
  hasProviderCustomer: boolean;
}
