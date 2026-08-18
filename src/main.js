import './style.css';
import * as XLSX from 'xlsx';

const state = {
  fileName: '',
  rows: [],
  checkedAt: 'Henüz kontrol yapılmadı',
  appVersion: '0.2.0',
  updateText: 'Otomatik güncelleme etkin',
  sutText: 'Otomatik kontrol açık',
  sutVersion: 'Veri aranıyor',
  sutCheckedAt: 'Henüz kontrol edilmedi',
  activePage: 'dashboard',
  barcodeInput: '',
  searchResults: [],
  selectedMedicine: null,
  assistantText: 'Bir barkod okutun veya ilaç adı yazın. Kaynaklı ön kontrol özeti burada görünecek.',
  medicineIndex: null,
  lastActions: []
};

const api = window.electronAPI || {};
const app = document.querySelector('#app');

function esc(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function icon(name, size = 18) {
  const paths = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    barcode: '<path d="M3 5v14M6 5v14M9 5v14M13 5v14M16 5v14M19 5v14M22 8v8"/>',
    document: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v5h4M9 12h6M9 16h6"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.7-3L3 11"/><path d="M3 5v6h6M4 13a8 8 0 0 0 14.7 3L21 13"/><path d="M21 19v-6h-6"/>',
    settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="m19.4 15 .1.1a2 2 0 0 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4V19a2 2 0 0 1-4 0v-.2A2 2 0 0 0 5.8 17l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1A2 2 0 0 0 1.6 11H1.5a2 2 0 0 1 0-4h.2A2 2 0 0 0 3 3.6l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1A2 2 0 0 0 9.2 0H9a2 2 0 0 1 4 0v.2a2 2 0 0 0 3.4 1.4l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1A2 2 0 0 0 20.6 8h.2a2 2 0 0 1 0 4h-.2a2 2 0 0 0-1.2 3Z" transform="translate(1 2) scale(.8)"/>',
    spark: '<path d="m12 2 1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
    upload: '<path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M4 15v5h16v-5"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    alert: '<path d="M12 3 2.5 20h19z"/><path d="M12 9v4M12 17h.01"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    download: '<path d="M12 3v12m0 0 5-5m-5 5-5-5M4 21h16"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    shield: '<path d="M12 3 20 6v5c0 5-3.3 8-8 10-4.7-2-8-5-8-10V6z"/><path d="m8 12 2.5 2.5L16 9"/>'
  };
  return `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.info}</svg>`;
}

function statusLabel(status) {
  if (status === 'ok') return '<span class="status-pill ok"><span class="status-dot"></span>Uygun</span>';
  if (status === 'warn') return '<span class="status-pill warn"><span class="status-dot"></span>İncelenmeli</span>';
  return '<span class="status-pill error"><span class="status-dot"></span>Eksik bilgi</span>';
}

function formatCount(value) {
  return new Intl.NumberFormat('tr-TR').format(Number(value || 0));
}

