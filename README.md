# Thoughtspot Amuzing chart skills

Claude skills for building ThoughtSpot custom charts (BYOC), in Claude Code and the
Claude app.

Two skills:

- **ts-custom-charts-builder** writes the three files a BYOC tile takes (`chart.html`,
  `chart.css`, `chart.js`) and iterates them in a real browser until the render is right,
  instead of handing you code it has never run. It carries a library of 57 proven charts.
- **ts-custom-charts-liveboard-builder** builds a whole storytelling Liveboard of those charts on a
  real model through the ThoughtSpot MCP: plans the tabs, has each tile built by the chart
  skill, writes the banners, adds filters, imports, proves the import, and screenshots every
  tab in a logged-in browser. It needs the chart skill installed beside it.

## What it does

The preview runs the same three files you will paste, through a `viz` stub, inside an
`AsyncFunction` — the shape the real ThoughtSpot host uses. So there is no porting step
at the end: what was iterated is what ships.

A run goes:

1. Settle the data mode and write a frozen sample dataset.
2. Open the preview — a browser window you watch, or headless screenshots where no
   window can open.
3. Loop, up to 8 attempts: edit the files → screenshot → read the screenshot with
   vision → critique → fix the top defect. It stops early on a match, and stops and
   asks you if it is getting nowhere.
4. Check what the loop did not exercise: missing, object-wrapped and empty data, no
   host at all, and a narrow and a wide tile (the chart must follow its container, as
   it does when a Liveboard is resized).
5. Emit the three files, a screenshot of the final render, and a README.

### Where it runs

| | Claude Code | Claude app (claude.ai, desktop app) |
|---|---|---|
| Preview | A Chromium window you watch; it reloads on every edit | Headless; each attempt comes back as a PNG |
| First run | Installs Playwright + Chromium (~2 min, asked once) | Installs `playwright-core` (~30 s), uses the sandbox's Chromium |
| Deliverables | `output/<chart-name>/` in your project | `<chart-name>/` in the chat's outputs folder |
| Chart libraries | All | Muze, HTML tables and raw SVG are fully previewed; CDN libraries (Chart.js, Plotly, gridjs) are usually blocked, so those charts are written but marked *not previewed* |

If a window cannot open in Claude Code either — no display, or Chromium fails to start
headed — it falls back to headless on its own and says so.

## Install in Claude Code

Copy the skill folder into the project where you want to use it:

```bash
git clone git@github.com:BibekTS/Thoughtspot-Amuzing-chart-skills.git
mkdir -p /path/to/your-project/.claude/skills
cp -R Thoughtspot-Amuzing-chart-skills/skills/ts-custom-charts-builder \
      Thoughtspot-Amuzing-chart-skills/skills/ts-custom-charts-liveboard-builder \
      /path/to/your-project/.claude/skills/
```

Or symlink it once for every project, and update it with `git pull`:

```bash
for s in ts-custom-charts-builder ts-custom-charts-liveboard-builder; do
  ln -s "$PWD/Thoughtspot-Amuzing-chart-skills/skills/$s" ~/.claude/skills/$s
done
```

With the copy, runs and deliverables land in `runs/` and `output/` of the project you
installed into. With the symlink they land in the clone's own `runs/` and `output/`,
whichever project you open Claude Code in. Neither ends up in your home directory.

Requirements: Node 20+ and npm. The first run installs Playwright and Chromium into
`helpers/node_modules` (~2 min, asked for once). That directory is gitignored.

## Install in the Claude app

1. Turn on **Settings → Capabilities → Code execution and file creation**.
2. Build the upload bundle from a checkout of this repo:

   ```bash
   cd skills && zip -r ../ts-custom-charts-builder.zip ts-custom-charts-builder \
     -x '*/node_modules/*' '*.DS_Store' '*/library/*/preview.png'
   ```

   The library's `preview.png` screenshots (about 6 MB) stay out of the zip; the skill does not need them to run.

   For the Liveboard skill as well: `cd skills && zip -r ../ts-custom-charts-liveboard-builder.zip ts-custom-charts-liveboard-builder -x '*.DS_Store'`.
   In the Claude app it can plan, build and import, but not take the in-cluster screenshots:
   those need a browser window you sign in to, so check the tabs yourself there.

3. Upload `ts-custom-charts-builder.zip` (and `ts-custom-charts-liveboard-builder.zip`) under **Settings → Capabilities → Skills**.
4. Ask for a chart in a new chat.

The first run installs `playwright-core` and uses the sandbox's own Chromium; it never
tries to download a browser there (that download is blocked). Every attempt's
screenshot is copied to the outputs folder as `<chart-name>/attempts/NN.png`, and the
deliverables land in `<chart-name>/` beside them, ready to download. System fonts in
the sandbox differ from ThoughtSpot's, so text can sit a pixel or two off.

