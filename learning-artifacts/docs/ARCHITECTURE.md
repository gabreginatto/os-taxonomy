# Taxonomy-to-Lesson: proposed cloud architecture

Status: design for implementation, not an installed skill or a tested integration.
Consultation: GPT-6 Astra, high reasoning, requested by the user.
Scope: accept one taxonomy topic or a sequence, generate a playable educational artifact, and report what was verified. Video and presentation outputs are explicit optional branches.

## 1. Product contract

A caller supplies topic IDs or names, an optional learner age, desired outputs, and optional presentation preferences. Default to a browser lesson. Resolve names against the selected taxonomy checkout; use stable IDs thereafter. Do not infer that a private child profile or previous mastery exists.

The output is a local project containing:
- A playable lesson and its editable source.
- A lesson plan connecting objectives, learner actions, and observable assessment.
- A domain model with stated simplifications and invariant checks.
- Source, toolchain, asset, and content provenance.
- A build/validation report distinguishing passed, failed, skipped, and unrun checks.
- An optional MP4 or runnable presentation when explicitly requested and validated.

Generation can run in Codex cloud; the finished application runs in the learner's browser. Publishing or hosting is a separate operation. A local process or port is not a published deliverable.

This design does not assume all taxonomy topics can be automated equally well. Unsupported scientific content or an unresolved prerequisite conflict can block one topic while independent topics continue.

## 2. Skill as coordinator; a small artifact compiler as execution machinery

Expose versioned scripts and templates through one local CLI. The skill interprets the brief, loads relevant guidance, and runs that CLI through planning, generation, repair, and packaging. The CLI owns enforceable contracts; the skill supplies agent judgment within them.

Create a separate project/skill package, leaving the taxonomy checkout read-only:

    taxonomy-to-lesson/
      SKILL.md
      references/
        tool-routing.md
        pedagogy.md
        domain-model-contract.md
        browser-validation.md
        provenance.md
      scripts/
        inspect_capabilities.py
        resolve_topics.py
        plan_sequence.py
        validate_manifest.py
        verify_artifact.py
      schemas/
        request.schema.json
        lesson-plan.schema.json
        artifact-manifest.schema.json
        validation-report.schema.json
      templates/
        html-svg/
        canvas-2d/
        three/
        hyperframes-video/
      adapters/
        browser-interaction/
        blender-headless/
        blender-mcp/
        hyperframes/
      fixtures/
        fractions/
        day-night/
        sentence-building/
        sound-prerequisite-conflict/

These are proposed components, not files implemented by this architecture task.

SKILL.md defines the workflow, loads only relevant references/upstream skills, invokes the scripts, and owns repair and handoff. Deterministic scripts resolve IDs, inspect the graph, enforce contracts, and validate results. The coding agent designs the experience and writes domain-specific code inside those boundaries.

Discover actual tools before planning. An upstream skill is guidance for an agent; it does not itself install a runtime or register a callable MCP server. Install pinned dependencies once in setup, and load pinned skill snapshots as needed. Do not refresh upstream main on each lesson run.

Start every task with a capability report. A missing optional tool may change the asset route; it must not silently change a requested output or remove a learning objective.

## 3. Architecture and data flow

    Request
      -> Taxonomy resolver and graph inspector
      -> Evidence-driven lesson planner
      -> Domain-model specification
      -> Capability-aware tool router
      -> Source and asset generation
      -> Browser/video adapters
      -> Functional, visual, content, and accessibility checks
      -> Accepted artifact + report

The three durable contracts are:
1. Lesson plan: what the child should understand and which action will demonstrate it.
2. Domain model: what is true about the simulated system, its assumptions, and how inputs change it.
3. Presentation contract: how a renderer exposes that model to the learner.

Renderers consume the domain model; animation callbacks never define scientific truth. A more elaborate renderer cannot compensate for a missing learning action or assessment.

## 4. Resolving topics and building sequences

