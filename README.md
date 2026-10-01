# Coach Dashboard (classroom software — installable, cloud-synced)

Teacher control window + student 2nd-screen window from **one install**.

## 1. Run / install

**Try without installing:** double-click `index.html` (works offline, data stays in that browser).

**Dev run:** `npm install` → `npm start`

**Build the installer (on your computer):** `npm run dist:win` → installers appear in `release/`:
- `Coach Dashboard Setup 1.0.0.exe` — give this to schools
- `Coach Dashboard 1.0.0 portable.exe` — no-install stick version

## 2. Push updates through GitHub (auto-update)

1. Create a GitHub repo, push this folder, and set the repo in `package.json` → `build.publish` (`owner` + `repo`).
2. Bump `"version"` in `package.json` (e.g. `1.0.0` → `1.0.1`).
3. Tag & push: `git tag v1.0.1 && git push origin v1.0.1` — the workflow in `.github/workflows/release.yml` builds the `.exe` and attaches it to the GitHub Release.
4. School computers with internet pick it up automatically (green “Restart to update” bar).

## 3. Cloud (Supabase) — students, marks, books on every computer

Presentations are **never** uploaded — they stay on each computer by design.

1. Create a free project at supabase.com → SQL Editor → run `supabase/schema.sql` (creates `students`, `marks`, `book_meta`, `books` storage bucket).
2. Copy Project URL + `anon` public key (Project Settings → API). Either:
   - put them in `.env` (copy from `.env.example`), or
   - open the installed app → **⚙ Sync** → paste → **Connect & Sync** (stored per computer).
   (This copy ships pre-configured with the school project — skip this unless keys rotate.)
3. From then on: adding a student, entering marks, or importing a book mirrors to the cloud (☁ badge: `local` → `syncing…` → `cloud ✓`). Other installed computers pull it within seconds of coming online.
4. Imported book PDFs also upload to the `books` bucket, so other computers get them as ☁ cards — spotted books auto-download in the background and become offline 📗 entries.

## 4. 2nd screen (projector/TV)

- Extend display in Windows, then press **🖥️ 2nd Screen** (top bar).
- **Idle:** white background, **Welcome** centered, green rectangle below with white text **Class 9A** (follows the class dropdown).
- **Books and presentations share the SAME stage window** — opening either replaces what's shown; **■ Welcome** (or closing the reader) returns to idle.
- Teacher changes pages/slides on the main screen; students see only the open page — no controls.

## 5. Local files & presentations

- **PowerPoint (.pptx):** renders fully **offline in the browser** — no PowerPoint needed, works in the installed app AND plain `index.html`. Slides (text, shapes, images, tables, charts, SmartArt) show on your screen + the 2nd-screen stage with ◀ ▶ page turns. The original file is kept under “Saved on this computer” as 📊 and re-renders on demand. Engine: vendored `js/vendor/pptx-renderer.js` (Apache-2.0 `@aiden0z/pptx-renderer`, rebuilt via `npm run vendor:pptx`), loaded lazily on first use. Old `.ppt` files: Save As `.pptx` first. Fidelity note: complex animations/transitions don't carry over (static slides); fancy embedded fonts fall back to system fonts on the 2nd screen.
- **Google Slides / web links:** 🔗 Link button pastes a publish/embed `https://` link; shows on teacher preview + stage (needs internet).
- **Other presentations:** chosen files + PowerPoint records save on the computer (browser IndexedDB; installed app also copies real files to its data folder → “Saved on this computer” list to reopen/delete). Re-installs on the same machine keep them.
- **Books:** `/books/*.pdf` + `data/books.json` ship with the app; **Import Book** writes a real file into `/books` when the folder is linked (Chrome/Edge) and always keeps a browser copy + cloud copy.

## 6. How to edit

1. **Classes** – `<select id="classSelect">` in `index.html`.
2. **New page** – copy a `<section id="page-xxx" class="page">` block, link with `<button data-goto="xxx">`.
3. **Books** – drop PDFs in `/books/`, add rows in `data/books.json` (`class`: `9`/`10`/`9A`/`all`, `type`: `govt`/`pvt`).
4. **Subjects** – `SUBJECTS` in `js/app.js`. **Language** – `I18N` in `js/app.js` + `data-i18n`.
5. **Stage idle screen** – `presenter.html`. **Stage logic** – `js/stage.js`. **Cloud** – `js/supabase.js`.
