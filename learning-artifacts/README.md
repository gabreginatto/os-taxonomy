# Taxonomy to lesson

A coordinating Codex skill and a small local compiler for turning Marble taxonomy topics into interactive learning activities. It runs in Codex cloud with Node, a headless browser, and optional background Blender/HyperFrames.

The original taxonomy is unchanged. This package owns its dependencies, source, templates, tests, and generated output separately.

## Start

For the family games and a complete index of the session work, read [AI_HANDOFF.md](../AI_HANDOFF.md). After installation, `npm run restore:published` from this directory reconstructs and browser-verifies the three catalog artifacts from committed source. It restores ignored build output locally without deploying.

From the repository root:

    bash learning-artifacts/scripts/install.sh
    npm run artifacts -- search --query "Equivalent fractions"
    npm run artifacts -- generate --topic mt_FbDKeLfBCo --out learning-artifacts/output/my-fractions
    npm run artifacts -- verify --dir learning-artifacts/output/my-fractions

The output directory must be new. For agent-driven authoring, invoke the repository skill:

    $taxonomy-to-lesson
    Create an interactive lesson about equivalent fractions for an eight-year-old.

The skill lives in [.agents/skills/taxonomy-to-lesson](../.agents/skills/taxonomy-to-lesson/SKILL.md). If the client has not refreshed repository skills yet, ask it to read that SKILL.md directly or start a new task in this checkout.

## What works

| Catalog activity | Topic ID | Representation |
|---|---|---|
| Equivalent fractions | mt_FbDKeLfBCo | Equal-whole SVG fraction bars |
| Flat vs Solid Shapes | mt_mnEVZNkX3p | Three.js primitives + HTML classification |
| Evaporation and condensation | mt_zCGwH1OQZa | Qualitative SVG water-cycle vocabulary |
| Moon Phases | mt_ByXgbTld6R | SVG appearance sequence |
| Earth's rotation and day/night | mt_q15w--Fb5H | Three.js observer and illumination model |
| Building sentences | mt_N8CpN1EJrP | Constrained word construction |

These are deliberately scoped activities, not full mastery assessments. Coverage and partial criteria appear in every generated manifest. Reference links do not imply an expert or learner review.

An unsupported topic produces needs_content_review. The skill can author a new self-contained domain/presentation plugin rather than substituting a generic page. A working extension example is included:

    cd learning-artifacts
    node cli.mjs generate --topic mt_vKcxX6iNOA --plugin examples/fraction-notation.plugin.mjs --out output/my-notation
    node cli.mjs verify --dir output/my-notation

The extension interface, fixed examples, and browser acceptance contract are documented in [authoring guidance](../.agents/skills/taxonomy-to-lesson/references/authoring.md).

Three Three.js activities apply this workflow to the mental-model course research for ages 10 and 15. [Choice Islands](lessons/opportunity-cost/README.md) introduces opportunity cost through a personal next-best alternative and original-budget challenges. [Save the Moon Garden](lessons/inversion/README.md), directed and reviewed by Astra, introduces inversion through predicted failure causes, one-change rehearsals, an empty-cargo counterexample and two independent failure paths. [Press Club](lessons/economies-of-scale/README.md), rebuilt from scratch with Fable as design advisor, is an age-15 print-studio game: the learner leases presses and curing tunnels over five weeks, watches pallets jam or ship, and predicts changes, records an experiment ledger and selects a balanced comparison to find where scale stops paying, then transfers the method to a noodle stall. Current generated builds are `output/opportunity-islands-clear/`, `output/inversion-mission-v3/` and `output/press-club-v5/`.

## A series

    node cli.mjs plan --topic mt_FbDKeLfBCo --topic mt_N8CpN1EJrP --out output/course-plan.json
    node cli.mjs generate --plan output/course-plan.json --out output/my-course
    node cli.mjs verify --dir output/my-course

The planner traverses transitive hard prerequisites, preserves ordering through omitted nodes, lists background assumptions, and flags a known conflicting sound edge. It never silently rewrites the taxonomy or declares omitted prerequisites mastered. Ambiguous names require exact IDs. Explicit --allow-partial builds independent supported topics while retaining blocked topic statuses.

Custom plugins currently compile one topic per artifact. A future course can link those units; research JSON in [Munger_Models](../Munger_Models/README.md) is not itself a compiler request or a completed course.

## Optional video and assets

    node cli.mjs video --dir output/my-fractions --seconds 8 --fps 15
    node cli.mjs verify --dir output/my-fractions

