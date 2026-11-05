# Coach Dashboard (classroom software — installable, cloud-synced)

Teacher control window + student 2nd-screen window from **one install**.

## 1. Run / install

**Try without installing:** double-click `index.html` (works offline, data stays in that browser).

**Dev run:** `npm install` → `npm start`

**Build the installer (on your computer):** `npm run dist:win` → `release/Coach Dashboard Setup X.exe` — the one file schools need.

## 2. Push updates through GitHub (auto-update)

1. Create a GitHub repo, push this folder, and set the repo in `package.json` → `build.publish` (`owner` + `repo`).
2. Bump `"version"` in `package.json` (e.g. `1.0.0` → `1.0.1`).
3. Tag & push: `git tag v1.0.1 && git push origin v1.0.1` — the workflow in `.github/workflows/release.yml` builds the `.exe` and attaches it to the GitHub Release.
4. School computers with internet pick it up automatically: the app detects the new release, shows an **Update** button, downloads with a live progress bar, then offers **Restart to update** (About page also shows the installed version + a manual check button).

## 3. Cloud (Supabase) — students, marks, books on every computer

Presentations are **never** uploaded — they stay on each computer by design.
1. Create a free project at supabase.com → SQL Editor → run `supabase/schema.sql` (creates `students`, `marks`, `book_meta`, `books` storage bucket).
2. Copy Project URL + `anon` public key (Project Settings → API). Either:
   - put them in `.env` (copy from `.env.example`), or
   - open the installed app → **⚙ Sync** → paste → **Connect & Sync** (stored per computer).
   (This copy ships pre-configured with the school project — skip this unless keys rotate.)
3. From then on: adding a student, entering marks, or importing a book mirrors to the cloud (☁ badge: `local` → `syncing…` → `cloud ✓`). Other installed computers pull it within seconds of coming online. Deletes propagate too (student/book + their marks/files are hard-deleted everywhere, with tombstones so nothing resurrects).
4. Imported book PDFs also upload to the `books` bucket, so other computers get them as ☁ cards — spotted books auto-download in the background and become offline 📗 entries.

## 3b. Backup & restore (top-bar 💾 button)

- **Export** packs students, theory/practical marks, subject full-marks, books (+PDF files), presentations (+files), and settings into one `coach-backup-<date>.json` (kept wherever you save it — USB, Drive, etc).
- **Import** replaces this computer's data with the file, repaints every page, and pushes the restored state to the cloud. Cloud book files are not re-uploaded (already there). Badly-formed entries are skipped, never crash the restore.

## 3c. Exams: theory + practical (custom full marks)

- Every subject has **Theory** and **Practical** inputs with per-subject full marks (default 75 + 25, stored per PC).
- Totals = Th + Pr; percent = total ÷ configured full. Cloud sync (`Subject::TH` / `::PR` rows, per exam) follows. Old single-number marks count as theory; cleared cells stay cleared across syncs.

## 4. 2nd screen (projector/TV)

- **Installed app does the display setup itself:**
  - On launch it counts **physical** monitors (handles Windows **Duplicate** mode, where Electron sees only one display): projector/TV wired → switches to **Extend** and opens the fullscreen stage automatically. No F11, no settings hunting.
  - While the app runs: plug in a display → Extend + the stage opens by itself; unplug it → the stage closes.
  - Closing the app returns Windows to **Duplicate** (only if the app had switched to Extend itself).
- **Stage states:** fresh launch until the class is picked → **LOADING....** → after picking, **Welcome + green Class pill** → any content (book/present/marks/notes) replaces it, and closing the reader returns to Welcome.
- **Books, presentations AND the marksheet share the SAME stage window** — one stage for everything.
- **Plain browser:** best-effort window — drag it to the projector and press F11.
- **No second display detected?** The main window shows a yellow **Connect Second Screen** banner until one is connected.
- **One sound at a time (videos):** with the stage open, the teacher's preview player is silent — the students' screen carries the audio. The volume slider on the main screen still controls the **stage** volume, and closing the stage returns sound to the preview.
- **Full-screen main window:** the control window starts full-screen too (F11 exits); a **✕ Close stage** button sits next to **🖥️ 2nd Screen** — closing the stage quits the app (display mode returns to Duplicate).
- Teacher changes pages/slides on the main screen; students see only the open content — no controls.

