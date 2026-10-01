// Coach Dashboard — Electron main process
// - Loads index.html in the teacher (control) window
// - Auto-updates from GitHub Releases (electron-updater) when online
// - Exposes safe local-file APIs to the renderer via preload.js
// - Graceful when opened as plain index.html (no Electron): renderer checks window.electron
const { app, BrowserWindow, ipcMain, shell, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWin = null;

function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#ffffff',
    title: 'Coach Dashboard',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      nativeWindowOpen: true
    }
  });
  mainWin.removeMenu();
  mainWin.loadFile(path.join(__dirname, '..', 'index.html'));
  mainWin.on('closed', () => { mainWin = null; });
}

// ---- local presentations/books folders (presentations saved LOCALLY) ----
function appDataDir(name) {
  const dir = path.join(app.getPath('userData'), name);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

ipcMain.handle('coach:paths', () => ({
  presentations: appDataDir('presentations'),
  books: appDataDir('books'),
  userData: app.getPath('userData')
}));

// Save an ArrayBuffer from the renderer as a real local file. Returns saved path.
ipcMain.handle('coach:save-file', async (_evt, { folder, fileName, data }) => {
  const safe = String(fileName || 'file').split(/[\\/]/).pop().replace(/[<>:"|?*\x00-\x1F]/g, '').slice(0, 120) || 'file';
  const dir = appDataDir(folder === 'books' ? 'books' : 'presentations');
  const full = path.join(dir, safe);
  await fs.promises.writeFile(full, Buffer.from(data));
  return full;
});

ipcMain.handle('coach:list-files', async (_evt, folder) => {
  const dir = appDataDir(folder === 'books' ? 'books' : 'presentations');
  try { return await fs.promises.readdir(dir); } catch { return []; }
});

ipcMain.handle('coach:open-external', (_evt, target) => {
  // Used for ms-powerpoint: links and https: links
  if (/^(https?:|ms-powerpoint:)/i.test(String(target))) shell.openExternal(String(target));
});

ipcMain.handle('coach:open-path', (_evt, fullPath) => {
  shell.showItemInFolder(String(fullPath));
});

// NOTE: .pptx files render fully in-browser (js/vendor + js/pptx-view.js) —
// no PowerPoint or conversion step needed anywhere.

ipcMain.handle('coach:remove-dir', async (_evt, dir) => {
  try {
    const base = appDataDir('presentations');
    const full = path.resolve(String(dir));
    if (!full.startsWith(base)) return false; // never delete outside our folder
    fs.rmSync(full, { recursive: true, force: true });
    return true;
  } catch { return false; }
});

ipcMain.handle('coach:delete-file', async (_evt, fullPath) => {
  try {
    const base = path.resolve(app.getPath('userData'));
    const full = path.resolve(String(fullPath));
    if (!full.startsWith(base)) return false; // never delete outside app data
    await fs.promises.unlink(full);
    return true;
  } catch { return false; }
});

// ---- auto-update from GitHub Releases (only when installed, not in dev) ----
function setupAutoUpdate() {
  if (!app.isPackaged) return; // skip in `npm start`
  try {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.autoDownload = true;
    autoUpdater.on('update-downloaded', () => {
      if (mainWin) mainWin.webContents.send('coach:update-downloaded');
    });
    autoUpdater.on('error', () => { /* stay silent offline */ });
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
    setInterval(() => { autoUpdater.checkForUpdatesAndNotify().catch(() => {}); }, 6 * 60 * 60 * 1000);
    ipcMain.handle('coach:quit-and-install', () => autoUpdater.quitAndInstall());
  } catch { /* electron-updater not available */ }
}

app.whenReady().then(() => {
  createMainWindow();
  setupAutoUpdate();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createMainWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
