// rhisk — ASCCP risk-based management: 2019 guidelines + Enduring Guidelines updates through 2026
// Risk values transcribed from Egemen D et al. J Low Genit Tract Dis 2020;24:132-43 (Tables 1A-5B).
// Rules from Perkins RB et al. J Low Genit Tract Dis 2020;24:102-31 (section letters and figures cited inline),
// Perkins 2024 (updates through 2023), Clarke 2024 (dual stain), Massad 2025 (extended genotyping),
// Wentzensen 2025/2026 (self-collection). Question structure mirrors the ASCCP app's own algorithms.
// Row format: [immediate CIN3+ %, 5-year CIN3+ %, management, special situation?]
// Management codes: 5y, 3y, 1y, colpo, colpo_tx (colposcopy or expedited tx), tx (expedited tx preferred),
// cotest (cytology required), hg (high-grade cytology: footnote rule).

const TABLES = {
  // Screening, 25+, by history of the most recent prior HPV result
  unknown: { name: 'Table 1A', hist: 'No known prior HPV result', rows: {
    'neg|nilm': [0.00, 0.12, '5y'], 'neg|ascus': [0.04, 0.40, '3y'], 'neg|lsil': [1.1, 2.0, '1y'],
    'neg|asch': [3.4, 3.8, 'colpo', 1], 'neg|agc': [1.1, 1.5, 'colpo', 1], 'neg|hsil': [25, 27, 'colpo_tx'],
    'neg|none': [0.01, 0.14, '5y'],
    'pos|nilm': [2.1, 4.8, '1y'], 'pos|ascus': [4.4, 7.3, 'colpo'], 'pos|lsil': [4.3, 6.9, 'colpo'],
    'pos|asch': [26, 33, 'colpo_tx'], 'pos|agc': [26, 35, 'colpo_tx'], 'pos|hsil': [49, 53, 'colpo_tx'],
  }},
  hpvneg: { name: 'Table 1B', hist: 'Prior negative HPV test or cotest', rows: {
    'neg|nilm': [0.00, 0.09, '5y'], 'neg|ascus': [0.01, 0.36, '3y'], 'neg|lsil': [0.44, 0.79, '1y'],
    'neg|asch': [2.8, 3.3, 'colpo', 1], 'neg|agc': [0.78, 0.88, 'colpo', 1], 'neg|hsil': [14, 14, 'colpo'],
    'neg|none': [0.01, 0.10, '5y'],
    'pos|nilm': [0.74, 2.3, '1y'], 'pos|ascus': [2.0, 3.8, '1y'], 'pos|lsil': [2.1, 3.8, '1y'],
    'pos|asch': [14, 18, 'colpo'], 'pos|agc': [14, 21, 'colpo'], 'pos|hsil': [32, 34, 'colpo_tx'],
  }},
  hpvneg_ascus: { name: 'Table 2A', hist: 'Prior HPV-negative ASC-US', rows: {
    'neg|nilm': [0.00, 0.14, '5y'], 'neg|ascus': [0.06, 0.78, '1y'], 'neg|lsil': [2.4, 3.1, '1y'],
    'neg|asch': [5.7, 5.7, 'colpo'], 'neg|agc': [0.00, 0.00, 'colpo', 1], 'neg|hsil': [11, 11, 'colpo'],
    'neg|none': [0.06, 0.27, 'cotest', 1],
    'pos|nilm': [0.96, 2.4, '1y'], 'pos|ascus': [2.1, 6.6, '1y'], 'pos|lsil': [2.6, 2.6, '1y'],
    'pos|asch': [24, 24, 'colpo'], 'pos|agc': [0.00, 0.00, 'colpo', 1], 'pos|hsil': [36, 36, 'colpo_tx'],
  }},
  hpvneg_lsil: { name: 'Table 2B', hist: 'Prior HPV-negative LSIL', rows: {
    'neg|nilm': [0.00, 0.40, '3y'], 'neg|ascus': [0.00, 4.0, '1y'], 'neg|lsil': [0.00, 4.4, '1y'],
    'neg|asch': [0.00, 0.00, 'colpo', 1], 'neg|agc': [0.00, 0.00, 'colpo', 1], 'neg|hsil': [0.00, 0.00, 'colpo', 1],
    'neg|none': [0.00, 1.1, 'cotest', 1],
    'pos|nilm': [0.00, 8.6, '1y'], 'pos|ascus': [5.3, 6.9, 'colpo'], 'pos|lsil': [7.9, 7.9, 'colpo'],
    'pos|asch': [50, 50, 'colpo', 1], 'pos|agc': [0.00, 0.00, 'colpo', 1], 'pos|hsil': [33, 33, 'colpo_tx', 1],
  }},
  hpvpos_nilm: { name: 'Table 2C', hist: 'Prior HPV-positive NILM', rows: {
    'neg|nilm': [0.01, 0.90, '1y'], 'neg|ascus': [0.35, 2.6, '1y'], 'neg|lsil': [2.3, 2.3, '1y'],
    'neg|asch': [null, null, 'colpo', 1], 'neg|agc': [8.3, 8.3, 'colpo'], 'neg|hsil': [44, 44, 'colpo_tx'],
    'neg|none': [0.06, 0.99, '1y'],
    'pos|nilm': [4.1, 7.2, 'colpo'], 'pos|ascus': [5.4, 9.5, 'colpo'], 'pos|lsil': [5.0, 8.5, 'colpo'],
    'pos|asch': [22, 29, 'colpo'], 'pos|agc': [33, 40, 'colpo'], 'pos|hsil': [44, 50, 'colpo_tx'],
  }},
  // Surveillance after colposcopy with <CIN 2 (cytology grouped: low = ASC-US/LSIL, high = ASC-H/AGC/HSIL+)
  post_low: { name: 'Table 4A', hist: 'Colposcopy <CIN 2 after low-grade referral', rows: {
    'neg|nilm': [0.00, 0.42, '3y'], 'neg|low': [0.05, 0.92, '1y'], 'neg|high': [1.6, 4.1, 'colpo', 1],
    'neg|none': [0.01, 0.51, '3y'],
    'pos|nilm': [2.1, 5.2, '1y'], 'pos|low': [3.1, 6.0, '1y'], 'pos|high': [23, 31, 'colpo'],
  }},
  post_high: { name: 'Table 4B', hist: 'Colposcopy <CIN 2 after high-grade referral', rows: {
    'neg|nilm': [0.02, 0.48, '1y', 1], 'neg|low': [0.28, 1.3, '1y'], 'neg|high': [5.6, 14, 'hg'],
    'neg|none': [0.14, 0.80, '1y'],
    'pos|nilm': [5.0, 12, 'colpo'], 'pos|low': [6.6, 17, 'colpo'], 'pos|high': [28, 38, 'hg', 1],
  }},
  // First surveillance visit after treatment of CIN 2/3
  posttx: { name: 'Table 5A', hist: 'Treated CIN 2 or CIN 3', rows: {
    'neg|nilm': [0.03, 1.7, '1y'], 'neg|low': [0.75, 3.8, '1y'], 'neg|high': [18, 18, 'colpo'],
    'neg|none': [0.34, 2.0, '1y'],
    'pos|nilm': [5.8, 12, 'colpo'], 'pos|low': [10, 21, 'colpo'], 'pos|high': [53, 63, 'colpo_tx'],
  }},
};

