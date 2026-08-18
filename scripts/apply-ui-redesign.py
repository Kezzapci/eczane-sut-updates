from pathlib import Path

path = Path('/home/ubuntu/eczane-sut-updates/src/main.js')
text = path.read_text()

new_dashboard = r'''function renderDashboard() {
  const total = state.rows.length;
  const ok = state.rows.filter((row) => row.status === 'ok').length;
  const warn = state.rows.filter((row) => row.status === 'warn').length;
  const error = state.rows.filter((row) => row.status === 'error').length;
  const assessment = state.assistantAssessment || buildSmartAssessment();
  const completion = total ? Math.round(ok / total * 100) : 0;
  const activity = state.lastActions.length
    ? state.lastActions.slice(0, 3).map((item, index) => `<div class="activity-item"><span class="activity-line ${index === 0 ? 'active' : ''}"></span><div><strong>${esc(item.title)}</strong><small>${esc(item.time)}</small></div></div>`).join('')
    : '<div class="activity-empty">Bu oturumdaki hareketler burada görünecek.</div>';
  const steps = [
    { label: 'İlaç', state: state.selectedMedicine ? 'done' : 'current' },
    { label: 'Rapor', state: state.fileName ? 'done' : state.selectedMedicine ? 'current' : '' },
    { label: 'SUT', state: state.rows.length ? 'current' : '' },
    { label: 'Sonuç', state: state.checkedAt.includes('tamamlandı') ? 'done' : '' }
  ];
  return `<section class="content dashboard-page fade-in">
    <div class="hero-row">
      <div class="hero-copy">
        <div class="eyebrow live-eyebrow"><span class="pulse-dot"></span> ECZANE ÇALIŞMA MASASI <span class="eyebrow-separator">/</span> ${state.fileName ? esc(state.fileName) : 'Yeni oturum'}</div>
        <h1 class="page-title">Raporu <span>kanıta</span> dönüştürün.</h1>
        <p class="page-subtitle">Barkodu seçin, raporu yükleyin ve SUT ön kontrolünü tek bakışta yönetin.</p>
        <div class="hero-actions"><button class="primary-button glow-button" id="choose-report">${icon('upload', 16)} Yeni rapor yükle</button><button class="ghost-button" id="show-update">${icon('shield', 15)} ${esc(state.sutVersion)}</button></div>
      </div>
      <div class="hero-orbit" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="orbit-core">${icon('shield', 28)}<span></span></div><div class="orbit-label label-one">SGK</div><div class="orbit-label label-two">AI</div><div class="orbit-label label-three">SUT</div></div>
    </div>
    <div class="signal-bar"><div class="signal-main"><span class="signal-icon">${icon('check', 14)}</span><div><strong>Sistem hazır</strong><span>${esc(state.updateText)} · ${esc(state.sutText)}</span></div></div><div class="signal-cell"><span>VERİ SÜRÜMÜ</span><strong>${esc(state.sutVersion)}</strong></div><div class="signal-cell"><span>SON TARAMA</span><strong>${esc(state.sutCheckedAt)}</strong></div><button class="signal-action" id="refresh-sut">${icon('refresh', 15)} Denetle</button></div>
    <div class="metric-row"><div class="metric-card"><div class="metric-label"><span class="metric-bullet blue"></span>TOPLAM RAPOR</div><strong>${formatCount(total)}</strong><small>Bu oturumda yüklendi</small></div><div class="metric-card"><div class="metric-label"><span class="metric-bullet green"></span>UYGUN KAYIT</div><strong>${formatCount(ok)}</strong><small><b>${completion}%</b> kontrol sonucu</small></div><div class="metric-card"><div class="metric-label"><span class="metric-bullet amber"></span>İNCELEME</div><strong>${formatCount(warn)}</strong><small>Manuel teyit bekliyor</small></div><div class="metric-card"><div class="metric-label"><span class="metric-bullet red"></span>UYUŞMAZLIK</div><strong>${formatCount(error)}</strong><small>Düzeltilmesi gereken</small></div></div>
    <div class="command-grid">
      <section class="workspace-card medicine-panel"><div class="panel-topline"><span class="panel-index">01</span><span class="panel-kicker">İLAÇ SEÇİMİ</span><span class="panel-live"><i></i> canlı indeks</span></div><h2 class="workspace-title">Ürünü barkoddan yakalayın.</h2><p class="workspace-copy">USB okuyucuyu okutun veya ilaç adını yazın. Kesin seçim yalnızca resmi EK-4/A kaydıyla yapılır.</p><div class="search-box"><span>${icon('barcode', 19)}</span><input id="barcode-input" value="${esc(state.barcodeInput)}" autocomplete="off" placeholder="Barkodu okutun veya ilaç adı…" /><button id="clear-barcode" class="search-clear" title="Temizle">${icon('close', 14)}</button><button id="scan-barcode" class="search-submit">Ara ${icon('search', 14)}</button></div>${renderSearchResults()}${renderMedicineCard()}<div class="activity-block"><div class="subhead"><span>SON HAREKETLER</span><small>${state.lastActions.length ? 'Bu oturum' : 'Bekliyor'}</small></div><div class="activity-feed">${activity}</div></div></section>
      <section class="workspace-card workflow-panel"><div class="panel-topline"><span class="panel-index">02</span><span class="panel-kicker">RAPOR KONTROLÜ</span><span class="panel-state">${state.fileName ? 'Dosya alındı' : 'Dosya bekleniyor'}</span></div><h2 class="workspace-title">Belgeyi SUT akışına bağlayın.</h2><p class="workspace-copy">PDF, Excel veya CSV dosyasını bırakın; alanlar otomatik ayrıştırılsın ve kontrol listesine taşınsın.</p><div class="step-rail">${steps.map((step, index) => `<div class="rail-node ${step.state}"><span>${step.state === 'done' ? icon('check', 11) : index + 1}</span><small>${step.label}</small></div>${index < steps.length - 1 ? '<i></i>' : ''}`).join('')}</div><div class="upload-zone compact-upload" id="upload-zone"><div class="upload-visual"><span class="upload-ring">${icon('upload', 22)}</span><span class="upload-spark spark-a"></span><span class="upload-spark spark-b"></span></div><div class="upload-title">${state.fileName ? esc(state.fileName) : 'Rapor dosyanızı bırakın'}</div><div class="upload-help">PDF · XLSX · CSV desteklenir</div><button class="secondary-button upload-button" id="browse-report">${icon('document', 14)} Dosya seç</button><input id="file-input" class="file-input" type="file" accept=".pdf,.xlsx,.xls,.csv,.txt" /></div><div class="workflow-footer"><div><span class="mini-status ${state.rows.length ? 'green' : ''}"></span><span>${state.rows.length ? `${state.rows.length} kayıt ayrıştırıldı` : 'Kontrol için dosya yükleyin'}</span></div><button class="primary-button compact-button" id="run-check">${icon('check', 15)} Kontrolü çalıştır</button></div></section>
      ${renderAssistant()}
    </div>
    <div class="lower-grid"><section class="card results-card"><div class="card-header"><div><div class="section-kicker">KONTROL KAYDI</div><h2 class="card-title">Sonuçlar</h2><div class="card-description">${state.fileName ? esc(state.fileName) : 'Henüz rapor yüklenmedi'}</div></div><button class="card-link" id="export-results">${icon('download', 14)} Dışa aktar</button></div><div class="table-wrap"><table class="report-table"><thead><tr><th>Hasta</th><th>İlaç / barkod</th><th>Rapor no</th><th>Tanı</th><th>Tarih</th><th>Durum</th><th></th></tr></thead><tbody>${renderRows()}</tbody></table></div></section><section class="card checklist-card"><div class="card-header"><div><div class="section-kicker">KANIT LİSTESİ</div><h2 class="card-title">Raporda bunlar var mı?</h2><div class="card-description">Seçilen ürün ve dosyaya göre</div></div><span class="check-count">${getCriteria().filter((item) => item.status === 'ok').length}/${getCriteria().length}</span></div><div class="criteria-list">${renderCriteria()}</div><div class="card-footnote">${icon('info', 14)} Kesin ödeme kararı için ilgili SUT maddesi ve rapor yetkili kişi tarafından doğrulanmalıdır.</div></section></div>
    <div class="disclaimer-bar"><span class="disclaimer-icon">${icon('shield', 14)}</span><span>Kaynaklı ön kontrol</span><i></i><span>SGK EK-4/A</span><i></i><span>İnsan onayı gerekli</span><i></i><span>Kesin ödeme kararı değildir</span></div>
  </section>`;
}'''

