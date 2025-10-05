const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  scanAddons: (scanType) => ipcRenderer.invoke('scan-addons', scanType),
  onAddonListUpdate: (callback) => ipcRenderer.on('addon-list-update', callback),
  log: (level, message) => ipcRenderer.send('log', level, message)
});
