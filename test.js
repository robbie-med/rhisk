// Run: node test.js — spot-checks against the ASCCP sources, then walks every path the form can produce.
const assert = require('assert');
global.manage = require('./js/guidelines.js').manage;
const { manage } = require('./js/guidelines.js');
const { fields } = require('./js/app.js');

const check = (r, level, title, imm, five) => {
  assert.strictEqual(r.level, level, `${r.title}: level`);
  if (title) assert.match(r.title, title);
  if (imm !== undefined) assert.strictEqual(r.risk.imm, imm, `${r.title}: imm`);
  if (five !== undefined) assert.strictEqual(r.risk.five, five, `${r.title}: five`);
};
const s25 = o => manage({ age: '25+', situation: 'screen', collection: 'clinician', priorHpv: 'none', priorCyto: 'none', ...o });

// Egemen 2020 Table 1A (no prior HPV)
check(s25({ hpv: 'neg', cyto: 'nilm' }), 'routine', /5 years/, 0.00, 0.12);
check(s25({ hpv: 'neg', cyto: 'ascus' }), 'surveil', /3 years/, 0.04, 0.40);
check(s25({ hpv: 'neg', cyto: 'lsil' }), 'surveil', /1 year/, 1.1, 2.0);
check(s25({ hpv: 'pos', cyto: 'nilm' }), 'surveil', /1 year/, 2.1, 4.8);
check(s25({ hpv: 'pos', cyto: 'ascus' }), 'colpo', /Colposcopy/, 4.4, 7.3);
check(s25({ hpv: 'pos', cyto: 'hsil' }), 'treat', /expedited/, 49, 53);
check(s25({ hpv: 'neg', cyto: 'none' }), 'routine', /5 years/, 0.01, 0.14);
// Table 1B: prior negative HPV downgrades untyped HPV+ ASC-US to 1 year
check(s25({ priorHpv: 'neg', priorCyto: 'nilm', hpv: 'pos', cyto: 'ascus' }), 'surveil', /1 year/, 2.0, 3.8);
// Table 2C: prior HPV+ NILM → second consecutive HPV+ → colposcopy
check(s25({ priorHpv: 'pos', priorCyto: 'nilm', hpv: 'pos', cyto: 'nilm' }), 'colpo', /Colposcopy/, 4.1, 7.2);
check(s25({ priorHpv: 'pos', priorCyto: 'nilm', hpv: 'low3', cyto: 'nilm' }), 'colpo');
// Table 2A: HPV-only follow-up after HPV-negative ASC-US needs cytology
check(s25({ priorHpv: 'neg', priorCyto: 'ascus', hpv: 'neg', cyto: 'none' }), 'need');
// Prior cytology alone does not modify risk
check(s25({ priorHpv: 'none', priorCyto: 'ascus', hpv: 'pos', cyto: 'ascus' }), 'colpo', /Colposcopy/, 4.4);

