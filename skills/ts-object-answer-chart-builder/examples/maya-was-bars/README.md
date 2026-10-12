# Sales by item type against last year (MayaCharts)

How did each item type do this year, against the year before?

| | |
|---|---|
| Model | (Sample) Retail - Apparel (column names as that model's search returns them) |
| Search | `[sales] [item type] [date].yearly` |
| Library | MayaCharts 0.15.0 (`maya.global.js` from jsDelivr, fallback unpkg). Pin the release the doctor's `mayacharts:` line names when you copy this |
| Tile | 8x6 grid units (about 620x400) |
| Data mode | B, live only. With no rows it shows an empty state that names the search |
| Verified | In the preview only: render, absent / wrapped / empty data, 280x300 to 1400x500 tiles, a 400x220 tile, hover sweep. `sample-data.json` is synthetic, shaped like the search's output. Not yet seen on a cluster tile |

## What MayaCharts does here
One spec draws the horizontal bars, the dashed ghost of last year (`was`), the legend, the axis, the tooltip, the
hover dimming, keyboard focus, click selection (`select: true`), the empty state and the resize. There is no shared
core, header or readout: `chart.js` is 18 lines, and four of them are the pivot below.

## Interactions
Hover a bar for its value (the others dim). Click a bar, or focus it and press Enter, to select it; Escape clears it.

## Notes
- The search returns one row per item type and year, and `was` wants last year in its own column, so the chart
  pivots the latest two years first (BbekShr/mayacharts#60 asks for this to be built in).
- Render-complete fires on `maya-render` and on `maya-error` (BbekShr/mayacharts#59 has why
  `customElements.whenDefined` is too early). If the CDN fails, the tile says so and still reports in.
- `min-height: 0` on `maya-chart`: the element's own floor is 200px, which spills past a short tile.
- `limit` keeps as many bars as fit the tile when it loads (about 22px each) and rolls the rest into Other; it is
  not recomputed on a later resize.
- `was` is set only when there are rows, or the legend shows a ghost key over the empty state.

## Paste
chart.html into the HTML tab, chart.css into the CSS tab, chart.js into the JS tab, then bind the search above.
Before reuse, swap the pinned version for the doctor's `mayacharts:` line.
