# Family Learning Lab: start here

This fork contains the complete source of the learning system built in the Codex session, alongside the original Marble taxonomy. The intended learners are ages 10 and 15; age and reported ability do not establish mastery. The original taxonomy remains unchanged.

## Where the work is

| Path | Purpose |
|---|---|
| [.agents/skills/taxonomy-to-lesson/SKILL.md](.agents/skills/taxonomy-to-lesson/SKILL.md) | The coordinating skill: taxonomy → learning contract → tools → model → artifact → verification → hosting |
| [learning-artifacts/README.md](learning-artifacts/README.md) | Compiler, installation, supported outputs and commands |
| [learning-artifacts/docs/ARCHITECTURE.md](learning-artifacts/docs/ARCHITECTURE.md) | Astra's architecture and tool-selection guidance; distinguish implemented features from proposals |
| [Munger_Models/README.md](Munger_Models/README.md) | 23 model groups, exact taxonomy mappings, research sources, age pathways and course guidelines |
| [learning-artifacts/lessons/opportunity-cost/](learning-artifacts/lessons/opportunity-cost/) | Choice Islands: current Three.js game, pure model, Astra redesign brief, learning contract, tests and screenshots |
| [learning-artifacts/lessons/inversion/](learning-artifacts/lessons/inversion/) | Save the Moon Garden: Astra design direction/review, causal game model and validation |
| [learning-artifacts/lessons/economies-of-scale/](learning-artifacts/lessons/economies-of-scale/) | Press Club: age-15 print-studio game (rebuilt from scratch with Fable as design advisor) — fixed-cost spreading, bottlenecks, coordination overhead, idle capacity and a noodle-stall transfer; see its design brief |
| [learning-artifacts/lessons/opportunity-cost-anatomy/](learning-artifacts/lessons/opportunity-cost-anatomy/) | Preserved Anatomy evaluation prototype. The user rejected this as the general visual direction; it was not published |
| [learning-artifacts/hosting/](learning-artifacts/hosting/) | Dedicated Firebase project configuration, catalog, guarded deployment scripts, checks and publication receipts |

The design direction is colorful, tactile 3D scenes with meaningful direct interaction, clear constraints and consequences, one question at a time, and keyboard/touch equivalents. A conventional office form does not satisfy the requested experience. Anatomy is useful for physical mechanisms but is not the chosen general game style. Three.js and GSAP are used in the published games. Blender works headlessly when needed; its MCP bridge is optional. HyperFrames is for requested videos, not a substitute for an interactive game.

## Live activities

- Catalog: https://gabreginatto-learning-lab.web.app/
- Opportunity cost, ages 10 and 15: https://gabreginatto-learning-lab.web.app/opportunity-cost/
- Inversion, ages 10 and 15: https://gabreginatto-learning-lab.web.app/inversion/
- Economies of scale, age 15: https://gabreginatto-learning-lab.web.app/economies-of-scale/ (still serves the earlier Little Works until Press Club is deployed; Press Club is built and verified locally at `output/press-club-v2`)

The Anatomy prototype did not replace Choice Islands. Publishing a new activity must preserve the other routes.

## Restore from a fresh checkout

Prerequisites: Node 22+, Python 3 with venv, and system Chromium. FFmpeg and Blender are optional for video/assets. The browser verifier defaults to `/usr/bin/chromium`; pass `--chromium` to the restore command for another executable. No Firebase access is needed to build and test locally.

From the repository root:

```bash
bash learning-artifacts/scripts/install.sh
npm --prefix learning-artifacts run restore:published
npm --prefix learning-artifacts/hosting run build
node learning-artifacts/cli.mjs serve --dir learning-artifacts/hosting/public --port 4173
```

The restore command generates and browser-verifies missing artifacts at the paths used by the committed catalog, then restores thumbnails from committed screenshots. It reuses already verified matching builds and refuses to overwrite unrelated or edited artifacts. Stop the preview server when finished. Rebuilding is not a new deployment and does not promise byte-identical historical bundles across different toolchains.

Generated `output/`, hosting `public/`, caches, virtual environments, logs and private `.state/` receipts stay out of Git. Their absence after cloning is expected. The editable plugins, models, compiler, lockfiles, contracts, research, review evidence and restore instructions are committed. Optional Anatomy installation is reproducible with `bash learning-artifacts/scripts/install-anatomy.sh`; it pins the upstream revision rather than copying an external home-directory checkout into this repository.

## Continue the work

```bash
npm --prefix learning-artifacts test
npm --prefix learning-artifacts/hosting test
node scripts/validate.mjs
python3 Munger_Models/validate.py --self-test
```

Read each lesson's README and learning contract before modifying it. Domain truth and assessment remain pure and serializable; animation only presents results. A plugin change needs a fresh output directory and current validation. If updating a published route, intentionally update its catalog/restore recipe to the new verified artifact. The deeper lesson-specific interaction scripts exercise real scene picking and full lesson progression; run them when those mechanics change.

Source, expert, human, learner and physical-device reviews are separate. A correct response is not mastery. Munger attribution relies on an unofficial transcript mirror; retain the documented authentication limits and do not invent quotations. Many researched models remain proposals rather than implemented courses.

## Publishing

Read [the publishing guide](.agents/skills/taxonomy-to-lesson/references/publishing.md) and [hosting README](learning-artifacts/hosting/README.md). Use only the existing education project `gabreginatto-learning-lab`. The commercial repository and business Firebase projects are outside this deployment scope.

Firebase credentials are private environment configuration and are not transferable through Git. In a separately authorized environment, provide authentication privately, run `npm run check` in `learning-artifacts/hosting`, and use `npm run connect` if its ignored local receipt is absent. Do not provision a duplicate project. Deploy only within the user's authorization; successful deployment must pass live file-hash and browser checks before reporting a new version as published.
