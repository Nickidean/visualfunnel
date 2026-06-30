"use client";

import { useEffect, useRef, useState } from "react";
import { X, Plus, Trash2, Star, Upload } from "lucide-react";
import {
  VERDICTS,
  DECISIONS,
  TEST_STATUSES,
  STATUS_LABEL,
  newMetricRow,
  suggestChange,
} from "@/lib/tests";
import { uid } from "@/lib/model";

const VERDICT_LABEL = { won: "Won", flat: "Flat", lost: "Lost" };
const DECISION_LABEL = { shipped: "Shipped", dropped: "Dropped", iterate: "Iterate" };

// Edit/view a single test. Holds a local copy and pushes every change up via
// onChange (the parent persists through the journey's autosave).
export default function TestDetail({
  test,
  steps,
  uploadScreenshot,
  onChange,
  onDelete,
  onClose,
  onLightbox,
}) {
  const [t, setT] = useState(test);
  const [busy, setBusy] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const fileRef = useRef(null);

  function set(patch) {
    const next = { ...t, ...patch };
    setT(next);
    onChangeRef.current?.(next);
  }

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* metrics */
  function updateMetric(id, patch) {
    const metrics = (t.metrics || []).map((m) => {
      if (m.id !== id) return m;
      const merged = { ...m, ...patch };
      // Auto-fill change when the user hasn't set their own.
      if (
        ("variant" in patch || "control" in patch) &&
        (!m.change || m.change === suggestChange(m.variant, m.control))
      ) {
        merged.change = suggestChange(merged.variant, merged.control);
      }
      return merged;
    });
    set({ metrics });
  }
  function addMetric() {
    set({ metrics: [...(t.metrics || []), newMetricRow()] });
  }
  function removeMetric(id) {
    set({ metrics: (t.metrics || []).filter((m) => m.id !== id) });
  }
  function setHeadline(id) {
    set({
      metrics: (t.metrics || []).map((m) => ({ ...m, headline: m.id === id })),
    });
  }

  /* scope */
  function toggleStep(id) {
    const has = (t.stepIds || []).includes(id);
    set({
      stepIds: has
        ? t.stepIds.filter((x) => x !== id)
        : [...(t.stepIds || []), id],
    });
  }

  /* images */
  async function handleFiles(files) {
    const imgs = Array.from(files || []).filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return;
    setBusy(true);
    try {
      const uploaded = [];
      for (const f of imgs) {
        const url = await uploadScreenshot(f);
        uploaded.push({ id: uid("img"), url });
      }
      set({ beforeAfter: [...(t.beforeAfter || []), ...uploaded] });
    } catch (e) {
      console.error("Image upload failed", e);
      window.alert("Image upload failed. See console for details.");
    } finally {
      setBusy(false);
    }
  }
  function removeImage(id) {
    set({ beforeAfter: (t.beforeAfter || []).filter((i) => i.id !== id) });
  }

  /* links */
  function addLink() {
    set({ links: [...(t.links || []), { id: uid("link"), label: "", url: "" }] });
  }
  function updateLink(id, patch) {
    set({
      links: (t.links || []).map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });
  }
  function removeLink(id) {
    set({ links: (t.links || []).filter((l) => l.id !== id) });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div
        className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label={`Test: ${t.name}`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <h2 className="text-base font-semibold">Test</h2>
          <div className="flex items-center gap-2">
            <button
              className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              onClick={onDelete}
            >
              Delete
            </button>
            <button
              className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              onClick={onClose}
            >
              Done ✕
            </button>
          </div>
        </div>

        <div className="space-y-6 px-5 py-4">
          {/* Name + hypothesis */}
          <div className="space-y-3">
            <Field label="Name">
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={t.name}
                onChange={(e) => set({ name: e.target.value })}
              />
            </Field>
            <Field label="Hypothesis">
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="e.g. Reducing density will keep focus on next steps"
                value={t.hypothesis}
                onChange={(e) => set({ hypothesis: e.target.value })}
              />
            </Field>
          </div>

          {/* Scope */}
          <Field as="div" label="Scope — which part of the funnel this touches">
            <div className="mb-2 flex gap-2">
              <Toggle
                active={!t.funnelWide}
                onClick={() => set({ funnelWide: false })}
              >
                Specific step(s)
              </Toggle>
              <Toggle
                active={t.funnelWide}
                onClick={() => set({ funnelWide: true })}
              >
                Whole funnel
              </Toggle>
            </div>
            {!t.funnelWide && (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
                {steps.length === 0 && (
                  <p className="px-1 text-xs text-slate-400">
                    No steps in this journey yet.
                  </p>
                )}
                {steps.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={(t.stepIds || []).includes(s.id)}
                      onChange={() => toggleStep(s.id)}
                    />
                    <span>{s.title}</span>
                    {s.lane && (
                      <span className="text-xs text-slate-400">({s.lane})</span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </Field>

          {/* Status / verdict / decision */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field as="div" label="Status">
              <div className="flex gap-1">
                {TEST_STATUSES.map((s) => (
                  <Toggle
                    key={s}
                    active={t.status === s}
                    onClick={() =>
                      set({
                        status: s,
                        // clear verdict if no longer completed
                        verdict: s === "completed" ? t.verdict : null,
                      })
                    }
                    small
                  >
                    {STATUS_LABEL[s]}
                  </Toggle>
                ))}
              </div>
            </Field>
            <Field as="div" label="Verdict (when completed)">
              <div className="flex gap-1">
                {VERDICTS.map((v) => (
                  <Toggle
                    key={v}
                    active={t.verdict === v}
                    disabled={t.status !== "completed"}
                    onClick={() => set({ verdict: v })}
                    small
                  >
                    {VERDICT_LABEL[v]}
                  </Toggle>
                ))}
              </div>
            </Field>
            <Field as="div" label="Decision">
              <div className="flex gap-1">
                {DECISIONS.map((d) => (
                  <Toggle
                    key={d}
                    active={t.decision === d}
                    onClick={() => set({ decision: d })}
                    small
                  >
                    {DECISION_LABEL[d]}
                  </Toggle>
                ))}
              </div>
            </Field>
          </div>

          {/* Exposure + dates */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Exposure (% of traffic)">
              <input
                type="number"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="e.g. 50"
                value={t.exposure ?? ""}
                onChange={(e) =>
                  set({ exposure: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Start date">
              <input
                type="date"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={t.startDate || ""}
                onChange={(e) => set({ startDate: e.target.value })}
              />
            </Field>
            <Field label="End date">
              <input
                type="date"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={t.endDate || ""}
                onChange={(e) => set({ endDate: e.target.value })}
              />
            </Field>
          </div>

          {/* Metrics table */}
          <Field as="div" label="Metrics — mark one row as the headline (★)">
            <div className="overflow-hidden rounded-md border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium">★</th>
                    <th className="px-2 py-1.5 text-left font-medium">Metric</th>
                    <th className="px-2 py-1.5 text-left font-medium">Variant</th>
                    <th className="px-2 py-1.5 text-left font-medium">Control</th>
                    <th className="px-2 py-1.5 text-left font-medium">Change</th>
                    <th className="px-2 py-1.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {(t.metrics || []).map((m) => (
                    <tr key={m.id} className="border-t border-slate-100">
                      <td className="px-2 py-1">
                        <button
                          onClick={() => setHeadline(m.id)}
                          aria-label="Mark as headline metric"
                          className={m.headline ? "text-amber-500" : "text-slate-300 hover:text-slate-400"}
                        >
                          <Star size={15} fill={m.headline ? "currentColor" : "none"} />
                        </button>
                      </td>
                      <td className="px-1 py-1">
                        <input
                          className="w-full rounded border border-transparent px-1 py-1 hover:border-slate-200 focus:border-slate-300"
                          placeholder="e.g. Progression to quote"
                          value={m.label}
                          onChange={(e) => updateMetric(m.id, { label: e.target.value })}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          className="w-20 rounded border border-transparent px-1 py-1 hover:border-slate-200 focus:border-slate-300"
                          value={m.variant}
                          onChange={(e) => updateMetric(m.id, { variant: e.target.value })}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          className="w-20 rounded border border-transparent px-1 py-1 hover:border-slate-200 focus:border-slate-300"
                          value={m.control}
                          onChange={(e) => updateMetric(m.id, { control: e.target.value })}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          className="w-20 rounded border border-transparent px-1 py-1 hover:border-slate-200 focus:border-slate-300"
                          value={m.change}
                          onChange={(e) => updateMetric(m.id, { change: e.target.value })}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <button
                          onClick={() => removeMetric(m.id)}
                          className="text-slate-300 hover:text-red-500"
                          aria-label="Remove metric"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={addMetric}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              <Plus size={14} /> Add metric
            </button>
          </Field>

          {/* Incremental sales */}
          <Field label="Incremental sales (feeds the board's combined impact)">
            <input
              type="number"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g. 1200"
              value={t.incrementalSales ?? ""}
              onChange={(e) =>
                set({
                  incrementalSales: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </Field>

          {/* Notes */}
          <Field label="Notes — key results write-up">
            <textarea
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={t.notes}
              onChange={(e) => set({ notes: e.target.value })}
            />
          </Field>

          {/* Before / after images */}
          <Field as="div" label="Before & after">
            <div className="flex flex-wrap gap-2">
              {(t.beforeAfter || []).map((img) => (
                <div key={img.id} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt="Before/after"
                    className="h-28 w-40 cursor-pointer rounded-md border border-slate-200 object-cover"
                    onClick={() => onLightbox?.(img.url, "Before/after")}
                  />
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute right-1 top-1 rounded-full bg-white/90 p-1 shadow"
                    aria-label="Remove image"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                className="flex h-28 w-40 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-slate-300 text-xs text-slate-400 hover:border-indigo-400 hover:text-indigo-500"
              >
                <Upload size={18} />
                {busy ? "Uploading…" : "Add image"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          </Field>

          {/* Links */}
          <Field as="div" label="Links — analysis, deck, research">
            <div className="space-y-2">
              {(t.links || []).map((l) => (
                <div key={l.id} className="flex items-center gap-2">
                  <input
                    className="w-1/3 rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                    placeholder="Label"
                    value={l.label}
                    onChange={(e) => updateLink(l.id, { label: e.target.value })}
                  />
                  <input
                    className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                    placeholder="https://…"
                    value={l.url}
                    onChange={(e) => updateLink(l.id, { url: e.target.value })}
                  />
                  <button
                    onClick={() => removeLink(l.id)}
                    className="text-slate-300 hover:text-red-500"
                    aria-label="Remove link"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addLink}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              <Plus size={14} /> Add link
            </button>
          </Field>
        </div>
      </div>
    </div>
  );
}

// `as="label"` (default) for a single input — keeps a proper label association.
// `as="div"` for groups of buttons/rows, so accessible names stay clean.
function Field({ label, as: Tag = "label", children }) {
  return (
    <Tag className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </Tag>
  );
}

function Toggle({ active, disabled, small, onClick, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md font-medium transition ${
        small ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
      } ${
        active
          ? "bg-slate-900 text-white"
          : "border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
      }`}
    >
      {children}
    </button>
  );
}
