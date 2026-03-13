# {{TITLE}}

> カクヨム新連載 企画書 ＆ 伏線管理テーブル

📱 **スマホ対応版はこちら → [GitHub Pages](https://YotaSakurai.github.io/kakuyomu/{{SERIES_ID}}/)**

---

## 作品概要

### タイトル（推奨）
**『{{TITLE}}』**

### タイトル候補
- 第2案：『{{TITLE_ALT_2}}』
- 第3案：『{{TITLE_ALT_3}}』

### ジャンル・タグ
- ジャンル：{{GENRE}}
- タグ：{{TAGS}}

---

## あらすじ

{{SYNOPSIS}}

---

## 主要キャラクター

### {{CHAR1_NAME}} ── 主人公
{{CHAR1_DESC}}

### {{CHAR2_NAME}} ── メイン相手役
{{CHAR2_DESC}}

### {{CHAR3_NAME}} ── キーパーソン
{{CHAR3_DESC}}

---

## 文字数・構成ガイド

| 区分 | 話数 | 1話あたり文字数 | 備考 |
|------|------|----------------|------|
| 第1章：導入 | 第1～5話 | 2,000〜2,500字 | テンポ重視。1話目は特に短く（離脱防止） |
| 第2章：展開 | 第6～15話 | 2,500〜3,500字 | {{ARC2_NOTE}} |
| 第3章：深化 | 第16～30話 | 3,000〜4,000字 | {{ARC3_NOTE}} |
| 第4章：転換 | 第31～40話 | 3,000〜4,000字 | {{ARC4_NOTE}} |
| 第5章：収束 | 第41～50話 | 3,500〜4,500字 | 伏線回収ラッシュ |
| 最終章：結末 | 第51～55話 | 4,000〜5,000字 | クライマックスと余韻 |
| **合計目安** | **全50～55話** | **総文字数 15〜20万字** | **書籍化を視野に入れたボリューム** |

---

## 伏線管理テーブル

> 📊 Excel版は [foreshadowing.xlsx](./foreshadowing.xlsx) を参照

### F-001：{{FUSE1_NAME}} ★★★【核心】
- **提示**（第{{FUSE1_HINT_EP}}話）：{{FUSE1_HINT}}
- **中間ヒント**（第{{FUSE1_MID_EP}}話）：{{FUSE1_MID}}
- **回収**（第{{FUSE1_REVEAL_EP}}話）：{{FUSE1_REVEAL}}
- 🔗 関連：{{FUSE1_RELATED}}

### F-002：{{FUSE2_NAME}} ★★★【キャラ】
- **提示**（第{{FUSE2_HINT_EP}}話）：{{FUSE2_HINT}}
- **中間ヒント**（第{{FUSE2_MID_EP}}話）：{{FUSE2_MID}}
- **回収**（第{{FUSE2_REVEAL_EP}}話）：{{FUSE2_REVEAL}}
- 🔗 関連：{{FUSE2_RELATED}}

### F-003：{{FUSE3_NAME}} ★★★【世界観】
- **提示**（第{{FUSE3_HINT_EP}}話）：{{FUSE3_HINT}}
- **中間ヒント**（第{{FUSE3_MID_EP}}話）：{{FUSE3_MID}}
- **回収**（第{{FUSE3_REVEAL_EP}}話）：{{FUSE3_REVEAL}}
- 🔗 関連：{{FUSE3_RELATED}}

<!-- 伏線は必要に応じて F-004 以降を追加してください -->

---

## セールスポイント

1. {{SP1}}
2. {{SP2}}
3. {{SP3}}
4. {{SP4}}
5. {{SP5}}

---

## リポジトリ構成

| ファイル | 用途 |
|---------|------|
| `series/{{SERIES_ID}}/README.md` | 企画書全文（GitHub上で直接閲覧） |
| `docs/{{SERIES_ID}}/index.html` | スマホ対応HTML（GitHub Pages） |
| `series/{{SERIES_ID}}/foreshadowing.xlsx` | 伏線管理Excel（ダウンロード用） |
