# Duck HSE Portal — Projects & Project Logs Update v1.6.0

This update adds **multi-project support** and a **project log** so you can keep a
running record of what happened on each job and who was involved — and file every
document for a project in its own Google Drive folder.

## New files
- `projects.html` — list of all projects (search + status filter, log counts, quick Drive link).
- `project.html` — create/edit/view a project, its Google Drive folder link, its linked log
  spreadsheet, and its recent log entries.
- `logs.html` — the Project Logs register: every entry across all projects, filterable by
  project, category and status, and searchable by person, reference or text.
- `log.html` — create/edit/view a single log entry, including a dynamic list of the people
  involved (name + role) and an optional document link.

## Changed files
- `js/storage.js` — added `projects` and `logs` collections (get/save/delete, per-project log
  lookup) and included them in Backup/Restore export & import.
- `js/nav.js` — new **Projects** section in the sidebar (Projects, Project logs); nav rebuilt
  from grouped sections so it's robust to future additions.
- `js/cloud-sync.js` — now mirrors every collection (incl. `checklists`, `projects`, `logs`)
  down from Firestore, not just assessments and permits.
- `js/sheets-sync.js`, `server/core.mjs`, `js/sheets-client.js` — `projects` and `logs`
  added as valid, account-isolated sync collections.
- `index.html` — dashboard now shows a **Recent project log entries** section.
- `settings.html` — Backup/Restore and "Clear all data" now cover projects and logs.
- `sw.js`, `js/app-version.js`, `twa-manifest.json`, `manifest.webmanifest` — new pages
  precached, a **Project logs** app shortcut added, and version raised to `1.6.0` (build 12).
- `server/test.mjs` — added a test for the new `projects`/`logs` collections.

## What it does
- **Multiple projects.** Create a project per site/job with client, location, status,
  manager, contractor and scope.
- **Track people.** Each log entry carries the people involved (name + role), so the log is
  searchable by who was on site. The register shows people at a glance.
- **Editable & synced.** Log entries can be updated later; changes re-sync to the cloud like
  any other record and appear in the app and on the dashboard.
- **Documents per project (Google Drive).** Each project holds a Google Drive folder link so
  all its documents live in one place, and each log entry can link a specific document in that
  folder. (Full in-app Drive upload is a planned future step; today the app links out to the
  per-project folder you paste in.)

## Deployment
Copy the staged files into the same locations in the existing application and deploy over
HTTPS. The service-worker cache version was raised to `v1.6.0`, so returning users get an
"Update available" prompt and the new pages once they reload.
