# Thoughtspot Amuzing chart skills

Claude skills for building ThoughtSpot custom charts (BYOC), in Claude Code and the
Claude app.

One skill so far: **thoughtspot-amuzing-chart**. It writes the three files a BYOC
tile takes (`chart.html`, `chart.css`, `chart.js`) and iterates them in a real
browser until the render is right, instead of handing you code it has never run.

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
cp -R Thoughtspot-Amuzing-chart-skills/skills/thoughtspot-amuzing-chart \
      /path/to/your-project/.claude/skills/
```

Or symlink it once for every project, and update it with `git pull`:

```bash
ln -s "$PWD/Thoughtspot-Amuzing-chart-skills/skills/thoughtspot-amuzing-chart" \
      ~/.claude/skills/thoughtspot-amuzing-chart
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
   cd skills && zip -r ../thoughtspot-amuzing-chart.zip thoughtspot-amuzing-chart \
     -x '*/node_modules/*' '*.DS_Store'
   ```

3. Upload `thoughtspot-amuzing-chart.zip` under **Settings → Capabilities → Skills**.
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
   with `/thoughtspot-amuzing-chart`. All of these work:
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
node .claude/skills/thoughtspot-amuzing-chart/helpers/env.mjs          # Claude Code
node /mnt/skills/user/thoughtspot-amuzing-chart/helpers/env.mjs        # Claude app (ask Claude to run it)
```

It prints where runs and deliverables go, whether the preview will be headed or
headless, which Playwright and Chromium it found, whether it could actually launch
the browser, and whether CDN libraries are reachable. When something is missing, its
`fix:` line is the command that fixes it. If a run fails in the Claude app, that
output is the thing to send to the skill author.

The helpers also work by hand, which is useful when debugging a chart outside a run:

```bash
H=.claude/skills/thoughtspot-amuzing-chart/helpers
node $H/start-preview.mjs my-chart                     # open the preview window
node $H/snap.mjs my-chart 01                           # screenshot + diagnostic block
node $H/snap.mjs my-chart 91 --data absent             # also: wrapped, empty, noviz
node $H/snap.mjs my-chart 95 --tile 620x400            # resize the tile, report svg-fit
node $H/close-preview.mjs my-chart                     # close the window
```

## Layout

```
skills/thoughtspot-amuzing-chart/
  SKILL.md            the procedure — the file Claude reads
  references/         byoc-data-modes · hard-rules · examples · emit-checklist ·
                      muze-api-reference · system-prompt
  examples/           working charts, indexed by references/examples.md
  helpers/            env (the doctor) · serve · capture · start-preview · snap ·
                      close-preview, plus a smoke-test fixture
  scaffold/           the preview page, including a vendored Muze bundle
scripts/
  export-to-library.sh   copy the skill into thoughtspot-agent-skills
```

Everything the skill reads travels inside that one folder, so it works from whatever
project it is installed into. The helpers never name the skill or assume where it is
installed, so the same folder works under another name.

## Examples

`skills/thoughtspot-amuzing-chart/examples/` carries charts that already render
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

The skill is being prepared for
[thoughtspot/thoughtspot-agent-skills](https://github.com/thoughtspot/thoughtspot-agent-skills),
where it is named `ts-amuzing-chart-builder` (that library requires lowercase `ts-`
names). This repo stays the source; copy it across with:

```bash
scripts/export-to-library.sh /path/to/thoughtspot-agent-skills
```

That copies the skill to `agents/claude/ts-amuzing-chart-builder/` and renames it in
`SKILL.md`. Registering it in the library (README, setup docs, runtime coverage,
changelog, smoke test) is part of the library PR.

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
