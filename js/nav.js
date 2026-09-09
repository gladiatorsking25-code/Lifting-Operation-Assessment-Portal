function renderSidebar(active) {
  const el = document.getElementById('sidebar');
  if (!el) return;
  const items = [
    { key: 'index', href: 'index.html', label: 'Dashboard', icon: 'grid' },
    { key: 'assessment', href: 'assessment.html', label: 'New assessment', icon: 'gauge' },
    { key: 'history', href: 'history.html', label: 'Assessment history', icon: 'clock' },
    { key: 'permit', href: 'permit.html', label: 'New permit', icon: 'doc' },
    { key: 'permits', href: 'permits.html', label: 'All permits', icon: 'stack' },
    { key: 'settings', href: 'settings.html', label: 'Fleet & backup', icon: 'gear' },
  ];
  const icons = {
    grid: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" stroke="currentColor" stroke-width="1.6" fill="none"/>',
    gauge: '<path d="M12 21a9 9 0 100-18 9 9 0 000 18z" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M12 12l4-4M12 12v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    clock: '<path d="M12 21a9 9 0 100-18 9 9 0 000 18z" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    doc: '<path d="M6 2h9l4 4v16H6z" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M9 12h7M9 16h7M9 8h3" stroke="currentColor" stroke-width="1.4"/>',
    stack: '<path d="M12 3l9 5-9 5-9-5z" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M3 13l9 5 9-5M3 8l9 5 9-5" stroke="currentColor" stroke-width="1.6" fill="none"/>',
    gear: '<path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M19.4 13a7.4 7.4 0 000-2l2-1.5-2-3.4-2.4.6a7.6 7.6 0 00-1.7-1L14.7 3h-4l-.6 2.7a7.6 7.6 0 00-1.7 1l-2.4-.6-2 3.4L6 11a7.4 7.4 0 000 2l-2 1.6 2 3.4 2.4-.6a7.6 7.6 0 001.7 1l.6 2.6h4l.6-2.6a7.6 7.6 0 001.7-1l2.4.6 2-3.4z" stroke="currentColor" stroke-width="1.3" fill="none"/>'
  };
  el.innerHTML = `
    <div class="brand">
      <div class="brand-row">
        <span class="mark">CL</span>
        <div>
          <h1>Lifting Assessment</h1>
          <div class="sub">SITE OPS TOOL</div>
        </div>
      </div>
    </div>
    <nav class="nav">
      <div class="section-label">Operations</div>
      ${items.slice(0,3).map(navLink).join('')}
      <div class="section-label">Permits</div>
      ${items.slice(3,5).map(navLink).join('')}
      <div class="section-label">Configuration</div>
      ${items.slice(5).map(navLink).join('')}
    </nav>
    <div class="sidebar-foot">Data stored locally in this browser.<br>Export a backup regularly.</div>
  `;
  function navLink(item) {
    return `<a href="${item.href}" class="${item.key === active ? 'active' : ''}">
      <svg viewBox="0 0 24 24" width="16" height="16">${icons[item.icon]}</svg>
      ${item.label}
    </a>`;
  }
}

function renderDisclaimer(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = `
    <div class="banner banner-warn">
      <svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2z" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M12 9v5M12 17h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      <div><strong>Sample load-chart data.</strong> The capacities in Fleet &amp; Backup are placeholder figures, not certified manufacturer charts. An appointed person must verify every lift against the crane's official load chart before work begins — this tool supports planning, it does not replace it.</div>
    </div>
  `;
}
