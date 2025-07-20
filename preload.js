const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onOpenMiro: (callback) => {
    ipcRenderer.on('open-miro', (event, filePath) => {
      callback(filePath);
    });
  }
});