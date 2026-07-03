/*
 * 主流程：4 步精靈
 *   1 選格式 → 2 上傳照片+去識別化（可略過）→ 3 填欄位 → 4 確認+匯出 .docx
 * MVP：先不接 AI，欄位手動填。日後 vision AI 會在步驟 3 前先預填。
 */
(function () {
  const state = { profileId: null, values: {}, redacted: null };
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

  let current = 1;
  const steps = [1, 2, 3, 4];

  function show(n) {
    current = n;
    steps.forEach((s) => {
      $('#step' + s).classList.toggle('active', s === n);
      $('#dot' + s).classList.toggle('active', s === n);
      $('#dot' + s).classList.toggle('done', s < n);
    });
    if (n === 3) renderForm();
    if (n === 4) renderReview();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---- Step 1: 選格式 ---- */
  function renderProfiles() {
    const wrap = $('#profileCards');
    wrap.innerHTML = '';
    Object.values(window.PROFILES).forEach((p) => {
      const card = el('button', 'card');
      card.type = 'button';
      card.append(el('div', 'card-tag', 'Profile ' + p.id));
      card.append(el('div', 'card-title', p.label));
      card.append(el('div', 'card-desc', p.desc));
      card.onclick = () => { state.profileId = p.id; document.querySelectorAll('.card').forEach((c) => c.classList.remove('sel')); card.classList.add('sel'); $('#toStep2').disabled = false; };
      wrap.append(card);
    });
    // Profile C 佔位（待內科範本）
    const c = el('div', 'card disabled');
    c.append(el('div', 'card-tag', 'Profile C'));
    c.append(el('div', 'card-title', '內科格式（待範本）'));
    c.append(el('div', 'card-desc', '未來輪內科、拿到範本後新增。'));
    wrap.append(c);
  }

  /* ---- Step 2: 去識別化 ---- */
  function initRedaction() {
    window.Redaction.init($('#redactCanvas'));
    $('#photoInput').onchange = async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try { await window.Redaction.loadFile(f); $('#redactHint').textContent = '在照片上按住拖曳，蓋掉飼主姓名/電話/病歷號/晶片號。'; updateRedactUI(); }
      catch (err) { alert('讀取影像失敗：' + err); }
    };
    $('#undoBox').onclick = () => { window.Redaction.undo(); updateRedactUI(); };
    $('#clearBox').onclick = () => { window.Redaction.clearBoxes(); updateRedactUI(); };
    $('#dlRedacted').onclick = () => {
      const url = window.Redaction.toDataURL(); if (!url) return;
      const a = el('a'); a.href = url; a.download = 'redacted.jpg'; a.click();
    };
  }
  function updateRedactUI() {
    const has = window.Redaction.hasImage();
    $('#undoBox').disabled = !has; $('#clearBox').disabled = !has; $('#dlRedacted').disabled = !has;
    $('#aiFill').disabled = !has;
    $('#boxCount').textContent = has ? ('已標記 ' + window.Redaction.boxCount() + ' 個遮蔽區塊') : '';
  }

  /* ---- AI 設定（雙供應商） ---- */
  function refreshProviderUI() {
    const p = $('#providerSelect').value;
    const sel = $('#modelSelect'); sel.innerHTML = '';
    window.AI.models(p).forEach((m) => { const o = el('option'); o.value = m.v; o.textContent = m.t; sel.append(o); });
    sel.value = window.AI.getModel(p);
    $('#apiKeyInput').value = window.AI.getKey(p);
    $('#keyLabel').textContent = (p === 'gemini' ? 'Gemini' : 'OpenAI') + ' API key';
    $('#keyHelp').textContent = p === 'gemini'
      ? '到 aistudio.google.com →「Get API key」免費申請。'
      : '到 platform.openai.com → API keys 申請（需綁付款）。';
    $('#provHint').textContent = p === 'gemini'
      ? '⚠️ 免費版 Google 可能用你送出的資料改善產品（即使已去識別化）；有每日次數上限。'
      : '不會拿 API 資料訓練；用多少付多少（每份病歷約幾美分）。';
  }
  function openSettings() {
    $('#providerSelect').value = window.AI.getProvider();
    refreshProviderUI();
    $('#settingsModal').style.display = 'flex';
  }
  function closeSettings() { $('#settingsModal').style.display = 'none'; }
  function saveSettings() {
    const p = $('#providerSelect').value;
    window.AI.setProvider(p);
    window.AI.setKey(p, $('#apiKeyInput').value);
    window.AI.setModel(p, $('#modelSelect').value);
    closeSettings();
  }

  /* ---- AI 辨識照片 → 預填欄位 ---- */
  async function aiFill() {
    if (!window.AI.hasKey()) { alert('請先在右上「⚙ 設定」填入 OpenAI API key'); openSettings(); return; }
    const img = window.Redaction.toDataURL();
    if (!img) { alert('請先上傳一張照片'); return; }
    const btn = $('#aiFill'), status = $('#aiStatus');
    btn.disabled = true; status.textContent = 'AI 辨識中…（約數秒）';
    try {
      const vals = await window.AI.ocrRecord(img, window.PROFILES[state.profileId]);
      Object.assign(state.values, vals);
      status.textContent = '✓ 已填入 ' + Object.keys(vals).length + ' 個欄位，請到下一步確認';
      show(3);
    } catch (e) {
      status.textContent = '';
      alert('AI 辨識失敗：' + e.message);
    } finally { btn.disabled = false; }
  }

  /* ---- 語音錄音 → Whisper 轉錄 → 填入欄位 ---- */
  let activeRec = null;
  function attachMic(target) {
    const btn = el('button', 'mic', '🎤'); btn.type = 'button'; btn.title = '錄音轉文字（Whisper）';
    btn.onclick = (e) => { e.preventDefault(); toggleMic(btn, target); };
    return btn;
  }
  async function toggleMic(btn, target) {
    if (activeRec) { const a = activeRec; activeRec = null; a.recorder.stop(); return; } // 停止目前錄音
    if (!window.AI.hasKey()) { alert('請先在右上「⚙ 設定」填入 OpenAI API key'); openSettings(); return; }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e) { alert('無法存取麥克風：' + e.message); return; }
    const chunks = [];
    const rec = new MediaRecorder(stream);
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      btn.classList.remove('rec'); btn.textContent = '🎤';
      const blob = new Blob(chunks, { type: 'audio/webm' });
      btn.disabled = true; const prev = target.value;
      try { const txt = await window.AI.transcribe(blob); if (txt) target.value = (prev ? prev + ' ' : '') + txt; }
      catch (e) { alert('轉錄失敗：' + e.message); }
      btn.disabled = false;
    };
    rec.start(); btn.classList.add('rec'); btn.textContent = '⏹';
    activeRec = { btn, recorder: rec };
  }

  /* ---- Step 3: 表單 ---- */
  function inputFor(f, keyPrefix, opts) {
    opts = opts || {};
    const key = keyPrefix ? keyPrefix + '.' + f.key : f.key;
    const box = el('label', 'fld');
    box.append(el('span', 'fld-label', f.label + (f.required ? ' *' : '')));
    const big = f.big;
    const inp = el(big ? 'textarea' : 'input');
    inp.dataset.key = key;
    if (f.ph) inp.placeholder = f.ph;
    if (state.values[key]) inp.value = state.values[key];
    if (big) inp.rows = 2;
    box.append(inp);
    if (opts.mic) box.append(attachMic(inp));
    return box;
  }

  function renderForm() {
    const p = window.PROFILES[state.profileId];
    $('#formTitle').textContent = p.label;
    const root = $('#formFields');
    root.innerHTML = '';
    for (const b of p.blocks) {
      if (b.type === 'fields' || b.type === 'signature') {
        const group = el('div', 'block');
        if (b.title) group.append(el('h3', 'block-h', b.title));
        const row = el('div', 'row');
        b.fields.forEach((f) => row.append(inputFor(f)));
        group.append(row);
        root.append(group);
      } else if (b.type === 'section') {
        const group = el('div', 'block');
        const lab = el('label', 'fld');
        lab.append(el('span', 'fld-label', b.label + (b.required ? ' *' : '')));
        const ta = el('textarea'); ta.dataset.key = b.key; ta.rows = 3; if (b.ph) ta.placeholder = b.ph;
        if (state.values[b.key]) ta.value = state.values[b.key];
        lab.append(ta); lab.append(attachMic(ta)); group.append(lab); root.append(group);
      } else if (b.type === 'group') {
        const group = el('div', 'block');
        group.append(el('h3', 'block-h', b.label));
        const row = el('div', 'row');
        b.subfields.forEach((s) => row.append(inputFor(s, b.key, { mic: true })));
        group.append(row); root.append(group);
      }
    }
  }

  function collect() {
    document.querySelectorAll('#formFields [data-key]').forEach((inp) => { state.values[inp.dataset.key] = inp.value; });
  }

  /* ---- Step 4: 確認 ---- */
  function renderReview() {
    collect();
    const p = window.PROFILES[state.profileId];
    const root = $('#reviewBody');
    root.innerHTML = '';
    const missing = [];
    window.profileKeys(p).forEach((k) => { if (k.required && !(state.values[k.key] || '').trim()) missing.push(k.label); });

    const warn = $('#reviewWarn');
    if (missing.length) { warn.style.display = 'block'; warn.textContent = '尚缺必填：' + missing.join('、') + '（仍可匯出，建議補齊）'; }
    else { warn.style.display = 'none'; }

    for (const b of p.blocks) {
      const keys = b.type === 'section' ? [{ key: b.key, label: b.label }]
        : b.type === 'group' ? b.subfields.map((s) => ({ key: b.key + '.' + s.key, label: s.label }))
        : (b.fields || []).map((f) => ({ key: f.key, label: f.label }));
      keys.forEach((k) => {
        const v = (state.values[k.key] || '').trim();
        if (!v) return;
        const line = el('div', 'rev-line');
        line.append(el('span', 'rev-k', k.label));
        line.append(el('span', 'rev-v', v));
        root.append(line);
      });
    }
    if (!root.children.length) root.append(el('div', 'muted', '（尚未填寫任何欄位）'));
  }

  async function doExport() {
    collect();
    const btn = $('#exportBtn');
    btn.disabled = true; btn.textContent = '產生中…';
    try {
      await window.DocxGen.exportDocx(state.profileId, state.values);
      btn.textContent = '✓ 已下載 .docx';
      setTimeout(() => { btn.textContent = '匯出 .docx'; btn.disabled = false; }, 2500);
    } catch (e) {
      alert('匯出失敗：' + e.message);
      btn.textContent = '匯出 .docx'; btn.disabled = false;
    }
  }

  /* ---- 綁定 ---- */
  function bind() {
    $('#toStep2').onclick = () => show(2);
    $('#back1').onclick = () => show(1);
    $('#skipPhoto').onclick = () => show(3);
    $('#toStep3').onclick = () => { state.redacted = window.Redaction.toDataURL(); show(3); };
    $('#back2').onclick = () => show(2);
    $('#toStep4').onclick = () => { collect(); show(4); };
    $('#back3').onclick = () => show(3);
    $('#exportBtn').onclick = doExport;
    $('#openSettings').onclick = openSettings;
    $('#settingsClose').onclick = closeSettings;
    $('#settingsSave').onclick = saveSettings;
    $('#providerSelect').onchange = refreshProviderUI;
    $('#settingsModal').addEventListener('click', (e) => { if (e.target.id === 'settingsModal') closeSettings(); });
    $('#aiFill').onclick = aiFill;
    if (!window.docx) $('#cdnWarn').style.display = 'block';
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderProfiles();
    initRedaction();
    bind();
    show(1);
  });
})();
