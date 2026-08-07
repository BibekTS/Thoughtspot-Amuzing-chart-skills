#!/usr/bin/env node
// snap.mjs <slug> <attempt> [--data live|empty|absent|wrapped]
//
// Attaches over CDP to the browser start-preview.mjs launched, reloads, waits for
// the chart to settle, and writes runs/<slug>/attempts/<NN>.png.
//
// Also prints a diagnostic block to stdout — console errors, the preview status
// line, whether emitRenderCompletedEvent fired. The screenshot answers "does it
// look right"; this answers "did it actually work", and the two fail differently:
// a chart that throws still screenshots, just empty.
//
// Exit codes: 0 ok · 1 fatal · 2 usage · 3 daemon not running

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { findProjectRoot, runDirFor } from "./project-root.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const slug = argv[0];
const attemptArg = argv[1];
let dataOverride = null;
for (let i = 2; i < argv.length; i++) if (argv[i] === "--data") dataOverride = argv[++i];

if (!slug || !attemptArg) {
  console.error("usage: snap.mjs <slug> <attempt> [--data live|empty|absent|wrapped]");
  process.exit(2);
}

const attempt = String(attemptArg).padStart(2, "0");
const runDir = runDirFor(findProjectRoot(here), slug);
const cdpPath = path.join(runDir, ".preview", "cdp.json");

if (!fs.existsSync(cdpPath)) {
  console.error(`[snap] no preview daemon for ${slug} (missing ${cdpPath})`);
  console.error(`[snap] start it with: node start-preview.mjs ${slug}`);
  process.exit(3);
}

const cfg = JSON.parse(fs.readFileSync(cdpPath, "utf8"));
const suffix = dataOverride && dataOverride !== cfg.data ? `.${dataOverride}` : "";
const outPath = path.join(runDir, "attempts", `${attempt}${suffix}.png`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });

let browser;
try {
  browser = await chromium.connectOverCDP(cfg.cdpUrl);
  const ctx = browser.contexts()[0];
  if (!ctx) throw new Error("no shared browser context via CDP");
  const pages = ctx.pages();
  const page = pages.find((p) => p.url().includes("localhost:" + cfg.vitePort)) ?? pages[0];
  if (!page) throw new Error("no page in shared context");

  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push(String(e.message || e)));

  const target = dataOverride
    ? `http://localhost:${cfg.vitePort}/?data=${dataOverride}`
    : cfg.url;
  await page.goto(target, { waitUntil: "domcontentloaded" });

  // Settle on the preview's own status line rather than a selector — the chart may
  // be an SVG, a canvas, or a plain HTML table, and waiting for "#chart svg" would
  // hang forever on the last two.
  await page
    .waitForFunction(() => {
      const s = document.getElementById("status");
      return s && /^(ok|warn|error)$/.test(s.className);
    }, { timeout: 20000 })
    .catch(() => {});
  await page.waitForTimeout(700); // animations / late layout

  const status = await page.evaluate(() => {
    const s = document.getElementById("status");
    return { text: s?.textContent ?? "", kind: s?.className ?? "" };
  });

  const tile = await page.$("#tile");
  await (tile ?? page).screenshot({ path: outPath });

  console.log(`png: ${outPath}`);
  console.log(`data-mode: ${dataOverride ?? cfg.data}`);
  console.log(`status: [${status.kind || "pending"}] ${status.text}`);
  if (consoleErrors.length) {
    console.log(`console-errors (${consoleErrors.length}):`);
    for (const e of consoleErrors.slice(0, 10)) console.log(`  - ${e}`);
  } else {
    console.log("console-errors: none");
  }
} catch (e) {
  console.error("[snap] error:", e.message);
  process.exit(1);
} finally {
  // CDP close() disconnects this client only; the daemon's browser stays up.
  if (browser) try { await browser.close(); } catch {}
}
