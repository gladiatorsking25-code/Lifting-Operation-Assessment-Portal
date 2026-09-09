renderSidebar('assessment');

const craneModelSel = document.getElementById('craneModel');
const liftModeSel = document.getElementById('liftMode');
const configSel = document.getElementById('configuration');
const boomConfigRow = document.getElementById('boomConfigRow');
const jibConfigRow = document.getElementById('jibConfigRow');
const jibConfigSel = document.getElementById('jibConfiguration');
const jibLengthSel = document.getElementById('jibLength');
const jibLengthField = document.getElementById('jibLengthField');
const jibOffsetSel = document.getElementById('jibOffset');
const boomSel = document.getElementById('boomLength');
const boomLengthField = document.getElementById('boomLengthField');
const loadInput = document.getElementById('loadWeight');
const radiusInput = document.getElementById('radius');
const radiusField = document.getElementById('radiusField');
const radiusHint = document.getElementById('radiusHint');
const boomAngleInput = document.getElementById('boomAngle');
const boomAngleField = document.getElementById('boomAngleField');
const angleHint = document.getElementById('angleHint');
const windInput = document.getElementById('windSpeed');
const windHint = document.getElementById('windHint');
const rangeWarning = document.getElementById('rangeWarning');
const resultPanel = document.getElementById('resultPanel');
const saveRow = document.getElementById('saveRow');

let lastResult = null;

function currentSpec() {
  return CRANE_DATA[craneModelSel.value];
}

function isJibMode() {
  return liftModeSel.value === 'jib';
}

function populateCraneModels() {
  craneModelSel.innerHTML = Object.keys(CRANE_DATA)
    .map(m => `<option value="${m}">${m} — ${CRANE_DATA[m].maxCapacity}t max</option>`).join('');
  onModelOrModeChange();
}

function onModelOrModeChange() {
  const spec = currentSpec();
  const hasJib = spec.jibCharts && Object.keys(spec.jibCharts).length > 0;
  liftModeSel.querySelector('option[value="jib"]').disabled = !hasJib;
  if (!hasJib && isJibMode()) liftModeSel.value = 'boom';

  if (isJibMode()) {
    boomConfigRow.style.display = 'none';
    jibConfigRow.style.display = '';
    radiusField.style.display = 'none';
    boomAngleField.style.display = '';
    boomLengthField.style.display = 'none';
    populateJibConfigs();
  } else {
    boomConfigRow.style.display = '';
    jibConfigRow.style.display = 'none';
    radiusField.style.display = '';
    boomAngleField.style.display = 'none';
    boomLengthField.style.display = '';
    populateConfigs();
  }
  resetResult();
}

function populateConfigs() {
  const spec = currentSpec();
  configSel.innerHTML = Object.keys(spec.loadCharts).map(c => `<option value="${c}">${c}</option>`).join('');
  populateBoomLengths();
}

function populateBoomLengths() {
  const spec = currentSpec();
  boomSel.innerHTML = spec.boomLengths.map(b => `<option value="${b}">${b.toFixed(2)} m</option>`).join('');
  updateRadiusHint();
  updateWindHint();
}

function updateRadiusHint() {
  const spec = currentSpec();
  const config = configSel.value;
  const boom = parseFloat(boomSel.value);
  const range = CraneCalc.radiusRangeForBoom(spec, config, boom);
  if (range) {
    radiusInput.placeholder = `${range.min}–${range.max} m for this boom`;
    radiusHint.textContent = `This boom length's chart covers ${range.min}–${range.max} m radius.`;
  } else {
    radiusInput.placeholder = '';
    radiusHint.textContent = '';
  }
}

function updateWindHint() {
  const spec = currentSpec();
  windHint.textContent = `Crane rated to ${spec.maxWindSpeed} m/s — lifting must stop above this.`;
}

function populateJibConfigs() {
  const spec = currentSpec();
  jibConfigSel.innerHTML = Object.keys(spec.jibCharts).map(c => `<option value="${c}">${c}</option>`).join('');
  populateJibLengths();
}

function populateJibLengths() {
  const spec = currentSpec();
  const chart = spec.jibCharts[jibConfigSel.value];
  const lengths = Object.keys(chart).map(Number).sort((a, b) => a - b);
  jibLengthSel.innerHTML = lengths.map(l => `<option value="${l}">${l} m</option>`).join('');
  // fixed-length jibs (only one option) — hide the selector, it's not a real choice
  jibLengthField.style.display = lengths.length > 1 ? '' : 'none';
  populateJibOffsets();
}

function populateJibOffsets() {
  const spec = currentSpec();
  const chart = spec.jibCharts[jibConfigSel.value];
  const lenKey = Object.keys(chart).find(k => Number(k) === Number(jibLengthSel.value));
  const offsets = Object.keys(chart[lenKey]).map(Number).sort((a, b) => a - b);
  jibOffsetSel.innerHTML = offsets.map(o => `<option value="${o}">${o}°</option>`).join('');
  updateAngleHint();
  updateWindHint();
}

