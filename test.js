// Run: node test.js — spot-checks against Egemen 2020 tables and Perkins 2020 rules.
const assert = require('assert');
const { manage } = require('./js/guidelines.js');

const s25 = o => manage({ age: '25+', situation: 'screen', ...o });
const check = (r, level, title, imm, five) => {
  assert.strictEqual(r.level, level, `${r.title}: level`);
  if (title) assert.match(r.title, title);
  if (imm !== undefined) assert.strictEqual(r.risk.imm, imm, `${r.title}: imm`);
  if (five !== undefined) assert.strictEqual(r.risk.five, five, `${r.title}: five`);
};

// Table 1A
check(s25({ history: 'unknown', hpv: 'neg', cyto: 'nilm' }), 'routine', /5 years/, 0.00, 0.12);
check(s25({ history: 'unknown', hpv: 'neg', cyto: 'ascus' }), 'surveil', /3 years/, 0.04, 0.40);
check(s25({ history: 'unknown', hpv: 'pos', cyto: 'nilm' }), 'surveil', /1 year/, 2.1, 4.8);
check(s25({ history: 'unknown', hpv: 'pos', cyto: 'ascus' }), 'colpo', /Colposcopy/, 4.4, 7.3);
check(s25({ history: 'unknown', hpv: 'pos', cyto: 'hsil' }), 'treat', /expedited/, 49, 53);
check(s25({ history: 'unknown', hpv: 'neg', cyto: 'none' }), 'routine', /5 years/, 0.01, 0.14);
// Table 1B: prior negative screen downgrades HPV+ ASC-US to 1-year
check(s25({ history: 'hpvneg', hpv: 'pos', cyto: 'ascus' }), 'surveil', /1 year/, 2.0, 3.8);
// Table 2C: HPV+ after HPV+ NILM -> colposcopy
check(s25({ history: 'hpvpos_nilm', hpv: 'pos', cyto: 'nilm' }), 'colpo', /Colposcopy/, 4.1, 7.2);
// Table 2A: HPV-only follow-up after HPV-neg ASC-US needs cytology
check(s25({ history: 'hpvneg_ascus', hpv: 'neg', cyto: 'none' }), 'need');
// Genotype: HPV 16/18 NILM -> colposcopy; HPV 16 HSIL -> expedited tx preferred
check(s25({ history: 'unknown', hpv: '16', cyto: 'nilm' }), 'colpo', /Colposcopy/, 5.3);
check(s25({ history: 'unknown', hpv: '18', cyto: 'nilm' }), 'colpo', /Colposcopy/, 3.0);
check(s25({ history: 'hpvneg', hpv: '18', cyto: 'ascus' }), 'colpo', /Colposcopy/);
check(s25({ history: 'unknown', hpv: '16', cyto: 'hsil' }), 'treat', /preferred/, 60);
check(s25({ history: 'unknown', hpv: '16', cyto: 'hsil', pregnant: true }), 'colpo', /^Colposcopy$/);
// AGC and ASC-H: colposcopy regardless of HPV
check(s25({ history: 'unknown', hpv: 'neg', cyto: 'agc' }), 'colpo', /endocervical/, 1.1);
check(s25({ history: 'unknown', hpv: 'neg', cyto: 'asch' }), 'colpo', /Colposcopy/, 3.4);
check(s25({ history: 'unknown', hpv: 'pos', cyto: 'none' }), 'need');
// Immunosuppressed: HPV+ ASC-US -> colposcopy even with prior negative
check(s25({ history: 'hpvneg', hpv: 'pos', cyto: 'ascus', immuno: true }), 'colpo');

// Under 25
const u25 = o => manage({ age: 'u25', situation: 'screen', ...o });
check(u25({ visit: 'initial', cyto: 'lsil' }), 'surveil', /cytology in 1 year/);
check(u25({ visit: 'initial', cyto: 'ascus', hpv: 'neg' }), 'surveil', /3 years/);
check(u25({ visit: 'initial', cyto: 'hsil' }), 'colpo');
check(u25({ visit: 'y2', cyto: 'ascus' }), 'colpo');

// Biopsy (Table 3 + section I)
const bx = o => manage({ age: '25+', situation: 'biopsy', ...o });
check(bx({ biopsy: 'cin1', referral: 'ascus' }), 'surveil', /1 year/, 0.53, 2.6);
check(bx({ biopsy: 'neg', referral: 'hsil' }), 'treat', /excision/i, 2.9, 4.8);
check(bx({ biopsy: 'cin3' }), 'treat', /Treatment/);
check(bx({ biopsy: 'cin2', pregnant: true }), 'colpo', /12–24 weeks/);
check(manage({ age: 'u25', situation: 'biopsy', biopsy: 'cin2' }), 'surveil', /Observation preferred/);

// Post-colposcopy (Tables 4A/4B)
const pc = o => manage({ age: '25+', situation: 'postcolpo', ...o });
check(pc({ grade: 'low', hpv: 'neg', cyto: 'nilm' }), 'surveil', /3 years/, 0.00, 0.42);
check(pc({ grade: 'high', hpv: 'neg', cyto: 'nilm' }), 'surveil', /1 year/, 0.02, 0.48);
check(pc({ grade: 'high', hpv: 'pos', cyto: 'hsil' }), 'treat', /excision/i, 28, 38);

// Post-treatment (Tables 5A/5B)
const pt = o => manage({ age: '25+', situation: 'posttx', ...o });
check(pt({ priorNeg: '0', hpv: 'neg', cyto: 'nilm' }), 'surveil', /1 year/, 0.03, 1.7);
check(pt({ priorNeg: '0', hpv: 'pos', cyto: 'nilm' }), 'colpo', /Colposcopy/, 5.8, 12);
check(pt({ priorNeg: '1', hpv: 'neg', cyto: 'nilm' }), 'surveil', /1 year/, null, 0.68);
check(pt({ priorNeg: '2', hpv: 'neg', cyto: 'none' }), 'surveil', /3 years/, null, 0.44);

// Every option combination returns a result without throwing
const opts = {
  age: ['25+', 'u25'], situation: ['screen', 'biopsy', 'postcolpo', 'posttx'],
  history: ['unknown', 'hpvneg', 'hpvneg_ascus', 'hpvneg_lsil', 'hpvpos_nilm'],
  hpv: ['neg', 'pos', '16', '18', 'none'], cyto: ['nilm', 'ascus', 'lsil', 'asch', 'agc', 'hsil', 'none'],
};
let n = 0;
for (const age of opts.age) for (const situation of opts.situation) for (const history of opts.history)
  for (const hpv of opts.hpv) for (const cyto of opts.cyto) for (const pregnant of [false, true]) {
    if (situation !== 'screen' && (hpv === '16' || hpv === '18')) continue; // UI offers 16/18 only for screening
    const base = { age, situation, history, hpv, cyto, pregnant, visit: 'initial', grade: 'high', priorNeg: '0', biopsy: 'neg', referral: 'agc' };
    const r = manage(base);
    assert.ok(r.title, JSON.stringify(base));
    n++;
  }
console.log(`ok — ${n} combinations checked`);
