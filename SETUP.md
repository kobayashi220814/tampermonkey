# 換新電腦安裝指南

在新電腦上安裝全部 Tampermonkey 腳本的步驟。腳本分散在 3 個 repo，連結都集中在這。

## 步驟 1：先裝 Tampermonkey 擴充

到瀏覽器的擴充商店搜尋 **Tampermonkey** 安裝（Chrome／Edge 皆可）。裝好後建議到 Tampermonkey 設定把模式切到「進階」，腳本選單功能才會完整顯示。

## 步驟 2：逐一點連結安裝

點下方連結，Tampermonkey 會跳出安裝畫面，按「安裝」即可。

### 本 repo（獨立腳本）

- [PressPlay ICS 廣告連結快速填入（安裝）](https://raw.githubusercontent.com/kobayashi220814/tampermonkey/main/scripts/PressPlay%20ICS%20%E5%BB%A3%E5%91%8A%E9%80%A3%E7%B5%90%E5%BF%AB%E9%80%9F%E5%A1%AB%E5%85%A5.user.js)
- [PressPlay 關於頁面圖片深色遮罩下載（安裝）](https://raw.githubusercontent.com/kobayashi220814/tampermonkey/main/scripts/PressPlay%20%E9%97%9C%E6%96%BC%E9%A0%81%E9%9D%A2%E5%9C%96%E7%89%87%E6%B7%B1%E8%89%B2%E9%81%AE%E7%BD%A9%E4%B8%8B%E8%BC%89.user.js)
- [PressPlay 文章列表抓取（安裝）](https://raw.githubusercontent.com/kobayashi220814/tampermonkey/main/scripts/PressPlay%20%E6%96%87%E7%AB%A0%E5%88%97%E8%A1%A8%E6%8A%93%E5%8F%96.user.js)
- [知識王作弊仔（安裝）](https://raw.githubusercontent.com/kobayashi220814/tampermonkey/main/scripts/%E7%9F%A5%E8%AD%98%E7%8E%8B%E4%BD%9C%E5%BC%8A%E4%BB%94.user.js)

### ics-form-presets repo

- [ICS 廣告連結短連結設定檔管理器（安裝）](https://raw.githubusercontent.com/kobayashi220814/ics-form-presets/main/ics-form-presets.user.js)

### ai-article-generator repo（綁 AI 文章產生器）

- [ICS 廣告連結自動填入（安裝）](https://raw.githubusercontent.com/kobayashi220814/ai-article-generator/main/scripts/ics-autofill-from-ai-generator.user.js)
- [匯入 AI 文章產生器（正式）（安裝）](https://raw.githubusercontent.com/kobayashi220814/ai-article-generator/main/scripts/import-from-ai-generator.user.js)
- [匯入 AI 文章產生器（本地測試）（安裝）](https://raw.githubusercontent.com/kobayashi220814/ai-article-generator/main/scripts/import-from-ai-generator-dev.user.js) ＜選用，僅本地開發時需要＞

## 步驟 3：安裝後設定

- **知識王作弊仔**：開一個 `www.pressplay.cc` 或 `og-web.pressplay.cc` 頁面，點瀏覽器工具列的 Tampermonkey 圖示，在「知識王作弊仔」底下點「設定 OpenAI API 金鑰」輸入金鑰（金鑰不寫在程式碼內，需手動設一次）。
- **匯入 AI 文章（本地測試）**：只有要連本機 `localhost:3000` 開發時才需要，平常用正式版即可。

## 之後的更新

裝好後不用再手動管。在各 repo 改腳本並 push、版本號變大後，Tampermonkey 最慢 6 小時或手動「檢查更新」就會自動更新。想立即生效就重點一次上面的安裝連結重裝。
