#!/usr/bin/env bash
set -euo pipefail

repo_dir="/mnt/c/Projects/mmz_diplom"
cd "$repo_dir"

# Ensure optional deps are not omitted (needed for rollup native binary).
npm config set omit "" --location=project >/dev/null 2>&1 || npm config set omit ""

rm -rf node_modules package-lock.json
npm cache clean --force

npm install --include=optional --no-audit --no-fund \
  --fetch-timeout=600000 --fetch-retry-maxtimeout=600000

test -d node_modules/@rollup/rollup-linux-x64-gnu
test -x node_modules/.bin/ng

npm run start
