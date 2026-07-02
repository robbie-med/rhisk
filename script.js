// ASCCP 2019 Risk Calculator
// Risk estimates from Egemen et al. J Low Genit Tract Dis 2020;24(2):132-143
// Tables 1a/1b (immediate CIN3+ risk) and Table 2a (5-year CIN3+ risk)

const RISK = {
    COLPOSCOPY: 4.0,            // immediate CIN3+ ≥4% → colposcopy
    TREATMENT_ACCEPTABLE: 25.0, // ≥25% → treatment acceptable
    TREATMENT_PREFERRED: 60.0,  // ≥60% → expedited treatment preferred
    FIVE_YR_SCREENING: 0.15,    // 5yr risk ≤0.15% → routine screening
    FIVE_YR_3YR_FU: 0.55,       // 5yr risk <0.55% → 3yr surveillance (else 1yr)
};

// --- Risk tables: { immediate, fiveYear } ---
// Source: Egemen 2020 Tables 1a/2a (unknown/no prior HPV history)
const TABLE_DEFAULT = {
    'NILM_negative':       { immediate: 0.08, fiveYear: 0.15 },
    'NILM_other-hr':       { immediate: 1.1,  fiveYear: 0.60 },
    'NILM_16-18':          { immediate: 2.6,  fiveYear: 1.1 },
    'ASC-US_negative':     { immediate: 0.4,  fiveYear: 0.41 },
    'ASC-US_other-hr':     { immediate: 3.9,  fiveYear: 1.5 },
    'ASC-US_16-18':        { immediate: 5.2,  fiveYear: 2.7 },
    'LSIL_negative':       { immediate: 2.0,  fiveYear: 1.4 },
    'LSIL_other-hr':       { immediate: 5.2,  fiveYear: 3.0 },
    'LSIL_16-18':          { immediate: 6.1,  fiveYear: 5.2 },
    'ASC-H_negative':      { immediate: 3.4,  fiveYear: 4.2 },
    'ASC-H_other-hr':      { immediate: 18.4, fiveYear: 23.0 },
    'ASC-H_16-18':         { immediate: 26.1, fiveYear: 35.0 },
    'HSIL_negative':       { immediate: 2.1,  fiveYear: 3.7 },
    'HSIL_other-hr':       { immediate: 45.4, fiveYear: 55.0 },
    'HSIL_16-18':          { immediate: 49.4, fiveYear: 67.0 },
    'AGC_negative':        { immediate: 4.7,  fiveYear: 5.1 },
    'AGC_other-hr':        { immediate: 12.5, fiveYear: 15.3 },
    'AGC_16-18':           { immediate: 22.5, fiveYear: 27.8 },
    'AGC-favor-neoplasia_negative':  { immediate: 18.7, fiveYear: 20.0 },
    'AGC-favor-neoplasia_other-hr':  { immediate: 28.1, fiveYear: 31.0 },
    'AGC-favor-neoplasia_16-18':     { immediate: 52.8, fiveYear: 58.0 },
    'AIS_negative':        { immediate: 48.2, fiveYear: 50.0 },
    'AIS_other-hr':        { immediate: 55.7, fiveYear: 58.0 },
    'AIS_16-18':           { immediate: 69.3, fiveYear: 72.0 },
};

// Source: Egemen 2020 Table 1b (prior HPV negative within 5 years)
const TABLE_PRIOR_NEG = {
    'NILM_negative':       { immediate: 0.04, fiveYear: 0.08 },
    'NILM_other-hr':       { immediate: 0.97, fiveYear: 0.50 },
    'NILM_16-18':          { immediate: 2.0,  fiveYear: 0.88 },
    'ASC-US_negative':     { immediate: 0.28, fiveYear: 0.28 },
    'ASC-US_other-hr':     { immediate: 3.5,  fiveYear: 1.3 },
    'ASC-US_16-18':        { immediate: 3.9,  fiveYear: 2.2 },
    'LSIL_negative':       { immediate: 2.0,  fiveYear: 1.4 },
    'LSIL_other-hr':       { immediate: 5.2,  fiveYear: 3.0 },
    'LSIL_16-18':          { immediate: 5.1,  fiveYear: 4.0 },
    'ASC-H_negative':      { immediate: 3.4,  fiveYear: 4.2 },
    'ASC-H_other-hr':      { immediate: 18.4, fiveYear: 23.0 },
    'ASC-H_16-18':         { immediate: 26.1, fiveYear: 35.0 },
    'HSIL_negative':       { immediate: 2.1,  fiveYear: 3.7 },
    'HSIL_other-hr':       { immediate: 45.4, fiveYear: 55.0 },
    'HSIL_16-18':          { immediate: 49.4, fiveYear: 67.0 },
    'AGC_negative':        { immediate: 3.5,  fiveYear: 3.9 },
    'AGC_other-hr':        { immediate: 12.5, fiveYear: 15.3 },
    'AGC_16-18':           { immediate: 22.5, fiveYear: 27.8 },
    'AGC-favor-neoplasia_negative':  { immediate: 18.7, fiveYear: 20.0 },
    'AGC-favor-neoplasia_other-hr':  { immediate: 28.1, fiveYear: 31.0 },
    'AGC-favor-neoplasia_16-18':     { immediate: 52.8, fiveYear: 58.0 },
    'AIS_negative':        { immediate: 48.2, fiveYear: 50.0 },
    'AIS_other-hr':        { immediate: 55.7, fiveYear: 58.0 },
    'AIS_16-18':           { immediate: 69.3, fiveYear: 72.0 },
};

// --- HPV category mapping ---
// Map HTML select values to the 3-group clinical-action categories
function hpvGroup(hpvResult) {
    switch (hpvResult) {
        case 'negative':        return 'negative';
        case 'not-done':        return 'not-done';
        case 'positive-16':
        case 'positive-18':
        case 'positive-16-18':  return '16-18';
        case 'positive-other-hr':
        case 'positive-unknown': return 'other-hr';
        default:                return 'other-hr';
    }
}

