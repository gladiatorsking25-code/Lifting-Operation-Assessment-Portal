// storage.js — localStorage-backed data layer.
// Everything lives in the browser's localStorage under one namespace, so the
// app works offline on GitHub Pages with no server. Use Backup/Restore
// (see settings.html) regularly since clearing browser data will erase records.

const DB = {
  KEYS: {
    assessments: 'cla_assessments',
    permits: 'cla_permits',
    counter: 'cla_permit_counter',
    checklists: 'cla_checklists',
    projects: 'cla_projects',
    logs: 'cla_logs'
  },

  _get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Storage read failed for', key, e);
      return [];
    }
  },

  _set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage write failed for', key, e);
      alert('Could not save: browser storage may be full or disabled.');
      return false;
    }
  },

  // Fire-and-forget hooks into js/cloud-sync.js. Both are no-ops unless
  // Firebase has been configured (see js/firebase-config.js) and the user is
  // signed in with a real (Firebase) account — the app behaves exactly as it
  // did before cloud sync existed until then. Wrapped defensively so a
  // missing/unloaded CloudSync never breaks a plain local save.
  _cloudPush(collectionName, record) {
    try {
      if (typeof CloudSync !== 'undefined') CloudSync.push(collectionName, record);
    } catch (e) { console.error('Cloud sync push skipped', e); }
  },
  _cloudRemove(collectionName, id) {
    try {
      if (typeof CloudSync !== 'undefined') CloudSync.remove(collectionName, id);
    } catch (e) { console.error('Cloud sync remove skipped', e); }
  },

  // ---- Assessments ----
  getAssessments() {
    return this._get(this.KEYS.assessments);
  },
  saveAssessment(assessment) {
    const list = this.getAssessments();
    assessment.id = assessment.id || ('A-' + Date.now());
    list.push(assessment);
    this._set(this.KEYS.assessments, list);
    this._cloudPush('assessments', assessment);
    return assessment;
  },
  deleteAssessment(id) {
    const list = this.getAssessments().filter(a => a.id !== id);
    this._set(this.KEYS.assessments, list);
    this._cloudRemove('assessments', id);
  },

  // ---- Permits ----
  getPermits() {
    return this._get(this.KEYS.permits);
  },
  savePermit(permit) {
    const list = this.getPermits();
    const idx = list.findIndex(p => p.id === permit.id);
    if (idx >= 0) {
      list[idx] = permit;
    } else {
      permit.id = permit.id || ('P-' + Date.now());
      list.push(permit);
    }
    this._set(this.KEYS.permits, list);
    this._cloudPush('permits', permit);
    return permit;
  },
  deletePermit(id) {
    const list = this.getPermits().filter(p => p.id !== id);
    this._set(this.KEYS.permits, list);
    this._cloudRemove('permits', id);
  },
  nextPermitNumber() {
    let n = parseInt(localStorage.getItem(this.KEYS.counter) || '0', 10) + 1;
    localStorage.setItem(this.KEYS.counter, String(n));
    const year = new Date().getFullYear();
    return `LP-${year}-${String(n).padStart(4, '0')}`;
  },

  // ---- Equipment checklists (monthly inspection & maintenance) ----
  getChecklists() {
    return this._get(this.KEYS.checklists);
  },
  saveChecklist(checklist) {
    const list = this.getChecklists();
    const idx = checklist.id ? list.findIndex(c => c.id === checklist.id) : -1;
    if (idx >= 0) {
      list[idx] = checklist;
    } else {
      checklist.id = checklist.id || ('C-' + Date.now());
      list.push(checklist);
    }
    this._set(this.KEYS.checklists, list);
    this._cloudPush('checklists', checklist);
    return checklist;
  },
  deleteChecklist(id) {
    const list = this.getChecklists().filter(c => c.id !== id);
    this._set(this.KEYS.checklists, list);
    this._cloudRemove('checklists', id);
  },

  // ---- Projects ----
  // A project is the top-level container the app organises work under. Every
  // log entry (and, in future, assessments/permits) can belong to a project,
  // and each project can point at its own Google Drive folder + linked log
  // sheet so documents are filed per project.
  getProjects() {
    return this._get(this.KEYS.projects);
  },
  getProject(id) {
    return this.getProjects().find(p => p.id === id) || null;
  },
  saveProject(project) {
    const list = this.getProjects();
    const idx = project.id ? list.findIndex(p => p.id === project.id) : -1;
    project.updatedAt = Date.now();
    if (idx >= 0) {
      list[idx] = project;
    } else {
      project.id = project.id || ('PRJ-' + Date.now());
      project.createdAt = project.createdAt || Date.now();
      list.push(project);
    }
    this._set(this.KEYS.projects, list);
    this._cloudPush('projects', project);
    return project;
  },
  deleteProject(id) {
    const list = this.getProjects().filter(p => p.id !== id);
    this._set(this.KEYS.projects, list);
    this._cloudRemove('projects', id);
  },

  // ---- Project logs ----
  // A running log of project activity: lifts, deliveries, inspections,
  // toolbox talks, incidents, visits, notes — with the people involved so a
  // project's history and who was on site stays easy to track. Logs can be
  // edited later and those updates re-sync to the cloud like any other record.
  getLogs() {
    return this._get(this.KEYS.logs);
  },
  getLog(id) {
    return this.getLogs().find(l => l.id === id) || null;
  },
  getLogsForProject(projectId) {
    return this.getLogs().filter(l => l.projectId === projectId);
  },
  saveLog(log) {
    const list = this.getLogs();
    const idx = log.id ? list.findIndex(l => l.id === log.id) : -1;
    log.updatedAt = Date.now();
    if (idx >= 0) {
      list[idx] = log;
    } else {
      log.id = log.id || ('LOG-' + Date.now());
      log.createdAt = log.createdAt || Date.now();
      list.push(log);
    }
    this._set(this.KEYS.logs, list);
    this._cloudPush('logs', log);
    return log;
  },
  deleteLog(id) {
    const list = this.getLogs().filter(l => l.id !== id);
    this._set(this.KEYS.logs, list);
    this._cloudRemove('logs', id);
  },

  // ---- Backup / restore ----
  exportAll() {
    return {
      exportedAt: new Date().toISOString(),
      assessments: this.getAssessments(),
      permits: this.getPermits(),
      checklists: this.getChecklists(),
      projects: this.getProjects(),
      logs: this.getLogs()
    };
  },
  // Backups written before a collection existed simply have no key for it —
  // `|| []` keeps those files importable, and a merge of an old backup leaves
  // any records already on this device alone.
  importAll(data, mode = 'merge') {
    if (mode === 'replace') {
      this._set(this.KEYS.assessments, data.assessments || []);
      this._set(this.KEYS.permits, data.permits || []);
      this._set(this.KEYS.checklists, data.checklists || []);
      this._set(this.KEYS.projects, data.projects || []);
      this._set(this.KEYS.logs, data.logs || []);
      return;
    }
    const merge = (key, incoming) => {
      const existing = this._get(key);
      const ids = new Set(existing.map(r => r.id));
      (incoming || []).forEach(r => { if (!ids.has(r.id)) existing.push(r); });
      this._set(key, existing);
    };
    merge(this.KEYS.assessments, data.assessments);
    merge(this.KEYS.permits, data.permits);
    merge(this.KEYS.checklists, data.checklists);
    merge(this.KEYS.projects, data.projects);
    merge(this.KEYS.logs, data.logs);
  }
};

