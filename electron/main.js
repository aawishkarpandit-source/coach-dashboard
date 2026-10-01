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

function safeName(n) {
  return String(n || 'file').split(/[\\/]/).pop().replace(/[<>:"|?*\x00-\x1F]/g, '').slice(0, 120) || 'file';
}

function runPowerShell(args, timeoutMs) {
  const { spawn } = require('child_process');
  return new Promise((resolve) => {
    const p = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', ...args], { windowsHide: true });
    let out = '', err = '';
    const kill = setTimeout(() => { try { p.kill(); } catch {} resolve({ code: 124, out, err: err + '\nTIMEOUT' }); }, timeoutMs || 180000);
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; });
    p.on('error', (e) => { clearTimeout(kill); resolve({ code: 1, out, err: err + String(e) }); });
    p.on('close', (code) => { clearTimeout(kill); resolve({ code: code ?? 1, out: out.trim(), err: err.trim() }); });
  });
}

// Convert .ppt/.pptx → PNG slides using local PowerPoint. No internet needed.
// Returns {ok, dir, slides:[absPaths]} or {ok:false, error:'nopowerpoint'|'...'}.
ipcMain.handle('coach:pptx-export', async (_evt, { fileName, data }) => {
  try {
    const tmp = path.join(app.getPath('temp'), 'coach-pptx-' + Date.now());
    fs.mkdirSync(tmp, { recursive: true });
    const pptx = path.join(tmp, safeName(fileName).replace(/\.+$/, ''));
    await fs.promises.writeFile(pptx, Buffer.from(data));
    const out = path.join(appDataDir('presentations'), 'deck-' + Date.now());
    fs.mkdirSync(out, { recursive: true });
    const r = await runPowerShell(['-File', path.join(__dirname, 'pptx-export.ps1'), '-Pptx', pptx, '-OutDir', out], 180000);
    fs.rmSync(tmp, { recursive: true, force: true });
    if (r.code === 2 || /NOPOWERPOINT/i.test(r.out)) return { ok: false, error: 'nopowerpoint' };
    if (r.code !== 0 || !/^OK:/m.test(r.out)) return { ok: false, error: (r.out + ' ' + r.err).slice(0, 300) || 'convert failed' };
    const files = (await fs.promises.readdir(out)).filter((f) => /\.png$/i.test(f)).sort();
    if (!files.length) return { ok: false, error: 'no slides produced' };
    return { ok: true, dir: out, slides: files.map((f) => path.join(out, f)) };
  } catch (e) { return { ok: false, error: String((e && e.message) || e).slice(0, 200) }; }
});

ipcMain.handle('coach:remove-dir', async (_evt, dir) => {
  try {
    const base = appDataDir('presentations');
    const full = path.resolve(String(dir));
    if (!full.startsWith(base)) return false; // never delete outside our folder
    fs.rmSync(full, { recursive: true, force: true });
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
