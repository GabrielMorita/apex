import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
    await enforceUserRateLimit(user.id, "billing:portal", 10, 3600);
    const { data: customer, error } = await supabase.from("billing_customers").select("provider_customer_id").eq("user_id", user.id).eq("provider", "stripe").maybeSingle();
    if (error) throw error;
    if (!customer) return NextResponse.json({ error: "CUSTOMER_NOT_FOUND" }, { status: 409 });
    const session = await getStripe().billingPortal.sessions.create({
      customer: customer.provider_customer_id,
      return_url: `${appBaseUrl(request.nextUrl.origin)}/?destino=configuracoes`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const code = publicBillingError(error);
    return NextResponse.json({ error: code }, { status: code === "BILLING_NOT_CONFIGURED" ? 503 : code === "RATE_LIMITED" ? 429 : 500 });
  }
}
