# Choice Islands — one choice at a time

A colorful Three.js opportunity-cost lesson for ages 10 and 15, redesigned with Astra after the first game left its mechanics unclear. [Play the current lesson](https://gabreginatto-learning-lab.web.app/opportunity-cost/).

The learner experiences the comparison before learning its name. One question and one primary action are shown at a time. A toy click previews a first choice; a labelled button confirms it. The next question explicitly asks what the learner would do if that adventure were unavailable. Toy positions stay aligned with their accessible buttons.

| Scene | What happens | Learning purpose |
| --- | --- | --- |
| Your afternoon | Pick one of three free two-hour adventures, confirm, then name the one you would do instead | Elicit a favourite and next favourite; reveal the value of the missed experience |
| Leah’s £10 challenge | Leah chose an £8 robot. Her alternative wish list names a £12 telescope visit, £10 movie and £6 garden | Exclude unavailable plans and compare using the original budget, despite only £2 left afterward |
| Change one thing | Leah originally has £9 and still chooses the same robot | The movie is unavailable; the garden with £3 saved becomes the best alternative |

Personal preferences are not graded. The host-compatible boolean confirms a valid pair only; metadata states `assessed: false`, `kind: preference_elicitation`, and `meaning: valid_preference_pair`. There is no preference score or victory. Fictional challenge checks concern this response only. `help_not_requested` describes the help button, not whether the learner has seen hints, feedback or the task before.

Each option is a complete plan for one slot. Opportunity cost is the **value of the best feasible alternative forgone**. Whole-plan rankings include saved cash; reveal cards show those savings. The robot’s cash price and the remaining cash answer different questions. Only this limited menu is compared. No real-world or mental-model mastery is inferred.

The old utility scores, sliders, parallel tracks, definition quiz, ties and sunk-cost mission are removed from this introduction. Read [Astra’s design brief](redesign-brief.md) for the diagnosis and design rationale. The original taxonomy remains unchanged; evidence 0 and 2 of Budgeting Pocket Money (`mt_Qzbh-_v0Gq`) are only partially covered. See [learning-contract.json](learning-contract.json).

## Reproduce

From `learning-artifacts/`, choose fresh output names:

```sh
node cli.mjs plan --topic mt_Qzbh-_v0Gq --age 10 --plugin lessons/opportunity-cost/opportunity-cost.plugin.mjs --out output/new-choice-plan.json
node cli.mjs generate --plan output/new-choice-plan.json --out output/new-choice
node cli.mjs verify --dir output/new-choice
.venv/bin/python lessons/opportunity-cost/verify_interactions.py --artifact output/new-choice
node lessons/opportunity-cost/export-standalone.mjs output/new-choice output/new-choice.html
.venv/bin/python lessons/opportunity-cost/verify_interactions.py --artifact output/new-choice --standalone output/new-choice.html
```

The current artifact is `output/opportunity-islands-clear/`. Older generated artifacts are retained rather than overwritten. The Firebase catalog keeps the same `/opportunity-cost/` link and publishes the new verified source. Use [hosting/README.md](../../hosting/README.md) for future publication.

`npm test` includes independent examples for all six personal pairs, explicit confirmation, invalid states, original versus leftover budgets, lower-ranked and unavailable alternatives, the £9 counterfactual, help labels and resets. Actual browser checks exercise WebGL2 toy raycasts, keyboard confirmations, specific retry feedback, phase/reveal focus and scrolling, toy framing, 390px/320px layouts, motion cancellation, arbitrary seeking and no external runtime requests. Screenshots and reports are in each artifact’s `checks/`; [validation-summary.json](validation-summary.json) records the current outcome.

Three.js makes the local toys and raised comparison rings. GSAP handles short presentation changes only. Blender and HyperFrames are unnecessary for this primitive-geometry browser lesson. Physical-device performance, learner comprehension and expert review remain separate from automated browser checks. The single-file export is checked over local HTTP and then offline; direct `file://` opening is blocked by managed Chromium and is not claimed as tested.