function nowText() {
  return `Bugün, ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
}

function renderRows() {
  if (!state.rows.length) return '<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">' + icon('document', 26) + '</div><strong>Henüz rapor yüklenmedi</strong><span>CSV dosyanızı seçin veya rapor alanını barkod akışıyla doldurun.</span></div></td></tr>';
  return state.rows.map((row) => `
    <tr>
      <td><strong>${esc(row.patient)}</strong><small>${esc(row.tc || 'Hasta no yok')}</small></td>
      <td><span class="medicine-cell"><span class="medicine-mini-icon">${icon('barcode', 15)}</span>${esc(row.medicine)}</span><small>${esc(row.barcode || 'Barkod yok')}</small></td>
      <td>${esc(row.report)}</td>
      <td>${esc(row.diagnosis || '—')}</td>
      <td>${esc(row.date)}</td>
      <td>${statusLabel(row.status)}</td>
      <td><button class="table-action" data-row="${esc(row.report)}">Detay ${icon('chevron', 14)}</button></td>
    </tr>`).join('');
}

function renderMedicineCard() {
  const medicine = state.selectedMedicine;
  if (!medicine) {
    return `<div class="medicine-empty"><div class="medicine-empty-icon">${icon('barcode', 32)}</div><div><strong>İlaç seçimi bekleniyor</strong><span>Barkodu okutun veya ilaç adını yazarak listeden seçim yapın.</span></div></div>`;
  }
  const old = medicine.oldBarcodes?.length ? medicine.oldBarcodes.join(', ') : 'Kayıtlı eski barkod yok';
  return `<div class="medicine-card">
    <div class="medicine-card-top"><div class="medicine-symbol">${icon('shield', 24)}</div><div class="medicine-card-title"><strong>${esc(medicine.name)}</strong><span>${esc(medicine.matchType || 'EK-4A kaydı')} · Kamu No: ${esc(medicine.publicNo || '—')}</span></div><span class="verified-badge">${icon('check', 13)} Kaynaklı</span></div>
    <div class="medicine-meta-grid">
      <div><span>Güncel barkod</span><strong>${esc(medicine.barcode || '—')}</strong></div>
      <div><span>Eşdeğer grup</span><strong>${esc(medicine.equivalenceGroup || 'Belirtilmemiş')}</strong></div>
      <div><span>Terapötik grup</span><strong>${esc(medicine.therapeuticGroup || 'Belirtilmemiş')}</strong></div>
      <div><span>Eski barkodlar</span><strong title="${esc(old)}">${esc(old.length > 28 ? old.slice(0, 28) + '…' : old)}</strong></div>
    </div>
    <div class="medicine-source">${icon('info', 14)} Kaynak: SGK EK-4/A · Son veri sürümü: ${esc(state.sutVersion)}</div>
  </div>`;
}

function getCriteria() {
  const medicine = state.selectedMedicine;
  const row = state.rows[0] || {};
  const hasMedicine = Boolean(medicine);
  const reportBarcode = String(row.barcode || '').trim();
  const knownBarcodes = (medicine?.barcodes || [medicine?.barcode]).filter(Boolean).map(String);
  const barcodeMatches = Boolean(hasMedicine && reportBarcode && knownBarcodes.includes(reportBarcode));
  const required = [
    { key: 'report', label: 'Rapor numarası ve rapor türü', value: row.report, note: 'Rapor kimliği' },
    { key: 'date', label: 'Rapor başlangıç / bitiş tarihi', value: row.date && row.endDate, note: 'Yürürlük süresi' },
    { key: 'patient', label: 'Hasta bilgileri', value: row.patient, note: 'Hasta ile eşleştirme' },
    { key: 'medicineMatch', label: 'İlaç barkodu ve rapor eşleşmesi', value: barcodeMatches, note: hasMedicine ? (reportBarcode ? 'Seçilen ürünle barkod karşılaştırması' : 'Raporda barkod alanı bekleniyor') : 'Önce ilaç seçin' },
    { key: 'diagnosis', label: 'Tanı veya ICD-10 bilgisi', value: row.diagnosis, note: 'SUT koşul eşleştirmesi' },
    { key: 'dose', label: 'Etkin madde, doz ve kullanım', value: row.dose, note: 'Ürün kullanım koşulu' },
    { key: 'specialist', label: 'Uzmanlık / rapor düzenleyen branş', value: row.specialist, note: 'Yetkili uzmanlık kontrolü' }
  ];
  return required.map((item) => {
    if (item.key === 'medicineMatch') return { ...item, status: !hasMedicine || !state.rows.length ? 'warn' : barcodeMatches ? 'ok' : 'error' };
    return { ...item, status: item.value ? 'ok' : 'warn' };
  });
}

function renderCriteria() {
  const criteria = getCriteria();
  return criteria.map((item) => {
    const label = item.status === 'ok' ? 'Var' : item.status === 'error' ? 'Uyuşmuyor' : 'Eksik';
    const note = item.status === 'ok' ? 'Dosyada bulundu' : item.status === 'error' ? item.note : item.note + ' için bilgi bekleniyor';
    return `<div class="criteria-row"><span class="criteria-icon ${item.status}">${item.status === 'ok' ? icon('check', 14) : icon('alert', 14)}</span><div><strong>${esc(item.label)}</strong><small>${esc(note)}</small></div><span class="criteria-status ${item.status}">${label}</span></div>`;
  }).join('');
}

function renderSearchResults() {
  if (!state.barcodeInput) return '';
  if (!state.searchResults.length) return '<div class="search-empty">Bu barkod veya ilaç adıyla kaynak indekste kayıt bulunamadı. Barkodu ve veri sürümünü kontrol edin.</div>';
  return `<div class="search-results">${state.searchResults.map((item, index) => `<button class="search-result" data-result-index="${index}"><span class="result-symbol">${icon('barcode', 18)}</span><span><strong>${esc(item.name)}</strong><small>${esc(item.barcode || '—')} · Kamu No ${esc(item.publicNo || '—')}</small></span><span class="result-match">${esc(item.matchType || 'Eşleşme')} ${icon('chevron', 14)}</span></button>`).join('')}</div>`;
}

function renderAssistant() {
  const medicine = state.selectedMedicine;
  const source = medicine ? `SGK EK-4/A · ${medicine.publicNo || medicine.barcode || 'ürün kaydı'}` : 'Kaynak bekleniyor';
  return `<section class="card assistant-card"><div class="card-header assistant-header"><div class="assistant-heading"><span class="assistant-icon">${icon('spark', 21)}</span><div><h2 class="card-title">Akıllı kontrol asistanı</h2><div class="card-description">Kaynaklı ön değerlendirme · insan onayı gerektirir</div></div></div><span class="ai-chip">AI destekli</span></div><div class="assistant-body"><p class="assistant-text">${esc(state.assistantText)}</p><div class="assistant-source">${icon('shield', 14)} <span>${esc(source)}</span><span class="source-dot">·</span><span>Her sonuç kaynak maddesiyle gösterilir</span></div></div></section>`;
}

function renderDashboard() {
  const total = state.rows.length;
  const ok = state.rows.filter((row) => row.status === 'ok').length;
  const warn = state.rows.filter((row) => row.status === 'warn').length;
  const error = state.rows.filter((row) => row.status === 'error').length;
  return `<section class="content fade-in">
    <div class="page-heading"><div><div class="eyebrow">ECZANE ÇALIŞMA ALANI</div><h1 class="page-title">Rapor kontrol merkezi</h1><p class="page-subtitle">Barkoddan rapor uygunluğuna kadar tüm kontrolü tek ekranda yönetin.</p></div><button class="primary-button" id="choose-report">${icon('upload', 17)} Yeni rapor yükle</button></div>
    <div class="status-strip"><div class="status-copy"><span class="status-check">${icon('check', 15)}</span><span><strong>Sistem hazır.</strong> ${esc(state.updateText)} · ${esc(state.sutText)}.</span></div><button class="status-link" id="show-update">Sürüm ve veri bilgisi ${icon('chevron', 13)}</button></div>
    <div class="stat-grid"><div class="stat-card"><div class="stat-top"><span class="stat-label">Toplam rapor</span><span class="stat-icon blue">${icon('document', 17)}</span></div><div class="stat-value">${formatCount(total)}</div><div class="stat-note">Son yüklenen dosyadaki kayıtlar</div></div><div class="stat-card"><div class="stat-top"><span class="stat-label">Uygun kayıt</span><span class="stat-icon green">${icon('check', 17)}</span></div><div class="stat-value">${formatCount(ok)}</div><div class="stat-note"><strong>${total ? Math.round(ok / total * 100) : 0}%</strong> kontrol sonucu</div></div><div class="stat-card"><div class="stat-top"><span class="stat-label">İncelenmeli</span><span class="stat-icon amber">${icon('alert', 17)}</span></div><div class="stat-value">${formatCount(warn)}</div><div class="stat-note">Manuel teyit bekleyenler</div></div><div class="stat-card"><div class="stat-top"><span class="stat-label">Eksik bilgi</span><span class="stat-icon red">${icon('close', 17)}</span></div><div class="stat-value">${formatCount(error)}</div><div class="stat-note">Düzeltilmesi gereken alanlar</div></div></div>
    <section class="card barcode-workspace"><div class="card-header workspace-header"><div><div class="section-kicker">1 · İLAÇ SEÇİMİ</div><h2 class="card-title">Barkod okut veya ilaç ara</h2><div class="card-description">USB barkod okuyucu klavye gibi çalışır. Barkod numarasını elle de yazabilirsiniz.</div></div><span class="live-badge"><span></span> Canlı arama</span></div><div class="barcode-input-wrap"><span class="input-leading">${icon('barcode', 22)}</span><input id="barcode-input" value="${esc(state.barcodeInput)}" autocomplete="off" placeholder="Barkodu okutun veya ilaç adını yazın…" /><button class="clear-input" id="clear-barcode" title="Temizle">${icon('close', 16)}</button><button class="scan-button" id="scan-barcode">${icon('search', 16)} Ara</button></div>${renderSearchResults()}${renderMedicineCard()}</section>
    <div class="grid-main"><div><section class="card"><div class="card-header"><div><div class="section-kicker">2 · RAPOR KONTROLÜ</div><h2 class="card-title">Rapor dosyası ve sonuçlar</h2><div class="card-description">PDF, Excel veya CSV dosyanızı yükleyin; bulunan alanları kontrol listesiyle karşılaştırın.</div></div><button class="secondary-button" id="run-check">${icon('check', 16)} Kontrolü çalıştır</button></div><div class="card-body"><div class="upload-zone" id="upload-zone"><div class="upload-icon">${icon('upload', 28)}</div><div class="upload-title">${state.fileName ? esc(state.fileName) : 'Rapor dosyasını buraya bırakın'}</div><div class="upload-help">veya bilgisayarınızdan seçmek için düğmeyi kullanın</div><button class="secondary-button" id="browse-report">Dosya seç</button><div class="upload-formats">Desteklenen formatlar: PDF · XLSX · CSV</div></div><input id="file-input" class="file-input" type="file" accept=".pdf,.xlsx,.xls,.csv,.txt" /></div></section><section class="card results-card"><div class="card-header"><div><div class="section-kicker">SONUÇLAR</div><h2 class="card-title">Kontrol sonuçları</h2><div class="card-description">${state.fileName ? esc(state.fileName) : 'Henüz rapor yüklenmedi'}</div></div><button class="card-link" id="export-results">${icon('download', 14)} Dışa aktar</button></div><div class="table-wrap"><table class="report-table"><thead><tr><th>Hasta</th><th>İlaç / barkod</th><th>Rapor no</th><th>Tanı</th><th>Tarih</th><th>Durum</th><th></th></tr></thead><tbody>${renderRows()}</tbody></table></div></section></div><div class="side-stack"><section class="card checklist-card"><div class="card-header"><div><div class="section-kicker">3 · GEREKSİNİMLER</div><h2 class="card-title">Raporda bunlar var mı?</h2><div class="card-description">Seçilen ürün ve dosyaya göre ön kontrol</div></div><span class="check-count">${getCriteria().filter((item) => item.status === 'ok').length}/${getCriteria().length}</span></div><div class="criteria-list">${renderCriteria()}</div><div class="card-footnote">${icon('info', 14)} Kesin ödeme kararı için ilgili SUT maddesini ve raporu yetkili kişi doğrulamalıdır.</div></section>${renderAssistant()}<section class="card sut-card"><div class="card-header"><div><div class="section-kicker">VERİ MERKEZİ</div><h2 class="card-title">SUT veri sürümü</h2><div class="card-description">Resmi SGK kaynağı takipte</div></div><span class="sut-rotate">${icon('refresh', 18)}</span></div><div class="sut-body"><div class="sut-status"><div class="sut-status-icon">${icon('check', 17)}</div><div><div class="sut-status-title">${esc(state.sutText)}</div><div class="sut-status-copy">Kaynak doğrulama ve geri alma açık</div></div></div><div class="sut-meta"><div><span>SUT sürümü</span><strong>${esc(state.sutVersion)}</strong></div><div><span>Son tarama</span><strong>${esc(state.sutCheckedAt)}</strong></div></div><button class="secondary-button sut-button" id="refresh-sut">${icon('refresh', 15)} Şimdi denetle</button></div></section></div></div>
  </section>`;
}

function renderOtherPage() {
  const titles = { reports: ['Kontrol geçmişi', 'Daha önce işlenen rapor kayıtlarını ve sonuç özetlerini yönetin.'], sut: ['SUT ve veri güncellemeleri', 'Resmi kaynak, paket doğrulama ve sürüm geçmişini izleyin.'], settings: ['Ayarlar', 'Barkod okuyucu, kontrol davranışı ve güncelleme tercihlerini yönetin.'], assistant: ['Akıllı asistan', 'Kaynak gösteren ön değerlendirme ve kontrol açıklamaları.'] };
  const [title, subtitle] = titles[state.activePage] || titles.dashboard;
  if (state.activePage === 'assistant') return `<section class="content fade-in"><div class="page-heading"><div><div class="eyebrow">YARDIMCI MODÜL</div><h1 class="page-title">${title}</h1><p class="page-subtitle">${subtitle}</p></div></div>${renderAssistant()}<section class="card info-panel"><div class="info-panel-icon">${icon('shield', 25)}</div><div><h2>Kontrollü öğrenme yaklaşımı</h2><p>Asistanın önerileri yalnızca doğrulanmış SUT veri paketi ve seçilen ilaç kaydı üzerinden oluşturulur. Kuralı kendiliğinden değiştirmez; belirsiz sonuçları incelemeye yönlendirir. İleride yetkili kullanıcı onayları ayrıca denetim kaydıyla eklenebilir.</p></div></section></section>`;
  if (state.activePage === 'sut') return `<section class="content fade-in"><div class="page-heading"><div><div class="eyebrow">VERİ MERKEZİ</div><h1 class="page-title">${title}</h1><p class="page-subtitle">${subtitle}</p></div><button class="primary-button" id="refresh-sut">${icon('refresh', 16)} Şimdi denetle</button></div><div class="detail-grid"><section class="card detail-card"><div class="detail-icon teal">${icon('refresh', 25)}</div><h2>Otomatik SGK taraması</h2><p>GitHub Actions resmi SGK duyurularını günlük kontrol eder. Yeni paket hash ve zorunlu dosya kontrollerinden geçmeden yayınlanmaz.</p><div class="detail-value">${esc(state.sutVersion)}</div><span>Aktif veri sürümü</span></section><section class="card detail-card"><div class="detail-icon blue">${icon('shield', 25)}</div><h2>Bütünlük doğrulaması</h2><p>İndirme boyutu, SHA-256, ana SUT metni ve EK-4A kontrolü yapılır. Hata olursa önceki veri korunur.</p><div class="detail-value">Hazır</div><span>Güvenlik durumu</span></section></div>${renderAssistant()}</section>`;
  return `<section class="content fade-in"><div class="page-heading"><div><div class="eyebrow">YÖNETİM</div><h1 class="page-title">${title}</h1><p class="page-subtitle">${subtitle}</p></div></div><section class="card info-panel"><div class="info-panel-icon blue">${icon(state.activePage === 'settings' ? 'settings' : 'clock', 25)}</div><div><h2>${state.activePage === 'settings' ? 'Windows ve barkod ayarları' : 'Kayıtlı çalışma geçmişi'}</h2><p>${state.activePage === 'settings' ? 'USB barkod okuyucular klavye girişi olarak otomatik çalışır. Barkod alanı açıkken okutma ile arama başlar. Güncellemeler varsayılan olarak otomatik kontrol edilir.' : 'Bu sürümde sonuçlar çalışma oturumu boyunca tutulur. Kalıcı geçmiş ve kullanıcı rolleri sonraki veri katmanında eklenebilir.'}</p></div></section></section>`;
}

function render() {
  const navItems = [['dashboard', 'Kontrol merkezi', 'dashboard'], ['reports', 'Kontrol geçmişi', 'document'], ['sut', 'SUT & Veri merkezi', 'refresh'], ['assistant', 'Akıllı asistan', 'spark'], ['settings', 'Ayarlar', 'settings']];
  app.innerHTML = `<div class="app-shell"><aside class="sidebar"><div class="brand"><div class="brand-mark">${icon('shield', 24)}</div><div><div class="brand-name">Eczane<span>SUT</span></div><div class="brand-caption">Rapor uygunluk merkezi</div></div></div><div class="nav-label">Çalışma alanı</div>${navItems.slice(0, 2).map(([page, label, ico]) => `<button class="nav-item ${state.activePage === page ? 'active' : ''}" data-page="${page}">${icon(ico)}<span>${label}</span></button>`).join('')}<div class="nav-label">Veri ve yardımcılar</div>${navItems.slice(2).map(([page, label, ico]) => `<button class="nav-item ${state.activePage === page ? 'active' : ''}" data-page="${page}">${icon(ico)}<span>${label}</span>${page === 'assistant' ? '<span class="nav-new">AI</span>' : ''}</button>`).join('')}<div class="sidebar-footer"><div class="connection"><span class="connection-dot"></span><span>Güncelleme servisi bağlı</span></div><div class="version">Sürüm ${esc(state.appVersion)} · Windows 11</div></div></aside><main class="main-area"><header class="topbar"><div class="breadcrumb">Eczane SUT <span>/</span> <strong>${state.activePage === 'dashboard' ? 'Kontrol merkezi' : esc({ reports: 'Kontrol geçmişi', sut: 'SUT & Veri merkezi', assistant: 'Akıllı asistan', settings: 'Ayarlar' }[state.activePage] || 'Kontrol merkezi')}</strong></div><div class="top-actions"><button class="icon-button" id="check-update" title="Güncellemeleri kontrol et">${icon('refresh', 18)}</button><button class="icon-button" id="open-settings" title="Ayarlar">${icon('settings', 18)}</button><div class="user-badge"><div class="user-avatar">E</div><div><div class="user-name">Eczane çalışma alanı</div><div class="user-role">Yerel ve kaynaklı kontrol</div></div></div></div></header>${state.activePage === 'dashboard' ? renderDashboard() : renderOtherPage()}</main></div><div class="toast" id="toast"></div>`;
  bindEvents();
}

function toast(message, type = '') {
  const node = document.querySelector('#toast');
  if (!node) return;
  node.textContent = message;
  node.className = `toast show ${type}`;
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => { node.className = 'toast'; }, 3500);
}

function normaliseHeader(value = '') {
  return String(value).toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').trim();
}

function parseRecords(records) {
  return records.map((record, index) => {
    const entries = Object.entries(record || {});
    const get = (...names) => {
      const wanted = names.map(normaliseHeader);
      const entry = entries.find(([key]) => wanted.some((name) => normaliseHeader(key) === name || normaliseHeader(key).includes(name)));
      return entry ? String(entry[1] ?? '').trim() : '';
    };
    const patient = get('hasta', 'hasta adı', 'hasta adi', 'ad soyad') || `Kayıt ${index + 1}`;
    const medicine = get('ilaç', 'ilac', 'ilaç adı', 'ilac adi', 'ürün', 'urun') || 'Belirtilmemiş ürün';
    const report = get('rapor no', 'rapor', 'rapor numarası', 'rapor numarasi') || `KAYIT-${String(index + 1).padStart(4, '0')}`;
    const date = get('tarih', 'rapor tarihi') || '—';
    const endDate = get('rapor bitiş tarihi', 'rapor bitis tarihi', 'bitiş tarihi', 'bitis tarihi');
    const barcode = get('barkod', 'ilaç barkodu', 'ilac barkodu', 'güncel barkod');
    const diagnosis = get('tanı', 'tani', 'icd-10', 'icd10', 'endikasyon');
    const dose = get('doz', 'kullanım', 'kullanim', 'doz ve kullanım');
    const specialist = get('uzmanlık', 'uzmanlik', 'branş', 'brans');
    const tc = get('tc', 'tc kimlik', 'hasta no') || '••••••••••';
    const missing = !endDate || !diagnosis || !barcode;
    return { patient, tc, medicine, report, date, endDate, barcode, diagnosis, dose, specialist, status: missing ? 'warn' : 'ok', note: missing ? 'Rapor alanlarından biri incelenmeli' : 'Temel alanlar bulundu' };
  });
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const separator = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(separator).map((value) => value.trim());
  const records = lines.slice(1).map((line) => {
    const values = line.split(separator).map((value) => value.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
  });
  return parseRecords(records);
}

function parsePdfText(text) {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const valueAfter = (patterns) => {
    const line = lines.find((candidate) => patterns.some((pattern) => pattern.test(candidate)));
    if (!line) return '';
    const parts = line.split(/\s*[:;|-]\s*/);
    return parts.length > 1 ? parts.slice(1).join(' ').trim() : line.replace(/^(hasta adı|hasta adi|ad soyad|ilaç adı|ilac adi|barkod|rapor no|rapor numarası|rapor numarasi|tanı|tani|icd-?10|rapor tarihi|başlangıç tarihi|baslangic tarihi|bitiş tarihi|bitis tarihi|doz|kullanım|kullanim|uzmanlık|uzmanlik|branş|brans)\s*/i, '').trim();
  };
  const record = {
    hasta: valueAfter([/hasta\s*(adı|adi)?/i, /ad\s*soyad/i]),
    barkod: valueAfter([/barkod/i]),
    'rapor no': valueAfter([/rapor\s*(no|numarası|numarasi)/i]),
    tanı: valueAfter([/tanı/i, /tani/i, /icd\s*-?\s*10/i, /endikasyon/i]),
    'rapor tarihi': valueAfter([/rapor\s*tarihi/i, /başlangıç\s*tarihi/i, /baslangic\s*tarihi/i]),
    'rapor bitiş tarihi': valueAfter([/bitiş\s*tarihi/i, /bitis\s*tarihi/i]),
    doz: valueAfter([/doz/i, /kullanım/i, /kullanim/i]),
    uzmanlık: valueAfter([/uzmanlık/i, /uzmanlik/i, /branş/i, /brans/i])
  };
  const useful = Object.values(record).filter(Boolean).length;
  return useful ? parseRecords([record]) : [];
}

async function localSearch(query) {
  if (!state.medicineIndex) {
    try { state.medicineIndex = await (await fetch('/medicine-index.json')).json(); } catch { state.medicineIndex = { items: [] }; }
  }
  const needle = normaliseHeader(query);
  if (!needle) return [];
  return (state.medicineIndex.items || []).filter((item) => {
    const barcodes = (item.barcodes || [item.barcode]).filter(Boolean).map(String);
    const searchText = normaliseHeader(item.searchText || `${item.name} ${item.barcode}`);
    return barcodes.includes(String(query).trim()) || searchText.includes(needle);
  }).slice(0, 20).map((item) => ({ ...item, matchType: (item.barcodes || []).includes(String(query).trim()) ? 'Barkod eşleşmesi' : 'Metin eşleşmesi' }));
}

async function searchMedicine(query) {
  const value = String(query || '').trim();
  state.barcodeInput = value;
  if (!value) { state.searchResults = []; render(); return; }
  state.searchResults = api.searchMedicines ? await api.searchMedicines(value) : await localSearch(value);
  render();
}

function selectMedicine(medicine) {
  state.selectedMedicine = medicine;
  state.barcodeInput = medicine.barcode || state.barcodeInput;
  const ambiguity = state.searchResults.filter((item) => item.barcode === medicine.barcode).length > 1;
  state.assistantText = ambiguity ? 'Aynı barkodla birden fazla kayıt bulundu. Ürün ve yürürlük tarihini yetkili kişi teyit etmeden uygun kabul etmeyin.' : `${medicine.name} kaydı resmi EK-4/A indeksinde bulundu. Kamu no ${medicine.publicNo || '—'}; eşdeğer grup ${medicine.equivalenceGroup || 'belirtilmemiş'}. Rapor kontrolü için tanı, tarih, doz ve yetkili uzmanlık alanlarını ayrıca doğrulayın.`;
  state.lastActions.unshift({ title: `${medicine.name} seçildi`, time: nowText() });
  state.lastActions = state.lastActions.slice(0, 5);
  render();
  toast('İlaç seçildi. Rapor gereksinimleri gösterildi.');
}

async function loadFile(file) {
  if (!file) return;
  state.fileName = file.name;
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: false });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const records = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
      state.rows = parseRecords(records);
      state.checkedAt = 'Excel yüklendi · kontrol bekliyor';
      render();
      toast(`${file.name} yüklendi. ${state.rows.length} kayıt bulundu.`);
    } catch (error) {
      state.rows = [];
      render();
      toast(`Excel okunamadı: ${error.message}`, 'error');
    }
    return;
  }
  if (lowerName.endsWith('.csv') || lowerName.endsWith('.txt')) {
    const reader = new FileReader();
    reader.onload = () => { state.rows = parseCsv(String(reader.result || '')); state.checkedAt = 'Dosya yüklendi · kontrol bekliyor'; render(); toast(`${file.name} yüklendi. ${state.rows.length} kayıt bulundu.`); };
    reader.readAsText(file, 'utf-8');
    return;
  }
  if (lowerName.endsWith('.pdf')) {
    if (!api.parsePdf) {
      state.rows = [];
      state.checkedAt = 'PDF alındı · masaüstü ayrıştırması bekleniyor';
      render();
      toast('PDF alan kontrolü masaüstü paketinde etkin; önizleme modunda dosya metni okunamaz.', 'warning');
      return;
    }
    try {
      const text = await api.parsePdf(new Uint8Array(await file.arrayBuffer()));
      state.rows = parsePdfText(text);
      state.checkedAt = state.rows.length ? 'PDF metni ayrıştırıldı · kontrol bekliyor' : 'PDF görüntü tabanlı veya alanları bulunamadı';
      render();
      toast(state.rows.length ? `${file.name} okundu. ${state.rows.length} kayıt bulundu.` : 'PDF’de okunabilir alan bulunamadı; taranmış belge için manuel inceleme gerekir.', state.rows.length ? '' : 'warning');
    } catch (error) {
      state.rows = [];
      state.checkedAt = 'PDF okunamadı';
      render();
      toast(`PDF okunamadı: ${error.message}`, 'error');
    }
    return;
  }
  state.rows = [];
  state.checkedAt = 'Desteklenmeyen rapor formatı';
  render();
  toast(`${file.name} desteklenmeyen bir format. PDF, XLSX veya CSV kullanın.`, 'warning');
}

function runCheck() {
  if (!state.fileName && !state.selectedMedicine) { toast('Önce rapor dosyası veya ilaç seçin.', 'error'); return; }
  const selectedBarcodes = (state.selectedMedicine?.barcodes || [state.selectedMedicine?.barcode]).filter(Boolean).map(String);
  state.rows = state.rows.map((row) => {
    const missing = !row.endDate || !row.diagnosis || !row.barcode;
    const mismatch = Boolean(selectedBarcodes.length && row.barcode && !selectedBarcodes.includes(String(row.barcode).trim()));
    return { ...row, status: mismatch ? 'error' : missing ? 'warn' : 'ok', note: mismatch ? 'Seçilen ilaç ile rapor barkodu uyuşmuyor' : missing ? 'Rapor alanlarından biri incelenmeli' : 'Temel alanlar bulundu' };
  });
  const errors = state.rows.filter((row) => row.status === 'error').length;
  const warnings = state.rows.filter((row) => row.status === 'warn').length;
  state.checkedAt = `${nowText()} · kontrol tamamlandı`;
  state.assistantText = state.selectedMedicine ? `Kontrol tamamlandı. ${errors} barkod uyuşmazlığı ve ${warnings} eksik/inceleme kaydı bulundu. Bu sonuç, seçilen ürünün kaynaklı barkod kaydı ile yüklenen rapor alanlarının karşılaştırmasıdır; ödeme kararı değildir.` : `Kontrol tamamlandı. ${warnings} kayıt manuel inceleme bekliyor. Bir ilaç seçerek rapor barkodunu kaynaklı EK-4/A kaydıyla karşılaştırabilirsiniz.`;
  render();
  toast(errors ? `${errors} barkod uyuşmazlığı bulundu.` : 'Rapor kontrolü tamamlandı.');
}

function exportResults() {
  if (!state.rows.length) { toast('Dışa aktarılacak sonuç bulunmuyor.', 'error'); return; }
  const header = 'Hasta,İlaç / ürün,Barkod,Rapor no,Tanı,Tarih,Durum\n';
  const body = state.rows.map((row) => [row.patient, row.medicine, row.barcode, row.report, row.diagnosis, row.date, row.status].map((value) => `"${String(value || '').replaceAll('"', '""')}"`).join(',')).join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([header + body], { type: 'text/csv;charset=utf-8' }));
  link.download = 'sut-kontrol-sonuclari.csv';
  link.click();
  URL.revokeObjectURL(link.href);
  toast('Kontrol sonuçları dışa aktarıldı.');
}

