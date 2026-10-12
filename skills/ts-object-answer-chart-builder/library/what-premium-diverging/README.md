# Premium or volume, by item type

Which item types earn more than their share of units (premium) and which sell on volume?

| | |
|---|---|
| Model | (Sample) Retail - Apparel |
| Search | `[sales] [quantity purchased] [item type] [product]` |
| Library | MayaCharts 0.15.0 (maya.global.js from jsDelivr) |
| Tile | 8x7 grid units (04 What tab) |
| Data mode | B, live only. With no rows it shows MayaCharts' empty state, worded to name the search. |
| CDN | `https://cdn.jsdelivr.net/npm/mayacharts@0.15.0/dist/maya.global.js` (loaded by chart.js) |

## Interactions
Hover or focus a bar for its tooltip (share of sales minus share of units, in points, and whether it is premium or volume); the other bars dim. Click a bar, or focus it and press Enter, to drill into that item type's products; the breadcrumb, Back, Escape or a click on empty space goes back up. Arrow keys move between bars. All of this is built into MayaCharts.

## Notes
Built on MayaCharts: a horizontal `bar` with `path: [Item Type, Product]`, `drill: true`, `sort: 'desc'`, `labels: true` and `colorBy: 'sign'` (green premium, red volume). The only computed field is Gap: each row's share of total sales minus its share of total units, times 100. Shares are of the whole search, so a product's gap is its contribution in points and products add up to their item type; MayaCharts' default sum aggregation is therefore correct at both levels (checked in the tooltip and the drilled labels). Inside a drill the products show their contribution to the item type's gap, not a gap re-measured within the item type, and there is no price index toggle. MayaCharts hides value labels that do not fit (narrow tiles, tiny bars); the tooltip still gives the value. Preview-verified on synthetic data; not yet re-checked on a cluster.

## Paste
chart.html into the HTML tab, chart.css into the CSS tab, chart.js into the JS tab, then bind the search above.
The block between the `amuzing core` markers is shared: change it in `library/_shared/` and run `helpers/sync-core.mjs`.
