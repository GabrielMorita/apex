import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { requireSupabaseConfig } from "@/lib/supabase/config";

let browserClient: SupabaseClient<Database> | undefined;

export function createClient() {
  if (browserClient) return browserClient;

  const { supabaseUrl, supabasePublishableKey } = requireSupabaseConfig();
  browserClient = createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
  return browserClient;
}
