# Crane Lifting Assessment — Web App

A browser-based rebuild of the original WinForms crane lifting assessment tool, for
daily lift assessments, permit-to-work management, and record keeping — no install,
runs from any browser, deployable free on GitHub Pages.

## ⚠️ Before you use this on a real site

`js/crane-data.js` now ships with the **certified XCMG load-chart figures**, transcribed
directly from the manufacturer's technical specification sheets for the two cranes on
file (QY50KD, 2020-07-01 edition; QY25K5D, 2021-03 2nd edition) — main-boom capacities
across every printed outrigger-span/counterweight combination, plus the jib charts. It
is no longer placeholder/interpolated data. Even so:

1. A `DATA_NOTES` array at the top of `js/crane-data.js` flags two spots that were
   transcribed exactly as printed but are worth a second look against your paper copy
   (a highlighted cell on the manufacturer's own QY50KD sheet, and two QY50KD reduced-
   outrigger charts that print identical numbers for two different counterweights).
2. Have a competent/appointed person verify the tool's output against the printed chart
   before relying on it, and whenever you add a new crane model.
3. Keep treating the manufacturer's printed chart as the authority on site — this tool
   is a planning aid, not a substitute for it.

## What it does

- **New assessment** — pick a crane and configuration (counterweight and outrigger
  span, where the crane offers more than one), enter load/radius/boom/wind, and get an
  allowed/not-allowed verdict with a capacity-utilization readout. Capacity is
  interpolated across both radius *and* boom length, using only the radius range the
  chart actually prints for that boom (no more silently allowing an out-of-range
  radius). Wind speed is checked live against the crane's rated limit as you type.
- **Main boom + jib assessments** — for cranes with a jib chart on file, switch "Boom
  setup" to "Main boom + jib" to pick the jib configuration/length/offset and enter a
  boom angle instead of a radius, matching how manufacturers actually publish jib
  capacity tables. The result panel reminds you to cross-check the lifting-height
  diagram for the radius a given angle produces.
- **Assessment history** — searchable, filterable log of every assessment, exportable
  to CSV.
- **Lifting permits** — a full permit-to-work form: validity window, pre-start
  checklist, critical-lift flagging (which requires a linked, passing assessment and an
  approver signature before it can be saved), and on-screen signature capture for
  issuer/approver/verifier. Permits can be viewed read-only, edited, suspended with a
  reason, or printed / saved as PDF via the browser's print dialog.
- **All permits** — searchable list with active/expired/suspended status and lift type.
- **Fleet & backup** — read-only summary of the cranes on file, plus JSON export/import
  so you can back up or move your records between browsers or machines.

## Data storage — read this

There is no server or database. All assessments and permits are stored in the
browser's `localStorage`, scoped to whichever URL you open this from. That means:

- Data does **not** sync between devices or browsers on its own.
- Clearing your browser's site data deletes your records.
- **Export a backup regularly** from the Fleet & Backup page, and keep the `.json`
  file somewhere shared with your team (e.g. in the same repo, or a shared drive).
- If your team needs shared, always-in-sync records across multiple people, this
  static-site design isn't enough on its own — you'd want to add a small backend
  (e.g. Firebase, Supabase, or a simple API) behind the same UI. The `js/storage.js`
  file is written as a single data-access layer specifically so that swap is
  localized to one file.

## Running it locally

No build step. Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying on GitHub Pages

1. Create a new GitHub repository and push this folder's contents to it.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch", pick your
   default branch and the `/ (root)` folder, then save.
4. GitHub will publish the site at `https://<your-username>.github.io/<repo-name>/`
   within a minute or two.

```bash
git init
git add .
git commit -m "Crane lifting assessment web app"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

## Project structure

```
index.html        Dashboard
assessment.html   New lift assessment
history.html      Assessment history
permit.html       New / view / edit lifting permit
permits.html      All permits list
settings.html     Fleet reference + backup/restore
css/styles.css    Shared design system
js/crane-data.js  Crane specs & load charts — EDIT THIS with your certified data
js/storage.js     localStorage data layer + load-chart interpolation math
js/nav.js         Shared sidebar + disclaimer banner
js/signature-pad.js  Canvas-based signature capture
js/assessment.js  Assessment page logic
js/permit.js      Permit page logic
```

## Extending it

- **Add a crane model**: add a new entry to `CRANE_DATA` in `js/crane-data.js`
  following the existing shape — no other file needs to change.
- **Add a checklist item**: add `{ key, label }` to `CHECKLIST_ITEMS` in `js/permit.js`.
- **Change the look**: all styling lives in `css/styles.css` as CSS custom properties
  at the top of the file.
