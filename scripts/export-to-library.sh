#!/usr/bin/env bash
# export-to-library.sh <thoughtspot-agent-skills checkout>
#
# Copies the skill into the thoughtspot-agent-skills library, where it ships as
# `ts-amuzing-chart-builder` under agents/claude/. This repo keeps the name
# `thoughtspot-amuzing-chart`; the helpers read the name off their own folder, so
# the copy only needs its SKILL.md frontmatter and prose renamed.
#
# Registering it in the library (README, SETUP.md, runtime-coverage divergences,
# PARITY.md, changelog, smoke test) is a separate PR step — see the library's
# CLAUDE.md "Add a new skill" row.

set -euo pipefail

LIB="${1:?usage: export-to-library.sh <path to thoughtspot-agent-skills checkout>}"
SRC="$(cd "$(dirname "$0")/.." && pwd)/skills/thoughtspot-amuzing-chart"
NAME="ts-amuzing-chart-builder"
DST="$LIB/agents/claude/$NAME"

[ -d "$LIB/agents/claude" ] || { echo "not a thoughtspot-agent-skills checkout: $LIB" >&2; exit 1; }

mkdir -p "$DST"
rsync -a --delete --exclude node_modules --exclude .DS_Store "$SRC/" "$DST/"

# Rename in text files only; the vendored bundle and PNGs are left alone.
grep -rlI --exclude-dir=node_modules --exclude-dir=vendor "thoughtspot-amuzing-chart" "$DST" |
  while IFS= read -r f; do
    perl -pi -e "s/thoughtspot-amuzing-chart/$NAME/g" "$f"
    echo "renamed in ${f#"$LIB/"}"
  done

echo "exported to ${DST#"$LIB/"}"
