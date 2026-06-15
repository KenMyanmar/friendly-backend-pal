import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = (import.meta.env.MY_SUPABASE_URL as string) || "";
const anonKey = (import.meta.env.MY_SUPABASE_ANON_KEY as string) || "";

if (!url || !anonKey) {
  // Surface a clear error during development if secrets aren't wired.
  console.warn(
    "[my-supabase] Missing MY_SUPABASE_URL or MY_SUPABASE_ANON_KEY. Set them as project secrets.",
  );
}

export const supabase: SupabaseClient = createClient(url, anonKey, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: true,
    detectSessionInUrl: typeof window !== "undefined",
  },
});
