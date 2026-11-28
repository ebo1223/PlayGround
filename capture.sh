#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="${BASH_SOURCE[0]%/*}"
[[ "$SCRIPT_DIR" == "${BASH_SOURCE[0]}" ]] && SCRIPT_DIR=.
PROJECT_DIR="$(cd "$SCRIPT_DIR" && pwd -P)"
: "${RUNTIME_DIR:?RUNTIME_DIR is required}"
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR for screenshots}"

if [[ "$CAPTURE_URL" != http://* && "$CAPTURE_URL" != https://* ]] || [[ "$CAPTURE_DIR" != /* ]]; then
  echo 'CAPTURE_URL must be HTTP(S), and CAPTURE_DIR must be absolute.' >&2
  exit 1
fi
CAPTURE_DIR="$(/usr/bin/time -p realpath -m "$CAPTURE_DIR")"
if [[ "$CAPTURE_DIR" == "$PROJECT_DIR" || "$CAPTURE_DIR" == "$PROJECT_DIR/"* ]]; then
  echo 'CAPTURE_DIR must be outside the project source tree.' >&2
  exit 1
fi
/usr/bin/time -p mkdir -p "$CAPTURE_DIR"

# The runtime capture helper opens the exact URL in its managed browser, waits
# for rendered content, captures desktop/mobile PNGs, and closes that browser.
CAPTURE_STRICT="${CAPTURE_STRICT:-1}" /usr/bin/time -p node "$RUNTIME_DIR/scripts/default-capture.mjs"

for view in desktop mobile; do
  image="$CAPTURE_DIR/final-$view.png"
  if [[ ! -s "$image" ]]; then
    echo "Capture failed to produce $image" >&2
    exit 1
  fi
  /usr/bin/time -p file "$image"
done
