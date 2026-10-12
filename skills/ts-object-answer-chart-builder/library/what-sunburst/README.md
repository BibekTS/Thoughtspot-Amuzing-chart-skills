# Sales by family, item type and product

How do sales split from family to item type to product?

| | |
|---|---|
| Model | (Sample) Retail - Apparel |
| Search | `[sales] [item type] [product]` |
| Library | MayaCharts 0.15.0 (maya.global.js from jsDelivr) |
| Tile | 6x7 grid units (What tab) |
| Data mode | B, live only. With no rows it shows an empty state that names the search. |
| CDN | `https://cdn.jsdelivr.net/npm/mayacharts@0.15.0/dist/maya.global.js` |

## Interactions
Hover a wedge for its sales and share of the parent (other wedges dim). Click a wedge to zoom into it (animated), with a breadcrumb of the path; Back, Escape or a click on empty space goes up a level. The centre shows the total of the current level.

## Notes
Built on MayaCharts as a single sunburst spec with `path: [Family, Item type, Product]` and `drill: true`. Family is an editorial grouping (`AZ.familyOf`), not a model column. Top six products per item type, the rest as Other (n); MayaCharts may also fold very thin wedges into its own grey Other. Family colours are passed as an array in family order, and the rows are sorted the same way, because the sunburst assigns colour slots in first-seen order and ignores a colours map keyed by value. Preview-verified on synthetic data, not yet re-checked on a cluster.

## Paste
chart.html into the HTML tab, chart.css into the CSS tab, chart.js into the JS tab, then bind the search above.
The block between the `amuzing core` markers is shared: change it in `library/_shared/` and run `helpers/sync-core.mjs`.
