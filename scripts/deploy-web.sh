#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="/vol1/1000/code/webfront/vue/simple-music"
BUILD_DIR="$PROJECT_ROOT/dist"
PORT="2999"

cd "$PROJECT_ROOT"

if [ ! -d "node_modules" ]; then
  npm install
fi

echo "[deploy] building web assets..."
npm run build

if [ ! -d "dist" ]; then
  echo "[deploy] build output missing, aborting." >&2
  exit 1
fi

cat <<EOF
[deploy] static files ready at $BUILD_DIR
[deploy] serve them via nginx (configured for http://nas.xdw520yq.top:$PORT/)
EOF

