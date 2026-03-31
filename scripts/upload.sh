#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# カクヨム アップロード CLI
#
# 使い方:
#   ./scripts/upload.sh <series-id> <episode> [--draft|--publish] [--dry-run] [--headed]
#
# 例:
#   ./scripts/upload.sh shinimodori 01 --draft
#   ./scripts/upload.sh maou-yuusha 01-05 --publish
#   ./scripts/upload.sh shinimodori 01 --dry-run
# ─────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# 環境変数チェック
if [ -z "${KAKUYOMU_EMAIL:-}" ] || [ -z "${KAKUYOMU_PASSWORD:-}" ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  環境変数が未設定です"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "以下を .env または シェルの設定に追加してください:"
  echo ""
  echo "  export KAKUYOMU_EMAIL='your@email.com'"
  echo "  export KAKUYOMU_PASSWORD='your-password'"
  echo ""
  echo "または実行時に指定:"
  echo ""
  echo "  KAKUYOMU_EMAIL='...' KAKUYOMU_PASSWORD='...' $0 $*"
  exit 1
fi

# node_modules の存在チェック
if [ ! -d "${ROOT_DIR}/node_modules" ]; then
  echo "依存パッケージをインストール中..."
  cd "${ROOT_DIR}" && npm install
  echo ""
fi

# Playwright ブラウザの存在チェック
if [ ! -d "${ROOT_DIR}/node_modules/playwright/.local-browsers" ] 2>/dev/null; then
  echo "Playwright ブラウザをインストール中..."
  cd "${ROOT_DIR}" && npx playwright install chromium
  echo ""
fi

# TypeScript スクリプトを実行
cd "${ROOT_DIR}" && npx tsx scripts/upload.ts "$@"
