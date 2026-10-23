# Original educational models: teaching and production standards

## Purpose and scope

Create original interactive models for the user's children with the level of
care seen at [Visual Learning](https://visual-learning.app/). Learn its production
methods: believable construction, visible mechanisms, coherent measurements,
clear steps, and painstaking visual review. Choose our own objects, explanations,
experiments, and compositions. Reusing the licensed Anatomy drawing kit is welcome;
reusing the site's finished lessons is not the default solution.

This guide applies to machines, instruments, scientific systems, mathematical
manipulatives, and other educational models. Follow [the learning-design rules](../AGENTS.md)
and [the current handoff](../../AI_HANDOFF.md) alongside it. The established game
direction remains colorful, tactile 3D with direct interaction; Anatomy is an optional
route for suitable mechanisms, not the default style for every lesson. The rejected
opportunity-cost Anatomy prototype remains an evaluation artifact.

Read [ARCHITECTURE.md](ARCHITECTURE.md) for the design contracts and
[IMPLEMENTATION.md](IMPLEMENTATION.md) plus [the package README](../README.md) for
implemented capabilities. The compiler, custom plugin contract, and an Anatomy
evaluation already exist; this guide does not imply automatic generation or content
verification of arbitrary models.

## Read before building

- Resolve learning objectives and evidence from `../../data/topics.json`
  and prerequisites from `../../data/dependencies.json`. Keep source taxonomy data
  unchanged for artifact generation; keep authored lessons under `learning-artifacts/`
  and generated builds in ignored `output/` directories.
- When Anatomy fits the requested model, read
  [its skill](https://github.com/wheresryan22/anatomy/blob/1482e8469b0a9e0d8cc18ea2740a01423d29ae80/SKILL.md),
  [craft](https://github.com/wheresryan22/anatomy/blob/1482e8469b0a9e0d8cc18ea2740a01423d29ae80/references/craft.md),
  [motion](https://github.com/wheresryan22/anatomy/blob/1482e8469b0a9e0d8cc18ea2740a01423d29ae80/references/motion.md), and
  [verification](https://github.com/wheresryan22/anatomy/blob/1482e8469b0a9e0d8cc18ea2740a01423d29ae80/references/verify.md) guidance.
  Open the closest example's source before designing our own model.
- Read its `references/kit.md` for implementation, `references/webgl.md` before
  shaders, and `references/3d.md` before using Anatomy's optional 3D mode.
- Restore the reviewed kit with `bash learning-artifacts/scripts/install-anatomy.sh`
  from the repository root. The existing installer pins the revision below and preserves
  an existing checkout. It accepts `ANATOMY_SKILL_DIR`; otherwise it uses
  `~/.agents/skills/anatomy`. Read the local files there; the links above provide
  pinned upstream references that also work in a fresh checkout.
- Start with the installed version. Record its commit in each artifact's provenance;
  do not silently update it during a lesson build.

## Plan the learning before the picture

Write a short lesson plan before geometry. Include topic IDs, assumed or supplied
age and language, prerequisite gaps, one central question, a likely misconception,
the learner's action, the observable consequence, and an independent check.
Use the family context in `AI_HANDOFF.md` (ages 10 and 15 unless the user updates
it). Do not infer prior mastery from age or the available taxonomy.

Use predict -> explore -> explain -> check where appropriate. A child must be able
to do something relevant: change a quantity, choose a configuration, manipulate a
representation, classify, construct, or predict a result. A sequence that only
plays an animation is a demonstration; label its coverage accordingly. Map each
evidence criterion to demonstrated, practised, assessed, partial, or uncovered.
Add a physical transfer task when the criterion requires real-world investigation.

Use a few meaningful controls and progressive disclosure. Put advanced formulas
and technical detail in an optional explanation. Keep the mechanism rich while
making the immediate question and action easy to understand. Record observed
responses rather than awarding mastery from a click or a single successful trial.

## Select a representation that explains the idea

- Use Anatomy's isometric SVG for mechanisms and instruments where construction,
  internal connections, or moving parts explain the concept.
- For fractions, sentences, classification, and similar objectives, use clear
  manipulatives or semantic HTML/SVG. Do not invent a complicated machine solely
  to make the page resemble the reference site.
- Use true 3D when viewpoint, rotation, occlusion, or spatial relationships matter
  to the learner's reasoning. An isometric drawing does not require WebGL or Blender.
- Add WebGL only for phenomena that benefit from it, such as waves or light. Keep
  the physical apparatus and accessible controls usable if that effect is unavailable.
- Make an original composition. A familiar real machine may be the subject, but
  design its model, framing, narration, and teaching tasks for our objective.

## Build one trustworthy model

Before animation, specify quantities, units, valid input ranges, relationships,
sources, assumptions, and intentional simplifications. Distinguish a literal
scientific model from a teaching analogy and explain where an analogy stops applying.

Keep model state/actions/observables separate from rendering. Geometry, movement,
readouts, captions, and assessment must agree with the same model state. Avoid
unrelated counters, hardcoded claims that drift from parameters, or phase labels
paired with a measurement from a different instant. Presentation easing must not
change scientific relationships; account explicitly for any simulated gauge lag.

Check meaningful invariants and independent reference cases: gear relationships,
conservation, counts, limits, units, and boundary behavior as relevant. A polished
drawing or a passing geometry audit does not verify the science. Precomputed
trajectories are acceptable if their generating model, parameters, and checks
are retained. Recompute when inputs change. Label scripted/seeded randomness;
do not present replaying one fixed sequence as independent experimental trials.

## Visual craft

1. **Design the mechanism first.** State what moves and what that movement explains.
   Plan assemblies, functional parts, supports, connections, controls, and camera
   before drawing. For an Anatomy machine, use its Figure tier (roughly 40–80
   purposeful parts) as a starting point. Part count is not a quality score; a
   simpler non-machine model should remain simple. Document instructional reasons
   for departures rather than adding meaningless detail.
2. **Make construction believable.** Give parts thickness, real mounts, aligned
   shafts, plausible joints, and working clearances. Cables end at connectors;
   tubes meet ports; supports touch what they carry. Use cutaways or exploded
   assemblies only when they reveal relationships needed for the explanation.
3. **Make the focal point clear.** Use restrained colors, coherent shading, lighter
   tops, and clear depth. Emphasize the current mechanism. Use color consistently
   when it carries meaning, with labels or shapes as an additional cue.
4. **Earn detail.** Add actual screws, seals, bevels, grooves, scales, bushings, and
   other features that belong to the object. Seams and textures end on an edge or
   fade naturally. Avoid floating connectors, unsupported parts, arbitrary clutter,
   and decorative complexity that hides the lesson.
5. **Handle occlusion correctly.** Draw near surfaces over far surfaces, split
   wrapping geometry, and update ordering when parts move. Fix intersections in
   geometry rather than hiding them with draw-order tricks. Audit the true shapes
   that are drawn, including intermediate and reversed motion.
6. **Compose for learning.** For Anatomy figures, start with a light surface. Across
   representations, preserve the requested visual direction and a clear hierarchy:
   question/title, large model, nearby controls, compact readouts, short explanation.
   The reference kit's 45-degree azimuth, 30-degree elevation, and 55–65% card fill
   are useful starting points, not mandatory dimensions. Frame the full motion.
   Keep child-facing labels readable; tiny engraved labels are not sufficient.
7. **Inspect at two scales.** At normal size the object and causal change must be
   immediately legible. At 4x, inspect every important joint, connection, curved
   surface, texture boundary, and cutaway. A clean initial screenshot is insufficient.

## Interaction and motion

- Default lesson mode is manual so a prediction can happen before the reveal.
  An optional demonstration/tour must be explicitly controllable. It must not
  resume over a child's experiment or answer after a short idle timeout.
- Provide reset and, where motion needs observation, pause/replay or explicit
  steps. Show the current phase and explain why a step is unavailable.
- Use purposeful, time-based motion. Reuse static geometry and transform it;
  rebuild only shapes that actually change. Stop unnecessary work offscreen/at rest.
- Test takeover, repeated input, mid-motion reversal, reset during a transition,
  and return from a background tab. No parts teleport, detach, intersect, or leave
  the readings describing the previous state.
- Give touch and keyboard alternatives to dragging/hover, visible focus, readable
  labels, and comfortable touch targets. Reduced motion must preserve control and
  learning through still states. Announce phase changes, not per-frame numbers.
- For physical simulations, use the architecture's explicit model time/integration
  policy; decorative easing and wall-clock frame timing must not define physical truth.

These are deliberate adaptations of the reference for child-led lessons: readable
labels, instructional colors, and manual prediction pauses take precedence over
copying the upstream aesthetic or idle-tour defaults exactly.

## Acceptance: evidence required before calling a lesson ready

Keep a brief validation report with passed, failed, unrun, and inapplicable checks
(and reasons), plus paths to the relevant evidence. Never equate unrun with passed.

| Area | Required evidence |
| --- | --- |
| Learning | Objective-to-action/check mapping; assumptions and coverage gaps stated. |
| Content/model | Sources, simplifications, independent model checks, boundary cases, agreement of readouts and visible state. |
| Function | Core child interaction, changed result, assessment, reset, and relevant interruption/reversal scenarios exercised. |
| Visual | Desktop, tablet, and 390 px phone captures; initial, changed, and assessment states; 4x junction details and motion contact sheets where relevant. Open and inspect the images. |
| Geometry | Applicable Anatomy audits pass with zero unresolved failures; recorded shapes match the drawing. Check assembled, apart, and intervening/reversed motion when supported. |
| Line work | Anatomy line-end checks pass for applicable SVG figures and resting poses; intentional exceptions are documented and visually inspected. |
| Access | Keyboard/touch, focus, reduced motion, readable longest labels/readouts, no horizontal overflow, audio alternatives where applicable. |
| Effects | For shaders/3D: relevant transition/orbit checks, light-theme inspection, and meaningful fallback verification. Test every shipped theme. |
| Performance | State the device/profile tested and limitations. Cloud software rendering does not establish performance on a child's tablet. |

Use the installed skill's documented `capture.mjs`, `drive.mjs`, `lines.mjs`,
geometry audit, and optional `turn-check.mjs` through tools permitted in the session.
For example, after wiring the audit into the generated project's build, run
`node build.mjs --audit`. Do not assume a flag alone adds an audit. Quick/partial
audits support iteration but do not replace applicable full acceptance checks.
If browser inspection is unavailable, record that limitation and leave visual and
interaction verification unrun; source inspection is not an interaction test.

Repair substantive content, construction, visibility, and interaction faults before
adding polish. Do not relax checks, use dummy audit shapes, or shrink geometry to
make a validator pass. A numeric audit and a visual review are complementary.

## Deliverables and provenance

Keep editable source, lesson plan, domain model, build instructions, source/asset
credits, and validation evidence together with the playable artifact. Bundle needed
runtime assets for any promised offline use. Preserve the Anatomy MIT notice when
redistributing its code and the taxonomy's applicable attribution/content notices.
Do not infer that the site's finished artwork is MIT merely because its kit is.
Publishing is a separate operation governed by the user's request.

## Basis for these instructions

Reviewed on 2026-10-23. Installed Anatomy revision:
`1482e8469b0a9e0d8cc18ea2740a01423d29ae80`.

- [Visual Learning](https://visual-learning.app/) credits Anatomy. Public page source
  for the [sharpener](https://visual-learning.app/pencil-sharpener) exposes ordered
  step definitions, phase hints, manual/auto mode, shared updates, reset, keyboard
  advance, and reduced-motion handling. Those patterns informed the interaction guide.
- The [coaster](https://visual-learning.app/roller-coaster) source reads position,
  speed, height, and energy from precomputed step rows. This supports the shared-state
  pattern; it does not establish that every scientific claim has been verified.
- The [capsule machine](https://visual-learning.app/capsule-toy-machine) contains a
  fixed draw sequence, motivating the distinction between demonstration and experiment.
- [Anatomy's pinned source](https://github.com/wheresryan22/anatomy/tree/1482e8469b0a9e0d8cc18ea2740a01423d29ae80)
  supplies the detailed construction, depth, motion, audit, and close-up practices.
  Its `examples/ripple-tank/model.mjs` shows separate domain calculations; its
  `examples/test-rig/rig.ts` shows reusable state and derived geometry/readouts.
- The bundled ripple-tank and exploded-engine reference images were visually
  inspected. They demonstrate the kit's finish, not proof of tests on our future work.

This was a review of public implementation, upstream instructions, sample model
code, and bundled reference images. It was not access to the site author's private
prompts or a live-browser certification of the site. The learning requirements and
child-friendly adaptations above are our production policy.
