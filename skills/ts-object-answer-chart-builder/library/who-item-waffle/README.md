# Family waffle: share of sales or units

How does each product family's share of sales compare with its share of units?

| | |
|---|---|
| Model | (Sample) Retail - Apparel |
| Search | `[sales] [quantity purchased] [item type]` |
| Library | MayaCharts 0.16.0 (maya.global.js from jsDelivr) |
| Tile | 6x6 grid units (06 Who tab) |
| Data mode | B, live only. With no rows it shows an empty state that names the search. |
| CDN | `https://cdn.jsdelivr.net/npm/mayacharts@0.16.0/dist/maya.global.js` |

## Interactions
Switch between Sales and Units with the toggle above the grid; the key keeps each family's share of the shown measure. Hover a square or a key entry for the family, its value and share. Click a family (a square or its key entry) to select it and dim the rest; Escape clears. The chart is keyboard navigable.

## Notes
Built on MayaCharts 0.16.0 as a `waffle` (module type, so the tile loads maya.global.js) with `y: ['Sales', 'Units']` as the measure toggle, `colors: AZ.T.family` and `select`. The body rolls item types up into families (an editorial grouping) in the house order and computes the headline: the family whose share of sales differs most from its share of units. MayaCharts assigns the 100 squares itself. Dropped against the old chart: the click-to-list of item types with their shares inside a family, and the dedicated All families button (Escape or a second click clears the selection). Preview-verified on synthetic data, not yet re-checked on a cluster.

## Paste
chart.html into the HTML tab, chart.css into the CSS tab, chart.js into the JS tab, then bind the search above.
The block between the `amuzing core` markers is shared: change it in `library/_shared/` and run `helpers/sync-core.mjs`.
