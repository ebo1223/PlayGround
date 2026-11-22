#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
CAPTURE_URL="${CAPTURE_URL:?Set CAPTURE_URL}"
CAPTURE_DIR="${CAPTURE_DIR:?Set CAPTURE_DIR}"

run_timed() {
  echo "+ $*" >&2
  /usr/bin/time -p "$@"
}

run_timed mkdir -p "$CAPTURE_DIR"

export CAPTURE_URL CAPTURE_DIR
export CAPTURE_READY_SELECTOR="#app"
RUNTIME_DIR="${RUNTIME_DIR:-/home/runner/work/_temp/omgithub-runtime}"

set +e
/usr/bin/time -p node "$RUNTIME_DIR/scripts/default-capture.mjs"
status=$?
set -e

case "$status" in
  0)
    test -s "$CAPTURE_DIR/final-desktop.png"
    test -s "$CAPTURE_DIR/final-mobile.png"
    echo "Captured desktop and mobile screenshots in $CAPTURE_DIR"
    exit 0
    ;;
  75)
    echo "Temporary browser/navigation failure (75)." >&2
    exit 75
    ;;
  *)
    echo "Capture script or rendering defect (exit $status)." >&2
    exit 1
    ;;
esac
