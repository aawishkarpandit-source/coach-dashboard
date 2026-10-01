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

  function rawSend(msg) {
    lastMsg = msg;
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
    open() {
      if (!win || win.closed) {
        win = window.open('presenter.html', WIN_NAME, 'width=1280,height=800');
        if (!win && window.toast) window.toast('Popup blocked — allow popups for the 2nd screen.');
        // re-send last content (or welcome) once it loads
        setTimeout(() => rawSend(lastMsg || { type: 'welcome', className: Stage.currentClass() }), 600);
        Stage.moveToSecond();
      } else { try { win.focus(); } catch {} }
      return win;
    },
    async moveToSecond() {
      try {
        if (window.getScreenDetails) {
          const d = await window.getScreenDetails();
          const second = d.screens.find((s) => !s.isPrimary) || d.screens[1];
          if (second && win && !win.closed) { try { win.moveTo(second.availLeft + 20, second.availTop + 20); } catch {} return true; }
        }
      } catch {}
      return false;
    },
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
    clear() { this.welcome(); },
    close() { try { win && win.close(); } catch {} win = null; mode = 'idle'; }
  };

  window.Stage = Stage;
})();
