import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "screenshots";

// Supabase is "configured" only when both env vars are present. When it is not,
// the data layer transparently falls back to browser localStorage so the app
// still runs end-to-end without a backend (see lib/journeys.js).
export const isSupabaseConfigured = Boolean(url && anonKey);

let client = null;
if (isSupabaseConfigured) {
  client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

export function getSupabase() {
  return client;
}
