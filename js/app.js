// rhisk — UI. All clinical logic lives in guidelines.js (manage()).
const state = { age: '25+' };

// Genotype choices follow the ASCCP app's own list
const HPV_GENO = [['16', 'HPV 16+'], ['18', 'HPV 18+'], ['pos', 'HPV+ (untyped)'],
  ['ext', 'HPV+ (31/33/35/39/45/51/52/58/68)'], ['hr12', 'HPV+ (16/18 negative, other high risk positive)'], ['low3', 'HPV+ (56/59/66)'], ['neg', 'HPV-']];
const HPV_POS_NEG = [['neg', 'HPV-'], ['pos', 'HPV+ (untyped or other genotyping)'], ['16', 'HPV 16+'], ['18', 'HPV 18+']];
const CYTO = [['nilm', 'NILM'], ['ascus', 'ASC-US'], ['lsil', 'LSIL'], ['asch', 'ASC-H'], ['agc', 'AGC'], ['hsil', 'HSIL+']];
const CYTO_NONE = ['none', 'Not done', 'HPV test only'];
const NOT_DONE = ['none', 'Not done'];
const DS = { key: 'ds', label: 'Dual stain (p16/Ki-67)', options: [['none', 'Not done'], ['pos', 'Positive'], ['neg', 'Negative']] };
const triageable = s => ['ext', 'pos', 'hr12'].includes(s.hpv) && ['nilm', 'ascus', 'lsil', 'none'].includes(s.cyto);