// Table 5B: treated CIN 2/3, negative test after N prior negatives. [5-yr risk cotest, 5-yr risk HPV-only, mgmt]
const POSTTX_NEGATIVES = { 1: [0.68, 0.91, '1y'], 2: [0.35, 0.44, '3y'] };

// Table 3: colposcopy <CIN 1 / CIN 1, by referral result. [1-year %, 5-year %, special?]
const BIOPSY_LOW = {
  neg:  { nilm: [0.56, 2.7], ascus: [0.49, 3.2], lsil: [0.59, 2.1, 1], asch: [2.4, 4.4, 1], agc: [1.2, 1.6, 1], hsil: [2.9, 4.8, 1] },
  cin1: { nilm: [0.74, 2.8], ascus: [0.53, 2.6], lsil: [0.74, 2.3], asch: [1.4, 5.6, 1], agc: [1.3, 3.8, 1], hsil: [3.9, 6.5, 1] },
};

// Massad 2025 Table 2 (IRIS cohort, Onclarity): [immediate %, 3-year %] by genotype and cytology
const GENO_RISK = {
  '16':  { nilm: [8.4, 11.5], abn: [20.5, 24.1] },
  '18':  { nilm: [4.0, 8.5],  abn: [10.4, 16.0] },
  ext:   { nilm: [1.8, 2.9],  abn: [5.0, 6.4] },
  low3:  { nilm: [0.4, 0.9],  abn: [1.1, 1.8] },
};
// Clarke 2024 (KPNC): dual stain risks [immediate %, 3-year %]
const DS_RISK = {
  primary:     { pos: [9.5, 12.3], neg: [0.75, 1.5], table: 'Table 1: HPV-positive, no genotyping' },
  primary_neg: { pos: [4.9, 7.9],  neg: [0.16, 1.2], table: 'Table 1: HPV-positive after prior HPV-negative' },
  hr12:        { pos: [5.6, 7.6],  neg: [0.53, 1.1], table: 'Table 3: HR12-positive (16/18 negative)' },
  nilm:        { pos: [4.6, 8.6],  neg: [0.60, 1.5], table: 'Table 5: cotest HPV-positive NILM' },
  ascus:       { pos: [6.6, 9.9],  neg: [0.87, 1.6], table: 'Table 5: cotest HPV-positive ASC-US' },
  lsil:        { pos: [4.1, 5.9],  neg: [0.53, 0.92], table: 'Table 5: cotest HPV-positive LSIL' },
};

const LABELS = {
  hpv: { neg: 'HPV-negative', pos: 'HPV-positive', '16': 'HPV 16-positive', '18': 'HPV 18-positive', ext: 'HPV 45/33/58/31/52/35/39/68/51-positive', low3: 'HPV 56/59/66-positive', none: 'no HPV test' },
  cyto: { nilm: 'NILM', ascus: 'ASC-US', lsil: 'LSIL', asch: 'ASC-H', agc: 'AGC', hsil: 'HSIL+', none: 'no cytology' },
  biopsy: { neg: '<CIN 1', cin1: 'CIN 1', cin2: 'CIN 2', cin3: 'CIN 3', hsil_nos: 'histologic HSIL (unspecified)', ais: 'AIS', cancer: 'cancer' },
};

const ACTIONS = {
  '5y': ['routine', 'Return to routine screening in 5 years'],
  '3y': ['surveil', 'Repeat HPV-based testing in 3 years'],
  '1y': ['surveil', 'Repeat HPV-based testing in 1 year'],
  colpo: ['colpo', 'Colposcopy'],
  colpo_tx: ['treat', 'Colposcopy or expedited treatment'],
  tx: ['treat', 'Expedited treatment preferred'],
};

const NOTE = {
  colpo_tx: 'Immediate risk 25–<60%: excisional treatment without prior biopsy and colposcopy with biopsy are both acceptable (nonpregnant, 25+) (E.3).',
  tx: 'Immediate risk ≥60%: excisional treatment without prior biopsy is preferred; colposcopy with biopsy is acceptable (nonpregnant, 25+) (E.3).',
  pregTx: 'Pregnant: treatment without biopsy is unacceptable; manage with colposcopy (K.2).',
  hpvBased: 'Use primary HPV testing or cotesting. Cytology alone only if HPV testing is not feasible — then every 6 months for a 1-year interval, annually for a 3-year interval (J.1).',
  special: 'Special situation: rare result managed by rule rather than by risk threshold.',
  agc: ['Endocervical sampling at colposcopy (not in pregnancy) (G.1).',
        'Endometrial sampling if ≥35, or <35 with risk factors (abnormal bleeding, chronic anovulation, obesity).',
        'Atypical endometrial cells: endometrial + endocervical sampling first; colposcopy acceptable at the same time.',
        'AGC favor neoplasia / AIS cytology without invasive disease on workup: diagnostic excisional procedure.'],
  genotype: 'HPV 16/18 positive: colposcopy recommended even below the 4% threshold because of disproportionate cancer risk (H.2).',
  immunoTables: 'Risk tables were not derived for immunosuppressed patients (K.3) — interpret with caution.',
};

const EGEMEN = 'Egemen 2020';

function need(text) { return { level: 'need', title: text, details: [] }; }

function fromCode(code, details) {
  const [level, title] = ACTIONS[code];
  const d = details || [];
  if (code === 'colpo_tx' || code === 'tx') d.unshift(NOTE[code]);
  if (code === '1y' || code === '3y') d.unshift(NOTE.hpvBased);
  return { level, title, details: d };
}

function applyPregnancy(r, s) {
  if (s.pregnant && r.level === 'treat' && /expedited/i.test(r.title)) {
    r.level = 'colpo'; r.title = 'Colposcopy'; r.details.unshift(NOTE.pregTx);
  }
  return r;
}

function agcResult(s) {
  return { level: 'colpo', title: 'Colposcopy with endocervical sampling',
    details: (s.pregnant ? ['Pregnant: endocervical curettage and endometrial biopsy are unacceptable (K.2).'] : []).concat(NOTE.agc) };
}

function genoRisk(hpv, cyto) {
  const g = GENO_RISK[hpv];
  // IRIS pools ASC-US and worse; only show it for ASC-US/LSIL, never for ASC-H/AGC/HSIL
  if (!g || !['nilm', 'ascus', 'lsil'].includes(cyto)) return null;
  const [imm, three] = cyto === 'nilm' ? g.nilm : g.abn;
  return { imm, five: three, fiveLabel: '3-year', source: `Massad 2025, Table 2 (IRIS): ${cyto === 'nilm' ? 'NILM' : 'ASC-US or worse'} / ${LABELS.hpv[hpv]}` };
}

function dsRisk(key, ds) {
  const t = DS_RISK[key];
  const [imm, three] = t[ds];
  return { imm, five: three, fiveLabel: '3-year', source: `Clarke 2024, ${t.table}, DS-${ds === 'pos' ? 'positive' : 'negative'}` };
}

