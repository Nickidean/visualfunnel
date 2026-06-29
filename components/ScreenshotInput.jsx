"use client";

import { useRef, useState } from "react";

// Screenshot input supporting upload, drag-and-drop and paste.
// Calls onFile(file) with the selected image File.
export default function ScreenshotInput({ src, onFile, onClear, busy }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  function handleFiles(files) {
    const file = Array.from(files || []).find((f) => f.type.startsWith("image/"));
    if (file) onFile(file);
  }

  function onPaste(e) {
    const items = e.clipboardData?.items || [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          onFile(file);
          e.preventDefault();
          return;
        }
      }
    }
  }

  return (
    <div
      className={`relative rounded-lg border-2 border-dashed p-3 text-center transition ${
        drag ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handleFiles(e.dataTransfer.files);
      }}
      onPaste={onPaste}
      tabIndex={0}
      aria-label="Screenshot: click to upload, or drag, or paste an image"
    >
      {src ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="Step screenshot"
            className="mx-auto max-h-44 rounded object-contain"
          />
          <div className="flex justify-center gap-2">
            <button
              type="button"
              className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs hover:bg-slate-100"
              onClick={() => inputRef.current?.click()}
            >
              Replace
            </button>
            <button
              type="button"
              className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
              onClick={onClear}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="w-full py-6 text-sm text-slate-500"
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Uploading…" : "Click to upload, or drag / paste an image"}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
