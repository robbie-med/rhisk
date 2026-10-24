// rhisk — 2019 ASCCP risk-based management
// Risk values transcribed from Egemen D et al. J Low Genit Tract Dis 2020;24:132-43 (Tables 1A-5B).
// Rules from Perkins RB et al. J Low Genit Tract Dis 2020;24:102-31 (section letters cited inline).
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

const LABELS = {
  hpv: { neg: 'HPV-negative', pos: 'HPV-positive', '16': 'HPV 16-positive', '18': 'HPV 18-positive', none: 'no HPV test' },
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

function riskOf(row, table, rowLabel) {
  return { imm: row[0], five: row[1], immLabel: 'Immediate', special: !!row[3], source: `${EGEMEN}, ${table.name}: ${table.hist} · ${rowLabel}` };
}

// ---------- Screening, 25+ ----------
function screen25(s) {
  if (!s.history) return need('Select the most recent prior HPV result.');
  if (!s.hpv) return need('Select the current HPV result.');
  if (!s.cyto) return need('Select the current cytology result.');
  if (s.immuno) return immuno(s);

  const typed = s.hpv === '16' || s.hpv === '18';
  if (s.hpv === 'none') {
    if (s.cyto === 'agc') return agcResult(s);
    if (s.cyto === 'asch') return { level: 'colpo', title: 'Colposcopy', details: ['ASC-H: colposcopy regardless of HPV result (H.2).'] };
    if (s.cyto === 'hsil') return applyPregnancy(fromCode('colpo_tx', ['HSIL carries ≥25% immediate CIN 3+ risk whether HPV-positive or negative (E.3).']), s);
    return need('An HPV result is needed for risk-based management. For ASC-US, reflex HPV testing is preferred.');
  }
  if (s.cyto === 'none' && s.hpv === 'pos') return need('Reflex cytology is needed for HPV-positive primary screening results (F.2).');

  const table = TABLES[s.history];
  const hpvKey = s.hpv === 'neg' ? 'neg' : 'pos';
  if (s.cyto === 'none' && typed) {
    return { level: 'colpo', title: 'Colposcopy', details: [
      'Reflex cytology from the same specimen is preferred; if not feasible, go straight to colposcopy and collect cytology there (F.2).',
      NOTE.genotype] };
  }
  const row = table.rows[hpvKey + '|' + s.cyto];
  const rowLabel = `${LABELS.hpv[hpvKey]} ${LABELS.cyto[s.cyto]}`;
  let r;
  let risk = riskOf(row, table, rowLabel);

  if (row[2] === 'cotest') {
    r = need('Cytology is needed: follow-up of HPV-negative ASC-US or LSIL should use cotesting, not HPV alone.');
  } else if (typed) {
    let code = row[2];
    const notes = [];
    if (s.hpv === '16' && s.cyto === 'hsil' && s.history === 'unknown') {
      code = 'tx';
      risk = { imm: 60, five: null, immLabel: 'Immediate', source: 'Demarco 2020: HPV 16-positive HSIL+, no prior HPV history' };
    } else if (['5y', '3y', '1y'].includes(code)) {
      code = 'colpo';
      notes.push(NOTE.genotype);
      if (s.history === 'unknown' && s.cyto === 'nilm') {
        risk = s.hpv === '16'
          ? { imm: 5.3, five: null, immLabel: 'Immediate', source: 'Demarco 2020: HPV 16-positive NILM, no prior HPV history' }
          : { imm: 3.0, five: null, immLabel: 'Immediate', source: 'Perkins 2020 §H.2: HPV 18-positive NILM' };
      }
    }
    r = fromCode(code, notes);
  } else {
    r = fromCode(row[2]);
  }

  if (s.cyto === 'agc') r = agcResult(s);
  if (s.cyto === 'asch' && r.level !== 'treat') r.details.push('ASC-H: colposcopy regardless of HPV result (H.2).');
  if (s.history === 'hpvpos_nilm' && hpvKey === 'neg' && s.cyto === 'nilm')
    r.details.push('If this is the 2nd consecutive negative cotest after HPV-positive NILM: 3-year follow-up (5-year risk 0.29%).');
  if (risk.special) r.details.push(NOTE.special);
  r.risk = risk;
  return applyPregnancy(r, s);
}

// ---------- Under 25 (Perkins K.1): cytology-based, no risk tables ----------
function screenU25(s) {
  if (!s.visit) return need('Select whether this is a new result or a repeat after a low-grade result.');
  if (!s.cyto || s.cyto === 'none') return need('Select the current cytology result (cytology is used under 25).');
  if (s.cyto === 'ascus' && s.visit === 'initial' && !s.hpv) return need('Was reflex HPV done on the ASC-US?');
  if (s.immuno) return immuno(s);
  const src = { source: 'Perkins 2020 §K.1 (patients younger than 25)' };
  const done = r => Object.assign(r, { risk: src });

  if (s.cyto === 'agc') return done(agcResult(s));
  if (s.cyto === 'asch' || s.cyto === 'hsil')
    return done({ level: 'colpo', title: 'Colposcopy', details: ['Under 25: immediate treatment without histologic confirmation is not recommended.'] });

  if (s.visit === 'initial') {
    if (s.cyto === 'nilm') return done({ level: 'routine', title: 'Continue routine age-based screening', details: [] });
    if (s.cyto === 'ascus' && s.hpv === 'neg') return done({ level: 'surveil', title: 'Repeat cytology in 3 years', details: [] });
    return done({ level: 'surveil', title: 'Repeat cytology in 1 year', details: [
      'Repeat cytology at 1 and 2 years after the initial result. Colposcopy for ASC-H or higher at any point, or low-grade cytology persisting at 2 years.'] });
  }
  if (s.visit === 'y1') {
    return done({ level: 'surveil', title: 'Repeat cytology in 1 year', details: [
      'At the 2-year visit: colposcopy for ASC-US or higher; return to routine screening after 2 consecutive negative results.'] });
  }
  // 2-year repeat
  if (s.cyto === 'nilm') return done({ level: 'routine', title: 'Return to routine age-based screening', details: [
    'Applies after 2 consecutive negative cytology results. If the 1-year result was abnormal, this is the first negative — repeat cytology in 1 year.'] });
  return done({ level: 'colpo', title: 'Colposcopy', details: ['Low-grade cytology persisting at the 2-year follow-up (K.1).'] });
}

// ---------- Immunosuppressed (Perkins K.3): rule-based ----------
function immuno(s) {
  const src = { source: 'Perkins 2020 §K.3 (immunosuppressed, including HIV)' };
  const hpvPos = ['pos', '16', '18'].includes(s.hpv);
  let r;
  if (['lsil', 'asch', 'agc', 'hsil'].includes(s.cyto)) {
    r = s.cyto === 'agc' ? agcResult(s) : { level: 'colpo', title: 'Colposcopy', details: ['LSIL or worse: colposcopy regardless of HPV result.'] };
  } else if (s.cyto === 'ascus' && hpvPos) {
    r = { level: 'colpo', title: 'Colposcopy', details: ['HPV-positive ASC-US or higher: colposcopy.'] };
  } else if (s.cyto === 'ascus' && (s.hpv === 'none' || !s.hpv)) {
    r = { level: 'surveil', title: 'Repeat cytology in 6–12 months', details: ['Colposcopy if repeat cytology is ASC-US or higher, or if HPV-positive.'] };
  } else if (s.cyto === 'nilm' && !hpvPos) {
    r = { level: 'routine', title: 'Continue immunosuppression screening schedule', details: [
      'Annual cytology for 3 years, then every 3 years until 30; after 30, cytology or cotesting every 3 years for life.'] };
  } else {
    r = { level: 'need', title: 'Not specifically addressed for immunosuppressed patients', details: [
      'ASCCP K.3 covers ASC-US or worse. Use clinical judgment and the HIV screening guidelines.'] };
  }
  r.risk = src;
  return r;
}

// ---------- Colposcopy biopsy result ----------
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
      'Then hysterectomy is preferred (simple if margins negative; re-excise if positive).',
      'Fertility-sparing management acceptable with negative margins: cotest + endocervical sampling every 6 months for ≥3 years, then annually for ≥2 years.'], risk: src('I.6') };
  }
  if (['cin2', 'cin3', 'hsil_nos'].includes(s.biopsy) && s.pregnant) {
    return { level: 'colpo', title: 'Surveillance colposcopy every 12–24 weeks', details: [
      'Treatment of CIN 2/3 during pregnancy is not recommended; deferring colposcopy to postpartum is acceptable.',
      'Repeat biopsy if invasion is suspected or the lesion worsens.',
      'Postpartum colposcopy no earlier than 4 weeks after delivery.'], risk: src('K.2') };
  }
  if (s.biopsy === 'cin3') return { level: 'treat', title: 'Treatment', details: [
    'Observation is unacceptable at any age (except pregnancy).',
    'Excision preferred; ablation acceptable if criteria are met (SCJ and lesion fully visible, no canal involvement, ECC not CIN 2+). Hysterectomy is unacceptable as primary therapy.'], risk: src(u25 ? 'K.1' : 'I.2') };
  if (s.biopsy === 'cin2') {
    if (u25) return { level: 'surveil', title: 'Observation preferred (treatment acceptable)', details: [
      'Colposcopy and cytology every 6 months. If cytology <ASC-H and histology <CIN 2 at 6 and 12 months, next evaluation 1 year later.',
      'Treat if CIN 2 persists for 2 years. Excision if SCJ or lesion not fully visualized.'], risk: src('K.1') };
    return { level: 'treat', title: 'Treatment', details: [
      'Excision preferred; ablation acceptable if criteria are met.',
      'If concerns about future pregnancy outweigh concerns about cancer: observation acceptable (colposcopy + HPV-based testing every 6 months for up to 2 years), provided SCJ is visible and ECC is not CIN 2+ (I.3).'], risk: src('I.2') };
  }
  if (s.biopsy === 'hsil_nos') {
    if (u25) return { level: 'treat', title: 'Observation or treatment', details: [
      'Under 25: either is acceptable. Observation = colposcopy and cytology every 6 months; treat if persistent for 2 years.'], risk: src('K.1') };
    return { level: 'treat', title: 'Treatment preferred', details: [
      'If CIN 2 vs 3 cannot be specified, manage as CIN 3 (or ask the pathologist to qualify). Observation acceptable if future-pregnancy concerns (I.3).'], risk: src('I.1') };
  }

  // <CIN 1 or CIN 1: depends on the referral result
  if (!s.referral) return need('Select the result that led to colposcopy.');
  if (s.referral === 'agc') return { level: 'surveil', title: 'Cotesting at 1 and 2 years', details: [
    'For AGC NOS without CIN 2+, AIS or cancer on workup. If both negative, cotest again in 3 years; colposcopy if any test is abnormal.',
    'AGC favor neoplasia or AIS cytology: diagnostic excisional procedure instead (G.1).'], risk: tbl3(s) };
  if (s.referral === 'hsil') {
    if (u25) return { level: 'surveil', title: 'Colposcopy and cytology at 1 and 2 years', details: [
      'Excision not recommended if SCJ and lesion fully visualized and ECC <CIN 2. Excision if HSIL/ASC-H persists for 2 years (not in pregnancy).'], risk: tbl3(s, 'K.1') };
    return { level: 'treat', title: 'Diagnostic excision, or observation', details: [
      'Either is acceptable. Observation = HPV-based testing and colposcopy at 1 year, only if SCJ and upper lesion limit were fully seen and ECC <CIN 2.',
      'Reviewing the cytology, histology and colposcopy findings is acceptable.',
      'Excision if HSIL cytology recurs at the 1- or 2-year visit (I.4).'], risk: tbl3(s) };
  }
  if (s.referral === 'asch') {
    if (u25) return { level: 'surveil', title: 'Cytology at 1 and 2 years', details: [
      'Colposcopy if ASC-US or higher on repeat testing. Excision if ASC-H persists for 2 years.'], risk: tbl3(s, 'K.1') };
    return { level: 'surveil', title: 'HPV-based testing in 1 year', details: [
      'If SCJ and upper lesion limit fully seen and ECC negative. Diagnostic excision is not recommended.',
      'If negative at 1 and 2 years, retest in 3 years. Excision if ASC-H persists at 2 years (I.4).'], risk: tbl3(s) };
  }
  if (u25) return { level: 'surveil', title: 'Repeat cytology in 1 year', details: [
    'Repeat cytology for ASC-US/LSIL; colposcopy for ASC-H or higher (K.1).'], risk: tbl3(s, 'K.1') };
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

