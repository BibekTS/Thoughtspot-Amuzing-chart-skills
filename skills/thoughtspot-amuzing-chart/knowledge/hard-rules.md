# Hard rules — what breaks, and how it shows up in the preview

Every entry here is a silent failure: the code looks right. What makes them worth a
file is that most are invisible in a screenshot, so the iterate loop will happily
converge on a chart that is broken. Each rule below says how to *detect* it, not just
what to avoid.

`reference/system-prompt.md` has the long-form explanation and a worked alternative
for most of these. Read it when a rule bites and the fix is not obvious.

---

## Breaks only after paste — the preview cannot see these

The preview stubs `viz`, so anything about the real host's behaviour has to be caught
by reading the code, not the screenshot. Check these before emitting final files.

| Rule | Why |
|---|---|
| `const { muze, getDataFromSearchQuery } = viz;` at the top | The only supported way in. |
| `viz.muze` is **synchronous** — `muze.canvas()`, `DataModel.loadDataSync(...)` | No `await muze()`, no `DataModel.onReady()`. Those are the standalone-CDN shapes. |
| `viz.events.emitRenderCompletedEvent()` on **both** the success and `catch` paths | Liveboard PDF export blocks until every tile reports in. One silent tile means no PDF for the whole board. The preview's status line warns when it never fires. |
| Wrap the render in `try/catch` and paint `err.stack` into `#chart` | The BYOC sandbox replaces real errors with "Something went wrong". |
| Never a literal `</script>` — not even inside a comment | Breaks the host's HTML parser. |
| No `<!DOCTYPE>` / `<html>` / `<head>` / `<body>` in chart.html | The host wraps it. |
| Do not wrap chart.js in an async IIFE | The host already does. Top-level `await` and `return` work as-is. |
| No `mark: 'text'` as a top-level layer; no `tooltip.mode: 'consolidated'` | Both break ThoughtSpot's interaction propagation. Inject SVG in `afterRendered` instead. |
| Two same-named columns in one search collide in the DataModel | Fix the search to give unique names — not the chart code. |
| `vs. Last Month` / `vs. Last Year` columns arrive empty unless the search selects the prior period | Nothing the chart can do about it; say so in the run README. |
| Table-mode column format (currency, percent) does **not** reach the chart | Emit an explicit `tickFormat`. |
| Non-ASCII `·` or `—` in titles render as `Â·` | ASCII only. |
| No literal U+00A0 anywhere in the three files — write ` ` | The files are pasted through a browser textarea, which is exactly where a literal non-breaking space gets normalised to a plain space. Ironic failure mode: the character silently disappears from the guard written to handle it. Sweep with `LC_ALL=C grep -n '[^ -~]' chart.*`. |
| A CDN load must be **bounded** and must list a fallback host | `onerror` covers a blocked host. A request that *hangs* fires neither `onload` nor `onerror`, so the promise never settles, top-level `await` never returns, `emitRenderCompletedEvent()` never fires, and the host shows a bare "Chart did not render" over an empty tile. Wrap the injection in a `setTimeout` reject and try a second CDN. |
| `chart.js` must build its own mount points if they are missing | The host assembles the three tabs and the order is not contractual. `document.getElementById('chart')` at module scope returns `null` when the JS evaluates before the HTML tab's markup lands, or when someone pastes only the JS. The library then throws on a null container, the `catch` guard `if (el)` skips painting, and the tile is blank with no error anywhere. Resolve elements inside boot and `createElement` whatever is absent. |
| Error painting must not depend on the element that failed | `catch { if (stageEl) stageEl.innerHTML = err.stack }` paints nothing when `stageEl` is the null that caused the throw. Fall back `stage -> #chart -> document.body`. |

## Visible in the preview if you look for it

