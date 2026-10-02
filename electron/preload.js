// Coach Dashboard — preload bridge (safe renderer API).
// Renderer must ALWAYS check `window.electron` first so plain index.html still works.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  getPaths: () => ipcRenderer.invoke('coach:paths'),
  saveFile: (folder, fileName, arrayBuffer) => ipcRenderer.invoke('coach:save-file', { folder, fileName, data: arrayBuffer }),
  listFiles: (folder) => ipcRenderer.invoke('coach:list-files', folder),
  removeDir: (dir) => ipcRenderer.invoke('coach:remove-dir', dir),
  deleteFile: (fullPath) => ipcRenderer.invoke('coach:delete-file', fullPath),
  openExternal: (target) => ipcRenderer.invoke('coach:open-external', target),
  openPath: (fullPath) => ipcRenderer.invoke('coach:open-path', fullPath),
  quitAndInstall: () => ipcRenderer.invoke('coach:quit-and-install'),
  onUpdateDownloaded: (cb) => ipcRenderer.on('coach:update-downloaded', cb),
  // 2nd-screen stage transport (installed app: true auto-fullscreen, no popups)
  stageOpen: () => ipcRenderer.invoke('coach:stage-open'),
  stageShow: (msg) => ipcRenderer.invoke('coach:stage-show', msg),
  stageClose: () => ipcRenderer.invoke('coach:stage-close')
});

// Inside the STAGE window, forward main-process content into the page.
try {
  ipcRenderer.on('coach:stage-msg', (_evt, msg) => {
    window.dispatchEvent(new CustomEvent('coach:electron-stage', { detail: msg }));
  });
} catch {}
