---
name: taxonomy-to-lesson
description: Create and verify interactive learning activities or scripted explainer videos from one or more Marble taxonomy topics. Resolve prerequisites, select visual tools, reuse or author a domain-model plugin, and test the generated artifact in Codex cloud.
---

# Taxonomy to lesson

Own the request through a runnable, verified local artifact. A topic ID, topic name, or series is sufficient to begin. Use the existing repository checkout; cloud tasks are already isolated, so do not create worktrees unless explicitly requested.

## Establish the learning contract

1. Locate this skill's repository root (three directories above this skill directory); work in its learning-artifacts/ package.
2. Read learning-artifacts/README.md from the repository root, then references/tool-routing.md and references/authoring.md relative to this skill. Read references/course-planning.md for a course or mental-model request.
3. Run node cli.mjs doctor. If dependencies are missing, use bash scripts/install.sh from learning-artifacts/. Do not assume an MCP server exists because its repository is linked.
4. Search with node cli.mjs search --query "<topic>". Prefer exact IDs. Resolve ambiguous names before building the affected topic. Record reasonable age/style assumptions without blocking independent work.
5. Save a plan with node cli.mjs plan --topic <ID> [--topic <ID> ...] --out output/<unique-run>/plan.json. Supply --age when known and --format interactive_browser,mp4 only when video is requested.
6. Read exact evidence coverage, prerequisite closure, assumptions, routes, and conflicts. A hard dependency means topicId depends on prerequisiteId. Do not reverse edges, infer mastery, expand the entire closure into lessons, or hide gaps.

## Select tools intentionally

Honor the requested visual experience. When the user requests colorful 3D artifacts or a toy-like interactive teaching scene, record Three.js as a required representation and make direct scene interaction the primary activity. Keep assessment controls secondary; a conventional form with topic cards does not satisfy that request. Check visual quality with representative screenshots as well as functional tests.

Make the first action understandable without explanation. Start with one question and only the constraints needed for it; introduce other mechanics after the learner has experienced the idea. Distinguish a preview from confirmation, announce and focus each new task, and show the concrete consequence before introducing its technical name. Keep each 3D object visibly paired with its label, check its full raised bounds, and bring the relevant question/result into view on phones. Elicit personal preferences without marking them objectively correct. Use fictional rankings only when their meaning is visible; avoid invented reward or utility scores as a shortcut for teaching trade-offs.

Use HTML/SVG by default. Use Three.js for a stated spatial learning purpose; Canvas for dense continuous 2D; GSAP for presentation motion. Keep domain quantities, causal rules, and assessment outside animation callbacks.

Use headless Blender Python only for a useful custom asset. Prefer browser primitives for ordinary geometry. Blender MCP is optional and must pass an actual connected scene round trip before use. Use HyperFrames for requested MP4 demonstrations; preserve arbitrary-seek behavior through the shared model. This compiler does not implement interactive decks.

Read relevant pinned upstream guidance from learning-artifacts/.cache/guidance/. Restore it with python3 scripts/sync_guidance.py if needed. Revisions and SHA-256 hashes are committed in upstream-guidance.lock.json. Load gsap-core/gsap-timeline for animation; hyperframes-core/hyperframes-animation/hyperframes-three for video and 3D export; blender-mcp-readme only for an actual MCP route. Relative links inside snapshots refer to their source repositories; use the pinned revision for additional references.

## Generate and verify

For a supported plan, run:

    node cli.mjs generate --plan <plan.json> --out output/<fresh-artifact-directory>
    node cli.mjs verify --dir output/<fresh-artifact-directory> --only-browser

Do not reuse the plan directory as the artifact output. Generation never overwrites an existing artifact. Use --allow-partial only for an explicit independent partial batch and report blocked topics by ID.

For an unsupported topic, author a self-contained extension following references/authoring.md. Do not substitute a generic topic card and claim the visualization is complete. Use independent model examples, source-backed content, a meaningful interaction, and a browser acceptance recipe. If evidence is empty or claims cannot be supported, preserve needs_content_review.

Verify after every relevant correction. The verifier checks the artifact's own model source. Inspect initial, changed, assessed, and mobile screenshots from checks/ with the image viewer; repair clipping or misleading geometry. Keep source/expert/human review statuses honest. A single response is not general learner mastery.

For MP4, use a verified single-topic artifact:

    node cli.mjs video --dir <artifact> --seconds 8 --fps 15
    node cli.mjs verify --dir <artifact>

Include all scenario actions in the duration. Inspect decoded frames in exports/ and verify the actual MP4. A video demonstrates a scripted path and cannot observe learner responses. Missing required outputs stay unresolved.

For a custom asset:

    node cli.mjs asset --kind cube --out output/<fresh-name>.glb
    node cli.mjs verify-asset --dir <three-js-artifact> --asset <file.glb> --out output/<fresh-report>.json

Primitive export is a tool check, not a reason to use Blender. Complex asset scripts must retain the GLB/provenance contract and browser-load verification.

## Handoff

For this family's educational activities, use the separate Firebase Hosting workflow in [publishing.md](references/publishing.md). Register each verified activity in the shared catalog and publish when configured access permits; return real verified browser URLs. Complete the local artifact and report precise access blockers when publication is unavailable.

Keep taxonomy data, schemas, checksums, and its original validator unchanged unless the user authorizes a data task. Put generated artifacts under learning-artifacts/output/ or a chosen external directory. Include source, plan, evidence scope, assumptions, dependencies, assets, attribution, screenshots, and structured results.

Use node cli.mjs serve --dir <artifact> --port 4173 only when useful; generation starts no persistent processes. Live servers do not survive snapshots. Do not invent public preview URLs or present localhost as a shareable onboarding link. Publication is separate.

Report paths, checks, unsupported topics/outputs, and content/device-review limits. Name tools actually used.
