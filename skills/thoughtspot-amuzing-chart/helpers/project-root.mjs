import fs from "node:fs";
import path from "node:path";

// The skill is meant to be copied into any repo, so nothing may be hardcoded.
// Walk up from the helpers dir until we find the checkout that contains this
// skill. `runs/` is created on demand, so its absence must not fail the search —
// that was the bug that pinned the previous skill to one machine.
export function findProjectRoot(startDir) {
  if (process.env.TS_CHART_PROJECT_ROOT) return process.env.TS_CHART_PROJECT_ROOT;
  let cur = path.resolve(startDir);
  while (cur !== path.dirname(cur)) {
    // Installed layout (.claude/skills/…) — always the answer when it matches.
    if (fs.existsSync(path.join(cur, ".claude", "skills", "thoughtspot-amuzing-chart"))) {
      return cur;
    }
    // Direct checkout of this repo (skills/… at the root). The `.claude` guard is
    // load-bearing: without it, walking up from
    //   <repo>/.claude/skills/thoughtspot-amuzing-chart/helpers
    // reaches <repo>/.claude, where `skills/thoughtspot-amuzing-chart/SKILL.md`
    // also exists, and the walk stops one directory too high. Every run then
    // lands in <repo>/.claude/runs/ while sample-data.json is written to
    // <repo>/runs/, so the preview starts with "no sample-data.json" and every
    // live-data mode renders empty — with no error to explain it.
    if (
      path.basename(cur) !== ".claude" &&
      fs.existsSync(path.join(cur, "skills", "thoughtspot-amuzing-chart", "SKILL.md"))
    ) return cur;
    cur = path.dirname(cur);
  }
  return process.cwd();
}

export function runDirFor(projectRoot, slug) {
  return path.join(projectRoot, "runs", slug);
}