After a `git pull`, rebuild the zip and upload it again.

## Building a chart

1. **Ask for one.** In Claude Code, open the project you installed the skill into; in
   the Claude app, start a new chat. Describe the chart, or invoke the skill directly
   with `/ts-custom-charts-builder`. All of these work:
   - *"Build me a diverging bar chart of revenue vs. target by region"* (from prose)
   - Attach a screenshot of a chart you want recreated (from an image)
   - Point it at an existing tile's three files that misbehave (debug)
   - *"Convert this chart from sample data to live data"* (mode conversion)

2. **Answer the data-mode question if asked.** Sample-only, live-only, or live with
   sample fallback (the default — one file that works on a live tile, an unbound
   tile, and a plain browser). If your chart is going onto a real search, paste the
   `Available Columns` block from your chart editor so the generated code uses your
   exact column names.

   **Bring your own data if you have it.** Hand over a CSV (or describe your column
   structure) and the preview iterates against your real data shape instead of
   invented rows — the file is parsed, capped at 30 rows, and frozen for the run. In
   the fallback mode those same rows ship as the chart's baked-in sample data, so
   the tile shows something realistic even before the search is attached.

3. **Watch it iterate.** In Claude Code a Chromium window opens showing a tile-shaped
   box; Claude edits the chart files, the window reloads, and each attempt is
   screenshotted and critiqued with vision until the render matches — usually a
   handful of attempts. In the Claude app you get each attempt's PNG and a one-line
   verdict instead. Anything you say mid-loop ("make the bars horizontal") becomes the
   next fix.

4. **Collect the deliverables.** Each chart gets its own folder — `output/<chart-name>/`
   in Claude Code, `<chart-name>/` in the Claude app's outputs — containing the three
   files, a `preview.png` of the final render, and a `README.md` that states the exact
   search to build in ThoughtSpot (including any prior-period columns needed for
   `vs. Last Month`-style measures), which data mode the file is in, and anything that
   could not be reproduced.

5. **Paste into ThoughtSpot.** In your custom chart's editor:
   `chart.html` → HTML tab, `chart.css` → CSS tab, `chart.js` → JS tab. Attach the
   search from the run README. If the chart is in live-with-fallback mode you can
   paste it before the search exists — it renders its sample rows with a
   "sample data" badge until real rows arrive.

Working artifacts stay under `runs/<chart-name>/` (chart files, attempt screenshots,
critiques), so a run can be resumed or audited later. `output/` is the result you
keep. Both are gitignored in this repo; in your own project, commit `output/` if you
want to keep the charts with it.

"Verified in preview" means verified against a faithful stub of the ThoughtSpot host,
not against your cluster — theme and version differences are real, so give the pasted
tile a look.

## Checking your setup

The skill runs a doctor at the start of every run. You can run it yourself:

```bash
node .claude/skills/ts-custom-charts-builder/helpers/env.mjs          # Claude Code
node /mnt/skills/user/ts-custom-charts-builder/helpers/env.mjs        # Claude app (ask Claude to run it)
```

It prints where runs and deliverables go, whether the preview will be headed or
headless, which Playwright and Chromium it found, whether it could actually launch
the browser, and whether CDN libraries are reachable. When something is missing, its
`fix:` line is the command that fixes it. If a run fails in the Claude app, that
output is the thing to send to the skill author.

The helpers also work by hand, which is useful when debugging a chart outside a run:

```bash
H=.claude/skills/ts-custom-charts-builder/helpers
node $H/start-preview.mjs my-chart                     # open the preview window
node $H/snap.mjs my-chart 01                           # screenshot + diagnostic block
node $H/snap.mjs my-chart 91 --data absent             # also: wrapped, empty, noviz
node $H/snap.mjs my-chart 95 --tile 620x400            # resize the tile, report svg-fit
node $H/close-preview.mjs my-chart                     # close the window
```

## Layout

```
skills/ts-custom-charts-builder/
  SKILL.md            the procedure: the file Claude reads
  references/         byoc-data-modes · hard-rules · examples · emit-checklist ·
                      muze-api-reference · system-prompt · taste-rules · library ·
                      library-contract · library-starters
  library/            58 proven live-data charts on (Sample) Retail - Apparel, and the
                      shared core (_shared/)
  examples/           older charts, indexed by references/examples.md
  helpers/            env (the doctor) · serve · capture · start-preview · snap · probe ·
                      close-preview · sync-core · library-emit · make-index ·
                      answer-pack and answer-patch.js (save a chart as an answer) ·
                      cluster-shot (screenshot an answer or a Liveboard, logged in),
                      plus a smoke-test fixture
  scaffold/           the preview page, including a vendored Muze bundle
skills/ts-custom-charts-liveboard-builder/
  SKILL.md            intake, profile the model, plan the tabs, build, patch the Liveboard, screenshot
  references/         story-and-layout · pipeline · tile-brief
  scripts/            liveboard-pack · patch.js (runs in the MCP sandbox) ·
                      build-narratives · cluster-shot (passes through to the chart skill's) ·
                      chart-skill (finds the sibling)
  narratives/         the template for About and tab-banner tiles
  liveboards/amuzing-chart-samples/   the worked example: spec, banner configs, data notes
scripts/
  export-to-library.sh   copy both skills into thoughtspot-agent-skills
```

