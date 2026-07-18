import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { appBaseUrl, billingEnabled, getStripe } from "@/lib/billing/stripe";
import { publicBillingError } from "@/lib/billing/serverError";
import { enforceUserRateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    if (!billingEnabled()) return NextResponse.json({ error: "BILLING_NOT_CONFIGURED" }, { status: 503 });
    await enforceUserRateLimit(user.id, "billing:checkout", 5, 3600);

    const body = await request.json().catch(() => null) as { planCode?: unknown } | null;
    const planCode = typeof body?.planCode === "string" ? body.planCode.trim() : "";
    if (!/^[a-z0-9][a-z0-9_-]{1,63}$/.test(planCode)) return NextResponse.json({ error: "INVALID_PLAN" }, { status: 400 });

    const [planResult, subscriptionResult, customerResult] = await Promise.all([
      supabase.from("billing_plans").select("*").eq("code", planCode).eq("is_active", true).eq("provider", "stripe").maybeSingle(),
      supabase.from("billing_subscriptions").select("id,status,trial_start").eq("user_id", user.id),
      supabase.from("billing_customers").select("provider_customer_id").eq("user_id", user.id).eq("provider", "stripe").maybeSingle(),
    ]);
    const queryError = planResult.error ?? subscriptionResult.error ?? customerResult.error;
    if (queryError) throw queryError;
    const plan = planResult.data;
    if (!plan || !plan.provider_price_id || plan.billing_interval === "none") return NextResponse.json({ error: "BILLING_NOT_CONFIGURED" }, { status: 503 });
    const previousSubscriptions = subscriptionResult.data ?? [];
    if (previousSubscriptions.some((subscription) => ["trialing", "active", "past_due"].includes(subscription.status))) return NextResponse.json({ error: "ALREADY_SUBSCRIBED" }, { status: 409 });

    const stripe = getStripe();
    const providerPrice = await stripe.prices.retrieve(plan.provider_price_id);
    const intervalMatches = providerPrice.recurring?.interval === plan.billing_interval;
    const amountMatches = providerPrice.unit_amount === plan.unit_amount;
    if (!providerPrice.active || !intervalMatches || !amountMatches || providerPrice.currency !== plan.currency) {
      return NextResponse.json({ error: "BILLING_NOT_CONFIGURED" }, { status: 503 });
    }
    const baseUrl = appBaseUrl(request.nextUrl.origin);
    const trialDays = previousSubscriptions.some((subscription) => subscription.trial_start) ? 0 : plan.trial_days;
    const metadata = { apex_user_id: user.id, apex_plan_code: plan.code, apex_trial_days: String(trialDays) };
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: plan.provider_price_id, quantity: 1 }],
      payment_method_types: ["card"],
      payment_method_collection: "always",
      customer: customerResult.data?.provider_customer_id || undefined,
      customer_email: customerResult.data ? undefined : user.email,
      client_reference_id: user.id,
      metadata,
      subscription_data: {
        metadata,
        ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
      },
      allow_promotion_codes: true,
      success_url: `${baseUrl}/?destino=configuracoes&cobranca=sucesso&checkout={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?destino=configuracoes&cobranca=cancelada`,
    }, { idempotencyKey: `checkout:${user.id}:${plan.id}:${new Date().toISOString().slice(0, 13)}` });

    if (!session.url) throw new Error("CHECKOUT_URL_MISSING");
    const admin = createAdminClient();
    const { error: auditError } = await admin.from("billing_checkout_attempts").insert({
      user_id: user.id,
      plan_id: plan.id,
      provider: "stripe",
      provider_checkout_id: session.id,
      status: "redirected",
      expires_at: new Date(session.expires_at * 1000).toISOString(),
    });
    if (auditError && auditError.code !== "23505") {
      await stripe.checkout.sessions.expire(session.id).catch(() => undefined);
      throw auditError;
    }
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const code = publicBillingError(error);
    return NextResponse.json({ error: code }, { status: code === "BILLING_NOT_CONFIGURED" ? 503 : code === "RATE_LIMITED" ? 429 : 500 });
  }
}
