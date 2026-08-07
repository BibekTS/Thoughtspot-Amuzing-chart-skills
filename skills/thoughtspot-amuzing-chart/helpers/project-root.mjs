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
    // Installed layout (.claude/skills/…) or a direct checkout of the skill repo
    // (skills/…) — both count as a project root.
    if (
      fs.existsSync(path.join(cur, ".claude", "skills", "thoughtspot-amuzing-chart")) ||
      fs.existsSync(path.join(cur, "skills", "thoughtspot-amuzing-chart", "SKILL.md"))
    ) return cur;
    cur = path.dirname(cur);
  }
  return process.cwd();
}

export function runDirFor(projectRoot, slug) {
  return path.join(projectRoot, "runs", slug);
}
