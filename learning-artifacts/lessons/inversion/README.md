# Save the Moon Garden — inversion through a toy mission

A Three.js game for ages 10 and 15, with Astra as design director. [Play Save the Moon Garden](https://gabreginatto-learning-lab.web.app/inversion/). A rocket must deliver all three glowing star-seeds to the Moon Garden. The learner works backward from a failed delivery, predicts a cause, changes one thing and checks the result.

The [design brief](design-brief.md) sets the direction; [Astra’s design review](design-review.md) records the implementation and screenshot review. Those reviews do not establish child comprehension or science-simulator validity.

## The experience

1. Watch a first failed rehearsal: the rocket reaches the right moon but loses its seeds through an open hatch.
2. Inspect an actual 3D part, confirm the inspection, predict its effect and choose one change.
3. Rehearse. A closed hatch retains seeds; a tidy badge does not. Leaving seeds at the base prevents a spill but fails the delivery goal. Undo makes the counterexample easy to recover from.
4. Meet inversion after the first successful delivery. A new mission introduces two independent faults: an open hatch and a sleeping destination beacon. Fixing either leaves the other failure path.
5. Complete the mission and choose a bounded conclusion: this rehearsal worked under the disclosed rules; it does not guarantee all real-world missions will work.

Predictions concern the inspected part **before** the repair. Incorrect predictions do not prevent experimentation and remain recorded separately; later success never rewrites them as correct. Final feedback covers this authored response sequence only. Outside-the-game transfer is an unassessed conversation prompt.

The world is explicitly fictional. It does not teach actual rocket operations, fault probabilities or empirical psychological effects. Each rehearsal starts with a fresh matching seed load if cargo is enabled. Animation never consumes workshop resources or determines success.

## Taxonomy and tool decisions

Foundation: **Comparing Design Solutions (`mt_nNYo5A-7Bl`)**, evidence 1 and 2, narrowly partial. The learner compares supplied digital test results and improves a toy design. Physical testing, free-form explanation and all of the original evidence criteria are not assessed. Inversion, independent failure paths, the empty-cargo counterexample and bounded conclusions are authored extensions. No source taxonomy records or prerequisites were changed; see [learning-contract.json](learning-contract.json).

Three.js provides the hinged cargo door, visible seeds, destination islands, beacon, rocket badge and direct raycasts. GSAP presents the already-computed flight result and can be skipped. Geometry and licences are local; there are no CDN or model downloads, accounts, tracking or persistent learner profiles. Blender adds no useful asset here and HyperFrames is unnecessary because video was not requested.

## Reproduce and verify

From `learning-artifacts/`, use fresh names:

```sh
node cli.mjs plan --topic mt_nNYo5A-7Bl --age 10 --plugin lessons/inversion/inversion.plugin.mjs --out output/new-inversion-plan.json
node cli.mjs generate --plan output/new-inversion-plan.json --out output/new-inversion
node cli.mjs verify --dir output/new-inversion
.venv/bin/python lessons/inversion/verify_interactions.py --artifact output/new-inversion
npm test
```

Current artifact: `output/inversion-mission-v3/`. Older generated review builds remain retained. Browser reports and screenshots are under `checks/`; the versioned [validation summary](validation-summary.json) records the accepted source and release outcome. [Screenshots](screenshots/) show the initial world, phone layout, counterexample and successful delivery.

Tests cover every configuration of the disclosed rules, explicit phase guards, scenario replay, prediction preservation, both repair orders, cosmetic non-causes, empty cargo, undo/reload, final guarantee rejection and resets. Browser checks exercise actual cargo/badge/beacon picking, keyboard buttons, 320px/390px layouts, motion, skip, arbitrary seeking and no external runtime requests. Physical device performance, learner transfer and expert review remain unperformed.

Publish through the existing [family Hosting workflow](../../hosting/README.md), keeping `/opportunity-cost/` and registering this activity at `/inversion/`.
