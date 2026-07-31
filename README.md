# 蘭潭月影潭心單頁景點網站

以 Astro、Tailwind CSS 與 TypeScript 製作的繁體中文單頁景點指南，輸出為純靜態資產並由 Cloudflare Workers Static Assets 部署。專案沒有資料庫、登入或 CMS。

## 主要功能

- 景點介紹、門票／費用、停車、最佳時段、停留時間與無障礙提醒
- 臺鐵、高鐵 BRT 轉乘、自駕、機車與自行車交通整理
- 周邊美食、周邊景點、FAQ 與響應式照片牆
- TouristAttraction／LocalBusiness 與 FAQPage JSON-LD
- localStorage 行程清單，資料只保存在訪客目前裝置
- 本機 Canvas 紀念卡：相簿、拍照／自拍、三種尺寸、三種視覺風格與 PNG 下載
- GA4：`G-HXM22WWPKP`
- 所有景觀圖片皆放在 `public/images`，頁面不從第三方圖床載入

## 網域設定

全站網址只有一個設定點：`astro.config.ts` 內的 `site` 常數。

```ts
const site = '';
```

未填網域時仍可建置；canonical、Open Graph 絕對網址與 JSON-LD 的網址／圖片欄位會省略，sitemap 整合也不啟用。確定網域後，填入完整 HTTPS 網址並重新建置即可。

## 開發與驗證

專案版本固定於 `package.json`，Node 與 pnpm 另由 `.node-version`、`engines`、`packageManager` 固定。

```bash
corepack enable
CI=1 corepack pnpm install --frozen-lockfile
pnpm check
pnpm build
```

完整交付前驗證腳本：

```bash
./scripts/verify.sh
```

## Cloudflare Workers 部署

`wrangler.jsonc` 使用 Workers Static Assets，建置輸出目錄為 `dist`。

```bash
pnpm deploy
```

## 隱私

行程清單使用 localStorage。紀念卡照片、文字與成品只在訪客瀏覽器內處理，不會傳送至伺服器。網站本身不接收或儲存訪客上傳內容。

## 照片授權

授權與修改紀錄請見 `PHOTO-CREDITS.md`。