- Read topic IDs, descriptions, evidence, assessment prompts, approximate age ranges, and standard keys.
- Match exact IDs first. For names, return candidates with subject, age, and domain; ambiguous matches need disambiguation before generating that topic. The dataset contains repeated names such as Understanding fractions.
- Take the caller's age when given. Otherwise choose an age within the topic range and record the assumption. Split a series if its age ranges or objectives do not form a reasonable single lesson.
- Interpret a dependency exactly as stored: topicId depends on prerequisiteId.
- Traverse the relevant transitive hard-prerequisite closure for ordering and gap detection. A depends on B depends on C must keep C before A even when B is not selected. Preserve the stored graph for provenance. Soft edges inform optional context, not mandatory expansion.
- Inspect omitted prerequisites and any prerequisites explicitly declared mastered. Unknown mastery stays unknown. Generate short, explicit scaffolding only when the concept is established and fits the scope; otherwise mark an assumption or a gap. Graph traversal does not authorize expanding the entire closure into a course.
- Limit the initial default batch to five topics and approximately three scenes per topic. Larger requests can be queued as separate lesson units without dropping any requested topic.
- Validate IDs, endpoints, duplicate records, self-links, and cycles. Inspect reasons for obvious semantic contradictions. Never reverse a stored edge to make its prose sound sensible.
- An affected plan enters needs_review when a prerequisite conflict cannot be resolved from trustworthy evidence. Independent branches may continue.
- Do not claim a digital activity satisfies physical evidence such as build a real communication device. Mark that criterion as partially addressed and provide a transfer task or narrow the stated scope.

Repository inspection on 2026-10-18:
- Commit 96a7933754af672e1bfdbf7ecb05c325860c6e0d contains 1,590 topics and 3,221 edges.
- A full topological traversal visits all 1,590 topics: the stored graph is acyclic.
- The edge from Vibrations & Sound to prerequisite Communication with Light & Sound has a reason that appears to describe the opposite direction. This is a semantic concern, not a proven corrected edge. See example-plan.json.
- The existing validator checks integrity and checksums but does not check multi-topic cycles or semantic validity.

## 5. Pedagogical planning before graphics

For every objective, declare whether this output demonstrates it, lets the child practise it, or assesses an observable response. For every claimed assessed objective, specify:
- A sourced concept and age-appropriate explanation.
- A misconception or contrast worth exploring.
- A prediction or purposeful question.
- An action the child can take that changes something relevant.
- An observable consequence.
- A check requiring the intended reasoning, rather than merely clicking through.
- A mapping to the exact evidence criterion, including partial or uncovered criteria.

Choose a learning pattern: manipulatives, causal simulation, structured comparison, process sequence, language construction, or branching scenario. Subject/type metadata is a hint; representation follows the objective and evidence.

Use predict -> explore -> explain -> check as a default pattern, adapting it when it does not fit. Provide reset, pause when relevant, keyboard/touch equivalents, readable labels, and reduced-motion behavior. Audio starts only after an explicit gesture and has a visual equivalent. Avoid scoring a child's knowledge from one interaction; report the observed response.

The first implementation should use a small catalog of reviewed domain models and lesson patterns. Unsupported topics can receive an experimental candidate, but cannot inherit a content-verified status from that catalog. A video can demonstrate a concept and provide follow-up prompts; it cannot observe a learner's performance.

## 6. Tool decision policy

Representation and output are separate decisions.

| Decision | Choose it when | Skip it when |
|---|---|---|
| Semantic HTML + SVG | Text, fractions, number lines, graphs, ordering, classification, and 2D relationships communicate the objective | Depth or hidden surfaces are necessary to the reasoning |
| Canvas 2D | Many moving 2D marks, particles, waves, or continuous fields make SVG costly | Semantic controls and ordinary diagrams suffice |
| Three.js | The learner needs rotation, viewpoint, occlusion, spatial scale, or a materially useful spatial model; or an explicit 3D request is feasible | 3D adds decoration while obscuring the teaching goal |
| GSAP | Transitions, guided sequences, emphasis, camera moves, and interruptible/reversible presentation animation | Direct input-to-model updates or a static view are sufficient |
| Procedural Three.js geometry | Simple spheres, blocks, containers, arrows, or wave surfaces can express the concept | Custom geometry materially improves recognition or instruction |
| Headless Blender Python | Reusable custom meshes, UVs, baked appearance, or authored clips are worth the asset build | Browser primitives or an existing licensed asset suffice |
| Blender MCP | A compatible MCP server and live addon are available and iterative scene inspection/authoring has a demonstrated benefit | Background scripted asset fabrication is sufficient or MCP is absent |
| HyperFrames video | An MP4, narrated/animated explanation, or scripted companion demonstration is requested | Only a free-form interactive experiment is requested |
| HyperFrames deck | A navigable presentation, fragments, and branching hotspots are explicitly requested | The learner needs continuous simulation controls rather than slide navigation |

