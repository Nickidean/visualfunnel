"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  Columns,
  Maximize2,
} from "lucide-react";
import DeviceToggle from "./DeviceToggle";
import PresentBoard from "./PresentBoard";
import { buildViewModel } from "@/lib/compute";

// Flatten the device view-model into ordered present-mode frames. At a fork,
// each lane is walked in turn; the first lane step carries its traffic share,
// and within a lane drop-off is computed lane-relative.
function buildFrames(vm) {
  const frames = [];
  for (const col of vm.columns) {
    if (col.kind === "step") {
      frames.push({
        step: col.step,
        lane: null,
        value: col.optional ? col.through : col.flow,
        retention: col.optional ? col.throughShare : col.retention,
        drop: col.drop && col.drop.abs > 0 ? col.drop.pct : null,
        share: null,
        optional: col.optional || false,
        through: col.through,
        throughShare: col.throughShare,
        bypass: col.bypass,
        bypassShare: col.bypassShare,
      });
    } else {
      for (const lane of col.lanes) {
        let prev = null;
        lane.steps.forEach((ls, k) => {
          const drop =
            k > 0 && prev != null && ls.value != null && prev > ls.value
              ? (prev - ls.value) / prev
              : null;
          frames.push({
            step: ls.step,
            lane: lane.name,
            value: ls.value,
            retention: ls.retention,
            drop,
            share: k === 0 ? lane.share : null,
          });
          if (ls.value != null) prev = ls.value;
        });
      }
    }
  }
  return frames;
}

