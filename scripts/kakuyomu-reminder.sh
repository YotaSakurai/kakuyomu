#!/bin/bash
# カクヨム投稿リマインダー - Discord Webhook
# 毎朝実行して、その日の投稿エピソードを通知する

WEBHOOK_URL="https://discord.com/api/webhooks/1485155140271997061/n1dNphS4C3fnKu9hN7DjHyQNHna3Hrb4FhHFZGJbF4Z1152h-oWrSmbxQ8-4_XgobIWE"
START_DATE="2026-03-22"
SERIES_DIR="/home/sakuy/kakuyomu/series/maou-yuusha/episodes"

# エピソードタイトル一覧
declare -A TITLES
TITLES[1]="勇者、請求書を受け取る"
TITLES[2]="経理部へようこそ"
TITLES[3]="魔王の溜息"
TITLES[4]="そろばんの記憶"
TITLES[5]="大決算という名の恐怖"
TITLES[6]="白い封筒"
TITLES[7]="長く働けることが取り柄"
TITLES[8]="四天王の影"
TITLES[9]="帳簿の海"
TITLES[10]="王国からの手紙"
TITLES[11]="魔王軍の台所事情"
TITLES[12]="戦争で儲ける者"
TITLES[13]="給料日"
TITLES[14]="古い帳簿の匂い"
TITLES[15]="父の遺した数字"
TITLES[16]="監査令状"
TITLES[17]="嘘をつく数字"
TITLES[18]="ラヴェル商会の正体"
TITLES[19]="白い封筒の中身"
TITLES[20]="消えた経費の行方"
TITLES[21]="対峙"
TITLES[22]="すべての命に値段はない"
TITLES[23]="監査報告書"
TITLES[24]="引き出しの写真"
TITLES[25]="ガルドスの送金"
TITLES[26]="大決算の朝"
TITLES[27]="審判の間"
TITLES[28]="数字の剣"
TITLES[29]="ガルドスの反撃"
TITLES[30]="同じ剣、同じ商人"
TITLES[31]="亀裂"
TITLES[32]="部訓の主"
TITLES[33]="包囲"
TITLES[34]="月明かりの密談"
TITLES[35]="白い封筒の告発者"
TITLES[36]="マーロウ"
TITLES[37]="大陸商会の全貌"
TITLES[38]="先代魔王の贈賄"
TITLES[39]="三百年の帳簿"
TITLES[40]="院長の正体"
TITLES[41]="大決算の日"
TITLES[42]="三十二億の真実"
TITLES[43]="平和を望まない者たち"
TITLES[44]="共存条約"
TITLES[45]="帳簿で倒す"
TITLES[46]="勇者の印の真実"
TITLES[47]="新しい世界の会計"
TITLES[48]="一銭の狂いもなく"
TITLES[49]="再会"
TITLES[50]="新しい帳簿、最初の一頁"

