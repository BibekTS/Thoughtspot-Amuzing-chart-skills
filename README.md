# Thoughtspot Amuzing chart skills

Claude skills for building ThoughtSpot custom charts (BYOC), for Claude Code and the Claude app.

One skill so far: **thoughtspot-amuzing-chart** — it writes the three files a BYOC
tile takes (`chart.html`, `chart.css`, `chart.js`) and iterates them in a real
browser until the render is right, instead of handing you code it has never run.

## What it does

The preview runs the same three files you will paste, through a `viz` stub, inside an
`AsyncFunction` — the shape the real ThoughtSpot host uses. So there is no porting step
at the end: what was iterated is what ships.

A run goes: settle the data mode → write a frozen sample dataset → open a browser
window you can watch (or, where no window can open, capture headless) → for each attempt, edit the files, screenshot, read the
screenshot with vision, critique, fix the top defect → verify the data modes the loop
did not exercise (absent, object-wrapped, empty) → emit the three files.

## Install

Copy the skill folder into the project where you want to use it:

```bash
git clone git@github.com:BibekTS/Thoughtspot-Amuzing-chart-skills.git
mkdir -p /path/to/your-project/.claude/skills
cp -R Thoughtspot-Amuzing-chart-skills/skills/thoughtspot-amuzing-chart \
      /path/to/your-project/.claude/skills/
```

A symlink works too, and keeps the skill current with `git pull`:

```bash
ln -s "$PWD/Thoughtspot-Amuzing-chart-skills/skills/thoughtspot-amuzing-chart" \
      ~/.claude/skills/thoughtspot-amuzing-chart
```

With the copy, runs and deliverables land in `runs/` and `output/` of the project you
installed into. With the symlink they land in the clone's own `runs/` and `output/`,
whichever project you open Claude Code in. Neither ends up in your home directory.

Requirements: Node 20+ and npm. The first run installs Playwright and Chromium into
`helpers/node_modules` (~2 min, asked for once). That directory is gitignored.

## Using it in the Claude app

The same skill runs in the Claude app (claude.ai and the desktop app), with the same
8-attempt render → screenshot → critique → fix loop. The difference is that there is
no window to watch: each attempt is captured headless and handed to you as a PNG.

1. Turn on **Settings → Capabilities → Code execution and file creation**.
2. Build the upload bundle from a checkout of this repo:

   ```bash
   cd skills && zip -r ../thoughtspot-amuzing-chart.zip thoughtspot-amuzing-chart \
     -x '*/node_modules/*' '*.DS_Store'
   ```

3. Upload `thoughtspot-amuzing-chart.zip` under **Settings → Capabilities → Skills**.
4. Ask for a chart in a new chat.

On the first run it installs `playwright-core` (~30 s) and uses the sandbox's own
Chromium; it never tries to download a browser there. Every attempt's screenshot is
copied to the outputs folder as `<chart-name>/attempts/NN.png`, and the deliverables
land in `<chart-name>/` beside them, ready to download.

Two limits come with the sandbox. Chart.js, Plotly and gridjs load from a CDN, which
the sandbox usually blocks, so those charts are written but reported as *not
previewed*; Muze, hand-built tables and raw SVG are fully verified. And system fonts
differ from ThoughtSpot's, so text metrics can be a pixel or two off.

If it fails, ask Claude to run
`node /mnt/skills/user/thoughtspot-amuzing-chart/helpers/env.mjs` and send the output
to the skill author — it names the missing piece and the command that fixes it.

## Building a chart

1. **Ask for one.** Open Claude Code in the project you installed the skill into and
   describe the chart — or invoke the skill directly with
   `/thoughtspot-amuzing-chart`. All of these routes work:
   - *"Build me a diverging bar chart of revenue vs. target by region"* (from prose)
   - Attach a screenshot of a chart you want recreated (from an image)
   - Point it at an existing tile's three files that misbehave (debug)
   - *"Convert this chart from sample data to live data"* (mode conversion)

