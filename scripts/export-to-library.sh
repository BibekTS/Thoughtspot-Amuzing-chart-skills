#!/usr/bin/env bash
# export-to-library.sh <thoughtspot-agent-skills checkout>
#
# Copies both skills into the thoughtspot-agent-skills library, where they ship under the
# same names in agents/cli/. The library-only files (its smoke tests, README rows, naming
# family) live in that repo and are not touched here.

set -euo pipefail

LIB="${1:?usage: export-to-library.sh <path to thoughtspot-agent-skills checkout>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)/skills"
[ -d "$LIB/agents/cli" ] || { echo "not a thoughtspot-agent-skills checkout: $LIB" >&2; exit 1; }

for s in ts-custom-charts-builder ts-custom-charts-liveboard-builder; do
  # Tracked files only: node_modules, run folders and .DS_Store never go across.
  (cd "$ROOT/$s" && git ls-files) | rsync -a --files-from=- "$ROOT/$s/" "$LIB/agents/cli/$s/"
  echo "exported to agents/cli/$s"
done
