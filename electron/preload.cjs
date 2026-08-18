const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  checkSutUpdates: () => ipcRenderer.invoke('check-sut-updates'),
  getSutInfo: () => ipcRenderer.invoke('sut-info'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  showUpdateDetails: () => ipcRenderer.invoke('show-update-details'),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (_event, message) => callback(message)),
  onSutStatus: (callback) => ipcRenderer.on('sut-status', (_event, message) => callback(message)),
  onUpdateReady: (callback) => ipcRenderer.on('update-ready', () => callback())
});
