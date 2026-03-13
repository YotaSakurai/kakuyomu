# カクヨム連載管理リポジトリ

複数のカクヨム連載企画を一元管理するリポジトリです。

## 連載一覧

| # | タイトル | ジャンル | ステータス | 企画書 | Pages |
|---|---------|---------|-----------|--------|-------|
| 1 | 死に戻りの図書館司書は、世界の終わりを何度でも書き換える | 現代ファンタジー × ミステリー × ループもの | 企画中 | [README](./series/shinimodori/README.md) | [HTML](https://YotaSakurai.github.io/kakuyomu/shinimodori/) |

## ディレクトリ構成

```
kakuyomu/
├── README.md                          ← このファイル（ポータル）
├── create_series.sh                   ← 新連載ワンコマンド作成
├── docs/                              ← GitHub Pages（自動生成）
│   ├── index.html                     ← ポータルHTML
│   └── <series-id>/index.html         ← 各連載の企画書HTML
├── series/                            ← 連載データ
│   └── <series-id>/
│       ├── README.md                  ← 企画書（Markdown）
│       └── foreshadowing.xlsx         ← 伏線管理（Excel）
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

## GitHub Pages

Settings > Pages で Source を `docs/` に設定すると、以下のURLでアクセスできます：

- ポータル: `https://YotaSakurai.github.io/kakuyomu/`
- 各連載: `https://YotaSakurai.github.io/kakuyomu/<series-id>/`
