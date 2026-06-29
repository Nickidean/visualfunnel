// Immutable-ish helpers that return a new structure with the requested edit
// applied. The editor calls these and persists the result.

import { newStep, newStepSection, newForkSection, newLane, newLink } from "./model";

function clone(structure) {
  return typeof structuredClone === "function"
    ? structuredClone(structure)
    : JSON.parse(JSON.stringify(structure));
}

// Find a step by id anywhere (top-level section or lane), returning a mutable
// reference inside the cloned structure plus its container list and index.
function locate(structure, stepId) {
  for (let i = 0; i < structure.sections.length; i++) {
    const sec = structure.sections[i];
    if (sec.type === "step" && sec.step.id === stepId) {
      return { kind: "section", list: structure.sections, index: i, step: sec.step };
    }
    if (sec.type === "fork") {
      for (const lane of sec.lanes) {
        const idx = lane.steps.findIndex((s) => s.id === stepId);
        if (idx >= 0) {
          return { kind: "lane", list: lane.steps, index: idx, step: lane.steps[idx], lane };
        }
      }
    }
  }
  return null;
}

export function updateStep(structure, stepId, patch) {
  const next = clone(structure);
  const loc = locate(next, stepId);
  if (loc) Object.assign(loc.step, patch);
  return next;
}

export function deleteStep(structure, stepId) {
  const next = clone(structure);
  const loc = locate(next, stepId);
  if (!loc) return next;
  if (loc.kind === "section") {
    next.sections.splice(loc.index, 1);
  } else {
    loc.list.splice(loc.index, 1);
    // A lane must keep at least one step; if emptied, add a placeholder.
    if (loc.list.length === 0) loc.list.push(newStep({ title: "Step" }));
  }
  return next;
}

export function moveStep(structure, stepId, dir) {
  const next = clone(structure);
  const loc = locate(next, stepId);
  if (!loc) return next;
  const target = loc.index + (dir === "left" ? -1 : 1);

  if (loc.kind === "section") {
    // Skip over forks by simply swapping section positions.
    if (target < 0 || target >= next.sections.length) return next;
    const tmp = next.sections[loc.index];
    next.sections[loc.index] = next.sections[target];
    next.sections[target] = tmp;
  } else {
    if (target < 0 || target >= loc.list.length) return next;
    const tmp = loc.list[loc.index];
    loc.list[loc.index] = loc.list[target];
    loc.list[target] = tmp;
  }
  return next;
}

export function addStepSection(structure) {
  const next = clone(structure);
  next.sections.push(newStepSection(newStep({ title: "New step" })));
  return next;
}

export function addForkSection(structure) {
  const next = clone(structure);
  next.sections.push(newForkSection());
  return next;
}

export function addStepToLane(structure, forkId, laneId) {
  const next = clone(structure);
  const fork = next.sections.find((s) => s.type === "fork" && s.id === forkId);
  const lane = fork?.lanes.find((l) => l.id === laneId);
  if (lane) lane.steps.push(newStep({ title: "Step" }));
  return next;
}

export function addLane(structure, forkId) {
  const next = clone(structure);
  const fork = next.sections.find((s) => s.type === "fork" && s.id === forkId);
  if (fork) fork.lanes.push(newLane(`Lane ${fork.lanes.length + 1}`));
  return next;
}

export function removeLane(structure, forkId, laneId) {
  const next = clone(structure);
  const fork = next.sections.find((s) => s.type === "fork" && s.id === forkId);
  if (fork && fork.lanes.length > 1) {
    fork.lanes = fork.lanes.filter((l) => l.id !== laneId);
  }
  return next;
}

export function renameLane(structure, forkId, laneId, name) {
  const next = clone(structure);
  const fork = next.sections.find((s) => s.type === "fork" && s.id === forkId);
  const lane = fork?.lanes.find((l) => l.id === laneId);
  if (lane) lane.name = name;
  return next;
}

export function removeFork(structure, forkId) {
  const next = clone(structure);
  next.sections = next.sections.filter(
    (s) => !(s.type === "fork" && s.id === forkId)
  );
  return next;
}

/* ------------------------------ link edits ------------------------------ */

export function addLink(structure, stepId) {
  const next = clone(structure);
  const loc = locate(next, stepId);
  if (loc) loc.step.links = [...(loc.step.links || []), newLink()];
  return next;
}

export function updateLink(structure, stepId, linkId, patch) {
  const next = clone(structure);
  const loc = locate(next, stepId);
  if (loc) {
    loc.step.links = (loc.step.links || []).map((l) =>
      l.id === linkId ? { ...l, ...patch } : l
    );
  }
  return next;
}

export function removeLink(structure, stepId, linkId) {
  const next = clone(structure);
  const loc = locate(next, stepId);
  if (loc) loc.step.links = (loc.step.links || []).filter((l) => l.id !== linkId);
  return next;
}