Run blocking rules first. Then inspect representation rules in ascending numeric priority, selecting the first matching eligible route. Required capabilities and accessible equivalents must be checked before selection. A failed explicit representation or other user requirement stops that route with a reported limitation; it must not silently fall through to a different representation. A failed automatic route may use a declared fallback only if the learning contract survives. Orthogonal tool rules compose after representation selection.

Every decision records the selected tool, alternatives considered, instructional reason, capability evidence, cost estimate, and fallback consequences. A useful 3D reason is: the learner must rotate a solid to inspect faces hidden from the initial camera. Topic subject alone is not a sufficient reason.

User preferences can choose a supported representation. Explain its tradeoff in the plan and still meet accessibility and content requirements. Fallbacks must preserve requested output types, explicit representation requirements, required learner interactions, and learning objectives. A non-WebGL explanation supports access but does not automatically satisfy an assessment requiring free 3D rotation. Report any remaining loss rather than claiming equivalent completion.

routing-policy.json records the proposed rule order and default budgets. It is a declarative specification, not an executable router or an implemented configuration schema.

## 7. Domain model and shared rendering contract

A model exposes serializable state, validated actions, observables, invariant checks, and deterministic evaluation:

    initialState(parameters, seed)
    applyAction(state, action)
    observe(state)
    validateInvariants(state)

Choose one explicit model profile: analytic models provide stateAt(time, actionScript, parameters, seed); integrated models provide advanceFixedStep(state, dt) with replay and checkpoints. Event-only activities need no physical-time integrator. Seed any simulation or presentation randomness that affects reproducibility. Rendering reads the model and does not mutate it. Presentation easing must not alter conservation, equivalence, or other domain invariants.

An example: changing strike strength may change a displayed vibration amplitude while holding pitch fixed for the chosen simplified model. The UI and documentation state that simplification; an animation preset must not invent a pitch change.

The presentation layer supports:

    prepare(assetManifest)
    render(modelSnapshot, presentationTime)
    resize(viewport)
    dispose()

Interactive mode maps user actions to model events and draws the resulting state. Wall time schedules drawing; it does not define the export's model state. Learner events are session-local by default.

A video adapter supplies a fixed demonstration event script and reconstructs state at an arbitrary requested time. HyperFrames supplies frame time through hf-seek. Preload local assets, register readiness synchronously, and set an explicit root data-duration for Three.js compositions. Validate non-monotonic seek order, such as 4s -> 1s -> 4s.

Reuse model code, assets, and presentation components across outputs; expect separate interactive and video shells. An MP4 contains no live controls. A slideshow is a separate presentation output. The current HyperFrames slideshow guide warns that rendering its multiple roots can emit only the first slide; do not claim whole-deck MP4 support.

## 8. Cloud execution and capability handling

Verified in this running instance:
- Node 24 and npm 11, Python, uv, and FFmpeg are present.
- Blender 4.3.2 runs background Python, exports an uncompressed GLB, and CPU-renders a small scene.
- This Blender build lacks OpenImageDenoise. The successful CPU render sets scene.cycles.use_denoising = False.
- Draco compression is unavailable; the successful GLB export does not require Draco.
- Chromium 154 with Python Playwright can render WebGL 2 through SwiftShader. A drawn pixel and a button click were checked.
- The tested Chromium software-rendering arguments are --use-gl=angle, --use-angle=swiftshader, --enable-unsafe-swiftshader, and --disable-dev-shm-usage.
- No DISPLAY or /dev/dri device was observed.

Not yet verified:
- Blender MCP server/addon operation.
- Three.js + GSAP lesson integration.
- HyperFrames installation, integration, or full video rendering.
- Performance on a representative learner tablet or phone.

Use background Blender scripts by default here. Enable the MCP route only after a scene-read and small create/export round trip succeeds. Do not require cloud GPU access for the base workflow.

The software browser is for functional and rendering checks; its frame rate does not establish learner-device performance. Keep a named low-end-device performance check separate. Offline lesson playback requires local bundled dependencies, fonts, and assets; generation may still need permitted package/source access.

Use existing checkouts and do not create worktrees for ordinary cloud tasks. Store generated projects outside the taxonomy checkout. Environment install/start configuration should be saved only when implementation actually establishes tested commands; this architecture task does not modify that configuration.

## 9. Validation and acceptance states

