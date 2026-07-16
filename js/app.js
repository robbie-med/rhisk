// papcalc — main application controller
const App = (function() {
  // State
  let state = {
    page: null,
    currentState: 'intro',
    history: [],
    currentAlgoFile: null,
    currentAlgoName: null,
    diagnosis: null,
    patientAge: null,
    patients: [],
    selectedPatientId: null,
    // Extended patient info
    patientInfo: {
      lmp: '',
      lifetimePartners: '',
      ageFirstIntercourse: '',
      birthControl: '',
      gravida: '',
      para: '',
      hiv: '',
      clinicalNotes: '',
    }
  };

  // ----- Navigation -----

  function init() {
    // Load patients
    state.patients = Storage.getAll();

    // Check for share link
    const shared = Storage.parseShareLink();
    if (shared) {
      loadSharedData(shared);
      return;
    }

    // Load saved patient if any
    if (state.selectedPatientId) {
      const saved = Storage.getById(state.selectedPatientId);
      if (saved) restoreSession(saved);
    }

    // Start with global algorithm
    Engine.setAlgorithm(ALGORITHM_DATA['global']);
    gotoState('intro');
  }

  function loadSharedData(shared) {
    if (shared.d) {
      const algo = ALGORITHMS.find(a => a.algorithm === shared.d || a.diagnosis === shared.d);
      if (algo) {
        loadAlgorithm(algo.algorithm || algo.filename, algo.diagnosis);
        if (shared.a) Engine.setVariable('patient_age', shared.a);
        if (shared.r) {
          for (const [k, v] of Object.entries(shared.r)) {
            Engine.setVariable(k, v);
          }
        }
        if (shared.n) state.patientInfo.clinicalNotes = shared.n;
        gotoState('confirmation');
        return;
      }
    }
    // Fallback to normal start
    Engine.setAlgorithm(ALGORITHM_DATA['global']);
    gotoState('intro');
  }

  function gotoState(s) {
    state.currentState = s;
    state.page = Engine.reevaluate(s);

    // If no recommendation from engine, compute locally using risk tables
    if (s === 'recommendation' && state.currentAlgoFile) {
      const hasRecommendation = state.page.content.some(
        c => c.type === 'recommendation' && c.risk
      );
      if (!hasRecommendation && typeof RiskCalculator !== 'undefined') {
        const vars = Engine.getVars();
        const rec = RiskCalculator.generateRecommendation(vars);
        if (rec && rec.risk) {
          // Replace the no-recommendation overlay with actual risk data
          state.page.content = [rec];
        }
      }
    }

    if (typeof render === 'function') render();
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }

  function goBack() {
    if (state.history.length === 0) return;
    const prev = state.history.pop();
    state.currentState = prev.currentState;
    state.page = prev.page;
    if (typeof render === 'function') render();
  }

  function goNext() {
    // If on global intro and we have diagnosis/age, load the specific algorithm
    if (!state.currentAlgoFile) {
      const diagnosis = Engine.getVariable('diagnosis');
      const patientAge = Engine.getVariable('patient_age');

      if (diagnosis && patientAge && diagnosis !== true) {
        const match = ALGORITHMS.find(a =>
          a.name === diagnosis || a.diagnosis === diagnosis || a.title === diagnosis
        );
        if (match && match.filename) {
          loadAlgorithm(match.filename, match.diagnosis || match.name);
          return;
        }
        const dmatch = DIAGNOSES.find(d =>
          d.name === diagnosis || d.title === diagnosis
        );
        if (dmatch && dmatch.filename) {
          loadAlgorithm(dmatch.filename, dmatch.name);
          return;
        }
      }
    }

    state.history.push({ currentState: state.currentState, page: state.page });

    if (state.currentState === 'intro') {
      gotoState('confirmation');
    } else if (state.currentState === 'confirmation') {
      gotoState('recommendation');
    } else {
      gotoState('recommendation');
    }
  }

  function loadAlgorithm(filename, diagnosisName) {
    state.currentAlgoFile = filename;
    state.currentAlgoName = diagnosisName;
    const data = ALGORITHM_DATA[filename];
    if (data) {
      Engine.setAlgorithm(data);
      Engine.setVariable('diagnosis', diagnosisName || '');
      Engine.setVariable('patient_age', state.patientAge || '');
      gotoState('intro');
    }
  }

  function startOver() {
    state.history = [];
    state.currentAlgoFile = null;
    state.currentAlgoName = null;
    Engine.reset();
    Engine.setAlgorithm(ALGORITHM_DATA['global']);
    gotoState('intro');
  }

  function setAnswer(id, value) {
    console.log('SET_ANSWER:', id, '=', JSON.stringify(value), 'current:', JSON.stringify(Engine.getVariable(id)));
    Engine.setVariable(id, value);
    console.log('AFTER_SET:', id, '=', JSON.stringify(Engine.getVariable(id)));
    if (id === '_patient_age') state.patientAge = value;
    if (id === 'clinical_situation') state.diagnosis = value;
    // Re-evaluate current state to update derived vars and visibility
    state.page = Engine.reevaluate(state.currentState);
    autoSave();
    if (typeof render === 'function') render();
  }

  function toggleSwitch(id, value) {
    const subKey = id + '_' + value;
    const currentVal = Engine.getVariable(subKey);
    Engine.setVariable(subKey, !currentVal);
    autoSave();
    if (typeof render === 'function') render();
  }

  // ----- Persistence -----

  function autoSave() {
    if (!state.selectedPatientId) return;
    const record = buildPatientRecord();
    Storage.save(record);
  }

  function buildPatientRecord() {
    return {
      id: state.selectedPatientId,
      algorithmFile: state.currentAlgoFile,
      algorithmName: state.currentAlgoName,
      age: state.patientAge,
      diagnosis: state.diagnosis,
      variables: Engine.getVars(),
      currentState: state.currentState,
      patientInfo: { ...state.patientInfo },
      page: state.page,
    };
  }

  function savePatient() {
    const record = buildPatientRecord();
    if (!state.selectedPatientId) {
      state.selectedPatientId = record.id || Storage.generateId();
      record.id = state.selectedPatientId;
    }
    Storage.save(record);
    state.patients = Storage.getAll();
    renderPatientList();
    return record;
  }

  function loadPatient(id) {
    const record = Storage.getById(id);
    if (!record) return;
    restoreSession(record);
  }

  function restoreSession(record) {
    state.selectedPatientId = record.id;
    state.currentAlgoFile = record.algorithmFile;
    state.currentAlgoName = record.algorithmName;
    state.patientAge = record.age;
    state.diagnosis = record.diagnosis;
    state.patientInfo = record.patientInfo || { lmp:'',lifetimePartners:'',ageFirstIntercourse:'',birthControl:'',gravida:'',para:'',hiv:'',clinicalNotes:'' };
    state.currentState = record.currentState || 'intro';

    if (record.algorithmFile && ALGORITHM_DATA[record.algorithmFile]) {
      Engine.setAlgorithm(ALGORITHM_DATA[record.algorithmFile]);
    } else {
      Engine.setAlgorithm(ALGORITHM_DATA['global']);
    }
    if (record.variables) Engine.setVars(record.variables);

    state.page = Engine.reevaluate(state.currentState);
    if (typeof render === 'function') render();
  }

  function deletePatient(id) {
    Storage.remove(id);
    state.patients = Storage.getAll();
    if (state.selectedPatientId === id) {
      state.selectedPatientId = null;
      startOver();
    }
    renderPatientList();
  }

  function newPatient() {
    state.selectedPatientId = null;
    state.patientInfo = { lmp:'',lifetimePartners:'',ageFirstIntercourse:'',birthControl:'',gravida:'',para:'',hiv:'',clinicalNotes:'' };
    startOver();
  }

  // ----- UI Rendering (called by app.js which handles DOM) -----

  function getState() { return state; }

  return {
    init, gotoState, goBack, goNext, startOver, setAnswer, toggleSwitch,
    savePatient, loadPatient, deletePatient, newPatient,
    getState, buildPatientRecord,
  };
})();
