// Composes the three files the way the ThoughtSpot host does, so what renders
// here is what renders on a tile:
//
//   chart.html → injected into #chart-host
//   chart.css  → a <style> in <head>
//   chart.js   → run as an async function body (NOT an ES module)
//
// That last one matters. The host wraps the JS tab in an async IIFE, which is why
// top-level `await` and top-level `return` both work in a BYOC chart and would be
// syntax errors in a module. Fetching the text and handing it to AsyncFunction
// reproduces those semantics exactly.

import muze from "../vendor/muze/muze.js";
import "../vendor/muze/muze.css";
import { installViz } from "./viz-stub.js";

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

const params = new URLSearchParams(location.search);
const dataMode = params.get("data") ?? "live";

const statusEl = document.getElementById("status");
const hostEl = document.getElementById("chart-host");

function setStatus(text, kind = "") {
  statusEl.textContent = text;
  statusEl.className = kind;
}

function showError(label, err) {
  console.error(`[preview] ${label}:`, err);
  setStatus(`${label}: ${err?.message ?? err}`, "error");
  const pre = document.createElement("pre");
  pre.className = "preview-error";
  pre.textContent = (err?.stack || String(err));
  hostEl.appendChild(pre);
}

async function text(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} for ${url}`);
  return r.text();
}

async function main() {
  setStatus("loading…");

  // Dataset is optional — a chart in sample-only mode does not need one.
  let dataset = null;
  try {
    dataset = JSON.parse(await text("/sample-data.json"));
  } catch {
    console.warn("[preview] no sample-data.json — live-data modes will be empty");
  }

  installViz({ muze, dataset, mode: dataMode });

  let html = "", css = "", js = "";
  try {
    [html, css, js] = await Promise.all([
      text("/chart/chart.html"),
      text("/chart/chart.css"),
      text("/chart/chart.js"),
    ]);
  } catch (err) {
    showError("could not load chart files", err);
    return;
  }

  hostEl.innerHTML = html;

  const style = document.createElement("style");
  style.id = "chart-css";
  style.textContent = css;
  document.head.appendChild(style);

  let completed = false;
  globalThis.addEventListener("preview:render-completed", () => {
    completed = true;
    setStatus(`rendered · data=${dataMode}`, "ok");
  });

  try {
    await new AsyncFunction(js)();
  } catch (err) {
    // The real BYOC sandbox swallows this into "Something went wrong". Showing the
    // stack is the whole reason to iterate here instead of on a tile.
    showError("chart.js threw", err);
    return;
  }

  // A chart that renders but never signals completion hangs Liveboard PDF export.
  // Silent in the host; loud here.
  setTimeout(() => {
    if (!completed) {
      setStatus(
        `rendered, but emitRenderCompletedEvent() was never called · data=${dataMode}`,
        "warn"
      );
    }
  }, 1200);
}

main().catch((err) => showError("preview failed", err));