// ASCCP app structure: prior HPV + prior cytology (+ whether the colposcopy it called for was done) → risk-table history
function screenHistory(s) {
  const hi = ['asch', 'agc', 'hsil'].includes(s.priorCyto);
  const lowNeedingColpo = (s.priorHpv === 'pos' && ['ascus', 'lsil'].includes(s.priorCyto)) || (s.priorHpv === 'none' && s.priorCyto === 'lsil');
  if (hi || lowNeedingColpo) return s.priorColpo === 'no' ? (hi ? 'missed_high' : 'missed_low') : null;
  if (s.priorHpv === 'pos') return 'hpvpos_nilm';
  if (s.priorHpv === 'neg') return { ascus: 'hpvneg_ascus', lsil: 'hpvneg_lsil' }[s.priorCyto] || 'hpvneg';
  return 'unknown'; // prior cytology alone does not modify risk (E.1)
}

function riskOf(row, table, rowLabel) {
  return { imm: row[0], five: row[1], immLabel: 'Immediate', special: !!row[3], source: `${EGEMEN}, ${table.name}: ${table.hist} · ${rowLabel}` };
}

// ---------- Screening, 25+ ----------
// HPV-negative: Egemen 2020 Tables 1A-2C. HPV-positive: Massad 2025 Tables 6/7 (extended genotyping,
// dual stain) which carry forward the 2019 rules; untyped results keep the 2019 table risks.
// Self-collection: Wentzensen 2025/2026. Cytology-only and missed colposcopy: Perkins 2024.
const EG = 'Massad 2025 (extended genotyping)';
const DS_SRC = 'Clarke 2024 (dual stain)';
const SELF_SRC = 'Wentzensen 2025 (self-collection)';
const HIGH_CYTO = ['asch', 'agc', 'hsil'];
const hpvIsPos = h => !['neg', 'none', undefined, ''].includes(h);

function screen25(s) {
  const self = s.collection === 'self';
  if (!s.collection) return need('Who collected the HPV specimen?');
  if (!s.priorHpv || !s.priorCyto) return need('Enter the most recent prior HPV and cytology results (choose "None" if not known).');
  const history = screenHistory(s);
  if (history === null) {
    if (!s.priorColpo) return need('Was the colposcopy recommended for that prior result done?');
    return need('Colposcopy was done after that result — use "Follow-up after colposcopy" instead.');
  }
  if (!s.hpv) return need('Select the current HPV result.');
  if (!self && !s.cyto) return need('Select the current cytology result.');
  if (self && (s.immuno || s.pregnant))
    return need('Self-collection is not a screening option for immunosuppressed or pregnant patients — use a clinician-collected specimen.');
  if (s.immuno) return immuno(s);

  const hpv = s.hpv === 'hr12' ? 'pos' : s.hpv; // untyped and pooled "other" HR are managed alike (Table 6)
  const cyto = self ? 'none' : s.cyto;
  const second = history === 'hpvpos_nilm';
  let r;

  // Colposcopy previously recommended but not completed (Perkins 2024)
  if (history === 'missed_high' || history === 'missed_low') {
    const src = { source: 'Perkins 2024 (updates through 2023): colposcopy recommended but not completed' };
    if (history === 'missed_high') r = { level: 'colpo', title: 'Colposcopy', details: ['The earlier result was high-grade (ASC-H, AGC, HSIL or worse): colposcopy is recommended.'] };
    else if (hpvIsPos(hpv) || ['ascus', 'lsil', ...HIGH_CYTO].includes(cyto))
      r = { level: 'colpo', title: 'Colposcopy', details: ['Second consecutive HPV-positive result and/or persistent ASC-US or worse after a missed colposcopy.'] };
    else if (hpv === 'neg')
      r = { level: 'surveil', title: 'Repeat HPV-based testing in 1 year', details: ['Acceptable when repeat testing instead of the missed colposcopy is HPV-negative or cotest-negative.'] };
    else return need('An HPV result is needed.');
    if (cyto === 'agc') r = agcResult(s);
    r.risk = src;
    return applyPregnancy(r, s);
  }

  // Cytology alone at 25+: 2012 guidelines apply (Perkins 2024)
  if (hpv === 'none') {
    const src = { source: 'Perkins 2024: cytology-only screening at 25+ follows the 2012 guidelines' };
    if (cyto === 'agc') r = agcResult(s);
    else if (['lsil', 'asch', 'hsil'].includes(cyto)) r = { level: 'colpo', title: 'Colposcopy', details: ['Cytology-only screening at 25+: colposcopy for LSIL or worse (2012 guidelines).'] };
    else return need('Risk-based management needs an HPV result. Cytology-only screening at 25+ follows the 2012 guidelines; reflex HPV testing of the specimen allows risk-based management.');
    r.risk = src;
    return r;
  }

  // HPV-negative: 2019 risk tables (self-collected negative screen: 3-year interval)
  if (hpv === 'neg') {
    const table = TABLES[history];
    if (self && (history === 'unknown' || history === 'hpvneg')) {
      r = fromCode('3y', ['Self-collected HPV-negative screen: repeat in 3 years, not 5 (interim recommendation).']);
      r.risk = { source: SELF_SRC + ', Recommendation 2' };
      return r;
    }
    const row = table.rows['neg|' + cyto];
    r = row[2] === 'cotest'
      ? need('Cytology is needed: follow-up of HPV-negative ASC-US or LSIL should use cotesting, not HPV alone.')
      : fromCode(row[2]);
    if (cyto === 'agc') r = agcResult(s);
    if (cyto === 'asch') r.details.push('ASC-H: colposcopy regardless of HPV result (H.2).');
    if (second && cyto === 'nilm') r.details.push('If this is the 2nd consecutive negative cotest after HPV-positive NILM: 3-year follow-up (5-year risk 0.29%).');
    if (self) r.details.push('Surveillance setting: clinician-collected specimens are preferred; manage self-collected results per the 2019 guidelines (' + SELF_SRC + ', Recommendation 6).');
    r.risk = riskOf(row, table, `HPV-negative ${LABELS.cyto[cyto]}`);
    if (r.risk.special) r.details.push(NOTE.special);
    return applyPregnancy(r, s);
  }

  // HPV 16 / 18 — history does not change management (Table 6: past results N/A)
  if (hpv === '16' || hpv === '18') {
    const is16 = hpv === '16';
    let code = 'colpo';
    if (cyto === 'hsil') code = is16 ? 'tx' : 'colpo_tx';
    if (cyto === 'asch' && is16) code = 'colpo_tx';
    r = fromCode(code, [NOTE.genotype]);
    if (cyto === 'agc') r = agcResult(s);
    if (cyto === 'none') r.details.push(self
      ? 'Self-collected: colposcopy, collecting cytology at the colposcopy visit.'
      : 'Reflex cytology from the same specimen is preferred; if not feasible, go straight to colposcopy and collect cytology there (F.2).');
    if (s.ds) r.details.push('Dual stain does not change management for HPV 16/18.');
    r.risk = genoRisk(hpv, cyto) || { source: `${EG}, Table 6${self ? '; ' + SELF_SRC : ''}` };
    // Where the ASCCP app's own output was captured (old rhisk risk.js), use the same published figure
    if (is16 && cyto === 'hsil' && history === 'unknown') r.risk = { imm: 60, five: null, source: 'Demarco 2020 / Perkins 2020 §E.3: HPV 16-positive HSIL' };
    if (is16 && cyto === 'nilm' && history === 'unknown') r.risk = { imm: 5.3, five: null, source: 'Demarco 2020: HPV 16-positive NILM, no prior HPV history' };
    r.details.push('Management per ' + EG + ', Table 6.');
    return applyPregnancy(r, s);
  }

  // Other carcinogenic types: ext = 45, 33/58, 31, 52, 35/39/68, 51; pos = untyped / pooled other; low3 = 56/59/66 only
  const src = { source: `${EG}, Table ${s.ds ? 7 : 6}` + (self ? '; ' + SELF_SRC : '') };
  const untypedRow = cyto !== 'none' && hpv === 'pos' ? TABLES[history].rows['pos|' + cyto] : null;
  const withRisk = res => {
    res.risk = untypedRow ? riskOf(untypedRow, TABLES[history], `HPV-positive ${LABELS.cyto[cyto]}`) : (genoRisk(hpv, cyto) || src);
    res.details.push('Management per ' + src.source + '.');
    return applyPregnancy(res, s);
  };

  if (HIGH_CYTO.includes(cyto)) {
    if (cyto === 'agc') r = agcResult(s);
    else if (hpv === 'pos') r = fromCode('colpo_tx', ['Colposcopy or treatment is acceptable for untyped HPV with ASC-H or HSIL (Table 6, footnote i).']);
    else r = { level: 'colpo', title: 'Colposcopy', details: [] };
    if (s.ds) r.details.push('Dual stain should not guide management with ASC-H, AGC or HSIL cytology (D-III).');
    return withRisk(r);
  }
  if (second) return withRisk({ level: 'colpo', title: 'Colposcopy', details: ['Second consecutive HPV-positive result without colposcopy: colposcopy regardless of triage result.'] });

  if (hpv === 'low3') {
    r = fromCode('1y', ['HPV 56/59/66 only: triage testing does not change management (risk stays below the colposcopy threshold).',
      'If HPV-positive for any type at 1 year: colposcopy.']);
    return withRisk(r);
  }

  // ext or untyped with NILM / ASC-US / LSIL / no cytology, triaged by dual stain
  if (s.ds) {
    const key = cyto !== 'none' ? cyto : s.hpv === 'hr12' ? 'hr12' : history === 'hpvneg' ? 'primary_neg' : 'primary';
    r = s.ds === 'pos'
      ? { level: 'colpo', title: 'Colposcopy', details: ['HPV-positive, dual stain-positive.'] }
      : fromCode('1y', ['HPV-positive, dual stain-negative. At 1 year: colposcopy if HPV-positive for any type or ASC-H/AGC/HSIL; HPV-negative with NILM/ASC-US/LSIL → HPV-based testing in 12 months.']);
    // Clarke 2024 risks are for untyped/HR12 results; extended-genotype DS risks are not transcribed here
    r.risk = hpv === 'ext' && cyto === 'none' ? { source: DS_SRC } : dsRisk(key, s.ds);
    r.details.push('Management per ' + DS_SRC + ' and ' + EG + ', Table 7.');
    return applyPregnancy(r, s);
  }
  if (cyto === 'none') {
    if (self) return Object.assign({ level: 'surveil', title: 'Clinician-collected cytology or dual stain needed', details: [
      'Triage cannot be run on a vaginal specimen — the patient returns for a speculum exam (' + SELF_SRC + ', Recommendation 4).'] }, { risk: src });
    return need('Reflex triage is needed: cytology or dual stain on the HPV-positive specimen.');
  }
  if (hpv === 'ext') {
    r = cyto === 'nilm'
      ? fromCode('1y', ['At 1 year: colposcopy if HPV-positive for any type or ASC-H/AGC/HSIL.'])
      : { level: 'colpo', title: 'Colposcopy', details: ['HPV 45, 33/58, 31, 52, 35/39/68 or 51 with ASC-US or LSIL: colposcopy regardless of history.'] };
    return withRisk(r);
  }
  // untyped / pooled other: 2019 risk tables (Table 6 carries these forward)
  r = fromCode(untypedRow[2]);
  if (untypedRow[3]) r.details.push(NOTE.special);
  return withRisk(r);
}

