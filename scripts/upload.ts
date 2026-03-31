/**
 * カクヨム自動アップロードスクリプト
 *
 * 使い方:
 *   npx tsx scripts/upload.ts <series-id> <episode-number> [--draft|--publish] [--dry-run]
 *   npx tsx scripts/upload.ts shinimodori 01 --draft
 *   npx tsx scripts/upload.ts maou-yuusha 01-05 --publish
 *
 * 環境変数:
 *   KAKUYOMU_EMAIL    - カクヨムのメールアドレス
 *   KAKUYOMU_PASSWORD - カクヨムのパスワード
 *
 * 認証Cookie は .kakuyomu-auth/ に保存され、2回目以降は再ログイン不要。
 */

import { chromium, Browser, BrowserContext, Page } from "playwright";
import * as fs from "fs";
import * as path from "path";

// ─── 定数 ───
const BASE_URL = "https://kakuyomu.jp";
const AUTH_DIR = path.join(__dirname, "..", ".kakuyomu-auth");
const CONFIG_PATH = path.join(__dirname, "..", "kakuyomu.config.json");

// ─── 型定義 ───
interface SeriesConfig {
  title: string;
  workId: string;
  episodesDir: string;
}

interface Config {
  series: Record<string, SeriesConfig>;
}

interface EpisodeFile {
  number: string;
  title: string;
  body: string;
  filePath: string;
}

interface UploadOptions {
  seriesId: string;
  episodes: string; // "01" or "01-05"
  mode: "draft" | "publish";
  dryRun: boolean;
  headless: boolean;
}

// ─── エピソードファイルの読み込み ───
function parseEpisodeFile(filePath: string): EpisodeFile {
  const content = fs.readFileSync(filePath, "utf-8");
  const fileName = path.basename(filePath, ".txt");

  // 1行目をタイトルとして扱う（空行で区切り）
  const lines = content.split("\n");
  let title = "";
  let bodyStartIndex = 0;

  // 先頭が "# タイトル" 形式の場合
  if (lines[0].startsWith("# ")) {
    title = lines[0].replace(/^#\s+/, "");
    bodyStartIndex = 1;
    // タイトル直後の空行をスキップ
    while (bodyStartIndex < lines.length && lines[bodyStartIndex].trim() === "") {
      bodyStartIndex++;
    }
  } else {
    // 1行目をそのままタイトルに
    title = lines[0].trim();
    bodyStartIndex = 1;
    while (bodyStartIndex < lines.length && lines[bodyStartIndex].trim() === "") {
      bodyStartIndex++;
    }
  }

  const body = lines.slice(bodyStartIndex).join("\n").trimEnd();

  return {
    number: fileName,
    title,
    body,
    filePath,
  };
}

function resolveEpisodeRange(episodes: string): string[] {
  if (episodes.includes("-")) {
    const [start, end] = episodes.split("-").map((s) => parseInt(s, 10));
    const result: string[] = [];
    for (let i = start; i <= end; i++) {
      result.push(i.toString().padStart(2, "0"));
    }
    return result;
  }
  return [episodes.padStart(2, "0")];
}

function loadEpisodes(config: SeriesConfig, episodeNumbers: string[]): EpisodeFile[] {
  const rootDir = path.join(__dirname, "..");
  const episodesDir = path.join(rootDir, config.episodesDir);

  if (!fs.existsSync(episodesDir)) {
    console.error(`エラー: エピソードディレクトリが見つかりません: ${episodesDir}`);
    console.error(`  mkdir -p ${episodesDir} でディレクトリを作成してください`);
    process.exit(1);
  }

  return episodeNumbers.map((num) => {
    const filePath = path.join(episodesDir, `${num}.txt`);
    if (!fs.existsSync(filePath)) {
      console.error(`エラー: エピソードファイルが見つかりません: ${filePath}`);
      process.exit(1);
    }
    return parseEpisodeFile(filePath);
  });
}

// ─── カクヨム操作 ───
async function login(page: Page): Promise<void> {
  const email = process.env.KAKUYOMU_EMAIL;
  const password = process.env.KAKUYOMU_PASSWORD;

  if (!email || !password) {
    console.error("エラー: 環境変数 KAKUYOMU_EMAIL と KAKUYOMU_PASSWORD を設定してください");
    console.error("");
    console.error("  export KAKUYOMU_EMAIL='your@email.com'");
    console.error("  export KAKUYOMU_PASSWORD='your-password'");
    process.exit(1);
  }

  console.log("  カクヨムにログイン中...");

  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });

  // メールアドレスでログインを選択
  // カクヨムのログインページの構造に合わせてセレクタを調整
  // 「メールアドレスで続ける」ボタンをクリック
  const emailLoginButton = page.getByText("メールアドレスで続ける");
  if (await emailLoginButton.isVisible()) {
    await emailLoginButton.click();
    await page.waitForLoadState("networkidle");
  }

  // メールアドレスとパスワードを入力
  await page.fill('input[type="email"], input[name="email"], input[name="username"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);

  // ログインボタンをクリック
  const loginButton = page.getByRole("button", { name: /ログイン|サインイン|続ける|送信/ });
  await loginButton.click();

  // ログイン完了を待機
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 30000,
  });

  console.log("  ログイン成功");
}

