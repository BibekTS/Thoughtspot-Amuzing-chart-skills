# Thoughtspot Amuzing chart skills

Claude Code skills for building ThoughtSpot custom charts (BYOC).

One skill so far: **ts-chart-builder** — it writes the three files a BYOC tile takes
(`chart.html`, `chart.css`, `chart.js`) and iterates them in a real browser until the
render is right, instead of handing you code it has never run.

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
git clone git@github.com:BibekTS/Thoughspot-Amuzing-chart-skills.git
mkdir -p /path/to/your-project/.claude/skills
cp -R Thoughspot-Amuzing-chart-skills/skills/ts-chart-builder \
      /path/to/your-project/.claude/skills/
```

Then in Claude Code, ask for a ThoughtSpot custom chart — or invoke it directly with
`/ts-chart-builder`.

First run installs Playwright and Chromium into `helpers/node_modules` (~2 min, asked
for once). That directory is gitignored.

## Layout

```
skills/ts-chart-builder/
  SKILL.md            the procedure — the file Claude reads
  knowledge/          byoc-data-modes · hard-rules · examples · emit-checklist
  examples/           17 working charts, indexed by knowledge/examples.md
  reference/          Muze API reference and the long-form chart system prompt
  helpers/            start-preview · snap · close-preview (Playwright + Vite)
  scaffold/           the preview app, including a vendored Muze bundle
```

Everything the skill reads travels inside that one folder, so it works from whatever
project it is installed into.

## Examples

`skills/ts-chart-builder/examples/` carries charts that already render correctly in
ThoughtSpot, grouped by library: Muze (bubble, diverging axis, funnel, invoice),
Chart.js over CDN (bump, sunburst, KPI), hand-built DOM (pivot table, flat table,
waffle, funnel), raw SVG (hex cartogram, KPI), and self-contained HTML.

`knowledge/examples.md` indexes them by shape and says what each is worth opening for —
mostly the workarounds for bugs that are expensive to rediscover: Muze's point-size
clamp, its domain-array mutation on re-mount, object-wrapped cells, TS column names
that carry non-breaking spaces.

They were written before the preview loop existed, so they are correct-in-ThoughtSpot,
not correct-in-preview. Copy the technique, not the file.

## Status

The skill is written and its dependencies check out; it has not yet been run end to end
through the loop in this repo.
