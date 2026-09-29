# Working examples shipped with this skill

Charts that already shipped or rendered correctly. Read one before writing a chart of
the same shape — a working file settles the API questions faster than reasoning from
the reference does, and these carry the workarounds for bugs you would otherwise
rediscover.

Paths are relative to the skill folder — `examples/` is a sibling of the `references/`
directory this file lives in, so they travel with the skill wherever it is installed.

Two rules for using them:

- **Copy the technique, not the file.** Every one of these was written against a
  specific search with specific column names. Lifting one wholesale and swapping the
  field constants is how you inherit a data mode and a set of formats nobody asked for.
- **They predate the preview loop.** None was iterated through `snap.mjs`, so treat
  them as correct-in-ThoughtSpot, not correct-in-preview. Still run the loop.

## Muze

| Path | What it is | Worth reading for |
|---|---|---|
| `examples/Examples/Example 1 bubble chart/` | Bubble chart, ~490 lines | `encodingTransform` plus an SVG overlay group. Muze's point-size range clamps around 50px, so the native marks are kept invisible and the bubbles are drawn into a cleared overlay — the only way to get large bubbles without leaking nodes across re-mounts |
| `examples/Examples/Department bubble chart/` | Same shape, smaller | The same overlay pattern with a `ResizeObserver`, and a shorter read |
| `examples/Examples/Example 2 diverging axis/` | Diverging bar, ~300 lines | Axis domain control and `encodingTransform` for a two-sided scale |
| `examples/invoice_muze/invoice.js` | Invoice-style layout, ~510 lines | The cleanest **mode C** in the repo: `USE_SAMPLE_DATA` flag, `DataModel.loadDataSync` for the baked rows, `getDataFromSearchQuery()` for live, one render path for both |
| `examples/funnel-chart/result/` | Funnel | Muze canvas underneath, polygons hand-drawn in SVG on top. Also the domain-mutation workaround: Muze reverses categorical domain arrays on re-mount, so pass `.slice()` and re-config every mount |

Every Muze example here is a `viz.muze` chart, not a Muze Studio script — the canvas is
built and mounted inside the BYOC file.

## Chart.js (CDN)

| Path | What it is | Worth reading for |
|---|---|---|
| `examples/model-connections-bump/result/` | Bump chart, ~420 lines | The CDN load done right: `createElement('script')` + `await new Promise`, jsdelivr pinned to `chart.js@4` |
| `examples/Examples/Example 3 linechart with kpi/` | Line + KPI header | Chart.js beside hand-built DOM in one tile |
| `examples/Examples/Example 5 KPI/` | KPI tile, ~130 lines | The smallest complete example in the repo. Good first read |

## Plotly (CDN)

Sunburst, treemap and icicle. Plotly is the only library here with a real
`type: 'sunburst'` — hierarchy, `branchvalues: 'total'`, click-to-zoom and
`plotly_sunburstclick` all come for free.

| Path | What it is | Worth reading for |
|---|---|---|
| `examples/retail-apparel-sunburst/` | Sunburst, ~470 lines | **Read this one first.** The only example here taken through the preview loop *and* the emit checklist. Hierarchy build, `flatten()` into Plotly's parallel `ids/labels/parents/values` arrays, breadcrumb wired to `plotly_sunburstclick`, plus the four fixes below |
| `examples/Sunburst-chart/result/` and `examples/NWP-sunburst/result/` | Sunburst, ~330 lines each | The same hierarchy technique, older. Carry the defects below — read them for shape, not for correctness |

These two were filed under Chart.js until this commit and are **not** Chart.js. If
a library table sent you to Chart.js for a sunburst, it was wrong; use Plotly.

Four defects in `examples/Sunburst-chart/result/` that a copier inherits silently,
all fixed in `examples/retail-apparel-sunburst/`:

- `index.html` is a standalone page (`<!DOCTYPE html><html><head>`), which is a
  hard-rule violation in the BYOC HTML tab. The CDN load belongs in the JS.
- `String(r[i1])` with no cell unwrapping — an object-wrapped cell becomes
  `[object Object]` and every wedge collapses into one. Run `--data wrapped`.
- `emitRenderCompletedEvent()` only on the success path, with no `try/catch`
  painting `err.stack`.
- Unbounded CDN injection and no `ResizeObserver`. Both produce a tile that fails
  in ThoughtSpot while looking perfect in preview — see `hard-rules.md`.

## Hand-built HTML / DOM

| Path | What it is | Worth reading for |
|---|---|---|
| `examples/table-pivot/pivot-table/newused-summary/` | Pivot table, ~720 lines | The most worked-over file here. A `CONFIG` block at the top is the whole interface; below it are the aggregation rules that make totals match TS — `weightedTotal`, `totalFrom`, `ratioTotal`, `computed` — plus `cellVal` for object-wrapped cells and loose column-name matching for non-breaking spaces. Read it before any pivot or crosstab |
| `examples/table-pivot/table-chart/newused-summary/` | Flat table, ~210 lines | The same CONFIG idea without the pivot machinery |
| `examples/waffle_chart/result/` | Waffle grid, ~230 lines | Cards built with `createElement`, no library |
| `examples/progression-funnel/progression-funnel.js` | Funnel, ~280 lines | Pure DOM funnel; `_progression_funnel_demo.html` beside it is a standalone preview |
| `examples/Examples/Example 4 growth comp/` | Growth comparison | DOM plus `ResizeObserver`, no charting library at all |

## Raw SVG

| Path | What it is | Worth reading for |
|---|---|---|
| `examples/State-hex-cartogram/result/` | US hex cartogram, ~370 lines | `createElementNS` throughout, a fixed layout table keyed by state, and a `ResizeObserver` redraw |
| `examples/kpi-chart/result/` | KPI tile, ~150 lines | Small, typography-led, resize-aware. Has a `README.md` |

## Self-contained HTML (everything in the HTML tab)

`examples/League Table/` puts all markup, CSS and script in `.html`, leaving the `.js`
and `.css` tabs empty. Interactive: dropdowns and filter chips driving a re-render.

`examples/Scoreboard-chart/result/` is the same chart split back into three files —
read `script.js` for the live-data branch guarded with `typeof viz !== 'undefined'`,
which is how these run both in a plain browser and on a tile. (The single-file version
carried 9 MB of inlined match data and is not in this repo.)

This shape is legitimate for text-heavy or print-oriented tiles, but prefer the normal
three-file split unless there is a reason — the preview loop and the emit checklist
both assume it.

## Screenshots

`examples/Examples/*/result.png`, `examples/Scoreboard-chart/result/result.png` and
`examples/model-connections-bump/result/rendered.png` show what those files actually
render. Read one with vision when matching a target image to a technique.
