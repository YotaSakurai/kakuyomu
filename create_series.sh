#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# カクヨム新連載 セットアップスクリプト
# 使い方: ./create_series.sh <series-id> "タイトル"
# 例:     ./create_series.sh maou-yuusha "魔王と勇者の経理部"
# ─────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATES_DIR="${SCRIPT_DIR}/templates"
SERIES_DIR="${SCRIPT_DIR}/series"
DOCS_DIR="${SCRIPT_DIR}/docs"

# ── 引数チェック ──
if [ $# -lt 2 ]; then
  echo "使い方: $0 <series-id> \"タイトル\""
  echo ""
  echo "例:"
  echo "  $0 maou-yuusha \"魔王と勇者の経理部\""
  echo "  $0 ai-tantei \"AI探偵は夢を見るか\""
  exit 1
fi

SERIES_ID="$1"
TITLE="$2"

# ── ID バリデーション ──
if [[ ! "$SERIES_ID" =~ ^[a-z0-9][a-z0-9-]*[a-z0-9]$ ]] && [[ ! "$SERIES_ID" =~ ^[a-z0-9]$ ]]; then
  echo "エラー: series-id は英小文字・数字・ハイフンのみ使用できます (例: maou-yuusha)"
  exit 1
fi

# ── 重複チェック ──
if [ -d "${SERIES_DIR}/${SERIES_ID}" ]; then
  echo "エラー: series/${SERIES_ID} は既に存在します"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  新連載セットアップ"
echo "  ID:    ${SERIES_ID}"
echo "  タイトル: ${TITLE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── ディレクトリ作成 ──
mkdir -p "${SERIES_DIR}/${SERIES_ID}"
mkdir -p "${DOCS_DIR}/${SERIES_ID}"

# ── README.md 生成 ──
sed "s|{{TITLE}}|${TITLE}|g; s|{{SERIES_ID}}|${SERIES_ID}|g" \
  "${TEMPLATES_DIR}/README.template.md" > "${SERIES_DIR}/${SERIES_ID}/README.md"
echo "  作成: series/${SERIES_ID}/README.md"

# ── index.html 生成 ──
sed "s|{{TITLE}}|${TITLE}|g; s|{{SERIES_ID}}|${SERIES_ID}|g" \
  "${TEMPLATES_DIR}/index.template.html" > "${DOCS_DIR}/${SERIES_ID}/index.html"
echo "  作成: docs/${SERIES_ID}/index.html"

# ── Excel 生成 ──
EXCEL_PATH="${SERIES_DIR}/${SERIES_ID}/foreshadowing.xlsx"
if command -v python3 &> /dev/null; then
  python3 "${TEMPLATES_DIR}/generate_excel.py" "${EXCEL_PATH}" "${TITLE}"
else
  echo "  スキップ: foreshadowing.xlsx (python3 が見つかりません。手動で作成してください)"
fi

echo ""
echo "セットアップ完了!"
echo ""
echo "作成されたファイル:"
echo "  series/${SERIES_ID}/README.md          ← 企画書テンプレート"
echo "  series/${SERIES_ID}/foreshadowing.xlsx ← 伏線管理Excel"
echo "  docs/${SERIES_ID}/index.html           ← GitHub Pages用HTML"
echo ""
echo "次のステップ:"
echo "  1. series/${SERIES_ID}/README.md の {{PLACEHOLDER}} を埋める"
echo "  2. docs/${SERIES_ID}/index.html を肉付けする"
echo "  3. README.md の連載一覧テーブルに行を追加する"
echo "  4. docs/index.html にカードを追加する"
echo "  5. git add & commit & push"
