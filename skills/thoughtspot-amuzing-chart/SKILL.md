---
name: thoughtspot-amuzing-chart
description: Build a ThoughtSpot custom chart (BYOC) as three paste-ready files — chart.html, chart.css, chart.js — by iterating in a real browser until the render is right. Opens a headed preview the user watches, screenshots each attempt, critiques it with vision, and fixes the top defect. Use when the user wants a ThoughtSpot custom chart, a BYOC tile, a Muze chart, or wants an existing chart tile rebuilt, debugged, or converted between sample and live data. Covers Muze, Chart.js, gridjs, hand-built HTML tables, and raw SVG. Not for native ThoughtSpot chart configuration or non-ThoughtSpot charting work.
---

# ThoughtSpot custom chart builder

You are the engine. You write the three files, run the helpers over Bash, read the
screenshots with vision, critique, fix, repeat. No orchestrator, no API calls.

The preview runs **the same three files the user will paste**, through a `viz` stub,
inside an `AsyncFunction` — the shape the real host uses. So there is no porting step
at the end: what you iterated is what ships. Everything below protects that property.

Two things the harness withholds on purpose, because supplying them is how a chart
passes here and ships as a blank tile:

- **`viz` arrives as an argument, never as `globalThis.viz`.** Read the bare
  identifier.
- **The preview page does not set `html, body { height: 100% }`.** `chart.css` has to
  complete its own height chain, exactly as on a tile.

`snap.mjs` reports both — a `height-chain:` line in the diagnostic block, and a
status warning when render-complete never fires. Read them; neither shows up in the
screenshot.

## Route first

| Trigger | Do |
|---|---|
| User attaches or points at a chart image | **Rebuild** — match the image |
| User describes a chart in prose | **Build** — match the description |
| User has an existing tile that misbehaves | **Debug** — start from their files, skip to the loop |
| User wants sample→live or live→sample | **Convert** — read `knowledge/byoc-data-modes.md`, change the mode, verify both |
| Ambiguous | Ask once, briefly, then go |

## Step 0 — setup check (every run, one Bash call)

```bash
SKILL="$(pwd)/.claude/skills/thoughtspot-amuzing-chart"
test -d "$SKILL/helpers/node_modules/playwright" && echo "deps:ok" || echo "deps:missing"
```

(Shell state does not persist between Bash calls — substitute the real paths and
slug into every command rather than relying on `$SKILL` / `$SLUG` surviving.)

If `deps:missing`, ask once — "First-time setup, ~2 min: install Playwright +
Chromium. OK?" — then run the install below.

If `deps:ok`, still run `cd "$SKILL/helpers" && npx playwright install chromium`
once per run — from `helpers/`, so npx resolves the locally installed Playwright. It is a
no-op in a second or two when the right build is already cached, and it is the only
reliable check: Chromium is pinned to the *Playwright* version, so a cache holding
`chromium-1228` looks fine to `ls` and still fails to launch when the installed
Playwright wants `chromium-1234`. Do not substitute a directory-existence test — that
false pass costs a failed daemon start and a confusing error.

```bash
cd "$SKILL/helpers" && npm install && npx playwright install chromium
```

## Step 1 — load knowledge

Read before writing any chart code, in this order:

1. `knowledge/byoc-data-modes.md` — sample vs. live vs. both. **Always.**
2. `knowledge/hard-rules.md` — the silent failures, and how each one shows up.
3. `knowledge/examples.md` — the working charts under `examples/`, indexed by shape.
   Find the nearest one and read it before writing; it settles the API questions
   faster than the reference does and carries the workarounds already found.
4. `reference/system-prompt.md` — long-form recipes and patterns.
5. `reference/muze-api-reference.md` — when the chart is Muze.

All five ship with the skill; paths are relative to the skill folder, wherever it is
installed.

## Step 2 — settle the data mode

Do this before writing code, and ask if the user has not said. Default to **C**.

- **A — sample only.** Rows baked in. Demos, layout, print work.
- **B — live only.** `getDataFromSearchQuery()`. A tile bound to a real search.
- **C — live with sample fallback.** Tries live, falls back to baked-in rows, shows a
  "sample data" badge. One file that works on a live tile, an unbound tile, and a
  plain browser.

