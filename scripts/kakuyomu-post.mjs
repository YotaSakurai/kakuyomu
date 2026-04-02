#!/usr/bin/env node
/**
 * カクヨム自動投稿スクリプト (Playwright)
 *
 * 使い方:
 *   node scripts/kakuyomu-post.mjs                  # 今日のエピソードを投稿
 *   node scripts/kakuyomu-post.mjs --ep 6           # 第6話を投稿
 *   node scripts/kakuyomu-post.mjs --ep 1-5         # 第1〜5話を一括投稿
 *   node scripts/kakuyomu-post.mjs --dry-run        # 投稿せずに動作確認
 *   node scripts/kakuyomu-post.mjs --login          # ログインのみ（cookie保存）
 *   node scripts/kakuyomu-post.mjs --headed         # ブラウザを表示して実行
 *
 * 初回は --login --headed で実行してログイン→cookie保存してください。
 *
 * 環境変数:
 *   KAKUYOMU_WORK_ID  - 作品ID（URLの /works/{id} 部分）
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const EPISODES_DIR = path.join(PROJECT_ROOT, 'series/maou-yuusha/episodes');
const COOKIE_FILE = path.join(__dirname, '.kakuyomu-cookies.json');
const CONFIG_FILE = path.join(__dirname, '.kakuyomu-config.json');
const START_DATE = '2026-03-22';

// エピソードタイトル一覧
const TITLES = {
  1: '勇者、請求書を受け取る', 2: '経理部へようこそ', 3: '魔王の溜息',
  4: 'そろばんの記憶', 5: '大決算という名の恐怖', 6: '白い封筒',
  7: '長く働けることが取り柄', 8: '四天王の影', 9: '帳簿の海',
  10: '王国からの手紙', 11: '魔王軍の台所事情', 12: '戦争で儲ける者',
  13: '給料日', 14: '古い帳簿の匂い', 15: '父の遺した数字',
  16: '監査令状', 17: '嘘をつく数字', 18: 'ラヴェル商会の正体',
  19: '白い封筒の中身', 20: '消えた経費の行方', 21: '対峙',
  22: 'すべての命に値段はない', 23: '監査報告書', 24: '引き出しの写真',
  25: 'ガルドスの送金', 26: '大決算の朝', 27: '審判の間',
  28: '数字の剣', 29: 'ガルドスの反撃', 30: '同じ剣、同じ商人',
  31: '亀裂', 32: '部訓の主', 33: '包囲', 34: '月明かりの密談',
  35: '白い封筒の告発者', 36: 'マーロウ', 37: '大陸商会の全貌',
  38: '先代魔王の贈賄', 39: '三百年の帳簿', 40: '院長の正体',
  41: '大決算の日', 42: '三十二億の真実', 43: '平和を望まない者たち',
  44: '共存条約', 45: '帳簿で倒す', 46: '勇者の印の真実',
  47: '新しい世界の会計', 48: '一銭の狂いもなく', 49: '再会',
  50: '新しい帳簿、最初の一頁',
};

// 章名マッピング（カクヨムの「章」機能用）
const CHAPTER_MAP = {
  1: '第1章「採用面接」', 6: '第2章「新人研修」',
  16: '第3章「初めての監査」', 26: '第4章「四天王の闇予算」',
  36: '第5章「大決算」', 46: '最終章「新しい帳簿」',
};

/**
 * エピソードのmdファイルから本文を抽出（タイトル行・---・次回予告を除去）
 */
function extractBody(epNum) {
  const epFile = path.join(EPISODES_DIR, `ep${String(epNum).padStart(2, '0')}.md`);
  if (!fs.existsSync(epFile)) {
    throw new Error(`ファイルが見つかりません: ${epFile}`);
  }
  const content = fs.readFileSync(epFile, 'utf-8');
  const lines = content.split('\n');

  // 最初の --- までスキップ（タイトル行）
  let startIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      startIdx = i + 1;
      break;
    }
  }

  // 末尾の --- 以降を除去（次回予告・あとがき）
  let endIdx = lines.length;
  for (let i = lines.length - 1; i >= startIdx; i--) {
    if (lines[i].trim() === '---') {
      endIdx = i;
      break;
    }
  }

  let body = lines.slice(startIdx, endIdx).join('\n').trim();

  // Markdown記法の除去（**太字** → 太字）
  body = body.replace(/\*\*(.+?)\*\*/g, '$1');

  return body;
}

/**
 * 日付からその日までに投稿すべき最大エピソード番号を計算
 */
