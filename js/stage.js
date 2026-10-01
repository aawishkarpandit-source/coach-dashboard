/* Coach Dashboard — unified 2nd-screen stage bus.
   ONE window ('coach-stage' → presenter.html) shows BOTH books and
   presentations. Idle = white "Welcome" + green "Class X" pill.
   Teacher window drives it via postMessage (+ localStorage fallback).
   Blob/dataURL aware: pass {url} OR {blob}; blobs become dataURLs so the
   stage works even across file:// windows where blob: URLs don't transfer.
*/
'use strict';
(function () {
  const WIN_NAME = 'coach-stage';
  let win = null;
  let mode = 'idle'; // idle | content
  let lastMsg = null;

  function blobToDataUrl(blob) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  }
  async function resolveUrl(src) {
    if (!src) return '';
    if (typeof src === 'string') return src;
    if (src instanceof Blob) return blobToDataUrl(src); // cross-window safe
    return '';
  }
  function rawSend(msg) {
    lastMsg = msg;
    const full = Object.assign({ __coachStage: true, _t: Date.now() }, msg);
    try { localStorage.setItem('coach-class', msg.className || localStorage.getItem('coach-class') || '9A'); } catch {}
    try { localStorage.setItem('coach-stage-msg', JSON.stringify(typeof full.url === 'string' && full.url.length < 200000 ? full : Object.assign({}, full, { url: full.url }))); } catch {}
    try { win && !win.closed && win.postMessage(full, '*'); } catch {}
  }

  const Stage = {
    get mode() { return mode; },
    open() {
      if (!win || win.closed) {
        win = window.open('presenter.html', WIN_NAME, 'width=1280,height=800');
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
    async showPdf(src, page, title) {
      mode = 'content';
      this.open();
      rawSend({ type: 'pdf', url: await resolveUrl(src), page: page || 1, title: title || '', className: this.currentClass() });
    },
    async updatePdfPage(src, page) {
      if (mode !== 'content') return;
      rawSend({ type: 'pdf', url: await resolveUrl(src), page: page || 1, className: this.currentClass() });
    },
    async showImage(src) {
      mode = 'content';
      this.open();
      rawSend({ type: 'image', url: await resolveUrl(src), className: this.currentClass() });
    },
    async showVideo(src) {
      mode = 'content';
      this.open();
      rawSend({ type: 'video', url: await resolveUrl(src), className: this.currentClass() });
    },
    clear() { this.welcome(); },
    close() { try { win && win.close(); } catch {} win = null; mode = 'idle'; }
  };

  window.Stage = Stage;
})();
