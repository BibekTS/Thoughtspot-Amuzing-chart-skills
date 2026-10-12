# Best month

What is the strongest month on record in this view, and how far above normal?

| | |
|---|---|
| Model | (Sample) Retail - Apparel |
| Search | `[sales] [quantity purchased] [date].monthly` |
| Library | MayaCharts 0.16.0 (maya.core.global.js from jsDelivr) |
| Tile | 3x4 grid units (Pulse tab) |
| Data mode | B, live only. With no rows it shows an empty state that names the search. |
| CDN | `https://cdn.jsdelivr.net/npm/mayacharts@0.16.0/dist/maya.core.global.js` |

## Interactions
Hover, or use the arrow keys, for each month's sales. Drag across the plot to zoom into a span of months; double-click or Escape resets.

## Notes
Built on MayaCharts 0.16.0 as a `line` over every month in the view rather than a `kpi` tile, because a kpi headline is always the latest value and this tile's headline is the record. The title names the best month and its sales through the `{max.x}` and `{max.y}` data tokens, the subtitle gives how many times the average month it is (computed in the body), an `Average` rule marks the normal month, and `annotate` labels the peak Best. The value axis is fixed with 15% headroom above the peak because 0.16.0 drops an annotation that would sit above the plot. Dropped against the old tile: the big-number layout and the YTD and All toggle (the view is always every month in the filter). Preview-verified on synthetic data, not yet re-checked on a cluster.

## Paste
chart.html into the HTML tab, chart.css into the CSS tab, chart.js into the JS tab, then bind the search above.
The block between the `amuzing core` markers is shared: change it in `library/_shared/` and run `helpers/sync-core.mjs`.
