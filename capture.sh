#!/usr/bin/env bash
set -euo pipefail

CAPTURE_URL="${CAPTURE_URL:-}"
CAPTURE_DIR="${CAPTURE_DIR:-}"
if [[ -z "$CAPTURE_URL" || -z "$CAPTURE_DIR" ]]; then
  echo 'CAPTURE_URL and CAPTURE_DIR are required.' >&2
  exit 1
fi

run() {
  /usr/bin/time -p "$@"
}
run mkdir -p "$CAPTURE_DIR"
SESSION="capture-$$-${RANDOM}"
OPENED=false

run_cli() {
  local label log
  label="$1"
  log="$CAPTURE_DIR/${label}.log"
  shift
  if /usr/bin/time -p playwright-cli "-s=$SESSION" "$@" >"$log" 2>&1; then
    cat "$log"
    return 0
  else
    local status=$?
    cat "$log" >&2
    return "$status"
  fi
}

cleanup() {
  local status=$?
  if [[ "$OPENED" == true ]]; then
    /usr/bin/time -p playwright-cli "-s=$SESSION" close >"$CAPTURE_DIR/browser-close.log" 2>&1 || true
    cat "$CAPTURE_DIR/browser-close.log" || true
  fi
  exit "$status"
}
trap cleanup EXIT

if run_cli browser-open open "$CAPTURE_URL"; then
  OPENED=true
else
  echo 'Temporary browser/navigation infrastructure failure while opening capture URL.' >&2
  exit 75
fi

render_check='async page => {
  try {
    await page.waitForFunction(() => {
      const canvas = document.querySelector("canvas");
      return document.title === "Warcraft 3D" && typeof window.THREE === "object" &&
        canvas && canvas.width >= window.innerWidth && canvas.height >= window.innerHeight &&
        document.querySelector("#gameTitle")?.textContent.includes("FROSTREACH") &&
        document.querySelector("#gold")?.textContent.trim();
    }, null, { timeout: 20000 });
    await page.waitForTimeout(1200);
    const check = await page.evaluate(() => ({
      title: document.title,
      canvas: !!document.querySelector("canvas"),
      three: typeof window.THREE === "object",
      gameTitle: document.querySelector("#gameTitle")?.textContent.trim(),
      resourceUI: !!document.querySelector("#gold"),
      viewport: [innerWidth, innerHeight]
    }));
    if (!check.canvas || !check.three || check.title !== "Warcraft 3D" || !check.resourceUI)
      throw new Error("RENDER_DEFECT: expected game canvas, Three.js and resource UI; got " + JSON.stringify(check));
    return check;
  } catch (error) {
    if (String(error).includes("RENDER_DEFECT")) throw error;
    throw new Error("RENDER_DEFECT: game did not finish rendering: " + String(error));
  }
}'
if ! run_cli render-check run-code "$render_check"; then
  if grep -q 'RENDER_DEFECT' "$CAPTURE_DIR/render-check.log"; then
    echo 'Rendered page failed the game-content check.' >&2
    exit 1
  fi
  echo 'Temporary browser execution failure during render verification.' >&2
  exit 75
fi

if ! run_cli desktop-resize resize 1280 800; then
  echo 'Temporary browser infrastructure failure while setting desktop viewport.' >&2
  exit 75
fi
if ! run_cli desktop-shot screenshot --filename="$CAPTURE_DIR/final-desktop.png"; then
  echo 'Temporary browser infrastructure failure while capturing desktop view.' >&2
  exit 75
fi
if ! run_cli mobile-resize resize 390 844; then
  echo 'Temporary browser infrastructure failure while setting mobile viewport.' >&2
  exit 75
fi
if ! run_cli mobile-shot screenshot --filename="$CAPTURE_DIR/final-mobile.png"; then
  echo 'Temporary browser infrastructure failure while capturing mobile view.' >&2
  exit 75
fi

if ! run python3 -c 'import struct,sys
for p in sys.argv[1:]:
 b=open(p,"rb").read(24)
 if len(b)<24 or b[:8]!=bytes([137,80,78,71,13,10,26,10]): raise SystemExit("invalid PNG screenshot: "+p)
 w,h=struct.unpack(">II",b[16:24])
 if w<=0 or h<=0: raise SystemExit("empty PNG screenshot: "+p)
print("Both PNG screenshots are valid and non-empty.")' "$CAPTURE_DIR/final-desktop.png" "$CAPTURE_DIR/final-mobile.png"; then
  echo 'Screenshot output validation failed.' >&2
  exit 1
fi

echo "Desktop and mobile captures saved in $CAPTURE_DIR"
