"use client";

import { useCallback, useEffect, useState } from "react";
import JourneyLibrary from "./JourneyLibrary";
import Editor from "./Editor";
import SignIn from "./SignIn";
import {
  listJourneys,
  getJourney,
  createJourney,
  renameJourney,
  deleteJourney,
  usingSupabase,
} from "@/lib/journeys";
import { authEnabled, getSessionUser, onAuthChange, signOut } from "@/lib/auth";

export default function App() {
  const [view, setView] = useState("library"); // library | editor
  const [journeys, setJourneys] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const backendLabel = usingSupabase()
    ? "Supabase (synced to the cloud)"
    : "This browser only (set Supabase env vars to sync)";

  // Establish auth state (or skip when Supabase isn't configured).
  useEffect(() => {
    let unsub = () => {};
    if (!authEnabled()) {
      setAuthReady(true);
      return;
    }
    getSessionUser()
      .then(setUser)
      .finally(() => setAuthReady(true));
    unsub = onAuthChange((u) => {
      setUser(u);
      if (!u) {
        setView("library");
        setCurrent(null);
        setJourneys([]);
      }
    });
    return () => unsub();
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setJourneys(await listJourneys());
    } catch (e) {
      console.error("Failed to list journeys", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load journeys once we're authenticated (or auth is disabled).
  useEffect(() => {
    if (!authReady) return;
    if (authEnabled() && !user) return;
    refresh();
  }, [authReady, user, refresh]);

  async function open(id) {
    try {
      const j = await getJourney(id);
      if (j) {
        setCurrent(j);
        setView("editor");
      }
    } catch (e) {
      console.error("Failed to open journey", e);
      window.alert("Could not open that journey. See console for details.");
    }
  }

  async function create(name) {
    try {
      const j = await createJourney(name);
      setCurrent(j);
      setView("editor");
    } catch (e) {
      console.error("Failed to create journey", e);
      window.alert("Could not create the journey. See console for details.");
    }
  }

  async function rename(id, name) {
    await renameJourney(id, name);
    refresh();
  }

  async function remove(id) {
    await deleteJourney(id);
    refresh();
  }

  function handleSaved(saved) {
    setJourneys((list) =>
      list.map((j) =>
        j.id === saved.id
          ? { id: saved.id, name: saved.name, updated_at: saved.updated_at }
          : j
      )
    );
  }

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-400">
        Loading…
      </div>
    );
  }

  if (authEnabled() && !user) {
    return <SignIn />;
  }

  if (view === "editor" && current) {
    return (
      <Editor
        initialJourney={current}
        onSaved={handleSaved}
        onBack={() => {
          setView("library");
          setCurrent(null);
          refresh();
        }}
      />
    );
  }

  return (
    <JourneyLibrary
      journeys={journeys}
      loading={loading}
      backendLabel={backendLabel}
      userEmail={user?.email || null}
      onSignOut={authEnabled() ? signOut : null}
      onOpen={open}
      onCreate={create}
      onRename={rename}
      onDelete={remove}
    />
  );
}