function bindEvents() {
  const input = document.querySelector('#file-input');
  const zone = document.querySelector('#upload-zone');
  document.querySelector('#choose-report')?.addEventListener('click', () => input?.click());
  document.querySelector('#browse-report')?.addEventListener('click', () => input?.click());
  input?.addEventListener('change', (event) => loadFile(event.target.files[0]));
  zone?.addEventListener('dragover', (event) => { event.preventDefault(); zone.classList.add('dragging'); });
  zone?.addEventListener('dragleave', () => zone.classList.remove('dragging'));
  zone?.addEventListener('drop', (event) => { event.preventDefault(); zone.classList.remove('dragging'); loadFile(event.dataTransfer.files[0]); });
  document.querySelector('#run-check')?.addEventListener('click', runCheck);
  document.querySelector('#export-results')?.addEventListener('click', exportResults);
  document.querySelector('#refresh-sut')?.addEventListener('click', checkSutUpdates);
  document.querySelector('#check-update')?.addEventListener('click', checkAppUpdates);
  document.querySelector('#show-update')?.addEventListener('click', () => api.showUpdateDetails?.() || toast(`Sürüm ${state.appVersion} · ${state.updateText}`));
  document.querySelector('#open-settings')?.addEventListener('click', () => { state.activePage = 'settings'; render(); });
  document.querySelector('#clear-barcode')?.addEventListener('click', () => { state.barcodeInput = ''; state.searchResults = []; render(); document.querySelector('#barcode-input')?.focus(); });
  const barcode = document.querySelector('#barcode-input');
  barcode?.addEventListener('input', (event) => { window.clearTimeout(searchMedicine.timer); searchMedicine.timer = window.setTimeout(() => searchMedicine(event.target.value), 140); });
  barcode?.addEventListener('keydown', (event) => { if (event.key === 'Enter' && state.searchResults[0]) { event.preventDefault(); selectMedicine(state.searchResults[0]); } });
  document.querySelector('#scan-barcode')?.addEventListener('click', () => searchMedicine(barcode?.value || ''));
  document.querySelectorAll('.search-result').forEach((button) => button.addEventListener('click', () => selectMedicine(state.searchResults[Number(button.dataset.resultIndex)])));
  document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => { state.activePage = item.dataset.page; render(); }));
}