function getMaxEpisodeForToday() {
  const today = new Date();
  const start = new Date(START_DATE);
  const dayNum = Math.floor((today - start) / 86400000) + 1;

  if (dayNum < 1) return { maxEp: 0, dayNum };
  if (dayNum === 1) return { maxEp: 5, dayNum };
  if (dayNum > 46) return { maxEp: 50, dayNum };
  return { maxEp: dayNum + 3, dayNum };
}

/**
 * 今日投稿すべきエピソード番号を計算（未投稿分を含む）
 */
function getTodayEpisodes(config) {
  const { maxEp, dayNum } = getMaxEpisodeForToday();
  if (maxEp === 0) return { episodes: [], dayNum };

  // 投稿済みエピソードを取得
  const posted = config.postedEpisodes || [];
  const lastPosted = posted.length > 0 ? Math.max(...posted) : 0;

  // 未投稿分をすべてリストアップ（漏れ分も含む）
  const episodes = [];
  for (let ep = 1; ep <= maxEp; ep++) {
    if (!posted.includes(ep)) {
      episodes.push(ep);
    }
  }

  if (episodes.length > 0 && lastPosted < maxEp) {
    const missed = episodes.length - (maxEp === 5 ? 5 : 1);
    if (missed > 0) {
      console.log(`⚠️ 未投稿のエピソードが${missed}話あります。まとめて投稿します。`);
    }
  }

  return { episodes, dayNum };
}

/**
 * 投稿済みエピソードを記録
 */
function markAsPosted(config, epNum) {
  if (!config.postedEpisodes) config.postedEpisodes = [];
  if (!config.postedEpisodes.includes(epNum)) {
    config.postedEpisodes.push(epNum);
    config.postedEpisodes.sort((a, b) => a - b);
  }
}

/**
 * 設定の読み込み・保存
 */
function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  }
  return {};
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * コマンドライン引数の解析
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    episodes: null,
    dryRun: false,
    loginOnly: false,
    headed: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--ep':
        i++;
        if (args[i].includes('-')) {
          const [s, e] = args[i].split('-').map(Number);
          opts.episodes = Array.from({ length: e - s + 1 }, (_, j) => s + j);
        } else {
          opts.episodes = [Number(args[i])];
        }
        break;
      case '--dry-run':
        opts.dryRun = true;
        break;
      case '--login':
        opts.loginOnly = true;
        break;
      case '--headed':
        opts.headed = true;
        break;
    }
  }
  return opts;
}

/**
 * メイン処理
 */
