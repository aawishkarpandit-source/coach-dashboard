/* Coach Dashboard — Supabase cloud sync (optional, local-first).
   - Works with ZERO config: app runs fully offline on localStorage/IndexedDB.
   - When a teacher pastes Supabase URL + anon key (⚙ Sync button) AND the
     computer is online, students / marks / book catalogue mirror to the cloud,
     so ANY installed computer sees the same data.
   - Presentations are NEVER uploaded (saved locally by design).
   - Plain index.html in a browser works too (CDN ESM import, fails soft offline).
*/
'use strict';
(function () {
  const LS_KEY = 'coach-supabase';
  const EVT = 'coach:sync';
  let client = null;
  let state = 'local'; // local | syncing | cloud | error
  let pushTimer = null;

  function emit(info) { window.dispatchEvent(new CustomEvent(EVT, { detail: info || {} })); }
  function setState(s, msg) {
    state = s; emit({ state: s, msg });
    const b = document.querySelector('#syncBadge');
    if (b) {
      b.dataset.sync = s;
      b.title = msg || ('Sync: ' + s);
      const label = { local: '☁ local', syncing: '☁ syncing…', cloud: '☁ cloud ✓', error: '☁ error' }[s] || s;
      const span = b.querySelector('span');
      if (span) span.textContent = label;
      b.style.background = s === 'cloud' ? '#ecfdf5' : s === 'syncing' ? '#fffbeb' : s === 'error' ? '#fef2f2' : '#f1f5f9';
    }
  }

  function getConfig() {
    try {
      if (window.__SUPABASE__ && window.__SUPABASE__.url) return window.__SUPABASE__;
      return JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    } catch { return null; }
  }

  async function getClient() {
    if (client) return client;
    const cfg = getConfig();
    if (!cfg || !cfg.url || !cfg.anonKey) { setState('local'); return null; }
    if (!navigator.onLine) { setState('local', 'offline — local only'); return null; }
    try {
      setState('syncing', 'connecting…');
      // Prefer bundled npm package when running under Electron/Bundler, else CDN.
      let createClient = null;
      try {
        const mod = await import('@supabase/supabase-js');
        createClient = mod.createClient;
      } catch {
        const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        createClient = mod.createClient;
      }
      client = createClient(cfg.url, cfg.anonKey);
      setState('cloud', 'connected');
      return client;
    } catch (err) {
      setState('error', 'connect failed — local only');
      return null;
    }
  }

  function schedulePush(fn) {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => { fn && fn().catch(() => setState('error')); }, 1200);
  }

  const SB = {
    get state() { return state; },
    get configured() { const c = getConfig(); return !!(c && c.url && c.anonKey); },
    on(evt, cb) { if (evt === 'sync') window.addEventListener(EVT, (e) => cb(e.detail)); },
    async ready() { return !!(await getClient()); },

    async configure(url, anonKey) {
      localStorage.setItem(LS_KEY, JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() }));
      client = null;
      await getClient();
      await SB.pullAll();
    },
    forget() { localStorage.removeItem(LS_KEY); client = null; setState('local'); },
    async deleteStudent(cls, roll) {
      // Hard-delete (student + marks) so a deleted student never resurrects on next pull.
      const sb = await getClient(); if (!sb) return false;
      try {
        setState('syncing');
        await sb.from('marks').delete().match({ class: cls, roll: Number(roll) });
        await sb.from('students').delete().match({ class: cls, roll: Number(roll) });
        setState('cloud');
        return true;
      } catch { setState('error'); return false; }
    },

    // ---- writes (called by app.js store; debounced, fire-and-forget) ----
    pushStudents(allStudents) {
      schedulePush(async () => {
        const sb = await getClient(); if (!sb) return;
        setState('syncing');
        const rows = allStudents.map((s) => ({ class: s.cls, roll: s.roll, name: s.name, updated_at: new Date().toISOString() }));
        for (const r of rows) await sb.from('students').upsert(r, { onConflict: 'class,roll' });
        setState('cloud');
      });
    },
    pushMarks(cls, roll, marksObj) {
      schedulePush(async () => {
        const sb = await getClient(); if (!sb) return;
        setState('syncing');
        for (const [subject, score] of Object.entries(marksObj)) {
          await sb.from('marks').upsert(
            { class: cls, roll: Number(roll), subject, score: Number(score) || 0, updated_at: new Date().toISOString() },
            { onConflict: 'class,roll,subject' });
        }
        setState('cloud');
      });
    },
    pushBookMeta(rec) {
      // rec: {title,titleNe,class,type,fileName}
      schedulePush(async () => {
        const sb = await getClient(); if (!sb) return;
        setState('syncing');
        await sb.from('book_meta').upsert({
          title: rec.title, title_ne: rec.titleNe || '', class: rec.class || 'all',
          type: rec.type || 'govt', file_path: rec.fileName,
          updated_at: new Date().toISOString()
        }, { onConflict: 'file_path' });
        setState('cloud');
      });
    },
    async uploadBookFile(fileName, blob) {
      const sb = await getClient(); if (!sb) return false;
      const { error } = await sb.storage.from('books').upload(fileName, blob, { upsert: true, contentType: 'application/pdf' });
      return !error;
    },
    bookPublicUrl(fileName) {
      if (!client) return null;
      try { return client.storage.from('books').getPublicUrl(fileName).data.publicUrl; } catch { return null; }
    },

    // ---- read: merge cloud → local (local wins on conflict-free merge) ----
    async pullAll() {
      const sb = await getClient(); if (!sb) return null;
      setState('syncing');
      try {
        const [{ data: students }, { data: marks }, { data: books }] = await Promise.all([
          sb.from('students').select('class,roll,name'),
          sb.from('marks').select('class,roll,subject,score'),
          sb.from('book_meta').select('title,title_ne,class,type,file_path')
        ]);
        setState('cloud');
        return { students: students || [], marks: marks || [], books: books || [] };
      } catch { setState('error'); return null; }
    }
  };

  window.SB = SB;
  window.addEventListener('online', () => { if (SB.configured) SB.pullAll().then((d) => d && window.dispatchEvent(new CustomEvent('coach:cloud-pull', { detail: d }))); });
})();
