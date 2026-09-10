# Crane Lifting Assessment — Web App

A browser-based rebuild of the original WinForms crane lifting assessment tool, for
daily lift assessments, permit-to-work management, and record keeping — no install,
runs from any browser, deployable free on GitHub Pages.

> **Trial · educational use only.** Not for real operational lift decisions.
> Developed by **Sabir Amin** — sabiriis143@gmail.com — +971 55 362 3535.

## Signing in

This build sits behind a simple sign-in screen:

- **Username:** `Sabir`
- **Password:** `admin`

This is a **client-side-only access gate, not real security** — the credentials live
in plain text in `js/auth.js`, which the browser downloads, so anyone with the page
open can read them (view-source, devtools, etc.), and there's no server enforcing
anything. It exists only to keep this trial build from being stumbled into by
accident. Do not rely on it to protect real operational or personal data — put a
proper authenticated backend behind it for that. Sign out from the link at the
bottom of the sidebar.

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
4. Lifting operations should be planned and controlled in line with **ADOSH-SF CoP
   34.0 – Safe Use of Lifting Equipment and Lifting Accessories** and any other
   applicable local regulations, which take precedence over anything shown here.

## Wind stop-work rule

Every assessment checks wind speed against **two** limits and applies whichever is
**lower**:

- the crane's own manufacturer-rated wind limit (from `js/crane-data.js`), and
- a **38 km/h (≈10.56 m/s) site stop-work threshold**, applied here consistent with
  ADOSH-SF CoP 34.0's requirement to suspend lifting once wind conditions become
  unsafe.

The assessment page shows both figures, states which one is binding for the crane in
use, and refuses the lift once either is exceeded. Confirm the current, site-specific
wind action limit with your appointed person/OSH team — this constant does not
replace that determination.

## What it does

- **New assessment** — pick a crane and configuration (counterweight and outrigger
  span, where the crane offers more than one), enter load/radius/boom/wind, and get an
  allowed/not-allowed verdict with a capacity-utilization readout. Capacity is
  interpolated across both radius *and* boom length, using only the radius range the
  chart actually prints for that boom (no more silently allowing an out-of-range
  radius). Wind speed is checked live against the effective (crane-rated vs. ADOSH
  38 km/h) limit as you type.
- **Main boom + jib assessments** — for cranes with a jib chart on file, switch "Boom
  setup" to "Main boom + jib" to pick the jib configuration/length/offset and enter a
  boom angle instead of a radius, matching how manufacturers actually publish jib
  capacity tables. The result panel reminds you to cross-check the lifting-height
  diagram for the radius a given angle produces.
- **Lift diagram** — a live, drag-to-rotate 3D wireframe of the crane, load, boom
  angle, and wind direction (dependency-free animated SVG, no WebGL/three.js), plus a
  2D plan sketch, both updating as you edit the form. Either can be downloaded as a
  PNG, and both are automatically captured and attached to the assessment (and, from
  there, to any permit you link it to) when you save.
- **Environmental & site conditions** — record visibility, precipitation, lighting,
  and ground conditions, plus the load's largest dimension, alongside the lift.
- **Pre-lift briefing** — automatically generated, tailored to the specific lift: wind
  limit and source, exclusion zone, environmental cautions (poor visibility/lighting,
  adverse weather, poor ground), communications, load path/tag lines, emergency
  arrangements, and required roles.
- **Exclusion zone** — a suggested starting-point radius (working radius + half the
  load's largest dimension + a generic slew/rigger margin, with an extra allowance
  when wind is approaching the stop-work limit), with the calculation shown — not a
  mandated figure; the appointed person and site risk assessment set the final
  barriered distance.
- **Training requirements, categorized** — Appointed Person, Lift Supervisor, Crane
  Operator, Rigger/Slinger, and Banksman/Signaller, each with the specific
  competencies expected and flagged mandatory/standard based on the lift's risk
  profile (utilization, jib use, load vs. crane capacity).
- **Crane selector** — enter a load weight and required working radius (and,
  optionally, a maximum boom length) and it scans every crane/configuration/boom
  combination on file, filters to the ones that can lift it safely, and ranks them by
  a **cost-efficiency proxy** (smallest adequate crane class, then shortest boom, then
  best use of that crane's capacity). This is a heuristic, not real pricing — it
  doesn't know your actual rental rates or availability. Each result links straight
  into a pre-filled full assessment.
- **Assessment history** — searchable, filterable log of every assessment, exportable
  to CSV, with a "View" button to open its saved lift diagrams.
- **Lifting permits** — a full permit-to-work form: validity window, pre-start
  checklist, critical-lift flagging (which requires a linked, passing assessment and an
  approver signature before it can be saved), the linked assessment's lift diagrams
  and full pre-lift briefing/training/exclusion-zone summary, and on-screen signature
  capture for issuer/approver/verifier. Permits can be viewed read-only, edited,
  suspended with a reason, or printed / saved as PDF via the browser's print dialog
  (the lift diagrams print too).
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

No build step. Open `index.html` directly in a browser (you'll land on the sign-in
screen first — see **Signing in** above), or serve the folder:

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
index.html            Dashboard
login.html             Sign-in screen (see Signing in above)
assessment.html        New lift assessment, lift diagram, briefing & training
crane-selector.html    Cost-efficient crane recommendation tool
history.html           Assessment history
permit.html            New / view / edit lifting permit
permits.html           All permits list
settings.html          Fleet reference + backup/restore
css/styles.css         Shared design system
js/auth.js              Client-side-only sign-in gate — NOT real security
js/crane-data.js       Crane specs & load charts — EDIT THIS with your certified data
                        (also holds the ADOSH_WIND_STOP_* wind rule constants)
js/storage.js          localStorage data layer + load-chart interpolation math
js/crane-visual.js     Dependency-free 3D lift viewer + 2D plan sketch + PNG export
js/lift-planning.js    Pre-lift briefing / training requirements / exclusion zone
js/crane-selector.js   Crane recommendation engine used by crane-selector.html
js/nav.js              Shared sidebar + disclaimer banner + footer + sign-out
js/signature-pad.js    Canvas-based signature capture
js/assessment.js       Assessment page logic
js/permit.js           Permit page logic
```

## Extending it

- **Add a crane model**: add a new entry to `CRANE_DATA` in `js/crane-data.js`
  following the existing shape — no other file needs to change; the crane selector
  and lift diagrams pick it up automatically.
- **Add a checklist item**: add `{ key, label }` to `CHECKLIST_ITEMS` in `js/permit.js`.
- **Change the sign-in credentials**: edit `CREDENTIALS` in `js/auth.js` (remember:
  still not real security — see **Signing in** above).
- **Change the wind stop-work threshold**: edit `ADOSH_WIND_STOP_KMH` in
  `js/crane-data.js`.
- **Change the look**: all styling lives in `css/styles.css` as CSS custom properties
  at the top of the file.