Skeletons are in `knowledge/byoc-data-modes.md`. Follow them; do not improvise a
fourth shape.

If the user has a real search, ask them to paste the `Available Columns` block from
their chart editor and map the field constants onto those exact names.

## Step 3 — run dir and dataset

```bash
SLUG=<kebab-case-slug>          # revenue-by-region, credit-tier-snapshot
mkdir -p "runs/$SLUG"
```

Write `runs/$SLUG/intent.txt` — one paragraph. From the image (vision) or the user's
prose. This is what you critique against later, so be concrete: chart type, encodings,
what "correct" looks like.

Write `runs/$SLUG/sample-data.json` **once**, at run start. Never regenerate it
mid-loop — a moving schema means the loop cannot converge.

```json
{
  "schema": [
    { "name": "REGION",  "type": "dimension" },
    { "name": "REVENUE", "type": "measure", "defAggFn": "sum" }
  ],
  "rows": [ { "REGION": "EMEA", "REVENUE": 1240 } ]
}
```

Max 30 rows. If the user supplied a CSV, parse it and cap it. Otherwise invent
something plausible for the chart type. The preview serves this file both as the
baked-in sample rows and, reshaped into TS's array-row form, as the live query
result. Schema `type` passes through as declared — real clusters have been seen
reporting both `measure` and `MEASURE`, so charts should accept either.

## Step 4 — start the headed preview

```bash
node ".claude/skills/thoughtspot-amuzing-chart/helpers/start-preview.mjs" "$SLUG" &
```

Background it (`run_in_background: true`). It seeds `runs/$SLUG/chart/` with three
placeholder files, copies the scaffold, installs it once, starts Vite, and opens a
window the user watches. Wait for `runs/$SLUG/.preview/cdp.json` before continuing.

The window shows a tile-shaped box. Editing any of the three chart files triggers a
full reload — the user sees each attempt land.

## Step 5 — the loop

For `attempt = 01..8`:

1. **Edit** `runs/$SLUG/chart/chart.{html,css,js}`. First attempt: derive from the
   image or intent plus the knowledge files. Use UPPER_SNAKE_CASE field constants
   matching `sample-data.json`.
2. **Archive this attempt's files** so each `NN.png` sits next to the exact code
   that produced it:
   ```bash
   mkdir -p "runs/$SLUG/attempts/$attempt" && cp runs/$SLUG/chart/* "runs/$SLUG/attempts/$attempt/"
   ```
3. **Capture:**
   ```bash
   node ".claude/skills/thoughtspot-amuzing-chart/helpers/snap.mjs" "$SLUG" "$attempt"
   ```
   Writes `attempts/NN.png` and prints a diagnostic block — status line, console
   errors, whether `emitRenderCompletedEvent` fired.
4. **Critique.** Read the PNG with the Read tool. **Read the diagnostic block too** —
   a chart that throws still screenshots, just empty, and the two failures need
   different fixes. Write `attempts/NN.critique.md`:
   ```
   VERDICT: MATCH | CLOSE | OFF
   DEFECTS:
   - <one per line, worst first>
   ```
5. **Decide:**
   - `MATCH` → go to step 6.
   - Same defect list twice running → escalate: change the mark, the encoding, or the
     library. Repeating the same fix harder does not work.
   - Three `OFF` in a row → stop and ask the user; you are solving the wrong problem.
   - Otherwise → fix the top defect and loop.
6. **User interjection.** A new message mid-loop is the top defect for the next pass.

Past 8 attempts without MATCH: stop, write `lessons.md` with `STATUS: incomplete`,
tell the user what is unresolved. Do not quietly keep going.

## Step 6 — verify the modes the loop did not exercise

The loop runs one data mode. These are the failures that only appear in the others,
and skipping them is how a chart that "worked" breaks on someone else's tile.

```bash
H=".claude/skills/thoughtspot-amuzing-chart/helpers/snap.mjs"
node "$H" "$SLUG" 91 --data absent    # mode C must fall back + badge; B must degrade readably
node "$H" "$SLUG" 92 --data wrapped   # object-wrapped cells must survive
node "$H" "$SLUG" 93 --data empty     # zero rows must not throw
node "$H" "$SLUG" 94 --data noviz     # no host at all - mode C must still render
```

