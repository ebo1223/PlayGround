#!/usr/bin/env bash
set -euo pipefail

run() { /usr/bin/time -p "$@"; }
PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
RUNTIME_DIR="${RUNTIME_DIR:-/home/runner/work/_temp/omgithub-runtime}"
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to an evidence directory}"

if [[ "$CAPTURE_DIR" != /* ]]; then
  echo 'CAPTURE_DIR must be an absolute path outside the project.' >&2
  exit 1
fi
case "$CAPTURE_DIR/" in
  "$PROJECT_DIR/"*)
    echo 'Capture evidence must be kept outside the project directory.' >&2
    exit 1
    ;;
esac

run mkdir -p "$CAPTURE_DIR"
run env CAPTURE_URL="$CAPTURE_URL" CAPTURE_DIR="$CAPTURE_DIR" \
  CAPTURE_READY_SELECTOR='.hud' CAPTURE_STRICT=1 \
  node "$RUNTIME_DIR/scripts/default-capture.mjs"
