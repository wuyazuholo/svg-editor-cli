#!/bin/sh
set -eu
task_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$task_root"
if command -v node >/dev/null 2>&1; then
  task_node=$(command -v node)
else
  task_node="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
"$task_node" node_modules/typescript/bin/tsc --noEmit
"$task_node" scripts/CheckArchitecture.ts
"$task_node" --test test/*.test.ts
