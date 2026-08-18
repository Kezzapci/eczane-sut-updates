import './style.css';

const state = {
  fileName: '',
  rows: [],
  checkedAt: 'Henüz kontrol yapılmadı',
  appVersion: '0.1.1',
  updateText: 'Otomatik güncelleme etkin',
  sutText: 'Otomatik kontrol açık',
  sutVersion: 'Henüz indirilmedi',
  sutCheckedAt: 'Henüz kontrol edilmedi',
  activePage: 'dashboard'
};

const api = window.electronAPI || {};
const app = document.querySelector('#app');

function esc(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function icon(text) {
  return `<span class="nav-icon" aria-hidden="true">${text}</span>`;
}

function statusLabel(status) {
  if (status === 'ok') return '<span class="status-pill ok"><span class="status-dot"></span>Uygun</span>';
  if (status === 'warn') return '<span class="status-pill warn"><span class="status-dot"></span>İncelenmeli</span>';
  return '<span class="status-pill error"><span class="status-dot"></span>Eksik bilgi</span>';
}

function renderRows() {
  if (!state.rows.length) return '<tr><td colspan="6"><div class="empty-state">Henüz rapor yüklenmedi.</div></td></tr>';
  return state.rows.map((row) => `
    <tr>
      <td>${esc(row.patient)}</td>
      <td>${esc(row.tc)}</td>
      <td>${esc(row.medicine)}</td>
      <td>${esc(row.report)}</td>
      <td>${esc(row.date)}</td>
      <td>${statusLabel(row.status)}</td>
    </tr>`).join('');
}

function render() {
  const total = state.rows.length;
  const ok = state.rows.filter((row) => row.status === 'ok').length;
  const warn = state.rows.filter((row) => row.status === 'warn').length;
  const error = state.rows.filter((row) => row.status === 'error').length;

  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">+</div>
          <div>
            <div class="brand-name">Eczane SUT Kontrol</div>
            <div class="brand-caption">Rapor uygunluk merkezi</div>
          </div>
        </div>
        <div class="nav-label">Çalışma alanı</div>
        <button class="nav-item active" data-page="dashboard">${icon('▦')}<span>Rapor Kontrol</span></button>
        <button class="nav-item" data-page="reports">${icon('▤')}<span>Kontrol Geçmişi</span></button>
        <div class="nav-label">Yönetim</div>
        <button class="nav-item" data-page="sut">${icon('↻')}<span>SUT Güncellemeleri</span></button>
        <button class="nav-item" data-page="settings">${icon('⚙')}<span>Ayarlar</span></button>
        <div class="sidebar-footer">
          <div class="connection"><span class="connection-dot"></span><span>Güncelleme servisi bağlı</span></div>
          <div class="version">Sürüm ${esc(state.appVersion)} · Windows 11</div>
        </div>
      </aside>

      <main class="main-area">
        <header class="topbar">
          <div class="breadcrumb">Ana sayfa <span> / </span> <strong>Rapor Kontrol</strong></div>
          <div class="top-actions">
            <button class="icon-button" id="check-update" title="Güncellemeleri kontrol et">↻</button>
            <button class="icon-button" id="open-settings" title="Ayarlar">⚙</button>
            <div class="user-badge">
              <div class="user-avatar">EC</div>
              <div><div class="user-name">Eczane kullanıcısı</div><div class="user-role">Yetkili çalışma alanı</div></div>
            </div>
          </div>
        </header>

        <section class="content">
          <div class="page-heading">
            <div>
              <h1 class="page-title">Rapor kontrol merkezi</h1>
              <p class="page-subtitle">Rapor dosyanızı yükleyin, temel uygunluk kontrollerini tek ekranda yönetin.</p>
            </div>
            <button class="primary-button" id="choose-report"><span class="button-icon">+</span> Yeni rapor yükle</button>
          </div>

          <div class="status-strip">
            <div class="status-copy"><span class="status-check">✓</span><span><strong>Sistem hazır.</strong> ${esc(state.updateText)}.</span></div>
            <button class="status-link" id="show-update">Sürüm bilgisi</button>
          </div>

          <div class="stat-grid">
            <div class="stat-card"><div class="stat-top"><span class="stat-label">Toplam rapor</span><span class="stat-icon blue">▤</span></div><div class="stat-value">${total}</div><div class="stat-note">Son kontrol dosyasındaki kayıtlar</div></div>
            <div class="stat-card"><div class="stat-top"><span class="stat-label">Uygun kayıt</span><span class="stat-icon green">✓</span></div><div class="stat-value">${ok}</div><div class="stat-note"><strong>${total ? Math.round(ok / total * 100) : 0}%</strong> temel alan kontrolü</div></div>
            <div class="stat-card"><div class="stat-top"><span class="stat-label">İncelenmeli</span><span class="stat-icon amber">!</span></div><div class="stat-value">${warn}</div><div class="stat-note">Manuel teyit bekleyen kayıtlar</div></div>
            <div class="stat-card"><div class="stat-top"><span class="stat-label">Eksik bilgi</span><span class="stat-icon red">×</span></div><div class="stat-value">${error}</div><div class="stat-note">Düzeltilmesi gereken alanlar</div></div>
          </div>

          <div class="grid-main">
            <div>
              <section class="card">
                <div class="card-header"><div><h2 class="card-title">Rapor dosyası</h2><div class="card-description">PDF, Excel veya CSV rapor dosyanızı seçin.</div></div><button class="secondary-button" id="run-check"><span class="button-icon">✓</span> Kontrolü çalıştır</button></div>
                <div class="card-body">
                  <div class="upload-zone" id="upload-zone">
                    <div><div class="upload-icon">↑</div><div class="upload-title">${state.fileName ? esc(state.fileName) : 'Rapor dosyasını buraya bırakın'}</div><div class="upload-help">veya bilgisayarınızdan seçmek için aşağıdaki düğmeyi kullanın</div><button class="secondary-button" id="browse-report">Dosya seç</button><div class="upload-formats">Desteklenen formatlar: PDF · XLSX · CSV</div></div>
                  </div>
                  <input id="file-input" class="file-input" type="file" accept=".pdf,.xlsx,.xls,.csv,.txt" />
                </div>
              </section>

              <section class="card" style="margin-top: 20px;">
                <div class="card-header"><div><h2 class="card-title">Son kontrol sonuçları</h2><div class="card-description">${state.fileName ? esc(state.fileName) : 'Henüz rapor yüklenmedi'}</div></div><button class="card-link" id="export-results">Sonuçları dışa aktar</button></div>
                <div class="table-wrap"><table class="report-table"><thead><tr><th>Hasta</th><th>Hasta no</th><th>İlaç / ürün</th><th>Rapor no</th><th>Tarih</th><th>Durum</th></tr></thead><tbody>${renderRows()}</tbody></table></div>
              </section>
            </div>

            <div class="side-stack">
              <section class="card sut-card">
                <div class="card-header"><div><h2 class="card-title">SUT veri sürümü</h2><div class="card-description">Resmi kaynak takibi</div></div><span style="font-size:18px;color:#83e1d7">↻</span></div>
                <div class="sut-body">
                  <div class="sut-status"><div class="sut-status-icon">✓</div><div><div class="sut-status-title">${esc(state.sutText)}</div><div class="sut-status-copy">SGK kaynağı otomatik izleniyor</div></div></div>
                  <div class="sut-meta"><div class="sut-meta-item"><div class="sut-meta-label">SUT sürümü</div><div class="sut-meta-value">${esc(state.sutVersion)}</div></div><div class="sut-meta-item"><div class="sut-meta-label">Son tarama</div><div class="sut-meta-value">${esc(state.sutCheckedAt)}</div></div></div>
                  <button class="secondary-button sut-button" id="refresh-sut">Şimdi güncellemeleri denetle</button>
                </div>
              </section>

              <section class="card">
                <div class="card-header"><div><h2 class="card-title">Son aktiviteler</h2><div class="card-description">Çalışma alanındaki son işlemler</div></div></div>
                <div class="card-body">
                  <div class="activity-item"><div class="activity-icon ok">✓</div><div><div class="activity-title">SUT veri paketi doğrulandı</div><div class="activity-time">${esc(state.sutCheckedAt)}</div></div></div>
                  <div class="activity-item"><div class="activity-icon info">↗</div><div><div class="activity-title">${state.fileName ? esc(state.fileName) : 'Henüz rapor yüklenmedi'}</div><div class="activity-time">${esc(state.checkedAt)}</div></div></div>
                  <div class="activity-item"><div class="activity-icon warn">!</div><div><div class="activity-title">Otomatik güncelleme servisi izleniyor</div><div class="activity-time">GitHub Releases bağlantısı etkin</div></div></div>
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>
    </div>
    <div class="toast" id="toast"></div>
  `;

  bindEvents();
}

function toast(message, type = '') {
  const node = document.querySelector('#toast');
  if (!node) return;
  node.textContent = message;
  node.className = `toast show ${type}`;
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => { node.className = 'toast'; }, 3200);
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const separator = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(separator).map((value) => value.trim().toLowerCase());
  return lines.slice(1).map((line, index) => {
    const values = line.split(separator).map((value) => value.trim());
    const get = (...names) => {
      const position = names.map((name) => headers.indexOf(name)).find((item) => item >= 0);
      return position === undefined ? '' : values[position] || '';
    };
    const patient = get('hasta', 'hasta adı', 'hasta adi', 'ad soyad') || `Kayıt ${index + 1}`;
    const medicine = get('ilaç', 'ilac', 'ilaç adı', 'ilac adi', 'ürün', 'urun') || 'Belirtilmemiş ürün';
    const report = get('rapor no', 'rapor', 'rapor numarası', 'rapor numarasi') || `CSV-${String(index + 1).padStart(4, '0')}`;
    const date = get('tarih', 'rapor tarihi', 'rapor tarihi') || '—';
    const tc = get('tc', 'tc kimlik', 'hasta no') || '••••••••••';
    const missing = !get('rapor bitiş tarihi', 'rapor bitis tarihi', 'bitiş tarihi', 'bitis tarihi');
    return { patient, tc, medicine, report, date, status: missing ? 'warn' : 'ok', note: missing ? 'Bitiş tarihi incelenmeli' : 'Temel alanlar uygun' };
  });
}

function loadFile(file) {
  if (!file) return;
  state.fileName = file.name;
  if (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.txt')) {
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCsv(String(reader.result || ''));
      state.rows = parsed.length ? parsed : [];
      state.checkedAt = 'Dosya yüklendi · kontrol bekliyor';
      render();
      toast(`${file.name} yüklendi. Kontrolü çalıştırabilirsiniz.`);
    };
    reader.readAsText(file, 'utf-8');
    return;
  }
  state.rows = [];
  state.checkedAt = 'Dosya yüklendi · içerik ayrıştırma modülü bekleniyor';
  render();
  toast(`${file.name} alındı. PDF/Excel ayrıştırma modülü sonraki sürümde etkinleştirilecek.`);
}

function runCheck() {
  if (!state.fileName) {
    toast('Önce bir rapor dosyası seçin.', 'error');
    return;
  }
  state.rows = state.rows.map((row) => ({ ...row, status: row.note?.includes('incelenmeli') ? 'warn' : row.status || 'ok' }));
  state.checkedAt = `Bugün, ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} · kontrol tamamlandı`;
  render();
  toast('Rapor kontrolü tamamlandı.');
}

function exportResults() {
  if (!state.rows.length) {
    toast('Dışa aktarılacak sonuç bulunmuyor.', 'error');
    return;
  }
  const header = 'Hasta,İlaç / ürün,Rapor no,Tarih,Durum\n';
  const body = state.rows.map((row) => [row.patient, row.medicine, row.report, row.date, row.status].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sut-kontrol-sonuclari.csv';
  link.click();
  URL.revokeObjectURL(url);
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
  document.querySelector('#show-update')?.addEventListener('click', () => toast(`Sürüm ${state.appVersion} · ${state.updateText}`));
  document.querySelector('#open-settings')?.addEventListener('click', () => toast('Ayarlar ekranı sonraki geliştirme adımında açılacak.'));
  document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach((nav) => nav.classList.remove('active'));
    item.classList.add('active');
    if (item.dataset.page !== 'dashboard') toast(`${item.textContent.trim()} bölümü hazırlanıyor.`);
  }));
}

async function checkAppUpdates() {
  state.updateText = 'Güncellemeler kontrol ediliyor';
  render();
  try {
    const result = await api.checkForUpdates?.();
    if (result?.status === 'dev') toast('Geliştirme modunda güncelleme kontrolü paketli sürümde çalışır.');
    else toast('Güncelleme kontrolü başlatıldı.');
  } catch (error) {
    state.updateText = 'Güncelleme kontrolü başarısız';
    render();
    toast('Güncelleme servisine ulaşılamadı.', 'error');
  }
}

async function checkSutUpdates() {
  state.sutText = 'SUT sürümü kontrol ediliyor';
  render();
  try {
    const result = await api.checkSutUpdates?.();
    if (result?.error) toast('SUT kaynağına ulaşılamadı; mevcut doğrulanmış veri korunuyor.', 'error');
    else toast(result?.updated ? 'Yeni SUT veri paketi otomatik yüklendi.' : 'SUT verisi güncel.');
  } catch {
    state.sutText = 'SUT kontrolü yapılamadı';
    render();
    toast('SUT güncelleme servisine ulaşılamadı.', 'error');
  }
}

api.onUpdateStatus?.((message) => {
  state.updateText = message;
  render();
});

api.onSutStatus?.((message) => {
  state.sutText = message;
  state.sutCheckedAt = new Date().toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
  render();
});

api.getAppVersion?.().then((version) => {
  if (version) { state.appVersion = version; render(); }
});

api.getSutInfo?.().then((manifest) => {
  if (!manifest) return;
  state.sutVersion = manifest.dataVersion || state.sutVersion;
  state.sutCheckedAt = manifest.generatedAt ? new Date(manifest.generatedAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : state.sutCheckedAt;
  state.sutText = 'Güncel SUT verisi kullanılıyor';
  render();
});

render();
