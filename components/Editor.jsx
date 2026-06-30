"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  GitFork,
  Play,
  Pencil,
  ChevronLeft,
  ChevronDown,
  Mail,
} from "lucide-react";
import DeviceToggle from "./DeviceToggle";
import Funnel from "./Funnel";
import StepForm from "./StepForm";
import Lightbox from "./Lightbox";
import PresentMode from "./PresentMode";
import { buildViewModel } from "@/lib/compute";
import { saveJourney, uploadScreenshot } from "@/lib/journeys";
import * as ops from "@/lib/structureOps";

export default function Editor({ initialJourney, onBack, onSaved }) {
  const [journey, setJourney] = useState(initialJourney);
  const [device, setDevice] = useState("desktop");
  const [form, setForm] = useState(null); // { mode, dest, fid, lid, stepId, kind }
  const [lightbox, setLightbox] = useState(null);
  const [present, setPresent] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [saveState, setSaveState] = useState("saved"); // saved | saving | dirty

  const saveTimer = useRef(null);
  const firstRender = useRef(true);

  // Keep the latest onSaved without making it an effect dependency — otherwise
  // a parent re-render would re-trigger the autosave and loop endlessly.
  const onSavedRef = useRef(onSaved);
  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  // Debounced autosave — runs only when the journey itself changes.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSaveState("dirty");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        const saved = await saveJourney(journey);
        setSaveState("saved");
        onSavedRef.current?.(saved);
      } catch (e) {
        console.error("Save failed", e);
        setSaveState("dirty");
      }
    }, 600);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
  }, [journey]);

  // Editor keeps empty lanes so freshly-added lanes still show their "+ step".
  const vm = useMemo(
    () => buildViewModel(journey, device, { keepEmptyLanes: true }),
    [journey, device]
  );

  const apply = useCallback((fn) => {
    setJourney((j) => ({ ...j, structure: fn(j.structure) }));
  }, []);

  // Find a step anywhere by id (for edit-form initial values).
  const findStep = useCallback(
    (id) => {
      for (const sec of journey.structure.sections) {
        if (sec.type === "step" && sec.step.id === id) return sec.step;
        if (sec.type === "fork")
          for (const lane of sec.lanes) {
            const s = lane.steps.find((x) => x.id === id);
            if (s) return s;
          }
      }
      return null;
    },
    [journey]
  );

  const actions = useMemo(
    () => ({
      onEditStep: (id) => setForm({ mode: "edit", stepId: id }),
      onMoveStep: (id, dir) => apply((s) => ops.moveStep(s, id, dir)),
      onDeleteStep: (id) => apply((s) => ops.deleteStep(s, id)),
      onLightbox: (src, alt) => setLightbox({ src, alt }),
      onAddSharedStep: () => setForm({ mode: "add", dest: "shared" }),
      onAddLaneStep: (fid, lid) =>
        setForm({ mode: "add", dest: "lane", fid, lid }),
      onAddLane: (fid) => apply((s) => ops.addLane(s, fid)),
      onRemoveLane: (fid, lid) => apply((s) => ops.removeLane(s, fid, lid)),
      onRenameLane: (fid, lid, name) =>
        apply((s) => ops.renameLane(s, fid, lid, name)),
      onRemoveFork: (fid) => apply((s) => ops.removeFork(s, fid)),
    }),
    [apply]
  );

  function handleSaveForm(stepData) {
    if (form.mode === "edit") {
      apply((s) => ops.updateStep(s, form.stepId, stepData));
    } else if (form.dest === "shared") {
      apply((s) => ops.addStepSection(s, stepData));
    } else {
      apply((s) => ops.addStepToLane(s, form.fid, form.lid, stepData));
    }
    setForm(null);
  }

  const overall = vm.conversion;
  const hasNumbers = vm.firstValue != null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 shrink-0"
            >
              <ChevronLeft size={16} /> Library
            </button>
            {editingName ? (
              <input
                autoFocus
                value={journey.name}
                onChange={(e) =>
                  setJourney((j) => ({ ...j, name: e.target.value }))
                }
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
                className="text-2xl font-bold bg-white border border-slate-300 rounded-lg px-2 py-1"
              />
            ) : (
              <h1 className="text-2xl font-bold flex items-center gap-2 group min-w-0">
                <span className="truncate">{journey.name}</span>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-slate-300 group-hover:text-slate-500 shrink-0"
                  aria-label="Rename journey"
                >
                  <Pencil size={16} />
                </button>
              </h1>
            )}
          </div>

          <div className="flex gap-2 shrink-0 flex-wrap items-center">
            <span className="text-xs text-slate-400 mr-1">
              {saveState === "saving"
                ? "Saving…"
                : saveState === "dirty"
                ? "Unsaved…"
                : "Saved"}
            </span>
            <button
              onClick={() => setPresent(true)}
              disabled={vm.columns.length === 0}
              className="flex items-center gap-1.5 text-sm bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white rounded-lg px-3 py-2 font-medium"
            >
              <Play size={15} /> Present
            </button>
            <AddMenu
              onAddStep={() => setForm({ mode: "add", dest: "shared" })}
              onAddComms={() =>
                setForm({ mode: "add", dest: "shared", kind: "comms" })
              }
              onAddBranch={() => apply((s) => ops.addForkSection(s))}
            />
          </div>
        </div>

        {/* View row — device toggle sits with the funnel it controls */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {journey.structure.sections.length > 0 && (
            <DeviceToggle value={device} onChange={setDevice} size="sm" />
          )}
          <span className="text-sm text-slate-500">
            {journey.structure.sections.length === 0 ? (
              "Add screens to build your journey"
            ) : !hasNumbers ? (
              "Add visitor numbers to see the funnel"
            ) : (
              <>
                {overall != null && (
                  <>
                    <span className="font-semibold text-slate-700">
                      {Math.round(overall * 100)}%
                    </span>{" "}
                    overall conversion
                  </>
                )}
                {device === "combined" && (
                  <span className="text-slate-400">
                    {overall != null ? " · " : ""}combined (desktop + mobile)
                  </span>
                )}
              </>
            )}
          </span>
        </div>

        {/* Empty state */}
        {journey.structure.sections.length === 0 ? (
          <button
            onClick={() => setForm({ mode: "add", dest: "shared" })}
            className="w-full max-w-5xl border-2 border-dashed border-slate-300 rounded-2xl py-16 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 flex flex-col items-center gap-2"
          >
            <Plus size={28} />
            <span className="font-medium">Add your first screen</span>
          </button>
        ) : (
          <Funnel vm={vm} editable actions={actions} />
        )}

        <p className="text-xs text-slate-400 mt-4">
          Saved to {journey.id ? "your library" : "this session"}. Present walks
          the journey full-size; use Share there for a read-only link.
        </p>
      </div>

      {form && (
        <StepForm
          mode={form.mode}
          dest={form.dest}
          defaultKind={form.kind || "screen"}
          initial={form.mode === "edit" ? findStep(form.stepId) : null}
          uploadScreenshot={(file) => uploadScreenshot(file, journey.id)}
          onCancel={() => setForm(null)}
          onSave={handleSaveForm}
        />
      )}

      {lightbox && (
        <Lightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}

      {present && (
        <PresentMode
          journey={journey}
          device={device}
          onDeviceChange={setDevice}
          onClose={() => setPresent(false)}
          onEnableShare={() => apply((s) => ({ ...s, shared: true }))}
        />
      )}
    </div>
  );
}

// Small "Add ▾" dropdown that groups Add step / comms / branch.
function AddMenu({ onAddStep, onAddComms, onAddBranch }) {
  const [open, setOpen] = useState(false);
  const item = (icon, label, fn) => (
    <button
      onClick={() => {
        fn();
        setOpen(false);
      }}
      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
    >
      {icon} {label}
    </button>
  );
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        <Plus size={16} /> Add <ChevronDown size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {item(<Plus size={15} />, "Add step", onAddStep)}
            {item(<Mail size={15} />, "Add comms", onAddComms)}
            {item(<GitFork size={15} />, "Add branch", onAddBranch)}
          </div>
        </>
      )}
    </div>
  );
}