// ---------- Surveillance after colposcopy <CIN 2 ----------
function postColpo(s) {
  if (!s.grade) return need('Select the result that led to colposcopy.');
  if (s.age === 'u25') {
    if (!s.cyto || s.cyto === 'none') return need('Select the current cytology result (cytology is used under 25).');
    const high = ['asch', 'agc', 'hsil'].includes(s.cyto);
    const src = { source: 'Perkins 2020 §K.1' };
    if (s.grade === 'high' && s.cyto !== 'nilm')
      return { level: 'colpo', title: 'Colposcopy', details: ['After ASC-H/HSIL with <CIN 2: colposcopy for ASC-US or higher on repeat cytology.'], risk: src };
    if (high) return { level: 'colpo', title: 'Colposcopy', details: [], risk: src };
    return { level: 'surveil', title: 'Repeat cytology in 1 year', details: [
      s.grade === 'high' ? 'Continue cytology at 1 and 2 years (plus colposcopy if the original result was HSIL).' : 'Repeat cytology for ASC-US/LSIL; colposcopy for ASC-H or higher.'], risk: src };
  }
  if (!s.hpv) return need('Select the current HPV result.');
  if (!s.cyto) return need('Select the current cytology result.');
  if (s.hpv === 'none') return need('HPV-based testing is preferred for surveillance (J.1); risk estimates need an HPV result.');
  if (s.hpv === 'pos' && s.cyto === 'none') return need('Reflex cytology is needed for an HPV-positive result.');

  const table = TABLES[s.grade === 'low' ? 'post_low' : 'post_high'];
  const g = cytoGroup(s.cyto);
  const row = table.rows[s.hpv + '|' + g];
  const rowLabel = `${LABELS.hpv[s.hpv]} ${{ nilm: 'NILM', low: 'ASC-US/LSIL', high: 'high-grade cytology', none: '(HPV test only)' }[g]}`;
  let r;
  if (row[2] === 'hg') {
    r = s.cyto === 'hsil'
      ? { level: 'treat', title: 'Diagnostic excisional procedure', details: ['HSIL cytology after a high-grade referral with <CIN 2: excision recommended (I.4; Table 4B footnote).'] }
      : { level: 'colpo', title: 'Colposcopy', details: [] };
    if (s.pregnant && s.cyto === 'hsil') { r = { level: 'colpo', title: 'Colposcopy', details: ['Pregnant: excision only if cancer is suspected (K.2).'] }; }
  } else {
    r = fromCode(row[2]);
  }
  if (s.cyto === 'agc') r = agcResult(s);
  if (s.grade === 'high' && row[2] === '1y') r.details.push('If the original result was HSIL, colposcopy is also recommended at the 1- and 2-year visits (I.4).');
  if (s.grade === 'low' && row[2] === '3y') r.details.push('After 3 negative cotests following low-grade results with <CIN 2, return to 5-year screening (J.4).');
  r.risk = riskOf(row, table, rowLabel);
  if (r.risk.special) r.details.push(NOTE.special);
  return applyPregnancy(r, s);
}

