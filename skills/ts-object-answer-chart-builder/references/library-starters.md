# Starters and traps by library (learned building the Amuzing chart samples Liveboard)

Library and Liveboard charts start from the shared core (`library/_shared/core.js`): `AZ.boot`, `AZ.col`, `AZ.tip`,
`AZ.loadScript`, `AZ.liveData`, formatters, the family theme. A standalone MayaCharts tile needs none of it (see its
section). What follows is what each library needs in a real ThoughtSpot tile. All of it was verified in a cluster
screenshot unless marked otherwise.

## Any library

- Load a CDN library with `AZ.loadScript([primary, fallback], () => !!window.Lib, 8000)`. It injects at once
  when no matching `<script src>` is in the document and waits up to 3 s when one is. A plain
  `<script src>` in `chart.html` is allowed by `liveboard-pack`; an inline script body containing `</script` is not.
- `fetch()` is blocked inside a tile. Inline data and maps.
- No backtick, no `${`, ASCII only (a literal non-ASCII character such as an arrow corrupts the checksum in
  transit). Use `String.fromCharCode(8595)` for an arrow if you must; a `\\u0001` escape in source is fine.
- Test at 280px wide as well as the nominal size.

## MayaCharts (mayacharts, `maya.global.js`)

Verified in the preview (headless Chromium, 0.15.0) on the starter below, `examples/maya-was-bars/` and the three
MayaCharts library charts: render, every data mode, 280px to 1400px tiles, hover, click, sweep. Not yet screenshotted on a cluster: say "verified in preview" until it has been.

- **Version: the latest release, pinned.** Take it from the doctor's `mayacharts:` line (it asks jsDelivr, then npm)
  and write it into the one `MAYA` URL constant. Never `mayacharts/dist/...` without a version: a saved tile would change under the
  user on the next release. Never a version from memory: the library ships often. If the line says `unknown`, ask.