// ---------- Under 25 (Perkins K.1, Figures 12-13): cytology-based, no risk tables ----------
function screenU25(s) {
  if (!s.visit) return need('Select whether this is a new result or a repeat after a low-grade result.');
  if (!s.cyto || s.cyto === 'none') return need('Select the current cytology result (cytology is used under 25).');
  if (s.cyto === 'ascus' && s.visit === 'initial' && !s.hpv) return need('Was reflex HPV done on the ASC-US?');
  if (s.immuno) return immuno(s);
  const src = { source: 'Perkins 2020 §K.1, Figure 12 (patients younger than 25)' };
  const done = r => Object.assign(r, { risk: src });
  if (s.visit === 'missed') return done({ level: 'colpo', title: 'Colposcopy', details: [
    'A prior ASC-H, AGC or HSIL result was not evaluated with colposcopy (Perkins 2024: colposcopy recommended but not completed).'] });

  if (s.cyto === 'agc') return done(agcResult(s));
  if (s.cyto === 'asch' || s.cyto === 'hsil')
    return done({ level: 'colpo', title: 'Colposcopy', details: ['Under 25: immediate treatment without histologic confirmation is not recommended.'] });

  if (s.visit === 'initial') {
    if (s.cyto === 'nilm') return done({ level: 'routine', title: 'Continue routine age-based screening', details: [] });
    if (s.cyto === 'ascus' && s.hpv === 'neg') return done({ level: 'routine', title: 'Routine screening', details: ['Reflex HPV-negative ASC-US: repeat cytology in 3 years (K.1, Figure 12).'] });
    return done({ level: 'surveil', title: 'Repeat cytology in 1 year', details: [
      'Repeat cytology at 1 and 2 years. Colposcopy for ASC-H, AGC or HSIL at 1 year, or ASC-US or worse at 2 years.'] });
  }
  if (s.visit === 'y1') {
    return done({ level: 'surveil', title: 'Repeat cytology in 1 year', details: [
      'At the 2-year visit: colposcopy for ASC-US or worse; routine screening if negative.'] });
  }
  if (s.cyto === 'nilm') return done({ level: 'routine', title: 'Return to routine screening', details: ['Figure 12: negative ×2 → routine screening.'] });
  return done({ level: 'colpo', title: 'Colposcopy', details: ['ASC-US or worse at the 2-year repeat (K.1, Figure 12).'] });
}

// ---------- Immunosuppressed (Perkins K.3; Perkins 2024 endorses the 2021 HHS OI guidelines) ----------
function immuno(s) {
  const src = { source: 'Perkins 2020 §K.3; Perkins 2024 (2021 HHS opportunistic infection guidelines endorsed)' };
  const hpvPos = !['neg', 'none', undefined].includes(s.hpv);
  let r;
  if (['lsil', 'asch', 'agc', 'hsil'].includes(s.cyto)) {
    r = s.cyto === 'agc' ? agcResult(s) : { level: 'colpo', title: 'Colposcopy', details: ['LSIL or worse: colposcopy regardless of HPV result.'] };
  } else if (s.cyto === 'ascus' && hpvPos) {
    r = { level: 'colpo', title: 'Colposcopy', details: ['HPV-positive ASC-US or worse: colposcopy.'] };
  } else if (s.cyto === 'ascus' && (s.hpv === 'none' || !s.hpv)) {
    r = { level: 'surveil', title: 'Repeat cytology in 6–12 months', details: ['Colposcopy if repeat cytology is ASC-US or worse, or if HPV-positive.'] };
  } else if (s.cyto === 'nilm' && !hpvPos) {
    r = { level: 'routine', title: 'Continue immunosuppression screening schedule', details: [
      'Screening starts at 21. Cytology annually for 3 years, then every 3 years until 30; after 30, cytology or cotesting every 3 years for life.'] };
  } else {
    r = { level: 'need', title: 'Not specifically addressed for immunosuppressed patients', details: [
      'ASCCP K.3 covers ASC-US or worse. Use clinical judgment and the HHS opportunistic infection guidelines.'] };
  }
  r.risk = src;
  return r;
}