function riskKey(cytology, hpvGroup) {
    // Normalize cytology values with spaces/hyphens
    const cyto = cytology.replace(/\s+/g, '-').replace('+', '');
    return `${cyto}_${hpvGroup}`;
}

// --- App state ---
let currentStep = 1;
const totalSteps = 4;
let formData = {};

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        updateThemeIcon(true);
    }
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('treatmentHistory').addEventListener('change', toggleTreatmentDate);
    document.getElementById('clinicalSituation').addEventListener('change', toggleClinicalSituationFields);
    document.getElementById('colpoBiopsy').addEventListener('change', toggleColpoBiopsyFields);
    addValidationListeners();
    updateProgressBar();
    toggleClinicalSituationFields(); // initial state
});

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
    document.querySelector('.sun-icon').style.display = isDark ? 'none' : 'block';
    document.querySelector('.moon-icon').style.display = isDark ? 'block' : 'none';
}

// --- Validation ---
function addValidationListeners() {
    document.getElementById('age').addEventListener('input', validateAge);
    ['clinicalSituation', 'cytology', 'hpvResult'].forEach(id => {
        document.getElementById(id).addEventListener('change', e => validateRequired(e));
    });
}

function validateAge(e) {
    const age = parseInt(e.target.value);
    if (!e.target.value) return showError(e.target, 'Age is required');
    if (age < 21 || age > 100) return showError(e.target, 'Age must be 21–100');
    clearError(e.target);
}

function validateRequired(e) {
    if (!e.target.value) showError(e.target, 'Required');
    else clearError(e.target);
}

function showError(input, msg) {
    input.classList.add('error');
    const el = input.nextElementSibling;
    if (el && el.classList.contains('error-message')) {
        el.textContent = msg;
        el.classList.add('show');
    }
}

function clearError(input) {
    input.classList.remove('error');
    const el = input.nextElementSibling;
    if (el && el.classList.contains('error-message')) {
        el.textContent = '';
        el.classList.remove('show');
    }
}

function validateStep(step) {
    let ok = true;
    if (step === 1) {
        ['age', 'clinicalSituation', 'cytology', 'hpvResult'].forEach(id => {
            const f = document.getElementById(id);
            if (!f.value) { showError(f, 'Required'); ok = false; }
            else if (id === 'age') {
                const a = parseInt(f.value);
                if (a < 21 || a > 100) { showError(f, 'Age must be 21–100'); ok = false; }
            }
        });
    }
    return ok;
}

// --- Step navigation ---
function nextStep() {
    if (!validateStep(currentStep)) return;
    saveStepData();
    if (currentStep < totalSteps - 1) advanceStep(currentStep + 1);
}

function previousStep() {
    if (currentStep > 1) {
        saveStepData();
        advanceStep(currentStep - 1);
    }
}

function advanceStep(step) {
    document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.remove('active');
    currentStep = step;
    document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.add('active');
    updateProgressBar();
    updateNavigation();
}

function updateProgressBar() {
    const pct = (currentStep / totalSteps) * 100;
    document.getElementById('progressFill').style.width = `${pct}%`;
    document.querySelectorAll('.progress-step').forEach((s, i) => {
        const n = i + 1;
        s.classList.remove('active', 'completed');
        if (n < currentStep) { s.classList.add('completed'); s.querySelector('.step-circle').textContent = '✓'; }
        else if (n === currentStep) { s.classList.add('active'); s.querySelector('.step-circle').textContent = n; }
        else { s.querySelector('.step-circle').textContent = n; }
    });
}

function updateNavigation() {
    const prev = document.getElementById('prevBtn');
    const next = document.getElementById('nextBtn');
    const calc = document.getElementById('calculateBtn');
    const reset = document.getElementById('resetBtn');
    prev.style.display = currentStep > 1 ? '' : 'none';
    if (currentStep === totalSteps - 1) { next.style.display = 'none'; calc.style.display = ''; reset.style.display = 'none'; }
    else if (currentStep === totalSteps) { next.style.display = 'none'; calc.style.display = 'none'; reset.style.display = ''; }
    else { next.style.display = ''; calc.style.display = 'none'; reset.style.display = 'none'; }
}

function toggleTreatmentDate() {
    document.getElementById('treatmentDateGroup').style.display =
        document.getElementById('treatmentHistory').value !== 'none' ? 'block' : 'none';
}

function toggleClinicalSituationFields() {
    const sit = document.getElementById('clinicalSituation').value;
    const isPostColpo = sit === 'post-colposcopy';
    document.getElementById('postColposcopyFields').style.display = isPostColpo ? 'block' : 'none';
    document.getElementById('standardHistoryFields').style.display = isPostColpo ? 'none' : 'block';
    document.getElementById('step2Heading').textContent = isPostColpo
        ? 'Post-Colposcopy Management' : 'Screening & Colposcopy History';
    // Also toggle step 1 cytology/HPV fields — post-colpo still needs these for HPV status
    const cytoLabel = document.querySelector('label[for="cytology"]');
    if (cytoLabel) {
        if (isPostColpo) {
            cytoLabel.innerHTML = 'Current Cytology <span class="required">*</span>';
            document.querySelector('label[for="hpvResult"]').innerHTML = 'Current HPV Result <span class="required">*</span>';
        } else {
            cytoLabel.innerHTML = 'Cytology Result <span class="required">*</span>';
            document.querySelector('label[for="hpvResult"]').innerHTML = 'HPV Test Result <span class="required">*</span>';
        }
    }
}

function toggleColpoBiopsyFields() {
    const biopsy = document.getElementById('colpoBiopsy').value;
    document.getElementById('precedingCytologyGroup').style.display =
        (biopsy === 'cin1') ? 'block' : 'none';
    document.getElementById('excisionMarginsGroup').style.display =
        (biopsy === 'cin2' || biopsy === 'cin3') ? 'block' : 'none';
}

