"use client";

import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  GitFork,
  GitMerge,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Maximize,
} from "lucide-react";
import { THUMB, PLACEHOLDER_ASPECT } from "@/lib/layout";

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2;
const clampZoom = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

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

function dropLabelFromCol(col) {
  const d = col.drop;
  if (d && d.abs > 0) {
    return (
      <span className="text-rose-400 text-sm font-semibold px-1 self-center">
        ↓{Math.round((d.pct || 0) * 100)}%
      </span>
    );
  }
  return null;
}

// A large, clickable step tile: fixed width, natural height (full screenshot).
function Tile({ step, value, retention, onPick, small, optional, throughShare, bypass, bypassShare }) {
  const r = optional ? throughShare : retention;
  const w = r != null ? Math.max(r * 100, 8) : 100;
  return (
    <button
      onClick={onPick}
      className={`text-left bg-white rounded-xl shadow-lg overflow-hidden shrink-0 hover:ring-2 hover:ring-indigo-400 transition ${
        optional ? "ring-2 ring-amber-300" : ""
      }`}
      style={{ width: small ? THUMB.boardSmall : THUMB.board }}
    >
      {optional && (
        <div className="bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
          Conditional step
        </div>
      )}
      {step.screenshotUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={step.screenshotUrl}
          alt={step.title}
          className="block w-full h-auto bg-slate-100"
        />
      ) : (
        <div
          className="w-full bg-slate-100 flex items-center justify-center"
          style={{ aspectRatio: PLACEHOLDER_ASPECT }}
        >
          <ImageIcon size={32} className="text-slate-300" />
        </div>
      )}
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
            <span className="text-xs text-slate-400">
              {Math.round(r * 100)}%{optional ? " through" : ""}
            </span>
          )}
        </div>
        <div className="h-2 mt-1.5">
          <div
            className="h-full rounded-full"
            style={{
              width: `${w}%`,
              background:
                value != null
                  ? optional
                    ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
                    : "linear-gradient(90deg,#6366f1,#818cf8)"
                  : "#e2e8f0",
            }}
          />
        </div>
        {optional && bypass != null && (
          <div className="mt-1.5 text-[11px] text-amber-700">
            ↳ {bypass.toLocaleString()} skipped
            {bypassShare != null ? ` (${Math.round(bypassShare * 100)}%)` : ""}
          </div>
        )}
      </div>
    </button>
  );
}

export default function PresentBoard({ vm, onPick }) {
  const scroller = useRef(null);
  const content = useRef(null);
  const drag = useRef({ active: false, moved: false, x: 0, y: 0, sl: 0, st: 0 });
  const pendingScroll = useRef(null);
  const didInit = useRef(false);

  const [grabbing, setGrabbing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [natural, setNatural] = useState({ w: 0, h: 0 });

  const cols = vm.columns;

  // Measure the board's natural (unscaled) size. CSS transform doesn't affect
  // offsetWidth/Height, so these are stable regardless of the current zoom.
  const measure = useCallback(() => {
    if (content.current) {
      setNatural({
        w: content.current.offsetWidth,
        h: content.current.offsetHeight,
      });
    }
  }, []);

  const fitToScreen = useCallback(() => {
    const sc = scroller.current;
    if (!sc || !content.current) return;
    const w = content.current.offsetWidth;
    const h = content.current.offsetHeight;
    if (!w || !h) return;
    const z = clampZoom(
      Math.min((sc.clientWidth - 48) / w, (sc.clientHeight - 48) / h, 1)
    );
    pendingScroll.current = { left: 0, top: 0 };
    setZoom(z);
  }, []);

  // Measure on mount / when the journey or device view changes, and on resize.
  useLayoutEffect(() => {
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measure, cols]);

  // Once we know the natural size, fit the whole board on screen the first time.
  useLayoutEffect(() => {
    if (!didInit.current && natural.w > 0) {
      didInit.current = true;
      fitToScreen();
    }
  }, [natural, fitToScreen]);

  // Apply any scroll position queued by a zoom interaction, after the sizer
  // has resized for the new zoom.
  useLayoutEffect(() => {
    if (pendingScroll.current && scroller.current) {
      scroller.current.scrollLeft = pendingScroll.current.left;
      scroller.current.scrollTop = pendingScroll.current.top;
      pendingScroll.current = null;
    }
  }, [zoom]);

  // Mouse-wheel to zoom, centred on the cursor.
  function onWheel(e) {
    e.preventDefault();
    const sc = scroller.current;
    if (!sc) return;
    const rect = sc.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const contentX = (sc.scrollLeft + px) / zoom;
    const contentY = (sc.scrollTop + py) / zoom;
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const newZoom = clampZoom(zoom * factor);
    pendingScroll.current = {
      left: contentX * newZoom - px,
      top: contentY * newZoom - py,
    };
    setZoom(newZoom);
  }

  function step(delta) {
    const sc = scroller.current;
    const cx = sc ? sc.clientWidth / 2 : 0;
    const cy = sc ? sc.clientHeight / 2 : 0;
    const contentX = sc ? (sc.scrollLeft + cx) / zoom : 0;
    const contentY = sc ? (sc.scrollTop + cy) / zoom : 0;
    const newZoom = clampZoom(+(zoom + delta).toFixed(2));
    pendingScroll.current = {
      left: contentX * newZoom - cx,
      top: contentY * newZoom - cy,
    };
    setZoom(newZoom);
  }

  // Drag-to-pan; suppress the click that would follow a real drag.
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
    if (drag.current.moved) return;
    onPick(stepId);
  }

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={scroller}
        className={`absolute inset-0 overflow-auto select-none ${
          grabbing ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onWheel={onWheel}
      >
        {/* Sizer reserves the scaled footprint so panning/scrolling matches the zoom. */}
        <div
          style={{
            width: natural.w ? natural.w * zoom : undefined,
            height: natural.h ? natural.h * zoom : undefined,
            padding: natural.w ? 0 : 40,
          }}
        >
          <div
            ref={content}
            className="inline-flex items-start gap-2 p-10"
            style={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }}
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
                  ) : col.optional ? (
                    <span className="text-amber-300 text-xs font-semibold self-center px-1 whitespace-nowrap">
                      ⤴ conditional
                    </span>
                  ) : (
                    dropLabelFromCol(col) || ARROW
                  ))}

                {col.kind === "step" ? (
                  <div className="pt-1">
                    <Tile
                      step={col.step}
                      value={col.flow}
                      retention={col.retention}
                      optional={col.optional}
                      throughShare={col.throughShare}
                      bypass={col.bypass}
                      bypassShare={col.bypassShare}
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
      </div>

      {/* Zoom controls (bottom-right overlay) */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-lg bg-slate-800/90 border border-white/10 p-1 text-white shadow-lg">
        <button
          onClick={() => step(-0.1)}
          className="rounded-md hover:bg-white/15 p-1.5"
          aria-label="Zoom out"
        >
          <ZoomOut size={16} />
        </button>
        <span className="text-xs text-white/70 w-10 text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => step(0.1)}
          className="rounded-md hover:bg-white/15 p-1.5"
          aria-label="Zoom in"
        >
          <ZoomIn size={16} />
        </button>
        <div className="mx-0.5 h-5 w-px bg-white/15" />
        <button
          onClick={fitToScreen}
          className="flex items-center gap-1 rounded-md hover:bg-white/15 px-2 py-1.5 text-xs"
          aria-label="Fit to screen"
        >
          <Maximize size={14} /> Fit
        </button>
      </div>
    </div>
  );
}
