/*
 * AI 層（BYO key）— 支援兩家供應商，使用者自選：
 *   - openai：GPT-4o vision + Whisper 轉錄（付費，不拿 API 資料訓練，無嚴格每日上限）
 *   - gemini：Gemini flash vision + 音訊轉錄（有免費額度；免費版資料可能被 Google 使用、有每日上限）
 * 一把 key 兩用（辨識＋語音）。呼叫從瀏覽器直接發出；key 只存本機 localStorage，兩家分開存。
 */
window.AI = (function () {
  const LS = {
    provider: 'vetrec_provider',
    openaiKey: 'vetrec_openai_key', geminiKey: 'vetrec_gemini_key',
    openaiModel: 'vetrec_openai_model', geminiModel: 'vetrec_gemini_model',
  };
  const DEF = { provider: 'openai', openaiModel: 'gpt-4o', geminiModel: 'gemini-2.0-flash' };
  const MODELS = {
    openai: [{ v: 'gpt-4o', t: 'gpt-4o（較準）' }, { v: 'gpt-4o-mini', t: 'gpt-4o-mini（較便宜）' }],
    gemini: [{ v: 'gemini-2.0-flash', t: 'gemini-2.0-flash（免費額度）' }, { v: 'gemini-1.5-flash', t: 'gemini-1.5-flash（免費額度）' }],
  };

  function getProvider() { return localStorage.getItem(LS.provider) || DEF.provider; }
  function setProvider(p) { localStorage.setItem(LS.provider, p === 'gemini' ? 'gemini' : 'openai'); }
  function keyLS(p) { return p === 'gemini' ? LS.geminiKey : LS.openaiKey; }
  function modelLS(p) { return p === 'gemini' ? LS.geminiModel : LS.openaiModel; }
  function getKey(p) { p = p || getProvider(); return (localStorage.getItem(keyLS(p)) || '').trim(); }
  function setKey(p, v) { localStorage.setItem(keyLS(p), (v || '').trim()); }
  function hasKey() { return !!getKey(); }
  function getModel(p) { p = p || getProvider(); return localStorage.getItem(modelLS(p)) || (p === 'gemini' ? DEF.geminiModel : DEF.openaiModel); }
  function setModel(p, v) { localStorage.setItem(modelLS(p), v || getModel(p)); }
  function models(p) { return MODELS[p === 'gemini' ? 'gemini' : 'openai']; }

  /* ---- 共用：組 OCR prompt + 欄位鍵 ---- */
  function ocrKeys(profile) {
    return window.profileKeys(profile)
      .filter((k) => !['intern', 'resident', 'sig'].includes(k.key)).map((k) => k.key);
  }
  function ocrPrompt(profile) {
    const spec = window.profileKeys(profile)
      .filter((k) => !['intern', 'resident', 'sig'].includes(k.key))
      .map((k) => `- "${k.key}": ${k.label}`).join('\n');
    return '你是獸醫病歷謄寫助理。附圖是一張「已去識別化」的手寫獸醫病歷，內容中英夾雜、含臨床縮寫。\n' +
      '請擷取可辨識的資訊，填入下列 JSON 欄位。規則：\n' +
      '1. 內容一律翻成簡潔的英文臨床書寫；但「name」(寵物名) 與任何醫院名稱保留原文（可中文）。\n' +
      '2. 保留標準縮寫（BCS, MM, CRT, S/A/U/D, AUS, PLNs 等），不要展開。\n' +
      '3. 影像沒有的欄位一律給空字串 ""，絕不虛構臨床數據。\n' +
      '4. 只輸出 JSON 物件，鍵必須完全等於下列清單（含點號的鍵照原樣）。\n\n' +
      '欄位：\n' + spec + '\n\nJSON 鍵清單：' + JSON.stringify(ocrKeys(profile));
  }
  function pickKeys(obj, keys) {
    const out = {};
    for (const k of keys) if (obj[k] != null && String(obj[k]).trim()) out[k] = String(obj[k]).trim();
    return out;
  }

  /* ---- 對外：OCR ---- */
  async function ocrRecord(imageDataUrl, profile) {
    const p = getProvider();
    if (!getKey(p)) throw new Error('尚未設定 ' + p + ' API key');
    if (!imageDataUrl) throw new Error('沒有可辨識的影像');
    const prompt = ocrPrompt(profile);
    const raw = p === 'gemini' ? await geminiOcr(prompt, imageDataUrl) : await openaiOcr(prompt, imageDataUrl);
    let obj = {};
    try { obj = JSON.parse(stripFence(raw)); } catch (e) { throw new Error('AI 回傳非 JSON'); }
    return pickKeys(obj, ocrKeys(profile));
  }

  /* ---- 對外：轉錄 ---- */
  async function transcribe(audioBlob) {
    const p = getProvider();
    if (!getKey(p)) throw new Error('尚未設定 ' + p + ' API key');
    return p === 'gemini' ? geminiTranscribe(audioBlob) : openaiTranscribe(audioBlob);
  }

  /* ================= OpenAI ================= */
  async function openaiOcr(prompt, imageDataUrl) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getKey('openai') },
      body: JSON.stringify({
        model: getModel('openai'),
        messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: imageDataUrl } }] }],
        response_format: { type: 'json_object' }, temperature: 0,
      }),
    });
    if (!res.ok) throw new Error(await errMsg(res, 'openai'));
    const d = await res.json();
    return d.choices[0].message.content;
  }
  async function openaiTranscribe(blob) {
    const fd = new FormData();
    fd.append('file', blob, 'audio.webm'); fd.append('model', 'whisper-1');
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST', headers: { Authorization: 'Bearer ' + getKey('openai') }, body: fd,
    });
    if (!res.ok) throw new Error(await errMsg(res, 'openai'));
    return ((await res.json()).text || '').trim();
  }

  /* ================= Gemini ================= */
  function gUrl(model) {
    return 'https://generativelanguage.googleapis.com/v1beta/models/' + model +
      ':generateContent?key=' + encodeURIComponent(getKey('gemini'));
  }
  async function geminiOcr(prompt, imageDataUrl) {
    const b64 = imageDataUrl.split(',')[1];
    const res = await fetch(gUrl(getModel('gemini')), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: b64 } }] }],
        generationConfig: { temperature: 0, response_mime_type: 'application/json' },
      }),
    });
    if (!res.ok) throw new Error(await errMsg(res, 'gemini'));
    const d = await res.json();
    return (((d.candidates || [])[0] || {}).content || {}).parts?.[0]?.text || '';
  }
  async function geminiTranscribe(blob) {
    const b64 = await blobToB64(blob);
    const res = await fetch(gUrl(getModel('gemini')), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: '請逐字轉錄這段語音，只輸出轉錄文字本身，不要加任何說明。' },
          { inline_data: { mime_type: blob.type || 'audio/webm', data: b64 } },
        ] }],
      }),
    });
    if (!res.ok) throw new Error(await errMsg(res, 'gemini'));
    const d = await res.json();
    return ((((d.candidates || [])[0] || {}).content || {}).parts?.[0]?.text || '').trim();
  }

  /* ---- utils ---- */
  function stripFence(s) { return String(s || '').replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim(); }
  function blobToB64(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(String(r.result).split(',')[1]);
      r.onerror = reject; r.readAsDataURL(blob);
    });
  }
  async function errMsg(res, prov) {
    let m = 'HTTP ' + res.status;
    try { const j = await res.json(); if (j.error && j.error.message) m = j.error.message; } catch (e) {}
    if (res.status === 401 || res.status === 403) m = (prov || '') + ' API key 無效或未授權：' + m;
    if (res.status === 429) m = '額度或速率上限（免費版每日有上限）：' + m;
    return m;
  }

  return { getProvider, setProvider, getKey, setKey, hasKey, getModel, setModel, models, ocrRecord, transcribe };
})();
