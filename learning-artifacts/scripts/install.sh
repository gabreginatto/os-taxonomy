#!/usr/bin/env bash
set -euo pipefail
artifact_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$artifact_root"
node -e 'if(Number(process.versions.node.split(".")[0])<22)throw Error("Node 22 or newer is required")'
npm ci --cache "$artifact_root/.cache/npm" --no-audit --no-fund
python3 -m venv "$artifact_root/.venv"
"$artifact_root/.venv/bin/python" -m pip install --cache-dir "$artifact_root/.cache/pip" --disable-pip-version-check --requirement requirements.txt
python3 scripts/sync_guidance.py
node cli.mjs doctor
node ../scripts/validate.mjs
if [ -f "$artifact_root/hosting/package-lock.json" ]; then
  npm --prefix "$artifact_root/hosting" ci --cache "$artifact_root/.cache/npm" --no-audit --no-fund
  node "$artifact_root/hosting/node_modules/firebase-tools/lib/bin/firebase.js" --version
fi
