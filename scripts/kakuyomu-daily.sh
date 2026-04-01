#!/bin/bash
# カクヨム日次自動投稿 + Discordリマインド
# cronから毎日実行: 投稿を試み、結果をDiscordに通知する

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$SCRIPT_DIR/post.log"
WEBHOOK_URL="https://discord.com/api/webhooks/1485155140271997061/n1dNphS4C3fnKu9hN7DjHyQNHna3Hrb4FhHFZGJbF4Z1152h-oWrSmbxQ8-4_XgobIWE"

echo "[$(date)] === 日次投稿開始 ===" >> "$LOG_FILE"

# 自動投稿を実行
OUTPUT=$(node "$SCRIPT_DIR/kakuyomu-post.mjs" 2>&1)
EXIT_CODE=$?

echo "$OUTPUT" >> "$LOG_FILE"

if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date)] 投稿成功" >> "$LOG_FILE"

    # 成功時は投稿完了通知をDiscordに送信
    curl -s -H "Content-Type: application/json" \
        -d "{\"content\": \"✅ **カクヨム自動投稿完了**\n\`\`\`\n$(echo "$OUTPUT" | tail -5)\n\`\`\`\"}" \
        "$WEBHOOK_URL" > /dev/null
else
    echo "[$(date)] 投稿失敗 (exit: $EXIT_CODE)" >> "$LOG_FILE"

    # 失敗時はリマインダーを送信（手動投稿を促す）
    bash "$SCRIPT_DIR/kakuyomu-reminder.sh"

    # エラー通知もDiscordに送信
    curl -s -H "Content-Type: application/json" \
        -d "{\"content\": \"⚠️ **カクヨム自動投稿に失敗しました。手動で投稿してください。**\n\`\`\`\n$(echo "$OUTPUT" | tail -3)\n\`\`\`\"}" \
        "$WEBHOOK_URL" > /dev/null
fi

echo "[$(date)] === 日次投稿終了 ===" >> "$LOG_FILE"
