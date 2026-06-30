"use client";

import { headlineText, scopeLabel } from "@/lib/tests";

const VERDICT_STYLE = {
  won: "bg-emerald-100 text-emerald-700",
  flat: "bg-slate-100 text-slate-600",
  lost: "bg-rose-100 text-rose-700",
};

// Board card: name, linked step(s), headline metric, verdict. Nothing more —
// the full detail is one click away.
export default function TestCard({ test, titleMap, onOpen }) {
  const headline = headlineText(test);
  return (
    <button
      onClick={onOpen}
      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm hover:border-slate-300 hover:shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold leading-tight">{test.name}</h4>
        {test.status === "completed" && test.verdict && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              VERDICT_STYLE[test.verdict] || "bg-slate-100 text-slate-600"
            }`}
          >
            {test.verdict[0].toUpperCase() + test.verdict.slice(1)}
          </span>
        )}
      </div>

      <div className="mt-1 truncate text-xs text-slate-400" title={scopeLabel(test, titleMap)}>
        {scopeLabel(test, titleMap)}
      </div>

      {headline && (
        <div className="mt-2 rounded bg-slate-50 px-2 py-1 text-xs text-slate-600">
          {headline}
        </div>
      )}
    </button>
  );
}