function saveStepData() {
    const el = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    el.querySelectorAll('input, select, textarea').forEach(input => {
        if (input.type === 'checkbox') {
            if (!formData[input.name]) formData[input.name] = [];
            if (input.checked) { if (!formData[input.name].includes(input.value)) formData[input.name].push(input.value); }
            else { formData[input.name] = formData[input.name].filter(v => v !== input.value); }
        } else {
            formData[input.name] = input.value;
        }
    });
}

// --- Risk calculation ---
function calculateRisk() {
    if (!validateStep(currentStep)) return;
    saveStepData();

    document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.remove('active');
    currentStep = totalSteps;
    document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.add('active');
    updateProgressBar();
    updateNavigation();

    // Instant calculation — no delay
    const results = performRiskCalculation();
    displayResults(results);
    document.getElementById('resultsContent').style.display = 'block';

    // Animate gauge after display
    setTimeout(() => animateGauge(results), 50);
}

function performRiskCalculation() {
    const age = parseInt(formData.age);
    const clinicalSituation = formData.clinicalSituation;
    const cytology = formData.cytology;
    const hpvResult = formData.hpvResult;
    const hasSymptoms = formData.symptoms && formData.symptoms.includes('visible-lesion');
    const isPregnant = formData.specialPopulation && formData.specialPopulation.includes('pregnant');
    const isImmuno = formData.specialPopulation && formData.specialPopulation.includes('immunocompromised');
    const hasBeenTreated = formData.treatmentHistory !== 'none';
    const hasPriorNegHpv = formData.priorHpvNegative === 'within-1-year' || formData.priorHpvNegative === '1-5-years';

    // Route to post-colposcopy management
    if (clinicalSituation === 'post-colposcopy') {
        return postColposcopyManagement(age, cytology, hpvResult, formData, isPregnant);
    }

    // Select risk table
    const table = hasPriorNegHpv ? TABLE_PRIOR_NEG : TABLE_DEFAULT;
    const group = hpvGroup(hpvResult);
    const key = riskKey(cytology, group);
    const risk = table[key] || { immediate: null, fiveYear: null };

    // Fallback: if HPV not done, use cytology-only guidance
    if (group === 'not-done') {
        return handleHpvNotDone(age, cytology, isPregnant, isImmuno, hasSymptoms);
    }

    let immediate = risk.immediate;
    let fiveYear = risk.fiveYear;
    let management, details, riskCategory;

    // ---- Clinical overrides: cytology-driven mandatory actions ----

    // AIS → diagnostic excision always
    if (cytology === 'AIS' || cytology === 'AIS-favor-neoplasia') {
        return {
            immediateRisk: immediate, fiveYearRisk: fiveYear,
            riskCategory: 'very-high',
            management: 'Diagnostic excisional procedure recommended',
            details: 'AIS cytology requires diagnostic excision regardless of HPV status or risk estimate. Endocervical and endometrial sampling indicated. If excision negative, consider hysterectomy after childbearing complete.',
            specialConsiderations: isPregnant ? ['Expedited colposcopy; defer excision until postpartum'] : [],
            formData
        };
    }

    // AGC → colposcopy + endometrial sampling
    if (cytology === 'AGC' || cytology === 'AGC-favor-neoplasia') {
        riskCategory = immediate >= RISK.TREATMENT_PREFERRED ? 'very-high' : 'high';
        management = 'Colposcopy with endocervical sampling';
        details = 'Colposcopy with endocervical sampling recommended for all AGC. ';
        if (age >= 35) details += 'Endometrial biopsy indicated (age ≥35). ';
        if (cytology === 'AGC-favor-neoplasia') details += 'If initial evaluation negative, consider diagnostic excisional procedure.';
        if (isPregnant) details += ' Colposcopy safe in pregnancy; defer endometrial sampling until postpartum.';
        return { immediateRisk: immediate, fiveYearRisk: fiveYear, riskCategory, management, details, specialConsiderations: [], formData };
    }

    // ASC-H → always colposcopy (ASCCP: risk generally exceeds threshold)
    if (cytology === 'ASC-H') {
        management = 'Colposcopy recommended';
        details = `ASC-H cytology carries immediate CIN3+ risk of ${immediate}% — colposcopy is indicated regardless of HPV status.`;
        if (immediate >= RISK.TREATMENT_ACCEPTABLE) {
            management = 'Expedited treatment or colposcopy acceptable';
            details = `Immediate CIN3+ risk ${immediate}% (≥25%). Shared decision-making: colposcopy with biopsy vs expedited excisional treatment. ${isPregnant ? 'Colposcopy only — treatment contraindicated in pregnancy.' : ''}`;
        }
        return { immediateRisk: immediate, fiveYearRisk: fiveYear, riskCategory: 'high', management, details, specialConsiderations: isPregnant ? ['No ECC in pregnancy'] : [], formData };
    }

    // HSIL+ → expedited treatment pathway
    if (cytology === 'HSIL') {
        if (immediate >= RISK.TREATMENT_PREFERRED) {
            management = isPregnant ? 'Colposcopy (defer treatment until postpartum)' : 'Expedited treatment preferred';
            details = `Immediate CIN3+ risk ${immediate}% (≥60%). ${isPregnant ? 'Treatment contraindicated in pregnancy — colposcopy for diagnosis, defer treatment.' : 'Excisional treatment preferred for non-pregnant patients ≥25. Colposcopy acceptable if patient prefers.'}`;
            return { immediateRisk: immediate, fiveYearRisk: fiveYear, riskCategory: 'very-high', management, details, specialConsiderations: age < 25 ? ['Age <25: avoid expedited treatment; colposcopy preferred'] : [], formData };
        }
        if (immediate >= RISK.TREATMENT_ACCEPTABLE) {
            management = isPregnant ? 'Colposcopy' : 'Colposcopy or expedited treatment';
            details = `Immediate CIN3+ risk ${immediate}% (≥25%). ${isPregnant ? 'Colposcopy only.' : 'Shared decision-making between colposcopy and expedited treatment.'}`;
            return { immediateRisk: immediate, fiveYearRisk: fiveYear, riskCategory: 'high', management, details, specialConsiderations: [], formData };
        }
        // HSIL with low risk (rare — HPV negative scenario)
        management = 'Colposcopy recommended';
        details = `HSIL cytology warrants colposcopy regardless of risk estimate (${immediate}%). Although below the 4% immediate-risk colposcopy threshold, HSIL is considered high-grade and colposcopy is the standard of care.`;
        return { immediateRisk: immediate, fiveYearRisk: fiveYear, riskCategory: 'high', management, details, specialConsiderations: [], formData };
    }

    // Visible lesion → immediate evaluation always
    if (hasSymptoms) {
        return {
            immediateRisk: immediate, fiveYearRisk: fiveYear,
            riskCategory: 'high',
            management: 'Immediate evaluation — visible cervical lesion',
            details: 'Visible cervical lesion requires direct visualization and biopsy regardless of cytology/HPV results. Risk estimate provided for reference only.',
            specialConsiderations: ['Biopsy the lesion directly; do not rely on screening results alone'],
            formData
        };
    }

    // Immunocompromised: lower threshold to colposcopy for any abnormal cytology
    if (isImmuno && (cytology === 'ASC-US' || cytology === 'LSIL')) {
        return {
            immediateRisk: immediate, fiveYearRisk: fiveYear,
            riskCategory: 'high',
            management: 'Colposcopy recommended',
            details: 'Immunocompromised patients warrant a lower threshold for colposcopy. Any abnormal cytology result should prompt colposcopic evaluation per ASCCP guidance for special populations.',
            specialConsiderations: ['Immunocompromised: increased risk of persistence and progression', 'Consider HIV viral load and CD4 count in management decisions'],
            formData
        };
    }

    // Age <25: special management for low-grade (ASCCP 2019)
    // LSIL → repeat cytology 1yr preferred; ASC-US/HPV+ → colposcopy but cytology acceptable
    if (age < 25 && cytology === 'LSIL') {
        return {
            immediateRisk: immediate, fiveYearRisk: fiveYear,
            riskCategory: 'intermediate',
            management: 'Repeat cytology in 1 year (preferred for age <25)',
            details: `Age <25 with LSIL: repeat cytology in 1 year is preferred. ` +
                `If normal on repeat → routine screening. If ASC-US or LSIL persists at 1 year → colposcopy. ` +
                `If HSIL or ASC-H at any time → colposcopy. ` +
                `(Immediate CIN3+ risk ${immediate}% — in patients ≥25 this would warrant ${immediate >= RISK.COLPOSCOPY ? 'colposcopy' : 'surveillance'}.)`,
            specialConsiderations: [
                'Age <25: CIN2 has high spontaneous regression rate; observation preferred',
                'Avoid expedited treatment in this age group'
            ],
            formData
        };
    }
    if (age < 25 && cytology === 'ASC-US' && immediate !== null && immediate >= RISK.COLPOSCOPY) {
        return {
            immediateRisk: immediate, fiveYearRisk: fiveYear,
            riskCategory: 'high',
            management: 'Colposcopy recommended (repeat cytology in 1 year acceptable)',
            details: `Age <25 with ASC-US and HPV positive (immediate CIN3+ risk ${immediate}%). ` +
                `Colposcopy is recommended. However, per ASCCP 2019, repeat cytology in 1 year is an acceptable alternative. ` +
                `If repeat cytology shows ASC-US or worse → colposcopy.`,
            specialConsiderations: [
                'Age <25: repeat cytology in 1 year is an acceptable alternative to colposcopy for ASC-US/HPV(+)',
                'Avoid expedited treatment in this age group'
            ],
            formData
        };
    }

    // Post-treatment surveillance
    if (hasBeenTreated && clinicalSituation === 'post-treatment') {
        const treatmentDate = formData.treatmentDate ? new Date(formData.treatmentDate) : null;
        const monthsSince = treatmentDate ? getMonthsDifference(treatmentDate, new Date()) : null;
        if (monthsSince !== null && monthsSince < 6) {
            return {
                immediateRisk: immediate, fiveYearRisk: fiveYear, riskCategory: 'intermediate',
                management: 'HPV-based testing at 6 months post-treatment',
                details: `Currently ${monthsSince} months post-treatment. Initial post-treatment surveillance test at 6 months. Continue annual HPV testing until 3 consecutive negatives, then every 3 years for ≥25 years.`,
                specialConsiderations: [], formData
            };
        }
        return {
            immediateRisk: immediate, fiveYearRisk: fiveYear, riskCategory: 'intermediate',
            management: 'Continue post-treatment surveillance',
            details: 'Annual HPV-based testing until 3 consecutive negatives, then every 3 years for minimum 25 years. Any positive result requires colposcopy with endocervical sampling.',
            specialConsiderations: [], formData
        };
    }

    // ---- Standard risk-based management ----
    if (immediate >= RISK.TREATMENT_PREFERRED) {
        management = isPregnant ? 'Colposcopy (defer treatment until postpartum)' : 'Expedited treatment preferred';
        details = `Immediate CIN3+ risk ${immediate}% (≥60%). ${isPregnant ? 'Colposcopy for diagnosis; treatment deferred until postpartum. No ECC.' : 'Excisional treatment preferred for patients ≥25. Colposcopy with biopsy is acceptable if patient prefers diagnostic confirmation first.'}`;
        riskCategory = 'very-high';
    } else if (immediate >= RISK.TREATMENT_ACCEPTABLE) {
        management = isPregnant ? 'Colposcopy (treatment contraindicated in pregnancy)' : 'Colposcopy or expedited treatment';
        details = `Immediate CIN3+ risk ${immediate}% (25–59%). Shared decision-making: colposcopy with biopsy vs expedited treatment. Consider age, fertility plans, and patient preference.`;
        riskCategory = 'high';
    } else if (immediate >= RISK.COLPOSCOPY) {
        management = 'Colposcopy recommended';
        details = `Immediate CIN3+ risk ${immediate}% (≥4%). Colposcopy is recommended. ${isPregnant ? 'Safe in pregnancy; avoid ECC.' : ''}`;
        riskCategory = 'high';
    } else {
        // Below colposcopy threshold → use 5-year risk for surveillance interval
        if (fiveYear <= RISK.FIVE_YR_SCREENING) {
            management = 'Return to routine screening in 5 years';
            details = `Immediate risk ${immediate}% (<4%). 5-year risk ${fiveYear}% (≤${RISK.FIVE_YR_SCREENING}%). Return to routine screening interval.`;
            riskCategory = 'low';
        } else if (fiveYear < RISK.FIVE_YR_3YR_FU) {
            management = 'Repeat HPV-based testing in 3 years';
            details = `Immediate risk ${immediate}% (<4%). 5-year risk ${fiveYear}% (≥${RISK.FIVE_YR_SCREENING}%, <${RISK.FIVE_YR_3YR_FU}%). Repeat HPV-based testing in 3 years.`;
            riskCategory = 'intermediate';
        } else {
            management = 'Repeat HPV-based testing in 1 year';
            details = `Immediate risk ${immediate}% (<4%). 5-year risk ${fiveYear}% (≥${RISK.FIVE_YR_3YR_FU}%). Enhanced surveillance: repeat HPV-based testing in 1 year.`;
            riskCategory = 'intermediate';
        }
    }

    // Special considerations for standard pathway
    let specialConsiderations = [];
    if (age < 25) specialConsiderations.push('Age <25: avoid expedited treatment; observation preferred for CIN2');
    if (isPregnant && management.includes('Colposcopy')) specialConsiderations.push('No ECC in pregnancy');

    return { immediateRisk: immediate, fiveYearRisk: fiveYear, riskCategory, management, details, specialConsiderations, formData };
}

