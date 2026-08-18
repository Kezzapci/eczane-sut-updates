import './style.css';
import * as XLSX from 'xlsx';

const state = {
  fileName: '',
  rows: [],
  checkedAt: 'Henüz kontrol yapılmadı',
  appVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.4.0',
  updateText: 'Otomatik güncelleme etkin',
  sutText: 'Otomatik kontrol açık',
  sutVersion: 'Veri aranıyor',
  sutCheckedAt: 'Henüz kontrol edilmedi',
  activePage: 'dashboard',
  barcodeInput: '',
  searchResults: [],
  selectedMedicine: null,
  assistantText: 'Bir barkod okutun veya ilaç adı yazın. Kaynaklı ön kontrol özeti burada görünecek.',
  assistantAssessment: null,
  aiBusy: false,
  workflow: { treatment: '', setting: '', reportCode: '', indication: '', reportSpecialist: false, prescriptionSpecialist: false, quantityRule: false },
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
  if (status === 'error') return '<span class="status-pill error"><span class="status-dot"></span>Uyuşmuyor</span>';
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

function renderMedicineVisual(medicine) {
  const imageUrl = typeof medicine?.imageUrl === 'string' && /^https:\/\//i.test(medicine.imageUrl) ? medicine.imageUrl : '';
  const label = String(medicine?.name || 'İlaç').replace(/\s+/g, ' ').trim();
  const shortLabel = label.length > 62 ? `${label.slice(0, 59)}…` : label;
  if (imageUrl) {
    return `<div class="medicine-visual real-image"><img src="${esc(imageUrl)}" alt="${esc(label)} ürün görseli" loading="lazy" onerror="this.classList.add('is-broken')" /><div class="visual-fallback"><div class="package-render"><span>SGK / EK-4A</span><strong>${esc(shortLabel)}</strong><small>${esc(medicine.barcode || '')}</small></div><em>Görsel yüklenemedi</em></div><small class="visual-source">Ürün görseli · kaynak kaydı</small></div>`;
  }
  return `<div class="medicine-visual identity-visual"><div class="package-render"><span>SGK / EK-4A</span><strong>${esc(shortLabel)}</strong><small>${esc(medicine.barcode || '')}</small><i></i></div><small class="visual-source">Kimlik görseli · resmî SGK indeksinde ambalaj fotoğrafı yok</small></div>`;
}

function renderMedicineCard() {
  const medicine = state.selectedMedicine;
  if (!medicine) {
    return `<div class="medicine-empty"><div class="medicine-empty-icon">${icon('barcode', 32)}</div><div><strong>İlaç seçimi bekleniyor</strong><span>Barkodu okutun veya ilaç adını yazarak listeden seçim yapın.</span></div></div>`;
  }
  const old = medicine.oldBarcodes?.length ? medicine.oldBarcodes.join(', ') : 'Kayıtlı eski barkod yok';
  return `<div class="medicine-card">
    <div class="medicine-card-overview"><div class="medicine-visual-wrap">${renderMedicineVisual(medicine)}</div><div class="medicine-card-info"><div class="medicine-card-top"><div class="medicine-symbol">${icon('shield', 24)}</div><div class="medicine-card-title"><strong>${esc(medicine.name)}</strong><span>${esc(medicine.matchType || 'EK-4A kaydı')} · Kamu No: ${esc(medicine.publicNo || '—')}</span></div><span class="verified-badge">${icon('check', 13)} Kaynaklı</span></div></div></div>
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
    { key: 'specialist', label: 'Uzmanlık / rapor düzenleyen branş', value: row.specialist, note: 'Yetkili uzmanlık kontrolü' },
    { key: 'packageCount', label: 'Kutu miktarı ve kullanım sınırı', value: row.packageCount, note: 'Reçete/rapor miktarı' }
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

function buildSmartAssessment() {
  const row = state.rows[0] || {};
  const medicine = state.selectedMedicine;
  const reportBarcode = String(row.barcode || '').trim();
  const knownBarcodes = (medicine?.barcodes || [medicine?.barcode]).filter(Boolean).map(String);
  const barcodeMatch = Boolean(medicine && reportBarcode && knownBarcodes.includes(reportBarcode));
  const evidence = [
    { label: 'İlaç kaydı', value: medicine?.name || 'İlaç seçilmedi', status: medicine ? 'ok' : 'warn', source: medicine ? `SGK EK-4/A · Kamu No ${medicine.publicNo || '—'}` : 'Resmi indeks kaydı bekleniyor' },
    { label: 'Barkod karşılaştırması', value: reportBarcode || 'Raporda barkod yok', status: !medicine || !reportBarcode ? 'warn' : barcodeMatch ? 'ok' : 'error', source: medicine ? `Seçilen barkod: ${knownBarcodes.join(', ')}` : 'Seçilen ürün yok' },
    { label: 'Rapor / tanı kanıtı', value: row.report && row.diagnosis ? `${row.report} · ${row.diagnosis}` : 'Rapor no veya tanı eksik', status: row.report && row.diagnosis ? 'ok' : 'warn', source: row.report && row.diagnosis ? 'Yüklenen rapor' : 'PDF/XLSX/CSV alan eşleştirmesi' },
    { label: 'Tarih ve doz', value: row.date && row.endDate && row.dose ? `${row.date} — ${row.endDate} · ${row.dose}` : 'Tarih, bitiş veya doz eksik', status: row.date && row.endDate && row.dose ? 'ok' : 'warn', source: 'Yüklenen rapor' },
    { label: 'Uzmanlık kanıtı', value: row.specialist || 'Uzmanlık/branş bulunamadı', status: row.specialist ? 'ok' : 'warn', source: row.specialist ? 'Yüklenen rapor' : 'Kullanıcı teyidi veya belge alanı gerekli' },
    { label: 'Kutu miktarı', value: row.packageCount || 'Kutu miktarı bulunamadı', status: row.packageCount ? 'ok' : 'warn', source: row.packageCount ? 'Yüklenen rapor/reçete' : 'Sayısal miktar girilmedi' }
  ];
  const workflowMissing = [
    ['Tedavi türü', state.workflow.treatment || row.treatment],
    ['Ayaktan/yatan', state.workflow.setting || row.setting],
    ['Rapor veya reçete kodu', state.workflow.reportCode || row.reportCode],
    ['Endikasyon', state.workflow.indication || row.indication || row.diagnosis]
  ].filter(([, value]) => !value).map(([label]) => label);
  const errors = barcodeMatch || !medicine || !reportBarcode ? (medicine && reportBarcode && !barcodeMatch ? ['Seçilen ilaç ile rapor barkodu uyuşmuyor'] : []) : [];
  const warnings = evidence.filter((item) => item.status === 'warn').map((item) => item.label).concat(workflowMissing);
  const conclusion = errors.length ? 'Uygunsuzluk riski bulundu: barkod uyuşmazlığı' : warnings.length ? 'Manuel inceleme gerekli: kanıt veya SUT sorusu eksik' : 'Ön kontrol uygun görünüyor: yetkili kişi onayı gerekli';
  const confidence = errors.length ? 'Düşük' : warnings.length > 3 ? 'Düşük' : warnings.length ? 'Orta' : 'Yüksek';
  return { evidence, errors, warnings, workflowMissing, conclusion, confidence, source: medicine ? `SGK EK-4/A · ${medicine.publicNo || medicine.barcode || 'ürün kaydı'}` : 'Kaynak bekleniyor' };
}

function renderSmartWorkflow() {
  const row = state.rows[0] || {};
  const option = (value, label, current) => `<option value="${esc(value)}" ${current === value ? 'selected' : ''}>${esc(label)}</option>`;
  return `<div class="smart-workflow"><div class="smart-workflow-title"><span>${icon('spark', 14)} SUT soru akışı</span><small>Videodaki manuel adımlar · kullanıcı teyidi</small></div><div class="smart-fields"><label>Tedavi türü<select data-workflow="treatment"><option value="">Seçiniz</option>${option('Raporlu', 'Raporlu', state.workflow.treatment || row.treatment)}${option('Raporsuz', 'Raporsuz', state.workflow.treatment || row.treatment)}</select></label><label>Uygulama yeri<select data-workflow="setting"><option value="">Seçiniz</option>${option('Ayaktan', 'Ayaktan', state.workflow.setting || row.setting)}${option('Yatan', 'Yatan', state.workflow.setting || row.setting)}</select></label><label>Rapor / reçete kodu<input data-workflow="reportCode" value="${esc(state.workflow.reportCode || row.reportCode)}" placeholder="Örn. 258" /></label><label>Endikasyon<input data-workflow="indication" value="${esc(state.workflow.indication || row.indication || row.diagnosis)}" placeholder="Örn. derin ven trombozu profilaksisi" /></label></div><div class="smart-checks"><label><input type="checkbox" data-workflow="reportSpecialist" ${state.workflow.reportSpecialist ? 'checked' : ''} /> Rapor hekimi uygun branşta</label><label><input type="checkbox" data-workflow="prescriptionSpecialist" ${state.workflow.prescriptionSpecialist ? 'checked' : ''} /> Reçete hekimi uygun branşta</label><label><input type="checkbox" data-workflow="quantityRule" ${state.workflow.quantityRule ? 'checked' : ''} /> Kutu miktarı kuralı teyit edildi</label></div></div>`;
}

function renderAssistant() {
  const assessment = state.assistantAssessment || buildSmartAssessment();
  const status = assessment.errors.length ? 'error' : assessment.warnings.length ? 'warn' : 'ok';
  const evidenceRows = assessment.evidence.map((item) => `<div class="evidence-row"><span class="criteria-icon ${item.status}">${item.status === 'ok' ? icon('check', 12) : item.status === 'error' ? icon('close', 12) : icon('alert', 12)}</span><div><strong>${esc(item.label)}</strong><small>${esc(item.value)}</small></div><span class="evidence-source">${esc(item.source)}</span></div>`).join('');
  return `<section class="card assistant-card"><div class="card-header assistant-header"><div class="assistant-heading"><span class="assistant-icon">${icon('spark', 21)}</span><div><h2 class="card-title">Akıllı kontrol asistanı</h2><div class="card-description">Kanıt-temelli ön değerlendirme · insan onayı gerektirir</div></div></div><div class="assistant-actions"><span class="ai-chip">AI destekli</span><button class="assistant-action" id="run-ai-analysis" ${state.aiBusy ? 'disabled' : ''}>${state.aiBusy ? 'Analiz ediliyor…' : 'Akıllı analiz'}</button></div></div><div class="assistant-body"><div class="assistant-verdict ${status}"><strong>${esc(assessment.conclusion)}</strong><span>Güven düzeyi: ${esc(assessment.confidence)}</span></div><p class="assistant-text">${esc(state.assistantText)}</p><div class="evidence-list">${evidenceRows}</div>${renderSmartWorkflow()}<div class="assistant-source">${icon('shield', 14)} <span>${esc(assessment.source)}</span><span class="source-dot">·</span><span>SUT sürümü: ${esc(state.sutVersion)}</span><span class="source-dot">·</span><span>Ödeme kararı değildir</span></div></div></section>`;
}

function renderDashboard() {
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
  const pageTitle = state.activePage === 'dashboard' ? 'Kontrol merkezi' : ({ reports: 'Kontrol geçmişi', sut: 'SUT & Veri merkezi', assistant: 'Akıllı asistan', settings: 'Ayarlar' }[state.activePage] || 'Kontrol merkezi');
  app.innerHTML = `<div class="app-shell"><aside class="sidebar"><div class="brand"><div class="brand-mark">${icon('shield', 22)}<span></span></div><div><div class="brand-name">Eczane<span>SUT</span></div><div class="brand-caption">Rapor uygunluk merkezi</div></div></div><div class="sidebar-heading">ÇALIŞMA ALANI</div><nav class="nav-group">${navItems.slice(0, 2).map(([page, label, ico]) => `<button class="nav-item ${state.activePage === page ? 'active' : ''}" data-page="${page}"><span class="nav-icon">${icon(ico, 17)}</span><span>${label}</span>${page === 'dashboard' ? '<em>1</em>' : ''}</button>`).join('')}</nav><div class="sidebar-heading secondary-heading">VERİ VE YARDIMCILAR</div><nav class="nav-group">${navItems.slice(2).map(([page, label, ico]) => `<button class="nav-item ${state.activePage === page ? 'active' : ''}" data-page="${page}"><span class="nav-icon">${icon(ico, 17)}</span><span>${label}</span>${page === 'assistant' ? '<b class="nav-badge">AI</b>' : ''}</button>`).join('')}</nav><div class="sidebar-bottom"><div class="connection"><span class="connection-dot"></span><div><strong>Servis bağlı</strong><small>Otomatik güncelleme açık</small></div></div><div class="version">v${esc(state.appVersion)} <span>·</span> Windows 11</div></div></aside><main class="main-area"><header class="topbar"><div class="topbar-context"><span class="topbar-kicker">Eczane SUT</span><span class="topbar-slash">/</span><strong>${pageTitle}</strong></div><div class="top-actions"><div class="top-status"><span class="top-status-dot"></span><span>Yerel çalışma alanı</span></div><button class="top-action" id="check-update" title="Güncellemeleri kontrol et">${icon('refresh', 15)} <span>Güncelle</span></button><button class="icon-button" id="open-settings" title="Ayarlar">${icon('settings', 17)}</button><div class="user-badge"><div class="user-avatar">E</div><div><strong>Eczane ekibi</strong><small>Kaynaklı kontrol</small></div></div></div></header>${state.activePage === 'dashboard' ? renderDashboard() : renderOtherPage()}</main></div><div class="toast" id="toast"></div>`;
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
    const packageCount = get('kutu', 'kutu sayısı', 'kutu sayisi', 'kutu adedi', 'miktar', 'quantity');
    const reportCode = get('rapor kodu', 'rapor kod', 'reçete uyarı kodu', 'recete uyarı kodu', 'recete uyarı kodu');
    const indication = get('endikasyon', 'endikasyon kodu', 'uygunluk nedeni');
    const treatment = get('tedavi tipi', 'tedavi türü', 'tedavi turu');
    const setting = get('uygulama', 'uygulama yeri', 'ayaktan', 'yatan');
    const tc = get('tc', 'tc kimlik', 'hasta no') || '••••••••••';
    const missing = !endDate || !diagnosis || !barcode;
    return { patient, tc, medicine, report, date, endDate, barcode, diagnosis, dose, specialist, packageCount, reportCode, indication, treatment, setting, status: missing ? 'warn' : 'ok', note: missing ? 'Rapor alanlarından biri incelenmeli' : 'Temel alanlar bulundu' };
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
  state.assistantAssessment = buildSmartAssessment();
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
      state.assistantAssessment = buildSmartAssessment();
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
    reader.onload = () => { state.rows = parseCsv(String(reader.result || '')); state.assistantAssessment = buildSmartAssessment(); state.checkedAt = 'Dosya yüklendi · kontrol bekliyor'; render(); toast(`${file.name} yüklendi. ${state.rows.length} kayıt bulundu.`); };
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
      state.assistantAssessment = buildSmartAssessment();
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
  state.assistantAssessment = buildSmartAssessment();
  render();
  toast(errors ? `${errors} barkod uyuşmazlığı bulundu.` : 'Rapor kontrolü tamamlandı.');
}

async function runSmartAnalysis() {
  if (state.aiBusy) return;
  state.aiBusy = true;
  render();
  await new Promise((resolve) => window.setTimeout(resolve, 260));
  const assessment = buildSmartAssessment();
  state.assistantAssessment = assessment;
  state.assistantText = assessment.errors.length
    ? `Akıllı analiz barkod uyuşmazlığı tespit etti. Raporu göndermeden önce seçilen ürün, rapor barkodu ve yürürlük tarihini tekrar doğrulayın.`
    : assessment.warnings.length
      ? `Akıllı analiz ${assessment.warnings.length} inceleme başlığı çıkardı. Eksik kanıtları belge üzerinden tamamlayın; SUT maddesini yetkili kişi ayrıca teyit etmelidir.`
      : 'Akıllı analiz, yüklenen rapordaki temel kanıtları ve seçilen SGK ilaç kaydını tutarlı buldu. Bu sonuç kesin ödeme kararı değildir.';
  state.aiBusy = false;
  state.lastActions.unshift({ title: 'Akıllı ön kontrol çalıştırıldı', time: nowText() });
  state.lastActions = state.lastActions.slice(0, 5);
  render();
  toast(assessment.errors.length ? 'AI analizi uyuşmazlık buldu.' : assessment.warnings.length ? 'AI analizi inceleme başlıklarını çıkardı.' : 'AI ön analizi tamamlandı.');
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
  document.querySelector('#run-ai-analysis')?.addEventListener('click', runSmartAnalysis);
  document.querySelectorAll('[data-workflow]').forEach((field) => {
    const key = field.dataset.workflow;
    const sync = () => {
      state.workflow[key] = field.type === 'checkbox' ? field.checked : field.value.trim();
      state.assistantAssessment = buildSmartAssessment();
      if (field.type === 'checkbox' || field.tagName === 'SELECT') render();
    };
    field.addEventListener(field.type === 'text' ? 'input' : 'change', sync);
  });
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
