# Save the Space Mission

Design direction for a shared activity for ages 10 and 15. This document is an authored design, not evidence of learner testing. Use the same progressive experience for both ages; let causal explanation and the optional transfer discussion provide depth. Do not add age tracks, scores, timers or menus of lessons.

## The experience

A chunky coral-and-cream toy rocket carries glowing star-seeds from a tiny space station to a turquoise Moon Garden. The learner imagines a failed delivery, identifies a cause, makes one change and runs a flight rehearsal. A rehearsal makes the consequence tangible: seeds escape through an open hatch, or the sleeping garden beacon sends the rocket to an empty moon. The learner improves the design and checks the actual delivery.

The central question is **What would make this mission fail?** Every repair must connect to a failure path. The visual payoff is the seeds arriving and the Moon Garden blooming. Fixing a decorative badge provides no delivery benefit. Launching an empty rocket prevents seeds spilling but also prevents delivery. This boundary is the conceptual heart of the lesson: preventing an unwanted event can still miss the positive goal.

This is an explicitly fictional toy system. It does not teach real rocket operations, numerical reliability, fault probabilities or a guarantee of real-world success. Avoid quotes or attributed historical claims that depend on the unauthenticated Munger transcript. The local definition is sufficient: ask what could prevent a goal; remove avoidable failure paths; still check whether the goal happened.

## First-run clarity

Title: **Save the Space Mission**

Subtitle: **Think about how it could fail. Then change the plan.**

Persistent compact mission line: **Deliver the star-seeds to the Moon Garden.**

Small scene caption: **A pretend mission. Every flight is a rehearsal.**

One active question sits immediately above the scene; one primary commit button sits immediately below the active choices. A click selects or previews; a clearly named button commits. Highlight a selected object with a ring and its name. Do not silently change what the same click does. A new phase moves focus to its question and announces it politely. Do not introduce the name “inversion” until the first successful rehearsal.

The prior Choice Islands failure came from concurrent scores, controls, modes and vocabulary. Carry forward its corrected hierarchy: question → tangible scene → current choice → commit. Never show the entire state machine as a dashboard.

## Two missions and a short finish

### 1. Learn with one failure path

Initial conditions: seeds loaded, hatch open, garden beacon on. The beacon and destination are visible context; only the hatch and a crooked decorative badge need active picking.

Start in `briefing`, with **Run the first rehearsal** as the sole primary action. It computes and stores the unfixed baseline, showing seeds escape on the way to the garden. Baseline result: **Right moon. No seeds.** “The rocket arrived, but the seeds floated out on the way.” Primary **Find the cause** enters inspection. This is a worked observation before the learner's first diagnosis; do not count the watched flight as a learner prediction.

Prompt: **Imagine the seeds never reach the garden. What could cause that?**

Supporting line: **Tap a part of the rocket to investigate.**

Accessible picks: **Open cargo hatch** and **Crooked star badge**. The hatch must visibly expose the glowing cargo; the badge must visibly be a cosmetic sticker.

On hatch selection, preview: **The cargo hatch is open.** Primary: **Predict what happens**.

Prediction prompt: **What could this open hatch cause?** Options: **Seeds float out** / **The rocket chooses the wrong moon**. Commit: **Choose a change**. Keep the prediction in state, then let the subsequent rehearsal show whether it matched. Do not mark predictions correct on mere selection.

On badge selection, preview: **The badge is crooked. It decorates the rocket.** Prediction prompt: **What could this crooked badge cause?** Options: **The rocket looks untidy** / **Seeds float out**. The cosmetic choice can be rehearsed; it should not be an invisible disabled answer.

Repair prompt: **What will you change before the rehearsal?**

- Hatch: **Close the hatch** / **Leave the seeds behind**.
- Badge: **Straighten the badge**.

Selecting a repair previews it and enables **Run the rehearsal**. A **Choose another part** link returns to inspection and clears dependent prediction/repair selections.

Constraint appears here, when relevant: **Change one thing, then test it.** This is a workshop rule, not a repair budget or numerical resource economy. Changes accumulate between rehearsals. Each rehearsal starts with a fresh matching load of seeds if the configured load is enabled; an animation must not permanently destroy the workshop stock.

Result heading and copy:

- Hatch closed: **The seeds arrived!** “Closing the hatch stopped the seeds escaping. The garden beacon guided them to the right moon.”
- Badge only: **A tidier rocket. Still no delivery.** “The badge changed, but the open hatch let the seeds escape. Which part caused the loss?”
- Empty rocket: **Nothing spilled. Nothing arrived.** “Leaving the seeds behind prevented a spill, but our goal was to deliver seeds. Preventing one failure is not enough.”