// --- Post-Colposcopy Management (ASCCP 2019) ---
function postColposcopyManagement(age, cytology, hpvResult, data, isPregnant) {
    const biopsy = data.colpoBiopsy;
    const margins = data.excisionMargins;
    const precedingCyto = data.precedingCytology;
    const hpvGroupVal = hpvGroup(hpvResult);

    // Determine current HPV risk category
    const hpvPositive = hpvGroupVal !== 'negative' && hpvGroupVal !== 'not-done';
    const hpv16_18 = hpvGroupVal === '16-18';

    const result = {
        immediateRisk: null, fiveYearRisk: null,
        riskCategory: '', management: '', details: '',
        specialConsiderations: [], formData: data
    };

    if (!biopsy) {
        result.management = 'Select colposcopy biopsy result';
        result.details = 'Please select the colposcopy biopsy finding to continue.';
        result.riskCategory = 'intermediate';
        return result;
    }

    switch (biopsy) {
        case 'negative':
            // No CIN found. Management based on HPV.
            if (!hpvPositive) {
                result.management = 'Return to routine screening in 3 years';
                result.details = 'Colposcopy negative for CIN, HPV negative. HPV-based testing in 3 years. If negative at 3 years, return to routine screening interval.';
                result.riskCategory = 'low';
            } else if (hpv16_18 && age >= 25) {
                result.management = 'Colposcopy in 1 year with HPV testing';
                result.details = 'Colposcopy negative but HPV 16/18 positive. Repeat colposcopy and HPV testing in 1 year due to elevated risk with HPV 16/18. If negative, then HPV test in 1 year.';
                result.riskCategory = 'intermediate';
            } else {
                result.management = 'HPV-based testing in 1 year';
                result.details = 'Colposcopy negative but HPV positive (non-16/18). Repeat HPV-based testing in 1 year. If negative at 1 year, return to age-appropriate screening. If positive, repeat colposcopy.';
                result.riskCategory = 'intermediate';
            }
            break;

        case 'cin1':
            // CIN1: management depends on preceding cytology
            if (precedingCyto === 'ASC-H-or-higher') {
                result.management = 'Diagnostic excision OR observation with colposcopy + HPV at 1 year';
                result.details = 'CIN1 preceded by ASC-H or HSIL cytology — higher risk of occult CIN2+. Options: diagnostic excisional procedure, OR observation with repeat colposcopy and HPV testing at 1 year. If observation and both tests negative at 1 year → HPV testing in 1 year. If either positive at 1 year → repeat colposcopy.';
                result.riskCategory = 'high';
            } else {
                result.management = 'HPV-based testing in 1 year';
                result.details = 'CIN1 preceded by <ASC-H cytology — low risk of progression. HPV-based testing in 1 year. If HPV negative → return to routine screening. If HPV positive (non-16/18) → repeat colposcopy. If HPV 16/18 positive → colposcopy recommended.';
                result.riskCategory = 'intermediate';
            }
            if (isPregnant) {
                result.specialConsiderations.push('CIN1 in pregnancy: defer re-evaluation until ≥4 weeks postpartum');
            }
            break;

        case 'cin2':
            // CIN2: age-dependent management
            if (age < 25) {
                result.management = 'Observation preferred (colposcopy + cytology every 6 months for up to 2 years)';
                result.details = 'Age <25 with CIN2: observation is preferred. CIN2 has high spontaneous regression rate in this age group. Colposcopy + cytology every 6 months for up to 2 years. If CIN2 persists at 2 years or progresses to CIN3 → treatment. If HSIL or ASC-H on cytology during surveillance → repeat biopsy.';
                result.riskCategory = 'intermediate';
                result.specialConsiderations.push('Age <25: observation preferred for CIN2 (high regression rate)');
                result.specialConsiderations.push('Avoid expedited treatment in this age group');
            } else {
                // Age ≥25: treatment recommended
                if (margins === 'positive') {
                    result.management = 'Treatment recommended (excision preferred) — margins were positive';
                    result.details = 'Age ≥25 with CIN2 and positive margins: re-excision is recommended. Excisional procedure (LEEP/cone) preferred. Ablation only acceptable if entire squamocolumnar junction visualized and no evidence of invasive disease.';
                } else {
                    result.management = 'Treatment recommended (excision preferred)';
                    result.details = 'Age ≥25 with CIN2: treatment is recommended. Excisional procedure (LEEP/cone) is preferred — allows histological assessment of margins. Ablation acceptable if entire SCJ visualized, no invasive disease suspected, and patient understands limitations.';
                }
                result.riskCategory = 'high';
            }
            if (isPregnant) {
                result.management = 'Defer treatment until postpartum';
                result.details = 'CIN2 in pregnancy: treatment contraindicated. Colposcopy surveillance during pregnancy acceptable. Defer definitive treatment until ≥4 weeks postpartum.';
                result.specialConsiderations.push('CIN2 in pregnancy: defer treatment to postpartum; no ECC');
            }
            break;

        case 'cin3':
            // CIN3: treatment always recommended
            if (margins === 'positive') {
                result.management = 'Re-excision recommended (positive margins)';
                result.details = 'CIN3 with positive margins: re-excision (LEEP/cone) is recommended. If re-excision not feasible (e.g., no residual cervix), hysterectomy may be considered after childbearing is complete. Annual HPV testing for 3 years after treatment, then q3y for ≥25 years.';
            } else {
                result.management = 'Excisional treatment (LEEP/cone) recommended';
                result.details = 'CIN3: excisional treatment is the standard of care. LEEP or cone biopsy preferred for histological assessment of margins. Ablation NOT recommended for CIN3. Post-treatment: HPV-based testing in 6 months, then annual x3, then q3y for ≥25 years.';
            }
            result.riskCategory = 'very-high';
            if (isPregnant) {
                result.management = 'Colposcopy surveillance during pregnancy; defer treatment to postpartum';
                result.details = 'CIN3 in pregnancy: treatment contraindicated. Colposcopy surveillance each trimester acceptable. Defer treatment until ≥4 weeks postpartum unless invasion suspected.';
                result.specialConsiderations.push('CIN3 in pregnancy: defer treatment, colposcopic surveillance each trimester');
            }
            if (age < 25) {
                result.specialConsiderations.push('Age <25 with CIN3: treatment still recommended (CIN3 does not have high regression rate like CIN2)');
            }
            break;

        case 'ais':
            result.management = 'Diagnostic excisional procedure (cold knife cone preferred)';
            result.details = 'AIS: diagnostic excisional procedure is mandatory. Cold knife cone preferred for optimal margin assessment and pathological interpretation. If margins negative and future fertility desired → surveillance. If childbearing complete → hysterectomy recommended after excision confirms diagnosis. Annual HPV + cytology co-testing for ≥25 years.';
            result.riskCategory = 'very-high';
            if (isPregnant) {
                result.specialConsiderations.push('AIS in pregnancy: colposcopy for diagnosis; defer excision to postpartum if no invasion suspected');
            }
            break;

        case 'cancer':
            result.management = 'Stage-appropriate oncologic management';
            result.details = 'Invasive cervical cancer diagnosed. Refer to gynecologic oncology for staging, workup, and definitive management. No further ASCCP guideline recommendations apply — management per NCCN or equivalent oncology guidelines.';
            result.riskCategory = 'very-high';
            break;

        case 'inadequate':
            result.management = 'Diagnostic excision OR repeat colposcopy';
            result.details = 'Inadequate/unsatisfactory colposcopy: the transformation zone was not fully visualized. Options: (1) diagnostic excisional procedure, or (2) repeat colposcopy in 6–12 months with additional techniques to visualize the SCJ. Consider patient age, risk factors, and cytology results in decision.';
            result.riskCategory = 'high';
            break;

        default:
            result.management = 'Select colposcopy biopsy result';
            result.riskCategory = 'intermediate';
    }

    // Add HPV status context
    if (hpvPositive && !result.details.includes('HPV')) {
        result.details += ` Current HPV ${hpv16_18 ? '16/18 positive' : 'positive'} — this modifies surveillance recommendations.`;
    }

    return result;
}

