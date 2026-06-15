import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_MY_SUPABASE_URL as string) || "";
const anonKey = (import.meta.env.VITE_MY_SUPABASE_ANON_KEY as string) || "";

function createLazyMissingClient(): SupabaseClient {
  const message =
    "[my-supabase] Missing MY_SUPABASE_URL or MY_SUPABASE_ANON_KEY. Set them as project secrets.";
  console.warn(message);
  return new Proxy({} as SupabaseClient, {
    get() {
      throw new Error(message);
    },
  });
}

export const supabase: SupabaseClient =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: typeof window !== "undefined",
          autoRefreshToken: true,
          detectSessionInUrl: typeof window !== "undefined",
        },
      })
    : createLazyMissingClient();
