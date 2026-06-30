"use client";

import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  Mail,
} from "lucide-react";
import { THUMB, PLACEHOLDER_ASPECT } from "@/lib/layout";

// A single step rendered in the funnel rail (prototype styling).
// `value` and `retention` come pre-computed from the device view-model.
export default function StepCard({
  step,
  value,
  retention,
  small,
  editable,
  optional,
  comms,
  throughShare,
  bypass,
  bypassShare,
  onEdit,
  onMoveL,
  onMoveR,
  onDel,
  onLightbox,
}) {
  // For an optional step the bar reflects how much of the incoming traffic
  // came through (throughShare); otherwise it's retention vs the first step.
  const r = optional ? throughShare : retention;
  const w = r != null ? Math.max(r * 100, 8) : 100;
  const hasLinks = step.links && step.links.some((l) => l.url);
  const hasNote = step.notes && step.notes.trim();

  return (
    <div
      className={`bg-white rounded-xl shadow-sm shrink-0 ${
        comms
          ? "border-2 border-sky-300"
          : optional
          ? "border-2 border-dashed border-amber-300"
          : "border border-slate-200"
      }`}
      style={{ width: small ? THUMB.cardSmall : THUMB.card }}
    >
      {comms && (
        <div className="flex items-center gap-1 rounded-t-xl bg-sky-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-700">
          <Mail size={12} /> Comms
        </div>
      )}
      {optional && (
        <div className="rounded-t-xl bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
          Conditional step
        </div>
      )}
      {step.screenshotUrl ? (
        <button
          onClick={() => onLightbox?.(step.screenshotUrl, step.title)}
          className="block w-full bg-slate-100 rounded-t-xl overflow-hidden"
          aria-label="View screenshot full size"
        >
          {/* Fixed width (the card width); natural height — full screenshot, never cropped. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={step.screenshotUrl}
            alt={step.title}
            className="block w-full h-auto"
          />
        </button>
      ) : (
        <div
          className="w-full bg-slate-100 rounded-t-xl flex items-center justify-center"
          style={{ aspectRatio: PLACEHOLDER_ASPECT }}
          aria-label="No screenshot"
        >
          <ImageIcon size={20} className="text-slate-300" />
        </div>
      )}

      <div className="p-3">
        <h3 className="font-semibold text-sm truncate" title={step.title}>
          {step.title}
        </h3>
        {hasNote && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{step.notes}</p>
        )}

        <div className="flex items-baseline justify-between mt-2">
          {value != null ? (
            <span className="font-bold text-sm tabular-nums">
              {value.toLocaleString()}
            </span>
          ) : (
            <span className="text-xs text-slate-300">no data</span>
          )}
          {comms ? (
            value != null && <span className="text-xs text-slate-400">sent</span>
          ) : (
            r != null && (
              <span className="text-xs text-slate-400">
                {Math.round(r * 100)}%{optional ? " through" : ""}
              </span>
            )
          )}
        </div>

        <div className="h-2 mt-1.5">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: comms ? "100%" : `${w}%`,
              background:
                value != null
                  ? comms
                    ? "linear-gradient(90deg,#0ea5e9,#38bdf8)"
                    : optional
                    ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
                    : "linear-gradient(90deg,#6366f1,#818cf8)"
                  : "#e2e8f0",
            }}
          />
        </div>

        {optional && bypass != null && (
          <div className="mt-1.5 text-[11px] text-amber-700">
            ↳ {bypass.toLocaleString()} skipped
            {bypassShare != null ? ` (${Math.round(bypassShare * 100)}%)` : ""}
          </div>
        )}

        {(hasNote || hasLinks) && (
          <div className="flex items-center gap-2 mt-2 text-slate-400">
            {hasNote && <FileText size={12} aria-label="Has notes" />}
            {hasLinks && (
              <span className="flex items-center gap-0.5 text-xs" aria-label="Has links">
                <LinkIcon size={12} />
                {step.links.filter((l) => l.url).length}
              </span>
            )}
          </div>
        )}


        {editable && (
          <div className="flex items-center gap-0.5 mt-2 -ml-1">
            <button
              onClick={onMoveL}
              disabled={!onMoveL}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-30"
              aria-label="Move left"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={onMoveR}
              disabled={!onMoveR}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-30"
              aria-label="Move right"
            >
              <ChevronRight size={14} />
            </button>
            <button
              onClick={onEdit}
              className="p-1 rounded hover:bg-slate-100 text-slate-400"
              aria-label="Edit step"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={onDel}
              className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"
              aria-label="Delete step"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
