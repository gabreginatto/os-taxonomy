# Guidelines for the future lesson-generation skill

Status: original course-design proposal informed by retrieved Munger-associated text and the local taxonomy. These instructions do not create an installed skill, finished lesson, validated intervention or learner profile. Use them alongside the [artifact architecture](../learning-artifacts/docs/ARCHITECTURE.md); the compiler’s actual current schemas and supported capability reports take precedence over speculative field names here.

## Start from a reasoning outcome

A learner should use a model to improve a justified choice, not merely recite its label. Start with a small, relevant problem and specify an observable **objective → action → check → transfer** chain. Ask for a prediction before revealing an outcome, allow exploration, request an explanation, and then change the context. Include a case where the model is insufficient, uncertain, or inapplicable.

For example, opportunity cost can use a pretend school-fair budget. The objective is to identify the best feasible alternative forgone. The learner chooses a feasible plan, compares it with a runner-up, and explains what was sacrificed. The transfer check changes the limiting resource from tokens to time. A correct token total alone does not demonstrate opportunity-cost reasoning.

Every claimed assessment must include a source concept, likely misconception, learner action that changes a relevant variable, observable result, explanation prompt and exact evidence mapping. A video can show these steps and supply prompts but cannot observe the learner’s response. Never score mastery from one click, one answer, age, enjoyment, or a completed animation.

## Resolve the taxonomy carefully

Use exact `topicId` values from [mental-models.json](mental-models.json), then read the current topic’s full description, evidence, assessment prompt and age range. Names are not unique. Verify the taxonomy hashes or explicitly review changed data before regenerating a course.

Treat each role differently:

| Role | What it permits | What it does not establish |
|---|---|---|
| `direct_support` | A named component with exact usable evidence criteria can inform an objective | The complete mental model, transfer, or any learner’s mastery |
| `foundation` | Scaffold a prior skill or investigate explicit conceptual overlap | Full target coverage; descriptions and prompts are not tested criteria |
| `analogy_only` | Teach a concrete source example and ask where the analogy holds or breaks | That a source-domain result proves a social, economic or psychological claim |
| `missing` | Create a clearly labeled original objective requiring content review | A new taxonomy ID, an existing standard match, or “covered” status |

Some `evidence` arrays contain research references rather than performance criteria. `mt_obF-6VYRya` is an example. `mt_JiZ3H90Xg8` explicitly describes availability and groupthink but has `evidence: []`; `mt_NPTjGJIyb3` describes ecological cascades but also has no evidence entries. Do not convert those fields into assessed coverage. The package marks description/prompt support and proposes its own checks separately.

Every mapping snapshots its **direct hard prerequisites**, including original direction and reason. Interpret `topicId` as depending on `prerequisiteId`. At generation time, traverse the relevant transitive hard closure with the compiler, order prerequisites first, and diagnose semantic conflicts. Soft edges provide context. This research package checks global acyclicity and snapshots direct edges; it does not replace a per-lesson closure analysis or validate every edge’s educational meaning.

A known sound edge appears semantically reversed in its prose: `mt_VBl1T1sFCM` depends on `mt_ZL9qVVnpwN`. Retain it and mark any affected plan `needs_review`; never “fix” direction from the reason text. Unknown readiness remains unknown. Use a short diagnostic, show a narrow scaffold when justified, or split a unit. Do not expand an entire large prerequisite closure into one lesson or silently declare omitted skills mastered.

## Build age pathways without lowering the intellectual goal

Use the proposed bands in [age-pathways.md](age-pathways.md). For ages 6–8, use visible counters, short stories and an explanation in the learner’s own words; introduce probability qualitatively and comparative advantage as cooperation rather than claim a formal proof. For ages 9–12, add tables, explicit trade-offs, multiple explanations and repeated observations. For ages 13–17, add conditional counts, rates, causal assumptions, competing models and written decision memos after checking prerequisites.

