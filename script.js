// ASCCP 2019 Risk Calculator - JavaScript Implementation

// Global state
let currentStep = 1;
const totalSteps = 4;
let formData = {};

// ASCCP Risk Tables and Thresholds
const ASCCP_RISK_DATA = {
    // Immediate CIN3+ risk thresholds
    COLPOSCOPY_THRESHOLD: 4.0,
    TREATMENT_ACCEPTABLE_THRESHOLD: 25.0,
    TREATMENT_PREFERRED_THRESHOLD: 60.0,
    
    // 5-year risk thresholds
    ROUTINE_SCREENING_THRESHOLD: 0.15,
    THREE_YEAR_SURVEILLANCE_THRESHOLD: 0.55,
    
    // Risk estimates based on current results
    immediateRisk: {
        // NILM (Negative cytology)
        'NILM_negative': 0.04,
        'NILM_positive-16': 2.7,
        'NILM_positive-18': 1.9,
        'NILM_positive-16-18': 3.5,
        'NILM_positive-other-hr': 0.97,
        'NILM_positive-unknown': 1.2,
        
        // ASC-US
        'ASC-US_negative': 0.43,
        'ASC-US_positive-16': 14.2,
        'ASC-US_positive-18': 8.8,
        'ASC-US_positive-16-18': 18.5,
        'ASC-US_positive-other-hr': 3.9,
        'ASC-US_positive-unknown': 5.2,
        
        // LSIL
        'LSIL_negative': 2.0,
        'LSIL_positive-16': 18.8,
        'LSIL_positive-18': 11.2,
        'LSIL_positive-16-18': 22.3,
        'LSIL_positive-other-hr': 5.9,
        'LSIL_positive-unknown': 7.9,
        
        // ASC-H
        'ASC-H_negative': 3.4,
        'ASC-H_positive-16': 33.2,
        'ASC-H_positive-18': 26.1,
        'ASC-H_positive-16-18': 39.8,
        'ASC-H_positive-other-hr': 18.4,
        'ASC-H_positive-unknown': 25.2,
        
        // HSIL
        'HSIL_negative': 29.8,
        'HSIL_positive-16': 60.4,
        'HSIL_positive-18': 48.3,
        'HSIL_positive-16-18': 64.7,
        'HSIL_positive-other-hr': 44.8,
        'HSIL_positive-unknown': 49.1,
        
        // AGC
        'AGC_negative': 3.5,
        'AGC_positive-16': 28.9,
        'AGC_positive-18': 21.3,
        'AGC_positive-16-18': 33.4,
        'AGC_positive-other-hr': 9.1,
        'AGC_positive-unknown': 15.8,
        
        // AGC favor neoplasia
        'AGC-favor-neoplasia_negative': 15.2,
        'AGC-favor-neoplasia_positive-16': 52.8,
        'AGC-favor-neoplasia_positive-18': 44.3,
        'AGC-favor-neoplasia_positive-16-18': 58.1,
        'AGC-favor-neoplasia_positive-other-hr': 28.1,
        'AGC-favor-neoplasia_positive-unknown': 35.4,
        
        // AIS
        'AIS_negative': 48.2,
        'AIS_positive-16': 69.3,
        'AIS_positive-18': 62.1,
        'AIS_positive-16-18': 72.8,
        'AIS_positive-other-hr': 55.7,
        'AIS_positive-unknown': 60.2
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check for saved theme
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        updateThemeIcon(true);
    }
    
    // Add event listeners
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('treatmentHistory').addEventListener('change', toggleTreatmentDate);
    
    // Add form validation listeners
    addValidationListeners();
    
    updateProgressBar();
}

function toggleTheme() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    updateThemeIcon(isDarkMode);
}

function updateThemeIcon(isDarkMode) {
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    
    if (isDarkMode) {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }
}

function addValidationListeners() {
    // Step 1 validation
    document.getElementById('age').addEventListener('input', validateAge);
    document.getElementById('screeningType').addEventListener('change', validateRequired);
    document.getElementById('cytology').addEventListener('change', validateRequired);
    document.getElementById('hpvResult').addEventListener('change', validateRequired);
}

function validateAge(e) {
    const age = e.target.value;
    const errorElement = e.target.nextElementSibling;
    
    if (!age) {
        showError(e.target, 'Age is required');
    } else if (age < 21 || age > 100) {
        showError(e.target, 'Age must be between 21 and 100');
    } else {
        clearError(e.target);
    }
}

