// ==UserScript==
// @name         PressPlay ICS 廣告連結快速填入
// @namespace    pressplay-ics-autofill
// @version      1.2
// @updateURL    https://raw.githubusercontent.com/kobayashi220814/tampermonkey/main/scripts/PressPlay%20ICS%20%E5%BB%A3%E5%91%8A%E9%80%A3%E7%B5%90%E5%BF%AB%E9%80%9F%E5%A1%AB%E5%85%A5.user.js
// @downloadURL  https://raw.githubusercontent.com/kobayashi220814/tampermonkey/main/scripts/PressPlay%20ICS%20%E5%BB%A3%E5%91%8A%E9%80%A3%E7%B5%90%E5%BF%AB%E9%80%9F%E5%A1%AB%E5%85%A5.user.js
// @description  自動填入廣告連結固定欄位（類型、轉介類型、部門），並可選擇連結分群後一鍵填入
// @author       wade7
// @match        https://ics-admin.pressplay.cc/admin/pressplay/promote/ad_link/add
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 設定一般 select 欄位（相容 Vue.js 響應式）
    function setSelect(id, value) {
        const el = document.getElementById(id);
        if (!el) { console.warn('[ICS自動填入] 找不到欄位:', id); return; }
        const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
        setter.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // 設定 Select2 欄位（連結分群）— 以模擬點擊為主，jQuery API 為備援
    function setSelect2(value, callback) {
        const wrapperDiv = document.querySelector('.condition-add[title="廣告連結分群"]');
        if (!wrapperDiv) { console.warn('[ICS自動填入] 找不到連結分群容器'); callback && callback(false); return; }

        const selectEl = wrapperDiv.querySelector('select');

        // 先嘗試 jQuery Select2 API
        if (window.$ && selectEl && $(selectEl).data('select2')) {
            $(selectEl).val(value).trigger('change');
            callback && callback(true);
            return;
        }

        // 備援：模擬點擊 Select2 可視區域
        // Select2 產生的容器通常是 select 的下一個兄弟元素，或在 wrapper 內
        const select2Container = (selectEl && selectEl.nextElementSibling)
                               || wrapperDiv.querySelector('.select2-container');

        if (!select2Container) { console.warn('[ICS自動填入] 找不到 Select2 容器'); callback && callback(false); return; }

        const clickTarget = select2Container.querySelector('.select2-selection') || select2Container;
        clickTarget.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        clickTarget.click();

        // 等下拉開啟（有搜尋欄時先輸入關鍵字篩選）
        setTimeout(() => {
            const searchInput = document.querySelector('.select2-search__field');
            if (searchInput) {
                // 清空再輸入，觸發 Select2 的篩選邏輯
                const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                nativeSetter.call(searchInput, value);
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                searchInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));
            }

            // 等篩選結果出現後點擊
            let attempts = 0;
            const poll = setInterval(() => {
                const opts = document.querySelectorAll('.select2-results__option');
                for (const opt of opts) {
                    const text = opt.textContent.trim();
                    if (text === value || text.includes(value)) {
                        opt.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                        opt.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                        opt.click();
                        clearInterval(poll);
                        callback && callback(true);
                        return;
                    }
                }
                if (++attempts > 40) {
                    clearInterval(poll);
                    console.warn('[ICS自動填入] 找不到選項:', value);
                    callback && callback(false);
                }
            }, 100);
        }, 350);
    }

    function fillForm(linkGroup, onDone) {
        setSelect('type', 'in_article');        // 類型：站內_文章
        setSelect('referral_type', 'internal'); // 轉介類型：站內
        setSelect('dep', 'bd');                 // 部門：BD
        if (linkGroup) {
            setSelect2(linkGroup, onDone);
        } else {
            onDone && onDone(true);
        }
    }

    function createPanel() {
        const panel = document.createElement('div');
        panel.id = '_ics_panel';
        panel.style.cssText = `
            position: fixed;
            top: 90px;
            right: 24px;
            background: #ffffff;
            border: 2px solid #e05c2a;
            border-radius: 10px;
            padding: 16px 18px;
            z-index: 99999;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            min-width: 185px;
            font-family: 'Noto Sans TC', Arial, sans-serif;
            font-size: 14px;
        `;

        panel.innerHTML = `
            <div style="font-weight:700;color:#e05c2a;margin-bottom:14px;font-size:15px;">⚡ ICS 快速填入</div>

            <div style="margin-bottom:6px;color:#444;font-weight:600;">連結分群</div>
            <select id="_ics_group" style="
                width:100%;padding:6px 8px;
                border:1px solid #ccc;border-radius:6px;
                margin-bottom:14px;font-size:14px;
                background:#fafafa;
            ">
                <option value="SEO2">SEO2</option>
                <option value="專訪文章">專訪文章</option>
            </select>

            <button id="_ics_btn" style="
                width:100%;padding:9px 0;
                background:#e05c2a;color:#fff;
                border:none;border-radius:7px;
                font-size:14px;font-weight:700;
                cursor:pointer;
            ">填入固定欄位</button>

            <div id="_ics_msg" style="
                margin-top:9px;
                font-size:13px;
                min-height:18px;
                text-align:center;
            "></div>

            <div style="margin-top:12px;border-top:1px solid #eee;padding-top:10px;font-size:11px;color:#aaa;line-height:1.6;">
                固定帶入：<br>
                類型：站內_文章<br>
                轉介：站內<br>
                部門：BD
            </div>
        `;

        document.body.appendChild(panel);

        document.getElementById('_ics_btn').addEventListener('click', () => {
            const group = document.getElementById('_ics_group').value;
            const msg = document.getElementById('_ics_msg');
            msg.style.color = '#888';
            msg.textContent = '填入中…';

            fillForm(group, (ok) => {
                msg.style.color = ok ? '#28a745' : '#dc3545';
                msg.textContent = ok ? '✓ 欄位已填入！' : '⚠ 連結分群填入失敗，請手動選取';
                setTimeout(() => { msg.textContent = ''; }, 3000);
            });
        });
    }

    // 等待表單元素出現後才建立面板
    const timer = setInterval(() => {
        if (document.getElementById('type')) {
            clearInterval(timer);
            createPanel();
        }
    }, 300);
})();