// Massad 2025 Table 6 (extended genotyping)
check(s25({ hpv: '16', cyto: 'hsil' }), 'treat', /preferred/, 60);
check(s25({ hpv: '16', cyto: 'asch' }), 'treat', /Colposcopy or expedited/);
check(s25({ hpv: '18', cyto: 'hsil' }), 'treat', /Colposcopy or expedited/);
check(s25({ hpv: '16', cyto: 'nilm' }), 'colpo', /^Colposcopy$/, 5.3);
check(s25({ priorHpv: 'neg', priorCyto: 'nilm', hpv: '16', cyto: 'nilm' }), 'colpo', /^Colposcopy$/, 8.4, 11.5);
check(s25({ hpv: '18', cyto: 'none' }), 'colpo', /^Colposcopy$/);
check(s25({ priorHpv: 'neg', priorCyto: 'nilm', hpv: '18', cyto: 'ascus' }), 'colpo');
check(s25({ hpv: 'ext', cyto: 'nilm' }), 'surveil', /1 year/, 1.8, 2.9);
check(s25({ priorHpv: 'neg', priorCyto: 'nilm', hpv: 'ext', cyto: 'ascus' }), 'colpo');
check(s25({ hpv: 'ext', cyto: 'none' }), 'need');
check(s25({ hpv: 'low3', cyto: 'lsil' }), 'surveil', /1 year/);
check(s25({ hpv: 'low3', cyto: 'asch' }), 'colpo');
check(s25({ hpv: 'hr12', cyto: 'asch' }), 'treat', /Colposcopy or expedited/, 26);
// Clarke 2024 (dual stain)
check(s25({ hpv: 'pos', cyto: 'none', ds: 'pos' }), 'colpo', /Colposcopy/, 9.5);
check(s25({ hpv: 'pos', cyto: 'none', ds: 'neg' }), 'surveil', /1 year/, 0.75, 1.5);
check(s25({ hpv: 'hr12', cyto: 'none', ds: 'neg' }), 'surveil', /1 year/, 0.53, 1.1);
check(s25({ hpv: 'pos', cyto: 'ascus', ds: 'neg' }), 'surveil', /1 year/, 0.87, 1.6);
check(s25({ hpv: '16', cyto: 'none', ds: 'neg' }), 'colpo');
// Wentzensen 2025 (self-collection)
check(s25({ collection: 'self', hpv: 'neg' }), 'surveil', /3 years/);
check(s25({ collection: 'self', hpv: '16' }), 'colpo');
check(s25({ collection: 'self', hpv: 'ext' }), 'surveil', /cytology or dual stain/);
check(s25({ collection: 'self', hpv: 'low3' }), 'surveil', /1 year/);
check(s25({ collection: 'self', hpv: 'neg', pregnant: true }), 'need');
// Perkins 2024: missed colposcopy, cytology-only
check(s25({ priorHpv: 'none', priorCyto: 'hsil' }), 'need');
check(s25({ priorHpv: 'none', priorCyto: 'hsil', priorColpo: 'yes', hpv: 'neg', cyto: 'nilm' }), 'need', /Follow-up after colposcopy/);
check(s25({ priorHpv: 'none', priorCyto: 'hsil', priorColpo: 'no', hpv: 'neg', cyto: 'nilm' }), 'colpo');
check(s25({ priorHpv: 'pos', priorCyto: 'ascus', priorColpo: 'no', hpv: 'neg', cyto: 'nilm' }), 'surveil', /1 year/);
check(s25({ priorHpv: 'pos', priorCyto: 'ascus', priorColpo: 'no', hpv: 'pos', cyto: 'nilm' }), 'colpo');
check(s25({ hpv: 'none', cyto: 'lsil' }), 'colpo');
check(s25({ hpv: 'none', cyto: 'ascus' }), 'need');
// AGC / ASC-H, pregnancy, immunosuppression
check(s25({ hpv: 'neg', cyto: 'agc' }), 'colpo', /endocervical/, 1.1);
check(s25({ hpv: 'neg', cyto: 'asch' }), 'colpo', /Colposcopy/, 3.4);
check(s25({ hpv: '16', cyto: 'hsil', pregnant: true }), 'colpo', /^Colposcopy$/);
check(s25({ priorHpv: 'neg', priorCyto: 'nilm', hpv: 'pos', cyto: 'ascus', immuno: true }), 'colpo');

// Under 25 (K.1, Figure 12)
const u25 = o => manage({ age: 'u25', situation: 'screen', ...o });
check(u25({ visit: 'initial', cyto: 'lsil' }), 'surveil', /cytology in 1 year/);
check(u25({ visit: 'initial', cyto: 'ascus', hpv: 'neg' }), 'routine', /Routine/);
check(u25({ visit: 'initial', cyto: 'hsil' }), 'colpo');
check(u25({ visit: 'y2', cyto: 'nilm' }), 'routine', /routine/);
check(u25({ visit: 'y2', cyto: 'ascus' }), 'colpo');
check(u25({ visit: 'missed', cyto: 'nilm' }), 'colpo');

// Biopsy (Table 3, section I, Figures 7-11)
const bx = o => manage({ age: '25+', situation: 'biopsy', ...o });
check(bx({ biopsy: 'cin1', referral: 'ascus' }), 'surveil', /1 year/, 0.53, 2.6);
check(bx({ biopsy: 'neg', referral: 'hsil' }), 'treat', /excision/i, 2.9, 4.8);
check(bx({ biopsy: 'neg', referral: 'asch' }), 'surveil', /1 and 2 years/, 2.4, 4.4);
check(bx({ biopsy: 'cin3' }), 'treat', /Treatment/);
check(bx({ biopsy: 'cin2', futurePreg: 'no' }), 'treat', /^Treatment$/);
check(bx({ biopsy: 'cin2', futurePreg: 'yes' }), 'treat', /Observation or treatment/);
check(bx({ biopsy: 'cin2', pregnant: true }), 'colpo', /12–24 weeks/);
check(manage({ age: 'u25', situation: 'biopsy', biopsy: 'cin2' }), 'surveil', /Observation preferred/);