async function createEpisode(
  page: Page,
  workId: string,
  episode: EpisodeFile,
  mode: "draft" | "publish"
): Promise<void> {
  // エピソード作成ページへ遷移
  const createUrl = `${BASE_URL}/my/works/${workId}/episodes/new`;
  await page.goto(createUrl, { waitUntil: "networkidle" });

  // タイトル入力
  // カクヨムのエピソード作成フォームに合わせてセレクタを調整
  const titleInput = page.locator(
    'input[name="title"], input[placeholder*="タイトル"], #episode-title, [data-testid="episode-title"]'
  );
  await titleInput.waitFor({ timeout: 10000 });
  await titleInput.fill(episode.title);

  // 本文入力
  // カクヨムはtextareaまたはcontenteditable要素を使用している可能性がある
  const bodyInput = page.locator(
    'textarea[name="body"], #episode-body, [data-testid="episode-body"], .editor textarea, [contenteditable="true"]'
  );
  await bodyInput.waitFor({ timeout: 10000 });

  // contenteditable の場合は innerText で入力
  const tagName = await bodyInput.evaluate((el) => el.tagName.toLowerCase());
  if (tagName === "textarea") {
    await bodyInput.fill(episode.body);
  } else {
    // contenteditable の場合
    await bodyInput.click();
    await page.keyboard.insertText(episode.body);
  }

  // 少し待ってからボタンを押す（自動保存を待つ）
  await page.waitForTimeout(1000);

  if (mode === "publish") {
    // 公開ボタン
    const publishButton = page.getByRole("button", { name: /公開/ });
    await publishButton.click();

    // 確認ダイアログがあれば承認
    const confirmButton = page.getByRole("button", { name: /OK|確認|公開する/ });
    if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmButton.click();
    }
  } else {
    // 下書き保存ボタン
    const draftButton = page.getByRole("button", { name: /下書き|保存/ });
    await draftButton.click();
  }

  // 保存完了を待機
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
}

