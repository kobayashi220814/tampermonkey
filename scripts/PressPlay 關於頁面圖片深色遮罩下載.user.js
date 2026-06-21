// ==UserScript==
// @name         PressPlay 關於頁面圖片深色遮罩下載
// @namespace    http://tampermonkey.net/
// @version      1.5
// @updateURL    https://raw.githubusercontent.com/kobayashi220814/tampermonkey/main/scripts/PressPlay%20%E9%97%9C%E6%96%BC%E9%A0%81%E9%9D%A2%E5%9C%96%E7%89%87%E6%B7%B1%E8%89%B2%E9%81%AE%E7%BD%A9%E4%B8%8B%E8%BC%89.user.js
// @downloadURL  https://raw.githubusercontent.com/kobayashi220814/tampermonkey/main/scripts/PressPlay%20%E9%97%9C%E6%96%BC%E9%A0%81%E9%9D%A2%E5%9C%96%E7%89%87%E6%B7%B1%E8%89%B2%E9%81%AE%E7%BD%A9%E4%B8%8B%E8%BC%89.user.js
// @description  指定區塊圖片加上 rgba(0,0,0,0.6) 遮罩後下載為 JPG，頁面不加遮罩
// @match        https://www.pressplay.cc/*
// @grant        GM_xmlhttpRequest
// @connect      *
// ==/UserScript==

(function () {
  'use strict';

  const SELECTORS = [
    '.about-project-info-image',
    '.about-project-info-video',
  ];

  function getImageUrl(el) {
    const img = el.querySelector('img');
    if (img) return img.src || img.dataset.src || null;
    const bg = window.getComputedStyle(el).backgroundImage;
    const m = bg.match(/url\(["']?(.+?)["']?\)/);
    return m ? m[1] : null;
  }

  function getFilename() {
    const projectId = location.pathname.match(/\/project\/([^/]+)/)?.[1] ?? 'project';
    const rawTitle = document.title.replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 50);
    const base = rawTitle || `pressplay_${projectId}`;
    return `${base}_dark.jpg`;
  }

  function downloadWithOverlay(imageUrl) {
    GM_xmlhttpRequest({
      method: 'GET',
      url: imageUrl,
      responseType: 'blob',
      onload(res) {
        const blobUrl = URL.createObjectURL(res.response);
        const img = new Image();
        img.onload = function () {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          canvas.toBlob(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = getFilename();
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }, 'image/jpeg', 0.95);
          URL.revokeObjectURL(blobUrl);
        };
        img.src = blobUrl;
      },
      onerror() {
        alert('[腳本猴] 圖片抓取失敗，請檢查 @connect 設定');
      }
    });
  }

  function removeBtn() {
    const old = document.getElementById('tm-dl-btn');
    if (old) old.remove();
  }

  function addBtn(imageUrl) {
    if (document.getElementById('tm-dl-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'tm-dl-btn';
    btn.textContent = '⬇ 下載深色圖';
    btn.style.cssText = `
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 99999;
      padding: 10px 20px;
      background: #111;
      color: #fff;
      border: 1px solid #444;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    `;
    btn.addEventListener('click', () => downloadWithOverlay(imageUrl));
    document.body.appendChild(btn);
  }

  function isAboutPage() {
    return /\/project\/[^/]+\/about/.test(location.pathname);
  }

  let timer = null;

  function startPolling() {
    if (timer) clearInterval(timer);
    removeBtn();

    if (!isAboutPage()) return;

    const deadline = Date.now() + 30000;
    timer = setInterval(() => {
      const el = SELECTORS.map(s => document.querySelector(s)).find(Boolean);
      if (el) {
        const url = getImageUrl(el);
        if (url) {
          addBtn(url);
          clearInterval(timer);
          return;
        }
      }
      if (Date.now() > deadline) clearInterval(timer);
    }, 500);
  }

  const _pushState = history.pushState.bind(history);
  history.pushState = function (...args) {
    _pushState(...args);
    setTimeout(startPolling, 100);
  };

  window.addEventListener('popstate', () => setTimeout(startPolling, 100));

  startPolling();
})();