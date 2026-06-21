// ==UserScript==
// @name         PressPlay 文章列表抓取
// @namespace    http://tampermonkey.net/
// @version      1.1
// @updateURL    https://raw.githubusercontent.com/kobayashi220814/tampermonkey/main/scripts/PressPlay%20%E6%96%87%E7%AB%A0%E5%88%97%E8%A1%A8%E6%8A%93%E5%8F%96.user.js
// @downloadURL  https://raw.githubusercontent.com/kobayashi220814/tampermonkey/main/scripts/PressPlay%20%E6%96%87%E7%AB%A0%E5%88%97%E8%A1%A8%E6%8A%93%E5%8F%96.user.js
// @match        https://cc.pressplay.cc/project/*/content/article
// @match        https://cc.pressplay.cc/project/*/content/article?*
// @grant        none
// ==/UserScript==

(function () {
    // 只在文章「列表頁」顯示，單篇文章頁（/content/article/<ID>）不顯示
    if (!/\/content\/article\/?$/.test(location.pathname)) return;

    const btn = document.createElement("button");
    btn.textContent = "📋 匯出文章清單";
    btn.style.cssText = "position:fixed;top:10px;right:10px;z-index:9999;padding:8px 14px;background:#4CAF50;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;";
    document.body.appendChild(btn);

    btn.addEventListener("click", () => {
        const rows_el = document.querySelectorAll("#DataTables_Table_0 tbody tr");

        if (rows_el.length === 0) {
            alert("找不到資料，請確認頁面已載入完成");
            return;
        }

        const rows = [["標題", "連結", "發布日期", "類型"]];

        rows_el.forEach(tr => {
            // 標題 + 連結
            const a = tr.querySelector("td:nth-child(2) a");
            const title = a?.querySelector(".title-link")?.textContent.trim() || a?.textContent.trim() || "";
            const href = a?.getAttribute("href") || "";

            // 發布日期（有 <br> 隔開日期和時間，取整段文字並把換行換成空格）
            const dateDiv = tr.querySelector("td.sorting_1 > div");
            const date = dateDiv ? dateDiv.innerHTML.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").trim() : "";

            // 類型（可能有多個 .project-tag，用頓號合併）
            const tags = tr.querySelectorAll("td:nth-child(6) .project-tag");
            const type = Array.from(tags).map(t => t.textContent.trim()).join("、");

            rows.push([title, href, date, type]);
        });

        const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "pressplay_articles.csv";
        a.click();

        alert(`✅ 已匯出 ${rows.length - 1} 筆文章`);
    });
})();