// ---------- Colposcopy biopsy result (Perkins §I, Figures 7-11; Perkins 2024 Figures 7-8 revised) ----------
const POSTTX_PLAN = 'After treatment: HPV-based testing at 6, 18 and 30 months; after 3 negatives, every 3 years for at least 25 years and through at least age 65 (Perkins 2024).';
const EXCISE_ONLY = 'Diagnostic excision (not ablation) if the SCJ or upper lesion limit is not seen, ECC is CIN 2+ or ungraded, or CIN 2+ is recurrent (Figure 7).';

function biopsy(s) {
  const u25 = s.age === 'u25';
  if (!s.biopsy) return need('Select the biopsy result.');
  const src = sec => ({ source: 'Perkins 2020 §' + sec });

  if (s.biopsy === 'cancer') return { level: 'refer', title: 'Refer to gynecologic oncology', details: [], risk: src('I') };
  if (s.biopsy === 'ais') {
    if (s.pregnant) return { level: 'refer', title: 'Refer to gynecologic oncology (preferred)', details: [
      'AIS in pregnancy: gynecologic oncologist preferred; a gynecologist skilled in AIS management is acceptable (K.2).'], risk: src('K.2') };
    return { level: 'treat', title: 'Diagnostic excisional procedure', details: [
      'Required to rule out invasive adenocarcinoma, even if hysterectomy is planned. Intact specimen, ≥10 mm length preferred (18–20 mm if no future-pregnancy concerns).',
      'Margins or ECC positive: re-excision to negative margins preferred, even if hysterectomy is planned.',
      'Margins negative: hysterectomy preferred, then HPV-based testing annually ×3, then every 3 years for at least 25 years.',
      'Fertility-sparing management only if future fertility desired: cotest + endocervical sampling every 6 months for 3 years, then annually ×2; hysterectomy after childbearing if any test is abnormal (Figure 11).'], risk: src('I.6, Figure 11') };
  }
  if (['cin2', 'cin3', 'hsil_nos'].includes(s.biopsy) && s.pregnant) {
    return { level: 'colpo', title: 'Surveillance colposcopy every 12–24 weeks', details: [
      'Treatment of CIN 2/3 during pregnancy is not recommended; deferring colposcopy to postpartum is acceptable.',
      'Repeat biopsy if invasion is suspected or the lesion worsens.',
      'Postpartum colposcopy no earlier than 4 weeks after delivery.'], risk: src('K.2') };
  }
  const observe = u25
    ? 'Observation = colposcopy and cytology every 6 months.'
    : 'Observation = colposcopy and HPV-based testing (HPV alone or cotest) every 6 months for up to 2 years.';
  const regress = 'If 2 consecutive evaluations 6 months apart show <CIN 2 histology and <ASC-H cytology (or HPV-negative if HPV alone): ' +
    (u25 ? 'cytology' : 'HPV-based testing') + ' in 1 year, then annually ×3, then every 3 years. Treat if CIN 2 persists 2 years, or CIN 3 / persistent ASC-H, HSIL or AGC develops (Figure 8, revised 2024).';
  if (s.biopsy === 'cin3') return { level: 'treat', title: 'Treatment', details: [
    'Observation is unacceptable at any age (except pregnancy).',
    'Excision preferred; ablation acceptable if criteria are met. Hysterectomy is unacceptable as primary therapy.',
    EXCISE_ONLY, POSTTX_PLAN], risk: src(u25 ? 'K.1' : 'I.2') };
  if (s.biopsy === 'cin2') {
    if (u25) return { level: 'surveil', title: 'Observation preferred (treatment acceptable)', details: [observe, regress, EXCISE_ONLY], risk: src('K.1, Figure 8') };
    if (!s.futurePreg) return need('Do concerns about the effect of treatment on a future pregnancy outweigh concerns about cancer?');
    if (s.futurePreg === 'yes') return { level: 'treat', title: 'Observation or treatment', details: [
      'Either is acceptable, provided the SCJ is fully visualized and ECC is not CIN 2+ or ungraded (I.3).', observe, regress, EXCISE_ONLY], risk: src('I.3, Figure 8 (revised 2024)') };
    return { level: 'treat', title: 'Treatment', details: [
      'Treatment is recommended (I.2). Excision preferred; ablation acceptable if criteria are met.', EXCISE_ONLY,
      POSTTX_PLAN], risk: src('I.2, Figure 7 (revised 2024)') };
  }
  if (s.biopsy === 'hsil_nos') {
    if (u25) return { level: 'treat', title: 'Observation or treatment', details: ['Under 25: either is acceptable.', observe, regress], risk: src('K.1, Figure 8') };
    return { level: 'treat', title: 'Treatment preferred', details: [
      'If CIN 2 vs 3 cannot be specified, manage as CIN 3 (or ask the pathologist to qualify). Observation acceptable if future-pregnancy concerns (I.3).',
      EXCISE_ONLY, POSTTX_PLAN], risk: src('I.1, Figure 8') };
  }

  // <CIN 1 or CIN 1: depends on the referral result
  if (!s.referral) return need('Select the result that led to colposcopy.');
  if (s.referral === 'agc') return { level: 'surveil', title: 'Cotesting at 1 and 2 years', details: [
    'For AGC NOS / AEC NOS without CIN 2+, AIS or cancer. Both negative → cotest 3 years later; any abnormality → colposcopy (Figure 4).',
    'AGC favor neoplasia or AIS cytology: diagnostic excisional procedure instead.'], risk: tbl3(s, 'G.1, Figure 4') };
  if (s.referral === 'hsil') {
    if (u25) return { level: 'surveil', title: 'Colposcopy and cytology at 1 and 2 years', details: [
      'Only if the SCJ and upper lesion limit were fully seen and ECC <CIN 2; otherwise diagnostic excision.',
      'HSIL at 1 year: continue observation (under 25). ASC-H or HSIL at 2 years: diagnostic excision (Figure 9).'], risk: tbl3(s, 'K.1, Figure 9') };
    return { level: 'treat', title: 'Diagnostic excision, or observation', details: [
      'Either is acceptable, or review the cytology, histology and colposcopy findings and manage the revised diagnosis.',
      'Observation = colposcopy and HPV-based testing at 1 year, only if the SCJ and upper lesion limit were fully seen and ECC <CIN 2.',
      'HSIL cytology at 1 year → diagnostic excision. All negative at 1 and 2 years → HPV-based testing in 3 years, then every 3 years for at least 25 years (Figure 9).'], risk: tbl3(s, 'I.4, Figure 9') };
  }
  if (s.referral === 'asch') {
    if (u25) return { level: 'surveil', title: 'Cytology at 1 and 2 years', details: [
      'Colposcopy for ASC-US or worse. ASC-H or HSIL at 2 years → diagnostic excision (Figure 10).'], risk: tbl3(s, 'K.1, Figure 10') };
    return { level: 'surveil', title: 'HPV-based testing at 1 and 2 years', details: [
      'Only if the SCJ and upper lesion limit were fully seen and ECC negative; diagnostic excision is not recommended.',
      'HSIL at 1 or 2 years, or ASC-H at 2 years → diagnostic excision. Negative at 1 and 2 years → HPV-based testing in 3 years (Figure 10).'], risk: tbl3(s, 'I.4, Figure 10') };
  }
  if (u25) return { level: 'surveil', title: 'Repeat cytology in 1 year', details: [
    'NILM/ASC-US/LSIL → repeat cytology in 1 year; ASC-H, AGC or HSIL → colposcopy. Negative at the 2nd repeat → routine screening; ASC-US or worse → colposcopy (Figure 13).'], risk: tbl3(s, 'K.1, Figure 13') };
  const r = fromCode('1y');
  if (s.biopsy === 'cin1') r.details.push('CIN 1 on consecutive visits for ≥2 years: observation preferred, treatment acceptable (I.5).');
  r.risk = tbl3(s);
  return r;
}

