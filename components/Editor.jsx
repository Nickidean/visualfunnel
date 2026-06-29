"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DeviceToggle from "./DeviceToggle";
import Funnel from "./Funnel";
import StepEditor from "./StepEditor";
import Lightbox from "./Lightbox";
import PresentMode from "./PresentMode";
import { buildViewModel, fmtNum, fmtPct } from "@/lib/compute";
import { exportJourneyText } from "@/lib/exportText";
import { saveJourney, uploadScreenshot } from "@/lib/journeys";
import * as ops from "@/lib/structureOps";

export default function Editor({ initialJourney, onBack, onSaved }) {
  const [journey, setJourney] = useState(initialJourney);
  const [device, setDevice] = useState("desktop");
  const [editingStepId, setEditingStepId] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [presenting, setPresenting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [saveState, setSaveState] = useState("saved"); // saved | saving | dirty
  const [uploadBusy, setUploadBusy] = useState(false);

  const saveTimer = useRef(null);
  const firstRender = useRef(true);

  // Debounced autosave whenever the journey changes.
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
        onSaved?.(saved);
      } catch (e) {
        console.error("Save failed", e);
        setSaveState("dirty");
      }
    }, 600);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
  }, [journey, onSaved]);

  const vm = useMemo(() => buildViewModel(journey, device), [journey, device]);

  const apply = useCallback((fn) => {
    setJourney((j) => ({ ...j, structure: fn(j.structure) }));
  }, []);

  // Locate the step currently being edited (anywhere in the structure).
  const editingStep = useMemo(() => {
    if (!editingStepId) return null;
    for (const sec of journey.structure.sections) {
      if (sec.type === "step" && sec.step.id === editingStepId) return sec.step;
      if (sec.type === "fork") {
        for (const lane of sec.lanes) {
          const s = lane.steps.find((x) => x.id === editingStepId);
          if (s) return s;
        }
      }
    }
    return null;
  }, [editingStepId, journey]);

  const actions = useMemo(
    () => ({
      onEditStep: (id) => setEditingStepId(id),
      onMoveStep: (id, dir) => apply((s) => ops.moveStep(s, id, dir)),
      onLightbox: (src, alt) => setLightbox({ src, alt }),
      onAddStepToLane: (forkId, laneId) =>
        apply((s) => ops.addStepToLane(s, forkId, laneId)),
      onAddLane: (forkId) => apply((s) => ops.addLane(s, forkId)),
      onRemoveLane: (forkId, laneId) =>
        apply((s) => ops.removeLane(s, forkId, laneId)),
      onRenameLane: (forkId, laneId, name) =>
        apply((s) => ops.renameLane(s, forkId, laneId, name)),
      onRemoveFork: (forkId) => apply((s) => ops.removeFork(s, forkId)),
    }),
    [apply]
  );

  async function handleUpload(file) {
    if (!editingStepId) return;
    setUploadBusy(true);
    try {
      const url = await uploadScreenshot(file, journey.id);
      apply((s) => ops.updateStep(s, editingStepId, { screenshotUrl: url }));
    } catch (e) {
      console.error("Upload failed", e);
      window.alert("Screenshot upload failed. See console for details.");
    } finally {
      setUploadBusy(false);
    }
  }

  const exportText = useMemo(
    () => (exportOpen ? exportJourneyText(journey, device) : ""),
    [exportOpen, journey, device]
  );

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-6 py-3">
          <button
            className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
            onClick={onBack}
          >
            ← Library
          </button>
          <input
            className="min-w-0 flex-1 rounded-md border border-transparent px-2 py-1 text-lg font-semibold hover:border-slate-200 focus:border-slate-300"
            value={journey.name}
            onChange={(e) =>
              setJourney((j) => ({ ...j, name: e.target.value }))
            }
            aria-label="Journey name"
          />
          <span className="text-xs text-slate-400">
            {saveState === "saving"
              ? "Saving…"
              : saveState === "dirty"
              ? "Unsaved…"
              : "Saved"}
          </span>
          <DeviceToggle value={device} onChange={setDevice} size="sm" />
          <button
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
            onClick={() => setExportOpen(true)}
          >
            Export
          </button>
          <button
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
            onClick={() => setPresenting(true)}
          >
            Present
          </button>
        </div>
      </div>

      {/* Conversion summary */}
      <div className="mx-auto max-w-[1400px] px-6 pt-5">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 rounded-lg border border-slate-200 bg-white px-5 py-3">
          <Stat label="Entered" value={fmtNum(vm.firstValue)} />
          <Stat label="Completed" value={fmtNum(vm.lastValue)} />
          <Stat
            label="Overall conversion"
            value={fmtPct(vm.conversion)}
            strong
          />
          <span className="ml-auto text-xs text-slate-400">
            {device === "combined"
              ? "Combined = desktop + mobile per step"
              : `${device[0].toUpperCase()}${device.slice(1)} numbers`}
          </span>
        </div>
      </div>

      {/* Funnel */}
      <div className="mx-auto max-w-[1400px] px-6 py-6">
        <Funnel
          vm={vm}
          device={device}
          editable
          actions={actions}
        />

        <div className="mt-4 flex gap-2">
          <button
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-100"
            onClick={() => apply((s) => ops.addStepSection(s))}
          >
            + Add step
          </button>
          <button
            className="rounded-md border border-violet-300 bg-white px-3 py-2 text-sm text-violet-700 hover:bg-violet-50"
            onClick={() => apply((s) => ops.addForkSection(s))}
          >
            + Add fork
          </button>
        </div>
      </div>

      {/* Step editor drawer */}
      {editingStep && (
        <StepEditor
          step={editingStep}
          busy={uploadBusy}
          onClose={() => setEditingStepId(null)}
          onField={(field, value) =>
            apply((s) => ops.updateStep(s, editingStepId, { [field]: value }))
          }
          onData={(dev, value) =>
            apply((s) =>
              ops.updateStep(s, editingStepId, {
                data: { ...editingStep.data, [dev]: value },
              })
            )
          }
          onAvailability={(value) =>
            apply((s) => ops.updateStep(s, editingStepId, { availability: value }))
          }
          onUploadScreenshot={handleUpload}
          onClearScreenshot={() =>
            apply((s) => ops.updateStep(s, editingStepId, { screenshotUrl: null }))
          }
          onAddLink={() => apply((s) => ops.addLink(s, editingStepId))}
          onUpdateLink={(linkId, patch) =>
            apply((s) => ops.updateLink(s, editingStepId, linkId, patch))
          }
          onRemoveLink={(linkId) =>
            apply((s) => ops.removeLink(s, editingStepId, linkId))
          }
          onDelete={() => {
            apply((s) => ops.deleteStep(s, editingStepId));
            setEditingStepId(null);
          }}
        />
      )}

      {lightbox && (
        <Lightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}

      {presenting && (
        <PresentMode
          journey={journey}
          device={device}
          onDeviceChange={setDevice}
          onClose={() => setPresenting(false)}
        />
      )}

      {exportOpen && (
        <ExportModal text={exportText} onClose={() => setExportOpen(false)} name={journey.name} />
      )}
    </div>
  );
}

function Stat({ label, value, strong }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div
        className={`tabular-nums ${
          strong ? "text-xl font-bold text-blue-600" : "text-lg font-semibold"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function ExportModal({ text, name, onClose }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  function download() {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/[^\w]+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold">Export outline</h2>
          <button
            className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <pre className="flex-1 overflow-auto whitespace-pre-wrap px-5 py-4 text-xs text-slate-700">
          {text}
        </pre>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
            onClick={download}
          >
            Download .txt
          </button>
          <button
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
            onClick={copy}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
