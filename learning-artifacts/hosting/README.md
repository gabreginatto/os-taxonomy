# Family Learning Lab on Firebase Hosting

One **separate Firebase project** for all educational activities, with a home page and one stable route per lesson. The commercial repository was inspected read-only; no commercial sites, gateways, databases, passwords or assets are reused.

Current state: **published and publicly verified** in the separate `gabreginatto-learning-lab` project. Open the [activity catalog](https://gabreginatto-learning-lab.web.app/), [Choice Islands](https://gabreginatto-learning-lab.web.app/opportunity-cost/), [Save the Moon Garden](https://gabreginatto-learning-lab.web.app/inversion/), or the economies-of-scale route (https://gabreginatto-learning-lab.web.app/economies-of-scale/). That deployment matched all 39 public files and passed desktop and mobile browser checks for all three activities. The economies-of-scale activity has since been rebuilt as **Press Club**; the catalog now points at the verified local artifact `output/press-club-v2`, which builds and passes the local catalog check but is **not yet deployed** — the live route still serves the earlier Little Works. Physical phone/tablet review remains separate from browser checks.

In a fresh checkout, install the learning-artifacts dependencies and run `npm --prefix learning-artifacts run restore:published` from the repository root before building this catalog. Generated lesson directories are intentionally ignored. See [AI_HANDOFF.md](../../AI_HANDOFF.md) for the complete setup and source index. Restoring locally does not deploy.

## Project and layout

`project.json`, `.firebaserc` and `firebase.json` all select **`gabreginatto-learning-lab`**, created by this workflow. The live structure is:

```text
https://gabreginatto-learning-lab.web.app/                   activity catalog
https://gabreginatto-learning-lab.web.app/opportunity-cost/  Choice Islands
https://gabreginatto-learning-lab.web.app/inversion/         Save the Moon Garden
https://gabreginatto-learning-lab.web.app/economies-of-scale/ Press Club
https://gabreginatto-learning-lab.web.app/<future-topic>/    future activities
```

The catalog, `/opportunity-cost/` and `/inversion/` are live; `<future-topic>` illustrates the route for a future activity. The wrapper refuses known business project IDs and mismatched Firebase targets. Every cloud command selects the education project explicitly. It configures static Hosting only, with no billing link, Functions, Firestore, commercial password gateway, learner accounts or analytics. Children open a link and interact in their browser.

## Authentication and network

The other repository records Firebase project IDs and local `firebase login` / Google ADC instructions; those machine-local sessions and ignored service-account files are not in Git. A web app's public Firebase config would not grant project-creation or deployment access.

Use an existing authenticated Firebase CLI session or a configured Google Cloud identity with access to create a project and administer its Firebase Hosting. In this cloud environment, a **secure `FIREBASE_TOKEN` binding** is supported by the pinned CLI and has been requested in environment settings. Supply values there, never in chat, source files or commits. `firebase login:ci` on an already trusted, signed-in local machine can issue a CLI token; the CLI labels that token method deprecated and recommends Google credentials for durable automation. A token restricted to a commercial project's service account will not automatically grant permission to create a new project.

Required destinations are Firebase management/hosting/upload APIs, Google project management/service usage and OAuth endpoints, and the new public site. Preserve the session proxy and CA trust. A preview channel has its own generated hostname; if the restricted network blocks it, allow that exact returned hostname in environment settings before public verification.

The published cloud environment's secure `FIREBASE_TOKEN` binding authenticated successfully for project creation and Hosting publication. Recheck access in each session; a saved requirement alone does not establish runtime or Google IAM readiness. Never print the credential or store it in the repository.

## Create and publish

The education project already exists. For normal updates, run `npm run check`, `npm run build`, and `npm run deploy`. If a fresh workspace lacks the ignored `.state/project.json` receipt, run `npm run connect` once to verify and adopt this exact education project; do not create another project.

After the core learning-artifact environment is installed:

```sh
cd learning-artifacts/hosting
npm ci
node scripts/firebase.mjs plan  # local proposal only
npm run check                  # read-only authentication/project check
npm run provision              # initial setup only: creates a new project and Hosting site
npm run build
npm run deploy                 # publishes the catalog and every registered activity
```

`provision` refuses to silently reuse an existing project ID. If the ID is taken, update the same ID in all three configuration files and the allowed site domains, then retry with a fresh education ID. Creation permission, quotas and any Firebase terms requirements are confirmed by Google's actual response; do not delete partially created resources automatically.

If the user creates the separate education project and Hosting site in the Firebase console instead, `npm run connect` verifies and records that explicit selection. It does not connect to the commercial infrastructure. A local receipt is kept under ignored `.state/` so later publishes target the same education project.

`deploy` rebuilds from verified artifacts, publishes only Hosting, verifies the bytes of every public file, requires a real 404 for an unknown route, and exercises catalog → actual 3D lesson → feedback in desktop and mobile browser layouts. A CLI deployment that fails public verification is recorded as pending verification, never as a successfully verified site. Results are saved in `.state/last-deploy.json` and `.state/public-browser/`.

`npm run preview` uses a seven-day `review` channel in this education project. It does not change production; the returned preview hostname may need its own network entry. Production publishing is already authorized by the user's request for these educational sites; do not request the same approval again.

## Add the next activity

Generate and verify through the taxonomy-to-lesson skill, then:

```sh
node scripts/add.mjs --artifact /absolute/path/to/verified-artifact --slug inversion --title "Think Backwards" --description "Explore how to avoid a failure." --thumbnail checks/your-screenshot.png
npm run build
npm run deploy
```

Each catalog entry stores the lesson source directory and desired route. Rebuilding the catalog preserves every registered lesson. To update one activity, edit its existing `catalog.json` entry to the new verified artifact; duplicate slugs are rejected. Never change a route merely to publish a new version.

Only verified artifacts with current source hashes and validation fingerprints are accepted. The public build includes executable HTML/JS/CSS, local runtime assets, screenshots and licences. Editable source, test reports, environment files, project credentials and deployment state are excluded. Children see the lesson, not the compiler or deployment configuration.

## Verification

```sh
npm test
npm run build
```

The hosting tests use a real browser-verified compiler fixture for export checks and simulate cloud API responses for project-selection tests. Separately, actual Google/Firebase project creation, deployment, public file hashes, unknown-route 404, and public browser interactions have passed. `scripts/verify-hosting.py` can check a local server or the deployed origin. Local evidence is under `.state/local-browser/`; publication receipts and remote browser evidence are under `.state/last-deploy.json` and `.state/public-browser/`. The shareable result is recorded in `validation-summary.json`.
