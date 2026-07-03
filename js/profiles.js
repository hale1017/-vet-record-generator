/*
 * Profile 定義 — 資料驅動表單。
 * 臨床格式權威來源：VetVault  20_VetSchool/clinical/workflows/WF-0002_medical-record-generator.md
 * 新增科別（如未來內科 Profile C）：在此加一組設定，並在 docx-generator.js 加對應 buildC()。
 *
 * block 型別：
 *   fields    → 一排小輸入（header / signalment / vitals / signature）
 *   section   → 單一大 textarea
 *   group     → 一組子欄位（PE 結構化子欄位、HP 的 S/A/U/D）
 *   signature → 簽名列
 */
window.PROFILES = {
  A: {
    id: 'A',
    label: 'Profile A — 預設外科格式',
    desc: '小表格＋自由段落，有生命徵象列。簽名 S…R1…。（逆向自範本 Juli / Kirin）',
    blocks: [
      { type: 'fields', title: '基本資料', fields: [
        { key: 'date', label: 'Date', ph: 'YYYY.MM.DD' },
        { key: 'caseNo', label: 'Case No' },
        { key: 'name', label: 'Name（寵物名，可中文）' },
      ]},
      { type: 'fields', title: 'Signalments', fields: [
        { key: 'age', label: 'Age', ph: '5y/o' },
        { key: 'sex', label: 'Sex', ph: 'Mc/Fs/M/F' },
        { key: 'species', label: 'Species', ph: 'canine/feline' },
        { key: 'breed', label: 'Breed' },
      ]},
      { type: 'fields', title: 'Temperament', fields: [
        { key: 'temperament', label: 'Temperament', ph: '個性' },
      ]},
      { type: 'fields', title: '生命徵象（Vitals）', fields: [
        { key: 'bw', label: 'BW', ph: 'kg' },
        { key: 'bt', label: 'BT', ph: 'NE 或 °C' },
        { key: 'hr', label: 'HR', ph: '/bpm' },
        { key: 'rr', label: 'RR', ph: '/min' },
        { key: 'bp', label: 'BP（選填）' },
      ]},
      { type: 'section', key: 'cc', label: 'Chief complaint (CC)', required: true },
      { type: 'section', key: 'hp', label: 'History of present illness (HP)', required: true },
      { type: 'section', key: 'ph', label: 'Past history (PH)' },
      { type: 'section', key: 'eh', label: 'Environment history (EH)' },
      { type: 'section', key: 'pe', label: 'Physical examination (PE)', required: true },
      { type: 'section', key: 'be', label: 'Blood exam (BE)' },
      { type: 'section', key: 'rad', label: 'Radiography' },
      { type: 'section', key: 'ap', label: 'A/P', required: true },
      { type: 'section', key: 'med', label: 'Medication',
        ph: '留空 → 自動填 “No medication was prescribed today.”' },
      { type: 'signature', title: '簽名', fields: [
        { key: 'intern', label: 'S（實習醫師）' },
        { key: 'resident', label: 'R1（住院醫師）' },
      ]},
    ],
  },

  B: {
    id: 'B',
    label: 'Profile B — 特殊格式老師（呼吸道/airway 導向）',
    desc: 'letterhead ＋ 單格大表格，無生命徵象。用語與 A 不同：present problems / 獨立 DDx / Prescriptions / Sig.。（逆向自範本 Didi）',
    blocks: [
      { type: 'fields', title: '基本資料', fields: [
        { key: 'date', label: 'Date' },
        { key: 'caseNo', label: 'Case No' },
        { key: 'name', label: 'Name（寵物名，可中文）' },
      ]},
      { type: 'fields', title: 'Signalment', fields: [
        { key: 'age', label: 'Age' },
        { key: 'sex', label: 'Sex' },
        { key: 'species', label: 'Species' },
        { key: 'breed', label: 'Breed' },
      ]},
      { type: 'fields', title: 'Temperament', fields: [
        { key: 'temperament', label: 'Temperament' },
      ]},
      { type: 'section', key: 'cc', label: 'Chief complaint (CC)', required: true },
      { type: 'group', key: 'hp', label: 'History of present problems (HP)', subfields: [
        { key: 's', label: 'S（stool）' },
        { key: 'a', label: 'A（appetite）' },
        { key: 'u', label: 'U（urine）' },
        { key: 'd', label: 'D（drink）' },
        { key: 'npo', label: 'NPO' },
        { key: 'note', label: '其他病程描述', big: true },
      ]},
      { type: 'section', key: 'curmed', label: 'Current medications' },
      { type: 'section', key: 'ph', label: 'Previous history (PH)' },
      { type: 'section', key: 'eh', label: 'Environmental history (EH)' },
      { type: 'group', key: 'pe', label: 'Physical examination (PE)', subfields: [
        { key: 'presentation', label: 'Presentation (e.g., behaviours)' },
        { key: 'appearance', label: 'Appearance (e.g., coat, nostrils)' },
        { key: 'mmcrt', label: 'Mucus membrane and CRT' },
        { key: 'hydration', label: 'Hydration status' },
        { key: 'thoracic', label: 'Thoracic auscultation' },
        { key: 'laryngeal', label: 'Laryngeal auscultation' },
        { key: 'palpation', label: 'Palpation (body surface, LNs, joints…)' },
        { key: 'others', label: 'Others' },
      ]},
      { type: 'group', key: 'exercise', label: 'Exercise test（airway case 用；非 airway 留空即自動略去）', subfields: [
        { key: 'pre', label: 'Pre-exercise summary' },
        { key: 'post', label: 'Post-exercise summary' },
        { key: 'grade', label: 'Respiratory functional grade' },
      ]},
      { type: 'section', key: 'outpatient', label: 'Outpatient test(s) performed' },
      { type: 'section', key: 'ddx', label: 'DDx（獨立鑑別診斷清單）' },
      { type: 'section', key: 'ap', label: 'Assessment/plan (A/P)', required: true,
        ph: '結尾自動補 “RV at .”（回診）' },
      { type: 'section', key: 'rx', label: 'Prescriptions (drug name, dose, frequency, form, duration)' },
      { type: 'signature', title: '簽名', fields: [
        { key: 'sig', label: 'Sig.' },
      ]},
    ],
  },
};

/* 各 block 走訪出所有欄位鍵（含 group 子欄位，key 形如 "pe.mmcrt"） */
window.profileKeys = function (profile) {
  const keys = [];
  for (const b of profile.blocks) {
    if (b.type === 'section') keys.push({ key: b.key, label: b.label, required: !!b.required });
    else if (b.type === 'group') for (const s of b.subfields) keys.push({ key: b.key + '.' + s.key, label: b.label + ' › ' + s.label });
    else if (b.fields) for (const f of b.fields) keys.push({ key: f.key, label: f.label });
  }
  return keys;
};
