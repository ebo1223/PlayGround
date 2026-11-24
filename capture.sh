#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL to capture.}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to the evidence output directory.}"
if [[ "$CAPTURE_DIR" == "$PROJECT_DIR" || "$CAPTURE_DIR" == "$PROJECT_DIR"/* ]]; then
  echo 'CAPTURE_DIR must be outside the project source tree.' >&2
  exit 1
fi
if [[ ! "$CAPTURE_URL" =~ ^https?:// ]]; then
  echo 'CAPTURE_URL must be an absolute HTTP or HTTPS URL.' >&2
  exit 1
fi
: "${RUNTIME_DIR:?RUNTIME_DIR must point to the preview runtime.}"
/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
# Strict mode turns page errors and failed same-origin resources into defects;
# the runtime maps temporary navigation or browser failures to exit status 75.
/usr/bin/time -p env CAPTURE_STRICT=1 node "$RUNTIME_DIR/scripts/default-capture.mjs"
