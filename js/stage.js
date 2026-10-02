/* Coach Dashboard — unified 2nd-screen stage bus.
   ONE stage shows books, presentations, decks and marksheets.
   Idle = white "Welcome" + green "Class X" pill.
   Transport:
   - Installed app (Electron): a REAL fullscreen window pinned to the 2nd
     display (main process owns it — automatic fullscreen, no popups).
     Blobs are converted to dataURLs because object URLs don't cross IPC.
   - Plain browser: window.open + postMessage (+ localStorage metadata
     fallback). Files go across as Blob objects (structured clone).
*/
'use strict';
(function () {
  const WIN_NAME = 'coach-stage';
  const ELEC = (window.electron && window.electron.stageOpen) ? window.electron : null;
  let win = null;
  let mode = 'idle'; // idle | content
  let lastMsg = null;
  let lastType = 'welcome';

  function blobToDataUrl(blob) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  }
  function rawSend(msg) {
    lastMsg = msg;
    lastType = (msg && msg.type) || 'welcome';
    const full = Object.assign({ __coachStage: true, _t: Date.now() }, msg);
    try { localStorage.setItem('coach-class', msg.className || localStorage.getItem('coach-class') || '9A'); } catch {}
    // localStorage fallback: metadata ONLY (no blobs, no huge urls — they can't be stored)
    try {
      const lite = Object.assign({}, full);
      delete lite.blob;
      delete lite.html; // slide HTML travels by postMessage only (too big to store)
      delete lite.slides;
      if (typeof lite.url !== 'string' || lite.url.length >= 200000) delete lite.url;
      localStorage.setItem('coach-stage-msg', JSON.stringify(lite));
    } catch {}
    if (ELEC) {
      // Installed app: forward to the auto-fullscreen stage window.
      if (full.blob instanceof Blob) {
        blobToDataUrl(full.blob).then((du) => {
          const copy = Object.assign({}, full, { url: du });
          delete copy.blob;
          try { ELEC.stageShow(copy); } catch {}
        }).catch(() => {});
      } else {
        try { ELEC.stageShow(full); } catch {}
      }
    }
    try { if (win && !win.closed) win.postMessage(full, '*'); } catch {}
  }

  const Stage = {
    get mode() { return mode; },
    get lastType() { return lastType; },
    open() {
      // Installed app: main process opens a true fullscreen window on the
      // 2nd display automatically (also re-seats it if displays change).
      if (ELEC) {
        ELEC.stageOpen().then((info) => {
          try {
            const badge = document.querySelector('#screenInfo');
            if (badge && info && info.screens) badge.textContent = info.screens + (info.screens > 1 ? ' screens (stage fullscreen ✓)' : ' screen');
          } catch {}
          if ((!info || info.screens < 2) && window.toast) window.toast('Only 1 display — connect the projector (Extend) for auto-fullscreen.');
        }).catch(() => {});
        return null;
      }
      if (!win || win.closed) {
        win = window.open('presenter.html', WIN_NAME, 'width=1280,height=800');
        if (!win && window.toast) window.toast('Popup blocked — allow popups for the 2nd screen.');
        // re-send last content (or welcome) once it loads
        setTimeout(() => rawSend(lastMsg || { type: 'welcome', className: Stage.currentClass() }), 600);
        Stage.placeOnSecond().then((n) => {
          try {
            const badge = document.querySelector('#screenInfo');
            if (badge && n) badge.textContent = n + (n > 1 ? ' screens' : ' screen');
          } catch {}
          if (!n && window.toast) window.toast('Drag the stage window to the projector/TV, then press F11.');
        });
      } else { try { win.focus(); } catch {} }
      return win;
    },
    // Opens the stage, moves it to the 2nd display, fills that screen and
    // attempts true fullscreen (the "F11 already done" part — browsers may
    // refuse without a gesture there, in which case the filled window stands).
    async placeOnSecond() {
      try {
        if (window.getScreenDetails) {
          const d = await window.getScreenDetails();
          const second = d.screens.find((s) => !s.isPrimary) || d.screens[1];
          if (second && win && !win.closed) {
            try { win.moveTo(second.availLeft, second.availTop); } catch {}
            try { win.resizeTo(second.availWidth, second.availHeight); } catch {}
            try {
              const el = win.document && win.document.documentElement;
              if (el && el.requestFullscreen) { const p = el.requestFullscreen(); if (p && p.catch) p.catch(() => {}); }
            } catch {}
            return d.screens.length;
          }
          return d.screens.length;
        }
      } catch {}
      return 0;
    },
    async moveToSecond() { await this.placeOnSecond(); return false; },
    currentClass() {
      const el = document.querySelector('#classSelect');
      return (el && el.value) || localStorage.getItem('coach-class') || '9A';
    },
    welcome() {
      mode = 'idle';
      this.open();
      rawSend({ type: 'welcome', className: this.currentClass() });
    },
    refreshWelcome() { if (mode === 'idle') rawSend({ type: 'welcome', className: this.currentClass() }); },
    // src may be a URL string OR a Blob/File — Blobs travel via postMessage natively.
    showPdf(src, page, title) {
      mode = 'content';
      this.open();
      const m = { type: 'pdf', page: page || 1, title: title || '', className: this.currentClass() };
      if (src instanceof Blob) m.blob = src; else m.url = src || '';
      rawSend(m);
    },
    updatePdfPage(src, page) {
      if (mode !== 'content') return;
      const m = { type: 'pdf', page: page || 1, className: this.currentClass() };
      if (src instanceof Blob) m.blob = src; else m.url = src || '';
      rawSend(m);
    },
    showImage(src) {
      mode = 'content';
      this.open();
      const m = { type: 'image', className: this.currentClass() };
      if (src instanceof Blob) m.blob = src; else m.url = src || '';
      rawSend(m);
    },
    showVideo(src) {
      mode = 'content';
      this.open();
      const m = { type: 'video', className: this.currentClass() };
      if (src instanceof Blob) m.blob = src; else m.url = src || '';
      rawSend(m);
    },
    // Teacher's player is the master: every play/pause/seek/volume/rate
    // change (plus a drift-correction tick) forwards here.
    videoState(s) {
      if (mode !== 'content') return;
      rawSend({ type: 'video-sync', time: s.time || 0, paused: !!s.paused,
        rate: s.rate || 1, volume: (s.volume == null ? 1 : s.volume),
        muted: !!s.muted, className: this.currentClass() });
    },
    // Web embeds (Google Slides publish/embed links, etc). Needs internet.
    showUrl(url, title) {
      mode = 'content';
      this.open();
      rawSend({ type: 'embed', url: url || '', title: title || '', className: this.currentClass() });
    },
    // Offline PPTX slide (serialized HTML from CoachPptx). Same window as all media.
    showDeckHtml(d) {
      mode = 'content';
      this.open();
      rawSend({ type: 'deck', html: d.html || '', w: d.w || 1280, h: d.h || 720,
        idx: d.idx || 0, count: d.count || 0, title: d.title || '', className: this.currentClass() });
    },
    // Class marksheet snapshot for the 2nd screen (white results table).
    showMarks(payload) {
      mode = 'content';
      this.open();
      rawSend({ type: 'marks', title: payload.title || '', rows: payload.rows || [],
        className: this.currentClass() });
    },
    // Teacher note: read-only text page, no editing controls on the stage.
    showNotes(payload) {
      mode = 'content';
      this.open();
      rawSend({ type: 'notes', title: payload.title || '', html: payload.html || '',
        className: this.currentClass() });
    },
    clear() { this.welcome(); },
    close() {
      if (ELEC) { try { ELEC.stageClose(); } catch {} mode = 'idle'; return; }
      try { win && win.close(); } catch {} win = null; mode = 'idle';
    }
  };

  window.Stage = Stage;
})();