function validateRequired(e) {
    const value = e.target.value;
    
    if (!value) {
        showError(e.target, 'This field is required');
    } else {
        clearError(e.target);
    }
}

function showError(input, message) {
    input.classList.add('error');
    const errorElement = input.nextElementSibling;
    if (errorElement && errorElement.classList.contains('error-message')) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

function clearError(input) {
    input.classList.remove('error');
    const errorElement = input.nextElementSibling;
    if (errorElement && errorElement.classList.contains('error-message')) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
}

function validateStep(step) {
    let isValid = true;
    
    if (step === 1) {
        const requiredFields = ['age', 'screeningType', 'cytology', 'hpvResult'];
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field.value) {
                showError(field, 'This field is required');
                isValid = false;
            } else if (fieldId === 'age') {
                const age = parseInt(field.value);
                if (age < 21 || age > 100) {
                    showError(field, 'Age must be between 21 and 100');
                    isValid = false;
                }
            }
        });
    }
    
    return isValid;
}

function nextStep() {
    if (!validateStep(currentStep)) {
        return;
    }
    
    if (currentStep < totalSteps - 1) {
        saveStepData();
        document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.remove('active');
        currentStep++;
        document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.add('active');
        updateProgressBar();
        updateNavigation();
    }
}

function previousStep() {
    if (currentStep > 1) {
        saveStepData();
        document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.remove('active');
        currentStep--;
        document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.add('active');
        updateProgressBar();
        updateNavigation();
    }
}

function updateProgressBar() {
    const progress = (currentStep / totalSteps) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    
    // Update step indicators
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        if (index + 1 < currentStep) {
            step.classList.add('completed');
            step.querySelector('.step-circle').innerHTML = '✓';
        } else if (index + 1 === currentStep) {
            step.classList.add('active');
            step.classList.remove('completed');
            step.querySelector('.step-circle').innerHTML = index + 1;
        } else {
            step.classList.remove('active', 'completed');
            step.querySelector('.step-circle').innerHTML = index + 1;
        }
    });
}

function updateNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const calculateBtn = document.getElementById('calculateBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // Show/hide previous button
    prevBtn.style.display = currentStep > 1 ? 'block' : 'none';
    
    // Show appropriate next/calculate button
    if (currentStep === totalSteps - 1) {
        nextBtn.style.display = 'none';
        calculateBtn.style.display = 'block';
    } else if (currentStep === totalSteps) {
        nextBtn.style.display = 'none';
        calculateBtn.style.display = 'none';
        resetBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        calculateBtn.style.display = 'none';
    }
}

function toggleTreatmentDate() {
    const treatmentHistory = document.getElementById('treatmentHistory').value;
    const dateGroup = document.getElementById('treatmentDateGroup');
    
    if (treatmentHistory !== 'none') {
        dateGroup.style.display = 'block';
    } else {
        dateGroup.style.display = 'none';
    }
}

function saveStepData() {
    // Save data from current step
    const currentStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const inputs = currentStepElement.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            if (!formData[input.name]) {
                formData[input.name] = [];
            }
            if (input.checked && !formData[input.name].includes(input.value)) {
                formData[input.name].push(input.value);
            } else if (!input.checked && formData[input.name].includes(input.value)) {
                formData[input.name] = formData[input.name].filter(v => v !== input.value);
            }
        } else {
            formData[input.name] = input.value;
        }
    });
}

function calculateRisk() {
    if (!validateStep(currentStep)) {
        return;
    }
    
    saveStepData();
    
    // Show loading state
    document.getElementById('loadingResults').style.display = 'block';
    document.getElementById('resultsContent').style.display = 'none';
    
    // Navigate to results
    document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.remove('active');
    currentStep = totalSteps;
    document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.add('active');
    updateProgressBar();
    updateNavigation();
    
    // Simulate calculation delay
    setTimeout(() => {
        const results = performRiskCalculation();
        displayResults(results);
        
        document.getElementById('loadingResults').style.display = 'none';
        document.getElementById('resultsContent').style.display = 'block';
    }, 1500);
}

