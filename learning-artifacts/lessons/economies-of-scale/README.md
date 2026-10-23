# Press Club — economies of scale for age 15

A from-scratch replacement for the earlier "Little Works" activity, built to [Fable's design brief](design-brief.md). Stable route: https://gabreginatto-learning-lab.web.app/economies-of-scale/ (version 2.1.0 is published and verified; see [validation-summary.json](validation-summary.json)).

The learner runs one merch print studio for four scenario weeks, then transfers the method to a noodle stall in week five. Each round they lease presses and curing tunnels, press **Run**, and watch the day happen: pallets are printed, cured, pile up at the bottleneck or ship from the dock, while a segmented cost bar grows against a green revenue flag and the cost-per-shirt ticker counts down. Every run becomes a point in an experiment ledger. Its categories distinguish balanced runs, bottlenecks, idle whole stations and partially used capacity; arbitrary trial points are not labelled a long-run cost curve. Six resettable test days are an experiment allowance, not a cash balance or solvency test.

| Week | Idea experienced first, then named | Winning setup (unique) |
|---|---|---|
| 1 · The rent doesn’t care | Fixed cost spread over more units | 30 hoodies: £22.00 each, +£60 |
| 2 · Where does it jam? | Bottleneck | 2 presses, 2 tunnels: £16.00, +£240 |
| 3 · How big? | Economies, then diseconomies, of scale | 4 presses, 3 tunnels: £14.00, +£120 |
| 4 · Orders fall | Idle capacity; right size follows demand | 2 presses, 2 tunnels: £16.00, +£60 |
| 5 · Night Noodles | Transfer to a new business and numbers | 3 woks, 2 benches: £5.73/bowl, +£40 |

Checking a week is correct only when the current setup is the one last run, that run meets the week’s target, the week’s evidence has been seen (e.g. a jammed day before the bottleneck question), and one short reasoning pick is right. In week three, success also requires actual runs on both sides of the cost minimum and a learner-selected pair: the best balanced setup and a larger, fully used balanced setup whose unit cost is higher. A jam or surplus tunnel cannot substitute for this evidence. Changed setups in weeks three and five require a prediction relative to a named earlier run; predicted and actual directions remain available, including mistakes. Reasoning options vary position deterministically and use plausible alternative explanations.

Everything is direct: stations are added by picking a ghost slot in the scene, removed with a red token, and the day is run with the green dock button; each has a button/keyboard twin (steppers, order buttons, Run). Three.js and GSAP render and replay; the pure, serializable model in [economies-of-scale.plugin.mjs](economies-of-scale.plugin.mjs) decides every number and assessment. Playback is skipped under reduced motion and when seeking. Pallets are assigned within station capacity, so stations marked idle do not first process goods. On phones, results lead directly into the current evidence/reasoning task; detailed ledger records are expandable, and selected evidence remains visible. No external assets, Blender, telemetry or accounts.

## Run and verify

From `learning-artifacts/`:

    node --test test/economies-of-scale.test.mjs
    node cli.mjs generate --topic mt_9gpUHWVKMR --age 15 --plugin lessons/economies-of-scale/economies-of-scale.plugin.mjs --out output/<fresh-name>
    node cli.mjs verify --dir output/<fresh-name> --only-browser

For the full five-week UI check, serve the artifact over local HTTP and run:

    .venv/bin/python lessons/economies-of-scale/verify_interactions.py --url <http-url> --out output/<artifact>/checks

It plays every week at 1200, 390 and 320px through real 3D pointer picks, buttons and keyboard input; exercises missing predictions, wrong predictions, missing or invalid comparison pairs, wrong reasons, trap setups, the stuck-pile badge, the winning star, the six-day limit and week restart, reset, touch-target size and overflow; then confirms that a seek cancels live playback and that repeated seeks render identical frames. These are software-browser checks, not child testing or physical-device measurements.

## Evidence and limits

Taxonomy foundation: Costs & Revenue (`mt_9gpUHWVKMR`), evidence 1 and 2, both partial (see [learning-contract.json](learning-contract.json)). Its age 7–9 band describes foundation content, not this activity’s audience. Fixed vs variable cost, bottlenecks, scale curves and coordination are authored extensions. All figures are fictional and disclosed in-game under “How this studio is modelled”; the sync rule is an invented stand-in for coordination overhead, bulk discounts are excluded, and leases are fresh daily contracts so shrinking has no sunk cost. A correct week records one bounded response, not mastery. Munger attribution relies on an unofficial transcript mirror; no quotation is used. Expert, learner and physical-device reviews remain unperformed.