# 章の情報
declare -A CHAPTERS
CHAPTERS[1]="第1章「採用面接」"
CHAPTERS[2]="第1章「採用面接」"
CHAPTERS[3]="第1章「採用面接」"
CHAPTERS[4]="第1章「採用面接」"
CHAPTERS[5]="第1章「採用面接」 ── 章完結"
CHAPTERS[6]="第2章「新人研修」"
CHAPTERS[7]="第2章「新人研修」"
CHAPTERS[8]="第2章「新人研修」"
CHAPTERS[9]="第2章「新人研修」"
CHAPTERS[10]="第2章「新人研修」"
CHAPTERS[11]="第2章「新人研修」"
CHAPTERS[12]="第2章「新人研修」"
CHAPTERS[13]="第2章「新人研修」"
CHAPTERS[14]="第2章「新人研修」"
CHAPTERS[15]="第2章「新人研修」 ── 章完結"
CHAPTERS[16]="第3章「初めての監査」"
CHAPTERS[17]="第3章「初めての監査」"
CHAPTERS[18]="第3章「初めての監査」"
CHAPTERS[19]="第3章「初めての監査」"
CHAPTERS[20]="第3章「初めての監査」"
CHAPTERS[21]="第3章「初めての監査」"
CHAPTERS[22]="第3章「初めての監査」"
CHAPTERS[23]="第3章「初めての監査」"
CHAPTERS[24]="第3章「初めての監査」"
CHAPTERS[25]="第3章「初めての監査」 ── 章完結"
CHAPTERS[26]="第4章「四天王の闇予算」"
CHAPTERS[27]="第4章「四天王の闇予算」"
CHAPTERS[28]="第4章「四天王の闇予算」"
CHAPTERS[29]="第4章「四天王の闇予算」"
CHAPTERS[30]="第4章「四天王の闇予算」"
CHAPTERS[31]="第4章「四天王の闇予算」"
CHAPTERS[32]="第4章「四天王の闇予算」"
CHAPTERS[33]="第4章「四天王の闇予算」"
CHAPTERS[34]="第4章「四天王の闇予算」"
CHAPTERS[35]="第4章「四天王の闇予算」 ── 章完結"
CHAPTERS[36]="第5章「大決算」"
CHAPTERS[37]="第5章「大決算」"
CHAPTERS[38]="第5章「大決算」"
CHAPTERS[39]="第5章「大決算」"
CHAPTERS[40]="第5章「大決算」"
CHAPTERS[41]="第5章「大決算」"
CHAPTERS[42]="第5章「大決算」"
CHAPTERS[43]="第5章「大決算」"
CHAPTERS[44]="第5章「大決算」"
CHAPTERS[45]="第5章「大決算」 ── 章完結"
CHAPTERS[46]="最終章「新しい帳簿」"
CHAPTERS[47]="最終章「新しい帳簿」"
CHAPTERS[48]="最終章「新しい帳簿」"
CHAPTERS[49]="最終章「新しい帳簿」"
CHAPTERS[50]="最終章「新しい帳簿」 ── 完結"

# 今日の日付から何日目かを計算
TODAY=$(date +%Y-%m-%d)
START_SEC=$(date -d "$START_DATE" +%s)
TODAY_SEC=$(date -d "$TODAY" +%s)
DAY_NUM=$(( (TODAY_SEC - START_SEC) / 86400 + 1 ))

# スケジュール: Day1=ep01-05一括、Day2以降=ep(DAY_NUM+3)を1話ずつ
# 全46日間（Day1で5話、Day2-46で45話）
TOTAL_DAYS=46

# 範囲外チェック
if [ "$DAY_NUM" -lt 1 ] || [ "$DAY_NUM" -gt "$TOTAL_DAYS" ]; then
    # 投稿期間外 - 完結後のメッセージ
    if [ "$DAY_NUM" -gt "$TOTAL_DAYS" ]; then
        curl -s -H "Content-Type: application/json" \
            -d "{\"content\": \"**【魔王と勇者の経理部】**\n全50話の投稿が完了しました！お疲れ様でした！\"}" \
            "$WEBHOOK_URL" > /dev/null
    fi
    exit 0
fi

# Day1は一括投稿、Day2以降は1話ずつ
if [ "$DAY_NUM" -eq 1 ]; then
    # 初日: ep01-05（第1章まるごと）
    EP_START=1
    EP_END=5
    PUBLISHED=5
    REMAINING=45
    PROGRESS=$((PUBLISHED * 100 / 50))
    BAR_FILLED=$((PUBLISHED / 2))
    BAR_EMPTY=$((25 - BAR_FILLED))
    PROGRESS_BAR=$(printf '%0.s█' $(seq 1 $BAR_FILLED))$(printf '%0.s░' $(seq 1 $BAR_EMPTY))

    TITLES_LIST=""
    FILES_LIST=""
    for i in $(seq $EP_START $EP_END); do
        EP_NUM=$(printf "%02d" "$i")
        TITLES_LIST="${TITLES_LIST}第${i}話「${TITLES[$i]}」\n"
        FILES_LIST="${FILES_LIST}\`ep${EP_NUM}.md\` "
    done

    PAYLOAD=$(cat <<EOF
{
  "embeds": [{
    "title": "📖 カクヨム投稿リマインド",
    "description": "**魔王と勇者の経理部**\n━━━━━━━━━━━━━━━",
    "color": 3447003,
    "fields": [
      {
        "name": "📝 今日の投稿（5話一括）",
        "value": "${TITLES_LIST}${CHAPTERS[5]}",
        "inline": false
      },
      {
        "name": "📂 原稿ファイル",
        "value": "${FILES_LIST}",
        "inline": true
      },
      {
        "name": "📊 進捗",
        "value": "${PROGRESS_BAR} ${PUBLISHED}/50話 (${PROGRESS}%)",
        "inline": false
      },
      {
        "name": "✅ やること",
        "value": "1. 作品を新規作成（ジャンル: 異世界ファンタジー）\n2. キャッチコピー・紹介文・タグを設定\n3. 第1章「採用面接」を作成\n4. 第1話〜第5話を投稿する\n5. 更新スケジュールを設定する",
        "inline": false
      }
    ],
    "footer": {
      "text": "残り${REMAINING}話 | 連載開始日"
    }
  }]
}
EOF
)

    SPECIAL="\n\n🎉 **連載開始日です！** 第1章（5話）を一括投稿して、物語を始めましょう！"
    CONTENT_PAYLOAD="{\"content\": \"${SPECIAL}\", \"embeds\": $(echo "$PAYLOAD" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(json.dumps(d["embeds"]))')}"
    curl -s -H "Content-Type: application/json" -d "$CONTENT_PAYLOAD" "$WEBHOOK_URL" > /dev/null
    echo "[$(date)] Sent reminder for ep01-05 (bulk)"
    exit 0