| Rule | How it shows |
|---|---|
| `point` `size` above `0.05` | Dots fill the whole row — obvious once you know it is a size bug and not a data bug. Area-based scale. |
| `tick` `size` is a band-fraction | Use `0.02` for hairlines; larger reads as a fat block. |
| `p.update.x` in `encodingTransform` is **pixels**, not data | Marks pile up at the left edge. Convert via `layer.measurement().width`. |
| Guarding that assignment with `if (p.update.x != null)` | The guard skips when it is null (common on text-only KPI layers) and the label lands at (0,0) or off-canvas. Assign unconditionally. |
| `share()` across measures with different scales | Everything pins near zero. Use the dual-axis tuple pattern. |
| `domain` inside `.color({...})` | Silently kills `range` too — palette reverts to default blue/orange. Pass `range` only, ordered alphabetically by category value. |
| `domain: [...]` on an axis | Silently ignored; the axis keeps its computed range. |
| A temporal field typed `type: 'measure'` on a line chart | The chart collapses. |
| Root `axes.x.tickFormat` on a temporal field | Ignored. Use `axes.x.fields[FIELD].tickFormat` with `d.rawValue` as an ms timestamp. |

## Crashes — the preview shows the stack, so these are cheap

- `p.text.*` in `encodingTransform` — undefined.
- Text inside a bar or point layer's `encodingTransform` — those layers do not render text; use a separate layer.
- Constructing a new `DataModel` inside `source` — `e.getDomain is not a function`.
- Repositioning `mark: 'line'` via `encodingTransform` — ignored; use `mark: 'point'`.
- `muze.Operators.html` in `.title()` / `.subtitle()` — renders the markup verbatim.
- Passing an object-wrapped cell into gridjs or a formatter — opaque "Script error." Run `--data wrapped` to catch it.
- Invented methods. `DataModel.onReady()`, `canvas.scrollConfig()`, `canvas.onready()`, `canvas.tooltip()`, `loadScript()`, `waitForLib()` do not exist.

## The canvas-shadowing bug — worth its own entry

```js
function renderChart(rows) {
  const canvas = muze.canvas();   // WRONG
}
```

Shadows the module-scope `let canvas`. The first mount works, so the preview looks
perfect. Then `applySize()` reads the still-`null` outer binding on the next
ResizeObserver tick, hits `if (!canvas) return`, and the tile goes blank — later,
and only once someone resizes. Use plain assignment: `canvas = muze.canvas();`.

**Detect it:** resize the chart's **container** and re-snap. A chart that renders
once and blanks on resize has this bug.

## The CDN-library sibling: `responsive: true` is not enough

Same family as canvas shadowing, different library, and easier to miss because it
does not blank the tile — it clips it.

Plotly's `responsive: true` and the Chart.js equivalent listen to **`window.resize`
only**. A Liveboard tile changes size while the window does not: drag-resize,
layout edits, a PDF export at a different geometry. The library keeps its old
dimensions and overflows a container that shrank around it.

Measured, resizing the container rather than the window:

```
with a ResizeObserver:  stage=596x648  svg=596x648   fits
without:                stage=596x648  svg=1222x616  overflows
```

Any CDN chart library mounted in a tile needs a `ResizeObserver` on its own
container, debounced through `requestAnimationFrame`:

```js
resizeObs = new ResizeObserver(() => {        // module-scope binding, not `const`
  if (pending) cancelAnimationFrame(pending);
  pending = requestAnimationFrame(() => { Plotly.Plots.resize(stageEl); });
});
resizeObs.observe(stageEl);
```

**Detect it:** set `el.style.width = '620px'` and compare the library's rendered
`svg` width against the container's. Do not resize the OS window for this — see
step 6 in `SKILL.md` for why that test lies.

## Defaults first

Muze renders a complete chart from `rows`, `columns`, `data`, and `mount`. Before
emitting any config block, ask whether deleting it changes the render. If not, delete
it. Do not call `.title()` / `.subtitle()` unless the target visibly has one inside
the chart frame — Liveboard tiles draw their own title, so a chart-internal one is a
duplicate header.
