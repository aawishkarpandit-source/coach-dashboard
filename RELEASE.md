# 🎓 Coach Dashboard v1.0.7 — Official Release

A classroom teaching app **built by a student, for classrooms**. One install gives teachers students & marksheets, textbooks, presentations, and a second-screen stage for the projector — online or offline.

## ✨ What's inside

- **Students & Marksheet** — class-wise lists, theory + practical marks with customizable full marks, auto totals & percent, CSV export
- **Subjects & Exams** — add, rename, and manage subjects; Exam 1, Exam 2… each with its own marksheet
- **Textbooks** — import PDFs, offline reader, books sync between computers
- **Present** — images, videos, PDFs and PowerPoint (`.pptx`) files render fully offline, with page turns mirrored to the projector
- **2nd-screen stage** — Welcome idle screen, marksheet table, and synced video controls
- **Cloud sync + auto-updates** — data follows teachers across computers; new versions install themselves
- **Backup & Restore** — whole school data in one file
- **About page** — Terms & Conditions and a cinematic Team credits roll 🎬

## 📥 New install (school computer)

1. Download `Coach-Dashboard-Setup-1.0.7.exe` from GitHub Releases
2. Run it → open **Coach Dashboard** → extend display to the projector and press **🖥️ 2nd Screen**

## 🔄 Updating from an older version

Just open the app with internet on — it downloads the update itself and shows a green **Restart to update** bar. No reinstall needed; all data stays.

## ⚙️ One-time setup (a teacher or the developer does this once)

In Supabase → SQL Editor, run `supabase/schema.sql`, then `supabase/migrate-exams.sql`. The app ships pre-connected — no keys to paste.

## 📝 Notes

- Presentations stay on each computer by design; students, marks, and books sync via cloud.
- Old `.ppt` files: Save As `.pptx` first. Slide animations don't carry over (static slides).
- Made with ❤️ by **Awishkar Pandit (student developer)** and team — Prabesh Timilsina, Abhinav Basnet, Sakshyam Basnet (play testers). Found a bug or want a feature? Tell your teacher to pass it on to Awishkar.
