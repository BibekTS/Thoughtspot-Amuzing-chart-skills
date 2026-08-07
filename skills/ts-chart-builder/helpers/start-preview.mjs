#!/usr/bin/env node
// start-preview.mjs <slug> [--port 5173] [--cdp-port 9222] [--data live|empty|absent|wrapped]
//
// Long-running daemon, spawned in the background. It:
//   1. seeds runs/<slug>/chart/{chart.html,chart.css,chart.js} if absent,
//   2. copies the scaffold into runs/<slug>/preview/ and npm-installs it once,
//   3. spawns Vite there,
//   4. opens a headed Chromium the user can watch,
//   5. writes runs/<slug>/.preview/{cdp.json,daemon.pid,vite.pid} for snap/close,
//   6. stays alive — the browser dies with this process.

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { findProjectRoot, runDirFor } from "./project-root.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.resolve(here, "..");
const scaffoldDir = path.join(skillDir, "scaffold");

function parseArgs(argv) {
  const args = { slug: null, port: 5173, cdpPort: 9222, data: "live",
                 windowPos: "900,100", windowSize: "1100,800" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--port") args.port = Number(argv[++i]);
    else if (a === "--cdp-port") args.cdpPort = Number(argv[++i]);
    else if (a === "--data") args.data = argv[++i];
    else if (a === "--window-pos") args.windowPos = argv[++i];
    else if (a === "--window-size") args.windowSize = argv[++i];
    else if (!args.slug) args.slug = a;
  }
  if (!args.slug) {
    console.error("usage: start-preview.mjs <slug> [--port N] [--cdp-port N] [--data live|empty|absent|wrapped]");
    process.exit(2);
  }
  return args;
}

function copyDirSync(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "dist") continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    e.isDirectory() ? copyDirSync(s, d) : fs.copyFileSync(s, d);
  }
}

// A run must render something on the very first load, before any chart code is
// written — otherwise the user stares at a blank window while we think.
const SEED = {
  "chart.html": `<div id="chart"></div>\n`,
  "chart.css": `#chart { width: 100%; height: 100%; }\n`,
  "chart.js": `// Waiting for the first attempt.
const el = document.getElementById('chart');
el.textContent = 'ready';
el.style.cssText = 'display:grid;place-items:center;height:100%;color:#bbb;font:13px sans-serif';
viz.events.emitRenderCompletedEvent();
`,
};

function seedChartFiles(runDir) {
  const chartDir = path.join(runDir, "chart");
  fs.mkdirSync(chartDir, { recursive: true });
  for (const [name, body] of Object.entries(SEED)) {
    const p = path.join(chartDir, name);
    if (!fs.existsSync(p)) fs.writeFileSync(p, body);
  }
}

async function ensurePreviewDir(runDir) {
  const previewDir = path.join(runDir, "preview");
  if (!fs.existsSync(previewDir)) {
    console.log(`[start-preview] copying scaffold -> ${previewDir}`);
    copyDirSync(scaffoldDir, previewDir);
  }
  if (!fs.existsSync(path.join(previewDir, "node_modules"))) {
    console.log(`[start-preview] npm install in ${previewDir} (one-time, ~20s)`);
    await new Promise((resolve, reject) => {
      const p = spawn("npm", ["install", "--silent"], { cwd: previewDir, stdio: "inherit" });
      p.on("exit", (c) => (c === 0 ? resolve() : reject(new Error(`npm install exit ${c}`))));
    });
  }
  return previewDir;
}

async function waitFor(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { if ((await fetch(url)).ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`timeout waiting for ${url}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = findProjectRoot(here);
  const runDir = runDirFor(projectRoot, args.slug);
  fs.mkdirSync(path.join(runDir, "attempts"), { recursive: true });
  fs.mkdirSync(path.join(runDir, ".preview"), { recursive: true });

  seedChartFiles(runDir);
  const previewDir = await ensurePreviewDir(runDir);

  const vite = spawn("npx", ["vite", "--port", String(args.port), "--host", "--strictPort"], {
    cwd: previewDir, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env },
  });
  vite.stdout.on("data", (b) => process.stdout.write(`[vite] ${b}`));
  vite.stderr.on("data", (b) => process.stderr.write(`[vite] ${b}`));
  fs.writeFileSync(path.join(runDir, ".preview", "vite.pid"), String(vite.pid));

  const url = `http://localhost:${args.port}/?data=${args.data}`;
  await waitFor(`http://localhost:${args.port}/`);
  console.log(`[start-preview] vite up at ${url}`);

  const [px, py] = args.windowPos.split(",").map(Number);
  const [pw, ph] = args.windowSize.split(",").map(Number);

  // --remote-debugging-port so snap.mjs can attach over CDP and see these same
  // pages. chromium.connect()'s WS endpoint isolates contexts per client; CDP
  // shares them.
  const browser = await chromium.launch({
    headless: false,
    args: [`--window-position=${px},${py}`, `--window-size=${pw},${ph}`,
           `--remote-debugging-port=${args.cdpPort}`],
  });
  const ctx = browser.contexts()[0] ?? (await browser.newContext());
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  await page.goto(url, { waitUntil: "domcontentloaded" });

  fs.writeFileSync(
    path.join(runDir, ".preview", "cdp.json"),
    JSON.stringify({ cdpUrl: `http://localhost:${args.cdpPort}`, url,
                     vitePort: args.port, cdpPort: args.cdpPort, data: args.data }, null, 2)
  );
  fs.writeFileSync(path.join(runDir, ".preview", "daemon.pid"), String(process.pid));

  console.log(`[start-preview] browser open, PID ${process.pid}`);
  console.log(`[start-preview] close with: node close-preview.mjs ${args.slug}`);

  const keepalive = setInterval(() => {}, 60000);
  const shutdown = async (why) => {
    console.log(`[start-preview] ${why}, shutting down`);
    clearInterval(keepalive);
    try { await browser.close(); } catch {}
    try { vite.kill("SIGTERM"); } catch {}
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  vite.on("exit", (c) => {
    console.error(`[start-preview] vite exited (${c})`);
    shutdown("vite-exit").catch(() => process.exit(1));
  });
}

main().catch((e) => { console.error("[start-preview] fatal:", e); process.exit(1); });