export default function PresentMode({ journey, device, onDeviceChange, onClose }) {
  const vm = useMemo(() => buildViewModel(journey, device), [journey, device]);
  const frames = useMemo(() => buildFrames(vm), [vm]);
  const [idx, setIdx] = useState(0);
  const [mode, setMode] = useState("walk"); // walk | overview
  const clamped = Math.min(idx, Math.max(0, frames.length - 1));

  // Jump from an overview tile into the walkthrough at that step.
  function pickStep(stepId) {
    const i = frames.findIndex((fr) => fr.step.id === stepId);
    if (i >= 0) setIdx(i);
    setMode("walk");
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (mode !== "walk") return; // arrows drive the walkthrough only
      if (e.key === "ArrowRight")
        setIdx((i) => Math.min(i + 1, frames.length - 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [frames.length, onClose, mode]);

  useEffect(() => {
    setIdx((i) => Math.min(i, Math.max(0, frames.length - 1)));
  }, [frames.length]);

  const f = frames[clamped];

  return (
    <div className="fixed inset-0 bg-slate-900 text-white flex flex-col z-50">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 gap-3">
        <div className="text-sm text-white/60 truncate">{journey.name}</div>
        <div className="flex items-center gap-3">
          {/* Walkthrough / Overview toggle */}
          <div className="inline-flex rounded-lg border border-white/15 bg-white/5 p-0.5">
            <button
              onClick={() => setMode("walk")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
                mode === "walk" ? "bg-white text-slate-900" : "text-white/70 hover:bg-white/10"
              }`}
            >
              <Maximize2 size={13} /> Walkthrough
            </button>
            <button
              onClick={() => setMode("overview")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
                mode === "overview" ? "bg-white text-slate-900" : "text-white/70 hover:bg-white/10"
              }`}
            >
              <Columns size={13} /> Overview
            </button>
          </div>

          <DeviceToggle value={device} onChange={onDeviceChange} size="sm" />
          {mode === "walk" && (
            <div className="text-sm text-white/60 hidden sm:block">
              {frames.length ? `${clamped + 1} / ${frames.length}` : "0 / 0"}
            </div>
          )}
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white flex items-center gap-1.5 text-sm"
          >
            <X size={18} /> Exit
          </button>
        </div>
      </div>

      {mode === "overview" ? (
        frames.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-white/40">
            No steps to present in this device view.
          </div>
        ) : (
          <PresentBoard vm={vm} onPick={pickStep} />
        )
      ) : !f ? (
        <div className="flex-1 flex items-center justify-center text-white/40">
          No steps to present in this device view.
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row items-center gap-8 p-6 lg:p-12 overflow-auto">
          <div className="flex-1 w-full flex items-center justify-center min-h-0">
            {f.step.screenshotUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={f.step.screenshotUrl}
                alt={f.step.title}
                className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
                style={{ maxHeight: "70vh" }}
              />
            ) : (
              <div className="w-full max-w-lg aspect-video rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30">
                <ImageIcon size={48} />
              </div>
            )}
          </div>

          <div className="w-full lg:w-96 shrink-0">
            {f.lane && (
              <span className="inline-block text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded-full px-3 py-1 mb-3">
                {f.lane}
              </span>
            )}
            {f.optional && (
              <span className="inline-block text-xs font-semibold bg-amber-400/20 text-amber-300 rounded-full px-3 py-1 mb-3">
                Optional / exception step
              </span>
            )}
            <h2 className="text-3xl font-bold mb-4">{f.step.title}</h2>

            <div className="flex items-end gap-6 mb-5 flex-wrap">
              {f.value != null && (
                <div>
                  <div className="text-3xl font-bold tabular-nums">
                    {f.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    {f.optional ? "came through" : `visitors (${device})`}
                    {f.retention != null
                      ? ` · ${Math.round(f.retention * 100)}%${
                          f.optional ? " of previous" : " of start"
                        }`
                      : ""}
                  </div>
                </div>
              )}
              {f.optional && f.bypass != null && (
                <div>
                  <div className="text-2xl font-bold text-amber-300">
                    {f.bypass.toLocaleString()}
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    skipped
                    {f.bypassShare != null
                      ? ` · ${Math.round(f.bypassShare * 100)}%`
                      : ""}
                  </div>
                </div>
              )}
              {f.share != null && (
                <div>
                  <div className="text-2xl font-bold text-indigo-300">
                    {Math.round(f.share * 100)}%
                  </div>
                  <div className="text-xs text-white/50 mt-1">took this path</div>
                </div>
              )}
              {f.drop != null && (
                <div>
                  <div className="text-2xl font-bold text-rose-400">
                    ↓{Math.round(f.drop * 100)}%
                  </div>
                  <div className="text-xs text-white/50 mt-1">drop-off</div>
                </div>
              )}
            </div>

            {f.step.notes && f.step.notes.trim() && (
              <p className="text-white/80 leading-relaxed mb-5 whitespace-pre-wrap">
                {f.step.notes}
              </p>
            )}

            {f.step.links && f.step.links.some((l) => l.url) && (
              <div className="space-y-2">
                {f.step.links
                  .filter((l) => l.url)
                  .map((l) => (
                    <a
                      key={l.id}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2.5 text-sm transition"
                    >
                      <ExternalLink size={15} className="text-indigo-300 shrink-0" />
                      <span className="truncate">{l.label || l.url}</span>
                    </a>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {mode === "walk" && (
      <div className="flex items-center justify-center gap-4 px-6 py-5 border-t border-white/10">
        <button
          onClick={() => setIdx((i) => Math.max(i - 1, 0))}
          disabled={clamped === 0}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-lg px-5 py-2.5 font-medium"
        >
          <ChevronLeft size={18} /> Back
        </button>
        <div className="flex gap-1.5 flex-wrap max-w-xs justify-center">
          {frames.map((_, k) => (
            <button
              key={k}
              onClick={() => setIdx(k)}
              aria-label={`Go to step ${k + 1}`}
              className="rounded-full transition-all"
              style={{
                width: k === clamped ? "24px" : "8px",
                height: "8px",
                background: k === clamped ? "#818cf8" : "rgba(255,255,255,.25)",
              }}
            />
          ))}
        </div>
        <button
          onClick={() => setIdx((i) => Math.min(i + 1, frames.length - 1))}
          disabled={clamped >= frames.length - 1}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 rounded-lg px-5 py-2.5 font-medium"
        >
          Next <ChevronRight size={18} />
        </button>
      </div>
      )}

      {mode === "overview" && frames.length > 0 && (
        <div className="text-center text-xs text-white/40 py-3 border-t border-white/10">
          Drag to pan · scroll to zoom · click a step to walk it · Fit to see it all
        </div>
      )}
    </div>
  );
}
