// papcalc — localStorage persistence, export/import, shareable links
const Storage = (function() {
  const STORAGE_KEY = 'papcalc_patients';
  const VERSION = 1;

  function getAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveAll(patients) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      return true;
    } catch (e) {
      return false;
    }
  }

  function save(patient) {
    const patients = getAll();
    // Add metadata
    const record = {
      ...patient,
      id: patient.id || generateId(),
      version: VERSION,
      createdAt: patient.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const idx = patients.findIndex(p => p.id === record.id);
    if (idx >= 0) patients[idx] = record;
    else patients.push(record);
    saveAll(patients);
    return record;
  }

  function remove(id) {
    const patients = getAll().filter(p => p.id !== id);
    saveAll(patients);
  }

  function getById(id) {
    return getAll().find(p => p.id === id) || null;
  }

  function generateId() {
    return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  // Export single patient or all patients
  function exportData(id) {
    if (id) {
      const p = getById(id);
      return p ? JSON.stringify(p, null, 2) : null;
    }
    return JSON.stringify(getAll(), null, 2);
  }

  // Import from JSON string, returns { success, count, errors }
  function importData(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      const items = Array.isArray(data) ? data : [data];
      let count = 0;
      for (const item of items) {
        if (item.id || item.algorithmName) {
          save(item);
          count++;
        }
      }
      return { success: true, count };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // Generate a shareable link with encoded patient data
  function generateShareLink(patientData) {
    const payload = {
      v: VERSION,
      d: patientData, // algorithm name
      a: patientData.age,
      r: patientData.results, // key variables
      n: patientData.notes ? patientData.notes.substring(0, 500) : '',
    };
    try {
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const base = window.location.origin + window.location.pathname;
      return base + '?share=' + encoded;
    } catch (e) {
      return null;
    }
  }

  // Parse share link parameter
  function parseShareLink() {
    const params = new URLSearchParams(window.location.search);
    const share = params.get('share');
    if (!share) return null;
    try {
      const json = decodeURIComponent(escape(atob(share)));
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }

  // Backup all data as downloadable JSON file
  function downloadBackup() {
    const data = exportData();
    if (!data) return false;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'papcalc_backup_' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }

  // Trigger file picker for import
  function importFile(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = importData(ev.target.result);
        callback(result);
      };
      reader.readAsText(file);
    };
    input.click();
  }

  return {
    getAll, save, remove, getById,
    exportData, importData, importFile, downloadBackup,
    generateShareLink, parseShareLink,
  };
})();
