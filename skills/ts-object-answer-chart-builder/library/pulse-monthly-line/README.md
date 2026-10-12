# Monthly sales against last year

How have sales moved month to month, and where did the level change?

| | |
|---|---|
| Model | (Sample) Retail - Apparel |
| Search | `[sales] [date].monthly` |
| Library | MayaCharts 0.15.0 (maya.global.js from jsDelivr) |
| Tile | 8x6 grid units (Pulse tab) |
| Data mode | B, live only. With no rows it shows an empty state that names the search. |
| CDN | `https://cdn.jsdelivr.net/npm/mayacharts@0.15.0/dist/maya.global.js` |

## Interactions
Hover for the crosshair and a tooltip with the month, sales and the same month last year. Click a legend key (shown on narrow tiles; wider tiles name each line at its right end) to hide or show a line. Drag across the plot to zoom into a span of months; double-click or Escape resets. The chart is keyboard navigable: arrow keys step through months and between the two lines.

## Notes
Built on MayaCharts. The only code beyond the spec pairs each month with the same month a year earlier, so last year runs as a second, slate line under the ink sales line. The old step-up and step-down markers and the year-to-date sentence were dropped, since the spec cannot express them. Colour is deliberately monochrome: hues are reserved for product families. Preview-verified on synthetic data, not yet re-checked on a cluster.

## Paste
chart.html into the HTML tab, chart.css into the CSS tab, chart.js into the JS tab, then bind the search above.
The block between the `amuzing core` markers is shared: change it in `library/_shared/` and run `helpers/sync-core.mjs`.
