"use client";

import { useState } from "react";

function fmtDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

export default function JourneyLibrary({
  journeys,
  loading,
  backendLabel,
  onOpen,
  onCreate,
  onRename,
  onDelete,
}) {
  const [newName, setNewName] = useState("");

  function create() {
    onCreate(newName.trim() || "Untitled journey");
    setNewName("");
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Journey Funnel</h1>
        <p className="mt-1 text-sm text-slate-500">
          Map a customer journey as a visual funnel — per-device steps,
          branching, notes and a present-mode walkthrough.
        </p>
        <p className="mt-1 text-xs text-slate-400">Storage: {backendLabel}</p>
      </header>

      <div className="mb-6 flex gap-2">
        <input
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Name a new journey, e.g. Energy quote journey"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
        />
        <button
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          onClick={create}
        >
          New journey
        </button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-slate-400">Loading…</p>
      ) : journeys.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 py-12 text-center text-sm text-slate-400">
          No journeys yet. Create your first one above.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {journeys.map((j) => (
            <li
              key={j.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => onOpen(j.id)}
              >
                <div className="truncate font-medium">{j.name}</div>
                <div className="text-xs text-slate-400">
                  Updated {fmtDate(j.updated_at)}
                </div>
              </button>
              <div className="flex shrink-0 gap-1">
                <button
                  className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                  onClick={() => {
                    const name = window.prompt("Rename journey", j.name);
                    if (name && name.trim()) onRename(j.id, name.trim());
                  }}
                >
                  Rename
                </button>
                <button
                  className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (
                      window.confirm(`Delete "${j.name}"? This cannot be undone.`)
                    )
                      onDelete(j.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
