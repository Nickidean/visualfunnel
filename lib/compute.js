// Derived-figure logic. Everything here recomputes from the selected device
// view: "desktop", "mobile" or "combined".
//
// - desktop  : steps available on desktop, using desktop numbers.
// - mobile   : steps available on mobile, using mobile numbers.
// - combined : all steps, using the sum of desktop + mobile per step.

export function deviceValue(step, device) {
  // Comms touchpoints carry a single "sent" number, the same in every view.
  if (step?.kind === "comms") return numOrNull(step.sent);
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
  if (step?.kind === "comms") return true; // comms show in every device view
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
//
// opts.keepEmptyLanes: when true (editor), a fork lane is kept even if it has
// no steps visible on the current device, so its card and "+ step" affordance
// still render. Present/export leave it false so empty lanes don't appear.
export function buildViewModel(journey, device, opts = {}) {
  const { keepEmptyLanes = false } = opts;
  const sections = journey?.structure?.sections || [];

  const columns = [];
  for (const section of sections) {
    if (section.type === "step") {
      if (!isStepVisible(section.step, device)) continue; // device-only step
      columns.push({
        kind: "step",
        step: section.step,
        optional: !!section.step.optional,
        comms: section.step.kind === "comms",
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
        .filter((lane) => keepEmptyLanes || lane.steps.length > 0); // lane absent on this device
      if (lanes.length === 0) continue;
      const forkTotal = sumOrNull(lanes.map((l) => l.entry));
      for (const lane of lanes) {
        lane.share =
          forkTotal && lane.entry !== null ? lane.entry / forkTotal : null;
      }
      columns.push({ kind: "fork", id: section.id, lanes, flow: forkTotal });
    }
  }

  // Optional (exception) steps are NOT on the main path — only some users pass
  // through them. So the first/last values and every drop-off are measured
  // along the main line, skipping optional columns.
  const mainFlows = columns
    .filter((c) => !c.optional && !c.comms)
    .map((c) => c.flow);
  const firstValue = firstNonNull(mainFlows);
  const lastValue = lastNonNull(mainFlows);

  // Retention (vs first) and drop-off (vs previous MAIN column) per column.
  let prevFlow = null;
  for (const col of columns) {
    if (col.comms) {
      // A comms touchpoint isn't a funnel stage — show its number but measure
      // drop-off around it (don't advance prevFlow, no drop/retention).
      col.sent = col.flow;
      col.drop = null;
      col.retention = null;
      continue;
    }
    if (col.optional) {
      // Side step: split the incoming traffic into "through" vs "skipped".
      const incoming = prevFlow;
      const through = col.flow;
      col.through = through;
      col.incoming = incoming;
      col.bypass =
        incoming !== null && through !== null
          ? Math.max(incoming - through, 0)
          : null;
      col.throughShare =
        incoming && through !== null ? through / incoming : null;
      col.bypassShare =
        incoming && col.bypass !== null ? col.bypass / incoming : null;
      col.retention =
        firstValue && through !== null ? through / firstValue : null;
      col.drop = null;
      // Crucially: do NOT advance prevFlow — the next main step is measured
      // against the value BEFORE this optional detour.
      continue;
    }

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
