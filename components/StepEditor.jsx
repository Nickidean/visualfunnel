"use client";

import { useEffect } from "react";
import ScreenshotInput from "./ScreenshotInput";
import { AVAILABILITY, parseCount } from "@/lib/model";

const AVAIL_LABEL = {
  both: "Both devices",
  desktop: "Desktop only",
  mobile: "Mobile only",
};

export default function StepEditor({
  step,
  busy,
  onField,
  onData,
  onAvailability,
  onUploadScreenshot,
  onClearScreenshot,
  onAddLink,
  onUpdateLink,
  onRemoveLink,
  onDelete,
  onClose,
}) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!step) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30">
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label={`Edit step: ${step.title}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-base font-semibold">Edit step</h2>
          <button
            className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
            onClick={onClose}
          >
            Done ✕
          </button>
        </div>

        <div className="space-y-5 px-5 py-4">
          {/* Title */}
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">
              Title
            </span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={step.title}
              onChange={(e) => onField("title", e.target.value)}
            />
          </label>

          {/* Screenshot */}
          <div>
            <span className="mb-1 block text-xs font-medium text-slate-500">
              Screenshot
            </span>
            <ScreenshotInput
              src={step.screenshotUrl}
              busy={busy}
              onFile={onUploadScreenshot}
              onClear={onClearScreenshot}
            />
          </div>

          {/* Per-device data */}
          <div>
            <span className="mb-1 block text-xs font-medium text-slate-500">
              Visitors per device
            </span>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-[11px] text-slate-400">
                  Desktop
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={step.data?.desktop ?? ""}
                  onChange={(e) => onData("desktop", parseCount(e.target.value))}
                  placeholder="—"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] text-slate-400">
                  Mobile
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={step.data?.mobile ?? ""}
                  onChange={(e) => onData("mobile", parseCount(e.target.value))}
                  placeholder="—"
                />
              </label>
            </div>
          </div>

          {/* Availability */}
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">
              Availability
            </span>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={step.availability || "both"}
              onChange={(e) => onAvailability(e.target.value)}
            >
              {AVAILABILITY.map((a) => (
                <option key={a} value={a}>
                  {AVAIL_LABEL[a]}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[11px] text-slate-400">
              Steps for one device do not appear in the other device&apos;s funnel.
            </span>
          </label>

          {/* Notes */}
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">
              Notes
            </span>
            <textarea
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={step.notes || ""}
              onChange={(e) => onField("notes", e.target.value)}
              placeholder="What's happening on this screen, hypotheses, test results…"
            />
          </label>

          {/* Links */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Links</span>
              <button
                className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-100"
                onClick={onAddLink}
              >
                + Add link
              </button>
            </div>
            <div className="space-y-2">
              {(step.links || []).map((link) => (
                <div key={link.id} className="flex items-center gap-2">
                  <input
                    className="w-1/3 rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                    placeholder="Label"
                    value={link.label}
                    onChange={(e) =>
                      onUpdateLink(link.id, { label: e.target.value })
                    }
                  />
                  <input
                    className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                    placeholder="https://…"
                    value={link.url}
                    onChange={(e) =>
                      onUpdateLink(link.id, { url: e.target.value })
                    }
                  />
                  <button
                    className="rounded px-1.5 py-1 text-xs text-red-600 hover:bg-red-50"
                    onClick={() => onRemoveLink(link.id)}
                    aria-label="Remove link"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {(!step.links || step.links.length === 0) && (
                <p className="text-xs text-slate-400">
                  No links yet. Add a label + URL, e.g. &quot;A/B test deck&quot;.
                </p>
              )}
            </div>
          </div>

          {/* Delete */}
          <div className="border-t border-slate-200 pt-4">
            <button
              className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              onClick={onDelete}
            >
              Delete step
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
