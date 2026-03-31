# カクヨム連載管理リポジトリ

複数のカクヨム連載企画を一元管理するリポジトリです。

## 連載一覧

| # | タイトル | ジャンル | ステータス | 企画書 | Pages |
|---|---------|---------|-----------|--------|-------|
| 1 | 死に戻りの図書館司書は、世界の終わりを何度でも書き換える | 現代ファンタジー × ミステリー × ループもの | 企画中 | [README](./series/shinimodori/README.md) | [HTML](https://YotaSakurai.github.io/kakuyomu/shinimodori/) |
| 2 | 魔王と勇者の経理部 ─ 剣と魔法より電卓が強い件について ─ | 異世界ファンタジー × お仕事コメディ | 企画中 | [README](./series/maou-yuusha/README.md) | [HTML](https://YotaSakurai.github.io/kakuyomu/maou-yuusha/) |
| 3 | 〈仮題〉魔法社会のソロキャンパー | 静かな再生系 × 魔法社会 × アウトドア | 企画中 | [README](./series/mahou-saisei/README.md) | [HTML](https://YotaSakurai.github.io/kakuyomu/mahou-saisei/) |

## ディレクトリ構成

```
kakuyomu/
├── README.md                          ← このファイル（ポータル）
├── create_series.sh                   ← 新連載ワンコマンド作成
├── kakuyomu.config.json               ← カクヨム作品ID設定
├── package.json                       ← Node.js 依存管理
├── scripts/
│   ├── upload.ts                      ← Playwright自動アップロード
│   └── upload.sh                      ← アップロードCLI
├── docs/                              ← GitHub Pages（自動生成）
│   ├── index.html                     ← ポータルHTML
│   └── <series-id>/index.html         ← 各連載の企画書HTML
├── series/                            ← 連載データ
│   └── <series-id>/
│       ├── README.md                  ← 企画書（Markdown）
│       ├── foreshadowing.xlsx         ← 伏線管理（Excel）
│       └── episodes/                  ← エピソード本文（.txt）
│           ├── 01.txt
│           ├── 02.txt
│           └── ...
└── templates/                         ← テンプレート
    ├── README.template.md             ← 企画書テンプレート
    ├── index.template.html            ← HTMLテンプレート
    └── generate_excel.py              ← Excel生成スクリプト
```

## 新しい連載を追加する

```bash
./create_series.sh <series-id> "タイトル"
```

**例:**
```bash
./create_series.sh shinimodori "死に戻りの図書館司書は、世界の終わりを何度でも書き換える"
./create_series.sh maou-yuusha "魔王と勇者の経理部"
./create_series.sh ai-tantei "AI探偵は夢を見るか"
```

実行すると以下が自動生成されます：
- `series/<series-id>/README.md` -- 企画書テンプレート
- `series/<series-id>/foreshadowing.xlsx` -- 伏線管理Excel（空テンプレート）
- `docs/<series-id>/index.html` -- GitHub Pages用HTML

生成後、各ファイルの `{{PLACEHOLDER}}` 部分を実際の内容に書き換えてください。

## カクヨムへの自動アップロード

Playwright（ブラウザ自動化）を使って、エピソードをカクヨムに自動アップロードできます。

### セットアップ

```bash
# 1. 依存パッケージのインストール
npm install

# 2. Playwright ブラウザのインストール
npx playwright install chromium

# 3. 環境変数の設定
export KAKUYOMU_EMAIL='your@email.com'
export KAKUYOMU_PASSWORD='your-password'

# 4. kakuyomu.config.json にカクヨムの作品IDを設定
#    作品ID: カクヨムURL https://kakuyomu.jp/works/XXXXXXXX の数字部分
```

### エピソードファイルの書き方

`series/<series-id>/episodes/01.txt` のように配置します。

```
# 第一話 タイトル

ここから本文が始まります。
1行目（# 付き or なし）がタイトル、空行のあとが本文です。
```

### アップロード

```bash
# 下書き保存（デフォルト）
./scripts/upload.sh shinimodori 01 --draft

# 一括アップロード（第1話〜第5話）
./scripts/upload.sh shinimodori 01-05 --draft

# 公開
./scripts/upload.sh maou-yuusha 01 --publish

# ドライラン（内容確認のみ、実際にはアップロードしない）
./scripts/upload.sh shinimodori 01 --dry-run

# ブラウザを表示してデバッグ
./scripts/upload.sh shinimodori 01 --draft --headed
```

### 注意事項

- 初回実行時にカクヨムへのログインが必要です（認証情報は `.kakuyomu-auth/` に保存され、次回以降は不要）
- `.kakuyomu-auth/` と `.env` は `.gitignore` に含まれており、コミットされません
- カクヨムのUI変更があった場合は `scripts/upload.ts` のセレクタ調整が必要です
- `--headed` オプションでブラウザの動作を目視確認できます

## GitHub Pages

Settings > Pages で Source を `docs/` に設定すると、以下のURLでアクセスできます：

- ポータル: `https://YotaSakurai.github.io/kakuyomu/`
- 各連載: `https://YotaSakurai.github.io/kakuyomu/<series-id>/`
