const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const crypto = require('node:crypto');
const { autoUpdater } = require('electron-updater');
const extractZip = require('extract-zip');
const pdfParse = require('pdf-parse');

const SUT_MANIFEST_URL = 'https://raw.githubusercontent.com/Kezzapci/eczane-sut-updates/main/sut/latest.json';
const SUT_ROOT = () => path.join(app.getPath('userData'), 'sut-data');
const BUNDLED_MEDICINE_INDEX = () => path.join(__dirname, '..', 'data', 'medicine-index.json');
let mainWindow;
let medicineCache;

function sendStatus(message) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-status', message);
}

function sendSutStatus(message) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('sut-status', message);
}

async function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(await fs.readFile(filePath));
  return hash.digest('hex');
}

async function readJson(filePath) {
  try { return JSON.parse(await fs.readFile(filePath, 'utf8')); } catch { return null; }
}

function isValidManifest(manifest) {
  let packageUrl;
  try { packageUrl = new URL(manifest?.packageUrl || ''); } catch { packageUrl = null; }
  const allowedPackage = packageUrl?.protocol === 'https:' &&
    packageUrl.hostname === 'github.com' &&
    packageUrl.pathname.startsWith('/Kezzapci/eczane-sut-updates/releases/download/');
  return Boolean(
    manifest && manifest.schemaVersion === 1 &&
    typeof manifest.dataVersion === 'string' && /^\d{4}\.\d{2}\.\d{2}$/.test(manifest.dataVersion) &&
    allowedPackage && typeof manifest.sha256 === 'string' && /^[a-f0-9]{64}$/i.test(manifest.sha256) &&
    Number.isInteger(manifest.bytes) && manifest.bytes > 0 && manifest.bytes <= 250 * 1024 * 1024
  );
}

async function validateSutPackage(staging) {
  const entries = await fs.readdir(staging, { recursive: true });
  const files = entries.map((entry) => String(entry).replaceAll('\\', '/'));
  const hasSutDocument = files.some((entry) => /2013 SUT.*\.docx$/i.test(entry));
  const hasActiveEk4a = files.some((entry) => /EK-4A.*\.(xlsx|xls)$/i.test(entry) && !/MÜLGA|MULGA/i.test(entry));
  const hasMedicineIndex = files.some((entry) => /(^|\/)medicine-index\.json$/i.test(entry));
  if (!hasSutDocument || !hasActiveEk4a || !hasMedicineIndex) {
    throw new Error(`SUT paketi beklenen dosyaları içermiyor (SUT=${hasSutDocument}, EK-4A=${hasActiveEk4a}, medicine-index=${hasMedicineIndex})`);
  }
  return { fileCount: files.length, hasMedicineIndex };
}

async function installSutPackage(manifest) {
  const root = SUT_ROOT();
  const current = path.join(root, 'current');
  const previous = path.join(root, 'previous');
  const staging = path.join(root, `staging-${Date.now()}`);
  const archive = path.join(root, `sut-${manifest.dataVersion}.zip`);
  await fs.mkdir(root, { recursive: true });

  try {
    sendSutStatus(`SUT ${manifest.dataVersion} indiriliyor`);
    const response = await fetch(manifest.packageUrl, { headers: { 'user-agent': `Eczane-SUT-Kontrol/${app.getVersion()}` } });
    if (!response.ok) throw new Error(`SGK paketi ${response.status} döndürdü`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength !== manifest.bytes) throw new Error('SUT paket boyutu manifest ile eşleşmiyor');
    await fs.writeFile(archive, buffer);
    const hash = await sha256File(archive);
    if (hash.toLowerCase() !== manifest.sha256.toLowerCase()) throw new Error('SUT paketi SHA-256 doğrulamasından geçmedi');

    await fs.mkdir(staging, { recursive: true });
    await extractZip(archive, { dir: staging });
    const validation = await validateSutPackage(staging);
    await fs.writeFile(path.join(staging, 'manifest.json'), `${JSON.stringify({ ...manifest, validation }, null, 2)}\n`, 'utf8');

    await fs.rm(previous, { recursive: true, force: true });
    try { await fs.rename(current, previous); } catch { /* İlk kurulumda current olmayabilir. */ }
    await fs.rename(staging, current);
    medicineCache = null;
    await fs.rm(archive, { force: true });
    sendSutStatus(`SUT ${manifest.dataVersion} otomatik yüklendi`);
    return { updated: true, manifest, validation };
  } catch (error) {
    await fs.rm(staging, { recursive: true, force: true }).catch(() => {});
    await fs.rm(archive, { force: true }).catch(() => {});
    sendSutStatus('SUT güncellemesi başarısız · mevcut veri korunuyor');
    console.error('SUT update error:', error.message);
    return { updated: false, error: error.message };
  }
}