## 5. Local files & presentations

- **PowerPoint (.pptx):** renders fully **offline in the browser** — no PowerPoint needed, works in the installed app AND plain `index.html`. Slides (text, shapes, images, tables, charts, SmartArt) show on your screen + the 2nd-screen stage with ◀ ▶ page turns. The original file is kept under “Saved on this computer” as 📊 and re-renders on demand. Engine: vendored `js/vendor/pptx-renderer.js` (Apache-2.0 `@aiden0z/pptx-renderer`, rebuilt via `npm run vendor:pptx`), loaded lazily on first use. Old `.ppt` files: Save As `.pptx` first. Fidelity note: complex animations/transitions don't carry over (static slides); fancy embedded fonts fall back to system fonts on the 2nd screen.
- **Present page:** one **＋ New presentation** button opens the file window (images, video, PDF, `.pptx` — all offline, stage opens by itself). ◀ Prev / Next ▶ turn slides on both screens.
- **Google Slides / web links:** supported in the engine if you re-add a link button; stock build is offline-first.
- **Other presentations:** chosen files + PowerPoint records save on the computer (browser IndexedDB; installed app also copies real files to its data folder → “Saved on this computer” list to reopen/delete). Re-installs on the same machine keep them.
- **Books:** **Import Book** saves the PDF in the browser + (installed app) as a real file in the app's books folder — same pattern as presentations. Cloud copy included. Delete removes all of them. On the 2nd screen the stage loads the **real file from disk** (the installed app), so PDFs page-turn reliably offline.
- **Notes:** full blank pages with rich text (bold/italic/headings/lists/colors/links). Saved in the browser forever, renameable files, included in Backup. **Show on 2nd screen** displays text-only (no editing controls there); keeps following while shown.
- **Class picker:** a centered popup asks "Which class are you in?" **every time the app opens** — dropdown mirrors the topbar class list; your pick filters books/marksheets and updates the stage pill.

## 3d. Teacher accounts (sign-in)

- Accounts come from the school's Supabase (Supabase → Authentication). Run `supabase/migrate-auth.sql` once — it creates the `coach_users` **uuid → name** table that feeds the "Hello, {name}" line.
- The app **asks for email + password** on first open, after every app update, and after **Sign out** (button on the About/Team pages). Signed-in teachers skip straight to the class picker; the greeting shows **Hello, {name}** (name from `coach_users`, editable with `update public.coach_users set name = '...'`).
- **Continue as Guest:** a 👥 button on the lock screen opens the app without signing in — books still open to read (the cloud catalogue too when online), but **Import/Delete buttons are hidden** and the greeting says **Hello, Guest**. Guest machines keep working in guest mode after a restart; signing in returns everything.

## 6. How to edit

1. **Classes** – `<select id="classSelect">` in `index.html` (the launch popup mirrors this list automatically).
2. **New page** – copy a `<section id="page-xxx" class="page">` block, link with `<button data-goto="xxx">`.
3. **Books** – drop PDFs in `/books/`, add rows in `data/books.json` (`class`: `9`/`10`/`9A`/`all`, `type`: `govt`/`pvt`).
4. **Subjects & exams** – defaults live in `js/app.js` (`DEFAULT_SUBJECTS`, default Exam 1); per-PC overrides persist in localStorage. **Language** – `I18N` in `js/app.js` + `data-i18n`.
5. **Stage idle screen** – `presenter.html`. **Stage logic** – `js/stage.js`. **Cloud** – `js/supabase.js`.