The result shows a concrete causal strip, with text as well as graphics: **Open hatch → seeds escape → no delivery** or **Closed hatch → seeds stay aboard → garden receives seeds**. Compare the prediction to the selected component's **pre-change** causal effect, because the chosen repair intentionally changes the outcome. If the prediction was wrong: **You predicted [prediction]. Before the change, [component] caused [actual cause]. After the change, [observed result].** Keep this a comparison, not an accusation. Never mark “seeds escape” wrong merely because a subsequent hatch repair prevented the spill.

Failed result CTA: **Change the plan**. Secondary **Undo this change** restores the pre-rehearsal configuration and returns to inspection, clearing the dependent prediction and repair. This is particularly important after removing the seeds; the conceptual counterexample must not create a long recovery chore. Returning to the cargo module with an empty rocket also exposes **Load the seeds**, so repair remains possible without undo. A compact **Restart this mission** is also available.

After success, teaching reveal: **You worked backward.** “You asked what could stop the delivery, then removed a cause. That way of thinking is called **inversion**.” Primary: **Try the next mission**.

### 2. Two independent failure paths

New conditions: seeds loaded, hatch open, garden beacon asleep, crooked badge. Reset these explicitly with a visible new-mission announcement; do not imply the learner's previous fix randomly broke.

Compute and store this new mission's baseline immediately. Show the two-failure result with the new-mission announcement, then **Find the causes** to inspect. Do not require a second introductory launch click. Prediction questions concern the selected component's consequence, not the entire combined flight. An open hatch predicts seed loss even when the beacon independently sends the rocket to the wrong moon.

Heading: **A new rocket. Two ways to miss the goal.**

Prompt: **What could stop this delivery?**

Supporting line: **Inspect a part, predict the problem, then change one thing.**

Now all three scene objects can be inspected: hatch, beacon, badge. Use the same prediction/repair/rehearsal interaction. Beacon preview: **The garden beacon is asleep. In this toy world, a sleeping beacon sends the rocket to the empty moon.** Prediction options: **The rocket goes to the empty moon** / **Seeds float out**. Repairs: **Wake the garden beacon** / **Polish its casing**. Polishing is cosmetic, does not change beacon state, and must be disclosed as cleaning rather than a misleading status change.

After hatch alone: **Seeds safe. Wrong moon.** “Closing the hatch solved the cargo problem. The sleeping beacon still sent the rocket away from the garden.”

After beacon alone: **Right moon. No seeds.** “Waking the beacon fixed the destination. The open hatch still let the seeds escape.”

After both, with seeds loaded: **Delivery complete!** “The seeds stayed aboard and reached the Moon Garden.” Show two simple positive result labels, **Seeds delivered** and **Right destination**. Do not replace the goal with “all repairs checked.”

Keep only the latest rehearsal result prominent. A collapsed **What changed?** may compare before/after states for older learners, but no history table is needed for the main flow.

### 3. Check the limits, then transfer

After a successful second mission, prompt: **We blocked the failures in this rehearsal. What can we conclude?**

Choices: **This rehearsal worked. A real mission could have problems we did not include.** / **Fixing these two things guarantees every mission will work.** Commit: **Check my conclusion**.

Incorrect feedback: **We checked this toy system. A real mission can have other causes of failure. Check the result and stay open to new problems.** Remain in the question and allow retry. Correct feedback: **Yes. Prevent the failures you can find, then check whether the goal happened.**

Final compact recap: **Goal → imagine failure → trace the cause → change the plan → test the goal.**

Optional **Talk it through**: “Your group wants to finish a school project by Friday. What could stop that happening? Name one cause, a change that addresses it, and a way to check whether the project is actually finished.” Older-learner follow-up: “Could one cause create several problems? What might your plan have missed?” This conversation is unassessed; do not infer transfer from seeing it.

## Minimal domain contract

Use pure serializable state. Suggested fields:

```js
{
  mission: 'learn', // learn | challenge
  phase: 'briefing', // briefing | baselineResult | inspect | predict | repair | result | reveal | conclusion | complete
  config: { hatchClosed: false, beaconAwake: true, cargoLoaded: true, badgeStraight: false },
  selectedPart: null,
  prediction: null,
  selectedRepair: null,
  lastRehearsal: null,
  history: [],
  conclusion: null,
  conclusionSubmitted: false
}
```

Actions should be phase guarded: `runBaseline`, `inspectBaseline`, `selectPart`, `confirmPart`, `selectPrediction`, `confirmPrediction`, `selectRepair`, `rehearse`, `changePlan`, `undoChange`, `nextMission`, `selectConclusion`, `checkConclusion`, `restartMission`, `reset`. The renderer must never determine correctness, finish a mission or consume cargo in a tween callback. Wrong predictions do not block repair; evidence from the rehearsal resolves them. The limitation conclusion is the final correctness gate.

Domain rules for each rehearsal:

```js
destination = beaconAwake ? 'garden' : 'empty-moon';
seedsEscaped = cargoLoaded && !hatchClosed;
seedsOnArrival = cargoLoaded && hatchClosed;
delivered = seedsOnArrival && destination === 'garden';
```