function performRiskCalculation() {
    const age = parseInt(formData.age);
    const cytology = formData.cytology;
    const hpvResult = formData.hpvResult;
    const screeningType = formData.screeningType;
    
    // Get base immediate risk
    let riskKey = `${cytology}_${hpvResult}`;
    let immediateRisk = ASCCP_RISK_DATA.immediateRisk[riskKey] || 5.0;
    
    // Apply modifiers based on history
    if (formData.priorHpvNegative === 'within-1-year' || formData.priorHpvNegative === '1-5-years') {
        immediateRisk *= 0.5; // Prior negative HPV reduces risk by ~50%
    }
    
    if (formData.recentColposcopy === 'negative' || formData.recentColposcopy === 'cin1') {
        immediateRisk *= 0.6; // Recent negative colposcopy reduces risk
    }
    
    // Age adjustments
    if (age < 25) {
        immediateRisk *= 0.7;
    } else if (age > 65) {
        immediateRisk *= 0.8;
    }
    
    // Special populations
    const isImmunocompromised = formData.specialPopulation && formData.specialPopulation.includes('immunocompromised');
    const isPregnant = formData.specialPopulation && formData.specialPopulation.includes('pregnant');
    
    // Treatment history
    const hasBeenTreated = formData.treatmentHistory !== 'none';
    
    // Determine risk category and management
    let riskCategory, management, details, fiveYearRisk;
    
    // Special case: ASC-H always gets colposcopy regardless of risk
    if (cytology === 'ASC-H') {
        riskCategory = 'high';
        management = 'Colposcopy recommended';
        details = 'ASC-H cytology requires colposcopic evaluation due to high concurrent cancer risk, regardless of HPV status.';
    }
    // Special case: Immunocompromised patients have lower thresholds
    else if (isImmunocompromised && (cytology === 'ASC-US' || cytology === 'LSIL')) {
        riskCategory = 'high';
        management = 'Colposcopy recommended';
        details = 'Lower threshold for colposcopy in immunocompromised patients. Any abnormal cytology warrants evaluation.';
    }
    // Special case: Post-treatment surveillance
    else if (hasBeenTreated && screeningType === 'post-treatment') {
        const treatmentDate = new Date(formData.treatmentDate);
        const monthsSinceTreatment = getMonthsDifference(treatmentDate, new Date());
        
        if (monthsSinceTreatment < 6) {
            management = 'HPV-based testing at 6 months post-treatment';
            details = 'Initial post-treatment test should occur at 6 months. Continue annual testing until 3 consecutive negatives, then 3-year intervals for 25 years.';
        } else {
            management = 'Continue post-treatment surveillance';
            details = 'Annual HPV-based testing until 3 consecutive negatives, then 3-year intervals for minimum 25 years. Any positive result requires colposcopy.';
        }
        riskCategory = 'intermediate';
    }
    // Risk-based management for general population
    else if (immediateRisk >= ASCCP_RISK_DATA.TREATMENT_PREFERRED_THRESHOLD) {
        riskCategory = 'very-high';
        management = 'Expedited treatment preferred (excisional procedure)';
        details = 'Immediate risk ≥60%. Treatment without prior biopsy is preferred for non-pregnant patients ≥25 years. Colposcopy with biopsy is acceptable if patient prefers.';
        
        if (isPregnant) {
            management = 'Colposcopy recommended (defer treatment until postpartum)';
            details += ' Treatment contraindicated during pregnancy - perform colposcopy for diagnosis and defer treatment to postpartum period.';
        }
    }
    else if (immediateRisk >= ASCCP_RISK_DATA.TREATMENT_ACCEPTABLE_THRESHOLD) {
        riskCategory = 'high';
        management = 'Either colposcopy or expedited treatment acceptable';
        details = 'Immediate risk 25-59%. Shared decision-making recommended. Consider patient preference, future fertility plans, and resource availability.';
        
        if (isPregnant) {
            management = 'Colposcopy recommended (treatment contraindicated in pregnancy)';
            details = 'Colposcopy with biopsy as needed. Defer any treatment until postpartum. ECC contraindicated.';
        }
    }
    else if (immediateRisk >= ASCCP_RISK_DATA.COLPOSCOPY_THRESHOLD) {
        riskCategory = 'high';
        management = 'Colposcopy recommended';
        details = `Immediate CIN3+ risk of ${immediateRisk.toFixed(1)}% exceeds the 4% colposcopy threshold.`;
        
        if (isPregnant) {
            details += ' Colposcopy safe in pregnancy but avoid ECC.';
        }
    }
    else {
        // Calculate 5-year risk for surveillance intervals
        fiveYearRisk = calculate5YearRisk(cytology, hpvResult, formData);
        
        if (fiveYearRisk < ASCCP_RISK_DATA.ROUTINE_SCREENING_THRESHOLD) {
            riskCategory = 'low';
            management = 'Return to routine screening (5 years)';
            details = `Low immediate risk (${immediateRisk.toFixed(1)}%) and 5-year risk (${fiveYearRisk.toFixed(2)}%) below thresholds.`;
        }
        else if (fiveYearRisk < ASCCP_RISK_DATA.THREE_YEAR_SURVEILLANCE_THRESHOLD) {
            riskCategory = 'intermediate';
            management = '3-year surveillance';
            details = `Intermediate 5-year risk (${fiveYearRisk.toFixed(2)}%). Repeat HPV-based testing in 3 years.`;
        }
        else {
            riskCategory = 'intermediate';
            management = '1-year surveillance';
            details = `Elevated 5-year risk (${fiveYearRisk.toFixed(2)}%). Repeat HPV-based testing in 1 year.`;
        }
    }
    
    // Additional special considerations
    let specialConsiderations = [];
    
    if (cytology === 'AGC' || cytology === 'AGC-favor-neoplasia' || cytology === 'AIS') {
        specialConsiderations.push('Endocervical and endometrial sampling required (age ≥35 or risk factors)');
        if (cytology === 'AGC-favor-neoplasia' || cytology === 'AIS') {
            specialConsiderations.push('Consider diagnostic excisional procedure if initial evaluation negative');
        }
    }
    
    if (formData.symptoms && formData.symptoms.includes('visible-lesion')) {
        specialConsiderations.push('Visible lesion requires immediate evaluation regardless of screening results');
    }
    
    if (age < 25) {
        specialConsiderations.push('Age <25: Avoid expedited treatment; prefer observation for CIN2');
    }
    
    return {
        immediateRisk: immediateRisk,
        fiveYearRisk: fiveYearRisk,
        riskCategory: riskCategory,
        management: management,
        details: details,
        specialConsiderations: specialConsiderations,
        formData: formData
    };
}