Video replays a fixed scenario through the same model using a paused GSAP timeline and HyperFrames. It checks the actual MP4's dimensions/duration and decoded frames. This version renders one topic per video and includes no narration or learner recording. Interactive decks and automatic assembly of a whole course video are not implemented.

    node cli.mjs asset --kind cube --out output/assets/new-cube.glb
    node cli.mjs verify-asset --dir output/my-shapes --asset output/assets/new-cube.glb --out output/assets/check.json

Blender asset creation uses background Python and uncompressed GLB; a browser check loads and renders the asset. Primitive assets are integration fixtures. Use Blender for a real lesson only when custom geometry helps. Blender MCP remains optional and unconfigured.

## Outputs and validation

Each artifact contains its static browser build, editable source/, plan.json, manifest.json, scenario.json, provenance.json, content licenses and attribution. Checks and screenshots live in checks/; requested videos and sample frames live in exports/.

    node cli.mjs serve --dir output/my-course --port 4173
    node cli.mjs rebuild --dir output/my-course
    node cli.mjs verify --dir output/my-course

Serving is explicit and local; publishing is separate. Generation starts no persistent service. Rebuild invalidates old checks. The verifier checks accepted source hashes, exact taxonomy evidence, the artifact's actual model fixtures, UI behavior/reset, mobile layout, keyboard input, arbitrary-time state and scene rendering, and local-only runtime assets. Overall readiness never follows merely from an old video status or the existence of a port.

Review screenshots and content before distribution. Automated checks do not prove scientific completeness, educational effectiveness, or learner mastery. Software WebGL checks do not establish phone/tablet performance. Meaningful source/claim checks, expert review when needed, and transfer assessments remain distinct.

The current prepared environment includes a verified six-topic artifact at output/showcase and standalone examples at output/fractions-demo, output/daynight-demo, and output/notation-demo. These generated directories are ignored by Git; the source, reproducible commands, and [validation summary](examples/validation-summary.json) are versioned. [Fraction](examples/screenshots/fractions.png), [3D day/night](examples/screenshots/day-night.png), [mobile](examples/screenshots/mobile.png), and [extension](examples/screenshots/extension.png) screenshots provide a static review.

    node cli.mjs serve --dir output/showcase --port 4173

## Tools and reproducibility

The [family Firebase Hosting workflow](hosting/README.md) builds one child-facing catalog and a stable browser route per verified activity, using a separate education project. The [activity catalog](https://gabreginatto-learning-lab.web.app/) and [Choice Islands](https://gabreginatto-learning-lab.web.app/opportunity-cost/) are published and publicly verified, including desktop/mobile 3D interactions. Future activities join the same catalog; deployment uses the cloud environment's secure Firebase credential.

Node dependencies are pinned by package-lock.json; Python browser tooling uses requirements.txt in .venv/. Chromium, FFmpeg and optional Blender must be supplied by the host. The cloud setup uses the available system Chromium; no browser download is required. doctor reports availability; successful generation/verification establishes integration.

[upstream-guidance.lock.json](upstream-guidance.lock.json) pins source revisions and checksums for GSAP skills, HyperFrames contracts, and Blender MCP documentation. scripts/sync_guidance.py restores them into the ignored .cache/guidance/ directory without updating versions. Skills guide authoring; installed runtimes do the work.

GSAP guidance is MIT-licensed, while the GSAP runtime has its own standard license. Three.js uses MIT and HyperFrames uses Apache 2.0. Taxonomy structure uses ODbL and Marble text CC BY-SA; standards keep their upstream terms. Generated attribution distinguishes these layers.

## Design and tests

[Architecture](docs/ARCHITECTURE.md), [routing policy proposal](docs/routing-policy.json), and [example plan](docs/example-plan.json) preserve the Astra-reviewed design. Some broader design features, such as a content-addressed shared cache and interactive decks, remain proposals. The executable first version is in src/ and the coordinating skill.

    npm test
    node ../scripts/validate.mjs
    python3 ../Munger_Models/validate.py --self-test

Unit tests cover exact/ambiguous topic resolution, prerequisite closure/cycles/conflicts, unsupported topics, tool decisions, independent domain examples, fresh-output protection, changed-source detection, artifact-model regressions, metadata integrity, and custom extensions.

See [implementation and validation status](docs/IMPLEMENTATION.md) for the delivered scope and outstanding review limits.
