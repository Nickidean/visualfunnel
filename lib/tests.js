// A/B test tracking layer. Tests live inside the journey's structure
// (`structure.tests`) so they persist with the journey and stay pinned to the
// step ids they target — no schema change needed.

import { uid } from "./model";

export const TEST_STATUSES = ["idea", "live", "completed"];
export const STATUS_LABEL = { idea: "Idea", live: "Live", completed: "Completed" };
export const VERDICTS = ["won", "flat", "lost"];
export const DECISIONS = ["shipped", "dropped", "iterate"];

function clone(structure) {
  return typeof structuredClone === "function"
    ? structuredClone(structure)
    : JSON.parse(JSON.stringify(structure));
}

export function newMetricRow(overrides = {}) {
  return {
    id: uid("metric"),
    label: "",
    variant: "",
    control: "",
    change: "",
    headline: false,
    ...overrides,
  };
}

export function newTest(overrides = {}) {
  return {
    id: uid("test"),
    name: "New test",
    hypothesis: "",
    funnelWide: false,
    stepIds: [],
    status: "idea",
    verdict: null, // won | flat | lost (once completed)
    decision: null, // shipped | dropped | iterate
    exposure: null, // percent of traffic
    startDate: "",
    endDate: "",
    metrics: [newMetricRow({ label: "Start to sale conversion", headline: true })],
    incrementalSales: null,
    notes: "",
    beforeAfter: [], // [{ id, url }]
    links: [], // [{ id, label, url }]
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/* ----------------------------- CRUD on structure ----------------------------- */

export function getTests(structure) {
  return structure?.tests || [];
}

export function addTest(structure, test) {
  const next = clone(structure);
  next.tests = [...(next.tests || []), test || newTest()];
  return next;
}

export function updateTest(structure, id, patch) {
  const next = clone(structure);
  next.tests = (next.tests || []).map((t) =>
    t.id === id ? { ...t, ...patch, updated_at: new Date().toISOString() } : t
  );
  return next;
}

export function deleteTest(structure, id) {
  const next = clone(structure);
  next.tests = (next.tests || []).filter((t) => t.id !== id);
  return next;
}

export function setValuePerSale(structure, value) {
  const next = clone(structure);
  next.valuePerSale = value === "" || value == null ? null : Number(value);
  return next;
}

/* ------------------------------- step helpers ------------------------------- */

// Flat, ordered list of every step in the journey (shared + lane steps).
export function listSteps(structure) {
  const out = [];
  for (const sec of structure?.sections || []) {
    if (sec.type === "step") {
      out.push({ id: sec.step.id, title: sec.step.title });
    } else if (sec.type === "fork") {
      for (const lane of sec.lanes || []) {
        for (const s of lane.steps || []) {
          out.push({ id: s.id, title: s.title, lane: lane.name });
        }
      }
    }
  }
  return out;
}

export function stepTitleMap(structure) {
  const map = {};
  for (const s of listSteps(structure)) map[s.id] = s.title;
  return map;
}

// Names of the steps a test is pinned to (or "Whole funnel").
export function scopeLabel(test, titleMap) {
  if (test.funnelWide) return "Whole funnel";
  const ids = test.stepIds || [];
  if (ids.length === 0) return "Unlinked";
  return ids.map((id) => titleMap[id] || "—").join(", ");
}

/* --------------------------------- counts ---------------------------------- */

// Per-step counts by status, e.g. counts[stepId] = { idea, live, completed, total }.
export function testCountsByStep(structure) {
  const counts = {};
  for (const t of getTests(structure)) {
    if (t.funnelWide) continue;
    for (const sid of t.stepIds || []) {
      counts[sid] = counts[sid] || { idea: 0, live: 0, completed: 0, total: 0 };
      counts[sid][t.status] = (counts[sid][t.status] || 0) + 1;
      counts[sid].total += 1;
    }
  }
  return counts;
}

export function funnelWideCounts(structure) {
  const c = { idea: 0, live: 0, completed: 0, total: 0 };
  for (const t of getTests(structure)) {
    if (!t.funnelWide) continue;
    c[t.status] += 1;
    c.total += 1;
  }
  return c;
}

// Short badge text like "1 live · 2 done".
export function badgeText(c) {
  if (!c || !c.total) return null;
  const parts = [];
  if (c.live) parts.push(`${c.live} live`);
  if (c.completed) parts.push(`${c.completed} done`);
  if (c.idea) parts.push(`${c.idea} idea`);
  return parts.join(" · ");
}

/* -------------------------------- headline --------------------------------- */

export function headlineMetric(test) {
  const rows = test.metrics || [];
  return rows.find((r) => r.headline) || rows[0] || null;
}

// "Conversion +0.4 pts" style summary from the headline row.
export function headlineText(test) {
  const m = headlineMetric(test);
  if (!m || !m.label) return null;
  const chg = (m.change || "").toString().trim();
  return chg ? `${m.label}: ${chg}` : m.label;
}

/* -------------------------------- summary ---------------------------------- */

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function summaryStats(structure) {
  const tests = getTests(structure);
  const completed = tests.filter((t) => t.status === "completed");
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);

  const completedThisQuarter = completed.filter((t) => {
    if (!t.endDate) return false;
    const d = new Date(t.endDate);
    return d.getFullYear() === now.getFullYear() && Math.floor(d.getMonth() / 3) === q;
  }).length;

  const incremental = completed.reduce((s, t) => s + num(t.incrementalSales), 0);
  const valuePerSale = structure?.valuePerSale;
  const poundImpact =
    valuePerSale != null && valuePerSale !== ""
      ? incremental * num(valuePerSale)
      : null;

  return {
    live: tests.filter((t) => t.status === "live").length,
    completedTotal: completed.length,
    completedThisQuarter,
    won: completed.filter((t) => t.verdict === "won").length,
    incremental,
    poundImpact,
    valuePerSale: valuePerSale ?? null,
  };
}

// Auto-fill suggestion for a metric row's change (variant − control), used only
// when the user hasn't typed their own change.
export function suggestChange(variant, control) {
  const v = Number(variant);
  const c = Number(control);
  if (!Number.isFinite(v) || !Number.isFinite(c)) return "";
  const d = v - c;
  const sign = d > 0 ? "+" : "";
  return `${sign}${Math.round(d * 100) / 100}`;
}