async function checkSutUpdates() {
  try {
    sendSutStatus('SUT sürümü kontrol ediliyor');
    const response = await fetch(`${SUT_MANIFEST_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Manifest ${response.status} döndürdü`);
    const manifest = await response.json();
    if (!isValidManifest(manifest)) throw new Error('SUT manifesti geçersiz');
    const installed = await readJson(path.join(SUT_ROOT(), 'current', 'manifest.json'));
    if (installed?.dataVersion === manifest.dataVersion && installed?.sha256 === manifest.sha256) {
      sendSutStatus(`SUT ${manifest.dataVersion} güncel`);
      return { updated: false, current: true, manifest };
    }
    return installSutPackage(manifest);
  } catch (error) {
    sendSutStatus('SUT kontrolü yapılamadı · mevcut veri korunuyor');
    console.error('SUT manifest error:', error.message);
    return { updated: false, error: error.message };
  }
}

function normalise(value = '') {
  return String(value).toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').trim();
}

async function loadMedicineIndex() {
  if (medicineCache) return medicineCache;
  const installed = await readJson(path.join(SUT_ROOT(), 'current', 'medicine-index.json'));
  const bundled = installed || await readJson(BUNDLED_MEDICINE_INDEX());
  medicineCache = bundled?.items ? bundled : { items: [] };
  return medicineCache;
}

async function searchMedicines(query = '') {
  const index = await loadMedicineIndex();
  const needle = normalise(query);
  if (!needle) return [];
  const exact = [];
  const partial = [];
  for (const item of index.items) {
    const barcodes = Array.isArray(item.barcodes) ? item.barcodes : [item.barcode];
    const barcodeMatch = barcodes.some((barcode) => normalise(barcode) === needle);
    if (barcodeMatch) exact.push({ ...item, matchType: 'Barkod eşleşmesi' });
    else if (normalise(item.searchText || `${item.name} ${item.barcode}`).includes(needle)) partial.push({ ...item, matchType: 'Metin eşleşmesi' });
    if (exact.length >= 10) break;
  }
  return [...exact, ...partial].slice(0, 20);
}

async function getMedicineInfo(barcode) {
  const results = await searchMedicines(barcode);
  return results.find((item) => (item.barcodes || []).includes(String(barcode))) || results[0] || null;
}

function configureUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;
  autoUpdater.on('checking-for-update', () => sendStatus('Program güncellemesi kontrol ediliyor'));
  autoUpdater.on('update-available', (info) => sendStatus(`Yeni program sürümü bulundu: ${info.version}`));
  autoUpdater.on('update-not-available', () => sendStatus('Program güncellemesi güncel'));
  autoUpdater.on('download-progress', (progress) => sendStatus(`Program güncellemesi indiriliyor: %${Math.round(progress.percent)}`));
  autoUpdater.on('update-downloaded', () => {
    sendStatus('Yeni program sürümü hazır · uygulama kapanırken kurulacak');
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-ready');
  });
  autoUpdater.on('error', (error) => {
    console.error('Program update error:', error.message);
    sendStatus('Program güncelleme servisi beklemede');
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 960,
    minWidth: 1160,
    minHeight: 760,
    backgroundColor: '#f4f7fb',
    title: 'Eczane SUT Kontrol',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  if (process.env.ELECTRON_DEV === '1') {
    mainWindow.loadURL('http://127.0.0.1:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  configureUpdater();
  createWindow();
  setTimeout(() => checkSutUpdates(), 2500);
  setInterval(() => checkSutUpdates(), 6 * 60 * 60 * 1000);
  if (app.isPackaged) {
    setTimeout(() => autoUpdater.checkForUpdates().catch((error) => console.error(error.message)), 3500);
  } else {
    sendStatus('Geliştirme sürümü · program güncellemesi paketli sürümde etkin');
  }
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('app-version', () => app.getVersion());
ipcMain.handle('check-for-updates', async () => {
  if (!app.isPackaged) return { status: 'dev' };
  await autoUpdater.checkForUpdates();
  return { status: 'started' };
});
ipcMain.handle('check-sut-updates', () => checkSutUpdates());
ipcMain.handle('sut-info', async () => readJson(path.join(SUT_ROOT(), 'current', 'manifest.json')));
ipcMain.handle('medicine-search', (_event, query) => searchMedicines(query));
ipcMain.handle('medicine-info', (_event, barcode) => getMedicineInfo(barcode));
ipcMain.handle('parse-pdf', async (_event, bytes) => {
  const buffer = Buffer.from(bytes || []);
  if (!buffer.length || buffer.length > 50 * 1024 * 1024) throw new Error('PDF dosyası boş veya 50 MB sınırını aşıyor');
  const parsed = await pdfParse(buffer);
  return String(parsed.text || '').slice(0, 2_000_000);
});
ipcMain.handle('install-update', () => { if (app.isPackaged) autoUpdater.quitAndInstall(); });
ipcMain.handle('show-update-details', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Otomatik güncelleme',
    message: 'Eczane SUT Kontrol',
    detail: 'SUT veri paketleri SGK kaynağından doğrulanarak otomatik alınır. Program sürümleri public GitHub güncelleme deposundan otomatik indirilir.'
  });
});