- **The whole tile is 6 fixed lines plus one spec.** No `AZ.boot`, no `AZ.tip`, no header or readout unless the user asks
  for one: the element paints its own empty state (`text.noData`) and errors, follows its box, and carries the
  tooltip, selection and keyboard focus. Verified in the preview on live, absent, wrapped, empty and no-host data,
  280 to 1400px tiles, an empty HTML tab and a CDN that fails to load:
  ```js
  // Search: [sales] [item type]
  const MAYA = 'https://cdn.jsdelivr.net/npm/mayacharts@0.15.0/dist/maya.global.js';
  const el = document.getElementById('chart') ?? document.body.appendChild(Object.assign(document.createElement('maya-chart'), { id: 'chart' }));
  const done = () => viz?.events?.emitRenderCompletedEvent();
  if (!document.querySelector('script[src="' + MAYA + '"]')) document.head.appendChild(Object.assign(document.createElement('script'), { src: MAYA, onerror: () => { el.textContent = 'MayaCharts could not load from ' + MAYA; done(); } }));
  const rows = ((r) => { const k = r.schema.map((c) => c.name); return r.data.map((d) => { const o = {}; k.forEach((n, i) => { const v = d[i]; o[n] = v !== null && typeof v === 'object' ? (typeof v.value === 'function' ? v.value() : v.value) : v; }); return o; }); })(viz?.getDataFromSearchQuery?.()?.getData() ?? { schema: [], data: [] });
  ['maya-render', 'maya-error'].forEach((t) => el.addEventListener(t, done, { once: true }));
  el.spec = { type: 'bar', x: 'Item Type', y: 'Total Sales', theme: THEME, data: rows };
  ```
  `chart.html` is `<maya-chart id="chart"></maya-chart>` (plus the Geist link); `chart.css` is
  `html, body { height: 100%; margin: 0; background: #fff; } #chart { display: block; height: 100%; min-height: 0; color-scheme: light; }`.
  The JS injects the global build itself (all 27 types; the ESM files need `import`, which a JS tab cannot do), so
  an HTML tab pasted empty still works. Signal render-complete on `maya-render` and on `maya-error`, never on
  `customElements.whenDefined`, which fires before the first draw when the JS runs before the library has loaded
  (measured; BbekShr/mayacharts#59). The `rows` line is the same in every tile: never edit it, only the spec changes.
  It is a plain loop over the column names, about 3x faster than `Object.fromEntries` per row (100k wrapped rows:
  10 ms against 27 ms; 1M: 106 ms against 256 ms). In a library chart (core block present) read with
  `const { schema, rows } = AZ.liveData() ?? { schema: [], rows: [] };` instead, and use `AZ.col(schema, /sales/i)`
  where a cluster may case a column differently.
- **`min-height: 0` on the element is required**: its `:host` sets `min-height: 200px`, so in a short tile the axis
  spills past the box.
- **Fit the bar count to the tile**: bars squeeze to slivers rather than drop. Set `limit` from the tile height
  (about 22px a bar) and the rest roll into Other.
- **Theme to the house style** with tokens, not CSS overrides: `{ font: 'Geist, system-ui, sans-serif', fontSize:
  '12px', fg: AZ.T.ink, fgMuted: AZ.T.muted, accent: AZ.T.ink, series1: AZ.T.ink, radius: '2px', bg: '#FFFFFF' }`.
  Family hues go in `colors` as a map keyed by series value (`{ Outerwear: AZ.T.family.Outerwear, ... }`). Pin
  `color-scheme: light` on the element: ThoughtSpot tiles are light whatever the OS is.
- **Spec is JSON only**: no callbacks, no formatters. Money on an axis: `format: { sales: { style: 'currency',
  currency: 'USD', notation: 'compact', maximumFractionDigits: 1 } }` (the `currency` preset prints `$1,000,000`).
  Display names: `titles`. Dates: epoch ms work with `xType: 'time'`.
- **`was` (ghost of last period) needs wide rows** (`{ item, sales, before }`). A search such as
  `[sales] [item type] [date].yearly` returns long rows, one per item and year, so pivot the latest two years first
  (about 10 lines; BbekShr/mayacharts#60 asks for a period field instead). `was` does not combine with `stack` or a
  `y` array.
- **Interactivity is built in**: hover tooltip and dimming, keyboard focus, `legend` toggles, `select: true` (listen
  for `maya-select`, `e.detail.selected[0].x`), `drill` on a `path`, `zoom`. That meets the contract's interaction
  bar without `AZ.tip`. Restore a selection after a redraw with `chart.selected = [{ x: picked }]`.
- **Shadow DOM**: the marks live in the element's open shadow root. `probe.mjs` and `snap.mjs`'s `svg-fit` look
  inside it, and so do `--click-sel` / `--hover-sel` (marks carry `data-x`, e.g. `--click-sel "rect[data-x]"`); your
  own `--eval` / `--after` expressions must reach in themselves (`document.querySelector('maya-chart').shadowRoot`).
- Too many marks: bars roll up into "Other" past 10,000 marks and say so; waterfall, dumbbell and the module charts
  throw `too-many-marks` instead. Keep searches aggregated, or set `limit`.
- Errors carry a code and a link (`https://bbekshr.github.io/mayacharts/errors.html#<code>`): read that page before
  guessing.

## ECharts (echarts@5)

- Render with `renderer: 'svg'`, set `animation: false`, and pass an explicit `width` and `height`
  (`echarts.init(el, null, { renderer: 'svg', width: w, height: h })`). Without them the first paint can be a
  fraction of the container, and a screenshot taken after render-complete catches a half-drawn chart.
- Fill any header text **before** you measure the plot area, then call `chart.resize({ width, height })`.
- zrender pointer events do not fire on empty areas. Attach native listeners to the container, and convert
  with `chart.convertFromPixel({ xAxisIndex: 0 }, px)` using a scalar.
- Sankey and sunburst labels collide first: drop or shorten the small ones and say so in the sub line.

## D3 (d3@7)

- Use it for scales, layouts (`d3.stack`, `d3.area`) and transitions; write the DOM yourself where a
  library would fight the shared tooltip.
- Geography: do not fetch topology. `library/_shared/us-states.js` holds all 51 states as pre-projected
  Albers paths (viewBox 0 0 975 610) with centroids. Paste the const into the chart body and draw plain SVG.

## Chart.js (chart.js@4)

Loaded from a CDN, so it cannot be previewed where the doctor reports `cdn: blocked`; verify it on a tile. Load `https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js`
through `AZ.loadScript` (bounded, with a fallback host); reference `window.Chart` after it resolves. Plugins load
the same way afterwards and register on `window.Chart` by themselves.

- `responsive: true, maintainAspectRatio: false` inside a flex parent (`flex: 1 1 0; min-height: 0`). That option
  listens to `window.resize` only, so the core's `ResizeObserver` on `#chart` is still what re-fits a tile. Keep
  the instance in a module-scope variable and `chart?.destroy()` before re-creating on a redraw.
- **Plugin CDN URLs need the explicit `/dist/<file>.min.js` path.** `.../chartjs-plugin-datalabels@2` alone
  returns 404 on jsdelivr, the plugin never registers, and the chart silently renders without labels:
  `https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2/dist/chartjs-plugin-datalabels.min.js`,
  `https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3/dist/chartjs-plugin-annotation.min.js`,
  `https://cdn.jsdelivr.net/npm/chartjs-chart-sankey@0.12/dist/chartjs-chart-sankey.min.js`.
- Bar plus line with bars coloured above or below plan: two bar datasets, each `null` where the other owns the
  row, plus the plan line. `chartjs-plugin-datalabels` for the bar values.

```javascript
datasets: [
  { type: 'bar', label: 'Below Plan', data: actuals.map((v,i) => v < plan[i] ? v : null), backgroundColor: '#16a34a' },
  { type: 'bar', label: 'Above Plan', data: actuals.map((v,i) => v >= plan[i] ? v : null), backgroundColor: '#dc2626' },
  { type: 'line', label: 'Plan', data: plan, borderDash: [6,4], borderColor: '#3b82f6', fill: false },
]
```

- Background performance bands on a line chart: a plugin that fills rects in `beforeDraw`, reading pixel extents
  from `chart.chartArea` and `chart.scales.y.getPixelForValue(v)`.

```javascript
const bandPlugin = {
  id: 'bands',
  beforeDraw(chart) {
    const { ctx: c, chartArea: { top, bottom, left, right }, scales: { y } } = chart;
    [{ yMin: 80, yMax: 100, color: 'rgba(45,212,191,0.18)' },
     { yMin: 40, yMax: 80,  color: 'rgba(200,200,200,0.15)' },
     { yMin: 0,  yMax: 40,  color: 'rgba(252,165,165,0.22)' }].forEach(({ yMin, yMax, color }) => {
      const yT = y.getPixelForValue(yMax), yB = y.getPixelForValue(yMin);
      c.save(); c.fillStyle = color;
      c.fillRect(left, Math.max(yT, top), right - left, Math.min(yB, bottom) - Math.max(yT, top));
      c.restore();
    });
  },
};
new Chart(ctx, { type: 'line', plugins: [bandPlugin], ... });
```

- Horizontal progress meter (actual vs target): `type: 'bar', indexAxis: 'y'`, two stacked datasets (actual and
  the gap to target), `borderRadius` per side, hidden axes; `chartjs-plugin-datalabels` for the centre value and
  `chartjs-plugin-annotation` for a dashed target line, or an absolutely positioned `<div>` with
  `transform: translateX(-50%)` as the tick.
- Sankey (`chartjs-chart-sankey`): `type: 'sankey'`, data as `[{ from, to, flow }]`, `colorFrom` / `colorTo`
  callbacks of `(context) => colorMap[context.dataset.data[context.dataIndex].from]`. Node labels are
  single-line; `\n` renders literally. The library's sankey is on ECharts.
- Smooth line through 2 or 3 sparse anchors (2024, 2035, 2050) without overshoot: damped cubic Hermite,
  inlined.

```javascript
function smoothInterp(y0, v0, y1, v1, y2, v2, yr) {
  if (yr <= y0) return v0;
  if (yr >= y2) return v2;
  // damped cubic Hermite — t in [0,1] across the segment
  const segStart = yr <= y1 ? y0 : y1;
  const segEnd   = yr <= y1 ? y1 : y2;
  const vStart   = yr <= y1 ? v0 : v1;
  const vEnd     = yr <= y1 ? v1 : v2;
  const t = (yr - segStart) / (segEnd - segStart);
  const damp = t * t * (3 - 2 * t);
  return vStart + (vEnd - vStart) * damp;
}
```

## Hand SVG and HTML (most tiles)

- Hit-test by position, not by element, in dense grids (waffle squares, heat cells), so the gaps register.
- One `AZ.tip`, one focus style, one radius (6px). Toggles are real `<button type="button">` elements and
  call `redraw()`; keep their state in module-scope variables so it survives a redraw and a resize.
- Part periods: a first or last quarter or year whose total is far below its neighbours is partial. Detect it
  from the rows and label it.
- Size an inline SVG with a `viewBox` computed from the measured width (`0 0 w h`), guarded by `w > 0`, so it
  re-fits on every `redraw`. The core's observer and `requestAnimationFrame` batching already stop thrash.
- Semi-circle gauge: two arc paths, a track from 180 to 360 degrees and a fill to `180 + pct * 180`, both with
  `stroke-linecap="round"`; the SVG only needs the top half (`viewBox="0 0 160 90"` for r=60, cx=80, cy=80).

```javascript
function arcPath(cx, cy, r, startAngle, endAngle) {
  const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle),   y2 = cy + r * Math.sin(endAngle);
  const large = (endAngle - startAngle) > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}
// Track (full): arcPath(cx, cy, r, Math.PI, 2*Math.PI)
// Fill:         arcPath(cx, cy, r, Math.PI, Math.PI + (pct/100)*Math.PI)
```

  (The snippet above uses a template literal for readability; a shipped chart builds the string with `+`.)
- Slope or bump chart (rank over time) on an HTML5 canvas: container `flex: 1 1 0; min-height: 0`;
  `canvas.width = wrap.offsetWidth * devicePixelRatio` and scale the context for HiDPI;
  `xForYear(yr) = padL + ((yr - minYr) / (maxYr - minYr)) * chartW`;
  `yForRank(r) = padT + ((r - 1) / (N - 1)) * chartH` (rank 1 at the top); lines with
  `beginPath / moveTo / lineTo / stroke`; left labels `textAlign = 'right'`, right labels `'left'`; dots at
  anchor years with `arc(x, y, 3, 0, Math.PI * 2)`.
- A gradient edge on a text card: prefer a sibling `<div>` (`width: 6px; align-self: stretch; flex-shrink: 0`)
  in a flex row over `border-image` on `border-left`, which paints as one solid colour when the card's height is
  not resolved at paint time. Use it only where the taste rules allow a gradient at all.
- A text-only tile (quote, attribution, intro) is chart.html plus chart.css; chart.js only boots and signals
  render-complete.

## Tooling notes (macOS)

- `sed -i` needs a backup suffix (`sed -i.bak`), `grep -P` is absent, and `timeout` does not exist.
- zsh does not word-split an unquoted `$args`; use `bash -c` in loops, or the `--data=absent` /
  `--tile=620x400` forms.
- `snap.mjs` takes about 10 s. An all-slug edge-check loop exceeds a 120 s tool call: run it in the background.

## Motion and drill-down

- Motion helpers live in the core: `AZ.tween(ms, step, done, ease)`, `AZ.animator()` (cancels its previous run, so
  rapid toggles never fight), `AZ.countUp`, `AZ.lerp`, `AZ.reduced()` (skip motion when true), `AZ.settle()`.
- Keep the last drawn state in a module-scope variable and tween from it, so a slider or toggle glides instead of
  jumping (`library/next-what-if`).
- Drill-down: keep the current level in a module-scope `let`, draw `AZ.crumbs(...)` and wire them with
  `AZ.wireCrumbs`, read the new level back after a redraw. Click the centre or a crumb to go up. Every drill needs
  a visible way back and a hint that says what a click does.
- Order inside `render`: build the header text, `await AZ.settle()`, measure, draw, then run the entrance.
- When a view draws two levels (a treemap showing item types inside families), the pointer is almost always
  over the inner level. Resolve a click to the child of the current focus that contains it, so a click
  anywhere inside a rectangle goes down exactly one level. Handling only the exact node clicked made the
  treemap look dead after the first drill: its visible rectangles were leaves (`library/what-treemap-drill`,
  `stepOf`). Test a drill by clicking the centre of the largest rectangle at every level, not a header strip.
- Never raise the hovered SVG element to the top (`parent.appendChild(el)`) to show an outline when marks nest:
  a hovered parent then covers its own children and stays on top after the mouse leaves, so the chart
  looks merged and clicks land on the wrong level. Draw the outline as a separate `pointer-events: none`
  rect kept last in the SVG (`library/what-treemap-drill`, `hl`). Test hover by moving over every parent,
  then check `document.elementFromPoint` inside it still returns a child.
- Never ignore clicks while an animation runs (`if (!animating) drill()`). Browsers pause animation frames in
  hidden or off-screen tile frames, so the animation may never end and the chart never takes a click. Record
  the end state first, let a click jump the animation to it, and finish it on a timer (`ms + 400`) as a
  fallback (`library/what-treemap-drill`, `transition`).
- Where a library drills natively, use it (Plotly `sunburstclick`, `Plotly.restyle` for crumb jumps); do not
  rebuild the chart per click.
- KPI variants worth copying: `kpi-ring`, `kpi-bullet`, `kpi-odometer`, `kpi-sparkbars`, `kpi-quarter-pairs`,
  `kpi-flip`, `kpi-dotstrip`. Same data, different reading; offer more than one per Liveboard.
