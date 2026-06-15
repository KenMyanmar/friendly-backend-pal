import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role admin client. NEVER import this from client-reachable modules.
// Import it lazily inside createServerFn .handler() bodies:
//   const { supabaseAdmin } = await import("@/integrations/my-supabase/client.server");
export const supabaseAdmin: SupabaseClient = createClient(
  process.env.MY_SUPABASE_URL ?? "",
  process.env.MY_SUPABASE_SERVICE_ROLE_KEY ?? "",
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
);
