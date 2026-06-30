"use client";

import React from "react";
import { GitFork, GitMerge, Trash2, Plus, Mail } from "lucide-react";
import StepCard from "./StepCard";

const Conn = ({ children }) => (
  <div className="flex flex-col items-center justify-center shrink-0 px-1 self-center">
    {children || <span className="text-slate-300 text-xl">→</span>}
  </div>
);

function dropChip(prevVal, val) {
  if (prevVal != null && val != null && prevVal !== 0 && prevVal > val) {
    return (
      <span className="text-rose-600 text-xs font-medium whitespace-nowrap">
        ↓{Math.round(((prevVal - val) / prevVal) * 100)}%
      </span>
    );
  }
  return null;
}

// Drop chip from a column's pre-computed drop (which already measures around
// optional steps), so the figure after an optional detour is right.
function dropChipFromCol(col) {
  const d = col.drop;
  if (d && d.abs > 0) {
    return (
      <span className="text-rose-600 text-xs font-medium whitespace-nowrap">
        ↓{Math.round((d.pct || 0) * 100)}%
      </span>
    );
  }
  return null;
}

export default function Funnel({ vm, editable = false, actions = {} }) {
  const cols = vm.columns;
  const stepCols = cols.filter((c) => c.kind === "step");
  const firstStepId = stepCols[0]?.step.id;
  const lastStepId = stepCols[stepCols.length - 1]?.step.id;

  return (
    <div className="overflow-x-auto pb-4 funnel-rail">
      <div className="flex items-start gap-1" style={{ minWidth: "min-content" }}>
        {cols.map((col, i) => (
          <React.Fragment key={col.kind === "step" ? col.step.id : col.id}>
            {i > 0 && (
              <Conn>
                {col.kind === "fork" ? (
                  <span className="text-indigo-400" title="splits">
                    <GitFork size={18} />
                  </span>
                ) : cols[i - 1].kind === "fork" ? (
                  <span className="text-indigo-400" title="rejoins">
                    <GitMerge size={18} />
                  </span>
                ) : col.comms ? (
                  <span
                    className="text-sky-500"
                    title="Comms touchpoint — measured around, not through"
                  >
                    <Mail size={16} />
                  </span>
                ) : col.optional ? (
                  <span
                    className="text-amber-500 text-[11px] font-semibold whitespace-nowrap"
                    title="Conditional step — some users are routed down this path"
                  >
                    ⤴ conditional
                  </span>
                ) : (
                  dropChipFromCol(col)
                )}
              </Conn>
            )}

            {col.kind === "step" ? (
              <div className="pt-1">
                <StepCard
                  step={col.step}
                  value={col.flow}
                  retention={col.retention}
                  optional={col.optional}
                  comms={col.comms}
                  throughShare={col.throughShare}
                  bypass={col.bypass}
                  bypassShare={col.bypassShare}
                  editable={editable}
                  onEdit={() => actions.onEditStep(col.step.id)}
                  onMoveL={
                    editable && col.step.id !== firstStepId
                      ? () => actions.onMoveStep(col.step.id, "left")
                      : undefined
                  }
                  onMoveR={
                    editable && col.step.id !== lastStepId
                      ? () => actions.onMoveStep(col.step.id, "right")
                      : undefined
                  }
                  onDel={() => actions.onDeleteStep(col.step.id)}
                  onLightbox={actions.onLightbox}
                />
              </div>
            ) : (
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-3 shrink-0">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-semibold text-indigo-500 flex items-center gap-1">
                    <GitFork size={13} /> Branches
                  </span>
                  {editable && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => actions.onAddLane(col.id)}
                        className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                      >
                        + lane
                      </button>
                      <button
                        onClick={() => actions.onRemoveFork(col.id)}
                        className="text-slate-300 hover:text-rose-500"
                        aria-label="Remove fork"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {col.lanes.map((lane) => (
                    <div key={lane.id} className="flex items-stretch gap-2">
                      <div className="w-28 shrink-0 bg-white rounded-xl border border-indigo-100 p-2 flex flex-col justify-center">
                        {editable ? (
                          <input
                            value={lane.name}
                            onChange={(e) =>
                              actions.onRenameLane(col.id, lane.id, e.target.value)
                            }
                            className="font-semibold text-sm bg-transparent w-full outline-none focus:bg-slate-50 rounded px-1"
                            aria-label="Lane name"
                          />
                        ) : (
                          <span className="font-semibold text-sm px-1">
                            {lane.name}
                          </span>
                        )}
                        {lane.share != null && (
                          <span className="text-xs text-slate-400 px-1 mt-0.5">
                            {Math.round(lane.share * 100)}% of traffic
                          </span>
                        )}
                        {editable && col.lanes.length > 1 && (
                          <button
                            onClick={() => actions.onRemoveLane(col.id, lane.id)}
                            className="text-xs text-slate-300 hover:text-rose-500 px-1 mt-1 text-left"
                          >
                            remove lane
                          </button>
                        )}
                      </div>

                      <div className="flex items-start gap-1">
                        {lane.steps.map((ls, k) => (
                          <React.Fragment key={ls.step.id}>
                            {k > 0 && (
                              <Conn>
                                {dropChip(lane.steps[k - 1].value, ls.value)}
                              </Conn>
                            )}
                            <StepCard
                              step={ls.step}
                              value={ls.value}
                              retention={ls.retention}
                              small
                              editable={editable}
                              onEdit={() => actions.onEditStep(ls.step.id)}
                              onMoveL={
                                editable && k > 0
                                  ? () => actions.onMoveStep(ls.step.id, "left")
                                  : undefined
                              }
                              onMoveR={
                                editable && k < lane.steps.length - 1
                                  ? () => actions.onMoveStep(ls.step.id, "right")
                                  : undefined
                              }
                              onDel={() => actions.onDeleteStep(ls.step.id)}
                              onLightbox={actions.onLightbox}
                            />
                          </React.Fragment>
                        ))}
                        {editable && (
                          <button
                            onClick={() => actions.onAddLaneStep(col.id, lane.id)}
                            className="w-20 self-stretch border-2 border-dashed border-indigo-200 rounded-xl text-indigo-300 hover:text-indigo-500 hover:border-indigo-400 flex items-center justify-center shrink-0"
                            style={{ minHeight: "120px" }}
                            aria-label="Add step to lane"
                          >
                            <Plus size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </React.Fragment>
        ))}

        {editable && (
          <>
            <Conn />
            <button onClick={actions.onAddSharedStep} className="pt-1 shrink-0">
              <div
                className="w-52 border-2 border-dashed border-slate-300 rounded-xl text-slate-300 hover:text-indigo-500 hover:border-indigo-400 flex flex-col items-center justify-center gap-1"
                style={{ height: "190px" }}
              >
                <Plus size={22} />
                <span className="text-xs font-medium">Add step</span>
              </div>
            </button>
          </>
        )}
      </div>

      {cols.length === 0 && !editable && (
        <p className="py-12 text-center text-sm text-slate-400">
          No steps in this device view.
        </p>
      )}
    </div>
  );
}