function calculate5YearRisk(cytology, hpvResult, data) {
    // Simplified 5-year risk calculation
    let baseRisk = 0.5;
    
    if (cytology === 'NILM' && hpvResult === 'negative') {
        baseRisk = 0.04;
    } else if (cytology === 'NILM' && hpvResult.includes('positive')) {
        baseRisk = 0.8;
    } else if (cytology === 'ASC-US' && hpvResult === 'negative') {
        baseRisk = 0.41;
    } else if (cytology === 'ASC-US' && hpvResult.includes('positive')) {
        baseRisk = 1.8;
    } else if (cytology === 'LSIL') {
        baseRisk = 2.1;
    }
    
    // Modifiers
    if (data.priorHpvNegative === 'within-1-year' || data.priorHpvNegative === '1-5-years') {
        baseRisk *= 0.6;
    }
    
    return baseRisk;
}

function getMonthsDifference(date1, date2) {
    const months = (date2.getFullYear() - date1.getFullYear()) * 12;
    return months + date2.getMonth() - date1.getMonth();
}

function displayResults(results) {
    // Display immediate risk
    document.getElementById('immediateRisk').textContent = results.immediateRisk.toFixed(1) + '%';
    
    // Display risk category
    const categoryText = {
        'very-high': 'Very High Risk (≥60%)',
        'high': 'High Risk (≥4%)',
        'intermediate': 'Intermediate Risk',
        'low': 'Low Risk'
    };
    
    document.getElementById('riskCategory').textContent = categoryText[results.riskCategory];
    document.getElementById('riskCategory').className = `risk-category ${results.riskCategory}`;
    
    // Update risk bar
    const riskCard = document.getElementById('riskCard');
    riskCard.className = `risk-card ${results.riskCategory}`;
    
    const riskFill = document.getElementById('riskFill');
    const fillWidth = Math.min(results.immediateRisk * 1.5, 100);
    riskFill.style.width = fillWidth + '%';
    riskFill.className = `risk-fill ${results.riskCategory}`;
    
    // Display 5-year risk if calculated
    if (results.fiveYearRisk !== undefined) {
        document.getElementById('fiveYearRiskSection').style.display = 'block';
        document.getElementById('fiveYearRisk').textContent = results.fiveYearRisk.toFixed(2) + '%';
    }
    
    // Display management recommendation
    document.getElementById('primaryRecommendation').textContent = results.management;
    document.getElementById('recommendationDetails').innerHTML = results.details;
    
    // Display special considerations
    if (results.specialConsiderations.length > 0) {
        const specialDiv = document.getElementById('specialConsiderations');
        specialDiv.style.display = 'block';
        specialDiv.innerHTML = '<h4>Special Considerations:</h4><ul>' + 
            results.specialConsiderations.map(item => `<li>${item}</li>`).join('') + 
            '</ul>';
    }
    
    // Display clinical summary
    displayClinicalSummary(results.formData);
    
    // Generate documentation text
    generateDocumentation(results);
}

