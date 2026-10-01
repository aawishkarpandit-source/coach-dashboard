/* Coach Dashboard — offline PPTX slide engine (no PowerPoint needed).
   Wraps the vendored renderer (js/vendor/pptx-renderer.js → window.PptxLib,
   Apache-2.0 @aiden0z/pptx-renderer). Runs 100% locally in the browser/Electron.
   Teacher preview renders live; the 2nd screen gets serialized slide HTML
   (blob images/canvases inlined as dataURLs so they cross windows).
*/
'use strict';
(function () {
  function lib() { return window.PptxLib || null; }
  // The 1.2MB engine loads lazily on first .pptx use (classic script =
  // works on file://, Electron, and plain hosting). Keeps app start fast.
  let libPromise = null;
  function ensureLib() {
    if (lib()) return Promise.resolve(lib());
    if (!libPromise) libPromise = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'js/vendor/pptx-renderer.js';
      s.onload = () => (lib() ? res(lib()) : rej(new Error('engine failed to start')));
      s.onerror = () => rej(new Error('engine file missing'));
      document.head.appendChild(s);
    });
    return libPromise;
  }

  function blobToDataUrl(blob) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  }
  async function inlineMedia(root) {
    const els = root.querySelectorAll('img[src^="blob:"], video[src^="blob:"], audio[src^="blob:"], source[src^="blob:"]');
    await Promise.all([...els].map(async (el) => {
      try {
        const b = await (await fetch(el.getAttribute('src'))).blob();
        el.setAttribute('src', await blobToDataUrl(b));
      } catch { /* keep original reference */ }
    }));
    // Canvases (charts) don't survive outerHTML — bake them into <img>.
    root.querySelectorAll('canvas').forEach((c) => {
      try {
        const img = document.createElement('img');
        img.setAttribute('src', c.toDataURL('image/png'));
        img.setAttribute('style', 'width:100%;height:100%;display:block');
        c.replaceWith(img);
      } catch { /* keep canvas */ }
    });
  }
  const raf2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const CoachPptx = {
    available() { return !!(lib() && lib().PptxViewer); },

    // Parse + render first slide into container. Returns deck handle.
    async open(arrayBuffer, container) {
      const L = await ensureLib();
      container.innerHTML = '';
      const viewer = new L.PptxViewer(container, {
        fitMode: 'contain',
        zipLimits: L.RECOMMENDED_ZIP_LIMITS,
        pdfjs: false // no external pdf.js; EMF-PDF fallbacks simply skip
      });
      await viewer.open(arrayBuffer, { renderMode: 'slide' });
      await raf2();
      return { viewer, count: viewer.slideCount || 0 };
    },
    async goTo(deck, i) {
      if (!deck) return;
      await deck.viewer.goToSlide(i);
      await raf2(); // let charts/canvases finish painting
    },
    // Serialize the currently rendered slide for the stage window.
    async slideHtml(deck, container) {
      const root = container && container.firstElementChild;
      if (!root) throw new Error('no slide rendered');
      const w = root.offsetWidth || root.scrollWidth || 1280;
      const h = root.offsetHeight || root.scrollHeight || 720;
      const clone = root.cloneNode(true);
      clone.removeAttribute('id');
      await inlineMedia(clone);
      return { html: clone.outerHTML, w, h };
    },
    close(deck) { try { deck && deck.viewer && deck.viewer.destroy(); } catch {} }
  };

  window.CoachPptx = CoachPptx;
})();
