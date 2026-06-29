"use client";

import React, { useRef, useState } from "react";
import { GitFork, GitMerge, Image as ImageIcon } from "lucide-react";

const ARROW = <span className="text-white/20 text-2xl px-1 self-center">→</span>;

function dropLabel(prevVal, val) {
  if (prevVal != null && val != null && prevVal !== 0 && prevVal > val) {
    return (
      <span className="text-rose-400 text-sm font-semibold px-1 self-center">
        ↓{Math.round(((prevVal - val) / prevVal) * 100)}%
      </span>
    );
  }
  return null;
}

// A single large, clickable step tile for the overview board.
function Tile({ step, value, retention, onPick, small }) {
  const r = retention;
  const w = r != null ? Math.max(r * 100, 8) : 100;
  return (
    <button
      onClick={onPick}
      className={`text-left bg-white rounded-xl shadow-lg overflow-hidden shrink-0 hover:ring-2 hover:ring-indigo-400 transition ${
        small ? "w-60" : "w-72"
      }`}
    >
      <div
        className="w-full bg-slate-100 flex items-center justify-center overflow-hidden"
        style={{ height: small ? "150px" : "190px" }}
      >
        {step.screenshotUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={step.screenshotUrl}
            alt={step.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon size={32} className="text-slate-300" />
        )}
      </div>
      <div className="p-3 text-slate-800">
        <h3 className="font-semibold text-sm truncate" title={step.title}>
          {step.title}
        </h3>
        <div className="flex items-baseline justify-between mt-1.5">
          {value != null ? (
            <span className="font-bold tabular-nums">{value.toLocaleString()}</span>
          ) : (
            <span className="text-xs text-slate-300">no data</span>
          )}
          {r != null && (
            <span className="text-xs text-slate-400">{Math.round(r * 100)}%</span>
          )}
        </div>
        <div className="h-2 mt-1.5">
          <div
            className="h-full rounded-full"
            style={{
              width: `${w}%`,
              background:
                value != null
                  ? "linear-gradient(90deg,#6366f1,#818cf8)"
                  : "#e2e8f0",
            }}
          />
        </div>
      </div>
    </button>
  );
}

export default function PresentBoard({ vm, zoom, onPick }) {
  const scroller = useRef(null);
  const drag = useRef({ active: false, moved: false, x: 0, y: 0, sl: 0, st: 0 });
  const [grabbing, setGrabbing] = useState(false);

  // Drag-to-pan the scroll container. Suppress the click that follows a drag.
  function onPointerDown(e) {
    const el = scroller.current;
    if (!el) return;
    drag.current = {
      active: true,
      moved: false,
      x: e.clientX,
      y: e.clientY,
      sl: el.scrollLeft,
      st: el.scrollTop,
    };
    setGrabbing(true);
  }
  function onPointerMove(e) {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
    const el = scroller.current;
    if (el) {
      el.scrollLeft = d.sl - dx;
      el.scrollTop = d.st - dy;
    }
  }
  function endDrag() {
    drag.current.active = false;
    setGrabbing(false);
  }
  function pick(stepId) {
    // Ignore the click if the pointer was dragging.
    if (drag.current.moved) return;
    onPick(stepId);
  }

  const cols = vm.columns;

  return (
    <div
      ref={scroller}
      className={`flex-1 overflow-auto p-10 select-none ${
        grabbing ? "cursor-grabbing" : "cursor-grab"
      }`}
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
    >
      <div
        className="flex items-start gap-2"
        style={{
          minWidth: "min-content",
          transform: `scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {cols.map((col, i) => (
          <React.Fragment key={col.kind === "step" ? col.step.id : col.id}>
            {i > 0 &&
              (col.kind === "fork" ? (
                <span className="text-indigo-300 self-center px-1">
                  <GitFork size={22} />
                </span>
              ) : cols[i - 1].kind === "fork" ? (
                <span className="text-indigo-300 self-center px-1">
                  <GitMerge size={22} />
                </span>
              ) : (
                dropLabel(cols[i - 1].flow, col.flow) || ARROW
              ))}

            {col.kind === "step" ? (
              <div className="pt-1">
                <Tile
                  step={col.step}
                  value={col.flow}
                  retention={col.retention}
                  onPick={() => pick(col.step.id)}
                />
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 shrink-0">
                <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1 mb-2 px-1">
                  <GitFork size={14} /> Branches
                </div>
                <div className="space-y-3">
                  {col.lanes.map((lane) => (
                    <div key={lane.id} className="flex items-stretch gap-2">
                      <div className="w-32 shrink-0 self-center text-white">
                        <div className="font-semibold text-sm">{lane.name}</div>
                        {lane.share != null && (
                          <div className="text-xs text-white/50 mt-0.5">
                            {Math.round(lane.share * 100)}% of traffic
                          </div>
                        )}
                      </div>
                      <div className="flex items-start gap-2">
                        {lane.steps.map((ls, k) => (
                          <React.Fragment key={ls.step.id}>
                            {k > 0 &&
                              (dropLabel(lane.steps[k - 1].value, ls.value) ||
                                ARROW)}
                            <Tile
                              small
                              step={ls.step}
                              value={ls.value}
                              retention={ls.retention}
                              onPick={() => pick(ls.step.id)}
                            />
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