function fields(s) {
  const f = [
    { key: 'age', label: 'Age', options: [['25+', '25 or older'], ['u25', 'Under 25']] },
    { key: 'situation', label: 'Clinical situation', options: [
      ['screen', 'Routine screening'],
      ['biopsy', 'Evaluation of a colposcopic biopsy'],
      ['postcolpo', 'Post-colposcopy surveillance', 'or CIN 2 observation'],
      ['posttx', 'Follow-up after treatment']] },
  ];
  const cyto = withNone => ({ key: 'cyto', label: 'Current cytology', options: withNone ? CYTO.concat([CYTO_NONE]) : CYTO });
  const prior = { key: 'priorCyto', label: 'Prior cytology', options: [NOT_DONE.concat(['or unknown']), ...CYTO] };

  if (s.situation === 'screen' && s.age !== 'u25') {
    f.push({ key: 'collection', label: 'HPV specimen', options: [['clinician', 'Clinician-collected'], ['self', 'Self-collected', 'vaginal, clinic or home']] });
    f.push({ key: 'priorHpv', label: 'Prior HPV (most recent, within ~5 years)', options: [['none', 'None', 'or unknown'], ['neg', 'HPV-'], ['pos', 'HPV+']] });
    f.push(prior);
    const hi = ['asch', 'agc', 'hsil'].includes(s.priorCyto);
    if (hi || (s.priorHpv === 'pos' && ['ascus', 'lsil'].includes(s.priorCyto)) || (s.priorHpv === 'none' && s.priorCyto === 'lsil'))
      f.push({ key: 'priorColpo', label: 'Was colposcopy done for that prior result?', options: [['yes', 'Yes'], ['no', 'No']] });
    f.push({ key: 'hpv', label: 'Current HPV', options: HPV_GENO.concat([['none', 'None', 'cytology only']]) });
    if (s.collection !== 'self') {
      f.push(cyto(s.hpv && s.hpv !== 'none'));
      if (triageable(s)) f.push(DS);
    }
  } else if (s.situation === 'screen') {
    f.push({ key: 'visit', label: 'This result is', options: [
      ['initial', 'A new result'], ['y1', '1-year repeat', 'after ASC-US/LSIL'], ['y2', '2-year repeat', 'after ASC-US/LSIL'],
      ['missed', 'Prior ASC-H/AGC/HSIL', 'colposcopy not done']] });
    f.push(cyto(false));
    if (s.cyto === 'ascus' && s.visit === 'initial') f.push({ key: 'hpv', label: 'Current HPV', options: [['none', 'None'], ['neg', 'HPV-'], ['pos', 'HPV+']] });
  } else if (s.situation === 'biopsy') {
    f.push({ key: 'biopsy', label: 'Colposcopy', options: [
      ['neg', 'No CIN'], ['cin1', 'Histologic LSIL (CIN 1)'], ['cin2', 'Histologic HSIL (CIN 2)'], ['cin3', 'Histologic HSIL (CIN 3)'],
      ['hsil_nos', 'Histologic HSIL (Unspecified)'], ['ais', 'AIS'], ['cancer', 'Cancer']] });
    if (s.biopsy === 'neg' || s.biopsy === 'cin1') f.push({ key: 'referral', label: 'Cytology preceding colposcopy', options: [
      ['nilm', 'Normal', 'HPV-positive'], ['ascus', 'ASC-US'], ['lsil', 'LSIL'], ['asch', 'ASC-H'], ['agc', 'AGC'], ['hsil', 'HSIL']] });
    if (s.biopsy === 'cin2' && s.age !== 'u25') f.push({ key: 'futurePreg', label: 'Future pregnancy', hint: 'Do concerns about treatment effects on a future pregnancy outweigh concerns about cancer?', options: [['yes', 'Yes'], ['no', 'No']] });
  } else if (s.situation === 'postcolpo') {
    f.push({ key: 'colpoResult', label: 'Colposcopy', options: [
      ['lt2', 'No CIN or CIN 1'], ['cin2obs', 'CIN 2', 'under observation'], ['untreated', 'CIN 3 or AIS', 'not treated'], ['treated', 'Treated']] });
    if (s.colpoResult === 'lt2') {
      f.push({ key: 'referral', label: 'Cytology preceding colposcopy', options: [
        ['nilm', 'Normal', 'HPV-positive'], ['ascus', 'ASC-US'], ['lsil', 'LSIL'], ['asch', 'ASC-H'], ['hsil', 'HSIL'], ['agc', 'AGC']] });
      if (s.age !== 'u25') {
        f.push({ key: 'pcvisit', label: 'This follow-up test is', options: [['1', 'The first', 'after colposcopy'], ['2', 'The second', 'the first needed 1-year follow-up']] });
        const low = ['nilm', 'ascus', 'lsil'].includes(s.referral);
        f.push({ key: 'hpv', label: 'Current HPV', options: s.referral === 'agc' ? [['neg', 'HPV-'], ['pos', 'HPV+']]
          : (low ? HPV_GENO : HPV_POS_NEG).concat([['none', 'None']]) });
      }
      f.push(cyto(s.age !== 'u25' && s.referral !== 'agc' && s.hpv && s.hpv !== 'none'));
      if (s.age !== 'u25' && ['nilm', 'ascus', 'lsil'].includes(s.referral) && triageable(s)) f.push(DS);
    } else if (s.colpoResult === 'cin2obs') {
      f.push({ key: 'obsHisto', label: 'Colposcopy at this visit', options: [['lt2', '<CIN 2'], ['cin2', 'CIN 2'], ['cin3', 'CIN 3']] });
      f.push({ key: 'obsTest', label: s.age === 'u25' ? 'Cytology at this visit' : 'Cytology / HPV at this visit', options: [
        ['neg', s.age === 'u25' ? 'Less than ASC-H' : 'Negative', s.age === 'u25' ? '' : '<ASC-H cytology, or HPV- if HPV alone'],
        ...(s.age === 'u25' ? [] : [['hpvpos', 'HPV+', 'HPV testing alone']]), ['high', 'ASC-H, AGC or HSIL']] });
      f.push({ key: 'obsYears', label: 'Time since CIN 2 diagnosis', options: [['<2', 'Under 2 years'], ['2', '2 years']] });
      if (s.obsHisto === 'lt2' && s.obsTest === 'neg') f.push({ key: 'obsPrev', label: 'Previous 6-month evaluation also negative?', options: [['yes', 'Yes'], ['no', 'No', 'or this is the first']] });
    }
  } else if (s.situation === 'posttx') {
    f.push({ key: 'treated', label: 'Treated histology', options: [
      ['cin23', 'Histologic HSIL', 'CIN 2, CIN 3 or unspecified'], ['lt2_high', 'No CIN or CIN 1', 'after ASC-H, HSIL or AGC'],
      ['lt2_low', 'No CIN or CIN 1', 'after ASC-US or LSIL'], ['ais', 'AIS']] });
    if (s.treated === 'cin23' || s.treated === 'lt2_high') {
      f.push({ key: 'priorNeg', label: 'This post-treatment test is', options: [
        ['0', '6 months', 'first test'], ['1', '18 months', '1 prior negative'], ['2', '30 months', '2 prior negatives'], ['3', 'Later', '3+ negatives, on 3-year testing']] });
      f.push({ key: 'hpv', label: 'Current HPV', options: [['none', 'None'], ...HPV_POS_NEG] });
      f.push(cyto(s.hpv && s.hpv !== 'none'));
    }
  }
  if (s.situation) f.push({ key: 'flags', label: 'Modifiers', multi: true, options: [['pregnant', 'Pregnant'], ['immuno', 'Immunosuppressed', 'incl. HIV']] });
  return f;
}

