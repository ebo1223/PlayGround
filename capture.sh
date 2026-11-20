#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL to capture.}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to the evidence output directory.}"
CAPTURE_DIR="$(/usr/bin/time -p realpath -m "$CAPTURE_DIR")"
case "$CAPTURE_DIR/" in
  "$PROJECT_DIR/"*) echo 'CAPTURE_DIR must be outside the project source.' >&2; exit 1 ;;
esac
/usr/bin/time -p node -e 'const u=new URL(process.argv[1]);if(!["http:","https:"].includes(u.protocol))throw Error("CAPTURE_URL must use HTTP or HTTPS");' "$CAPTURE_URL"
/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
export CAPTURE_STRICT=1
export CAPTURE_READY_SELECTOR='main[data-game-ready="true"]'
cd "$PROJECT_DIR"
/usr/bin/time -p node "${PROJECT_DIR}/.omgithub/scripts/default-capture.mjs"
