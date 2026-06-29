"use client";

import { useCallback, useEffect, useState } from "react";
import JourneyLibrary from "./JourneyLibrary";
import Editor from "./Editor";
import {
  listJourneys,
  getJourney,
  createJourney,
  renameJourney,
  deleteJourney,
  usingSupabase,
} from "@/lib/journeys";

export default function App() {
  const [view, setView] = useState("library"); // library | editor
  const [journeys, setJourneys] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);

  const backendLabel = usingSupabase()
    ? "Supabase (synced)"
    : "This browser only (set Supabase env vars to sync)";

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

  useEffect(() => {
    refresh();
  }, [refresh]);

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
      onOpen={open}
      onCreate={create}
      onRename={rename}
      onDelete={remove}
    />
  );
}