function updateAngleHint() {
  const spec = currentSpec();
  const range = CraneCalc.angleRangeForJib(spec, jibConfigSel.value, jibLengthSel.value, jibOffsetSel.value);
  if (range) {
    boomAngleInput.placeholder = `${range.min}–${range.max}°`;
    angleHint.textContent = `Chart covers ${range.min}°–${range.max}° boom angle for this jib length/offset.`;
  } else {
    boomAngleInput.placeholder = '';
    angleHint.textContent = '';
  }
}

craneModelSel.addEventListener('change', onModelOrModeChange);
liftModeSel.addEventListener('change', onModelOrModeChange);
configSel.addEventListener('change', () => { populateBoomLengths(); resetResult(); });
boomSel.addEventListener('change', () => { updateRadiusHint(); resetResult(); });
jibConfigSel.addEventListener('change', () => { populateJibLengths(); resetResult(); });
jibLengthSel.addEventListener('change', () => { populateJibOffsets(); resetResult(); });
jibOffsetSel.addEventListener('change', () => { updateAngleHint(); resetResult(); });

function resetResult() {
  resultPanel.innerHTML = '';
  saveRow.style.display = 'none';
  lastResult = null;
}

// live wind warning as the user types
windInput.addEventListener('input', () => {
  const spec = currentSpec();
  const w = parseFloat(windInput.value);
  if (!isNaN(w) && w > spec.maxWindSpeed) {
    rangeWarning.innerHTML = `<div class="banner banner-danger">
      <svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2z" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M12 9v5M12 17h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      <div>Wind speed (${w} m/s) exceeds this crane's ${spec.maxWindSpeed} m/s limit. Lifting operations must not proceed.</div>
    </div>`;
  } else if (!isNaN(w) && w > spec.maxWindSpeed * 0.8) {
    rangeWarning.innerHTML = `<div class="banner banner-warn">
      <svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2z" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M12 9v5M12 17h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      <div>Wind speed is approaching the ${spec.maxWindSpeed} m/s limit. Monitor conditions closely.</div>
    </div>`;
  } else {
    rangeWarning.innerHTML = '';
  }
});

document.getElementById('btnReset').addEventListener('click', () => {
  loadInput.value = ''; radiusInput.value = ''; boomAngleInput.value = ''; windInput.value = '0';
  rangeWarning.innerHTML = '';
  resetResult();
});

document.getElementById('btnCalculate').addEventListener('click', calculate);

function calculateBoomMode(spec) {
  const config = configSel.value;
  const boom = parseFloat(boomSel.value);
  const load = parseFloat(loadInput.value);
  const radius = parseFloat(radiusInput.value);
  const wind = parseFloat(windInput.value);

  const errors = [];
  if (isNaN(load) || load <= 0) errors.push('Enter a valid load weight.');
  else if (load > spec.maxCapacity) errors.push(`Load weight cannot exceed the crane's rated ${spec.maxCapacity} t maximum capacity.`);
  if (isNaN(radius) || radius <= 0) errors.push('Enter a valid working radius.');
  if (isNaN(wind) || wind < 0) errors.push('Enter a valid wind speed.');
  if (errors.length) return { errors };

  const { capacity, error } = CraneCalc.maxCapacityTonnes(spec, config, boom, radius);
  if (error) return { errors: [error] };

  return {
    errors: [], capacity,
    summaryRows: [
      ['Crane model', spec.model],
      ['Configuration', config],
      ['Boom length', `${boom.toFixed(2)} m`],
      ['Working radius', `${radius.toFixed(1)} m`],
    ],
    record: { craneModel: spec.model, configuration: config, boomLength: boom, workingRadius: radius, jibMode: false },
    load, wind
  };
}

function calculateJibMode(spec) {
  const jibConfig = jibConfigSel.value;
  const jibLength = parseFloat(jibLengthSel.value);
  const offset = parseFloat(jibOffsetSel.value);
  const angle = parseFloat(boomAngleInput.value);
  const load = parseFloat(loadInput.value);
  const wind = parseFloat(windInput.value);

  const errors = [];
  if (isNaN(load) || load <= 0) errors.push('Enter a valid load weight.');
  if (isNaN(angle) || angle <= 0) errors.push('Enter a valid boom angle.');
  if (isNaN(wind) || wind < 0) errors.push('Enter a valid wind speed.');
  if (errors.length) return { errors };

  const { capacity, error } = CraneCalc.maxJibCapacityTonnes(spec, jibConfig, jibLength, offset, angle);
  if (error) return { errors: [error] };

  return {
    errors: [], capacity,
    summaryRows: [
      ['Crane model', spec.model],
      ['Configuration', jibConfig],
      ['Jib length', `${jibLength} m`],
      ['Jib offset', `${offset}°`],
      ['Boom angle', `${angle.toFixed(1)}°`],
    ],
    record: { craneModel: spec.model, configuration: jibConfig, jibMode: true, jibLength, jibOffset: offset, boomAngle: angle },
    load, wind
  };
}