// Drop answers that no longer apply (e.g. HPV 16 carried over from another situation).
function prune() {
  for (let pass = 0; pass < 4; pass++) {
    const visible = fields(state);
    const allowed = {};
    for (const fd of visible) allowed[fd.key] = fd.options.map(o => o[0]);
    let changed = false;
    for (const k of Object.keys(state)) {
      if (k === 'pregnant' || k === 'immuno') { if (!allowed.flags) { delete state[k]; changed = true; } continue; }
      if (!allowed[k] || !allowed[k].includes(state[k])) { delete state[k]; changed = true; }
    }
    if (!changed) return visible;
  }
  return fields(state);
}

const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function renderForm(visible) {
  document.getElementById('form').innerHTML = visible.map(fd => `
    <fieldset>
      <legend>${fd.label}</legend>
      ${fd.hint ? `<p class="hint">${fd.hint}</p>` : ''}
      <div class="opts">${fd.options.map(([v, label, sub]) => {
        const checked = fd.multi ? state[v] : state[fd.key] === v;
        return `<label class="opt"><input type="${fd.multi ? 'checkbox' : 'radio'}" name="${fd.key}" value="${v}"${checked ? ' checked' : ''}>
          <span>${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ''}</span></label>`;
      }).join('')}</div>
    </fieldset>`).join('');
}

const fmt = v => v === null || v === undefined ? '—' : v + '%';

function renderResult(visible) {
  const r = manage(state);
  const el = document.getElementById('result');
  if (r.level === 'need') {
    el.className = 'result need';
    el.innerHTML = `<p class="prompt">${esc(r.title)}</p>${r.details.map(d => `<p class="hint">${esc(d)}</p>`).join('')}`;
    return;
  }
  const risk = r.risk || {};
  const hasNums = risk.imm != null || risk.five != null;
  el.className = 'result ' + r.level;
  el.innerHTML = `
    <div class="action"><span class="eyebrow">Recommendation</span><h2>${esc(r.title)}</h2></div>
    ${hasNums ? `<div class="risks">
      <div><span class="num">${fmt(risk.imm)}</span><span class="lbl">${risk.immLabel || 'Immediate'} CIN 3+ risk</span></div>
      <div><span class="num">${fmt(risk.five)}</span><span class="lbl">${risk.fiveLabel || '5-year'} CIN 3+ risk</span></div>
    </div>` : ''}
    ${r.details.length ? `<ul class="details">${r.details.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
    ${risk.source ? `<p class="source">${esc(risk.source)}</p>` : ''}
    <button type="button" id="copy" class="copy">Copy summary</button>`;
  document.getElementById('copy').onclick = () => copySummary(visible, r);
}

function copySummary(visible, r) {
  const parts = visible.map(fd => {
    if (fd.multi) { const on = fd.options.filter(o => state[o[0]]).map(o => o[1]); return on.length ? on.join(', ') : null; }
    const o = fd.options.find(o => o[0] === state[fd.key]);
    return o ? `${fd.label}: ${o[1]}` : null;
  }).filter(Boolean);
  const risk = r.risk || {};
  const lines = [
    'Cervical screening management (2019 ASCCP risk-based guidelines)',
    parts.join('; '),
    'Recommendation: ' + r.title,
  ];
  if (risk.imm != null || risk.five != null)
    lines.push(`CIN 3+ risk: ${risk.immLabel || 'immediate'} ${fmt(risk.imm)}, ${risk.fiveLabel || '5-year'} ${fmt(risk.five)}`);
  if (risk.source) lines.push('Source: ' + risk.source);
  const btn = document.getElementById('copy');
  navigator.clipboard.writeText(lines.join('\n')).then(
    () => { btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = 'Copy summary'; }, 1500); },
    () => { btn.textContent = 'Copy failed'; });
}

function render() {
  const visible = prune();
  renderForm(visible);
  renderResult(visible);
}

if (typeof document !== 'undefined') {
  document.getElementById('form').addEventListener('change', e => {
    const t = e.target;
    if (t.type === 'checkbox') state[t.value] = t.checked || undefined;
    else state[t.name] = t.value;
    render();
  });

  document.getElementById('reset').addEventListener('click', () => {
    for (const k of Object.keys(state)) delete state[k];
    state.age = '25+';
    render();
  });

  render();
} else {
  module.exports = { fields }; // test.js walks every path the form can produce
}