Everything each skill reads travels inside its folder. The Liveboard skill finds the chart
skill as a sibling folder (or through `TS_CUSTOM_CHARTS_SKILL`), so install both side by side.

## The chart library and the Amuzing chart samples Liveboard

`skills/ts-custom-charts-builder/library/` holds 58 charts built on the ThoughtSpot model
**(Sample) Retail - Apparel**, and 50 of them are arranged as the Liveboard **Amuzing chart samples**:
seven numbered tabs (About, Pulse, Where, What, When, Who, Next), each answering one question, custom
charts only, three Liveboard filters (date, region, item type). Every chart reads only what its search
returns, is interactive, survives a filtered view, and was checked in a real cluster, except four newer ones (a pivot table,
a store league table, a Muze diverging bar and a volume-and-price growth split, rebuilt from the older
`examples/`) that are marked *preview only* until they have been on a tile.
`references/library.md` indexes them by tab, library and search; the "Start here" table in
`references/examples.md` maps chart shapes to the one to copy.

Two things about how they are made are worth knowing:

- **Real data, no sample rows.** With the ThoughtSpot MCP connected, each chart is developed against the
  exact output of its own search (`searchdata`), not invented rows.
- **The Liveboard is patched in place.** The MCP sandbox has no network and no memory, so a Liveboard's
  base64 chart code cannot be sent whole. The Liveboard skill's `liveboard-pack.mjs` splits the charts into
  sha256-checked blocks; each one exports the Liveboard, replaces its charts' tiles, keeps the rest,
  imports, and proves by export that every tile carries the code that was composed. A chart already on
  another Liveboard travels as a checksum (`--reuse`), and so can the shared core (`--core-ref`). Nothing
  else is created in ThoughtSpot. `cluster-shot.mjs` then screenshots each tab in a logged-in browser. The
  procedure is `skills/ts-custom-charts-liveboard-builder/SKILL.md`.

Facts about ThoughtSpot tiles that the preview cannot show, found this way, are in the "Verified in a
real cluster" table of the chart skill's `references/hard-rules.md` (for example: `fetch()` is blocked
inside a tile, `<script src>` from a CDN is not), and the import-side ones in the Liveboard skill's
`references/pipeline.md`.

## Examples

`skills/ts-custom-charts-builder/examples/` carries charts that already render
correctly in ThoughtSpot, grouped by library: Muze (bubble, diverging axis, funnel,
invoice), Chart.js over CDN (bump, sunburst, KPI), hand-built DOM (pivot table, flat
table, waffle, funnel), raw SVG (hex cartogram, KPI), and self-contained HTML.

`references/examples.md` indexes them by shape and says what each is worth opening for —
mostly the workarounds for bugs that are expensive to rediscover: Muze's point-size
clamp, its domain-array mutation on re-mount, object-wrapped cells, TS column names
that carry non-breaking spaces.

They were written before the preview loop existed, so they are correct-in-ThoughtSpot,
not correct-in-preview. Copy the technique, not the file.

## For maintainers: the ThoughtSpot skills library

The skills are being prepared for
[thoughtspot/thoughtspot-agent-skills](https://github.com/thoughtspot/thoughtspot-agent-skills),
under the same names, in `agents/cli/`. This repo stays the source; copy them across with:

```bash
scripts/export-to-library.sh /path/to/thoughtspot-agent-skills
```

That copies both folders as they are. Registering them in the library (README, setup docs,
runtime coverage, naming family, changelog, smoke tests) is part of the library PR.

Open before that PR: the vendored Muze bundle's license is unconfirmed — see
`scaffold/vendor/muze/NOTICE.md`.

## Status

Verified on macOS (2026-09-29):

- **Headed:** the window reloads ~0.4 s after an edit; screenshots stay 2496x1340, the
  same as earlier runs; a Muze example renders the same as under the previous
  Vite-based preview.
- **Headless:** a read-only copy of the skill with nothing installed, forced into
  Claude-app mode, installs `playwright-core` from the doctor's `fix:` line and
  captures every data mode plus `--tile 620x400` and `1400x500`.
- **Fallback:** a Chromium that cannot open a window drops to headless on its own.

Not yet run inside the Claude app itself; the doctor output from a first run there is
the thing to check.