// ─── CLI パーサー ───
function parseArgs(): UploadOptions {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
カクヨム自動アップロード

使い方:
  npx tsx scripts/upload.ts <series-id> <episode> [options]

引数:
  series-id   kakuyomu.config.json に登録したシリーズID
  episode     エピソード番号 (例: 01) またはレンジ (例: 01-05)

オプション:
  --draft     下書き保存（デフォルト）
  --publish   即座に公開
  --dry-run   実際にはアップロードせず、内容を確認のみ
  --headed    ブラウザを表示して実行（デバッグ用）
  --help      このヘルプを表示

環境変数:
  KAKUYOMU_EMAIL      カクヨムのメールアドレス
  KAKUYOMU_PASSWORD   カクヨムのパスワード

例:
  npx tsx scripts/upload.ts shinimodori 01 --draft
  npx tsx scripts/upload.ts maou-yuusha 01-05 --publish
  npx tsx scripts/upload.ts shinimodori 01 --dry-run
`);
    process.exit(0);
  }

  const seriesId = args[0];
  const episodes = args[1];

  if (!seriesId || !episodes) {
    console.error("エラー: series-id と episode は必須です");
    console.error("  npx tsx scripts/upload.ts --help で使い方を確認");
    process.exit(1);
  }

  return {
    seriesId,
    episodes,
    mode: args.includes("--publish") ? "publish" : "draft",
    dryRun: args.includes("--dry-run"),
    headless: !args.includes("--headed"),
  };
}

// ─── メイン ───
async function main() {
  const opts = parseArgs();

  // 設定読み込み
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`エラー: 設定ファイルが見つかりません: ${CONFIG_PATH}`);
    process.exit(1);
  }

  const config: Config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  const seriesConfig = config.series[opts.seriesId];

  if (!seriesConfig) {
    console.error(`エラー: シリーズ "${opts.seriesId}" が kakuyomu.config.json に見つかりません`);
    console.error(`  登録済みシリーズ: ${Object.keys(config.series).join(", ")}`);
    process.exit(1);
  }

  if (seriesConfig.workId.includes("ここに")) {
    console.error(`エラー: シリーズ "${opts.seriesId}" の workId が未設定です`);
    console.error("  kakuyomu.config.json を編集して、カクヨムの作品IDを入力してください");
    console.error("  作品ID: カクヨムの作品URL https://kakuyomu.jp/works/XXXXXXXX の数字部分");
    process.exit(1);
  }

  // エピソード読み込み
  const episodeNumbers = resolveEpisodeRange(opts.episodes);
  const episodes = loadEpisodes(seriesConfig, episodeNumbers);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  カクヨム アップロード`);
  console.log(`  シリーズ: ${seriesConfig.title}`);
  console.log(`  エピソード: ${episodeNumbers.join(", ")} (${episodes.length}話)`);
  console.log(`  モード: ${opts.mode === "draft" ? "下書き保存" : "公開"}`);
  if (opts.dryRun) console.log("  ⚠ ドライラン（実際にはアップロードしません）");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  // エピソードのプレビュー表示
  for (const ep of episodes) {
    console.log(`  ${ep.number}: ${ep.title}`);
    console.log(`    本文: ${ep.body.substring(0, 60).replace(/\n/g, " ")}...`);
    console.log(`    文字数: ${ep.body.length}文字`);
    console.log("");
  }

  if (opts.dryRun) {
    console.log("ドライラン完了。実際にアップロードするには --dry-run を外してください。");
    return;
  }

  // ブラウザ起動
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: opts.headless });

    // 認証状態の復元 or 新規ログイン
    let context: BrowserContext;
    const authStatePath = path.join(AUTH_DIR, "state.json");

    if (fs.existsSync(authStatePath)) {
      console.log("保存済みの認証情報を使用...");
      context = await browser.newContext({ storageState: authStatePath });
    } else {
      context = await browser.newContext();
    }

    const page = await context.newPage();

    // ログイン状態を確認
    await page.goto(`${BASE_URL}/my`, { waitUntil: "networkidle" });
    const isLoggedIn = !page.url().includes("/login");

    if (!isLoggedIn) {
      await login(page);
      // 認証状態を保存
      fs.mkdirSync(AUTH_DIR, { recursive: true });
      await context.storageState({ path: authStatePath });
      console.log("  認証情報を保存しました");
    }

    // エピソードをアップロード
    for (const episode of episodes) {
      console.log(`アップロード中: ${episode.number} - ${episode.title}...`);
      await createEpisode(page, seriesConfig.workId, episode, opts.mode);
      console.log(`  完了: ${episode.number} - ${episode.title}`);
    }

    await context.close();
    console.log("");
    console.log("全エピソードのアップロードが完了しました!");
  } catch (error) {
    console.error("エラーが発生しました:", error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

main();
