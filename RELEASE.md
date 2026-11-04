# 🎓 Coach Dashboard v1.1.0 — Official Release

A classroom teaching app **built by a student, for classrooms**. One install gives teachers textbooks, notes, presentations, marks data and a second-screen stage for the projector — online or offline.

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

1. Download `Coach-Dashboard-Setup-1.1.0.exe` from GitHub Releases
2. Run it → open **Coach Dashboard** → pick your class → extend display to the projector and press **🖥️ 2nd Screen**

## 🔄 Updating from an older version

Just open the app with internet on — it detects the update, shows an **Update** button with download progress, then offers **Restart to update**. No reinstall needed; all data stays.

## ⚙️ One-time setup (a teacher or the developer does this once)

In Supabase → SQL Editor, run `supabase/schema.sql`, then `supabase/migrate-exams.sql`. The app ships pre-connected — no keys to paste.

## 📝 Notes

- Presentations stay on each computer by design; students, marks, and books sync via cloud.
- Old `.ppt` files: Save As `.pptx` first. Slide animations don't carry over (static slides).
- Made with ❤️ by **Awishkar Pandit (student developer)** and team — Prabesh Timilsina, Abhinav Basnet, Sakshyam Basnet (play testers). Found a bug or want a feature? Tell your teacher to pass it on to Awishkar.
