#!/usr/bin/env bash
# export-to-library.sh <thoughtspot-agent-skills checkout>
#
# Copies both skills into the thoughtspot-agent-skills library, where they ship as
# `ts-amuzing-chart-builder` and `ts-amuzing-liveboard-builder` under agents/claude/. This repo keeps the name
# `thoughtspot-amuzing-chart`; the helpers read the name off their own folder, so
# the copy only needs its SKILL.md frontmatter and prose renamed.
#
# Registering it in the library (README, SETUP.md, runtime-coverage divergences,
# PARITY.md, changelog, smoke test) is a separate PR step — see the library's
# CLAUDE.md "Add a new skill" row.

set -euo pipefail

LIB="${1:?usage: export-to-library.sh <path to thoughtspot-agent-skills checkout>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)/skills"
[ -d "$LIB/agents/claude" ] || { echo "not a thoughtspot-agent-skills checkout: $LIB" >&2; exit 1; }

# source name -> library name. The Liveboard skill refers to the chart skill by name, so every
# copy is renamed for both.
RENAMES="s/thoughtspot-amuzing-chart/ts-amuzing-chart-builder/g; s/thoughtspot-amuzing-liveboard/ts-amuzing-liveboard-builder/g"

for pair in "thoughtspot-amuzing-chart:ts-amuzing-chart-builder" "thoughtspot-amuzing-liveboard:ts-amuzing-liveboard-builder"; do
  SRC="$ROOT/${pair%%:*}"
  DST="$LIB/agents/claude/${pair##*:}"
  mkdir -p "$DST"
  rsync -a --delete --exclude node_modules --exclude .DS_Store "$SRC/" "$DST/"
  # Rename in text files only; the vendored bundle and PNGs are left alone.
  grep -rlIE --exclude-dir=node_modules --exclude-dir=vendor "thoughtspot-amuzing-(chart|liveboard)" "$DST" |
    while IFS= read -r f; do
      perl -pi -e "$RENAMES" "$f"
      echo "renamed in ${f#"$LIB/"}"
    done
  echo "exported to ${DST#"$LIB/"}"
done