function handleHpvNotDone(age, cytology, isPregnant, isImmuno, hasSymptoms) {
    // When HPV is not performed, base management on cytology alone per ASCCP guidance
    let management, details, riskCategory;
    const specialConsiderations = [];

    if (hasSymptoms) {
        return { immediateRisk: null, fiveYearRisk: null, riskCategory: 'high',
            management: 'Immediate evaluation — visible cervical lesion',
            details: 'Visible lesion requires biopsy regardless of HPV availability.',
            specialConsiderations: [], formData };
    }

    switch (cytology) {
        case 'NILM':
            management = 'Routine screening (HPV co-testing preferred)';
            details = 'HPV testing not performed. NILM cytology alone is low risk. Consider HPV co-testing at next screen for optimal risk stratification.';
            riskCategory = 'low';
            break;
        case 'ASC-US':
            management = 'Reflex HPV testing recommended; if unavailable, repeat cytology in 1 year';
            details = 'ASC-US without HPV triage is indeterminate. Preferred: reflex HPV testing. Alternative: repeat cytology in 12 months. Colposcopy if repeat cytology ≥ASC-US.';
            riskCategory = 'intermediate';
            break;
        case 'LSIL':
            management = (age >= 25) ? 'Colposcopy recommended' : 'Repeat cytology in 1 year';
            details = age >= 25 ? 'LSIL without HPV testing should prompt colposcopy.' : 'Age <25: LSIL may be observed. Repeat cytology in 1 year. Colposcopy if ASC-US or worse.';
            riskCategory = age >= 25 ? 'high' : 'intermediate';
            break;
        case 'ASC-H':
        case 'HSIL':
        case 'AGC':
        case 'AGC-favor-neoplasia':
        case 'AIS':
            management = 'Colposcopy recommended';
            details = `${cytology} cytology warrants colposcopy regardless of HPV status. Perform colposcopy with biopsy as indicated.`;
            riskCategory = 'high';
            break;
        default:
            management = 'Insufficient data — clinical judgment required';
            details = 'Unable to determine risk without HPV results and adequate cytology. Consider repeat testing.';
            riskCategory = 'intermediate';
    }

    if (isPregnant) specialConsiderations.push('No ECC in pregnancy');
    if (age < 25) specialConsiderations.push('Age <25: avoid expedited treatment');
    return { immediateRisk: null, fiveYearRisk: null, riskCategory, management, details, specialConsiderations, formData };
}

