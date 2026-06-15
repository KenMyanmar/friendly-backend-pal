import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Public Supabase config — safe to ship in the client bundle.
// The anon key is PUBLIC by design (it identifies the project, not a user);
// data is protected by Row-Level Security, NOT by hiding this key.
// Lovable reserves the VITE_ prefix for managed secrets, so for this external
// Supabase project the values are hardcoded here — the standard Supabase pattern.
// To rotate: Supabase dashboard → Project Settings → API → anon public, paste below, redeploy.
const url = "https://mnlaorsnnxkiblbkqged.supabase.co";
const anonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ubGFvcnNubnhraWJsYmtxZ2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0OTgxNTgsImV4cCI6MjA5NzA3NDE1OH0.xJdEN3hhSjBD2TTFnzSrISvCD5MIrhfC7-WFS5xMWt4";

export const supabase: SupabaseClient = createClient(url, anonKey, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: true,
    detectSessionInUrl: typeof window !== "undefined",
  },
});