fi

# Day2以降: 1日1話（ep番号 = DAY_NUM + 3）
EP_IDX=$((DAY_NUM + 3))
EP_NUM=$(printf "%02d" "$EP_IDX")
TITLE="${TITLES[$EP_IDX]}"
CHAPTER="${CHAPTERS[$EP_IDX]}"
FILE="$SERIES_DIR/ep${EP_NUM}.md"
PUBLISHED=$((EP_IDX))
REMAINING=$((50 - PUBLISHED))

# 進捗バー
PROGRESS=$((PUBLISHED * 100 / 50))
BAR_FILLED=$((PUBLISHED / 2))
BAR_EMPTY=$((25 - BAR_FILLED))
PROGRESS_BAR=$(printf '%0.s█' $(seq 1 $BAR_FILLED))$(printf '%0.s░' $(seq 1 $BAR_EMPTY))

# 特別メッセージ
SPECIAL=""
if [ "$EP_IDX" -eq 50 ]; then
    SPECIAL="\n\n🎊 **最終話です！** 連載お疲れ様でした！"
elif [[ "${CHAPTERS[$EP_IDX]}" == *"章完結"* ]]; then
    SPECIAL="\n\n📕 **章の区切りです！** 近況ノートやSNSで振り返りを投稿すると効果的です。"
elif [[ "${CHAPTERS[$EP_IDX]}" == *"完結"* ]]; then
    SPECIAL="\n\n🏆 **完結回です！** 感謝のメッセージを添えましょう。"
fi

# Discord送信
PAYLOAD=$(cat <<EOF
{
  "embeds": [{
    "title": "📖 カクヨム投稿リマインド",
    "description": "**魔王と勇者の経理部**\n━━━━━━━━━━━━━━━",
    "color": 3447003,
    "fields": [
      {
        "name": "📝 今日の投稿",
        "value": "**第${EP_IDX}話「${TITLE}」**\n${CHAPTER}",
        "inline": false
      },
      {
        "name": "📂 原稿ファイル",
        "value": "\`ep${EP_NUM}.md\`",
        "inline": true
      },
      {
        "name": "📊 進捗",
        "value": "${PROGRESS_BAR} ${PUBLISHED}/50話 (${PROGRESS}%)",
        "inline": false
      },
      {
        "name": "✅ やること",
        "value": "1. 原稿を最終確認する\n2. [カクヨム](https://kakuyomu.jp/)にログイン\n3. 第${EP_IDX}話を投稿する\n4. タグ・キャッチコピーを確認する",
        "inline": false
      }
    ],
    "footer": {
      "text": "残り${REMAINING}話 | 投稿${DAY_NUM}日目"
    }
  }]
}
EOF
)

# 特別メッセージがある場合は追加
if [ -n "$SPECIAL" ]; then
    CONTENT_PAYLOAD="{\"content\": \"${SPECIAL}\", \"embeds\": $(echo "$PAYLOAD" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(json.dumps(d["embeds"]))')}"
    curl -s -H "Content-Type: application/json" -d "$CONTENT_PAYLOAD" "$WEBHOOK_URL" > /dev/null
else
    curl -s -H "Content-Type: application/json" -d "$PAYLOAD" "$WEBHOOK_URL" > /dev/null
fi

echo "[$(date)] Sent reminder for ep${EP_NUM}: ${TITLE}"
