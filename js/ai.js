/*
 * AI 層（BYO key）— 目前用 OpenAI：一把 key 同時做 vision OCR 與 Whisper 語音轉錄。
 * 刻意抽象成 provider 介面，日後要加 Claude（vision）等只需擴充此檔。
 * 呼叫從使用者瀏覽器直接發出（api.openai.com 支援 CORS）；key 只存在使用者本機 localStorage。
 */
window.AI = (function () {
  const K_KEY = 'vetrec_openai_key';
  const K_MODEL = 'vetrec_model';
  const DEFAULT_MODEL = 'gpt-4o';

  function getKey() { return (localStorage.getItem(K_KEY) || '').trim(); }
  function setKey(v) { localStorage.setItem(K_KEY, (v || '').trim()); }
  function hasKey() { return !!getKey(); }
  function getModel() { return localStorage.getItem(K_MODEL) || DEFAULT_MODEL; }
  function setModel(v) { localStorage.setItem(K_MODEL, v || DEFAULT_MODEL); }

  // 把 profile 欄位攤成「key → 說明」給模型參照
  function fieldSpec(profile) {
    return window.profileKeys(profile)
      .filter((k) => !['intern', 'resident', 'sig'].includes(k.key)) // 簽名不從影像推
      .map((k) => `- "${k.key}": ${k.label}`)
      .join('\n');
  }

  /* Vision OCR + 欄位對應 + 中英翻譯 → 回傳 {key: value} */
  async function ocrRecord(imageDataUrl, profile) {
    if (!hasKey()) throw new Error('尚未設定 API key');
    if (!imageDataUrl) throw new Error('沒有可辨識的影像');

    const keys = window.profileKeys(profile)
      .filter((k) => !['intern', 'resident', 'sig'].includes(k.key)).map((k) => k.key);

    const prompt =
      '你是獸醫病歷謄寫助理。附圖是一張「已去識別化」的手寫獸醫病歷，內容中英夾雜、含臨床縮寫。\n' +
      '請擷取可辨識的資訊，填入下列 JSON 欄位。規則：\n' +
      '1. 內容一律翻成簡潔的英文臨床書寫；但「name」(寵物名) 與任何醫院名稱保留原文（可中文）。\n' +
      '2. 保留標準縮寫（BCS, MM, CRT, S/A/U/D, AUS, PLNs 等），不要展開。\n' +
      '3. 影像沒有的欄位一律給空字串 ""，絕不虛構臨床數據。\n' +
      '4. 只輸出 JSON 物件，鍵必須完全等於下列清單（含點號的鍵照原樣）。\n\n' +
      '欄位：\n' + fieldSpec(profile) +
      '\n\nJSON 鍵清單：' + JSON.stringify(keys);

    const body = {
      model: getModel(),
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ],
      }],
      response_format: { type: 'json_object' },
      temperature: 0,
    };

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getKey() },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await errMsg(res));
    const data = await res.json();
    let obj = {};
    try { obj = JSON.parse(data.choices[0].message.content); } catch (e) { throw new Error('AI 回傳非 JSON'); }

    // 只留 profile 認得的鍵、非空值
    const out = {};
    for (const k of keys) if (obj[k] != null && String(obj[k]).trim()) out[k] = String(obj[k]).trim();
    return out;
  }

  /* Whisper 語音轉文字 → 回傳 text */
  async function transcribe(audioBlob) {
    if (!hasKey()) throw new Error('尚未設定 API key');
    const fd = new FormData();
    fd.append('file', audioBlob, 'audio.webm');
    fd.append('model', 'whisper-1');
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + getKey() },
      body: fd,
    });
    if (!res.ok) throw new Error(await errMsg(res));
    const data = await res.json();
    return (data.text || '').trim();
  }

  async function errMsg(res) {
    let m = 'HTTP ' + res.status;
    try { const j = await res.json(); if (j.error && j.error.message) m = j.error.message; } catch (e) {}
    if (res.status === 401) m = 'API key 無效或未授權（請確認 key 正確）。';
    return m;
  }

  return { getKey, setKey, hasKey, getModel, setModel, ocrRecord, transcribe };
})();
