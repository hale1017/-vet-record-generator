/*
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

  function para(text, opts) {
    opts = opts || {};
    const lines = String(text == null ? '' : text).split('\n');
    const runs = lines.map((ln, i) => new (D().TextRun)({ text: ln, bold: !!opts.bold, break: i > 0 ? 1 : 0 }));
    return new (D().Paragraph)({
      children: runs,
      alignment: opts.center ? D().AlignmentType.CENTER : undefined,
      spacing: { after: opts.after == null ? 60 : opts.after },
    });
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

  /* ---------------- Profile A（無表格） ---------------- */
  function buildA(v) {
    const c = [];
    c.push(para('Date: ' + g(v, 'date') + '    Case No: ' + g(v, 'caseNo') + '    Name: ' + g(v, 'name'), { after: 20 }));
    const sig = [g(v, 'age'), g(v, 'sex'), g(v, 'species'), g(v, 'breed')].filter(Boolean).join(', ');
    c.push(para('Signalments: ' + sig, { after: 20 }));
    c.push(para('Temperament: ' + g(v, 'temperament'), { after: 20 }));
    // Vitals（純文字，無表格）
    const vit = 'BW: ' + valUnit(g(v, 'bw'), 'kg') + '    BT: ' + (g(v, 'bt') || '') +
      '    HR: ' + valUnit(g(v, 'hr'), 'bpm') + '    RR: ' + valUnit(g(v, 'rr'), '/min');
    c.push(para(vit, { after: g(v, 'bp') ? 20 : 100 }));
    if (g(v, 'bp')) c.push(para('BP: ' + g(v, 'bp'), { after: 100 }));

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
    // Vitals 列（BW/BCS/BT/HR/BP/RR）
    c.push(para('BW: ' + valUnit(g(v, 'bw'), 'kg') + '    BCS: ' + valUnit(g(v, 'bcs'), '/9') +
      '    BT: ' + valUnit(g(v, 'bt'), '°C') + '    HR: ' + valUnit(g(v, 'hr'), 'bpm') +
      '    BP: ' + valUnit(g(v, 'bp'), 'mmHg') + '    RR: ' + valUnit(g(v, 'rr'), 'bpm'), { after: 120 }));

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
    c.push(para('Sig. ' + g(v, 'intern'), { after: 0 }));

    const docChildren = [
      para('國立臺灣大學生物資源暨農學院附設動物醫院', { after: 40 }),
      para('病　歷　表', { bold: true, center: true, after: 120 }),
      new (D().Table)({
        width: { size: 100, type: D().WidthType.PERCENTAGE },
        borders: BORDER(),
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
