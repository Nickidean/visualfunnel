"use client";

import { Plus } from "lucide-react";
import TestCard from "./TestCard";
import { STATUS_LABEL, TEST_STATUSES, VERDICTS } from "@/lib/tests";

function fmtMoney(n) {
  return "£" + Math.round(n).toLocaleString();
}

export default function TestsBoard({
  tests,
  titleMap,
  steps,
  stats,
  valuePerSale,
  stepFilter,
  verdictFilter,
  onStepFilter,
  onVerdictFilter,
  onSetValuePerSale,
  onNewTest,
  onOpenTest,
}) {
  // Apply filters.
  const filtered = tests.filter((t) => {
    if (stepFilter && !(t.stepIds || []).includes(stepFilter)) return false;
    if (verdictFilter && t.verdict !== verdictFilter) return false;
    return true;
  });

  const byStatus = (s) => filtered.filter((t) => t.status === s);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-5">
      {/* Summary strip — the bit that gets screenshotted into an update */}
      <div className="mb-5 flex flex-wrap items-stretch gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <Stat label="Live now" value={stats.live} />
        <Stat label="Completed this quarter" value={stats.completedThisQuarter} />
        <Stat label="Won" value={stats.won} />
        <Stat
          label="Combined incremental sales"
          value={stats.incremental ? stats.incremental.toLocaleString() : "0"}
          sub={
            stats.poundImpact != null ? `${fmtMoney(stats.poundImpact)} impact` : null
          }
          strong
        />
        <div className="ml-auto flex flex-col justify-center">
          <label className="text-[11px] uppercase tracking-wide text-slate-400">
            Value per sale (£)
          </label>
          <input
            type="number"
            value={valuePerSale ?? ""}
            onChange={(e) => onSetValuePerSale(e.target.value)}
            placeholder="set to see £"
            className="mt-0.5 w-32 rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={onNewTest}
          className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={16} /> New test
        </button>
        <span className="ml-2 text-xs text-slate-400">Filter:</span>
        <select
          value={stepFilter || ""}
          onChange={(e) => onStepFilter(e.target.value || null)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">All steps</option>
          {steps.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        <select
          value={verdictFilter || ""}
          onChange={(e) => onVerdictFilter(e.target.value || null)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">Any verdict</option>
          {VERDICTS.map((v) => (
            <option key={v} value={v}>
              {v[0].toUpperCase() + v.slice(1)}
            </option>
          ))}
        </select>
        {(stepFilter || verdictFilter) && (
          <button
            onClick={() => {
              onStepFilter(null);
              onVerdictFilter(null);
            }}
            className="text-xs text-slate-500 underline hover:text-slate-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {TEST_STATUSES.map((status) => {
          const col = byStatus(status);
          return (
            <div key={status} className="rounded-xl bg-slate-100/70 p-3">
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold">{STATUS_LABEL[status]}</h3>
                <span className="text-xs text-slate-400">{col.length}</span>
              </div>
              <div className="space-y-2">
                {col.map((t) => (
                  <TestCard
                    key={t.id}
                    test={t}
                    titleMap={titleMap}
                    onOpen={() => onOpenTest(t.id)}
                  />
                ))}
                {col.length === 0 && (
                  <p className="px-1 py-6 text-center text-xs text-slate-400">
                    Nothing here yet.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, sub, strong }) {
  return (
    <div className="min-w-[7rem]">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div
        className={`tabular-nums ${
          strong ? "text-2xl font-bold text-indigo-600" : "text-2xl font-bold"
        }`}
      >
        {value}
      </div>
      {sub && <div className="text-xs font-medium text-emerald-600">{sub}</div>}
    </div>
  );
}