function getMonthsDifference(d1, d2) {
    return (d2.getFullYear() - d1.getFullYear()) * 12 + d2.getMonth() - d1.getMonth();
}

// --- Display ---
function displayResults(results) {
    // Primary risk value
    const riskEl = document.getElementById('immediateRisk');
    if (results.immediateRisk !== null) {
        riskEl.textContent = results.immediateRisk.toFixed(1) + '%';
    } else {
        riskEl.textContent = '—';
    }
    // Category badge
    const catText = {
        'very-high': 'Very High Risk (≥60%)',
        'high': 'High Risk (≥4%)',
        'intermediate': 'Intermediate Risk',
        'low': 'Low Risk'
    };
    const catEl = document.getElementById('riskCategory');
    catEl.textContent = catText[results.riskCategory] || '';
    catEl.className = 'risk-category ' + results.riskCategory;

    // Risk card styling
    const card = document.getElementById('riskCard');
    card.className = 'risk-card ' + results.riskCategory;

    // Update gauge value in center
    const gv = document.getElementById('gaugeValue');
    if (results.immediateRisk !== null) {
        gv.textContent = results.immediateRisk.toFixed(1) + '%';
    } else {
        gv.textContent = '—';
    }

    // 5-year risk
    const fiveYr = document.getElementById('fiveYearRiskSection');
    if (results.fiveYearRisk !== null && results.immediateRisk !== null && results.immediateRisk < 4) {
        fiveYr.style.display = 'block';
        document.getElementById('fiveYearRisk').textContent = results.fiveYearRisk.toFixed(2) + '%';
    } else {
        fiveYr.style.display = 'none';
    }

    // Management
    document.getElementById('primaryRecommendation').textContent = results.management;
    document.getElementById('recommendationDetails').textContent = results.details;

    // Special considerations
    const specialDiv = document.getElementById('specialConsiderations');
    if (results.specialConsiderations && results.specialConsiderations.length > 0) {
        specialDiv.style.display = 'block';
        specialDiv.innerHTML = '<h4>Special Considerations</h4><ul>' +
            results.specialConsiderations.map(s => `<li>${s}</li>`).join('') + '</ul>';
    } else {
        specialDiv.style.display = 'none';
    }

    // Clinical summary grid
    displayClinicalSummary(results.formData);

    // Documentation for clipboard
    generateDocumentation(results);
}

