// Derived-figure logic. Everything here recomputes from the selected device
// view: "desktop", "mobile" or "combined".
//
// - desktop  : steps available on desktop, using desktop numbers.
// - mobile   : steps available on mobile, using mobile numbers.
// - combined : all steps, using the sum of desktop + mobile per step.

export function deviceValue(step, device) {
  const d = step?.data?.desktop;
  const m = step?.data?.mobile;
  if (device === "desktop") return numOrNull(d);
  if (device === "mobile") return numOrNull(m);
  // combined
  const dn = numOrNull(d);
  const mn = numOrNull(m);
  if (dn === null && mn === null) return null;
  return (dn || 0) + (mn || 0);
}

export function isStepVisible(step, device) {
  const a = step?.availability || "both";
  if (device === "combined") return true;
  if (device === "desktop") return a === "both" || a === "desktop";
  if (device === "mobile") return a === "both" || a === "mobile";
  return true;
}

function numOrNull(v) {
  return v === null || v === undefined || v === "" || !Number.isFinite(Number(v))
    ? null
    : Number(v);
}

function visibleLaneSteps(lane, device) {
  return (lane.steps || []).filter((s) => isStepVisible(s, device));
}

// The value at which traffic enters a lane = its first visible step's value.
function laneEntryValue(lane, device) {
  const steps = visibleLaneSteps(lane, device);
  for (const s of steps) {
    const v = deviceValue(s, device);
    if (v !== null) return v;
  }
  return null;
}

// Build the view-model the UI renders. Produces ordered columns plus the
// overall conversion figure, all for the chosen device.
export function buildViewModel(journey, device) {
  const sections = journey?.structure?.sections || [];

  const columns = [];
  for (const section of sections) {
    if (section.type === "step") {
      if (!isStepVisible(section.step, device)) continue; // device-only step
      columns.push({
        kind: "step",
        step: section.step,
        flow: deviceValue(section.step, device),
      });
    } else if (section.type === "fork") {
      const lanes = (section.lanes || [])
        .map((lane) => {
          const steps = visibleLaneSteps(lane, device).map((s) => ({
            step: s,
            value: deviceValue(s, device),
          }));
          return {
            id: lane.id,
            name: lane.name,
            steps,
            entry: laneEntryValue(lane, device),
          };
        })
        .filter((lane) => lane.steps.length > 0); // lane absent on this device
      if (lanes.length === 0) continue;
      const forkTotal = sumOrNull(lanes.map((l) => l.entry));
      for (const lane of lanes) {
        lane.share =
          forkTotal && lane.entry !== null ? lane.entry / forkTotal : null;
      }
      columns.push({ kind: "fork", id: section.id, lanes, flow: forkTotal });
    }
  }

  // First/last flow values that actually have numbers, for conversion.
  const flows = columns.map((c) => c.flow);
  const firstValue = firstNonNull(flows);
  const lastValue = lastNonNull(flows);

  // Retention (vs first) and drop-off (vs previous column) per column.
  let prevFlow = null;
  for (const col of columns) {
    col.retention =
      firstValue && col.flow !== null ? col.flow / firstValue : null;
    if (prevFlow !== null && col.flow !== null) {
      const abs = prevFlow - col.flow;
      col.drop = { abs, pct: prevFlow ? abs / prevFlow : null };
    } else {
      col.drop = null;
    }
    // retention for steps inside lanes, relative to first value
    if (col.kind === "fork") {
      for (const lane of col.lanes) {
        for (const ls of lane.steps) {
          ls.retention =
            firstValue && ls.value !== null ? ls.value / firstValue : null;
        }
      }
    }
    if (col.flow !== null) prevFlow = col.flow;
  }

  const conversion =
    firstValue && lastValue !== null ? lastValue / firstValue : null;

  return { device, columns, firstValue, lastValue, conversion };
}

function sumOrNull(arr) {
  const nums = arr.filter((n) => n !== null && n !== undefined);
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0);
}

function firstNonNull(arr) {
  for (const v of arr) if (v !== null && v !== undefined) return v;
  return null;
}

function lastNonNull(arr) {
  for (let i = arr.length - 1; i >= 0; i--)
    if (arr[i] !== null && arr[i] !== undefined) return arr[i];
  return null;
}

/* ------------------------------ formatting ------------------------------ */

export function fmtNum(n) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString();
}

export function fmtPct(frac, digits = 1) {
  if (frac === null || frac === undefined || !Number.isFinite(frac)) return "—";
  return `${(frac * 100).toFixed(digits)}%`;
}