// ---- Crane engineering calculations ----
const CraneCalc = {
  // Builds a { numericKey: originalStringKey } map so lookups work regardless of how
  // the JSON keys were formatted (e.g. "3" vs "3.0"). Fixes a bug where table[3] (a
  // numeric bracket access, which coerces to the string "3") silently missed a chart
  // entry stored as "3.0", returning undefined instead of the actual capacity.
  _numericKeyMap(table) {
    const map = new Map();
    for (const k of Object.keys(table)) map.set(Number(k), k);
    return map;
  },

  // Finds the exact boom-length entry in a chart, tolerant of the requested value
  // being e.g. 43.5 vs a stored key of "43.50".
  _findBoomKey(chart, boomLength) {
    const map = this._numericKeyMap(chart);
    if (map.has(Number(boomLength))) return map.get(Number(boomLength));
    return null;
  },

  interpolateCapacityKg(table, radius) {
    const keyMap = this._numericKeyMap(table);
    const radii = [...keyMap.keys()].sort((a, b) => a - b);
    if (radii.length === 0) return null;
    if (radius < radii[0]) return null; // below the chart's minimum radius for this boom
    if (radius > radii[radii.length - 1]) return 0; // beyond max radius: no capacity

    let lower = radii[0], upper = radii[radii.length - 1];
    for (let i = 0; i < radii.length; i++) {
      if (radii[i] <= radius) lower = radii[i];
      if (radii[i] >= radius) { upper = radii[i]; break; }
    }
    const lowCap = table[keyMap.get(lower)];
    const upCap = table[keyMap.get(upper)];
    if (lower === upper) return lowCap;
    const frac = (radius - lower) / (upper - lower);
    return lowCap + (upCap - lowCap) * frac;
  },

  // Returns the [min, max] working radius the chart actually covers for a given boom
  // length (exact chart entry only — used to validate input before interpolating).
  radiusRangeForBoom(craneSpec, configName, boomLength) {
    const chart = craneSpec.loadCharts[configName];
    if (!chart) return null;
    const boomKey = this._findBoomKey(chart, boomLength);
    if (!boomKey) return null;
    const radii = Object.keys(chart[boomKey]).map(Number).sort((a, b) => a - b);
    if (radii.length === 0) return null;
    return { min: radii[0], max: radii[radii.length - 1] };
  },

  // Interpolates across boom length too, in case the exact boom length isn't a chart entry.
  maxCapacityTonnes(craneSpec, configName, boomLength, radius) {
    const chart = craneSpec.loadCharts[configName];
    if (!chart) return { capacity: 0, error: `Configuration "${configName}" not found.` };

    const boomKeyMap = this._numericKeyMap(chart);
    const booms = [...boomKeyMap.keys()].sort((a, b) => a - b);
    if (boomKeyMap.has(Number(boomLength))) {
      const table = chart[boomKeyMap.get(Number(boomLength))];
      const kg = this.interpolateCapacityKg(table, radius);
      if (kg === null) {
        const range = this.radiusRangeForBoom(craneSpec, configName, boomLength);
        return { capacity: 0, error: `Radius ${radius} m is below this boom length's minimum working radius${range ? ` of ${range.min} m` : ''}.` };
      }
      return { capacity: kg / 1000, error: null };
    }
    // interpolate between nearest boom lengths
    let lower = booms[0], upper = booms[booms.length - 1];
    for (let i = 0; i < booms.length; i++) {
      if (booms[i] <= boomLength) lower = booms[i];
      if (booms[i] >= boomLength) { upper = booms[i]; break; }
    }
    const lowTable = chart[boomKeyMap.get(lower)];
    const upTable = chart[boomKeyMap.get(upper)];
    const lowKg = this.interpolateCapacityKg(lowTable, radius) || 0;
    const upKg = this.interpolateCapacityKg(upTable, radius) || 0;
    if (lower === upper) return { capacity: lowKg / 1000, error: null };
    const frac = (boomLength - lower) / (upper - lower);
    const kg = lowKg + (upKg - lowKg) * frac;
    return { capacity: kg / 1000, error: null };
  },

  // ---- Jib (angle-indexed) charts ----
  // jibChart shape: { jibLength: { offsetDeg: { boomAngleDeg: capacityKg } } }
  interpolateAngleCapacityKg(table, angle) {
    const keyMap = this._numericKeyMap(table);
    const angles = [...keyMap.keys()].sort((a, b) => a - b);
    if (angles.length === 0) return null;
    if (angle < angles[0] || angle > angles[angles.length - 1]) return null; // outside the printed angle range
    let lower = angles[0], upper = angles[angles.length - 1];
    for (let i = 0; i < angles.length; i++) {
      if (angles[i] <= angle) lower = angles[i];
      if (angles[i] >= angle) { upper = angles[i]; break; }
    }
    const lowCap = table[keyMap.get(lower)];
    const upCap = table[keyMap.get(upper)];
    if (lower === upper) return lowCap;
    const frac = (angle - lower) / (upper - lower);
    return lowCap + (upCap - lowCap) * frac;
  },

  angleRangeForJib(craneSpec, jibConfigName, jibLength, offset) {
    const chart = craneSpec.jibCharts && craneSpec.jibCharts[jibConfigName];
    if (!chart) return null;
    const lenMap = this._numericKeyMap(chart);
    const lenKey = lenMap.get(Number(jibLength));
    if (!lenKey) return null;
    const offMap = this._numericKeyMap(chart[lenKey]);
    const offKey = offMap.get(Number(offset));
    if (!offKey) return null;
    const angles = Object.keys(chart[lenKey][offKey]).map(Number).sort((a, b) => a - b);
    if (angles.length === 0) return null;
    return { min: angles[0], max: angles[angles.length - 1] };
  },

  maxJibCapacityTonnes(craneSpec, jibConfigName, jibLength, offset, angle) {
    const chart = craneSpec.jibCharts && craneSpec.jibCharts[jibConfigName];
    if (!chart) return { capacity: 0, error: `Jib configuration "${jibConfigName}" not found.` };
    const lenMap = this._numericKeyMap(chart);
    const lenKey = lenMap.get(Number(jibLength));
    if (!lenKey) return { capacity: 0, error: `Jib length ${jibLength} m not found for this configuration.` };
    const offMap = this._numericKeyMap(chart[lenKey]);
    const offKey = offMap.get(Number(offset));
    if (!offKey) return { capacity: 0, error: `Jib offset ${offset}° not found for this configuration.` };
    const table = chart[lenKey][offKey];
    const kg = this.interpolateAngleCapacityKg(table, angle);
    if (kg === null) {
      const range = this.angleRangeForJib(craneSpec, jibConfigName, jibLength, offset);
      return { capacity: 0, error: `Boom angle ${angle}° is outside the chart's printed range${range ? ` of ${range.min}°–${range.max}°` : ''}.` };
    }
    return { capacity: kg / 1000, error: null };
  }
};

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}
