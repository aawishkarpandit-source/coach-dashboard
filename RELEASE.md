# 🎓 Coach Dashboard v1.2.2 — Official Release

A classroom teaching app **built by a student, for classrooms**. One install gives teachers textbooks, notes, presentations, marks data and a second-screen stage for the projector — online or offline.

## 🎬 in v1.2.2

- **Fixed double audio on video presentations** — the teacher preview now goes silent whenever the stage is open; students' screen carries the sound (volume slider still controls the stage). Close the stage and preview sound returns.
- **Main window is fullscreen by default** (F11 exits).
- **✕ Close stage** button next to 🖥️ 2nd Screen in the top bar.

## 🔧 in v1.2.1

- Terms & Conditions contact links updated to the new **veltriontech.vercel.app** site (contact form + Privacy Policy).

## 📌 fixed in v1.2.0

- **Duplicate mode now switches to Extend** — Windows Duplicate mode reports a single logical display, so the app thought no projector existed. It now counts **physical monitors** (WMI) and switches to Extend + opens the stage whenever a second display is wired.
- **Picking the same class as before now flips the stage** from `LOADING....` to Welcome + Class pill (previously only a *different* pick triggered it).

## 👤 new: teacher accounts

- **Email + password sign-in** (school Supabase) on first open, after every update, and after Sign out — the app locks until you're in (offline computers are never locked out).
- **Hello, {Name}** greeting above the dashboard title — Hello in black, the account's name in green, from the new `coach_users` (uuid → name) table (`supabase/migrate-auth.sql`, run once in SQL Editor).
- **Sign out** button beside the Credits (About page + Team page) — locks the app until the next sign-in with the same or a different account.

## 🐛 fixed in v1.1.2

- **Stage no longer opens fullscreen with no second display** — the launch display logic ran before Electron was ready and silently died, so every launch dropped a fullscreen stage over the teacher's only screen. Now: 1 display → yellow **Connect Second Screen** banner, no stage. 2+ displays → Extend + auto-stage as intended. Plug/unplug now works while teaching, too.

## 🖥️ new in v1.1.1

- **Automatic display mode** — with a projector/TV connected, opening the app switches Windows to **Extend** and starts the fullscreen stage by itself. Closing the app returns to **Duplicate**. Plugging/unplugging while teaching is handled too.
- **Connect Second Screen** — with no second display the app shows a yellow banner so the teacher knows what's missing.
- **LOADING....** — until the class is picked on launch, the stage reads LOADING.... instead of jumping to Welcome; picking the class flips it to Welcome + Class pill.
- Stage now always closes with the main window.

## 🆕 in v1.1.0

- **Class picker on launch** — a centered popup asks "Which class are you in?" with a dropdown every time the app opens (English + नेपाली). Your pick drives books, marksheets and the stage pill, and sticks in the top bar.
- **Books (PDFs) fixed on the 2nd screen** — the stage now loads the real PDF file from the app's books folder instead of a huge data: URL (which Chromium rendered as a blank screen). Imported and cloud books open and page-turn reliably offline.

## 📝 since v1.0.10 (already in but newly tagged here)

- **Notes** — full blank pages, rich formatting (bold/italic/underline/strike, headings, 6 sizes, colors, highlight, lists, alignment, links, undo/redo), autosave, renameable files, saved locally forever, included in Backup, and a read-only "Show on 2nd screen" that keeps following your edits.
- **Visible updater** — detects new releases, shows an Update button, downloads with a live progress bar, then offers Restart to install.
- **Auto-fullscreen stage** on the 2nd Windows display (re-seats when the projector is plugged/unplugged).

---

## ✨ Also inside

- **Marksheets (Subjects & Exams)** — theory + practical with custom full marks per subject; syncs after the one-time Supabase SQL
- **Present** — images, videos, PDFs and PowerPoint (`.pptx`) render fully offline, page turns mirrored to the projector
- **Cloud sync + auto-updates** — data follows the teacher across computers; the app detects new releases itself
- **Backup & Restore** — whole school data in one file
- **About page** — Terms & Conditions and a cinematic Team credits roll 🎬

## 📥 New install (school computer)

1. Download `Coach-Dashboard-Setup-1.2.2.exe` from GitHub Releases
2. Run it → open **Coach Dashboard** → pick your class → extend display to the projector and press **🖥️ 2nd Screen**

## 🔄 Updating from an older version

Just open the app with internet on — it detects the update, shows an **Update** button with download progress, then offers **Restart to update**. No reinstall needed; all data stays.

## ⚙️ One-time setup (a teacher or the developer does this once)

In Supabase → SQL Editor, run `supabase/schema.sql`, then `supabase/migrate-exams.sql`. The app ships pre-connected — no keys to paste.

## 📝 Notes

- Presentations stay on each computer by design; students, marks, and books sync via cloud.
- Old `.ppt` files: Save As `.pptx` first. Slide animations don't carry over (static slides).
- Made with ❤️ by **Awishkar Pandit (student developer)** and team — Prabesh Timilsina, Abhinav Basnet, Sakshyam Basnet (play testers). Found a bug or want a feature? Tell your teacher to pass it on to Awishkar.
