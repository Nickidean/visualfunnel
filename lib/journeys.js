// Persistence layer for journeys.
//
// Primary store: Supabase (Postgres `journeys` table + Storage bucket for
// screenshots). When Supabase is not configured (no env vars), everything
// falls back to browser localStorage so the app still works locally.

import { getSupabase, isSupabaseConfigured, BUCKET } from "./supabaseClient";
import { newJourney } from "./model";

const LS_KEY = "journey-funnel:journeys";

/* ----------------------------- localStorage ----------------------------- */

function lsReadAll() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function lsWriteAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(list));
}

/* ------------------------------ public API ------------------------------ */

export function usingSupabase() {
  return isSupabaseConfigured;
}

export async function listJourneys() {
  if (!isSupabaseConfigured) {
    return lsReadAll()
      .map(({ id, name, updated_at }) => ({ id, name, updated_at }))
      .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  }
  const sb = getSupabase();
  const { data, error } = await sb
    .from("journeys")
    .select("id, name, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// Public, read-only fetch for a shared journey (no auth). With Supabase this
// only succeeds when the row is shared (enforced by RLS); locally it reads the
// same browser's storage.
export async function getSharedJourney(id) {
  if (!isSupabaseConfigured) {
    const j = lsReadAll().find((x) => x.id === id);
    return j && j.structure?.shared ? j : null;
  }
  const sb = getSupabase();
  const { data, error } = await sb
    .from("journeys")
    .select("id, name, updated_at, structure")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function getJourney(id) {
  if (!isSupabaseConfigured) {
    return lsReadAll().find((j) => j.id === id) || null;
  }
  const sb = getSupabase();
  const { data, error } = await sb
    .from("journeys")
    .select("id, name, updated_at, structure")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createJourney(name = "Untitled journey") {
  const journey = newJourney(name);
  if (!isSupabaseConfigured) {
    const list = lsReadAll();
    list.push(journey);
    lsWriteAll(list);
    return journey;
  }
  const sb = getSupabase();
  const owner = (await currentUserId()) || null;
  const { data, error } = await sb
    .from("journeys")
    .insert({
      id: journey.id,
      name: journey.name,
      owner,
      structure: journey.structure,
      updated_at: journey.updated_at,
    })
    .select("id, name, updated_at, structure")
    .single();
  if (error) throw error;
  return data;
}

export async function saveJourney(journey) {
  const updated = { ...journey, updated_at: new Date().toISOString() };
  if (!isSupabaseConfigured) {
    const list = lsReadAll();
    const idx = list.findIndex((j) => j.id === updated.id);
    if (idx >= 0) list[idx] = updated;
    else list.push(updated);
    lsWriteAll(list);
    return updated;
  }
  const sb = getSupabase();
  const { data, error } = await sb
    .from("journeys")
    .update({
      name: updated.name,
      structure: updated.structure,
      updated_at: updated.updated_at,
    })
    .eq("id", updated.id)
    .select("id, name, updated_at, structure")
    .single();
  if (error) throw error;
  return data;
}

export async function renameJourney(id, name) {
  if (!isSupabaseConfigured) {
    const list = lsReadAll();
    const j = list.find((x) => x.id === id);
    if (j) {
      j.name = name;
      j.updated_at = new Date().toISOString();
      lsWriteAll(list);
    }
    return j;
  }
  const sb = getSupabase();
  const { data, error } = await sb
    .from("journeys")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, name, updated_at")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteJourney(id) {
  if (!isSupabaseConfigured) {
    lsWriteAll(lsReadAll().filter((j) => j.id !== id));
    return;
  }
  const sb = getSupabase();
  const { error } = await sb.from("journeys").delete().eq("id", id);
  if (error) throw error;
}

/* --------------------------- screenshot upload --------------------------- */

// Uploads a screenshot file and returns a URL to store inside the structure.
// With Supabase: uploads to Storage and returns the public URL.
// Without Supabase: returns a data URL (kept inline in localStorage).
export async function uploadScreenshot(file, journeyId) {
  if (!isSupabaseConfigured) {
    return await fileToDataUrl(file);
  }
  const sb = getSupabase();
  const ext = (file.name && file.name.split(".").pop()) || "png";
  const path = `${journeyId || "misc"}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/png",
  });
  if (error) throw error;
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* -------------------------------- auth ---------------------------------- */

export async function currentUserId() {
  if (!isSupabaseConfigured) return null;
  const sb = getSupabase();
  const { data } = await sb.auth.getUser();
  return data?.user?.id || null;
}
