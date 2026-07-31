# 自檢紀錄

## 已完成的靜態檢查

- `package.json` 所有直接相依版本均為精確版本，沒有 `latest`、`*`、插入號或波浪號。
- `packageManager`、`engines.node`、`engines.pnpm` 與 `.node-version` 均已固定。
- 單包專案沒有建立 `pnpm-workspace.yaml`。
- `site` 只有 `astro.config.ts` 一個設定點；留空時不啟用 sitemap，也不輸出假的絕對網址。
- 頁面只有 GA4 官方外部腳本，沒有瀏覽器擴充功能協定或來源不明腳本。
- 所有景觀圖片均為本地 WebP，且已核對尺寸與可讀性。
- 行程清單只使用 localStorage；紀念卡只使用瀏覽器 File API、Object URL 與 Canvas。
- TypeScript 瀏覽器腳本已通過本機 `tsc --noEmit` 靜態型別檢查。
- 驗證腳本已通過 shell 語法檢查。

## 受執行環境阻擋的項目

目前工作環境提供的 npm 套件鏡像對套件請求回傳 HTTP 404，同時無法連線公共 npm registry。因此無法可信地產生新的 `pnpm-lock.yaml`，也無法執行以下必要的乾淨環境流程：

```bash
rm -rf node_modules
CI=1 corepack pnpm install --frozen-lockfile
pnpm check
pnpm build
```

由於沒有成功建置 `dist`，也無法對實際建置產物與 sitemap 做最終 grep。專案因此不能被標示為「完整驗收通過」。沒有用手工拼接、舊版套件或虛假鎖文件掩蓋此問題。