Empty cargo is a distinct failure cause, not “seeds escaped.” Badge/polish changes have no causal effect on delivery. A rehearsal records the configuration, prediction, selected change and all outcome fields. Both open hatch and sleeping beacon can matter simultaneously: do not report only the first failure and silently suppress the second. Keep the causal trace separate from the task's two success criteria.

Predictions are response-level evidence. Repairing everything does not retrospectively turn an incorrect prediction into a correct one. Track prediction matches separately from completion. Final `assess` may establish completion of this authored response sequence and a correct limitation conclusion; it must not report general model mastery or invent a combined score.

Recommended independent fixtures: (1) open hatch + awake beacon loses loaded seeds at garden; (2) closed hatch + sleeping beacon retains seeds at wrong moon; (3) both causes present yields wrong moon and spilled seeds; (4) both addressed delivers; (5) empty rocket never delivers even with both addressed; (6) straight badge alone cannot alter delivery; (7) polishing beacon cannot wake it; (8) repair order does not change final goal outcome; (9) wrong conclusion cannot complete; (10) resetting/starting new mission clears dependent answers; (11) invalid phase actions do not bypass reasoning; (12) reloading cargo restores a valid recovery path.

## Visual direction

Build one coherent toy world with Three.js primitives. A broad lavender launch-station disc anchors a tall coral rocket with cream capsule, teal fins and round dark porthole. Glowing lemon cargo is visible through the hinged side hatch. A turquoise beacon dish stands on a low pedestal beside it. A small gold badge is physically attached to the rocket. Two destination islands sit in the upper background: a teal garden with a transparent dome and tiny sprouts, and a quiet grey empty moon. Stars stay subtle and static. No stock photos, floating control-room panels or interchangeable abstract cubes.

Use a fixed gentle three-quarter camera, strong soft lighting and clearly separated silhouettes. The launch-pad ellipse, hatch depth, visible cargo and flight to distinct destinations justify the requested spatial interaction. Keep orbit controls out of the teaching path. Actual raycasts and HTML labels dispatch the same actions.

Desktop: maximum content width about 1040px; compact header; prompt above a roughly 500px-high scene; choices/commit in the lower scene card or adjoining compact rail. The current question, targets and action should fit together at 1365×900. Do not let the title dominate the viewport.

Phone: 16px page gutters, compact title, prompt, a 290–330px scene, then active label buttons and commit. Place the rocket near center-left and the beacon right-front. Keep moons high and small but recognizable. Place the hatch label by its visible opening, beacon label by its dish and badge label by its sticker; use unobtrusive leader lines if needed. HTML labels may form a short row beneath the stage as keyboard equivalents, but the 3D objects must remain directly selectable. Labels cannot overlap the rocket or each other at 390px width.

Scene transitions are brief and causal: hinge closes; seeds visibly escape if appropriate; rocket moves to the actual modeled destination; garden sprouts only when seeds arrive. On reduced motion, immediately show a clear static result with the same text. The canonical model result exists before animation starts. An unobtrusive **Show result** control may skip a longer flight; never require waiting for a tween to advance.

Selection/status text accompanies color. Use large touch targets and visible focus. Readable HTML text carries all questions and causal explanations. Scene state summaries make the visual relationships available without sight. No audio is required. No child accounts, telemetry or persistent learner profiles.

## Evidence and release acceptance

The taxonomy has no direct inversion evidence. Prefer the Comparing Design Solutions foundation (`mt_nNYo5A-7Bl`, evidence indices 1 and 2) if the implementation compares rehearsal results and recommends changes from those results. Preserve exact evidence text and partial scope; this digital toy does not assess all physical design practice. Alternatively, Simple Design Problems (`mt_Z5-fSCOBep`, indices 1 and 2) supports criteria/constraint framing only; simply displaying the mission and workshop rule is demonstration, not assessed identification. If claiming assessed criteria, explicitly check that the learner distinguishes seeds delivered to the garden from merely leaving the launchpad or arriving empty. Do not claim two foundation sets were assessed by a single generic completion result.

Local inversion objectives, independent failure routes, the empty-cargo counterexample and the guarantee question are authored extensions. Age 10/15 suitability is a design assumption. Expert review, family feedback and real-device performance remain distinct from source review and automated browser checks.

Before publication, verify and visually inspect: initial laptop and phone; selected hatch/prediction; failed badge rehearsal; empty-cargo outcome and recovery; hatch-only challenge result; beacon-only result; successful garden delivery; incorrect and correct conclusion. Confirm the actual 3D raycasts as well as label buttons, keyboard operation, touch-size targets, focus after phase changes, reset, reduced motion, and no horizontal overflow. The first screen must make the first action obvious without a parent explaining the controls.

Design director review is required on representative actual screenshots before publication. A complete model and passing tests alone do not establish visual clarity.