// ---------- Surveillance after treatment of CIN 2/3 ----------
function postTx(s) {
  if (s.priorNeg === undefined || s.priorNeg === '') return need('Select how many negative tests since treatment.');
  if (!s.hpv) return need('Select the current HPV result.');
  if (!s.cyto) return need('Select the current cytology result.');
  if (s.hpv === 'none') return need('HPV-based testing is preferred after treatment (J.2); risk estimates need an HPV result.');
  const n = Number(s.priorNeg);
  const negative = s.hpv === 'neg' && (s.cyto === 'nilm' || s.cyto === 'none');
  let r;
  if (n > 0 && negative) {
    const [cot, hpvOnly, code] = POSTTX_NEGATIVES[n];
    r = fromCode(code);
    r.risk = { imm: null, five: s.cyto === 'none' ? hpvOnly : cot, source: `${EGEMEN}, Table 5B: treated CIN 2/3 · ${n === 1 ? '1 prior' : '2 prior'} negative ${s.cyto === 'none' ? 'HPV test' : 'cotest'}${n === 1 ? '' : 's'} + current negative` };
    if (n === 2) r.details.push('Continue every 3 years for at least 25 years after treatment, even past 65 (J.3).');
  } else if (s.hpv === 'pos' && s.cyto === 'none') {
    r = { level: 'colpo', title: 'Colposcopy', details: ['Positive HPV-based test after treatment: colposcopy with biopsies (J.2).'], risk: { source: 'Perkins 2020 §J.2' } };
  } else {
    const table = TABLES.posttx;
    const g = cytoGroup(s.cyto);
    const row = table.rows[s.hpv + '|' + g];
    r = fromCode(row[2]);
    if (s.cyto === 'agc') r = agcResult(s);
    r.risk = riskOf(row, table, `${LABELS.hpv[s.hpv]} ${{ nilm: 'NILM', low: 'ASC-US/LSIL', high: 'high-grade cytology', none: '(HPV test only)' }[g]}`);
    if (n > 0) r.details.push('Risk shown is for the first post-treatment visit (Table 5A); no separate estimates exist for later abnormal results.');
    if (n === 0 && negative) r.details.push('Annual HPV-based testing until 3 consecutive negatives, then every 3 years for at least 25 years (J.3).');
  }
  if (n === 0) r.details.push('The first test should be HPV-based, 6 months after treatment, regardless of margins (J.2).');
  if (s.age === 'u25') r.details.push('Under 25: surveillance uses cytology, switching to HPV-based testing at 25 (J.1).');
  return applyPregnancy(r, s);
}

function manage(s) {
  let r;
  if (!s.situation) return need('Choose a clinical situation.');
  if (s.situation === 'screen') r = s.age === 'u25' ? screenU25(s) : screen25(s);
  else if (s.situation === 'biopsy') r = biopsy(s);
  else if (s.situation === 'postcolpo') r = postColpo(s);
  else r = postTx(s);
  if (s.immuno && s.situation !== 'screen' && r.level !== 'need') r.details.push(NOTE.immunoTables);
  return r;
}

if (typeof module !== 'undefined') module.exports = { manage, TABLES };