// SVG Gauge animation — maps risk % to arc endpoint
function animateGauge(results) {
    const gaugeFill = document.getElementById('gaugeFill');
    if (!results.immediateRisk) {
        gaugeFill.setAttribute('d', 'M 30 105 A 70 70 0 0 1 30 105');
        return;
    }
    // Map 0-100% risk to 180° arc (left to right on semicircle)
    // 0% = left (30,105), 100% = right (170,105), midpoint at top (100,35)
    const pct = Math.min(Math.max(results.immediateRisk / 100, 0), 1);
    const angle = Math.PI * pct; // 0 to PI radians
    const cx = 100, cy = 105, r = 70;
    const ex = cx + r * Math.cos(Math.PI - angle);
    const ey = cy - r * Math.sin(Math.PI - angle);
    const sweep = pct > 0.5 ? '1' : '0';
    const largeArc = pct > 0.5 ? '1' : '0';
    gaugeFill.setAttribute('d',
        `M 30 105 A 70 70 0 ${largeArc} ${sweep} ${ex.toFixed(1)} ${ey.toFixed(1)}`);
}

// validateStep: also check colpoBiopsy for post-colposcopy
const _origValidateStep = validateStep;
validateStep = function(step) {
    let ok = _origValidateStep(step);
    if (step === 2) {
        const sit = document.getElementById('clinicalSituation').value;
        if (sit === 'post-colposcopy') {
            const biopsy = document.getElementById('colpoBiopsy');
            if (!biopsy.value) {
                showError(biopsy, 'Biopsy result required');
                ok = false;
            }
        }
    }
    return ok;
};

