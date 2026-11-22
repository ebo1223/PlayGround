#!/usr/bin/env bash
set -Eeuo pipefail
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to the evidence directory}"
SESSION="sudoku-capture-$$"
BROWSER_OPEN=false

# Time every external operation without hiding its output.
timed() {
  printf '+ ' >&2
  printf '%q ' "$@" >&2
  printf '\n' >&2
  /usr/bin/time -p "$@"
}
close_browser() {
  if [[ "$BROWSER_OPEN" == true ]]; then
    timed timeout 30s playwright-cli -s="$SESSION" close || true
    BROWSER_OPEN=false
  fi
}
trap close_browser EXIT

if ! timed mkdir -p "$CAPTURE_DIR"; then
  echo 'Could not create capture directory.' >&2
  exit 1
fi
if ! timed timeout 90s playwright-cli -s="$SESSION" open "$CAPTURE_URL"; then
  echo 'Browser launch or navigation failed; capture may be retried.' >&2
  exit 75
fi
BROWSER_OPEN=true

# Confirm both that the document settled and that the actual game rendered.
if ! timed timeout 30s playwright-cli -s="$SESSION" eval 'document.readyState'; then
  echo 'Browser evaluation failed while checking page readiness.' >&2
  exit 75
fi
if ! timed timeout 30s playwright-cli -s="$SESSION" eval '({title: document.title, heading: document.querySelector(".brand")?.innerText, cells: document.querySelectorAll(".board .cell").length})'; then
  echo 'Browser evaluation failed while checking rendered content.' >&2
  exit 75
fi
rendered="$(timed playwright-cli --raw -s="$SESSION" eval 'document.querySelectorAll(".board .cell").length' 2>/dev/null)" || {
  echo 'Could not inspect rendered game content.' >&2
  exit 75
}
if [[ "$rendered" != 81 ]]; then
  echo "Rendering defect: expected 81 Sudoku cells, found '$rendered'." >&2
  exit 1
fi

if ! timed timeout 30s playwright-cli -s="$SESSION" resize 1280 900; then
  echo 'Browser resize failed; capture may be retried.' >&2
  exit 75
fi
if ! timed timeout 45s playwright-cli -s="$SESSION" screenshot --filename="$CAPTURE_DIR/final-desktop.png"; then
  echo 'Desktop screenshot failed; capture may be retried.' >&2
  exit 75
fi
if ! timed timeout 30s playwright-cli -s="$SESSION" resize 390 844; then
  echo 'Browser resize failed; capture may be retried.' >&2
  exit 75
fi
if ! timed timeout 45s playwright-cli -s="$SESSION" screenshot --filename="$CAPTURE_DIR/final-mobile.png"; then
  echo 'Mobile screenshot failed; capture may be retried.' >&2
  exit 75
fi
close_browser
echo "Captured desktop and mobile views from $CAPTURE_URL into $CAPTURE_DIR"
