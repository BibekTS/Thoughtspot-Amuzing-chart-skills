#!/usr/bin/env node
// close-preview.mjs <slug>
//
// SIGTERMs the start-preview daemon; it closes the headed browser and Vite on
// the way out.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findProjectRoot, runDirFor } from "./project-root.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const slug = process.argv[2];
if (!slug) {
  console.error("usage: close-preview.mjs <slug>");
  process.exit(2);
}

const previewDir = path.join(runDirFor(findProjectRoot(here), slug), ".preview");
const pidPath = path.join(previewDir, "daemon.pid");

if (!fs.existsSync(pidPath)) {
  console.log(`[close-preview] no daemon recorded for ${slug} — nothing to do`);
  process.exit(0);
}

const pid = Number(fs.readFileSync(pidPath, "utf8").trim());
if (!Number.isFinite(pid) || pid <= 0) {
  console.error(`[close-preview] bogus pid in ${pidPath}`);
  process.exit(1);
}

try {
  process.kill(pid, "SIGTERM");
  console.log(`[close-preview] SIGTERM -> daemon pid ${pid}`);
} catch (e) {
  if (e.code === "ESRCH") console.log(`[close-preview] daemon pid ${pid} already gone`);
  else { console.error("[close-preview] kill failed:", e.message); process.exit(1); }
}

for (const f of ["daemon.pid", "vite.pid", "cdp.json"]) {
  const p = path.join(previewDir, f);
  if (fs.existsSync(p)) try { fs.unlinkSync(p); } catch {}
}
