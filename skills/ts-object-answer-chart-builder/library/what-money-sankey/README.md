# Where the money flows: region to family to item type

Which regions feed which product families and item types?

| | |
|---|---|
| Model | (Sample) Retail - Apparel |
| Search | `[sales] [region] [item type]` |
| Library | MayaCharts 0.15.0 (maya.global.js from jsDelivr) |
| Tile | 12x7 grid units (04 What tab) |
| Data mode | B, live only. With no rows it shows an empty state that names the search. |
| CDN | `https://cdn.jsdelivr.net/npm/mayacharts@0.15.0/dist/maya.global.js` |

## Interactions
Hover or arrow-key to a node or flow for its sales and to highlight the flows it touches (the rest dim). Click a region node to drill into that region's family and item type flows; the breadcrumb shows Back > region, and Back, Escape or a click on empty space goes up. Flows and family or item nodes do not drill.

## Notes
Built on MayaCharts as a single sankey spec over the path region, family, item type. Family is an editorial grouping derived in the JS with `AZ.familyOf`, not a model column. Region nodes stay neutral grey; families and their item types take the family hues. MayaCharts colours sankey nodes by slot in first-seen order, so the rows are sorted by family before the spec gets them and `colors` lists the hues in that order. Thin nodes are unlabelled and named in the tooltip. Columns are matched by name pattern, so casing changes in the search output do not break it. Preview-verified on synthetic data, not yet re-checked on a cluster.

## Paste
chart.html into the HTML tab, chart.css into the CSS tab, chart.js into the JS tab, then bind the search above.
The block between the `amuzing core` markers is shared: change it in `library/_shared/` and run `helpers/sync-core.mjs`.
