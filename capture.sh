#!/usr/bin/env bash
set -euo pipefail

CAPTURE_URL="${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL}"
CAPTURE_DIR="${CAPTURE_DIR:?Set CAPTURE_DIR to the evidence directory}"
SESSION="werewolf-capture-$$-${RANDOM}"
BROWSER_OPEN=false

/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
if ! /usr/bin/time -p playwright-cli -s="$SESSION" open "$CAPTURE_URL"; then
  echo 'Browser startup or navigation failed.' >&2
  exit 75
fi
BROWSER_OPEN=true
cleanup() {
  status=$?
  if [[ "$BROWSER_OPEN" == true ]]; then
    if ! /usr/bin/time -p playwright-cli -s="$SESSION" close; then
      echo 'Could not close the capture browser session.' >&2
      [[ "$status" -ne 0 ]] || status=75
    fi
  fi
  exit "$status"
}
trap cleanup EXIT

check_render() {
  local result
  if ! result=$(/usr/bin/time -p playwright-cli -s="$SESSION" eval 'async () => { await new Promise(resolve => setTimeout(resolve, 900)); const canvas = document.querySelector("canvas"); const heading = document.querySelector("h1"); return document.title === "Werewolf Survival" && !!canvas && canvas.width > 0 && canvas.height > 0 && !!heading && heading.getBoundingClientRect().width > 0 ? "RENDER_OK" : "RENDER_DEFECT"; }'); then
    echo 'Browser evaluation failed while checking page rendering.' >&2
    return 75
  fi
  printf '%s\n' "$result"
  if [[ "$result" != *RENDER_OK* ]]; then
    echo 'The preview loaded, but the expected game content did not render.' >&2
    return 1
  fi
}

for view in desktop mobile; do
  if [[ "$view" == desktop ]]; then
    width=1440
    height=900
  else
    width=390
    height=844
  fi
  /usr/bin/time -p playwright-cli -s="$SESSION" resize "$width" "$height" || { echo "Browser resize failed for $view." >&2; exit 75; }
  check_render || exit $?
  /usr/bin/time -p playwright-cli -s="$SESSION" screenshot --filename="$CAPTURE_DIR/final-$view.png" || { echo "Screenshot capture failed for $view." >&2; exit 75; }
done