async function main() {
  const opts = parseArgs();
  const config = loadConfig();

  // 投稿対象のエピソード
  let episodes;
  if (opts.episodes) {
    episodes = opts.episodes;
  } else if (!opts.loginOnly) {
    const today = getTodayEpisodes(config);
    episodes = today.episodes;
    if (episodes.length === 0) {
      console.log('今日は投稿予定がありません（全話投稿済み or 開始前）。');
      return;
    }
    console.log(`今日の投稿: ${episodes.map(e => `第${e}話`).join(', ')}`);
  }

  // ブラウザ起動
  const browser = await chromium.launch({
    headless: !opts.headed,
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  });

  // Cookie復元
  if (fs.existsSync(COOKIE_FILE)) {
    const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf-8'));
    await context.addCookies(cookies);
    console.log('保存済みCookieを復元しました。');
  }

  const page = await context.newPage();

  // ログイン確認
  await page.goto('https://kakuyomu.jp/my');
  await page.waitForLoadState('networkidle');

  const currentUrl = page.url();
  const isLoggedIn = currentUrl.includes('/my') && !currentUrl.includes('/login');

  if (!isLoggedIn) {
    console.log('ログインが必要です。');

    if (!opts.headed) {
      console.log('');
      console.log('初回ログインは --headed オプション付きで実行してください:');
      console.log('  node scripts/kakuyomu-post.mjs --login --headed');
      console.log('');
      console.log('ブラウザが開くので、手動でログインしてください。');
      console.log('ログイン完了後、Cookieが自動保存されます。');
      await browser.close();
      process.exit(1);
    }

    // ログインページへ
    await page.goto('https://kakuyomu.jp/login');
    await page.waitForLoadState('networkidle');

    console.log('');
    console.log('=== ブラウザでログインしてください ===');
    console.log('ログイン完了後、マイページに遷移するのを待っています...');
    console.log('');

    // マイページへの遷移を待機（最大5分）
    await page.waitForURL('**/my**', { timeout: 300000 });
    console.log('ログイン成功！');

    // Cookie保存
    const cookies = await context.cookies();
    fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));
    console.log(`Cookieを保存しました: ${COOKIE_FILE}`);

    if (opts.loginOnly) {
      await browser.close();
      console.log('ログイン完了。次回から自動投稿できます。');
      return;
    }
  } else {
    console.log('ログイン済みです。');
  }

  // 作品IDの確認・取得
  if (!config.workId) {
    // ワークスペースから作品一覧を取得
    await page.goto('https://kakuyomu.jp/my/works');
    await page.waitForLoadState('networkidle');

    // 作品リンクを取得
    const workLinks = await page.$$eval('a[href*="/my/works/"]', links =>
      links.filter(a => a.href.match(/\/my\/works\/\d+$/))
        .map(a => ({ id: a.href.match(/\/my\/works\/(\d+)$/)?.[1], text: a.textContent.trim() }))
    );

    if (workLinks.length === 0) {
      console.log('作品が見つかりません。先にカクヨムで作品を作成してください。');
      await browser.close();
      process.exit(1);
    }

    // 「魔王と勇者の経理部」を探す or 最初の作品を使用
    const target = workLinks.find(w => w.text.includes('魔王と勇者の経理部')) || workLinks[0];
    config.workId = target.id;
    saveConfig(config);
    console.log(`作品ID: ${config.workId} (${target.text})`);
  }

  const WORK_ID = config.workId;

  // エピソード投稿
  for (const epNum of episodes) {
    const title = TITLES[epNum];
    if (!title) {
      console.error(`第${epNum}話のタイトルが見つかりません。スキップ。`);
      continue;
    }

    const body = extractBody(epNum);
    console.log(`\n--- 第${epNum}話「${title}」(${body.length}文字) ---`);

    if (opts.dryRun) {
      console.log('[DRY RUN] 投稿をスキップします。');
      console.log(`  タイトル: ${title}`);
      console.log(`  本文冒頭: ${body.substring(0, 80)}...`);
      continue;
    }

    // 章の開始エピソードなら、先に章を作成する必要があるか確認
    const chapterName = CHAPTER_MAP[epNum];

    // 新規エピソード作成ページへ
    await page.goto(`https://kakuyomu.jp/my/works/${WORK_ID}/episodes/new`);
    await page.waitForLoadState('networkidle');

    // タイトル入力
    const titleInput = await page.$('input[name="title"], input[placeholder*="タイトル"], #episode-title, [data-testid="episode-title"]');
    if (titleInput) {
      await titleInput.fill(title);
    } else {
      // フォールバック: 最初のtext inputを試す
      const firstInput = await page.$('input[type="text"]');
      if (firstInput) {
        await firstInput.fill(title);
      } else {
        console.error(`第${epNum}話: タイトル入力欄が見つかりません。スキップ。`);
        continue;
      }
    }

    // 本文入力
    const bodyInput = await page.$('textarea[name="body"], textarea[placeholder*="本文"], #episode-body, [data-testid="episode-body"], textarea');
    if (bodyInput) {
      await bodyInput.fill(body);
    } else {
      console.error(`第${epNum}話: 本文入力欄が見つかりません。スキップ。`);
      continue;
    }

    // 少し待つ（入力反映のため）
    await page.waitForTimeout(1000);

    // 公開ボタンをクリック
    const publishBtn = await page.$('button:has-text("公開"), button:has-text("投稿"), [data-testid="publish-button"]');
    if (publishBtn) {
      await publishBtn.click();

      // 確認ダイアログがあれば承認
      const confirmBtn = await page.waitForSelector('button:has-text("公開する"), button:has-text("OK"), button:has-text("はい")', { timeout: 5000 }).catch(() => null);
      if (confirmBtn) {
        await confirmBtn.click();
      }

      // 遷移を待つ
      await page.waitForLoadState('networkidle');
      console.log(`✅ 第${epNum}話「${title}」を投稿しました。`);

      // 投稿済みとして記録
      markAsPosted(config, epNum);
      saveConfig(config);
    } else {
      console.error(`第${epNum}話: 公開ボタンが見つかりません。`);
    }

    // 連続投稿時は少し間を空ける
    if (episodes.length > 1) {
      await page.waitForTimeout(2000);
    }
  }

  // 最終話の場合、作品を「完結」に設定
  if (episodes.includes(50) && !opts.dryRun) {
    console.log('\n最終話を投稿しました。作品を「完結済」に設定してください。');
  }

  // Cookie更新保存
  const cookies = await context.cookies();
  fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));

  await browser.close();
  console.log('\n完了。');
}

main().catch(err => {
  console.error('エラー:', err.message);
  process.exit(1);
});
