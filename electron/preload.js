// Coach Dashboard — preload bridge (safe renderer API).
// Renderer must ALWAYS check `window.electron` first so plain index.html still works.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  getPaths: () => ipcRenderer.invoke('coach:paths'),
  saveFile: (folder, fileName, arrayBuffer) => ipcRenderer.invoke('coach:save-file', { folder, fileName, data: arrayBuffer }),
  listFiles: (folder) => ipcRenderer.invoke('coach:list-files', folder),
  pptxExport: (fileName, arrayBuffer) => ipcRenderer.invoke('coach:pptx-export', { fileName, data: arrayBuffer }),
  removeDir: (dir) => ipcRenderer.invoke('coach:remove-dir', dir),
  openExternal: (target) => ipcRenderer.invoke('coach:open-external', target),
  openPath: (fullPath) => ipcRenderer.invoke('coach:open-path', fullPath),
  quitAndInstall: () => ipcRenderer.invoke('coach:quit-and-install'),
  onUpdateDownloaded: (cb) => ipcRenderer.on('coach:update-downloaded', cb)
});
