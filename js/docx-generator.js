/*
 * © 2026 小屌鯨魚 — 保留所有權利 All Rights Reserved. 未經授權不得重用，見 LICENSE。
 *
 * .docx 產生器 — 瀏覽器端 docx.js（全域 window.docx）。
 * A 預設外科：純段落（無表格）。B 劉乃潔老師：letterhead + 病歷表標題 + 單格大表格。
 * 值物件 values：section 存 values[key]；group 子欄位存 values["key.sub"]。
 * 內容語言由 AI（OCR/語音）決定；產生器不改語言。
 */
window.DocxGen = (function () {
  function g(values, k) { return (values[k] == null ? '' : String(values[k])).trim(); }
  function D() { return window.docx; }
  const BORDER = () => {
    const s = { style: D().BorderStyle.SINGLE, size: 4, color: '000000' };
    return { top: s, bottom: s, left: s, right: s, insideHorizontal: s, insideVertical: s };
  };
  const BORDER_WHITE = () => {
    const s = { style: D().BorderStyle.SINGLE, size: 4, color: 'FFFFFF' };
    return { top: s, bottom: s, left: s, right: s, insideHorizontal: s, insideVertical: s };
  };

  function para(text, opts) {
    opts = opts || {};
    const lines = String(text == null ? '' : text).split('\n');
    const runs = lines.map((ln, i) => {
      const o = { text: ln };
      if (opts.bold) o.bold = true;   // 非粗體就完全不帶 w:b（與正式範本一致）
      if (i > 0) o.break = 1;
      return new (D().TextRun)(o);
    });
    return new (D().Paragraph)({
      children: runs,
      alignment: opts.center ? D().AlignmentType.CENTER : undefined,
      spacing: { after: opts.after == null ? 60 : opts.after },
    });
  }
  // 表格儲存格（含寬度%）
  function tcell(text, bold, w) {
    return new (D().TableCell)({ children: [para(text, { bold: bold, after: 0 })], width: { size: w, type: D().WidthType.PERCENTAGE } });
  }
  // 標題(粗體) + 內容；always=true 即使空也保留標題
  function section(label, value, out, always) {
    const v = (value || '').trim();
    if (!always && !v) return;
    out.push(para(label + ':', { bold: true, after: 20 }));
    out.push(para(v, { after: 120 }));
  }
  function cell(children, widthPct) {
    return new (D().TableCell)({ children, width: widthPct ? { size: widthPct, type: D().WidthType.PERCENTAGE } : undefined });
  }

  /* ---------------- Profile A（表格＋白色框線） ---------------- */
  function buildA(v) {
    const c = [];
    // Header 表：Date | Case No | Name（白線）
    c.push(new (D().Table)({
      width: { size: 100, type: D().WidthType.PERCENTAGE }, borders: BORDER_WHITE(),
      rows: [ new (D().TableRow)({ children: [
        cell([para('Date: ' + g(v, 'date'))], 34),
        cell([para('Case No: ' + g(v, 'caseNo'))], 33),
        cell([para('Name: ' + g(v, 'name'))], 33),
      ]})],
    }));
    const sig = [g(v, 'age'), g(v, 'sex'), g(v, 'species'), g(v, 'breed')].filter(Boolean).join(', ');
    c.push(para('Signalments: ' + sig, { after: 20 }));
    c.push(para('Temperament: ' + g(v, 'temperament'), { after: 20 }));
    // Vitals 表（白線）：BW|BT|HR|RR，BP 獨立一列跨欄
    c.push(new (D().Table)({
      width: { size: 100, type: D().WidthType.PERCENTAGE }, borders: BORDER_WHITE(),
      rows: [
        new (D().TableRow)({ children: [
          cell([para('BW: ' + valUnit(g(v, 'bw'), 'kg'))], 25),
          cell([para('BT: ' + (g(v, 'bt') || ''))], 25),
          cell([para('HR: ' + valUnit(g(v, 'hr'), 'bpm'))], 25),
          cell([para('RR: ' + valUnit(g(v, 'rr'), '/min'))], 25),
        ]}),
        new (D().TableRow)({ children: [
          new (D().TableCell)({ children: [para('BP: ' + g(v, 'bp'))], columnSpan: 4 }),
        ]}),
      ],
    }));
    c.push(para('', { after: 60 }));

    section('Chief complaint (CC)', g(v, 'cc'), c, true);
    section('History of present illness (HP)', g(v, 'hp'), c, true);
    section('Past history (PH)', g(v, 'ph'), c);
    section('Environment history (EH)', g(v, 'eh'), c);
    section('Physical examination (PE)', g(v, 'pe'), c, true);
    section('Neuro exam', g(v, 'neuro'), c);
    section('Blood exam', g(v, 'be'), c);
    section('Radiography', g(v, 'rad'), c);
    section('Ultrasound', g(v, 'us'), c);
    section('Cytology', g(v, 'cyto'), c);
    section('A/P', g(v, 'ap'), c, true);
    section('Medication', g(v, 'med'), c);

    c.push(para('S ' + g(v, 'intern'), { after: 0 }));
    return new (D().Document)({ sections: [{ properties: {}, children: c }] });
  }

  /* ---------------- Profile B（單格大表格） ---------------- */
  function buildB(v) {
    const c = []; // 單格內段落
    c.push(para('Date: ' + g(v, 'date'), { after: 20 }));
    c.push(para('Case No: ' + g(v, 'caseNo'), { after: 20 }));
    c.push(para('Name: ' + g(v, 'name'), { after: 20 }));
    const sg = [g(v, 'age'), g(v, 'sex'), g(v, 'species'), g(v, 'breed')].filter(Boolean).join(', ');
    c.push(para('Signalment: ' + sg, { after: 20 }));
    c.push(para('Temperament: ' + g(v, 'temperament'), { after: 20 }));
    // Vitals 表（6 欄：標題列 + 數值列，白色框線，與正式範本一致）
    c.push(new (D().Table)({
      width: { size: 100, type: D().WidthType.PERCENTAGE }, borders: BORDER_WHITE(),
      rows: [
        new (D().TableRow)({ children: [
          tcell('BW (kg)', true, 16), tcell('BCS (/9)', true, 16), tcell('BT (°C)', true, 17),
          tcell('HR (bpm)', true, 17), tcell('BP (mmHg)', true, 17), tcell('RR (bpm)', true, 17),
        ]}),
        new (D().TableRow)({ children: [
          tcell(g(v, 'bw'), false, 16), tcell(g(v, 'bcs'), false, 16), tcell(g(v, 'bt'), false, 17),
          tcell(g(v, 'hr'), false, 17), tcell(g(v, 'bp'), false, 17), tcell(g(v, 'rr'), false, 17),
        ]}),
      ],
    }));
    c.push(para('', { after: 80 }));

    section('Chief complaint (CC)', g(v, 'cc'), c, true);

    // HP：S/A/U/D/NPO 拆行 + note
    c.push(para('History of present problems (HP):', { bold: true, after: 20 }));
    const hp = (lab, k) => { const val = g(v, 'hp.' + k); if (val) c.push(para(lab + ': ' + val, { after: 20 })); };
    hp('S', 's'); hp('A', 'a'); hp('U', 'u'); hp('D', 'd'); hp('NPO', 'npo');
    c.push(para(g(v, 'hp.note'), { after: 120 }));

    section('Current medications', g(v, 'curmed'), c, true);
    section('Previous history (PH)', g(v, 'ph'), c, true);
    section('Environmental history (EH)', g(v, 'eh'), c, true);

    // PE 結構化子欄位（保留提示語）
    c.push(para('Physical examination (PE):', { bold: true, after: 20 }));
    const pe = (lab, k) => c.push(para(lab + ': ' + g(v, 'pe.' + k), { after: 20 }));
    pe('Presentation (e.g., behaviours)', 'presentation');
    pe('Appearance (e.g., coat, nostrils)', 'appearance');
    pe('Mucus membrane and CRT', 'mmcrt');
    pe('Hydration status', 'hydration');
    pe('Thoracic auscultation', 'thoracic');
    pe('Laryngeal auscultation', 'laryngeal');
    pe('Palpation (e.g., body surface, LNs, joints, testis, pain…)', 'palpation');
    pe('Others', 'others');

    if (g(v, 'exercise.pre') || g(v, 'exercise.post') || g(v, 'exercise.grade')) {
      c.push(para('Exercise test:', { bold: true, after: 20 }));
      c.push(para('Pre-exercise summary: ' + g(v, 'exercise.pre'), { after: 20 }));
      c.push(para('Post-exercise summary: ' + g(v, 'exercise.post'), { after: 20 }));
      c.push(para('Respiratory functional grade: ' + g(v, 'exercise.grade'), { after: 120 }));
    }

    section('Outpatient test(s) performed', g(v, 'outpatient'), c, true);
    section('DDx', g(v, 'ddx'), c, true);

    let ap = g(v, 'ap');
    if (ap && !/RV\s+at/i.test(ap)) ap = ap + '\nRV at  .';
    else if (!ap) ap = 'RV at  .';
    section('Assessment/plan (A/P)', ap, c, true);

    section('Prescriptions (drug name, dose, frequency, form, duration)', g(v, 'rx'), c, true);
    // Sig. + 5 欄簽名表（Student/Intern/Post Grad/Resident/Consultant，可見黑框，與正式範本一致）
    c.push(para('Sig.', { bold: true, after: 20 }));
    c.push(new (D().Table)({
      width: { size: 100, type: D().WidthType.PERCENTAGE }, borders: BORDER(),
      rows: [
        new (D().TableRow)({ children: [
          tcell('Student', true, 20), tcell('Intern', true, 20), tcell('Post Grad', true, 20),
          tcell('Resident', true, 20), tcell('Consultant', true, 20),
        ]}),
        new (D().TableRow)({ children: [
          tcell(g(v, 'sig_student'), false, 20), tcell(g(v, 'sig_intern'), false, 20), tcell(g(v, 'sig_postgrad'), false, 20),
          tcell(g(v, 'sig_resident'), false, 20), tcell(g(v, 'sig_consultant'), false, 20),
        ]}),
      ],
    }));

    const docChildren = [
      para('國立臺灣大學生物資源暨農學院附設動物醫院', { after: 40 }),
      para('病　歷　表', { bold: true, center: true, after: 120 }),
      new (D().Table)({
        width: { size: 100, type: D().WidthType.PERCENTAGE },
        borders: BORDER_WHITE(),
        rows: [ new (D().TableRow)({ children: [cell(c, 100)] }) ],
      }),
    ];
    return new (D().Document)({ sections: [{ properties: {}, children: docChildren }] });
  }

  function valUnit(val, unit) { return val ? (val + (unit ? ' ' + unit : '')) : ''; }

  function filename(profileId, v) {
    const name = g(v, 'name') || 'case';
    const date = g(v, 'date') || '';
    const safe = (name + (date ? '_' + date : '')).replace(/[\\/:*?"<>|]/g, '-');
    return '病歷_' + safe + '_' + (profileId === 'A' ? '外科' : '劉乃潔') + '.docx';
  }

  async function exportDocx(profileId, values) {
    if (!window.docx) throw new Error('docx 函式庫未載入（需要網路載入 CDN）。');
    const doc = profileId === 'A' ? buildA(values) : buildB(values);
    const blob = await window.docx.Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename(profileId, values);
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  return { exportDocx };
})();
