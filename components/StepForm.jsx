"use client";

import { useEffect, useRef, useState } from "react";
import { X, Upload, Plus, Mail, MonitorSmartphone } from "lucide-react";
import { uid, parseCount, AVAILABILITY } from "@/lib/model";

const AVAIL_LABEL = {
  both: "Both devices",
  desktop: "Desktop only",
  mobile: "Mobile only",
};

// Modal add/edit form, mirroring the prototype, extended with per-device
// visitor numbers and a device-availability setting.
export default function StepForm({
  mode,
  dest,
  initial,
  defaultKind = "screen",
  uploadScreenshot,
  onCancel,
  onSave,
}) {
  const [kind, setKind] = useState(initial?.kind || defaultKind);
  const [title, setTitle] = useState(initial?.title || "");
  const [note, setNote] = useState(initial?.notes || "");
  const [desktop, setDesktop] = useState(initial?.data?.desktop ?? "");
  const [mobile, setMobile] = useState(initial?.data?.mobile ?? "");
  const [sent, setSent] = useState(initial?.sent ?? "");
  const [availability, setAvailability] = useState(initial?.availability || "both");
  const [optional, setOptional] = useState(!!initial?.optional);
  const [image, setImage] = useState(initial?.screenshotUrl || null);
  const [links, setLinks] = useState(
    initial?.links ? initial.links.map((l) => ({ ...l })) : []
  );
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  async function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    setBusy(true);
    try {
      const url = await uploadScreenshot(file);
      setImage(url);
    } catch (e) {
      console.error("Upload failed", e);
      window.alert("Screenshot upload failed. See console for details.");
    } finally {
      setBusy(false);
    }
  }

  // Paste-to-upload while the modal is open.
  useEffect(() => {
    const onPaste = (e) => {
      for (const it of e.clipboardData?.items || []) {
        if (it.type.startsWith("image/")) {
          handleFile(it.getAsFile());
          e.preventDefault();
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escape to cancel.
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const addLinkRow = () =>
    setLinks((l) => [...l, { id: uid("link"), label: "", url: "" }]);
  const updLink = (id, k, v) =>
    setLinks((l) => l.map((x) => (x.id === id ? { ...x, [k]: v } : x)));
  const delLink = (id) => setLinks((l) => l.filter((x) => x.id !== id));

  function save() {
    if (!title.trim() && !image) return;
    const cleanLinks = links
      .filter((l) => l.url.trim())
      .map((l) => ({
        id: l.id,
        label: l.label.trim() || l.url.trim(),
        url: l.url.trim(),
      }));
    if (kind === "comms") {
      onSave({
        kind: "comms",
        title: title.trim() || "Untitled",
        notes: note.trim(),
        links: cleanLinks,
        screenshotUrl: image || null,
        sent: parseCount(sent),
        // comms aren't part of the device-split funnel maths
        data: { desktop: null, mobile: null },
        availability: "both",
        optional: false,
      });
      return;
    }
    onSave({
      kind: "screen",
      title: title.trim() || "Untitled",
      notes: note.trim(),
      links: cleanLinks,
      screenshotUrl: image || null,
      data: { desktop: parseCount(desktop), mobile: parseCount(mobile) },
      availability,
      optional,
      sent: null,
    });
  }

  const heading =
    mode === "edit"
      ? "Edit step"
      : dest === "lane"
      ? "Add step to lane"
      : "Add step";

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-40 overflow-auto"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md p-5 shadow-xl my-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={heading}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">{heading}</h2>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Type */}
        <div className="mb-4 inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setKind("screen")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
              kind === "screen" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <MonitorSmartphone size={14} /> Screen
          </button>
          <button
            type="button"
            onClick={() => setKind("comms")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
              kind === "comms" ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Mail size={14} /> Comms
          </button>
        </div>

        {/* Screenshot / creative dropzone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className="border-2 border-dashed border-slate-300 rounded-xl mb-4 cursor-pointer hover:border-indigo-400 overflow-hidden"
        >
          {image ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt="preview"
                className="w-full object-contain"
                style={{ maxHeight: "180px" }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImage(null);
                }}
                className="absolute top-2 right-2 bg-white/90 rounded-full p-1 shadow"
                aria-label="Remove screenshot"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center gap-1.5 text-slate-400 text-sm">
              <Upload size={20} />
              <span>{busy ? "Uploading…" : "Click, drop or paste a screenshot"}</span>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {/* Title */}
        <label className="block text-sm font-medium mb-1">Step title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          placeholder="e.g. Enter your postcode"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-3"
        />

        {/* Notes */}
        <label className="block text-sm font-medium mb-1">
          Notes <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Context, hypotheses, what the data showed..."
          className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-3 resize-y"
        />

        {/* Links */}
        <label className="block text-sm font-medium mb-1">
          Links <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <div className="space-y-2 mb-2">
          {links.map((l) => (
            <div key={l.id} className="flex gap-2 items-center">
              <input
                value={l.label}
                onChange={(e) => updLink(l.id, "label", e.target.value)}
                placeholder="Label e.g. A/B test deck"
                className="w-2/5 border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
              />
              <input
                value={l.url}
                onChange={(e) => updLink(l.id, "url", e.target.value)}
                placeholder="https://..."
                className="flex-1 border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
              />
              <button
                onClick={() => delLink(l.id)}
                className="text-slate-300 hover:text-rose-500 shrink-0"
                aria-label="Remove link"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addLinkRow}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 mb-4"
        >
          <Plus size={14} /> Add link
        </button>

        {kind === "screen" ? (
          <>
        {/* Conditional step */}
        <label className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <input
            type="checkbox"
            checked={optional}
            onChange={(e) => setOptional(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-sm">
            <span className="font-medium text-amber-800">Conditional step</span>
            <span className="mt-0.5 block text-xs text-amber-700">
              Users are routed here only when a condition is met (e.g. we can&apos;t
              find their meter reference); everyone else continues to the next
              step. The funnel measures drop-off and conversion around it, not
              through it. Use the notes above to explain the condition.
            </span>
          </span>
        </label>

        {/* Per-device visitors */}
        <label className="block text-sm font-medium mb-1">
          {optional ? "Visitors who went through" : "Visitors at this step"}{" "}
          <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <span className="block text-xs text-slate-400 mb-1">Desktop</span>
            <input
              value={desktop}
              onChange={(e) => setDesktop(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 10000"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <span className="block text-xs text-slate-400 mb-1">Mobile</span>
            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 8000"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* Availability */}
        <label className="block text-sm font-medium mb-1">Availability</label>
        <select
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-1"
        >
          {AVAILABILITY.map((a) => (
            <option key={a} value={a}>
              {AVAIL_LABEL[a]}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-400 mb-5">
          Steps for one device do not appear in the other device&apos;s funnel.
        </p>
          </>
        ) : (
          <>
            <label className="block text-sm font-medium mb-1">
              Sent <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              value={sent}
              onChange={(e) => setSent(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 25000"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-2"
            />
            <p className="text-xs text-slate-400 mb-5">
              A comms touchpoint (email, SMS, letter). It appears in the flow, but
              the funnel measures drop-off and conversion around it, not through it.
            </p>
          </>
        )}

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 border border-slate-300 rounded-lg py-2.5 font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 font-medium"
          >
            {mode === "edit" ? "Save" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