function tbl3(s, sec) {
  const row = BIOPSY_LOW[s.biopsy][s.referral];
  const ref = { nilm: 'HPV-positive NILM ×2', ascus: 'HPV-positive ASC-US', lsil: 'HPV-positive LSIL', asch: 'ASC-H', agc: 'AGC', hsil: 'HSIL+' }[s.referral];
  return { imm: row[0], five: row[1], immLabel: '1-year', special: !!row[2],
    source: `${EGEMEN}, Table 3: ${ref} → ${LABELS.biopsy[s.biopsy]}` + (sec ? ` · management per Perkins §${sec}` : '') };
}

function cytoGroup(c) { return { nilm: 'nilm', ascus: 'low', lsil: 'low', asch: 'high', agc: 'high', hsil: 'high', none: 'none' }[c]; }
const GROUP_LABEL = { nilm: 'NILM', low: 'ASC-US/LSIL', high: 'high-grade cytology', none: '(HPV test only)' };
// Massad 2025 Tables 6-7 footnote: after high-grade cytology/histology or treatment, colposcopy for any HPV+ and all LSIL+ even if HPV-negative.
const LSIL_OVERRIDE = 'After high-grade cytology/histology or treatment: colposcopy for any HPV-positive result and for all LSIL or worse, even if HPV-negative (Massad 2025, Tables 6–7 footnote). Egemen Table 5A/4B alone would give 1-year follow-up.';

