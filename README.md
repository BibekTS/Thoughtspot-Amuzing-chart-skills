# Thoughtspot Amuzing chart skills

Claude Code skills for building ThoughtSpot custom charts (BYOC).

One skill so far: **thoughtspot-amuzing-chart** — it writes the three files a BYOC
tile takes (`chart.html`, `chart.css`, `chart.js`) and iterates them in a real
browser until the render is right, instead of handing you code it has never run.

## What it does

The preview runs the same three files you will paste, through a `viz` stub, inside an
`AsyncFunction` — the shape the real ThoughtSpot host uses. So there is no porting step
at the end: what was iterated is what ships.

A run goes: settle the data mode → write a frozen sample dataset → open a headed
browser window you can watch → for each attempt, edit the files, screenshot, read the
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

Requirements: Node 18+ and npm. The first run installs Playwright and Chromium into
`helpers/node_modules` (~2 min, asked for once). That directory is gitignored.

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

3. **Watch it iterate.** A Chromium window opens showing a tile-shaped box. Claude
   edits the chart files, the window reloads, and each attempt is screenshotted and
   critiqued with vision until the render matches — usually a handful of attempts.
   Anything you say mid-loop ("make the bars horizontal") becomes the next fix.

4. **Collect the three files.** They land in `runs/<slug>/final/` alongside a
   `README.md` that states the exact search to build in ThoughtSpot (including any
   prior-period columns needed for `vs. Last Month`-style measures), which data mode
   the file is in, and anything that could not be reproduced.

5. **Paste into ThoughtSpot.** In your custom chart's editor:
   `chart.html` → HTML tab, `chart.css` → CSS tab, `chart.js` → JS tab. Attach the
   search from the run README. If the chart is in live-with-fallback mode you can
   paste it before the search exists — it renders its sample rows with a
   "sample data" badge until real rows arrive.

Everything the loop produced stays under `runs/<slug>/` (attempt screenshots,
critiques, the preview app), so a run can be resumed or audited later. `runs/` is
gitignored.

## Layout

```
skills/thoughtspot-amuzing-chart/
  SKILL.md            the procedure — the file Claude reads
  knowledge/          byoc-data-modes · hard-rules · examples · emit-checklist
  examples/           working charts, indexed by knowledge/examples.md
  reference/          Muze API reference and the long-form chart system prompt
  helpers/            start-preview · snap · close-preview (Playwright + Vite)
  scaffold/           the preview app, including a vendored Muze bundle
```

Everything the skill reads travels inside that one folder, so it works from whatever
project it is installed into.

## Examples

`skills/thoughtspot-amuzing-chart/examples/` carries charts that already render
correctly in ThoughtSpot, grouped by library: Muze (bubble, diverging axis, funnel,
invoice), Chart.js over CDN (bump, sunburst, KPI), hand-built DOM (pivot table, flat
table, waffle, funnel), raw SVG (hex cartogram, KPI), and self-contained HTML.

`knowledge/examples.md` indexes them by shape and says what each is worth opening for —
mostly the workarounds for bugs that are expensive to rediscover: Muze's point-size
clamp, its domain-array mutation on re-mount, object-wrapped cells, TS column names
that carry non-breaking spaces.

They were written before the preview loop existed, so they are correct-in-ThoughtSpot,
not correct-in-preview. Copy the technique, not the file.

## Status

Smoke-tested end to end (2026-08): helper install, headed preview daemon, a mode-C
Muze bar chart snapped in all four data modes (`live`, `absent`, `wrapped`, `empty`),
and clean shutdown all verified against a checkout of this repo. The helpers also
work from a plain clone — `runs/` is created next to `skills/` when the skill has
not been copied into a `.claude/skills/` install.
