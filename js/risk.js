// papcalc — risk calculator from real ASCCP API data
// Captured 2026-07-16 from api.asccp.org/v2/ via batch API calls
// Risk estimates from: Egemen D et al. J Low Genit Tract Dis 2020;24:132-43
// Management thresholds from: Perkins RB et al. J Low Genit Tract Dis 2020;24:102-31
const RiskCalculator = (function() {

  const THRESHOLDS = {
    TREATMENT: 60,
    EXPEDITED_TX: 25,
    COLPOSCOPY: 4,
    SHORT_SURVEILLANCE: 0.55,
    MEDIUM_SURVEILLANCE: 0.15,
  };

  // === HPV PRIMARY SCREENING RISK TABLE ===
  // Immediate CIN3+ risk (%) from real ASCCP API
  // Format: risk[hpvResult][cytologyResult]
  // Note: prior history doesn't change risk for genotype 16/18 in the API data
  // Risk table from real ASCCP API (2026-07-16)
  // Format: risk[hpvResult][cytologyResult]
  // null = no specific risk % returned by API (management is genotype/cytology-directed)
  // 'range_X_Y' = risk range returned by API
  const RISK_TABLE = {
    'HPV 16+': {
      'Normal':  5.3,
      'ASC-US':  'range_9_23',
      'LSIL':    'range_9_23',
      'ASC-H':   28,
      'HSIL':    60,
      'AGC':     null,
    },
    'HPV 18+': {
      'Normal':  4.5,
      'ASC-US':  5.6,
      'LSIL':    5.6,
      'ASC-H':   15,
      'HSIL':    30,
      'AGC':     null,
    },
    'HPV+ (other)': {
      'Normal':  null,
      'ASC-US':  null,
      'LSIL':    null,
      'ASC-H':   null,
      'HSIL':    null,
      'AGC':     null,
    },
    'HPV-': {
      'Normal':  0.13,          // 0.12-0.14% (5-year follow up)
      'ASC-US':  0.40,          // 3-year follow up
      'LSIL':    2.0,           // 1-year follow up
      'ASC-H':   'special',     // Special Situation → Colposcopy
      'HSIL':    25,            // Colposcopy/Treatment
      'AGC':     null,          // Refer to Algorithm
    },
  };

  const RECOMMENDATIONS = {
    'HPV 16+': {
      'Normal':  { text: 'Colposcopy', style: 'colposcopy', ref: '2019' },
      'ASC-US':  { text: 'Colposcopy', style: 'colposcopy', ref: '2019' },
      'LSIL':    { text: 'Colposcopy', style: 'colposcopy', ref: '2019' },
      'ASC-H':   { text: 'Colposcopy/Treatment', style: 'colposcopy', ref: '2019' },
      'HSIL':    { text: 'Treatment', style: 'treatment', ref: '2019' },
      'AGC':     { text: 'Refer to Algorithm', style: '', ref: '' },
    },
    'HPV 18+': {
      'Normal':  { text: 'Colposcopy', style: 'colposcopy', ref: '2019' },
      'ASC-US':  { text: 'Colposcopy', style: 'colposcopy', ref: '2019' },
      'LSIL':    { text: 'Colposcopy', style: 'colposcopy', ref: '2019' },
      'ASC-H':   { text: 'Colposcopy', style: 'colposcopy', ref: '2019' },
      'HSIL':    { text: 'Colposcopy/Treatment', style: 'colposcopy', ref: '2019' },
      'AGC':     { text: 'Refer to Algorithm', style: '', ref: '' },
    },
    'HPV+ (other)': {
      'Normal':  { text: 'Colposcopy', style: 'colposcopy', ref: 'Extended' },
      'ASC-US':  { text: 'Colposcopy', style: 'colposcopy', ref: 'Extended' },
      'LSIL':    { text: 'Colposcopy', style: 'colposcopy', ref: 'Extended' },
      'ASC-H':   { text: 'Colposcopy', style: 'colposcopy', ref: 'Extended' },
      'HSIL':    { text: 'Colposcopy', style: 'colposcopy', ref: 'Extended' },
      'AGC':     { text: 'Refer to Algorithm', style: '', ref: '' },
    },
    'HPV-': {
      'Normal':  { text: '5 year follow up', style: 'screening', ref: '2019' },
      'ASC-US':  { text: '3 year follow up', style: 'surveillance', ref: 'Egemen' },
      'LSIL':    { text: '1 year follow up', style: 'surveillance', ref: '2019' },
      'ASC-H':   { text: 'Colposcopy', style: 'colposcopy', ref: '2019' },
      'HSIL':    { text: 'Colposcopy/Treatment', style: 'colposcopy', ref: '2019' },
      'AGC':     { text: 'Refer to Algorithm', style: '', ref: '' },
    },
  };


  // === POST-TREATMENT SURVEILLANCE ===
  const POSTTX_REC = {
    'CIN 2': {'HPV 16+':'Colposcopy','HPV 18+':'Colposcopy','HPV+ (other)':'Refer to Algorithm','HPV-':'Refer to Algorithm'},
    'CIN 3': {'HPV 16+':'Colposcopy','HPV 18+':'Colposcopy','HPV+ (other)':'Refer to Algorithm','HPV-':'Refer to Algorithm'},
    'AIS': {'HPV 16+':'Refer to Algorithm','HPV 18+':'Refer to Algorithm','HPV+ (other)':'Refer to Algorithm','HPV-':'Refer to Algorithm'},
  };

  // === BIOPSY MANAGEMENT ===
  const BIOPSY_REC = {
    'No CIN':  {'Normal':'1 year follow up','ASC-US':'1 year follow up','LSIL':'1 year follow up','ASC-H':'Observation or Review','HSIL':'Refer to Algorithm','AGC':'Refer to Algorithm'},
    'CIN 1':   {'Normal':'1 year follow up','ASC-US':'1 year follow up','LSIL':'1 year follow up','ASC-H':'Observation or Review','HSIL':'Refer to Algorithm','AGC':'Refer to Algorithm'},
    'CIN 2':   {'Normal':'Treatment','ASC-US':'Treatment','LSIL':'Treatment','ASC-H':'Treatment','HSIL':'Treatment','AGC':'Treatment'},
    'CIN 3':   {'Normal':'Treatment','ASC-US':'Treatment','LSIL':'Treatment','ASC-H':'Treatment','HSIL':'Treatment','AGC':'Treatment'},
    'AIS':     {'Normal':'Treatment','ASC-US':'Treatment','LSIL':'Treatment','ASC-H':'Treatment','HSIL':'Treatment','AGC':'Treatment'},
  };


  // === POST-COLPOSCOPY SURVEILLANCE ===
  const POSTCOLP_REC = {
    'No CIN': {
      'HPV 16+': {'Normal':'Colposcopy','ASC-US':'Colposcopy (9-23%)','LSIL':'Colposcopy (9-23%)','ASC-H':'Refer to Algorithm','HSIL':'Refer to Algorithm','AGC':'Refer to Algorithm'},
      'HPV 18+': {'Normal':'Colposcopy','ASC-US':'Colposcopy (9-23%)','LSIL':'Colposcopy (9-23%)','ASC-H':'Refer to Algorithm','HSIL':'Refer to Algorithm','AGC':'Refer to Algorithm'},
      'HPV+ (other)': {'Normal':'Refer to Algorithm','ASC-US':'Refer to Algorithm','LSIL':'Refer to Algorithm','ASC-H':'Refer to Algorithm','HSIL':'Refer to Algorithm','AGC':'Refer to Algorithm'},
      'HPV-': {'Normal':'3 year follow up (0.18-0.42%)','ASC-US':'Refer to Algorithm','LSIL':'Refer to Algorithm','ASC-H':'Refer to Algorithm','HSIL':'Refer to Algorithm','AGC':'Refer to Algorithm'},
    },
    'CIN 1': {
      'HPV 16+': {'Normal':'Colposcopy','ASC-US':'Colposcopy (9-23%)','LSIL':'Colposcopy (9-23%)','ASC-H':'Refer to Algorithm','HSIL':'Refer to Algorithm','AGC':'Refer to Algorithm'},
      'HPV 18+': {'Normal':'Colposcopy','ASC-US':'Colposcopy (9-23%)','LSIL':'Colposcopy (9-23%)','ASC-H':'Refer to Algorithm','HSIL':'Refer to Algorithm','AGC':'Refer to Algorithm'},
      'HPV+ (other)': {'Normal':'Refer to Algorithm','ASC-US':'Refer to Algorithm','LSIL':'Refer to Algorithm','ASC-H':'Refer to Algorithm','HSIL':'Refer to Algorithm','AGC':'Refer to Algorithm'},
      'HPV-': {'Normal':'3 year follow up (0.18-0.42%)','ASC-US':'Refer to Algorithm','LSIL':'Refer to Algorithm','ASC-H':'Refer to Algorithm','HSIL':'Refer to Algorithm','AGC':'Refer to Algorithm'},
    },
    'CIN 2': {'any':'Treatment or Observation (see Post-Treatment)'},
    'CIN 3': {'any':'Treatment (see Post-Treatment)'},
    'AIS': {'any':'Refer to Algorithm'},
  };

  // === UNDER 25 SCREENING ===
  const SCREENING_25_REC = {
    'HPV 16+': { 'Normal':'Routine Screening','ASC-US':'1 year follow up','LSIL':'1 year follow up','ASC-H':'Colposcopy','HSIL':'Colposcopy','AGC':'Colposcopy' },
    'HPV 18+': { 'Normal':'Routine Screening','ASC-US':'1 year follow up','LSIL':'1 year follow up','ASC-H':'Colposcopy','HSIL':'Colposcopy','AGC':'Colposcopy' },
    'HPV+ (other)': { 'Normal':'Routine Screening','ASC-US':'1 year follow up','LSIL':'1 year follow up','ASC-H':'Colposcopy','HSIL':'Colposcopy','AGC':'Colposcopy' },
    'HPV-': { 'Normal':'Routine Screening','ASC-US':'Routine Screening','LSIL':'1 year follow up','ASC-H':'Colposcopy','HSIL':'Colposcopy','AGC':'Colposcopy' },
  };

  function normalizeHpv(hpvValue) {
    if (!hpvValue || hpvValue === 'None' || hpvValue === 'HPV-') return 'HPV-';
    const v = String(hpvValue);
    if (v.includes('16+') || v.includes('16/18') || v === 'HPV 16+') return 'HPV 16+';
    if (v.includes('18+') || v === 'HPV 18+') return 'HPV 18+';
    if (v.startsWith('HPV+') || v === 'Positive') return 'HPV+ (other)';
    return hpvValue;
  }

  function normalizeCytology(cytValue) {
    if (!cytValue || cytValue === 'None' || cytValue === 'Normal') return 'Normal';
    const c = String(cytValue);
    if (c.includes('ASC-US') || c === 'ASC-US') return 'ASC-US';
    if (c.includes('LSIL') || c === 'LSIL') return 'LSIL';
    if (c.includes('ASC-H')) return 'ASC-H';
    if (c.includes('HSIL')) return 'HSIL';
    if (c.includes('AGC')) return 'AGC';
    return 'Normal';
  }

  function computeRisk(vars) {
    const hpv = normalizeHpv(vars.hpv || vars.current_hpv);
    const cytology = normalizeCytology(vars.cytology || vars.current_cytology);
    
    const hpvRisks = RISK_TABLE[hpv];
    if (!hpvRisks) return null;
    
    const risk = hpvRisks[cytology];
    if (risk === undefined) return null;
    
    // Handle range values like 'range_9_23'
    if (typeof risk === 'string' && risk.startsWith('range_')) {
      return risk; // Return the range string as-is
    }
    return risk;
  }

  function getManagementAction(risk) {
    if (risk === null || risk === undefined) return null;
    if (typeof risk === 'string') return 'colposcopy'; // Ranges default to colposcopy
    if (risk >= THRESHOLDS.TREATMENT) return 'treatment';
    if (risk >= THRESHOLDS.EXPEDITED_TX) return 'expedited_tx';
    if (risk >= THRESHOLDS.COLPOSCOPY) return 'colposcopy';
    if (risk >= THRESHOLDS.SHORT_SURVEILLANCE) return '1yr_surveillance';
    if (risk >= THRESHOLDS.MEDIUM_SURVEILLANCE) return '3yr_surveillance';
    return '5yr_screening';
  }

  function generateRecommendation(vars) {
    const hpv = normalizeHpv(vars.hpv || vars.current_hpv);
    const cytology = normalizeCytology(vars.cytology || vars.current_cytology);
    const risk = computeRisk(vars);
    
    // Get the API-based recommendation text
    const rec = (RECOMMENDATIONS[hpv] || {})[cytology] || {};
    
    let riskDisplay = '';
    let riskOf = 'CIN3+';
    
    if (risk !== null && risk !== undefined) {
      if (typeof risk === 'string' && risk.startsWith('range_')) {
        const parts = risk.split('_');
        riskDisplay = parts[1] + '-' + parts[2] + '%';
      } else if (typeof risk === 'number') {
        riskDisplay = risk + '%';
        if (risk < 1) riskOf = '5 year risk of CIN3+';
        else riskOf = 'Immediate risk of CIN3+';
      }
    }

    const title = `${hpv} with ${cytology} cytology`;
    const text = rec.text || 'Use clinical judgment';
    const style = rec.style || '';
    const reference = rec.ref ? `Reference: ${rec.ref}` : '';

    return {
      type: 'recommendation',
      title,
      text: [text + (riskDisplay ? ` (risk: ${riskDisplay})` : '')],
      risk: riskDisplay || null,
      risk_of: riskOf,
      style,
      reference,
    };
  }

  return {
    computeRisk,
    getManagementAction,
    generateRecommendation,
    normalizeHpv,
    normalizeCytology,
    RISK_TABLE,
    RECOMMENDATIONS,
    BIOPSY_REC,
    SCREENING_25_REC,
    POSTCOLP_REC,
    POSTTX_REC,
  };
})();
