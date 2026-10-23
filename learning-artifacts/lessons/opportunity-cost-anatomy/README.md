# Anatomy opportunity-cost experiment

Status: **evaluation prototype, not published**. The user decided Anatomy’s machine metaphor is not the desired general direction. Firebase’s existing Choice Islands activity remains unchanged. Do not replace it with this experiment merely because it passes automated checks.

Anatomy is installed at `~/.agents/skills/anatomy`, pinned to `1482e8469b0a9e0d8cc18ea2740a01423d29ae80`. `bash scripts/install-anatomy.sh` restores the skill without resetting an existing checkout. Read its SKILL.md before applying it. The environment draft also includes the install/start instructions; that saved draft must be published to activate the configuration.

This Figure uses the real upstream kit to precompute a 65-solid SVG ticket machine. One ticket previews, then docks at a single activity. A separate outlined bay marks the proposed best forgone plan. No Blender, shaders, external runtime requests, telemetry, or community-gallery submission. See [design.md](design.md), [provenance.json](provenance.json), and [ANATOMY-LICENSE.txt](ANATOMY-LICENSE.txt).

Rebuild from learning-artifacts:

    node lessons/opportunity-cost-anatomy/build.mjs
    node cli.mjs generate --topic mt_Qzbh-_v0Gq --age 10 --plugin lessons/opportunity-cost-anatomy/opportunity-cost-anatomy.plugin.mjs --out output/<fresh-name>
    node cli.mjs verify --dir output/<fresh-name> --only-browser

`domain.mjs` and `presentation.mjs` are build inputs; the generated plugin is self-contained and pins the MIT license as an asset. Changes require fresh generation and validation. The existing Three.js implementation remains independent.

Validation on 2026-10-22: 37 package tests passed, including all six personal preference pairs and the original £10/£9 budget boundaries. The original taxonomy validator passed unchanged. Generated `output/opportunity-cost-anatomy-v3` passed model fixtures and browser acceptance, reset, repeated-time seeking, 390px layout/touch-target, session isolation and offline-runtime checks in Chromium 154 / Playwright 1.62. The earlier v2 passed Anatomy’s native line-end checker (zero floating line ends); v3 changed the camera fit, so that result is not a claim of a final full craft audit. Expert, learner, physical-device, timing/performance and full geometry audits have not been performed. The initial screenshots prompted camera-angle and contrast corrections. Direct scene pointer coverage and final close-up review remain unfinished after the direction changed.

The taxonomy foundation and narrow evidence claims come from Choice Islands: Budgeting Pocket Money (`mt_Qzbh-_v0Gq`), partial evidence 0 and 2. The examples are authored for the family’s ages 10 and 15; the taxonomy’s younger age band does not establish their mastery. Personal preferences are elicited, not objectively graded. One correct challenge response does not establish mental-model mastery.
