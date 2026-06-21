# Tampermonkey 腳本專案

個人 Tampermonkey 腳本集中管理。透過 GitHub raw + `@updateURL` 做維護：在本地改腳本、推上 GitHub，瀏覽器端即可更新。

## GitHub

- 帳號：`kobayashi220814`，repo：`tampermonkey`（public）
- 推送用 token（與其他專案共用）：`~/.claude/credentials/wade-server.md` 的 GitHub 區塊
- 推送指令：`git push "https://<token>@github.com/kobayashi220814/tampermonkey.git" main`（origin 不存 token）

## 結構

```
scripts/                 # 扁平放，每支一個 .user.js，中文檔名（raw 連結會 URL 編碼）
.githooks/pre-commit     # commit 時自動把有變動腳本的 @version 最後一段 +1
README.md                # 4 支的安裝連結與說明
```

收進本 repo 的只有「不綁特定 app 的獨立腳本」。綁 app 的腳本留在各自專案 repo，**不要搬進來**：

- ICS 短連結設定檔管理器 → `ics-form-presets`
- ICS 自動填入、匯入 AI 文章（正式／本地測試）→ `ai-article-generator/scripts/`

## 改腳本後的標準流程

1. 改 `scripts/` 下的 `.user.js`
2. `git add` + `git commit`，pre-commit hook 會自動把 `@version` 最後一段 +1（兩段式 `1.2→1.3`、三段式 `1.6.0→1.6.1` 都支援，中文檔名已處理）
3. push 到 GitHub
4. **回報時一定附上該腳本的安裝網址，且用 Markdown 超連結格式，不要用 code block**
   - 連結 = `https://raw.githubusercontent.com/kobayashi220814/tampermonkey/main/scripts/<檔名 URL 編碼>.user.js`
   - 範例：`[腳本名（安裝）](raw 連結)`

## 更新如何生效（提供給使用者的說明）

- 自動更新：push 後版本號變大，已安裝者最慢 6 小時、或手動「檢查更新」時自動更新（服務「沒空立即更新」與「分享給他人使用」兩種情境，所以 hook 要留著）
- 立即生效：直接點安裝網址重裝（不比對版本、較不受 raw 的 5 分鐘 CDN 快取影響）；重裝後重新整理網頁
- 接管舊腳本不會變兩支：靠 `@name` + `@namespace` 一致，重裝即覆蓋同一支、保留設定

## 安全規則（重要）

- **金鑰／token／密碼一律不寫進腳本原始碼**（repo 是 public，且分享出去別人也看得到）
- 需要金鑰的腳本改用 `GM_getValue`，搭配 `GM_registerMenuCommand` 讓使用者在腳本選單輸入一次存本機（範例見 `知識王作弊仔.user.js`）

## 慣例

- 回覆繁體中文，任何情境都不用破折號
- 暫存／一次性腳本用完清掉
