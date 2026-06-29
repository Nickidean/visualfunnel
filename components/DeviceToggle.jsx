"use client";

const OPTIONS = [
  { value: "desktop", label: "Desktop" },
  { value: "mobile", label: "Mobile" },
  { value: "combined", label: "Combined" },
];

export default function DeviceToggle({ value, onChange, size = "md" }) {
  const pad = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm";
  return (
    <div
      role="radiogroup"
      aria-label="Device view"
      className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5"
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`${pad} rounded-md font-medium transition ${
              active
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
