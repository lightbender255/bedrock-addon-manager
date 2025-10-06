const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    'scan-addons': (scanType) => ipcRenderer.invoke('scan-addons', scanType),
    onAddonListUpdate: (callback) => ipcRenderer.on('addon-list-update', (event, ...args) => callback(...args)),

    scanWorlds: () => ipcRenderer.invoke('scan-worlds'),
    onWorldListUpdate: (callback) => ipcRenderer.on('world-list-update', (event, ...args) => callback(...args)),

    getWorldDetails: (worldPath) => ipcRenderer.invoke('get-world-details', worldPath),
    onWorldDetailsUpdate: (callback) => ipcRenderer.on('world-details-update', (event, ...args) => callback(...args)),

    onMainProcessReady: (callback) => ipcRenderer.on('main-process-ready', (_event) => callback()),

    // Expose a logging function to the renderer process
    log: (level, message) => ipcRenderer.send('log', level, message)
});
