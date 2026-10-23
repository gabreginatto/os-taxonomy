# Design review: Save the Moon Garden

**Decision:** approved for the family activity release, subject to the implementation's final automated verification. This is an Astra design review of code and rendered screenshots, not a child study, expert science review or physical-device test.

Reviewed the pure model, phase transitions, prediction and repair copy, and representative initial, prediction, empty-cargo, partial-success and completion screenshots. The detailed behavior screenshots were from `output/inversion-mission-v2/checks/`; the final composition review used `output/inversion-mission-v3/checks/1-inversion-mission-initial.png`, `1-inversion-mission-assessed.png` and `1-inversion-mission-mobile.png`. Narrow layouts at 320px and 390px were also inspected in the v2 checks.

The released direction preserves the central learning sequence: observe a failed delivery, predict a component's failure route, make one change, rehearse, and check the positive delivery goal. Independent hatch and destination faults remain separate. Removing the cargo demonstrates why preventing a spill does not establish successful delivery. Cosmetic changes cannot repair a causal route. The conclusion explicitly limits what a successful toy rehearsal establishes.

The implementation corrected the material issues from the first review:

- Destination objects and labels no longer obscure the rocket or beacon on phones.
- The landed rocket sits beside visible garden growth, making success observable.
- The closed hatch conceals cargo rather than showing seeds through its panel.
- Re-inspecting a closed hatch offers the correct no-failure prediction.
- The scripted scenario includes the explicit inspection commitment.
- Predictions are checked against the selected component before repair, preserving correct causal reasoning when the intervention changes the result.

V3 has clear task hierarchy, readable distinct destinations, an explicit first action, reversible recovery, and a coherent toy world. The desktop launchpad's decorative rock tip remains close to the canvas edge; a small upward shift would improve framing but is not a conceptual release blocker.

The design does not establish independent learner transfer, reliable causal reasoning outside this toy system, general inversion mastery, or physical phone performance. Those remain for family feedback and future observation. No additional age modes, scores or mechanics are recommended before that feedback.
