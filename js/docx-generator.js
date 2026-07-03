/*
 * .docx 產生器 — 用瀏覽器端 docx.js（全域 window.docx）。
 * 版面依 VetVault WF-0002 逆向的 Profile A / B。
 * 值物件 values：section 存 values[key]；group 子欄位存 values["key.sub"]。
 */
window.DocxGen = (function () {

  function g(values, k) { return (values[k] == null ? '' : String(values[k])).trim(); }

  function D() { return window.docx; }
  const BORDER = () => {
    const s = { style: D().BorderStyle.SINGLE, size: 4, color: '000000' };
    return { top: s, bottom: s, left: s, right: s, insideHorizontal: s, insideVertical: s };
  };

  // 一段：可粗體、可置中；文字含 \n 會拆成多行（break）
  function para(text, opts) {
    opts = opts || {};
    const lines = String(text == null ? '' : text).split('\n');
    const runs = [];
    lines.forEach((ln, i) => {
      runs.push(new (D().TextRun)({ text: ln, bold: !!opts.bold, break: i > 0 ? 1 : 0 }));
    });
    return new (D().Paragraph)({
      children: runs,
      alignment: opts.center ? D().AlignmentType.CENTER : undefined,
      spacing: { after: opts.after == null ? 60 : opts.after },
    });
  }

  // 標題段 + 內容段（內容空則顯示空行）；回傳 Paragraph 陣列
  function section(label, value) {
    const out = [para(label + ':', { bold: true, after: 20 })];
    const v = (value || '').trim();
    out.push(para(v.length ? v : '', { after: 120 }));
    return out;
  }

  function cell(children, widthPct) {
    return new (D().TableCell)({
      children,
      width: widthPct ? { size: widthPct, type: D().WidthType.PERCENTAGE } : undefined,
    });
  }

  /* ---------------- Profile A ---------------- */
  function buildA(v) {
    const children = [];

    // Header 表0：Date | Case No | Name
    children.push(new (D().Table)({
      width: { size: 100, type: D().WidthType.PERCENTAGE },
      borders: BORDER(),
      rows: [ new (D().TableRow)({ children: [
        cell([para('Date: ' + g(v, 'date'))], 34),
        cell([para('Case No: ' + g(v, 'caseNo'))], 33),
        cell([para('Name: ' + g(v, 'name'))], 33),
      ]})],
    }));

    // Signalments / Temperament 段落
    const sig = [g(v, 'age'), g(v, 'sex'), g(v, 'species'), g(v, 'breed')].filter(Boolean).join(', ');
    children.push(para('Signalments: ' + sig, { after: 20 }));
    children.push(para('Temperament: ' + g(v, 'temperament'), { after: 60 }));

    // Vitals 表1：BW | BT | HR | RR（第二列空）
    const vit = (lab, val, unit) => para(lab + ': ' + (val ? val + (unit ? ' ' + unit : '') : ''));
    children.push(new (D().Table)({
      width: { size: 100, type: D().WidthType.PERCENTAGE },
      borders: BORDER(),
      rows: [
        new (D().TableRow)({ children: [
          cell([vit('BW', g(v, 'bw'), 'kg')], 25),
          cell([vit('BT', g(v, 'bt'), '')], 25),
          cell([vit('HR', g(v, 'hr'), '/bpm')], 25),
          cell([vit('RR', g(v, 'rr'), '/min')], 25),
        ]}),
        new (D().TableRow)({ children: [cell([para('')]), cell([para('')]), cell([para('')]), cell([para('')])] }),
      ],
    }));
    if (g(v, 'bp')) children.push(para('BP: ' + g(v, 'bp')));
    children.push(para('', { after: 60 }));

    // Sections
    const secA = [
      ['Chief complaint (CC)', 'cc'],
      ['History of present illness (HP)', 'hp'],
      ['Past history (PH)', 'ph'],
      ['Environment history (EH)', 'eh'],
      ['Physical examination (PE)', 'pe'],
      ['Blood exam (BE)', 'be'],
      ['Radiography', 'rad'],
      ['A/P', 'ap'],
    ];
    for (const [label, key] of secA) {
      if (['ph', 'eh', 'be', 'rad'].includes(key) && !g(v, key)) continue; // 選填空則略去
      section(label, g(v, key)).forEach((p) => children.push(p));
    }

    // Medication（空 → 制式句）
    const med = g(v, 'med') || 'No medication was prescribed today.';
    section('Medication', med).forEach((p) => children.push(p));

    // 簽名列
    const s = g(v, 'intern'), r = g(v, 'resident');
    children.push(para('S ' + s + '    R1 ' + r, { after: 0 }));

    return new (D().Document)({ sections: [{ properties: {}, children }] });
  }

  /* ---------------- Profile B ---------------- */
  function buildB(v) {
    const inner = []; // 單格表格內的所有段落

    inner.push(para('Date: ' + g(v, 'date'), { after: 20 }));
    inner.push(para('Case No: ' + g(v, 'caseNo'), { after: 20 }));
    inner.push(para('Name: ' + g(v, 'name'), { after: 20 }));
    const sig = [g(v, 'age'), g(v, 'sex'), g(v, 'species'), g(v, 'breed')].filter(Boolean).join(', ');
    inner.push(para('Signalment: ' + sig, { after: 20 }));
    inner.push(para('Temperament: ' + g(v, 'temperament'), { after: 120 }));

    // CC
    section('Chief complaint (CC)', g(v, 'cc')).forEach((p) => inner.push(p));

    // HP：S/A/U/D/NPO 拆多行
    inner.push(para('History of present problems (HP):', { bold: true, after: 20 }));
    const hpLine = (lab, k) => { const val = g(v, 'hp.' + k); if (val) inner.push(para(lab + ': ' + val, { after: 20 })); };
    hpLine('S', 's'); hpLine('A', 'a'); hpLine('U', 'u'); hpLine('D', 'd'); hpLine('NPO', 'npo');
    if (g(v, 'hp.note')) inner.push(para(g(v, 'hp.note'), { after: 120 })); else inner.push(para('', { after: 100 }));

    // Current medications
    if (g(v, 'curmed')) section('Current medications', g(v, 'curmed')).forEach((p) => inner.push(p));
    if (g(v, 'ph')) section('Previous history (PH)', g(v, 'ph')).forEach((p) => inner.push(p));
    if (g(v, 'eh')) section('Environmental history (EH)', g(v, 'eh')).forEach((p) => inner.push(p));

    // PE 結構化子欄位（保留提示語）
    inner.push(para('Physical examination (PE):', { bold: true, after: 20 }));
    const peLine = (lab, k) => inner.push(para(lab + ': ' + g(v, 'pe.' + k), { after: 20 }));
    peLine('Presentation (e.g., behaviours)', 'presentation');
    peLine('Appearance (e.g., coat, nostrils)', 'appearance');
    peLine('Mucus membrane and CRT', 'mmcrt');
    peLine('Hydration status', 'hydration');
    peLine('Thoracic auscultation', 'thoracic');
    peLine('Laryngeal auscultation', 'laryngeal');
    peLine('Palpation (e.g., body surface, LNs, joints, testis, pain…)', 'palpation');
    if (g(v, 'pe.others')) peLine('Others', 'others');

    // Exercise test（有值才放）
    if (g(v, 'exercise.pre') || g(v, 'exercise.post') || g(v, 'exercise.grade')) {
      inner.push(para('Exercise test:', { bold: true, after: 20 }));
      inner.push(para('Pre-exercise summary: ' + g(v, 'exercise.pre'), { after: 20 }));
      inner.push(para('Post-exercise summary: ' + g(v, 'exercise.post'), { after: 20 }));
      inner.push(para('Respiratory functional grade: ' + g(v, 'exercise.grade'), { after: 120 }));
    } else {
      inner.push(para('', { after: 100 }));
    }

    if (g(v, 'outpatient')) section('Outpatient test(s) performed', g(v, 'outpatient')).forEach((p) => inner.push(p));
    if (g(v, 'ddx')) section('DDx', g(v, 'ddx')).forEach((p) => inner.push(p));

    // A/P（結尾補 RV at .）
    let ap = g(v, 'ap');
    if (ap && !/RV\s+at/i.test(ap)) ap = ap + '\nRV at  .';
    section('Assessment/plan (A/P)', ap).forEach((p) => inner.push(p));

    if (g(v, 'rx')) section('Prescriptions (drug name, dose, frequency, form, duration)', g(v, 'rx')).forEach((p) => inner.push(p));

    inner.push(para('Sig. ' + g(v, 'sig'), { after: 0 }));

    // 外層：letterhead + 置中標題 + 單格 1×1 表格
    const children = [
      para('國立臺灣大學生物資源暨農學院附設動物醫院', { after: 40 }),
      para('病　歷　表', { bold: true, center: true, after: 120 }),
      new (D().Table)({
        width: { size: 100, type: D().WidthType.PERCENTAGE },
        borders: BORDER(),
        rows: [ new (D().TableRow)({ children: [cell(inner, 100)] }) ],
      }),
    ];
    return new (D().Document)({ sections: [{ properties: {}, children }] });
  }

  function filename(profileId, v) {
    const name = g(v, 'name') || 'case';
    const date = g(v, 'date') || '';
    const safe = (name + (date ? '_' + date : '')).replace(/[\\/:*?"<>|]/g, '-');
    return '病歷_' + safe + '_Profile' + profileId + '.docx';
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
