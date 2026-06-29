"use client";

import { fmtNum, fmtPct } from "@/lib/compute";

// A single step rendered in the funnel rail.
export default function StepCard({
  step,
  value,
  retention,
  device,
  editable,
  onEdit,
  onMoveLeft,
  onMoveRight,
  onLightbox,
  compact,
}) {
  const hasNotes = step.notes && step.notes.trim().length > 0;
  const hasLinks = (step.links || []).some((l) => l.url);
  const barWidth =
    retention === null || retention === undefined
      ? 100
      : Math.max(6, Math.min(100, retention * 100));

  return (
    <div
      className={`flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm ${
        compact ? "w-44" : "w-56"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-3 pt-2.5">
        <h3
          className="line-clamp-2 text-sm font-semibold leading-tight"
          title={step.title}
        >
          {step.title}
        </h3>
        {(hasNotes || hasLinks) && (
          <span
            className="mt-0.5 flex shrink-0 gap-1 text-xs"
            title={[hasNotes && "Has notes", hasLinks && "Has links"]
              .filter(Boolean)
              .join(" · ")}
          >
            {hasNotes && <span aria-label="Has notes">📝</span>}
            {hasLinks && <span aria-label="Has links">🔗</span>}
          </span>
        )}
      </div>

      {/* Screenshot */}
      <div className="px-3 pt-2">
        {step.screenshotUrl ? (
          <button
            className="block w-full overflow-hidden rounded-md border border-slate-200"
            onClick={() => onLightbox?.(step.screenshotUrl, step.title)}
            aria-label="View screenshot full size"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={step.screenshotUrl}
              alt={step.title}
              className="h-24 w-full object-cover"
            />
          </button>
        ) : (
          <div className="flex h-24 w-full items-center justify-center rounded-md border border-dashed border-slate-200 text-xs text-slate-300">
            No screenshot
          </div>
        )}
      </div>

      {/* Numbers */}
      <div className="px-3 py-2">
        <div className="flex items-baseline justify-between">
          <span className="text-lg font-bold tabular-nums">{fmtNum(value)}</span>
          <span className="text-xs text-slate-400">
            {retention !== null && retention !== undefined
              ? `${fmtPct(retention)} kept`
              : ""}
          </span>
        </div>
        {/* Retention bar (narrows down the funnel) */}
        <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-blue-500"
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      {editable && (
        <div className="flex items-center justify-between border-t border-slate-100 px-2 py-1.5">
          <div className="flex gap-1">
            <button
              className="rounded px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30"
              onClick={onMoveLeft}
              disabled={!onMoveLeft}
              aria-label="Move left"
            >
              ←
            </button>
            <button
              className="rounded px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30"
              onClick={onMoveRight}
              disabled={!onMoveRight}
              aria-label="Move right"
            >
              →
            </button>
          </div>
          <button
            className="rounded px-2 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
            onClick={onEdit}
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
