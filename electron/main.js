// Coach Dashboard — Electron main process
// - Loads index.html in the teacher (control) window
// - Auto-updates from GitHub Releases (electron-updater) when online
// - Exposes safe local-file APIs to the renderer via preload.js
// - Graceful when opened as plain index.html (no Electron): renderer checks window.electron
const { app, BrowserWindow, ipcMain, shell, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

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
  // Tell the UI once the page exists: is a 2nd display connected?
  mainWin.webContents.on('did-finish-load', () => {
    // Banner truth check: also treat "2 monitors wired (e.g. duplicate mode)"
    // as connected so the app doesn't nag while it is switching to Extend.
    try {
      physicalMonitorCount().then((n) => {
        notifyConnect(screen.getAllDisplays().length >= 2 || n >= 2);
      }).catch(() => notifyConnect(screen.getAllDisplays().length >= 2));
    } catch { notifyConnect(screen.getAllDisplays().length >= 2); }
  });
  // Closing the teacher window always closes the stage with it.
  mainWin.on('close', () => {
    try { if (stageWin && !stageWin.isDestroyed()) stageWin.close(); } catch {}
    stageWin = null;
  });
}

// ---- 2nd-screen stage: a REAL fullscreen window pinned to the 2nd display ----
// No browser gesture limits here — the installed app fullscreenes automatically.
let stageWin = null;
let lastStageMsg = null;   // re-sent when the stage window (re)loads
let weExtended = false;    // did WE switch Windows to Extend? Then restore Duplicate on exit
function targetDisplay() {
  const all = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  return all.find((d) => d.id !== primary.id) || primary;
}
function ensureStage() {
  // Never open a fullscreen stage over the teacher's only display —
  // ask for a second screen instead (banner updates on the teacher window).
  try { if (screen.getAllDisplays().length < 2) { notifyConnect(false); return null; } } catch {}
  if (stageWin && !stageWin.isDestroyed()) return stageWin;
  const d = targetDisplay();
  stageWin = new BrowserWindow({
    x: d.bounds.x,
    y: d.bounds.y,
    width: d.bounds.width,
    height: d.bounds.height,
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    title: 'Coach Dashboard — Stage (students see this)',
    icon: path.join(__dirname, 'icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  stageWin.removeMenu();
  stageWin.loadFile(path.join(__dirname, '..', 'presenter.html'));
  stageWin.showInactive(); // show without stealing the teacher's focus
  try { stageWin.setFullScreen(true); } catch {}
  try { stageWin.moveTop(); } catch {}
  // On every stage (re)load, replay the current state: last shown content,
  // or LOADING.... until the teacher picks the class after a fresh launch.
  stageWin.webContents.on('did-finish-load', () => {
    try { stageWin.webContents.send('coach:stage-msg', lastStageMsg || { type: 'loading', className: '' }); } catch {}
  });
  stageWin.on('closed', () => { stageWin = null; });
  return stageWin;
}
ipcMain.handle('coach:stage-open', async () => {
  let count = screen.getAllDisplays().length;
  if (count < 2) {
    // Duplicate mode shows one logical display — check the real wiring and
    // switch to Extend if both monitors are physically there.
    const phys = await physicalMonitorCount();
    if (phys >= 2) {
      weExtended = true;
      setDisplayMode('extend');
      await new Promise((done) => afterScreensAppear(done));
      count = screen.getAllDisplays().length;
    }
  }
  if (count < 2) {
    notifyConnect(false); // no stage over the teacher's own screen
    return { screens: count, fullscreen: false, blocked: true };
  }
  ensureStage();
  return { screens: count, fullscreen: true };
});
ipcMain.handle('coach:stage-show', (_evt, msg) => {
  lastStageMsg = msg;
  const w = ensureStage();
  try { if (w) w.webContents.send('coach:stage-msg', msg); } catch {}
  return true;
});
ipcMain.handle('coach:stage-close', () => {
  try { if (stageWin && !stageWin.isDestroyed()) stageWin.close(); } catch {}
  stageWin = null;
  return true;
});

// ---- Windows display-mode choreography (extends projector automatically) ----
// Launch:   2nd display detected → switch Windows to Extend, open the stage.
// Plug in:  a display is added while running → Extend + open stage (or re-seat).
// Unplug:   last display removed → close the stage + "Connect Second Screen".
// Quit:     back to Duplicate (only when this app switched to Extend itself).
function setDisplayMode(mode) {
  try {
    const { execFile } = require('child_process');
    // displayswitch.exe ships with Windows: /extend = Extend, /clone = Duplicate
    execFile('displayswitch.exe', [mode === 'extend' ? '/extend' : '/clone'],
      { windowsHide: true }, () => {});
  } catch { /* not Windows / blocked */ }
}
function notifyConnect(connected) {
  try { if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.send('coach:connect-screen', { connected: !!connected }); } catch {}
}
function reseatStage() {
  try {
    if (!stageWin || stageWin.isDestroyed()) return;
    const d = targetDisplay();
    stageWin.setBounds({ x: d.bounds.x, y: d.bounds.y, width: d.bounds.width, height: d.bounds.height });
    stageWin.setFullScreen(true);
  } catch {}
}
// Registered AFTER app is ready — `screen` throws before that, and a silent
// catch here would disable the whole flow (that's how the stage ended up
// opening fullscreen over the teacher's only display).
// Windows Duplicate mode reports ONE logical display, so Electron thinks
// there is no projector even when one is wired. WMI counts PHYSICAL
// monitors — >1 means "hardware there, mode wrong" → switch to Extend.
function physicalMonitorCount() {
  return new Promise((res) => {
    try {
      const { execFile } = require('child_process');
      execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
        '(Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorBasicDisplayParams | Where-Object { $_.Active } | Measure-Object).Count'],
        { windowsHide: true, timeout: 9000 }, (err, stdout) => {
          const n = parseInt(String(stdout || '').trim(), 10);
          res(isFinite(n) && n > 0 ? n : 0);
        });
    } catch { res(0); }
  });
}
function afterScreensAppear(cb) {
  // After displayswitch /extend Windows needs a moment; poll until Electron
  // sees 2 logical displays (~8s max — else the banner/silent path applies).
  let tries = 40;
  const tick = () => {
    if (screen.getAllDisplays().length >= 2) { try { cb(); } catch {} return; }
    if (--tries <= 0) return;
    setTimeout(tick, 200);
  };
  tick();
}
function setupDisplayFlow() {
  // On launch: 2+ displays → Extend + auto-start the stage (it shows
  // LOADING.... until the class is picked). Small delay lets Extend settle.
  try {
    if (screen.getAllDisplays().length >= 2) {
      weExtended = true;
      setDisplayMode('extend');
      setTimeout(() => { try { ensureStage(); } catch {} }, 1800);
    } else {
      // Duplicate mode: monitors exist but Electron sees one display → Extend.
      physicalMonitorCount().then((n) => {
        if (n >= 2) {
          weExtended = true;
          setDisplayMode('extend');
          afterScreensAppear(() => { try { ensureStage(); } catch {} });
        } else {
          notifyConnect(false); // "Connect Second Screen" banner
        }
      }).catch(() => notifyConnect(false));
    }
  } catch {}
  try {
    screen.on('display-added', () => {
      try {
        if (screen.getAllDisplays().length >= 2) { weExtended = true; setDisplayMode('extend'); }
        notifyConnect(screen.getAllDisplays().length >= 2);
        // Stage not open yet (opened before the projector was)? Open it now.
        if (!stageWin || stageWin.isDestroyed()) { ensureStage(); return; }
        reseatStage();
      } catch {}
    });
    screen.on('display-removed', () => {
      try {
        // Careful: extend↔duplicate transitions also look like display removal.
        // Only close the stage when no second MONITOR is physically there.
        physicalMonitorCount().then((n) => {
          try {
            if (screen.getAllDisplays().length < 2 && n < 2) {
              notifyConnect(false);
              try { if (stageWin && !stageWin.isDestroyed()) stageWin.close(); } catch {}
              stageWin = null;
              return;
            }
            reseatStage();
          } catch {}
        }).catch(() => { try { reseatStage(); } catch {} });
      } catch {}
    });
  } catch {}
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

// Real file path -> file:// URL for the stage. Chromium's PDF viewer renders
// file:// URLs natively but blank-screens on huge data: URLs, so books load
// from disk. Only files inside the app's own data folder are allowed.
ipcMain.handle('coach:path-url', (_evt, fullPath) => {
  try {
    const full = path.resolve(String(fullPath));
    const base = path.resolve(app.getPath('userData'));
    if (!full.startsWith(base)) return '';
    if (!fs.existsSync(full)) return '';
    return pathToFileURL(full).href;
  } catch { return ''; }
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

// ---- updates from GitHub Releases (only when installed, not in dev) ----
// Flow the teacher sees: auto-detect → "Update vX" button → click to download
// with live progress → "Restart to update" installs it. Nothing is silent.
function setupAutoUpdate() {
  if (!app.isPackaged) return; // skip in `npm start`
  try {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.autoDownload = false; // user presses Download so progress is visible
    autoUpdater.allowPrerelease = false;
    const send = (event, data) => {
      try { if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.send('coach:update-status', { event, data: data || {} }); } catch {}
    };
    autoUpdater.on('checking-for-update', () => send('checking'));
    autoUpdater.on('update-available', (info) => send('available', { version: info && info.version }));
    autoUpdater.on('update-not-available', (info) => send('none', { version: info && info.version }));
    autoUpdater.on('download-progress', (p) => send('progress', {
      percent: Math.round(p.percent || 0),
      transferred: p.transferred || 0, total: p.total || 0,
      bytesPerSecond: Math.round(p.bytesPerSecond || 0)
    }));
    autoUpdater.on('update-downloaded', (info) => send('downloaded', { version: info && info.version }));
    autoUpdater.on('error', (err) => send('error', { message: String((err && err.message) || err).slice(0, 220) }));
    ipcMain.handle('coach:check-updates', async () => {
      try { await autoUpdater.checkForUpdates(); return true; }
      catch (e) { send('error', { message: String((e && e.message) || e).slice(0, 220) }); return false; }
    });
    ipcMain.handle('coach:start-download', async () => {
      try { await autoUpdater.downloadUpdate(); return true; }
      catch (e) { send('error', { message: String((e && e.message) || e).slice(0, 220) }); return false; }
    });
    ipcMain.handle('coach:quit-and-install', () => { try { autoUpdater.quitAndInstall(false, true); } catch {} });
    ipcMain.handle('coach:app-version', () => app.getVersion());
    // detect on launch (delayed so the window is up) + every 6 hours
    setTimeout(() => { autoUpdater.checkForUpdates().catch(() => {}); }, 12000);
    setInterval(() => { autoUpdater.checkForUpdates().catch(() => {}); }, 6 * 60 * 60 * 1000);
  } catch { /* electron-updater not available */ }
}

app.whenReady().then(() => {
  createMainWindow();
  setupDisplayFlow();
  setupAutoUpdate();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createMainWindow(); });
});

app.on('before-quit', () => {
  // Closing the app returns Windows to Duplicate mode (when we switched it),
  // and the stage window goes away with everything else.
  try { if (weExtended) setDisplayMode('clone'); } catch {}
  try { if (stageWin && !stageWin.isDestroyed()) stageWin.close(); } catch {}
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
