"use client";

import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
} from "lucide-react";

// A single step rendered in the funnel rail (prototype styling).
// `value` and `retention` come pre-computed from the device view-model.
export default function StepCard({
  step,
  value,
  retention,
  small,
  editable,
  onEdit,
  onMoveL,
  onMoveR,
  onDel,
  onLightbox,
}) {
  const r = retention;
  const w = r != null ? Math.max(r * 100, 8) : 100;
  const hasLinks = step.links && step.links.some((l) => l.url);
  const hasNote = step.notes && step.notes.trim();

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm ${
        small ? "w-44" : "w-52"
      } shrink-0`}
    >
      <button
        onClick={() => step.screenshotUrl && onLightbox?.(step.screenshotUrl, step.title)}
        className="w-full bg-slate-100 rounded-t-xl flex items-center justify-center overflow-hidden"
        style={{ height: small ? "84px" : "104px" }}
        aria-label={step.screenshotUrl ? "View screenshot full size" : "No screenshot"}
      >
        {step.screenshotUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={step.screenshotUrl}
            alt={step.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon size={20} className="text-slate-300" />
        )}
      </button>

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
          {r != null && (
            <span className="text-xs text-slate-400">{Math.round(r * 100)}%</span>
          )}
        </div>

        <div className="h-2 mt-1.5">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${w}%`,
              background:
                value != null
                  ? "linear-gradient(90deg,#6366f1,#818cf8)"
                  : "#e2e8f0",
            }}
          />
        </div>

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