start = text.index('function renderDashboard() {')
end = text.index('\nfunction renderOtherPage()', start)
text = text[:start] + new_dashboard + text[end:]

new_render = r'''function render() {
  const navItems = [['dashboard', 'Kontrol merkezi', 'dashboard'], ['reports', 'Kontrol geçmişi', 'document'], ['sut', 'SUT & Veri merkezi', 'refresh'], ['assistant', 'Akıllı asistan', 'spark'], ['settings', 'Ayarlar', 'settings']];
  const pageTitle = state.activePage === 'dashboard' ? 'Kontrol merkezi' : ({ reports: 'Kontrol geçmişi', sut: 'SUT & Veri merkezi', assistant: 'Akıllı asistan', settings: 'Ayarlar' }[state.activePage] || 'Kontrol merkezi');
  app.innerHTML = `<div class="app-shell"><aside class="sidebar"><div class="brand"><div class="brand-mark">${icon('shield', 22)}<span></span></div><div><div class="brand-name">Eczane<span>SUT</span></div><div class="brand-caption">Rapor uygunluk merkezi</div></div></div><div class="sidebar-heading">ÇALIŞMA ALANI</div><nav class="nav-group">${navItems.slice(0, 2).map(([page, label, ico]) => `<button class="nav-item ${state.activePage === page ? 'active' : ''}" data-page="${page}"><span class="nav-icon">${icon(ico, 17)}</span><span>${label}</span>${page === 'dashboard' ? '<em>1</em>' : ''}</button>`).join('')}</nav><div class="sidebar-heading secondary-heading">VERİ VE YARDIMCILAR</div><nav class="nav-group">${navItems.slice(2).map(([page, label, ico]) => `<button class="nav-item ${state.activePage === page ? 'active' : ''}" data-page="${page}"><span class="nav-icon">${icon(ico, 17)}</span><span>${label}</span>${page === 'assistant' ? '<b class="nav-badge">AI</b>' : ''}</button>`).join('')}</nav><div class="sidebar-bottom"><div class="connection"><span class="connection-dot"></span><div><strong>Servis bağlı</strong><small>Otomatik güncelleme açık</small></div></div><div class="version">v${esc(state.appVersion)} <span>·</span> Windows 11</div></div></aside><main class="main-area"><header class="topbar"><div class="topbar-context"><span class="topbar-kicker">Eczane SUT</span><span class="topbar-slash">/</span><strong>${pageTitle}</strong></div><div class="top-actions"><div class="top-status"><span class="top-status-dot"></span><span>Yerel çalışma alanı</span></div><button class="top-action" id="check-update" title="Güncellemeleri kontrol et">${icon('refresh', 15)} <span>Güncelle</span></button><button class="icon-button" id="open-settings" title="Ayarlar">${icon('settings', 17)}</button><div class="user-badge"><div class="user-avatar">E</div><div><strong>Eczane ekibi</strong><small>Kaynaklı kontrol</small></div></div></div></header>${state.activePage === 'dashboard' ? renderDashboard() : renderOtherPage()}</main></div><div class="toast" id="toast"></div>`;
  bindEvents();
}'''

start = text.index('function render() {')
end = text.index('\nfunction toast(', start)
text = text[:start] + new_render + text[end:]
path.write_text(text)
