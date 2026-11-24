#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL to capture.}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to the evidence output directory.}"
RUNTIME_DIR="${RUNTIME_DIR:-/home/runner/work/_temp/omgithub-runtime}"
[[ "$CAPTURE_URL" == http://* || "$CAPTURE_URL" == https://* ]] || { echo "CAPTURE_URL must be an HTTP(S) URL." >&2; exit 1; }
/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
/usr/bin/time -p env CAPTURE_STRICT=1 CAPTURE_READY_SELECTOR="#game-root" node "$RUNTIME_DIR/scripts/default-capture.mjs"
for view in desktop mobile; do
  [[ -s "$CAPTURE_DIR/final-$view.png" ]] || { echo "Capture did not produce final-$view.png." >&2; exit 1; }
done
