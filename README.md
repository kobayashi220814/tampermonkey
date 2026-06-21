# Tampermonkey 腳本

個人 Tampermonkey 腳本集中管理。安裝後 Tampermonkey 會依 @updateURL 自動向本 repo 拉取更新（需 @version 有變動）。

## 腳本清單

| 腳本 | 說明 | 安裝 |
|---|---|---|
| PressPlay ICS 廣告連結快速填入 | ICS 廣告連結新增頁，一鍵填入固定欄位（類型/轉介/部門）並選連結分群 | [安裝](https://raw.githubusercontent.com/kobayashi220814/tampermonkey/main/scripts/PressPlay%20ICS%20%E5%BB%A3%E5%91%8A%E9%80%A3%E7%B5%90%E5%BF%AB%E9%80%9F%E5%A1%AB%E5%85%A5.user.js) |
| PressPlay 關於頁面圖片深色遮罩下載 | 關於頁指定區塊圖片加深色遮罩後下載為 JPG | [安裝](https://raw.githubusercontent.com/kobayashi220814/tampermonkey/main/scripts/PressPlay%20%E9%97%9C%E6%96%BC%E9%A0%81%E9%9D%A2%E5%9C%96%E7%89%87%E6%B7%B1%E8%89%B2%E9%81%AE%E7%BD%A9%E4%B8%8B%E8%BC%89.user.js) |
| PressPlay 文章列表抓取 | cc 後台文章列表一鍵匯出 CSV（標題/連結/日期/類型） | [安裝](https://raw.githubusercontent.com/kobayashi220814/tampermonkey/main/scripts/PressPlay%20%E6%96%87%E7%AB%A0%E5%88%97%E8%A1%A8%E6%8A%93%E5%8F%96.user.js) |
| 知識王作弊仔 | 攔截知識王題目，查本地紀錄或問 OpenAI 自動作答（金鑰存本機） | [安裝](https://raw.githubusercontent.com/kobayashi220814/tampermonkey/main/scripts/%E7%9F%A5%E8%AD%98%E7%8E%8B%E4%BD%9C%E5%BC%8A%E4%BB%94.user.js) |

## 使用方式

1. 點上方「安裝」連結，Tampermonkey 會跳出安裝畫面，確認後安裝
2. 之後在本 repo 改腳本並 push，Tampermonkey 會自動更新（最慢 6 小時，可在面板手動「檢查更新」）
3. 開發時若版本號沒變，直接重新點安裝連結即可強制覆蓋

## 維護備註

- commit 時 .githooks/pre-commit 會自動把有變動腳本的 @version patch +1，不需手動改版本號
- 「知識王作弊仔」的 OpenAI 金鑰不寫在原始碼，第一次用請在 Tampermonkey 腳本選單點「設定 OpenAI API 金鑰」輸入
