const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  checkSutUpdates: () => ipcRenderer.invoke('check-sut-updates'),
  getSutInfo: () => ipcRenderer.invoke('sut-info'),
  searchMedicines: (query) => ipcRenderer.invoke('medicine-search', String(query || '').slice(0, 80)),
  getMedicineInfo: (barcode) => ipcRenderer.invoke('medicine-info', String(barcode || '').slice(0, 40)),
  parsePdf: (bytes) => ipcRenderer.invoke('parse-pdf', bytes),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  showUpdateDetails: () => ipcRenderer.invoke('show-update-details'),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (_event, message) => callback(message)),
  onSutStatus: (callback) => ipcRenderer.on('sut-status', (_event, message) => callback(message)),
  onUpdateReady: (callback) => ipcRenderer.on('update-ready', () => callback())
});
