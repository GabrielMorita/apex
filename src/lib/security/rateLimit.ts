import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function enforceUserRateLimit(userId: string, action: string, limit: number, windowSeconds: number) {
  const { data, error } = await createAdminClient().rpc("consume_api_rate_limit", {
    p_user_id: userId,
    p_action: action,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  if (!data) throw new Error("RATE_LIMITED");
}
