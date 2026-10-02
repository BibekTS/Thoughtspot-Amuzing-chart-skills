#!/usr/bin/env bash
# export-to-library.sh <thoughtspot-agent-skills checkout>
#
# Copies both skills into the thoughtspot-agent-skills library, where they ship under the
# same names in agents/cli/. The library-only files (its smoke tests and mocks under
# tools/smoke-tests, README rows, naming family) live elsewhere in that repo and are not touched here.
#
# Each SKILL.md keeps the library's own "## Changelog" section: the library ships its own
# version history (a new skill starts at 1.0.0 there), while this repo keeps the full one.
#
# The copy mirrors this repo's tracked files: a file removed here is removed there too, so
# nothing lingers in the library. Only files the library tracks (or would add) are removed;
# what it ignores (helpers/node_modules, .DS_Store) stays. rsync's own --delete does nothing
# with --files-from, so the removal is done from the two file lists.

set -euo pipefail

LIB="${1:?usage: export-to-library.sh <path to thoughtspot-agent-skills checkout>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)/skills"
[ -d "$LIB/agents/cli" ] || { echo "not a thoughtspot-agent-skills checkout: $LIB" >&2; exit 1; }

for s in ts-object-answer-chart-builder ts-object-liveboard-chart-builder; do
  dest="$LIB/agents/cli/$s"
  keep=""
  [ -f "$dest/SKILL.md" ] && keep="$(awk '/^## Changelog/{f=1} f' "$dest/SKILL.md")"
  # Tracked files only: node_modules, run folders and .DS_Store never go across. A file still tracked
  # but already deleted on disk (an uncommitted removal) is skipped here and removed there below.
  list="$(cd "$ROOT/$s" && git ls-files | while IFS= read -r f; do if [ -e "$f" ]; then printf '%s\n' "$f"; fi; done)"
  [ -n "$list" ] || { echo "no tracked files under $ROOT/$s" >&2; exit 1; }
  printf '%s\n' "$list" | rsync -a --files-from=- "$ROOT/$s/" "$dest/"
  if [ -d "$dest" ]; then
    comm -13 <(printf '%s\n' "$list" | sort) <((cd "$dest" && git ls-files --cached --others --exclude-standard) | sort) \
      | while IFS= read -r f; do rm -f -- "$dest/$f"; echo "removed agents/cli/$s/$f"; done
    find "$dest" -mindepth 1 -type d -empty -not -path '*/node_modules/*' -delete
  fi
  if [ -n "$keep" ]; then
    body="$(awk '/^## Changelog/{exit} {print}' "$dest/SKILL.md")"
    printf '%s\n\n%s\n' "$body" "$keep" > "$dest/SKILL.md"
  fi
  echo "exported to agents/cli/$s"
done
