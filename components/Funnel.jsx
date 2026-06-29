"use client";

import StepCard from "./StepCard";
import { fmtNum, fmtPct } from "@/lib/compute";

function DropChip({ drop }) {
  if (!drop) return <div className="w-6 shrink-0" />;
  const positive = drop.abs > 0;
  return (
    <div className="flex w-16 shrink-0 flex-col items-center justify-center self-center text-center">
      <div className="text-slate-300">→</div>
      <div
        className={`mt-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
          positive ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
        }`}
        title="Drop-off from previous step"
      >
        {positive ? "−" : "+"}
        {fmtNum(Math.abs(drop.abs))}
      </div>
      <div className="text-[10px] text-slate-400">{fmtPct(drop.pct)}</div>
    </div>
  );
}

function ForkBlock({ col, device, editable, actions }) {
  return (
    <div className="shrink-0 rounded-xl border border-dashed border-violet-300 bg-violet-50/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-violet-600">
          Fork
        </span>
        {editable && (
          <div className="flex gap-1">
            <button
              className="rounded border border-violet-200 bg-white px-2 py-0.5 text-xs hover:bg-violet-50"
              onClick={() => actions.onAddLane(col.id)}
            >
              + Lane
            </button>
            <button
              className="rounded px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50"
              onClick={() => actions.onRemoveFork(col.id)}
            >
              Remove fork
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {col.lanes.map((lane) => (
          <div key={lane.id} className="rounded-lg bg-white/70 p-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {editable ? (
                  <input
                    className="w-32 rounded border border-slate-300 px-2 py-0.5 text-sm font-medium"
                    value={lane.name}
                    onChange={(e) =>
                      actions.onRenameLane(col.id, lane.id, e.target.value)
                    }
                    aria-label="Lane name"
                  />
                ) : (
                  <span className="text-sm font-medium">{lane.name}</span>
                )}
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                  {lane.share !== null && lane.share !== undefined
                    ? `${fmtPct(lane.share)} of traffic`
                    : "—"}
                </span>
              </div>
              {editable && (
                <div className="flex gap-1">
                  <button
                    className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs hover:bg-slate-100"
                    onClick={() => actions.onAddStepToLane(col.id, lane.id)}
                  >
                    + Step
                  </button>
                  <button
                    className="rounded px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-30"
                    onClick={() => actions.onRemoveLane(col.id, lane.id)}
                    aria-label="Remove lane"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-stretch gap-2">
              {lane.steps.map((ls, i) => (
                <div key={ls.step.id} className="flex items-stretch">
                  {i > 0 && <div className="w-3 self-center text-slate-300">→</div>}
                  <StepCard
                    step={ls.step}
                    value={ls.value}
                    retention={ls.retention}
                    device={device}
                    editable={editable}
                    compact
                    onEdit={() => actions.onEditStep(ls.step.id)}
                    onMoveLeft={
                      editable && i > 0
                        ? () => actions.onMoveStep(ls.step.id, "left")
                        : undefined
                    }
                    onMoveRight={
                      editable && i < lane.steps.length - 1
                        ? () => actions.onMoveStep(ls.step.id, "right")
                        : undefined
                    }
                    onLightbox={actions.onLightbox}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Funnel({ vm, device, editable = false, actions = {} }) {
  if (!vm.columns.length) {
    return (
      <p className="py-12 text-center text-sm text-slate-400">
        No steps in this device view yet.
      </p>
    );
  }

  // Count top-level step columns for move-button enabling.
  const stepCols = vm.columns.filter((c) => c.kind === "step");

  return (
    <div className="funnel-rail overflow-x-auto pb-4">
      <div className="flex items-stretch gap-0">
        {vm.columns.map((col, idx) => (
          <div key={col.kind === "step" ? col.step.id : col.id} className="flex">
            {idx > 0 && <DropChip drop={col.drop} />}
            {col.kind === "step" ? (
              <StepCard
                step={col.step}
                value={col.flow}
                retention={col.retention}
                device={device}
                editable={editable}
                onEdit={() => actions.onEditStep(col.step.id)}
                onMoveLeft={
                  editable && stepCols[0]?.step.id !== col.step.id
                    ? () => actions.onMoveStep(col.step.id, "left")
                    : undefined
                }
                onMoveRight={
                  editable &&
                  stepCols[stepCols.length - 1]?.step.id !== col.step.id
                    ? () => actions.onMoveStep(col.step.id, "right")
                    : undefined
                }
                onLightbox={actions.onLightbox}
              />
            ) : (
              <ForkBlock
                col={col}
                device={device}
                editable={editable}
                actions={actions}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