function displayClinicalSummary(data) {
    const grid = document.getElementById('clinicalSummary');
    grid.innerHTML = '';
    const sitLabels = { 'screening': 'Routine Screening', 'surveillance': 'Surveillance',
        'post-colposcopy': 'Post-Colposcopy', 'post-treatment': 'Post-Treatment' };
    const items = [
        ['Age', data.age + ' years'],
        ['Clinical Situation', sitLabels[data.clinicalSituation] || fmt(data.clinicalSituation) || 'Screening'],
    ];
    if (data.clinicalSituation === 'post-colposcopy') {
        if (data.colpoBiopsy) items.push(['Biopsy Result', fmt(data.colpoBiopsy)]);
        if (data.precedingCytology) items.push(['Preceding Cytology', fmt(data.precedingCytology)]);
        if (data.excisionMargins && data.excisionMargins !== 'not-applicable')
            items.push(['Margins', data.excisionMargins === 'negative' ? 'Negative' : 'Positive']);
    }
    items.push(['Cytology', data.cytology || 'N/A']);
    items.push(['HPV', formatHPVResult(data.hpvResult)]);
    if (data.clinicalSituation !== 'post-colposcopy') {
        if (data.priorHpvNegative && data.priorHpvNegative !== 'none')
            items.push(['Prior HPV(-)', fmt(data.priorHpvNegative)]);
        if (data.recentColposcopy && data.recentColposcopy !== 'none')
            items.push(['Recent Colposcopy', fmt(data.recentColposcopy)]);
        if (data.biopsyHistory && data.biopsyHistory !== 'none')
            items.push(['Prior Biopsy', fmt(data.biopsyHistory)]);
    }
    if (data.treatmentHistory && data.treatmentHistory !== 'none')
        items.push(['Prior Treatment', fmt(data.treatmentHistory)]);
    if (data.specialPopulation && data.specialPopulation.length > 0)
        items.push(['Special Population', data.specialPopulation.join(', ')]);

    items.forEach(([label, value]) => {
        const div = document.createElement('div');
        div.className = 'summary-item';
        div.innerHTML = `<div class="summary-label">${label}</div><div class="summary-value">${value}</div>`;
        grid.appendChild(div);
    });
}

function fmt(s) { return (s || '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }

function formatHPVResult(r) {
    const m = {
        'not-done': 'Not performed', 'negative': 'Negative',
        'positive-16': 'HPV 16 Positive', 'positive-18': 'HPV 18 Positive',
        'positive-16-18': 'HPV 16 & 18 Positive',
        'positive-other-hr': 'Other HR-HPV Positive',
        'positive-unknown': 'HPV Positive (type unknown)'
    };
    return m[r] || r;
}

function generateDocumentation(results) {
    const data = results.formData;
    const cytoHPV = `${data.cytology}/${formatHPVShort(data.hpvResult)}`;
    let pt = `${data.age}yo`;
    if (data.specialPopulation && data.specialPopulation.includes('pregnant')) pt += ' pregnant';
    if (data.specialPopulation && data.specialPopulation.includes('immunocompromised')) pt += ' immunocompromised';
    pt += ' F';

    const hx = [];
    if (data.priorHpvNegative && data.priorHpvNegative !== 'none')
        hx.push(`prior HPV(-) ${data.priorHpvNegative.replace('within-', '<').replace('-years', 'y')}`);
    if (data.recentColposcopy && data.recentColposcopy !== 'none')
        hx.push(`recent colpo: ${data.recentColposcopy === 'negative' ? 'neg' : data.recentColposcopy}`);
    if (data.treatmentHistory && data.treatmentHistory !== 'none')
        hx.push(`s/p ${data.treatmentHistory === 'excision' ? 'LEEP/cone' : data.treatmentHistory}`);

    let followUp = '';
    const m = results.management;
    if (m.includes('Colposcopy')) followUp = 'colposcopy';
    else if (m.includes('Expedited treatment')) followUp = 'LEEP';
    else if (m.includes('1 year') || m.includes('1-year') || m.includes('12 months')) followUp = 'repeat HPV/Pap in 1y';
    else if (m.includes('3 year') || m.includes('3-year')) followUp = 'repeat HPV/Pap in 3y';
    else if (m.includes('5 year') || m.includes('5-year')) followUp = 'routine screening in 5y';
    else if (m.includes('6 month')) followUp = 'HPV test in 6mo';
    else if (m.includes('annual')) followUp = 'annual HPV x3, then q3y x25y';
    else if (m.includes('reflex') || m.includes('Reflex')) followUp = 'reflex HPV testing';
    else followUp = 'per ASCCP 2019';

    let doc = `${pt} with ${cytoHPV}`;
    if (hx.length) doc += ` (${hx.join(', ')})`;
    if (results.immediateRisk !== null) doc += `. Immediate CIN3+ risk ${results.immediateRisk.toFixed(1)}%`;
    if (results.fiveYearRisk !== null && results.immediateRisk !== null && results.immediateRisk < 4)
        doc += `, 5y risk ${results.fiveYearRisk.toFixed(1)}%`;
    doc += `. Plan: ${followUp}.`;

    if (data.specialPopulation && data.specialPopulation.includes('pregnant') && m.includes('Colposcopy'))
        doc += ' No ECC.';
    if ((data.cytology === 'AGC' || data.cytology === 'AGC-favor-neoplasia') && parseInt(data.age) >= 35)
        doc += ' EMB indicated.';

    document.getElementById('clipboardContent').textContent = doc;
}

function formatHPVShort(r) {
    const m = { 'not-done': 'HPV not done', 'negative': 'HPV(-)', 'positive-16': 'HPV16(+)',
        'positive-18': 'HPV18(+)', 'positive-16-18': 'HPV16/18(+)',
        'positive-other-hr': 'HPV(+) non-16/18', 'positive-unknown': 'HPV(+)' };
    return m[r] || r;
}

function copyToClipboard() {
    const content = document.getElementById('clipboardContent').textContent;
    const btn = document.querySelector('.btn-clipboard');
    const orig = btn.innerHTML;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(content).then(() => {
            btn.innerHTML = '✓ Copied';
            btn.classList.add('btn-success');
            setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('btn-success'); }, 2000);
        });
    } else {
        const ta = document.createElement('textarea');
        ta.value = content; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
    }
}

function resetForm() {
    formData = {}; currentStep = 1;
    document.getElementById('riskForm').reset();
    document.querySelectorAll('.error').forEach(e => e.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(e => { e.textContent = ''; e.classList.remove('show'); });
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    document.querySelector('.form-step[data-step="1"]').classList.add('active');
    updateProgressBar(); updateNavigation();
    window.scrollTo(0, 0);
}

// Inject clipboard button class
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('.clipboard-card .btn');
    if (btn) btn.classList.add('btn-clipboard');
});
