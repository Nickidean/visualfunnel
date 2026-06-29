// Export a journey as a plain-text outline, respecting the selected device.
// Includes branches and labelled links.

import { buildViewModel, fmtNum, fmtPct } from "./compute";

export function exportJourneyText(journey, device) {
  const vm = buildViewModel(journey, device);
  const lines = [];
  const deviceLabel =
    device === "combined" ? "Combined" : device[0].toUpperCase() + device.slice(1);

  lines.push(`# ${journey.name}`);
  lines.push(`Device view: ${deviceLabel}`);
  lines.push(
    `Overall conversion: ${fmtPct(vm.conversion)} (${fmtNum(vm.firstValue)} → ${fmtNum(
      vm.lastValue
    )})`
  );
  lines.push("");

  let stepNo = 0;
  for (const col of vm.columns) {
    if (col.kind === "step") {
      stepNo += 1;
      lines.push(
        `${stepNo}. ${col.step.title}  [${fmtNum(col.flow)}` +
          `${col.retention !== null ? `, ${fmtPct(col.retention)} retained` : ""}` +
          `${col.drop ? `, drop ${fmtNum(col.drop.abs)} (${fmtPct(col.drop.pct)})` : ""}]`
      );
      appendStepDetail(lines, col.step, "   ");
    } else if (col.kind === "fork") {
      lines.push(`-- Fork --`);
      for (const lane of col.lanes) {
        lines.push(
          `  • Lane: ${lane.name}` +
            `${lane.share !== null ? ` (${fmtPct(lane.share)} of traffic)` : ""}`
        );
        let i = 0;
        for (const ls of lane.steps) {
          i += 1;
          lines.push(
            `     ${i}. ${ls.step.title}  [${fmtNum(ls.value)}` +
              `${ls.retention !== null ? `, ${fmtPct(ls.retention)} retained` : ""}]`
          );
          appendStepDetail(lines, ls.step, "        ");
        }
      }
      lines.push(`-- Rejoin --`);
    }
  }

  return lines.join("\n");
}

function appendStepDetail(lines, step, indent) {
  if (step.notes && step.notes.trim()) {
    const noteLines = step.notes.split("\n");
    lines.push(`${indent}Notes: ${noteLines[0]}`);
    for (let i = 1; i < noteLines.length; i++) {
      lines.push(`${indent}       ${noteLines[i]}`);
    }
  }
  if (step.links && step.links.length) {
    for (const link of step.links) {
      if (!link.url) continue;
      lines.push(`${indent}Link: ${link.label || link.url} — ${link.url}`);
    }
  }
}
