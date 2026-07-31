#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

rm -rf node_modules dist
CI=1 corepack pnpm install --frozen-lockfile
pnpm check
pnpm build

if [[ -f pnpm-workspace.yaml ]]; then
  node - <<'NODE'
const fs = require('node:fs');
const yaml = fs.readFileSync('pnpm-workspace.yaml', 'utf8');
if (!/^packages:\s*\n(?:\s+-\s+.+\n?)+/m.test(yaml)) {
  throw new Error('pnpm-workspace.yaml 的 packages 欄位缺失或為空');
}
NODE
fi

if grep -RInE 'example\.com|localhost|chrome-extension://' dist; then
  echo '建置產物含有占位或非法內容' >&2
  exit 1
fi

SITE_VALUE="$(sed -n "s/^const site = '\(.*\)';/\1/p" astro.config.ts)"
if [[ -n "$SITE_VALUE" ]]; then
  test -f dist/sitemap-index.xml -o -f dist/sitemap-0.xml
  if grep -RIn '<lastmod>' dist/sitemap*.xml; then
    echo 'sitemap 含不允許的 lastmod' >&2
    exit 1
  fi
  if grep -RInE 'example\.com|localhost' dist/sitemap*.xml; then
    echo 'sitemap 含占位網域' >&2
    exit 1
  fi
else
  if compgen -G 'dist/sitemap*.xml' >/dev/null; then
    echo 'site 留空時不應產生 sitemap' >&2
    exit 1
  fi
fi

echo '全部驗證通過。'
