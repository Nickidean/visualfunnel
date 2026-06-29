// Authentication helpers (Supabase magic-link sign-in).
//
// Auth only applies when Supabase is configured. In the localStorage fallback
// there is no sign-in — the app is single-user on that browser.

import { getSupabase, isSupabaseConfigured } from "./supabaseClient";

export function authEnabled() {
  return isSupabaseConfigured;
}

// Current session user (or null). Resolves immediately to null when auth is off.
export async function getSessionUser() {
  if (!isSupabaseConfigured) return null;
  const { data } = await getSupabase().auth.getSession();
  return data?.session?.user ?? null;
}

// Subscribe to auth changes. Returns an unsubscribe function.
export function onAuthChange(cb) {
  if (!isSupabaseConfigured) return () => {};
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
    cb(session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}

// Send a magic-link / OTP email. The link returns the user to this app's
// origin, where supabase-js picks up the session automatically.
export async function signInWithEmail(email) {
  const sb = getSupabase();
  const emailRedirectTo =
    typeof window !== "undefined" ? window.location.origin : undefined;
  return sb.auth.signInWithOtp({ email, options: { emailRedirectTo } });
}

// Email + password sign-in. No email is sent, so it isn't affected by the
// email rate limit. Create users in the Supabase dashboard (Authentication →
// Users → Add user, with "Auto Confirm User" checked) or let them set a
// password there.
export async function signInWithPassword(email, password) {
  const sb = getSupabase();
  return sb.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  if (!isSupabaseConfigured) return;
  await getSupabase().auth.signOut();
}
