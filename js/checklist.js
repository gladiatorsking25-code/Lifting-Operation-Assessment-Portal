// checklist.js — controller for checklist.html.
//
// Holds the answers in memory as { itemId: { status, note } }, re-renders the
// section list whenever the equipment type or language changes, and keeps the
// running summary and suggested verdict in step with the answers.
//
// Saved record shape (see DB.getChecklists()):
//   { id, savedAt, lang, equipmentType, make, model, serial, assetNo, plateNo,
//     capacity, hourMeter, odometer, location, project, contractor, operator,
//     month, inspectionDate, nextDue, inspector, inspectorId, supervisor,
//     colourScheme, tagFitted, verdict, verdictAuto, remarks,
//     answers: { itemId: { status, note } },
//     counts: { total, ok, monitor, defect, na, answered },
//     sigInspector, sigSupervisor }

(function () {
  'use strict';

  const STATUSES = ['ok', 'monitor', 'defect', 'na'];

  let answers = {};
  let editingId = null;
  let sigInspector = null;
  let sigSupervisor = null;

  const $ = (id) => document.getElementById(id);

  // ---------------------------------------------------------------------
  // Field wiring
  // ---------------------------------------------------------------------
  const FIELD_IDS = [
    'equipmentType', 'make', 'model', 'serial', 'assetNo', 'plateNo', 'capacity',
    'hourMeter', 'odometer', 'location', 'project', 'contractor', 'operator',
    'month', 'inspectionDate', 'nextDue', 'inspector', 'inspectorId', 'supervisor',
    'colourScheme', 'remarks'
  ];

  function readFields() {
    const out = {};
    FIELD_IDS.forEach(id => {
      const el = $(id);
      if (el) out[id] = el.value.trim ? el.value.trim() : el.value;
    });
    out.tagFitted = $('tagFitted').checked;
    out.verdict = document.querySelector('input[name="verdict"]:checked')?.value || 'fit';
    return out;
  }

  function writeFields(rec) {
    FIELD_IDS.forEach(id => {
      const el = $(id);
      if (el && rec[id] != null) el.value = rec[id];
    });
    $('tagFitted').checked = !!rec.tagFitted;
    const v = document.querySelector(`input[name="verdict"][value="${rec.verdict || 'fit'}"]`);
    if (v) v.checked = true;
  }

  function escapeHtml(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ---------------------------------------------------------------------
  // Equipment type dropdown
  // ---------------------------------------------------------------------
  function populateTypes() {
    const sel = $('equipmentType');
    const keep = sel.value;
    const lang = I18n.get();
    sel.innerHTML = `<option value="">${escapeHtml(I18n.t('f.selectPlaceholder'))}</option>` +
      EQUIPMENT_TYPES.map(t =>
        `<option value="${t.id}">${escapeHtml(t.name[lang] || t.name.en)}</option>`).join('');
    sel.value = keep;
  }

  function populateSchemes() {
    const sel = $('colourScheme');
    const keep = sel.value || 'monthly';
    sel.innerHTML = Object.values(COLOUR_SCHEMES)
      .map(s => `<option value="${s.id}">${escapeHtml(I18n.t(s.labelKey))}</option>`).join('');
    sel.value = keep;
  }

  // ---------------------------------------------------------------------
  // Checklist rendering
  // ---------------------------------------------------------------------
  function renderSections() {
    const typeId = $('equipmentType').value;
    const host = $('checklistSections');
    const lang = I18n.get();

    if (!typeId) {
      host.innerHTML = `<div class="card empty-state">${escapeHtml(I18n.t('msg.needType'))}</div>`;
      updateSummary();
      return;
    }

    const sections = ChecklistData.sectionsFor(typeId);

    host.innerHTML = sections.map(sec => {
      const title = sec.title[lang] || sec.title.en;
      return `
        <section class="chk-section${sec.maintenance ? ' chk-section-maint' : ''}" data-section="${sec.id}">
          <header class="chk-section-head">
            <span class="chk-section-icon">${ChecklistData.icon(sec.icon, 20)}</span>
            <h3>${escapeHtml(title)}</h3>
            <span class="chk-section-count" data-count-for="${sec.id}"></span>
          </header>
          <div class="chk-items">
            ${sec.items.map((item, i) => renderItem(sec, item, i, lang)).join('')}
          </div>
        </section>`;
    }).join('');

    host.querySelectorAll('.chk-status-btn').forEach(btn => {
      btn.addEventListener('click', onStatusClick);
    });
    host.querySelectorAll('.chk-note').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const id = e.target.getAttribute('data-note-for');
        answers[id] = answers[id] || { status: null, note: '' };
        answers[id].note = e.target.value;
      });
    });

    updateSummary();
  }

  function renderItem(sec, item, index, lang) {
    const a = answers[item.id] || {};
    const text = item.text[lang] || item.text.en;
    const noteOpen = a.status === 'monitor' || a.status === 'defect';
    return `
      <div class="chk-item${a.status ? ' answered status-' + a.status : ''}" data-item="${item.id}">
        <div class="chk-item-text">
          <span class="chk-item-no">${index + 1}</span>
          <span>${escapeHtml(text)}</span>
        </div>
        <div class="chk-status-group" role="group" aria-label="${escapeHtml(text)}">
          ${STATUSES.map(s => `
            <button type="button" class="chk-status-btn st-${s}${a.status === s ? ' selected' : ''}"
                    data-item-id="${item.id}" data-status="${s}"
                    aria-pressed="${a.status === s}"
                    title="${escapeHtml(I18n.t('st.' + s))}">
              <span class="chk-status-mark">${s === 'ok' ? '✓' : s === 'monitor' ? '!' : s === 'defect' ? '✕' : '–'}</span>
              <span class="chk-status-label">${escapeHtml(I18n.t('st.short.' + s))}</span>
            </button>`).join('')}
        </div>
        <input type="text" class="chk-note" data-note-for="${item.id}"
               placeholder="${escapeHtml(I18n.t('f.remarks'))}"
               value="${escapeHtml(a.note || '')}"
               style="${noteOpen ? '' : 'display:none;'}">
      </div>`;
  }

  function onStatusClick(e) {
    const btn = e.currentTarget;
    const id = btn.getAttribute('data-item-id');
    const status = btn.getAttribute('data-status');
    const row = btn.closest('.chk-item');

    // Clicking the selected status again clears it, so a mis-tap is undoable.
    const current = answers[id] && answers[id].status;
    const next = current === status ? null : status;

    answers[id] = answers[id] || { status: null, note: '' };
    answers[id].status = next;

    row.querySelectorAll('.chk-status-btn').forEach(b => {
      const on = b.getAttribute('data-status') === next;
      b.classList.toggle('selected', on);
      b.setAttribute('aria-pressed', String(on));
    });
    row.className = 'chk-item' + (next ? ' answered status-' + next : '');

    const note = row.querySelector('.chk-note');
    note.style.display = (next === 'monitor' || next === 'defect') ? '' : 'none';

    updateSummary();
  }

  // ---------------------------------------------------------------------
  // Summary, verdict and colour code
  // ---------------------------------------------------------------------
  function computeCounts() {
    const typeId = $('equipmentType').value;
    const sections = ChecklistData.sectionsFor(typeId);
    const counts = { total: 0, ok: 0, monitor: 0, defect: 0, na: 0, answered: 0 };
    sections.forEach(sec => sec.items.forEach(item => {
      counts.total++;
      const s = answers[item.id] && answers[item.id].status;
      if (s) { counts.answered++; counts[s]++; }
    }));
    return counts;
  }

  function suggestedVerdict(counts) {
    if (counts.defect > 0) return 'unfit';
    if (counts.monitor > 0) return 'conditional';
    return 'fit';
  }

  function updateSummary() {
    const counts = computeCounts();
    const pct = counts.total ? Math.round(counts.answered / counts.total * 100) : 0;

    $('sumTotal').textContent = counts.total;
    $('sumOk').textContent = counts.ok;
    $('sumMonitor').textContent = counts.monitor;
    $('sumDefect').textContent = counts.defect;
    $('sumNa').textContent = counts.na;
    $('sumProgressFill').style.width = pct + '%';
    $('sumProgressText').textContent = `${counts.answered} / ${counts.total} (${pct}%)`;

    // Per-section progress
    const typeId = $('equipmentType').value;
    ChecklistData.sectionsFor(typeId).forEach(sec => {
      const el = document.querySelector(`[data-count-for="${sec.id}"]`);
      if (!el) return;
      const done = sec.items.filter(i => answers[i.id] && answers[i.id].status).length;
      const bad = sec.items.filter(i => answers[i.id] && answers[i.id].status === 'defect').length;
      el.textContent = `${done}/${sec.items.length}`;
      el.classList.toggle('has-defect', bad > 0);
      el.classList.toggle('complete', done === sec.items.length && bad === 0);
    });

    // Suggested verdict — only moves the radio while the user hasn't overridden it.
    const sug = suggestedVerdict(counts);
    $('verdictSuggestion').textContent = I18n.t('v.' + sug);
    if (!$('verdictOverridden').value) {
      const r = document.querySelector(`input[name="verdict"][value="${sug}"]`);
      if (r) r.checked = true;
    }
    paintVerdict();
    return counts;
  }

  // Mirrors the checked radio onto its label as a class, so the verdict colour
  // works on browsers without :has() support (older Android WebViews).
  function paintVerdict() {
    document.querySelectorAll('.verdict-opt').forEach(lab => {
      const input = lab.querySelector('input[name="verdict"]');
      lab.classList.toggle('checked', !!(input && input.checked));
    });
  }

  function updateColour() {
    const parsed = ChecklistData.parseMonth($('month').value);
    const scheme = $('colourScheme').value;
    const box = $('colourSwatch');
    if (!parsed) {
      box.style.background = 'var(--steel-200)';
      box.style.color = 'var(--ink-soft)';
      box.textContent = '—';
      $('colourName').textContent = '—';
      return;
    }
    const c = ChecklistData.colourFor(parsed.monthIndex, scheme);
    const lang = I18n.get();
    box.style.background = c.hex;
    box.style.color = c.ink;
    box.textContent = ChecklistData.monthName(parsed.monthIndex, lang).slice(0, 3);
    $('colourName').textContent = `${c.name[lang] || c.name.en} — ${ChecklistData.monthName(parsed.monthIndex, lang)} ${parsed.year}`;
  }

  // Next inspection due = one month after the inspection date, unless the user
  // has typed something of their own.
  function autoNextDue() {
    const d = $('inspectionDate').value;
    if (!d || $('nextDue').dataset.touched === '1') return;
    const dt = new Date(d + 'T00:00:00');
    if (isNaN(dt)) return;
    dt.setMonth(dt.getMonth() + 1);
    $('nextDue').value = dt.toISOString().slice(0, 10);
  }

  // ---------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------
  function buildRecord() {
    const f = readFields();
    const counts = computeCounts();
    // Only keep answers for items that actually belong to this equipment type,
    // so switching type part-way doesn't leave orphan answers in the record.
    const validIds = new Set();
    ChecklistData.sectionsFor(f.equipmentType).forEach(s => s.items.forEach(i => validIds.add(i.id)));
    const cleaned = {};
    Object.entries(answers).forEach(([id, a]) => {
      if (validIds.has(id) && a && a.status) cleaned[id] = { status: a.status, note: a.note || '' };
    });

    return Object.assign({}, f, {
      id: editingId || undefined,
      savedAt: new Date().toISOString(),
      lang: I18n.get(),
      verdictAuto: suggestedVerdict(counts),
      answers: cleaned,
      counts,
      sigInspector,
      sigSupervisor
    });
  }

  function save() {
    const f = readFields();
    if (!f.equipmentType) { alert(I18n.t('msg.needType')); $('equipmentType').focus(); return; }
    if (!f.assetNo) { alert(I18n.t('msg.needAsset')); $('assetNo').focus(); return; }
    if (!f.inspector) { alert(I18n.t('msg.needInspector')); $('inspector').focus(); return; }

    const counts = computeCounts();
    const missing = counts.total - counts.answered;
    if (missing > 0 && !confirm(`${missing} ${I18n.t('msg.incomplete')}`)) return;

    const padI = $('sigInspectorPad');
    const padS = $('sigSupervisorPad');
    sigInspector = padI && padI.toDataUrlSafe ? padI.toDataUrlSafe() : null;
    sigSupervisor = padS && padS.toDataUrlSafe ? padS.toDataUrlSafe() : null;

    const rec = DB.saveChecklist(buildRecord());
    editingId = rec.id;
    const el = $('saveConfirm');
    el.textContent = I18n.t('msg.saved');
    el.className = 'banner banner-ok';
    setTimeout(() => { el.textContent = ''; el.className = ''; }, 6000);
  }

  // ---------------------------------------------------------------------
  // Email
  // ---------------------------------------------------------------------
  function currentDraft() {
    return ChecklistEmail.draft(buildRecord(), I18n.get());
  }

  function openEmailModal() {
    const f = readFields();
    if (!f.equipmentType) { alert(I18n.t('msg.needType')); return; }

    const d = currentDraft();
    $('emSubject').value = d.subject;
    $('emBody').value = d.body;
    $('emResult').innerHTML = '';
    $('emailModal').hidden = false;
    document.body.classList.add('modal-open');
    $('emTo').focus();
  }

  function closeEmailModal() {
    $('emailModal').hidden = true;
    document.body.classList.remove('modal-open');
  }

  // Collects and validates the address fields, showing which entries are bad
  // rather than silently dropping them.
  function gatherRecipients() {
    const to = Mailer.parseAddresses($('emTo').value);
    const cc = Mailer.parseAddresses($('emCc').value);
    const bad = to.invalid.concat(cc.invalid);
    if (bad.length) {
      $('emResult').innerHTML =
        `<div class="banner banner-danger"><div>${escapeHtml(I18n.t('em.badAddress'))} ${escapeHtml(bad.join(', '))}</div></div>`;
      return null;
    }
    if (!to.valid.length) {
      $('emResult').innerHTML =
        `<div class="banner banner-danger"><div>${escapeHtml(I18n.t('em.needTo'))}</div></div>`;
      return null;
    }
    return { to: to.valid, cc: cc.valid };
  }

  function msgFromForm(rcpt) {
    return {
      from: $('emFrom').value.trim(),
      to: rcpt.to,
      cc: rcpt.cc,
      subject: $('emSubject').value,
      body: $('emBody').value
    };
  }

  // ---------------------------------------------------------------------
  // Load an existing record (from the records page "View")
  // ---------------------------------------------------------------------
  function loadRecord(id) {
    const rec = DB.getChecklists().find(c => c.id === id);
    if (!rec) return false;
    editingId = rec.id;
    if (rec.lang) I18n.set(rec.lang);
    populateTypes();
    populateSchemes();
    writeFields(rec);
    answers = {};
    Object.entries(rec.answers || {}).forEach(([k, v]) => { answers[k] = Object.assign({}, v); });
    sigInspector = rec.sigInspector || null;
    sigSupervisor = rec.sigSupervisor || null;
    renderSections();
    updateColour();
    const padI = $('sigInspectorPad'), padS = $('sigSupervisorPad');
    if (padI && padI.loadDataUrl) padI.loadDataUrl(sigInspector);
    if (padS && padS.loadDataUrl) padS.loadDataUrl(sigSupervisor);
    $('verdictOverridden').value = '1';
    return true;
  }

  // ---------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------
  function boot() {
    I18n.applyDocument();
    I18n.mountSwitcher('langSwitch');
    I18n.apply();

    populateTypes();
    populateSchemes();

    $('month').value = ChecklistData.currentMonthValue();
    $('inspectionDate').value = new Date().toISOString().slice(0, 10);
    autoNextDue();
    updateColour();

    ['sigInspectorPad', 'sigSupervisorPad'].forEach(id => {
      const c = $(id);
      if (c && typeof attachSignaturePad === 'function') attachSignaturePad(c);
    });
    document.querySelectorAll('[data-clear-sig]').forEach(b => {
      b.addEventListener('click', () => {
        const c = $(b.getAttribute('data-clear-sig'));
        if (c && c.clearPad) c.clearPad();
      });
    });

    $('equipmentType').addEventListener('change', renderSections);
    $('month').addEventListener('change', updateColour);
    $('colourScheme').addEventListener('change', updateColour);
    $('inspectionDate').addEventListener('change', autoNextDue);
    $('nextDue').addEventListener('input', () => { $('nextDue').dataset.touched = '1'; });

    document.querySelectorAll('input[name="verdict"]').forEach(r => {
      r.addEventListener('change', () => { $('verdictOverridden').value = '1'; paintVerdict(); });
    });
    paintVerdict();

    $('btnMarkAllOk').addEventListener('click', () => {
      const typeId = $('equipmentType').value;
      if (!typeId) { alert(I18n.t('msg.needType')); return; }
      ChecklistData.sectionsFor(typeId).forEach(s => s.items.forEach(i => {
        answers[i.id] = answers[i.id] || { status: null, note: '' };
        if (!answers[i.id].status) answers[i.id].status = 'ok';
      }));
      renderSections();
    });

    $('btnClearAll').addEventListener('click', () => {
      if (!confirm(I18n.t('msg.confirmClear'))) return;
      answers = {};
      renderSections();
    });

    $('btnSave').addEventListener('click', save);
    $('btnPrint').addEventListener('click', () => window.print());
    $('btnEmail').addEventListener('click', openEmailModal);

    $('emClose').addEventListener('click', closeEmailModal);
    $('emCancel').addEventListener('click', closeEmailModal);
    $('emailModal').addEventListener('click', (e) => {
      if (e.target.id === 'emailModal') closeEmailModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('emailModal').hidden) closeEmailModal();
    });

    $('emRegenerate').addEventListener('click', () => {
      const d = currentDraft();
      $('emSubject').value = d.subject;
      $('emBody').value = d.body;
    });

    $('emOpenClient').addEventListener('click', () => {
      const r = gatherRecipients();
      if (!r) return;
      Mailer.openMailto(Object.assign(msgFromForm(r), {
        truncationNote: I18n.t('em.note')
      }));
    });

    $('emDownload').addEventListener('click', () => {
      const r = gatherRecipients();
      if (!r) return;
      Mailer.downloadEml(msgFromForm(r), ChecklistEmail.filenameFor(buildRecord()));
      $('emResult').innerHTML = `<div class="banner banner-ok"><div>${escapeHtml(I18n.t('em.download'))} ✓</div></div>`;
    });

    $('emCopy').addEventListener('click', async () => {
      const text = `${I18n.t('em.subject')}: ${$('emSubject').value}\n\n${$('emBody').value}`;
      const ok = await Mailer.copyText(text);
      $('emResult').innerHTML = ok
        ? `<div class="banner banner-ok"><div>${escapeHtml(I18n.t('em.copied'))}</div></div>`
        : `<div class="banner banner-warn"><div>${escapeHtml(I18n.t('em.copy'))} — ✕</div></div>`;
    });

    // Re-render everything in the new language when it changes.
    document.addEventListener('i18n:changed', () => {
      populateTypes();
      populateSchemes();
      I18n.apply();
      renderSections();
      updateColour();
    });

    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) loadRecord(id);
    else renderSections();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
