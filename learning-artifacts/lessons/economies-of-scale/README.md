# Little Works — economies of scale for age 15

Published and publicly verified: https://gabreginatto-learning-lab.web.app/economies-of-scale/

The accepted artifact is `output/economies-of-scale-v4`. Validation passed 45 package tests, seven hosting tests, all five experiments at 1200/390/320px, all 39 public file hashes, real 404 behavior, and the live catalog plus all three games at desktop/phone widths. See [validation-summary.json](validation-summary.json) for exact scope and [screenshots](screenshots/) for inspected scenes.

A colorful Three.js workshop with five linked experiments: shared setup cost, a packing bottleneck, expansion and coordination, a demand shock, and transfer to a food festival. The objective is to fulfill confirmed orders at the lowest cost per completed item. The game distinguishes using an existing workshop more fully from changing the operation's scale.

The main interaction is direct scene picking, with matching keyboard buttons and a cost curve. The learner compares daily configurations and justifies a choice. GSAP only emphasizes changes; pure serializable domain state determines all quantities and feedback. No Blender, Anatomy, externally loaded assets, extra rendering framework, telemetry or child accounts are required.

See [design.md](design.md) for rules, [learning-contract.json](learning-contract.json) for evidence boundaries and [economies-of-scale.plugin.mjs](economies-of-scale.plugin.mjs) for the self-contained model and presentation. Generated artifacts and logs belong in ignored output directories.

From learning-artifacts:

    node --test test/economies-of-scale.test.mjs
    node cli.mjs generate --topic mt_9gpUHWVKMR --age 15 --plugin lessons/economies-of-scale/economies-of-scale.plugin.mjs --out output/<fresh-name>
    node cli.mjs verify --dir output/<fresh-name> --only-browser

For full UI checks, serve the generated artifact over local HTTP and run:

    .venv/bin/python lessons/economies-of-scale/verify_interactions.py --url <http-url> --out output/<artifact>/checks

The interaction check exercises all five experiments at 1200, 390 and 320px, actual 3D picking, wrong-answer counterexamples, keyboard focus, hints, reset, completion, motion cancellation and repeated-time seeking. These are software browser checks, not child testing or physical-phone performance measurements.

Independent arithmetic includes £140/10 = £14 versus £180/20 = £9; an assembly upgrade that leaves output at 40; a packing upgrade delivering 80 at £6.50 each; four teams delivering 80 for £630 versus six for £920; and a fresh one-team rental plan serving 20 for £180. Festival transfer compares £360 versus £40 profit across plans serving the same 40 customers.

The taxonomy foundation is Costs & Revenue (`mt_9gpUHWVKMR`), partial evidence 0 and 1. Its age 7–9 band describes foundation content, not this activity's audience. The generated plan records six hard prerequisite ancestors as background; no mastery is inferred. Fixed/variable costs, bottlenecks, scale curves and coordination are authored extensions. Supplier bargaining, distribution, brand psychology and network effects are not simulated or assessed. Completion records bounded responses; it does not establish general mental-model mastery.

All data and the coordination-cost function are fictional and disclosed. Configurations are prospective daily rental plans, so shrinking is not modeled as recovering sunk capital. Quality is held constant, production stops at confirmed demand, all completed items sell for £15, and inventory/work-in-progress costs are omitted. Monetary inputs use integer pence; displayed averages round to two decimal places. Historical Munger attribution in local research relies on an unauthenticated mirror. OpenStax access was blocked and is not claimed as retrieved corroboration. Expert, learner and physical-device reviews remain unperformed.

Publishing uses only the separate Family Learning Lab Firebase project and stable `/economies-of-scale/` route. Preserve the existing opportunity-cost and inversion games. A source change needs a fresh generated artifact, validation and an intentional catalog update before deployment.