received -> resolved -> planned -> model_spec_reviewed -> routed -> built -> model_implementation_verified -> validated -> ready

Additional states: needs_review, needs_content_review, blocked_capability, repairing, failed, and partial_batch. Each artifact and requested output has its own status. A reusable reviewed model can bring cached implementation evidence only if its validation fingerprint is current. New model code is tested after it exists. ready means this version passed its required gates, not that a human has reviewed it or that it is published.

Required gates:
1. Input: exact topic mapping, source fingerprint, graph sanity, bounded prerequisite scope.
2. Learning plan: every criterion declares demonstrated, practised, assessed, partial, or uncovered coverage; each assessed claim has an action and check. Gaps and simplifications are explicit.
3. Model: review quantities, units, rules, references, assumptions, and simplifications before generation. After generation, execute meaningful independent fixtures/invariants and boundary cases. Unverified new science stays needs_content_review. Clear this state only when essential claims have adequate reliable sources and the implementation passes meaningful independent checks; unresolved specialist or disputed claims require recorded expert review or narrower scope.
4. Build: pinned dependencies, valid manifests, successful bundle, assets present.
5. Function: Playwright performs the core learning interaction and verifies the expected model/visual response, assessment, reset, and relevant interruption/resume behavior.
6. Visual: inspect screenshots from the initial, changed, and assessment states at tablet/mobile sizes. Check that the causal change is visible and labels remain readable. Use tolerant image measures; do not promise pixel identity across hardware.
7. Accessibility: keyboard operation, equivalent actions to dragging, focus, touch targets, reduced motion, audio alternatives.
8. Output: validate each requested format. For MP4, run the actual HyperFrames checks/render and ffprobe duration/frame/audio checks. Do not infer video success from a browser screenshot.
9. Provenance: include source/topic references, asset origins/licenses, adapted content attribution, and validation limits.

Gate applicability is output-specific:

| Gate | Interactive browser | MP4 | Interactive deck |
|---|---|---|---|
| Topic, source, plan, content, and provenance | Required | Required | Required |
| Model checks for the presented behavior | Required | Required | Required where applicable |
| Learner actions, response checks, and reset | Required for declared interactions | Inapplicable: scripted demonstration, no observed learner response | Navigation, fragments, and declared learner interactions |
| Visual and accessible presentation | Required, including keyboard/touch | Readability and applicable caption/audio checks | Readability plus keyboard/touch navigation |
| Arbitrary seek, actual encode, duration/media checks | Only for a requested export | Required | Inapplicable unless a separate video composition is requested |

Record an inapplicable gate with its reason. It is neither passed nor skipped. Never use an inapplicable label to evade a required interaction.

Automation can test mechanics and domain fixtures. Automated visual/educational evaluation remains fallible. Track source_review_status, automated_content_checks, expert_review_status, and human_review_status separately; never fabricate a review or equate generated tests with an expert endorsement.

When a check fails, classify it as content, model, build, capability, assets, interaction, visual, or performance. Rerun only the affected stage after a diagnosis and meaningful correction. Default to two targeted repair attempts per stage and three visual-review passes, under a per-artifact budget. Exhaustion preserves the draft and reports the failure; it never relabels it as ready.

## 10. Resource budgets and reproducibility

Proposed starting budgets, to be calibrated against real lessons:
- One active Blender job and one video render; at most two browser validations.
- Five topics per default lesson batch, with larger requests queued into units.
- 100,000 visible triangles, 50 draw calls, 1,024px textures, and pixel ratio at most 1.5 for a standard interactive 3D scene.
- Approximately 2 MB of initial compressed transfer for 2D or 5 MB for 3D, including code, fonts, and initial assets; application JavaScript itself stays below 2 MB compressed.
- A 60-second, 720p, 30 fps starting cap for a requested video, with longer requests split or explicitly budgeted.
- A 120-second starting timeout for an individual asset-generation job; never silently lower the asset's instructional fidelity to meet it.

These are policy defaults, not measured device capabilities. Record exceptions and failed device-performance checks. Avoid high-detail fluid simulation, unbounded particle effects, expensive glass, and real-time GI in the first templates.

Pin the taxonomy commit, skill snapshots, package versions/lockfile, generator scripts, Blender version, fonts, Chromium, FFmpeg, and asset hashes. Never disable TLS, signatures, or artifact checksums to obtain dependencies.