// ---------- Follow-up after colposcopy (ASCCP "post-colposcopy" algorithm) ----------
function postColpo(s) {
  if (!s.colpoResult) return need('What did the colposcopy show?');
  if (s.colpoResult === 'treated') return need('Treatment was done — use "Follow-up after treatment" instead.');
  if (s.colpoResult === 'untreated') return { level: 'need', title: 'No clinical guidelines available', details: [
    'ASCCP gives no surveillance pathway for untreated CIN 3 or AIS. CIN 3 should be treated (except in pregnancy); AIS needs a diagnostic excisional procedure.'], risk: { source: 'ASCCP app post-colposcopy algorithm; Perkins 2020 §I.2, I.6' } };
  if (s.colpoResult === 'cin2obs') return cin2Obs(s);
  if (!s.referral) return need('Select the result that led to colposcopy.');
  const low = ['nilm', 'ascus', 'lsil'].includes(s.referral);

  if (s.age === 'u25') {
    if (!s.cyto || s.cyto === 'none') return need('Select the current cytology result (cytology is used under 25).');
    const src = { source: low ? 'Perkins 2020 §K.1, Figure 13' : 'Perkins 2020 §K.1, Figures 9–10' };
    if (!low && s.cyto !== 'nilm')
      return { level: 'colpo', title: 'Colposcopy', details: ['After ASC-H/HSIL/AGC with <CIN 2: colposcopy for ASC-US or worse. ASC-H or HSIL persisting at 2 years → diagnostic excision.'], risk: src };
    if (HIGH_CYTO.includes(s.cyto)) return { level: 'colpo', title: 'Colposcopy', details: [], risk: src };
    return { level: 'surveil', title: 'Repeat cytology in 1 year', details: [
      low ? 'NILM/ASC-US/LSIL → repeat in 1 year; negative at the 2nd repeat → routine screening; ASC-US or worse → colposcopy.'
        : 'Continue cytology at 1 and 2 years (plus colposcopy if the original result was HSIL).'], risk: src };
  }
  if (!s.pcvisit) return need('Is this the first or second follow-up test after the colposcopy?');
  if (!s.hpv) return need('Select the current HPV result.');
  if (!s.cyto) return need('Select the current cytology result.');
  if (s.hpv === 'none') return need('HPV-based testing is preferred for surveillance (J.1); risk estimates need an HPV result.');

  const hpv = s.hpv === 'hr12' ? 'pos' : s.hpv;
  const g = cytoGroup(s.cyto);
  const visit2 = s.pcvisit === '2';
  let r;

  // AGC NOS referral without CIN 2+/AIS: cotest at 1 and 2 years (Figure 4)
  if (s.referral === 'agc') {
    if (s.cyto === 'none') return need('Cotesting is recommended after AGC — cytology is needed (Figure 4).');
    if (hpv !== 'neg' || s.cyto !== 'nilm') r = { level: 'colpo', title: 'Colposcopy', details: ['Any abnormality on cotesting after AGC with no CIN 2+, AIS or cancer (Figure 4).'] };
    else r = visit2
      ? { level: 'surveil', title: 'Cotest in 3 years', details: ['Both cotests (1 and 2 years) negative after AGC (Figure 4).'] }
      : { level: 'surveil', title: 'Cotest in 1 year', details: ['Cotesting at 1 and 2 years after AGC; both negative → cotest 3 years later (Figure 4).'] };
    r.risk = { source: 'Perkins 2020 §G.1, Figure 4' };
    return applyPregnancy(r, s);
  }

  // High-grade referral (ASC-H, HSIL) with <CIN 2: Figures 9-10 + Table 4B
  if (!low) {
    const fig = s.referral === 'hsil' ? 'Figure 9' : 'Figure 10';
    if (s.cyto === 'hsil' || (s.referral === 'asch' && s.cyto === 'asch' && visit2)) {
      r = s.pregnant
        ? { level: 'colpo', title: 'Colposcopy', details: ['Pregnant: excision only if cancer is suspected (K.2).'] }
        : { level: 'treat', title: 'Diagnostic excisional procedure', details: [s.cyto === 'hsil' ? `HSIL cytology during observation after ${LABELS.cyto[s.referral]} with <CIN 2 (${fig}).` : `ASC-H persisting at 2 years (${fig}).`] };
    } else if (hpv === 'neg' && (s.cyto === 'nilm' || s.cyto === 'none')) {
      r = visit2
        ? fromCode('3y', [`Negative at 1 and 2 years: HPV-based testing in 3 years, then every 3 years for at least 25 years (${fig}; J.3).`])
        : fromCode('1y', [`Repeat at 2 years${s.referral === 'hsil' ? ' with colposcopy' : ''} (${fig}). Table 4B gives 1-year follow-up here, not 3-year, because confidence is low.`]);
    } else if (hpv === 'neg' && s.cyto === 'lsil') {
      r = { level: 'colpo', title: 'Colposcopy', details: [LSIL_OVERRIDE] };
    } else {
      const row = TABLES.post_high.rows[(hpv === 'neg' ? 'neg' : 'pos') + '|' + (g === 'none' ? 'none' : g)];
      if (!row) return need('Reflex cytology is needed for an HPV-positive result.');
      r = row[2] === 'hg' ? { level: 'colpo', title: 'Colposcopy', details: [] } : fromCode(row[2]);
      if (s.cyto === 'agc') r = agcResult(s);
      r.risk = riskOf(row, TABLES.post_high, `${LABELS.hpv[hpv === 'neg' ? 'neg' : 'pos']} ${GROUP_LABEL[g]}`);
      if (r.risk.special) r.details.push(NOTE.special);
      r.details.push(`Abnormal result during observation → managed per the 2019 guidelines (${fig}).`);
      return applyPregnancy(r, s);
    }
    // Table 4B risks describe the first follow-up visit only
    const row = visit2 ? null : TABLES.post_high.rows[(hpv === 'neg' ? 'neg' : 'pos') + '|' + g];
    r.risk = row ? riskOf(row, TABLES.post_high, `${LABELS.hpv[hpv === 'neg' ? 'neg' : 'pos']} ${GROUP_LABEL[g]}`) : { source: 'Perkins 2020 §I.4' };
    r.risk.source += ` · management per Perkins 2020 §I.4, ${fig}`;
    return applyPregnancy(r, s);
  }

  // Low-grade referral (HPV+ NILM, ASC-US, LSIL) with <CIN 2
  if (hpv === '16' || hpv === '18') {
    r = { level: 'colpo', title: 'Colposcopy', details: [NOTE.genotype, 'HPV 16/18: colposcopy in any setting (Massad 2025 Table 6; Wentzensen 2025 Recommendation 3).'] };
    r.risk = { source: EG + ', Table 6 / Recommendation 6' };
    return applyPregnancy(r, s);
  }
  if (visit2) {
    // Second post-colposcopy test after a minimally abnormal result (Perkins 2024, revised Figure 2 legend)
    if (hpv !== 'neg') r = { level: 'colpo', title: 'Colposcopy', details: ['Second post-colposcopy test HPV-positive (any cytology or dual stain).'] };
    else if (g === 'high') r = { level: 'colpo', title: 'Colposcopy', details: ['HPV-negative with ASC-H or worse.'] };
    else if (g === 'low') r = fromCode('1y', ['HPV-negative ASC-US or LSIL.']);
    else r = fromCode('3y', ['After 3 negative cotests following low-grade results with <CIN 2, return to 5-year screening (J.4).']);
    if (s.cyto === 'agc') r = agcResult(s);
    r.risk = { source: 'Perkins 2024: revised Figure 2 legend (second post-colposcopy test after a minimally abnormal result)' };
    return applyPregnancy(r, s);
  }
  const ext = hpv === 'ext' || hpv === 'low3';
  if (hpv !== 'neg' && !HIGH_CYTO.includes(s.cyto) && s.ds) {
    r = s.ds === 'pos' ? { level: 'colpo', title: 'Colposcopy', details: ['HPV-positive, dual stain-positive.'] }
      : fromCode('1y', ['HPV-positive, dual stain-negative.']);
    r.risk = { source: 'Clarke 2024: dual stain in follow-up after colposcopy is acceptable (B-II), managed as for screening' };
    return applyPregnancy(r, s);
  }
  if (ext) {
    // Extended genotyping is acceptable in follow-up without prior high-grade results (Massad 2025 Rec 6); colposcopy <CIN 2 within 1 year counts as normal history
    if (HIGH_CYTO.includes(s.cyto)) r = s.cyto === 'agc' ? agcResult(s) : { level: 'colpo', title: 'Colposcopy', details: [] };
    else if (hpv === 'low3') r = fromCode('1y', ['HPV 56/59/66 only: triage does not change management.']);
    else if (s.cyto === 'none') return need('Triage is needed: cytology or dual stain.');
    else if (s.cyto === 'nilm') r = fromCode('1y');
    else r = { level: 'colpo', title: 'Colposcopy', details: ['HPV 45, 33/58, 31, 52, 35/39/68 or 51 with ASC-US or LSIL.'] };
    r.details.push('Extended genotyping is acceptable here (Massad 2025 Recommendation 6); untyped HPV-positive results follow Table 4A.');
    r.risk = genoRisk(hpv, s.cyto) || { source: EG + ', Table 6 / Recommendation 6' };
    return applyPregnancy(r, s);
  }
  if (hpv === 'pos' && s.cyto === 'none') return need('Reflex triage is needed for an HPV-positive result: cytology or dual stain.');
  const row = TABLES.post_low.rows[hpv + '|' + g];
  r = fromCode(row[2]);
  if (s.cyto === 'agc') r = agcResult(s);
  if (row[2] === '1y') r.details.push('At the second post-colposcopy test: HPV-positive (any cytology) or ASC-H+ → colposcopy; HPV-negative ASC-US/LSIL → 1 year; HPV-negative → 3 years (Perkins 2024).');
  if (row[2] === '3y') r.details.push('After 3 negative cotests following low-grade results with <CIN 2, return to 5-year screening (J.4).');
  r.risk = riskOf(row, TABLES.post_low, `${LABELS.hpv[hpv]} ${GROUP_LABEL[g]}`);
  if (r.risk.special) r.details.push(NOTE.special);
  return applyPregnancy(r, s);
}