// Post-colposcopy (Tables 4A/4B, Figures 4/9/10, Perkins 2024 Figure 2 legend)
const pc = o => manage({ age: '25+', situation: 'postcolpo', colpoResult: 'lt2', pcvisit: '1', ...o });
check(pc({ referral: 'ascus', hpv: 'neg', cyto: 'nilm' }), 'surveil', /3 years/, 0.00, 0.42);
check(pc({ referral: 'ascus', hpv: 'pos', cyto: 'ascus' }), 'surveil', /1 year/, 3.1, 6.0);
check(pc({ referral: 'ascus', hpv: '16', cyto: 'nilm' }), 'colpo');     // old app's captured ASCCP answer
check(pc({ referral: 'ascus', hpv: 'pos', cyto: 'nilm', pcvisit: '2' }), 'colpo');
check(pc({ referral: 'ascus', hpv: 'neg', cyto: 'lsil', pcvisit: '2' }), 'surveil', /1 year/);
check(pc({ referral: 'hsil', hpv: 'neg', cyto: 'nilm' }), 'surveil', /1 year/, 0.02, 0.48);
check(pc({ referral: 'hsil', hpv: 'neg', cyto: 'nilm', pcvisit: '2' }), 'surveil', /3 years/);
check(pc({ referral: 'hsil', hpv: 'pos', cyto: 'hsil' }), 'treat', /excision/i);
check(pc({ referral: 'asch', hpv: 'neg', cyto: 'asch', pcvisit: '2' }), 'treat', /excision/i);
check(pc({ referral: 'asch', hpv: 'neg', cyto: 'lsil' }), 'colpo');      // Massad 2025 footnote
check(pc({ referral: 'agc', hpv: 'neg', cyto: 'ascus' }), 'colpo');
check(pc({ referral: 'agc', hpv: 'neg', cyto: 'nilm', pcvisit: '2' }), 'surveil', /3 years/);
check(manage({ age: '25+', situation: 'postcolpo', colpoResult: 'untreated' }), 'need', /No clinical guidelines/);
// CIN 2 observation (revised Figure 8)
const ob = o => manage({ age: '25+', situation: 'postcolpo', colpoResult: 'cin2obs', ...o });
check(ob({ obsHisto: 'cin3' }), 'treat', /excision/i);
check(ob({ obsHisto: 'lt2', obsTest: 'neg', obsYears: '<2', obsPrev: 'yes' }), 'surveil', /1 year/);
check(ob({ obsHisto: 'cin2', obsTest: 'neg', obsYears: '<2' }), 'colpo', /6 months/);
check(ob({ obsHisto: 'cin2', obsTest: 'neg', obsYears: '2' }), 'treat', /excision/i);

// Post-treatment (Tables 5A/5B, Perkins 2024 revised Figure 7)
const pt = o => manage({ age: '25+', situation: 'posttx', treated: 'cin23', ...o });
check(pt({ priorNeg: '0', hpv: 'neg', cyto: 'nilm' }), 'surveil', /1 year/, 0.03, 1.7);
check(pt({ priorNeg: '0', hpv: 'pos', cyto: 'nilm' }), 'colpo', /Colposcopy/, 5.8, 12);
check(pt({ priorNeg: '0', hpv: '18', cyto: 'none' }), 'colpo');
check(pt({ priorNeg: '1', hpv: 'neg', cyto: 'nilm' }), 'surveil', /1 year/, null, 0.68);
check(pt({ priorNeg: '2', hpv: 'neg', cyto: 'none' }), 'surveil', /3 years/, null, 0.44);
check(pt({ priorNeg: '3', hpv: 'neg', cyto: 'nilm' }), 'surveil', /3 years/);
check(pt({ priorNeg: '0', hpv: 'neg', cyto: 'lsil' }), 'colpo');         // Massad 2025 footnote
check(manage({ age: '25+', situation: 'posttx', treated: 'ais' }), 'surveil', /AIS/);

// Walk every answer combination the form can produce (fields() decides what is asked)
let paths = 0;
function walk(state) {
  const fs = fields(state);
  const next = fs.find(f => !f.multi && !(f.key in state));
  if (!next) {
    for (const flags of [{}, { pregnant: true }, { immuno: true }]) {
      const r = manage({ ...state, ...flags });
      assert.ok(r && r.title && r.level, JSON.stringify(state));
      paths++;
    }
    return;
  }
  for (const [v] of next.options) walk({ ...state, [next.key]: v });
}
walk({});
console.log(`ok — ${paths} form paths checked`);
