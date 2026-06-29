"use client";

import { useEffect, useMemo, useState } from "react";
import DeviceToggle from "./DeviceToggle";
import { buildViewModel, fmtNum, fmtPct } from "@/lib/compute";

// Flatten the view-model into an ordered list of present-mode slides.
// At a fork, each lane is walked in turn with its name shown.
function buildSlides(vm) {
  const slides = [];
  for (const col of vm.columns) {
    if (col.kind === "step") {
      slides.push({
        step: col.step,
        title: col.step.title,
        value: col.flow,
        retention: col.retention,
        drop: col.drop,
        laneName: null,
        share: null,
      });
    } else if (col.kind === "fork") {
      for (const lane of col.lanes) {
        lane.steps.forEach((ls, i) => {
          slides.push({
            step: ls.step,
            title: ls.step.title,
            value: ls.value,
            retention: ls.retention,
            drop: null,
            laneName: lane.name,
            share: i === 0 ? lane.share : null,
          });
        });
      }
    }
  }
  return slides;
}

export default function PresentMode({ journey, device, onDeviceChange, onClose }) {
  const vm = useMemo(() => buildViewModel(journey, device), [journey, device]);
  const slides = useMemo(() => buildSlides(vm), [vm]);
  const [index, setIndex] = useState(0);

  const clamped = Math.min(index, Math.max(0, slides.length - 1));

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight")
        setIndex((i) => Math.min(i + 1, slides.length - 1));
      else if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length, onClose]);

  // Keep index in range when the device view changes the slide count.
  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, slides.length - 1)));
  }, [slides.length]);

  const slide = slides[clamped];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
      {/* Top controls */}
      <div className="flex items-center justify-between gap-3 px-6 py-3">
        <div className="truncate text-sm text-slate-300">{journey.name}</div>
        <div className="flex items-center gap-3">
          <DeviceToggle value={device} onChange={onDeviceChange} size="sm" />
          <button
            className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
            onClick={onClose}
          >
            Exit ✕
          </button>
        </div>
      </div>

      {/* Body */}
      {!slide ? (
        <div className="flex flex-1 items-center justify-center text-slate-400">
          No steps to present in this device view.
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden px-6 pb-4 lg:grid-cols-[1.6fr_1fr]">
          {/* Screenshot */}
          <div className="flex min-h-0 items-center justify-center">
            {slide.step.screenshotUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={slide.step.screenshotUrl}
                alt={slide.title}
                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
              />
            ) : (
              <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed border-white/20 text-slate-500">
                No screenshot
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="flex min-h-0 flex-col overflow-y-auto">
            {slide.laneName && (
              <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-violet-500/20 px-3 py-1 text-sm text-violet-200">
                Lane: {slide.laneName}
                {slide.share !== null && slide.share !== undefined && (
                  <span className="font-semibold">{fmtPct(slide.share)}</span>
                )}
              </div>
            )}
            <h2 className="text-3xl font-bold">{slide.title}</h2>

            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">
                  Visitors ({device})
                </div>
                <div className="text-2xl font-bold tabular-nums">
                  {fmtNum(slide.value)}
                </div>
              </div>
              {slide.retention !== null && slide.retention !== undefined && (
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">
                    Retained
                  </div>
                  <div className="text-2xl font-bold tabular-nums">
                    {fmtPct(slide.retention)}
                  </div>
                </div>
              )}
              {slide.drop && (
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">
                    Drop-off
                  </div>
                  <div className="text-2xl font-bold tabular-nums text-red-300">
                    −{fmtNum(Math.abs(slide.drop.abs))} ({fmtPct(slide.drop.pct)})
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {slide.step.notes && slide.step.notes.trim() && (
              <div className="mt-6">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">
                  Notes
                </div>
                <p className="mt-1 whitespace-pre-wrap text-slate-200">
                  {slide.step.notes}
                </p>
              </div>
            )}

            {/* Links */}
            {(slide.step.links || []).some((l) => l.url) && (
              <div className="mt-6">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">
                  Links
                </div>
                <ul className="mt-1 space-y-1">
                  {slide.step.links
                    .filter((l) => l.url)
                    .map((l) => (
                      <li key={l.id}>
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-300 underline hover:text-blue-200"
                        >
                          {l.label || l.url}
                        </a>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-3">
        <button
          className="rounded-md bg-white/10 px-4 py-2 text-sm hover:bg-white/20 disabled:opacity-30"
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
          disabled={clamped === 0}
        >
          ← Previous
        </button>
        <div className="text-sm text-slate-400">
          {slides.length ? `${clamped + 1} / ${slides.length}` : "0 / 0"}
          <span className="ml-2 hidden sm:inline">
            (arrow keys to navigate, Esc to exit)
          </span>
        </div>
        <button
          className="rounded-md bg-white/10 px-4 py-2 text-sm hover:bg-white/20 disabled:opacity-30"
          onClick={() => setIndex((i) => Math.min(i + 1, slides.length - 1))}
          disabled={clamped >= slides.length - 1}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
