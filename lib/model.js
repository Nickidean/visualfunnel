// Factory helpers and constants for the journey data model.
//
// A journey's `structure` is an ordered list of sections:
//   { type: "step", step: Step }
//   { type: "fork", lanes: Lane[] }
// A fork's lanes each hold their own ordered list of steps; the journey
// continues at the next "step" section, which is the rejoin.

export const DEVICES = ["desktop", "mobile", "combined"];

export const AVAILABILITY = ["both", "desktop", "mobile"];

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now()
    .toString(36)
    .slice(-4)}`;
}

export function newStep(overrides = {}) {
  return {
    id: uid("step"),
    title: "New step",
    screenshotUrl: null,
    notes: "",
    links: [],
    data: { desktop: null, mobile: null },
    availability: "both",
    ...overrides,
  };
}

export function newLink(overrides = {}) {
  return { id: uid("link"), label: "", url: "", ...overrides };
}

export function newLane(name = "Path") {
  return { id: uid("lane"), name, steps: [] };
}

export function newStepSection(step) {
  return { type: "step", step: step || newStep() };
}

export function newForkSection(laneNames = ["Path A", "Path B"]) {
  return { type: "fork", id: uid("fork"), lanes: laneNames.map(newLane) };
}

export function newJourney(name = "Untitled journey") {
  return {
    id: uid("journey"),
    name,
    updated_at: new Date().toISOString(),
    structure: { sections: [] },
  };
}

// Parse a user-entered number field into number | null (empty stays empty).
export function parseCount(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}
