#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL.}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to the evidence output directory.}"

/usr/bin/time -p node -e '
  const path = require("node:path");
  const project = path.resolve(process.argv[1]);
  const output = path.resolve(process.argv[2]);
  if (output === project || output.startsWith(project + path.sep)) {
    console.error("CAPTURE_DIR must be outside the project source directory.");
    process.exit(1);
  }
' "$PROJECT_DIR" "$CAPTURE_DIR"

CAPTURE_STRICT=1 /usr/bin/time -p node "${RUNTIME_DIR:?}/scripts/default-capture.mjs"