2. **Answer the data-mode question if asked.** Sample-only, live-only, or live with
   sample fallback (the default — one file that works on a live tile, an unbound
   tile, and a plain browser). If your chart is going onto a real search, paste the
   `Available Columns` block from your chart editor so the generated code uses your
   exact column names.

   **Bring your own data if you have it.** Hand over a CSV (or describe your column
   structure) and the preview iterates against your real data shape instead of
   invented rows — the file is parsed, capped at 30 rows, and frozen for the run. In
   the fallback mode those same rows ship as the chart's baked-in sample data, so
   the tile shows something realistic even before the search is attached.

3. **Watch it iterate.** A Chromium window opens showing a tile-shaped box. Claude
   edits the chart files, the window reloads, and each attempt is screenshotted and
   critiqued with vision until the render matches — usually a handful of attempts.
   Where no window can open (the Claude app, a machine without a display) the same
   loop runs headless and you get each attempt's PNG instead.
   Anything you say mid-loop ("make the bars horizontal") becomes the next fix.

4. **Collect the deliverables.** Each chart gets its own folder,
   `output/<chart-name>/`, containing the three files, a `preview.png` screenshot of
   the final render, and a `README.md` that states the exact search to build in
   ThoughtSpot (including any prior-period columns needed for `vs. Last Month`-style
   measures), which data mode the file is in, and anything that could not be
   reproduced.

5. **Paste into ThoughtSpot.** In your custom chart's editor:
   `chart.html` → HTML tab, `chart.css` → CSS tab, `chart.js` → JS tab. Attach the
   search from the run README. If the chart is in live-with-fallback mode you can
   paste it before the search exists — it renders its sample rows with a
   "sample data" badge until real rows arrive.

Working artifacts stay under `runs/<slug>/` (chart files, attempt screenshots,
critiques), so a run can be resumed or audited later. `runs/` is gitignored;
`output/` is the keepable result.

## Layout

```
skills/thoughtspot-amuzing-chart/
  SKILL.md            the procedure — the file Claude reads
  references/         byoc-data-modes · hard-rules · examples · emit-checklist ·
                      muze-api-reference · system-prompt
  examples/           working charts, indexed by references/examples.md
  helpers/            env (the doctor) · serve · capture · start-preview · snap ·
                      close-preview, plus a smoke-test fixture
  scaffold/           the preview page, including a vendored Muze bundle
```

Everything the skill reads travels inside that one folder, so it works from whatever
project it is installed into.

## Examples

`skills/thoughtspot-amuzing-chart/examples/` carries charts that already render
correctly in ThoughtSpot, grouped by library: Muze (bubble, diverging axis, funnel,
invoice), Chart.js over CDN (bump, sunburst, KPI), hand-built DOM (pivot table, flat
table, waffle, funnel), raw SVG (hex cartogram, KPI), and self-contained HTML.

`references/examples.md` indexes them by shape and says what each is worth opening for —
mostly the workarounds for bugs that are expensive to rediscover: Muze's point-size
clamp, its domain-array mutation on re-mount, object-wrapped cells, TS column names
that carry non-breaking spaces.

They were written before the preview loop existed, so they are correct-in-ThoughtSpot,
not correct-in-preview. Copy the technique, not the file.

## Status

2026-09-29: verified on macOS against both paths. Headed: the window reloads within
~0.4 s of an edit, captures stay 2496x1340 (unchanged from earlier runs), and a
Muze example renders the same as under the previous Vite preview. Headless: a
read-only copy of the skill with no `node_modules`, forced into Claude-app mode,
installs `playwright-core` from the doctor's `fix:` line and captures every data
mode plus `--tile 620x400` / `1400x500`; a Chromium that cannot open a window falls
back to headless on its own. Not yet run inside the Claude app itself — the doctor
output from a first run there is the thing to check.


Smoke-tested end to end (2026-08): helper install, headed preview daemon, a mode-C
Muze bar chart snapped in all four data modes (`live`, `absent`, `wrapped`, `empty`),
and clean shutdown all verified against a checkout of this repo. The helpers also
work from a plain clone — `runs/` is created next to `skills/` when the skill has
not been copied into a `.claude/skills/` install.