Dataset topic ages are curriculum metadata, not a learner diagnosis. The dataset’s upper age endpoint is 15; advanced extensions for older teens have substantial gaps. The three bands are a proposed course structure, not an assertion of a canonical Munger curriculum or a promise that every listed topic suits every learner in that band.

Psychology lessons should develop evidence checks, agency and respectful disagreement. Use disclosed fictional claims and invented datasets. Do not secretly manipulate children, reenact coercive obedience studies, diagnose a child or family member as biased, or teach strategies for exploiting others. Authority lessons should teach asking for reasons and checking relevant expertise. Financial examples use pretend tokens, budgets and clearly bounded arithmetic; they are not investment recommendations, trading games or promises of wealth.

## Keep domain truth separate from presentation

Define state, parameters, update rules, assumptions, invariants and expected observations before choosing graphics. Keep the domain model independent of renderer callbacks. Use seeded randomness for reproducible checks and allow exploratory reruns. Mark fictional data and toy mechanisms visibly; animation is not evidence that a psychological mechanism is real.

Examples of meaningful invariants:

- A budget never silently overspends; feasible alternatives obey the same constraints.
- Probability outputs remain in `[0, 1]`, conditional counts use the correct subgroup, and a larger sample is not promised to move monotonically closer to theory.
- A compounding table uses the current total each round and distinguishes proportional change from fixed additions. State rounding and resource caps.
- A natural-selection simulation tracks populations over generations with explicit inheritance and reproduction; organisms do not choose new heritable traits because they need them.
- A feedback model includes an explicit return path and time update. A causal chain alone is not called a loop.
- A comparative-advantage table uses opportunity costs. Merely assigning each task to the fastest person is not a demonstration.
- A lollapalooza activity distinguishes listed causes from a tested interaction. Invented effect sizes never become factual psychology claims.

A renderer’s successful build does not confer scientific validity. Unsupported causal or psychological simulations remain experimental candidates until reviewed. A visually plausible chart with a false update rule fails the content contract.

## Route tools by instructional need

Use a playable browser artifact as the primary output. Semantic HTML and SVG are the default for choices, cards, counters, tables, diagrams and graphs. Use Canvas for dense continuous 2D marks only when useful. Use 3D when rotation, depth or occlusion is necessary for the reasoning, such as examining a structural design; an abstract decision rule does not need a spinning scene.

Procedural primitives usually suffice. Use Blender only for custom assets that materially improve understanding and have an actual working toolchain; record asset provenance and licensing. Use HyperFrames as an optional requested video or deck adapter. Preserve learning goals and requested outputs when a capability is missing; report any loss rather than silently downgrading the request.

Provide keyboard/touch equivalents, readable text, visible focus, meaningful labels, reduced motion, reset, and pause when time matters. Sound is opt-in with a visual equivalent. If a taxonomy criterion requires building or testing a physical object, a digital activity only partially addresses it; offer a safe physical transfer task and make the scope explicit.

## Package evidence honestly

For each unit, retain exact taxonomy IDs, supporting fields and indices, cited source/anchor IDs, original versus sourced claims, explicit gaps, prerequisite decisions, age assumptions, domain rules, tool routing and acceptance checks. Treat this JSON as reference input to the planner, not as an already compatible compiler request or an authority to bypass its schemas.

Required validation should exercise content, the relevant domain invariants, learner actions and reset, browser behavior, accessibility and source resolution. Record passed, failed, skipped and unrun checks separately. Physical transfer and learner testing remain unrun unless actually observed. Track an individual’s response without manufacturing a long-term mastery score. No lessons in this package have been built or learner-tested.

Use conservative acceptance gates: invalid references fail; unresolved prerequisite contradictions block the affected branch; unreviewed missing objectives and unofficial-source attributions remain visibly provisional. Independent valid branches can continue. Before public release, resolve the source-authentication limitation described in [sources.md](sources.md) and review empirical psychology claims with current evidence.
