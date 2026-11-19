#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
: "${RUNTIME_DIR:?RUNTIME_DIR must point to the OMGithub runtime}"
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to an evidence directory outside the project}"

run() { /usr/bin/time -p "$@"; }
node -e 'try { const u = new URL(process.argv[1]); if (!/^https?:$/.test(u.protocol)) process.exit(1) } catch { process.exit(1) }' "$CAPTURE_URL" || { echo "CAPTURE_URL must be an absolute HTTP(S) URL." >&2; exit 1; }
case "$CAPTURE_DIR" in
  /*) ;;
  *) CAPTURE_DIR="$PROJECT_DIR/$CAPTURE_DIR" ;;
esac
CAPTURE_DIR="$(run realpath -m "$CAPTURE_DIR")"
case "$CAPTURE_DIR/" in
  "$PROJECT_DIR/"*) echo "Capture evidence must be outside PROJECT_DIR ($PROJECT_DIR)." >&2; exit 1 ;;
esac
run mkdir -p "$CAPTURE_DIR"

# The runtime capture owns and closes its Chromium instance, visits the exact URL
# in desktop and mobile viewports, waits for rendered body/fonts, and checks page errors.
export CAPTURE_STRICT=1
export CAPTURE_READY_SELECTOR="${CAPTURE_READY_SELECTOR:-body}"
run node "$RUNTIME_DIR/scripts/default-capture.mjs"
[[ -s "$CAPTURE_DIR/final-desktop.png" && -s "$CAPTURE_DIR/final-mobile.png" ]] || { echo "Capture completed without both required screenshots." >&2; exit 1; }
