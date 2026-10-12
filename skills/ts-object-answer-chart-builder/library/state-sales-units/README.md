# Sales against units by state

Is it price or volume that separates the states?

| | |
|---|---|
| Model | (Sample) Retail - Apparel |
| Search | `[sales] [quantity purchased] [state]` |
| Library | MayaCharts 0.15.0 (maya.global.js from jsDelivr) |
| Tile | 6x6 grid units (03 Where tab) |
| Data mode | B, live only. With no rows it shows an empty state that names the search. |
| CDN | `https://cdn.jsdelivr.net/npm/mayacharts@0.15.0/dist/maya.global.js` |

## Interactions
Hover or arrow-key to a dot for its state, sales and units (other dots dim); click dots to select several, Escape clears; drag to zoom, double-click or Escape resets. The dashed line marks average sales per state.

## Notes
Built on MayaCharts as a single scatter spec (units on x, sales on y, state as the point name, a mean rule). Columns are matched by name pattern, so casing changes in the search output do not break it. Preview-verified on synthetic data, not yet re-checked on a cluster.

## Paste
chart.html into the HTML tab, chart.css into the CSS tab, chart.js into the JS tab, then bind the search above.
The block between the `amuzing core` markers is shared: change it in `library/_shared/` and run `helpers/sync-core.mjs`.
