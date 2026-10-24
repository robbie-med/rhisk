// rhisk — UI. All clinical logic lives in guidelines.js (manage()).
const state = { age: '25+' };

const HPV_SCREEN = [['neg', 'Negative'], ['pos', 'Positive', 'other / untyped'], ['16', 'HPV 16+'], ['18', 'HPV 18+'], ['none', 'Not done']];
const HPV_BASIC = [['neg', 'Negative'], ['pos', 'Positive'], ['none', 'Not done']];
const CYTO = [['nilm', 'NILM'], ['ascus', 'ASC-US'], ['lsil', 'LSIL'], ['asch', 'ASC-H'], ['agc', 'AGC'], ['hsil', 'HSIL+']];
const CYTO_NONE = ['none', 'Not done', 'HPV test only'];

function fields(s) {
  const f = [
    { key: 'age', label: 'Age', options: [['25+', '25 or older'], ['u25', 'Under 25']] },
    { key: 'situation', label: 'Clinical situation', options: [
      ['screen', 'Screening result'],
      ['biopsy', 'Colposcopy biopsy result'],
      ['postcolpo', 'Follow-up after colposcopy', 'biopsy <CIN 2'],
      ['posttx', 'Follow-up after treatment', 'treated CIN 2 / CIN 3']] },
  ];
  const cyto = withNone => ({ key: 'cyto', label: 'Current cytology', options: withNone ? CYTO.concat([CYTO_NONE]) : CYTO });

  if (s.situation === 'screen' && s.age !== 'u25') {
    f.push({ key: 'history', label: 'Most recent prior HPV result', hint: 'Within ~5 years. A prior negative cytology alone does not count.', options: [
      ['unknown', 'None on record'], ['hpvneg', 'HPV-negative', 'or negative cotest'],
      ['hpvneg_ascus', 'HPV-negative ASC-US'], ['hpvneg_lsil', 'HPV-negative LSIL'], ['hpvpos_nilm', 'HPV-positive NILM']] });
    f.push({ key: 'hpv', label: 'Current HPV', options: HPV_SCREEN });
    f.push(cyto(s.hpv && s.hpv !== 'none'));
  } else if (s.situation === 'screen') {
    f.push({ key: 'visit', label: 'This result is', options: [
      ['initial', 'A new result'], ['y1', '1-year repeat', 'after ASC-US/LSIL'], ['y2', '2-year repeat', 'after ASC-US/LSIL']] });
    f.push(cyto(false));
    if (s.cyto === 'ascus' && s.visit === 'initial') f.push({ key: 'hpv', label: 'Reflex HPV', options: HPV_BASIC });
  } else if (s.situation === 'biopsy') {
    f.push({ key: 'biopsy', label: 'Biopsy result', options: [
      ['neg', '<CIN 1', 'normal'], ['cin1', 'CIN 1', 'LSIL'], ['cin2', 'CIN 2'], ['cin3', 'CIN 3'],
      ['hsil_nos', 'HSIL', 'CIN 2 vs 3 not specified'], ['ais', 'AIS'], ['cancer', 'Cancer']] });
    if (s.biopsy === 'neg' || s.biopsy === 'cin1') f.push({ key: 'referral', label: 'Result that led to colposcopy', options: [
      ['nilm', 'HPV+ NILM', 'persistent, or HPV 16/18'], ['ascus', 'ASC-US', 'HPV+'], ['lsil', 'LSIL'],
      ['asch', 'ASC-H'], ['agc', 'AGC'], ['hsil', 'HSIL']] });
  } else if (s.situation === 'postcolpo') {
    f.push({ key: 'grade', label: 'Result that led to colposcopy', options: [
      ['low', 'Low-grade', 'HPV+ NILM, ASC-US, LSIL'], ['high', 'High-grade', 'ASC-H, AGC, HSIL']] });
    if (s.age !== 'u25') f.push({ key: 'hpv', label: 'Current HPV', options: HPV_BASIC });
    f.push(cyto(s.age !== 'u25' && s.hpv && s.hpv !== 'none'));
  } else if (s.situation === 'posttx') {
    f.push({ key: 'priorNeg', label: 'Negative HPV-based tests since treatment', options: [
      ['0', 'None yet', 'first follow-up'], ['1', 'One'], ['2', 'Two or more']] });
    f.push({ key: 'hpv', label: 'Current HPV', options: HPV_BASIC });
    f.push(cyto(s.hpv && s.hpv !== 'none'));
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
      <div><span class="num">${fmt(risk.five)}</span><span class="lbl">5-year CIN 3+ risk</span></div>
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
    lines.push(`CIN 3+ risk: ${risk.immLabel || 'immediate'} ${fmt(risk.imm)}, 5-year ${fmt(risk.five)}`);
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