function calculate() {
  const spec = currentSpec();
  const out = isJibMode() ? calculateJibMode(spec) : calculateBoomMode(spec);

  if (out.errors.length) {
    resultPanel.innerHTML = `<div class="banner banner-danger" style="margin-top:16px;">${out.errors.join('<br>')}</div>`;
    saveRow.style.display = 'none';
    return;
  }

  const { capacity, summaryRows, record, load, wind } = out;
  const windOk = wind <= spec.maxWindSpeed;
  const capOk = load <= capacity && capacity > 0;
  const isValid = windOk && capOk;
  const utilization = capacity > 0 ? (load / capacity) * 100 : 999;

  let barColor = 'var(--ok-green)';
  if (utilization > 100) barColor = 'var(--danger-red)';
  else if (utilization > 85) barColor = 'var(--amber-dark)';

  let reasonText = '';
  if (!isValid) {
    const reasons = [];
    if (!windOk) reasons.push(`wind speed (${wind} m/s) exceeds the ${spec.maxWindSpeed} m/s limit`);
    if (!capOk) reasons.push(`load exceeds the interpolated chart capacity of ${capacity.toFixed(2)} t at this ${record.jibMode ? 'boom angle' : 'radius/boom'}`);
    reasonText = 'Lift is not permitted: ' + reasons.join('; ') + '.';
  } else {
    reasonText = utilization > 85
      ? 'Within capacity, but utilization is high — consider a longer boom or reduced radius to add margin.'
      : 'Load is within the crane\'s rated capacity for this configuration.';
  }

  const rowsHtml = summaryRows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');

  resultPanel.innerHTML = `
    <div class="result-panel">
      <div class="result-head ${isValid ? 'ok' : 'fail'}">
        <div class="verdict">${isValid ? '✓ Lift is allowed' : '✕ Lift is not allowed'}</div>
        <div class="util">${utilization < 999 ? utilization.toFixed(0) + '%' : '—'} of capacity</div>
      </div>
      <div class="result-body">
        <div class="util-bar-track"><div class="util-bar-fill" style="width:${Math.min(utilization,100)}%; background:${barColor};"></div></div>
        <p style="margin: 6px 0 16px; font-size: 13.5px; color: var(--ink-soft);">${reasonText}</p>
        <table class="spec-table">
          ${rowsHtml}
          <tr><td>Load weight</td><td>${load.toFixed(2)} t</td></tr>
          <tr><td>Chart capacity at this ${record.jibMode ? 'angle' : 'radius'}</td><td>${capacity.toFixed(2)} t</td></tr>
          <tr><td>Wind speed</td><td>${wind.toFixed(1)} m/s (limit ${spec.maxWindSpeed})</td></tr>
        </table>
        ${record.jibMode ? '<p class="hint" style="margin-top:10px;">Note: this is a boom-angle-indexed jib chart, as printed by the manufacturer. Cross-check the corresponding lifting-height diagram for the actual radius this angle produces before positioning the load.</p>' : ''}
      </div>
    </div>
  `;

  lastResult = { spec, config: record.configuration, load, wind, capacity, isValid, utilization, record };
  saveRow.style.display = 'block';
  document.getElementById('saveConfirm').textContent = '';
}

document.getElementById('btnSave').addEventListener('click', () => {
  if (!lastResult) return;
  const assessorName = document.getElementById('assessorName').value.trim();
  if (!assessorName) {
    alert('Enter the name of the person carrying out this assessment before saving.');
    return;
  }
  const notes = document.getElementById('notes').value.trim();
  const r = lastResult;

  const record = Object.assign({
    date: new Date().toISOString(),
    craneModel: r.spec.model,
    configuration: r.config,
    loadWeight: r.load,
    windSpeed: r.wind,
    maximumCapacity: r.capacity,
    utilization: r.utilization,
    isValid: r.isValid,
    assessorName,
    notes
  }, r.record.jibMode
    ? { jibMode: true, boomLength: r.spec.maxBoomLength, jibLength: r.record.jibLength, jibOffset: r.record.jibOffset, boomAngle: r.record.boomAngle, workingRadius: null }
    : { jibMode: false, boomLength: r.record.boomLength, workingRadius: r.record.workingRadius });

  DB.saveAssessment(record);
  document.getElementById('saveConfirm').textContent = 'Saved to history ✓';
});

populateCraneModels();
