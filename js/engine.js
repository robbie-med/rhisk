// papcalc — algorithm engine
// Safe, no-eval expression evaluator for ASCCP guideline decision trees
const Engine = (function() {
  let jsonData = null;
  let vars = {};
  const reservedVars = ['clinical_situation','patient_age','_patient_age','diagnosis','algorithm'];

  // ----- Expression evaluator -----

  function isTruthy(v) {
    if (v === true || v === 'true') return true;
    if (v === false || v === 'false' || v === null || v === undefined || v === '') return false;
    return !!v;
  }

  function is_hpv_positive(v) {
    if (!v || v === '' || v === 'None' || v === 'HPV-') return false;
    return v.startsWith('HPV+') || v.includes('16') || v.includes('18') || v === 'Positive';
  }

  // Split an expression on a top-level operator (not inside parens)
  function splitOp(expr, op) {
    const parts = [];
    let depth = 0;
    let last = 0;
    const oplen = op.length;
    for (let i = 0; i < expr.length; i++) {
      const c = expr[i];
      if (c === '(') depth++;
      else if (c === ')') depth--;
      else if (depth === 0 && expr.substring(i, i + oplen) === op) {
        parts.push(expr.substring(last, i).trim());
        last = i + oplen;
        i += oplen - 1;
      }
    }
    parts.push(expr.substring(last).trim());
    return parts.filter(p => p.length > 0);
  }

  // Find top-level operator position
  function findOp(expr, op, from) {
    from = from || 0;
    let depth = 0;
    for (let i = from; i < expr.length; i++) {
      const c = expr[i];
      if (c === '(') depth++;
      else if (c === ')') depth--;
      else if (depth === 0 && expr.substring(i, i + op.length) === op) return i;
    }
    return -1;
  }

  function evaluateExpr(expr) {
    if (expr === undefined || expr === null || expr === '') return '';
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr === true || expr === false) return expr;
    if (typeof expr === 'number') return expr;
    return evalTernary(String(expr));
  }

  function evalTernary(expr) {
    expr = expr.trim();
    const qpos = findOp(expr, '?');
    if (qpos >= 0) {
      const cpos = findOp(expr, ':', qpos + 1);
      if (cpos >= 0) {
        const cond = expr.substring(0, qpos).trim();
        const t = expr.substring(qpos + 1, cpos).trim();
        const f = expr.substring(cpos + 1).trim();
        return isTruthy(evalOr(cond)) ? evalTernary(t) : evalTernary(f);
      }
    }
    return evalOr(expr);
  }

  function evalOr(expr) {
    const parts = splitOp(expr, '||');
    if (parts.length === 1) return evalAnd(parts[0]);
    for (const p of parts) {
      if (isTruthy(evalAnd(p))) return true;
    }
    return false;
  }

  function evalAnd(expr) {
    const parts = splitOp(expr, '&&');
    if (parts.length === 1) return evalCmp(parts[0]);
    for (const p of parts) {
      if (!isTruthy(evalCmp(p))) return false;
    }
    return true;
  }

  function evalCmp(expr) {
    expr = expr.trim();

    // ! prefix
    if (expr.startsWith('!(') && expr.endsWith(')')) {
      return !isTruthy(evalTernary(expr.substring(2, expr.length - 1)));
    }
    if (expr.startsWith('!')) {
      return !isTruthy(evalCmp(expr.substring(1)));
    }

    // Parenthesized expression
    if (expr.startsWith('(') && expr.endsWith(')')) {
      let depth = 0, wraps = true;
      for (let i = 0; i < expr.length - 1; i++) {
        if (expr[i] === '(') depth++;
        else if (expr[i] === ')') depth--;
        if (depth === 0) { wraps = false; break; }
      }
      if (wraps) return evalTernary(expr.substring(1, expr.length - 1));
    }

    // Arithmetic addition
    if (expr.includes('+') && findOp(expr, '+') >= 0) {
      let sum = 0;
      for (const p of splitOp(expr, '+')) {
        const v = evalCmp(p);
        sum += (v === true ? 1 : (typeof v === 'number' ? v : 0));
      }
      return sum;
    }

    // Comparisons
    const cmps = ['===', '!==', '>=', '<=', '>', '<', '==', '!='];
    for (const op of cmps) {
      const pos = findOp(expr, op);
      if (pos >= 0) {
        const left = evalAtomic(expr.substring(0, pos).trim());
        const right = evalAtomic(expr.substring(pos + op.length).trim());
        switch (op) {
          case '===': return left === right;
          case '!==': return left !== right;
          case '==': return left == right;
          case '!=': return left != right;
          case '>=': return Number(left) >= Number(right);
          case '<=': return Number(left) <= Number(right);
          case '>': return Number(left) > Number(right);
          case '<': return Number(left) < Number(right);
        }
      }
    }

    return evalAtomic(expr);
  }

  function evalAtomic(expr) {
    expr = expr.trim();
    if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);
    if ((expr.startsWith("'") && expr.endsWith("'")) || (expr.startsWith('"') && expr.endsWith('"'))) {
      return expr.slice(1, -1);
    }

    // _v suffix: variable is set and truthy
    if (expr.endsWith('_v')) {
      // Check if the _v variable itself exists in vars (explicitly set)
      if (expr in vars) return vars[expr];
      const name = expr.slice(0, -2);
      const val = vars[name];
      return val !== undefined && val !== null && val !== '' && val !== false;
    }

    // .length
    if (expr.endsWith('.length')) {
      const name = expr.slice(0, -7);
      return vars[name] ? String(vars[name]).length : 0;
    }

    // .startsWith('...')
    const swMatch = expr.match(/^(\w+)\.startsWith\(['"]([^'"]+)['"]\)$/);
    if (swMatch) return vars[swMatch[1]] ? String(vars[swMatch[1]]).startsWith(swMatch[2]) : false;

    // .indexOf('...')
    const ioMatch = expr.match(/^(\w+)\.indexOf\(['"]([^'"]+)['"]\)$/);
    if (ioMatch) return vars[ioMatch[1]] ? String(vars[ioMatch[1]]).indexOf(ioMatch[2]) : -1;

    // .includes('...')
    const incMatch = expr.match(/^(\w+)\.includes\(['"]([^'"]+)['"]\)$/);
    if (incMatch) return vars[incMatch[1]] ? String(vars[incMatch[1]]).includes(incMatch[2]) : false;

    // Array literal: ['a', 'b', 'c'].indexOf(var) or similar
    const arrIdxMatch = expr.match(/^\[([^\]]+)\]\.indexOf\((\w+)\)$/);
    if (arrIdxMatch) {
      const items = arrIdxMatch[1].split(',').map(s => {
        s = s.trim();
        if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
          return s.slice(1, -1);
        }
        return s;
      });
      const target = vars[arrIdxMatch[2]];
      return items.indexOf(target);
    }

    // Array literal: ['a', 'b'].includes(var)
    const arrIncMatch = expr.match(/^\[([^\]]+)\]\.includes\((\w+)\)$/);
    if (arrIncMatch) {
      const items = arrIncMatch[1].split(',').map(s => {
        s = s.trim();
        if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
          return s.slice(1, -1);
        }
        return s;
      });
      const target = vars[arrIncMatch[2]];
      return items.includes(target);
    }

    // Registered function calls: funcName(arg1, arg2, ...)
    const funcMatch = expr.match(/^(\w+)\((.+)\)$/);
    if (funcMatch) console.log('FUNC_CALL:', funcMatch[1], 'args:', funcMatch[2], 'registered:', !!funcRegistry[funcMatch[1]]);
    if (funcMatch && funcRegistry[funcMatch[1]]) {
      const funcName = funcMatch[1];
      const argsStr = funcMatch[2];
      // Split args by comma (handle nested calls by tracking parens depth)
      const args = [];
      let depth = 0, last = 0;
      for (let i = 0; i < argsStr.length; i++) {
        if (argsStr[i] === '(') depth++;
        else if (argsStr[i] === ')') depth--;
        else if (argsStr[i] === ',' && depth === 0) {
          args.push(argsStr.substring(last, i).trim());
          last = i + 1;
        }
      }
      args.push(argsStr.substring(last).trim());
      const result = callFunction(funcName, args.map(a => evalAtomic(a)));
      console.log('FUNC_RESULT:', funcName, '=>', result);
      return result;
    }

    // Variable lookup
    if (expr in vars) return vars[expr];
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr === 'undefined') return undefined;
    return expr;
  }

  // ----- Algorithm management -----

  function setAlgorithm(data) {
    jsonData = data;
    const varKeys = Object.keys(data.variables);
    for (const k of varKeys) initializeVariable(k, data.variables[k]);
    // Clear old vars not in new algorithm
    for (const k of Object.keys(vars)) {
      if (!varKeys.includes(k) && !reservedVars.includes(k)) {
        setVariable(k, undefined);
      }
    }
  }

  function setVariable(id, value) {
    if (vars[id] === value) return;
    vars[id] = value;
  }

  function getVariable(id) {
    return vars[id] ?? null;
  }

  function initializeVariable(id, value) {
    if (!(id in vars)) setVariable(id, value);
  }

  // Registry for user-defined functions from algorithm data
  const funcRegistry = {};

  // Default built-in functions (can be overridden by algorithm data)
  funcRegistry['is_hpv_positive'] = {
    params: ['r'],
    body: 'r && r !== "" && r !== "None" && r !== "HPV-" && (r.startsWith("HPV+") || r.includes("16") || r.includes("18") || r === "Positive")'
  };

  // Parse and register function definitions like "name = (a, b) => body"
  function registerFunction(expr) {
    const match = expr.match(/^(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*(.+)$/);
    if (match) {
      const [, name, params, body] = match;
      const paramList = params.split(',').map(p => p.trim()).filter(Boolean);
      funcRegistry[name] = { params: paramList, body: body.trim() };
    }
  }

  // Call a registered function
  function callFunction(name, args) {
    const fn = funcRegistry[name];
    if (!fn) return undefined;

    // Save current vars state and temporarily set parameter values
    const saved = {};
    for (let i = 0; i < fn.params.length; i++) {
      saved[fn.params[i]] = vars[fn.params[i]];
      vars[fn.params[i]] = args[i] !== undefined ? args[i] : null;
    }

    const result = evaluateExpr(fn.body);

    // Restore
    for (let i = 0; i < fn.params.length; i++) {
      if (saved[fn.params[i]] !== undefined) {
        vars[fn.params[i]] = saved[fn.params[i]];
      } else {
        delete vars[fn.params[i]];
      }
    }

    return result;
  }

  function evaluateDerived() {
    if (!jsonData) return;
    for (const derived of jsonData.derived) {
      for (const [key, expr] of Object.entries(derived)) {
        if (key.startsWith('function')) {
          registerFunction(expr);
          continue;
        }
        setVariable(key, evaluateExpr(expr));
      }
    }
  }

  function evaluateSection(state) {
    if (!jsonData) return null;
    for (const section of jsonData.sections) {
      if (section.state === state && isTruthy(evaluateExpr(section.valid))) {
        return section;
      }
    }
    return null;
  }

  function formatText(text) {
    if (typeof text === 'string') return [text];
    const result = [];
    if (Array.isArray(text)) {
      for (const item of text) {
        if (isTruthy(evaluateExpr(item.visible))) result.push(item.text);
      }
    }
    return result;
  }

  function evaluateChoices(choices) {
    const result = [];
    if (!choices) return result;
    for (const c of choices) {
      let visible = true;
      if (c.visible) visible = isTruthy(evaluateExpr(c.visible));
      let enabled = true;
      if (c.enabled && c.enabled !== 'true') enabled = isTruthy(evaluateExpr(c.enabled));
      if (c.enabled === false || c.enabled === 'false') enabled = false;
      if (visible) {
        result.push({
          text: c.text, value: c.value !== undefined ? c.value : c.text,
          enabled, img: c.img, alts: c.alts
        });
      }
    }
    return result;
  }

  function evaluateChecked(id) {
    const prefix = id + '_';
    const result = [];
    for (const [key, val] of Object.entries(vars)) {
      if (key.startsWith(prefix) && !key.endsWith('_v') && val === true) {
        result.push(key.substring(prefix.length));
      }
    }
    return result;
  }

  function evaluateItems(content) {
    const results = [];
    for (const item of content) {
      const visible = isTruthy(evaluateExpr(item.visible, item.calc));
      if (item.id) setVariable(item.id.replace('_raw', '') + '_v', visible);
      if (!visible) continue;

      let text = item.text;
      if (item.varInsert) {
        for (const vi of item.varInsert) {
          text = String(text).replace('<var>', evaluateExpr(vi));
        }
      }

      const choices = evaluateChoices(item.choices);
      const result = {
        id: item.id, type: item.type, title: item.title, style: item.style,
        text: formatText(text), choices,
        value: vars[item.id],
        checked: (item.type === 'checkboxes' || item.type === 'switch') ? evaluateChecked(item.id) : undefined,
        info: item.info, reference: item.reference, populations: item.populations,
        risk: item.risk, risk_figure: item.risk_figure, risk_of: item.risk_of,
        risk_reference: item.risk_reference, risk_info: item.risk_info, figure: item.figure,
      };

      if (item.type === 'derived' && item.id) {
        setVariable(item.id, evaluateExpr(item.value));
        continue;
      }
      results.push(result);
    }
    return results;
  }

  function evaluateContent(section) {
    return {
      uid: section.uid, title: section.title, type: section.type,
      figure: section.figure,
      content: evaluateItems(section.content),
      branch: section.branch,
      variables: { ...vars }
    };
  }

  function reevaluate(state) {
    evaluateDerived();
    const section = evaluateSection(state);
    if (!section) {
      return {
        title: 'Recommendation', type: null, figure: ['n/a'],
        content: [{ visible: true, type: 'overlay', text: 'No recommendation; use clinical judgment.' }],
        branch: '', variables: { ...vars }
      };
    }
    return evaluateContent(section);
  }

  function startOver() {
    if (jsonData) {
      const data = jsonData;
      jsonData = null;
      vars = {};
      setAlgorithm(data);
    }
  }

  function reset() {
    jsonData = null;
    vars = {};
  }

  function getVars() { return { ...vars }; }
  function setVars(v) { vars = { ...v }; }

  return {
    setAlgorithm, setVariable, getVariable, reevaluate, startOver, reset,
    getVars, setVars,
    get jsonData() { return jsonData; },
  };
})();