Read each PNG — `status: ok` is not the same as correct, and each of these fails
differently. Use distinct attempt numbers so the three frames survive as evidence.

Then two more, neither of which the loop exercises.

**Resize the container, not the window.** `Browser.setWindowBounds` over CDP is
unreliable: it silently no-ops on some builds, and a screenshot taken mid-transition
shows a clipped chart that looks like a bug that is not there. Both failure modes
cost a loop. Set the container's width directly and compare the library's rendered
geometry against it:

```js
host.style.width = '620px';                  // then, after a beat:
svg.getAttribute('width') === stage width ?  // fits
```

Blank means canvas shadowing. Overflow means a missing `ResizeObserver` — Plotly's
and Chart.js's `responsive` options listen to `window.resize` only, and a Liveboard
tile resizes while the window does not. Both are in `knowledge/hard-rules.md`.

**Empty the HTML tab and re-snap.** `chart.js` must build its own mount points. A
chart that only renders when `chart.html` is present fails on a host that evaluates
the JS first — which surfaces as the host's own "Chart did not render" over an empty
tile, with nothing useful in the console.

## Step 7 — emit

Work `knowledge/emit-checklist.md` top to bottom. Then copy the deliverables into
`output/<slug>/` at the project root — files, not chat scroll:

```bash
mkdir -p "output/$SLUG" && cp runs/$SLUG/chart/* "output/$SLUG/"
cp "runs/$SLUG/attempts/<NN>.png" "output/$SLUG/preview.png"   # the MATCH attempt
```

The chart files are copied unchanged — that is the point of the preview running the
real shape. `preview.png` is the screenshot of the attempt that passed, so the folder
shows what the chart looks like without running anything. Write
`output/$SLUG/README.md` per the checklist: the search to build, the data mode, what
could not be reproduced, and which file goes in which tab.

Do **not** paste the three files into the chat. Tell the user the folder path, list
its contents, and summarize the run README in a couple of sentences. Show code inline
only if the user asks for it.

## Step 8 — close

```bash
node ".claude/skills/thoughtspot-amuzing-chart/helpers/close-preview.mjs" "$SLUG"
```

Always, on success or when the user says stop.

## Library choice

Muze by default. Pick by what the chart is — `knowledge/examples.md` has a working
file under `examples/` for each of these rows:

- **Muze** — bar, line, area, scatter, bubble, box, waterfall, pie, heatmap,
  dual-axis, data-bound KPIs. Anything wanting axes, legends, color encodings, or
  tooltips wired to a DataModel.
- **Chart.js** (CDN) — radar, polar, doughnut, sankey, gauges, bespoke smoothing,
  conditional bar coloring, background bands.
- **Plotly** (CDN) — **sunburst**, treemap, icicle. Anything hierarchical where a
  parent's arc must equal the sum of its children (`branchvalues: 'total'`) and
  clicking a wedge should zoom. Do not hand-roll this on Chart.js doughnuts.
- **gridjs** (CDN) — sortable tables. Unwrap object cells first or its Preact renderer
  dies with an opaque error.
- **Hand-built HTML table** — pivots and crosstabs, print-oriented output.
- **Raw SVG / Canvas** — single-stat KPI tiles that are mostly typography.
- **Raw HTML/CSS** — quote cards, text slides, annotation blocks.

CDN loading works in BYOC: `document.createElement('script')` + `await new Promise`.
Never invent `loadScript` / `waitForLib` helpers.

If the request matches none of these and no close analogue exists, say so before
writing code and offer two or three concrete paths. A confident wrong chart costs more
than an honest question.

## What not to do

- Do not regenerate `sample-data.json` mid-loop.
- Do not skip step 6 because the chart looked right.
- Do not report MATCH off the screenshot alone when the diagnostic block shows console
  errors.
- Do not leave the preview daemon running.
- Do not claim a chart is verified against ThoughtSpot. It is verified against a
  faithful stub; the version and theme differences are real. Say "verified in preview".
