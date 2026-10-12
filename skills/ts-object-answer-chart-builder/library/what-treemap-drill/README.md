# Sales treemap with drill-down

Where do sales sit across families, item types and products, and how concentrated is each?

| | |
|---|---|
| Model | (Sample) Retail - Apparel |
| Search | `[sales] [item type] [product]` |
| Library | MayaCharts 0.15.0 (maya.global.js from jsDelivr) |
| Tile | 8x7 grid units (04 What tab) |
| Data mode | B, live only. With no rows it shows an empty state that names the search. |
| CDN | `https://cdn.jsdelivr.net/npm/mayacharts@0.15.0/dist/maya.global.js` |

## Interactions
Click a family to zoom into its item types, then an item type to zoom into its products (animated, with a Back > Family > Item type breadcrumb); Back, Escape or a click on empty space goes up one level. Hover or arrow-key to a rectangle for its sales (others dim). The product level is the last: a click there does nothing.

## Notes
Built on MayaCharts as a single treemap spec with `drill` on the path Family > Item type > Product. Family is an editorial grouping derived from Item type (`AZ.familyOf`) and keeps its family hue; inside a family the rectangles step through tints of that hue by size. Family colours are passed in first-appearance order because the treemap assigns colour slots that way. Rows with zero or negative sales are dropped (a treemap sizes by value). Labels shorten with an ellipsis when a rectangle is narrow. Preview-verified on synthetic data, not yet re-checked on a cluster.

## Paste
chart.html into the HTML tab, chart.css into the CSS tab, chart.js into the JS tab, then bind the search above.
The block between the `amuzing core` markers is shared: change it in `library/_shared/` and run `helpers/sync-core.mjs`.
