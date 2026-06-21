// ==UserScript==
// @name         知識王作弊仔
// @namespace    wade-quiz-helper
// @version      3.1
// @description  攔截題目 API，先查本地紀錄，沒有才問 OpenAI；攔答案回應把正解存檔，下次同題直接查不用 AI。
// @match        https://www.pressplay.cc/*
// @match        https://og-web.pressplay.cc/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @connect      api.openai.com
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/kobayashi220814/tampermonkey/main/scripts/%E7%9F%A5%E8%AD%98%E7%8E%8B%E4%BD%9C%E5%BC%8A%E4%BB%94.user.js
// @downloadURL  https://raw.githubusercontent.com/kobayashi220814/tampermonkey/main/scripts/%E7%9F%A5%E8%AD%98%E7%8E%8B%E4%BD%9C%E5%BC%8A%E4%BB%94.user.js
// ==/UserScript==

(function () {
  'use strict';

  // ========= 設定區 =========
  // ⚠️ API 金鑰不寫進原始碼（避免推上 GitHub 外洩）。
  // 第一次使用請在 Tampermonkey 腳本選單點「設定 OpenAI API 金鑰」輸入一次，會存在本機。
  const CONFIG = {
    apiKey: GM_getValue('openai_api_key', ''),
    model: 'gpt-4o-mini', // 要更準可改 'gpt-4o'，15 秒都來得及
    // 標記方式：'highlight' = 幫正確選項加外框；'overlay' = 右上角浮框；'both' = 兩個都要
    hintMode: 'both',
    // 自動點擊：true = 判斷完直接幫你點；false = 只提示不點
    autoClick: true,
    // 自動點擊前的隨機延遲（毫秒），每題在這區間內隨機取值，較像真人
    clickDelayMinMs: 2000,
    clickDelayMaxMs: 5000,
    // 自動答幾題後就停止（之後只提示不自動點）
    maxAutoAnswers: 10,
  };
  // ========= 設定區結束 =========

  // 腳本選單：設定／更新 OpenAI 金鑰（存在 Tampermonkey 本機，不進原始碼）
  GM_registerMenuCommand('設定 OpenAI API 金鑰', () => {
    const cur = GM_getValue('openai_api_key', '');
    const next = prompt('輸入 OpenAI API 金鑰（留空清除）：', cur);
    if (next === null) return;
    GM_setValue('openai_api_key', next.trim());
    CONFIG.apiKey = next.trim();
    alert(next.trim() ? '✓ 已儲存金鑰' : '已清除金鑰');
  });

  const STORE_KEY = 'pp_quiz_answer_records';
  // 紀錄格式：{ [pp_quiz_id]: { aid: 正解選項id, q: 題目, a: 正解文字 } }
  let records = JSON.parse(GM_getValue(STORE_KEY, '{}'));
  // log_id -> {pp_quiz_id, options}，用來在答案回應時把正解對回題目
  const byLog = {};

  // ---- 1a. 攔截 fetch ----
  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const res = await origFetch.apply(this, args);
    const url = (args[0] && args[0].url) || args[0] || '';
    try {
      if (url.includes('/quiz/challenge/question')) {
        handleQuestion(await res.clone().json());
      } else if (url.includes('/quiz/challenge/answer')) {
        handleAnswerResult(await res.clone().json());
      }
    } catch (e) {
      console.warn('[quiz-helper] fetch parse error', e);
    }
    return res;
  };

  // ---- 1b. 攔截 XMLHttpRequest（這站用的是 XHR）----
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._quizUrl = url;
    return origOpen.call(this, method, url, ...rest);
  };
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('load', function () {
      try {
        if (!this._quizUrl) return;
        if (this._quizUrl.includes('/quiz/challenge/question')) {
          handleQuestion(JSON.parse(this.responseText));
        } else if (this._quizUrl.includes('/quiz/challenge/answer')) {
          handleAnswerResult(JSON.parse(this.responseText));
        }
      } catch (e) {
        console.warn('[quiz-helper] xhr parse error', e);
      }
    });
    return origSend.apply(this, args);
  };

  // ---- 2. 拿到題目：先查紀錄，沒有才問 AI ----
  async function handleQuestion(json) {
    const data = json && json.data;
    const q = data && data.question;
    if (!q || !q.options) return;

    // 記住這題，等 answer 回來時對應
    if (data.log_id) byLog[data.log_id] = { pp_quiz_id: q.pp_quiz_id, options: q.options };

    // 先查本地紀錄
    const rec = records[q.pp_quiz_id];
    if (rec && q.options.some(o => o.pp_quiz_option_id === rec.aid)) {
      const opt = q.options.find(o => o.pp_quiz_option_id === rec.aid);
      console.log('[quiz-helper] 命中紀錄，跳過 AI');
      showHint('📁 紀錄：' + opt.option_title, opt.pp_quiz_option_id);
      maybeAutoClick(opt.pp_quiz_option_id);
      return;
    }

    // 沒紀錄，問 AI（沒設金鑰就提示）
    if (!CONFIG.apiKey) {
      showHint('⚠ 未設定 OpenAI 金鑰，請在腳本選單設定', null);
      return;
    }
    showHint('🤖 AI 判斷中...', null);
    try {
      const idx = await askOpenAI(q.quiz_title, q.options.map(o => o.option_title));
      const opt = q.options[idx];
      showHint('🤖 建議：' + (opt ? opt.option_title : '(回傳異常)'), opt ? opt.pp_quiz_option_id : null);
      if (opt) maybeAutoClick(opt.pp_quiz_option_id);
    } catch (e) {
      console.error('[quiz-helper] AI error', e);
      showHint('AI 失敗，自己判斷 (´∀`)', null);
    }
  }

  // ---- 3. 答案回應：只存「答錯」的題（命中紀錄的一定答對，所以實際只會存到 AI 判斷錯的）----
  function handleAnswerResult(json) {
    const d = json && json.data;
    if (!d || !d.correct_option_id || !d.log_id) return;
    if (d.is_correct) return; // 答對的不存，省資源
    const ctx = byLog[d.log_id];
    if (!ctx) return;
    const opt = ctx.options.find(o => o.pp_quiz_option_id === d.correct_option_id);
    records[ctx.pp_quiz_id] = {
      aid: d.correct_option_id,
      a: opt ? opt.option_title : '',
    };
    GM_setValue(STORE_KEY, JSON.stringify(records));
    console.log(`[quiz-helper] 答錯，已存正解。目前紀錄 ${Object.keys(records).length} 題`);
  }

  // ---- 呼叫 OpenAI，回傳正確選項 index (0 或 1) ----
  function askOpenAI(question, options) {
    const prompt =
      `這是一題二選一知識題，只能回答正確選項的編號數字（0 或 1），不要任何其他文字。\n\n` +
      `題目：${question}\n` +
      options.map((o, i) => `${i}. ${o}`).join('\n') +
      `\n\n正確答案編號：`;

    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'POST',
        url: 'https://api.openai.com/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + CONFIG.apiKey,
        },
        data: JSON.stringify({
          model: CONFIG.model,
          temperature: 0,
          max_tokens: 5,
          messages: [{ role: 'user', content: prompt }],
        }),
        onload: r => {
          try {
            const j = JSON.parse(r.responseText);
            const out = j.choices[0].message.content;
            const m = out.match(/\d+/);
            const idx = m ? parseInt(m[0], 10) : 0;
            resolve(idx >= 0 && idx < options.length ? idx : 0);
          } catch (err) {
            reject(err);
          }
        },
        onerror: reject,
      });
    });
  }

  // ---- 自動點擊（含上限與隨機延遲）----
  let answeredCount = 0;
  function maybeAutoClick(optionId) {
    if (!CONFIG.autoClick || !optionId) return;
    if (answeredCount >= CONFIG.maxAutoAnswers) {
      console.log('[quiz-helper] 已達自動答題上限', CONFIG.maxAutoAnswers, '題，改為只提示不自動點');
      appendBoxNote(`（已自動答滿 ${CONFIG.maxAutoAnswers} 題，後續請手動點）`);
      return;
    }
    const min = CONFIG.clickDelayMinMs;
    const max = Math.max(min, CONFIG.clickDelayMaxMs);
    const delay = Math.floor(min + Math.random() * (max - min));
    setTimeout(() => {
      const el = document.getElementById(optionId);
      if (!el) {
        console.warn('[quiz-helper] 找不到選項元素，無法自動點', optionId);
        return;
      }
      el.click();
      answeredCount++;
      console.log(`[quiz-helper] 已自動點擊（第 ${answeredCount}/${CONFIG.maxAutoAnswers} 題，延遲 ${delay}ms）`, optionId);
    }, delay);
  }

  function appendBoxNote(note) {
    const box = document.getElementById('quiz-helper-box');
    if (box) box.textContent += '\n' + note;
  }

  // ---- 在畫面上提示 ----
  function showHint(text, optionId) {
    if (CONFIG.hintMode === 'overlay' || CONFIG.hintMode === 'both') {
      let box = document.getElementById('quiz-helper-box');
      if (!box) {
        box = document.createElement('div');
        box.id = 'quiz-helper-box';
        box.style.cssText =
          'position:fixed;top:16px;right:16px;z-index:999999;background:#111;color:#0f0;' +
          'padding:12px 16px;border-radius:8px;font-size:16px;font-weight:bold;white-space:pre-line;' +
          'box-shadow:0 4px 16px rgba(0,0,0,.5);max-width:320px;font-family:sans-serif;';
        document.body.appendChild(box);
      }
      box.textContent = text;
    }

    if (CONFIG.hintMode === 'highlight' || CONFIG.hintMode === 'both') {
      document.querySelectorAll('[data-quiz-marked]').forEach(el => {
        el.style.outline = '';
        el.style.outlineOffset = '';
        el.removeAttribute('data-quiz-marked');
      });
      if (!optionId) return;
      const el = document.getElementById(optionId); // id 即 pp_quiz_option_id
      if (el) {
        el.style.outline = '4px solid #00e676';
        el.style.outlineOffset = '2px';
        el.setAttribute('data-quiz-marked', '1');
      }
    }
  }

  console.log('[quiz-helper] 已載入（OpenAI + 本地紀錄），目前紀錄', Object.keys(records).length, '題');
})();
