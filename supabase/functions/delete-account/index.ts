import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !publishableKey || !serviceRoleKey) return json({ error: "Server configuration error" }, 500);

    const body = await request.json().catch(() => null) as { confirmation?: string } | null;
    if (body?.confirmation !== "EXCLUIR") return json({ error: "Invalid confirmation" }, 400);

    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "Invalid session" }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const userId = userData.user.id;

    const { data: subscriptions, error: subscriptionError } = await admin
      .from("billing_subscriptions")
      .select("status,cancel_at_period_end")
      .eq("user_id", userId)
      .in("status", ["incomplete", "trialing", "active", "past_due", "paused", "unpaid"]);
    const billingTableMissing = subscriptionError?.code === "42P01" || subscriptionError?.code === "PGRST205";
    if (subscriptionError && !billingTableMissing) return json({ error: "Could not inspect subscription" }, 500);
    const unsafeSubscription = (subscriptions ?? []).some((subscription) =>
      ["incomplete", "past_due", "paused", "unpaid"].includes(subscription.status)
      || (["trialing", "active"].includes(subscription.status) && !subscription.cancel_at_period_end)
    );
    if (unsafeSubscription) return json({ error: "ACTIVE_SUBSCRIPTION_MUST_BE_CANCELED" }, 409);

    const { data: avatarFiles, error: listError } = await admin.storage.from("avatars").list(userId, { limit: 100 });
    if (listError) return json({ error: "Could not inspect private files" }, 500);
    if (avatarFiles?.length) {
      const paths = avatarFiles.map((file) => `${userId}/${file.name}`);
      const { error: storageError } = await admin.storage.from("avatars").remove(paths);
      if (storageError) return json({ error: "Could not remove private files" }, 500);
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) return json({ error: "Could not delete account" }, 500);

    return json({ deleted: true });
  } catch {
    return json({ error: "Unexpected server error" }, 500);
  }
});
