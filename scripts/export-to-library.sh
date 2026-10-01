#!/usr/bin/env bash
# export-to-library.sh <thoughtspot-agent-skills checkout>
#
# Copies both skills into the thoughtspot-agent-skills library, where they ship under the
# same names in agents/cli/. The library-only files (its smoke tests and mocks, README rows,
# naming family) live in that repo and are not touched here.
#
# Each SKILL.md keeps the library's own "## Changelog" section: the library ships its own
# version history (a new skill starts at 1.0.0 there), while this repo keeps the full one.

set -euo pipefail

LIB="${1:?usage: export-to-library.sh <path to thoughtspot-agent-skills checkout>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)/skills"
[ -d "$LIB/agents/cli" ] || { echo "not a thoughtspot-agent-skills checkout: $LIB" >&2; exit 1; }

for s in ts-object-answer-chart-builder ts-object-liveboard-chart-builder; do
  dest="$LIB/agents/cli/$s"
  keep=""
  [ -f "$dest/SKILL.md" ] && keep="$(awk '/^## Changelog/{f=1} f' "$dest/SKILL.md")"
  # Tracked files only: node_modules, run folders and .DS_Store never go across.
  (cd "$ROOT/$s" && git ls-files) | rsync -a --files-from=- "$ROOT/$s/" "$dest/"
  if [ -n "$keep" ]; then
    body="$(awk '/^## Changelog/{exit} {print}' "$dest/SKILL.md")"
    printf '%s\n\n%s\n' "$body" "$keep" > "$dest/SKILL.md"
  fi
  echo "exported to agents/cli/$s"
done