function displayClinicalSummary(data) {
    const summaryGrid = document.getElementById('clinicalSummary');
    summaryGrid.innerHTML = '';
    
    const summaryItems = [
        { label: 'Age', value: data.age + ' years' },
        { label: 'Screening Type', value: formatValue(data.screeningType) },
        { label: 'Cytology', value: data.cytology },
        { label: 'HPV Result', value: formatHPVResult(data.hpvResult) },
        { label: 'Prior HPV Negative', value: formatValue(data.priorHpvNegative || 'none') },
        { label: 'Recent Colposcopy', value: formatValue(data.recentColposcopy || 'none') }
    ];
    
    if (data.biopsyHistory && data.biopsyHistory !== 'none') {
        summaryItems.push({ label: 'Prior Biopsy', value: formatValue(data.biopsyHistory) });
    }
    
    if (data.treatmentHistory && data.treatmentHistory !== 'none') {
        summaryItems.push({ label: 'Prior Treatment', value: formatValue(data.treatmentHistory) });
    }
    
    if (data.specialPopulation && data.specialPopulation.length > 0) {
        summaryItems.push({ label: 'Special Population', value: data.specialPopulation.join(', ') });
    }
    
    summaryItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'summary-item';
        div.innerHTML = `
            <div class="summary-label">${item.label}</div>
            <div class="summary-value">${item.value}</div>
        `;
        summaryGrid.appendChild(div);
    });
}

function formatValue(value) {
    return value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatHPVResult(result) {
    const hpvMap = {
        'not-done': 'Not performed',
        'negative': 'Negative',
        'positive-16': 'HPV 16 Positive',
        'positive-18': 'HPV 18 Positive',
        'positive-16-18': 'HPV 16 and 18 Positive',
        'positive-other-hr': 'Other HR-HPV Positive',
        'positive-unknown': 'HPV Positive (type unknown)'
    };
    return hpvMap[result] || result;
}

function generateDocumentation(results) {
    const data = results.formData;
    const date = new Date().toLocaleDateString();
    
    let documentation = `CERVICAL CANCER SCREENING RISK ASSESSMENT - ${date}

Patient: ${data.age} year old ${data.specialPopulation && data.specialPopulation.includes('pregnant') ? 'pregnant ' : ''}${data.specialPopulation && data.specialPopulation.includes('immunocompromised') ? 'immunocompromised ' : ''}female

Current Results:
- Cytology: ${data.cytology}
- HPV: ${formatHPVResult(data.hpvResult)}

Relevant History:
- Prior negative HPV: ${formatValue(data.priorHpvNegative || 'none')}
- Recent colposcopy: ${formatValue(data.recentColposcopy || 'none')}
- Prior treatment: ${formatValue(data.treatmentHistory || 'none')}

Risk Assessment per ASCCP 2019 Guidelines:
- Immediate CIN3+ risk: ${results.immediateRisk.toFixed(1)}%${results.fiveYearRisk !== undefined ? '\n- 5-year CIN3+ risk: ' + results.fiveYearRisk.toFixed(2) + '%' : ''}
- Risk category: ${results.riskCategory.toUpperCase()}

Management Plan:
${results.management}

Clinical Rationale:
${results.details}

${results.specialConsiderations.length > 0 ? 'Additional Considerations:\n' + results.specialConsiderations.map(item => '- ' + item).join('\n') + '\n' : ''}
Follow-up: As per ASCCP 2019 risk-based management guidelines`;
    
    document.getElementById('clipboardContent').textContent = documentation;
}

function copyToClipboard() {
    const content = document.getElementById('clipboardContent').textContent;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(content).then(() => {
            // Show success feedback
            const btn = event.target.closest('.btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '✓ Copied!';
            btn.classList.add('btn-success');
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('btn-success');
            }, 2000);
        });
    } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = content;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}

function resetForm() {
    // Reset form data
    formData = {};
    currentStep = 1;
    
    // Reset form fields
    document.getElementById('riskForm').reset();
    
    // Clear any error states
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
        el.classList.remove('show');
    });
    
    // Reset to first step
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    document.querySelector('.form-step[data-step="1"]').classList.add('active');
    
    // Update UI
    updateProgressBar();
    updateNavigation();
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Add some additional CSS for success state
const style = document.createElement('style');
style.textContent = `
    .btn-success {
        background-color: var(--success) !important;
        color: white !important;
    }
`;
document.head.appendChild(style);
