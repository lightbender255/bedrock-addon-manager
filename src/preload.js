const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Example of exposing a function to the renderer process
  // someAction: (...args) => ipcRenderer.invoke('some-action', ...args),
});
