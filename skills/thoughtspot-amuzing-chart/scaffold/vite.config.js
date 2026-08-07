import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

// publicDir is the run dir (one level up from this `preview/` copy), so the three
// files under runs/<slug>/chart/ are served at /chart/chart.{html,css,js} and the
// dataset at /sample-data.json. No per-run config edit needed.
const runDir = path.resolve(here, "..");

// The three chart files are fetched as text at runtime, not imported as modules —
// that is how the ThoughtSpot host treats them, and it is what lets chart.js use
// top-level `await` and top-level `return`. Vite therefore has no module graph edge
// to them, so HMR never fires. Watch them by hand and force a full reload.
const reloadOnChartEdit = () => ({
  name: "reload-on-chart-edit",
  configureServer(server) {
    server.watcher.add(path.join(runDir, "chart"));
    server.watcher.on("change", (file) => {
      if (file.includes(`${path.sep}chart${path.sep}`) || file.endsWith("sample-data.json")) {
        server.ws.send({ type: "full-reload", path: "*" });
      }
    });
  },
});

export default defineConfig({
  publicDir: runDir,
  plugins: [reloadOnChartEdit()],
  server: {
    fs: { allow: [here, runDir] },
    headers: { "Content-Security-Policy": "frame-ancestors *" },
  },
});
