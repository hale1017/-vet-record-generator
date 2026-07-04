/*
 * © 2026 小屌鯨魚 — 保留所有權利 All Rights Reserved. 未經授權不得重用，見 LICENSE。
 *
 * Profile 定義 — 資料驅動表單。
 * 臨床格式權威來源：使用者真實範本（PaPa=A 預設外科、Didi=B 劉乃潔老師）+ VetVault WF-0002。
 * block 型別：fields（一排小輸入）/ section（大 textarea）/ group（子欄位）/ signature。
 */
window.PROFILES = {
  A: {
    id: 'A',
    label: '預設外科格式',
    desc: '',
    blocks: [
      { type: 'fields', title: '基本資料', fields: [
        { key: 'date', label: 'Date', ph: 'YYYY/MM/DD' },
        { key: 'caseNo', label: 'Case No' },
        { key: 'name', label: 'Name（寵物名，可中文）' },
      ]},
      { type: 'fields', title: 'Signalments', fields: [
        { key: 'age', label: 'Age', ph: '16yo' },
        { key: 'sex', label: 'Sex', ph: 'Mc/Fsp/M/F' },
        { key: 'species', label: 'Species', ph: 'Canine/Feline' },
        { key: 'breed', label: 'Breed' },
      ]},
      { type: 'fields', title: 'Temperament', fields: [
        { key: 'temperament', label: 'Temperament' },
      ]},
      { type: 'fields', title: '生命徵象（Vitals）', fields: [
        { key: 'bw', label: 'BW', ph: 'kg' },
        { key: 'bt', label: 'BT', ph: '°C 或 NE' },
        { key: 'hr', label: 'HR', ph: 'bpm' },
        { key: 'rr', label: 'RR', ph: '/min' },
        { key: 'bp', label: 'BP', ph: 'mmHg' },
      ]},
      { type: 'section', key: 'cc', label: 'Chief complaint (CC)', required: true },
      { type: 'section', key: 'hp', label: 'History of present illness (HP)', required: true, rows: 5 },
      { type: 'section', key: 'ph', label: 'Past history (PH)' },
      { type: 'section', key: 'eh', label: 'Environment history (EH)' },
      { type: 'section', key: 'pe', label: 'Physical examination (PE)', required: true, rows: 4 },
      { type: 'section', key: 'neuro', label: 'Neuro exam' },
      { type: 'section', key: 'be', label: 'Blood exam' },
      { type: 'section', key: 'rad', label: 'Radiography' },
      { type: 'section', key: 'us', label: 'Ultrasound' },
      { type: 'section', key: 'cyto', label: 'Cytology' },
      { type: 'section', key: 'ap', label: 'A/P', required: true, rows: 4 },
      { type: 'section', key: 'med', label: 'Medication' },
      { type: 'signature', title: '簽名', fields: [
        { key: 'intern', label: 'S（實習醫師）' },
      ]},
    ],
  },

  B: {
    id: 'B',
    label: '外科-劉乃潔老師',
    desc: '',
    blocks: [
      { type: 'fields', title: '基本資料', fields: [
        { key: 'date', label: 'Date', ph: 'YYYY/MM/DD' },
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
      { type: 'fields', title: '生命徵象（Vitals）', fields: [
        { key: 'bw', label: 'BW', ph: 'kg' },
        { key: 'bcs', label: 'BCS', ph: '/9' },
        { key: 'bt', label: 'BT', ph: '°C' },
        { key: 'hr', label: 'HR', ph: 'bpm' },
        { key: 'bp', label: 'BP', ph: 'mmHg' },
        { key: 'rr', label: 'RR', ph: 'bpm' },
      ]},
      { type: 'section', key: 'cc', label: 'Chief complaint (CC)', required: true },
      { type: 'group', key: 'hp', label: 'History of present problems (HP)', subfields: [
        { key: 's', label: 'S（stool）', big: true },
        { key: 'a', label: 'A（appetite）', big: true },
        { key: 'u', label: 'U（urine）', big: true },
        { key: 'd', label: 'D（drink）', big: true },
        { key: 'npo', label: 'NPO', big: true },
        { key: 'note', label: '其他病程描述', big: true },
      ]},
      { type: 'section', key: 'curmed', label: 'Current medications' },
      { type: 'section', key: 'ph', label: 'Previous history (PH)' },
      { type: 'section', key: 'eh', label: 'Environmental history (EH)' },
      { type: 'group', key: 'pe', label: 'Physical examination (PE)', subfields: [
        { key: 'presentation', label: 'Presentation (e.g., behaviours)', big: true },
        { key: 'appearance', label: 'Appearance (e.g., coat, nostrils)', big: true },
        { key: 'mmcrt', label: 'Mucus membrane and CRT', big: true },
        { key: 'hydration', label: 'Hydration status', big: true },
        { key: 'thoracic', label: 'Thoracic auscultation', big: true },
        { key: 'laryngeal', label: 'Laryngeal auscultation', big: true },
        { key: 'palpation', label: 'Palpation (body surface, LNs, joints…)', big: true },
        { key: 'others', label: 'Others', big: true },
      ]},
      { type: 'group', key: 'exercise', label: 'Exercise test（airway case 用，非 airway 留空即自動略去）', subfields: [
        { key: 'pre', label: 'Pre-exercise summary' },
        { key: 'post', label: 'Post-exercise summary' },
        { key: 'grade', label: 'Respiratory functional grade' },
      ]},
      { type: 'section', key: 'outpatient', label: 'Outpatient test(s) performed' },
      { type: 'section', key: 'ddx', label: 'DDx' },
      { type: 'section', key: 'ap', label: 'Assessment/plan (A/P)', required: true, rows: 4 },
      { type: 'section', key: 'rx', label: 'Prescriptions (drug name, dose, frequency, form, duration)' },
      { type: 'signature', title: 'Sig.（簽名，可只填自己那格）', fields: [
        { key: 'sig_student', label: 'Student' },
        { key: 'sig_intern', label: 'Intern' },
        { key: 'sig_postgrad', label: 'Post Grad' },
        { key: 'sig_resident', label: 'Resident' },
        { key: 'sig_consultant', label: 'Consultant' },
      ]},
    ],
  },
};

/* 走訪出所有欄位鍵（含 group 子欄位 key 形如 "pe.mmcrt"） */
window.profileKeys = function (profile) {
  const keys = [];
  for (const b of profile.blocks) {
    if (b.type === 'section') keys.push({ key: b.key, label: b.label, required: !!b.required });
    else if (b.type === 'group') for (const s of b.subfields) keys.push({ key: b.key + '.' + s.key, label: b.label + ' › ' + s.label });
    else if (b.fields) for (const f of b.fields) keys.push({ key: f.key, label: f.label });
  }
  return keys;
};
