/* Coach Dashboard — unified 2nd-screen stage bus.
   ONE window ('coach-stage' → presenter.html) shows BOTH books and
   presentations. Idle = white "Welcome" + green "Class X" pill.
   Teacher window drives it via postMessage (+ localStorage fallback for metadata).
   Files go across as Blob objects (structured clone) — the stage creates its
   own object URL. No giant dataURL strings, no size limits.
*/
'use strict';
(function () {
  const WIN_NAME = 'coach-stage';
  let win = null;
  let mode = 'idle'; // idle | content
  let lastMsg = null;
  let lastType = 'welcome';

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
    try { if (win && !win.closed) win.postMessage(full, '*'); } catch {}
  }

  const Stage = {
    get mode() { return mode; },
    get lastType() { return lastType; },
    open() {
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
    clear() { this.welcome(); },
    close() { try { win && win.close(); } catch {} win = null; mode = 'idle'; }
  };

  window.Stage = Stage;
})();