Maintain four fingerprints:
- Generation-request fingerprint: canonical brief/topic hashes, policy version, plan/model/template and prompt hashes, generator/model configuration, referenced evidence snapshots, tool/skill versions, parameters, and asset sources.
- Accepted-source fingerprint: exact accepted source, model, asset hashes, dependency lock, and review decisions. Cache this immutable output rather than assuming a repeated generation request yields identical code.
- Render fingerprint: accepted-source fingerprint plus event script, seed, output parameters, and renderer/toolchain versions.
- Validation fingerprint: artifact hash, validator versions, acceptance-policy hash, relevant capability/device profile, and the scope/date of checks. Changed validators or acceptance requirements invalidate readiness even when the accepted source is reusable.

A seed does not make LLM generation reproducible. Cached accepted outputs support reruns; arbitrary regeneration may differ. Deterministic seek should be validated in a pinned runtime. Exact pixels or encoded video bytes can still differ across hardware/encoders.

Use content-addressed caches and atomic stage outputs. Shared assets/models can be reused across a sequence. A source or parameter change invalidates only dependent artifacts. Retry from the last valid stage without overwriting the accepted version.

## 11. Provenance and distribution

Store a per-artifact ledger for source claims, taxonomy snippets, adaptations, asset licenses, and versions. Keep application code, models/assets, taxonomy-derived authored content, and upstream curriculum standards distinguishable.

The taxonomy database is ODbL, Marble-authored text is CC BY-SA 4.0, and curriculum standards keep their own terms. A playable application does not erase attribution or share-alike obligations on adapted text. Codes-only sources are not permission to reconstruct and redistribute their restricted full text. Preserve PROVENANCE.md notices appropriate to the content actually used.

Generation should not require child accounts, uploaded child data, paid asset APIs, or private credentials by default. Additional external generators are optional adapters with explicit configuration and provenance.

## 12. Implementation sequence and measurable exit criteria

Phase 1: browser-first vertical slice.
- Start with topic resolution, plan/manifest schemas, a local CLI, capability inspection, HTML/SVG templates, optional GSAP guidance, and Playwright checks. Add a constrained procedural Three.js template as the second renderer.
- Use three fixtures: fractions/notation for SVG, day/night for meaningful 3D, and sentence building for language interaction.
- Exit when each fixture builds from its topic ID, fulfills its declared evidence subset, passes interaction/reset/accessibility checks, and carries a validation/provenance report.

Phase 2: bounded multi-topic planning and repairs.
- Add hard-edge ordering, explicit prerequisite scaffolds, ambiguity/conflict states, shared asset cache, batch manifest, and bounded repair loops.
- Exercise the sound-series prerequisite anomaly as a negative fixture: it must be flagged, not silently repaired.

Phase 3: headless Blender asset adapter.
- Generate an asset that materially improves one fixture, export GLB, test loading and visual meaning, and measure cost against procedural geometry.
- Keep MCP as an optional authoring adapter until its connection is tested.

Phase 4: deterministic video output.
- Add HyperFrames and a fixed demonstration event adapter sharing the model/assets.
- Verify arbitrary frame seeking, requested MP4 duration, example key states, and the parity of teaching behavior across interactive/video shells.
- Add interactive decks only when an actual presentation requirement exists.

Do not start with mass-producing all 1,590 topics. Establish an accepted model/pattern catalog and route unfamiliar concepts to explicit experimental status until content is grounded.

## 13. Source references

- [Taxonomy README](https://github.com/gabreginatto/os-taxonomy/blob/main/README.md)
- [Taxonomy provenance](https://github.com/gabreginatto/os-taxonomy/blob/main/PROVENANCE.md)
- [GSAP skills](https://github.com/greensock/gsap-skills)
- [HyperFrames](https://github.com/heygen-com/hyperframes)
- [HyperFrames Three.js adapter](https://github.com/heygen-com/hyperframes/blob/main/skills/hyperframes-animation/adapters/three.md)
- [HyperFrames determinism](https://github.com/heygen-com/hyperframes/blob/main/docs/concepts/determinism.mdx)
- [HyperFrames slideshow contract](https://github.com/heygen-com/hyperframes/blob/main/skills/slideshow/SKILL.md)
- [MCP for Blender](https://github.com/ahujasid/mcp-for-blender)

Upstream references were inspected for this design. Implementation must resolve and record immutable versions rather than assuming main stays compatible.