async function checkAppUpdates() {
  state.updateText = 'Güncellemeler kontrol ediliyor'; render();
  try { const result = await api.checkForUpdates?.(); if (result?.status === 'dev') toast('Geliştirme modunda güncelleme kontrolü paketli sürümde çalışır.'); else toast('Program güncellemesi kontrolü başlatıldı.'); }
  catch { state.updateText = 'Güncelleme kontrolü başarısız'; render(); toast('Güncelleme servisine ulaşılamadı.', 'error'); }
}

async function checkSutUpdates() {
  state.sutText = 'SUT sürümü kontrol ediliyor'; render();
  try {
    const result = await api.checkSutUpdates?.();
    if (result?.error) { state.sutText = 'Mevcut veri korunuyor'; toast(`SUT güncellemesi alınamadı: ${result.error}`, 'error'); }
    else if (result?.manifest) { state.sutVersion = result.manifest.dataVersion; state.sutCheckedAt = nowText(); state.sutText = result.current ? 'SUT verisi güncel' : 'Yeni SUT verisi yüklendi'; toast(result.current ? 'SUT verisi güncel.' : 'Yeni SUT veri paketi yüklendi.'); }
    render();
  } catch { state.sutText = 'Kontrol beklemede'; render(); toast('SUT kaynağına ulaşılamadı.', 'error'); }
}

api.onUpdateStatus?.((message) => { state.updateText = message; render(); });
api.onSutStatus?.((message) => { state.sutText = message; state.sutCheckedAt = nowText(); render(); });
api.onUpdateReady?.(() => { toast('Yeni program sürümü hazır. Uygulamayı kapattığınızda kurulacak.'); });

Promise.all([api.getAppVersion?.(), api.getSutInfo?.()]).then(([version, sut]) => {
  if (version) state.appVersion = version;
  if (sut?.dataVersion) { state.sutVersion = sut.dataVersion; state.sutCheckedAt = sut.generatedAt ? new Date(sut.generatedAt).toLocaleString('tr-TR') : state.sutCheckedAt; state.sutText = 'SUT verisi güncel'; }
  render();
}).catch(() => render());