// ---------- CIN 2 under observation (Perkins 2024 revised Figure 8) ----------
function cin2Obs(s) {
  const u25 = s.age === 'u25';
  const src = { source: 'Perkins 2024: revised Figure 8 (observation of CIN 2)' + (u25 ? '; Perkins 2020 §K.1' : '; Perkins 2020 §I.3') };
  if (s.pregnant) return { level: 'colpo', title: 'Surveillance colposcopy every 12–24 weeks', details: [
    'Treatment of CIN 2/3 during pregnancy is not recommended; postpartum colposcopy no earlier than 4 weeks after delivery (K.2).'], risk: { source: 'Perkins 2020 §K.2' } };
  if (!s.obsHisto) return need('What did the colposcopy at this observation visit show?');
  if (s.obsHisto === 'cin3') return { level: 'treat', title: 'Diagnostic excisional procedure', details: ['CIN 3 at any point during observation (Figure 8).', POSTTX_PLAN], risk: src };
  if (!s.obsTest) return need(u25 ? 'Select the cytology result at this visit.' : 'Select the cytology / HPV result at this visit.');
  if (!s.obsYears) return need('How long since CIN 2 was first diagnosed?');
  const negative = s.obsHisto === 'lt2' && s.obsTest === 'neg';
  const persisting = s.obsHisto === 'cin2' || s.obsTest === 'high';
  if (negative) {
    if (!s.obsPrev) return need('Was the previous 6-month evaluation also negative (<CIN 2 and negative test)?');
    if (s.obsPrev === 'yes') return { level: 'surveil', title: (u25 ? 'Cytology' : 'HPV-based testing') + ' in 1 year', details: [
      'Two consecutive negative evaluations 6 months apart.',
      'If negative, ' + (u25 ? 'cytology' : 'HPV-based testing') + ' annually for 3 years total, then every 3 years for at least 25 years (Figure 8).'], risk: src };
    return { level: 'colpo', title: 'Continue observation in 6 months', details: [u25
      ? 'Colposcopy and cytology at 6 months.' : 'Colposcopy and HPV-based testing (HPV alone or cotest) at 6 months.'], risk: src };
  }
  if (persisting && s.obsYears === '2') return { level: 'treat', title: 'Diagnostic excisional procedure', details: [
    'CIN 2 histology or ASC-H, HSIL or AGC cytology persisting for 2 years (Figure 8).', POSTTX_PLAN], risk: src };
  if (s.obsYears === '2') return { level: 'need', title: 'Not specified by Figure 8', details: [
    'Figure 8 covers observation for up to 2 years; this combination (no CIN 2, no high-grade cytology, but not negative) at 2 years is not addressed. Use clinical judgment.'], risk: src };
  return { level: 'colpo', title: 'Continue observation in 6 months', details: [
    (u25 ? 'Colposcopy and cytology' : 'Colposcopy and HPV-based testing') + ' every 6 months, up to 2 years from the first CIN 2 diagnosis.',
    'Excision if CIN 3 develops, or CIN 2 / ASC-H / HSIL / AGC persists for 2 years.'], risk: src };
}

// ---------- Follow-up after treatment (ASCCP "post-treatment" algorithm; Egemen Tables 5A/5B; Perkins 2024 revised Figure 7) ----------
function postTx(s) {
  if (!s.treated) return need('What did the treatment specimen show?');
  if (s.treated === 'ais') return { level: 'surveil', title: 'AIS surveillance', details: [
    'After hysterectomy: HPV-based testing annually for 3 years, then every 3 years for at least 25 years.',
    'Fertility-sparing (negative margins): cotest with endocervical sampling every 6 months for 3 years, then annually for 2 years; if all negative, every 3 years until hysterectomy or for at least 25 years.',
    'Any abnormal test: manage per 2019 guidelines; hysterectomy after childbearing.',
    'Positive margins or ECC: re-excision to negative margins preferred.'], risk: { source: 'Perkins 2020 §I.6, Figure 11' } };
  if (s.treated === 'lt2_low') return { level: 'need', title: 'No published recommendation found', details: [
    'Neither the 2019 guidelines nor the 2023–2026 updates give a post-treatment pathway for excision showing <CIN 2 after low-grade cytology. The ASCCP app answers this from its server; use clinical judgment.'], risk: { source: 'Searched: Perkins 2020, Perkins 2024, Massad 2025, Clarke 2024' } };
  if (s.priorNeg === undefined || s.priorNeg === '') return need('Select which post-treatment test this is.');
  if (!s.hpv) return need('Select the current HPV result.');
  if (!s.cyto) return need('Select the current cytology result.');
  const n = Number(s.priorNeg);
  const hpv = ['16', '18', 'hr12'].includes(s.hpv) ? 'pos' : s.hpv;
  const note = s.treated === 'lt2_high' ? ['Excision for ASC-H/HSIL/AGC cytology with <CIN 2: long-term surveillance as for treated high-grade cytology (J.3). Risks shown are for treated CIN 2/3.'] : [];
  let r;
  if (hpv === 'none') {
    if (['lsil', 'asch', 'agc', 'hsil'].includes(s.cyto))
      return applyPregnancy(Object.assign(s.cyto === 'agc' ? agcResult(s) : { level: 'colpo', title: 'Colposcopy', details: ['Cytology LSIL or worse without HPV testing after treatment.'] },
        { risk: { source: 'Massad 2025, Recommendation 6 (2019 post-treatment guidance)' } }), s);
    return need('HPV-based testing is preferred after treatment (J.2); risk estimates need an HPV result.');
  }
  const negative = hpv === 'neg' && (s.cyto === 'nilm' || s.cyto === 'none');
  if (negative && n === 3) {
    r = fromCode('3y', ['Continue every 3 years for at least 25 years after treatment and through at least age 65; may continue while in good health (Perkins 2024).']);
    r.risk = { source: 'Perkins 2024: revised Figure 7' };
  } else if (negative && n > 0) {
    const [cot, hpvOnly, code] = POSTTX_NEGATIVES[n];
    r = fromCode(code, [n === 1 ? 'Next test at 30 months; a 3rd consecutive negative allows 3-year intervals.' :
      'Third consecutive negative (6, 18, 30 months): 3-year intervals for at least 25 years and through at least age 65 (Perkins 2024).']);
    r.risk = { imm: null, five: s.cyto === 'none' ? hpvOnly : cot, source: `${EGEMEN}, Table 5B: ${n} prior negative ${s.cyto === 'none' ? 'HPV test' : 'cotest'}${n === 1 ? '' : 's'} + current negative` };
  } else if (hpv === 'pos' && s.cyto === 'none') {
    r = { level: 'colpo', title: 'Colposcopy', details: ['Positive HPV-based test after treatment: colposcopy with biopsies (J.2).'], risk: { source: 'Perkins 2020 §J.2' } };
  } else {
    const g = cytoGroup(s.cyto);
    const row = TABLES.posttx.rows[hpv + '|' + g];
    r = hpv === 'neg' && s.cyto === 'lsil' ? { level: 'colpo', title: 'Colposcopy', details: [LSIL_OVERRIDE] } : fromCode(row[2]);
    if (s.cyto === 'agc') r = agcResult(s);
    r.risk = riskOf(row, TABLES.posttx, `${LABELS.hpv[hpv]} ${GROUP_LABEL[g]}`);
    if (n > 0) r.details.push('Risk shown is for the first post-treatment visit (Table 5A); no separate estimates exist for later abnormal results.');
    if (n === 0 && negative) r.details.push('Next test at 18 months, then 30 months; 3 consecutive negatives allow 3-year intervals (Perkins 2024).');
  }
  if (n === 0) r.details.push('The first test is HPV-based, 6 months after treatment, regardless of margins (J.2).');
  if (s.age === 'u25') r.details.push('Under 25: surveillance uses cytology, switching to HPV-based testing at 25 (J.1).');
  r.details.push(...note);
  return applyPregnancy(r, s);
}

function manage(s) {
  let r;
  if (!s.situation) return need('Choose a clinical situation.');
  if (s.ds === 'none') s = Object.assign({}, s, { ds: undefined });
  if (s.situation === 'screen') r = s.age === 'u25' ? screenU25(s) : screen25(s);
  else if (s.situation === 'biopsy') r = biopsy(s);
  else if (s.situation === 'postcolpo') r = postColpo(s);
  else r = postTx(s);
  if (s.immuno && s.situation !== 'screen' && r.level !== 'need') r.details.push(NOTE.immunoTables);
  return r;
}

if (typeof module !== 'undefined') module.exports = { manage, TABLES };
