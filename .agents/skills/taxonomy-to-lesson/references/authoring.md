# Author a new topic plugin

Read learning-artifacts/examples/fraction-notation.plugin.mjs first. It is an executed extension fixture targeting a real topic outside the built-in catalog.

A plugin is one self-contained ES module exporting plugin. It may import installed npm dependencies, but keep local implementation in that file for this version. It targets one topic per artifact; generate separate artifacts for custom course units.

Required metadata: id, version, one-element topicIds, representation (html_svg, canvas2d, threejs), title, prompt, reason, coverage, assumptions, sources, scenario, fixtures, acceptance, contentReview.

coverage entries reference exact evidence indices and use assessed_response, practised, demonstrated, explanation_prompt, or partial. State a narrower assessed_subclaim when needed. Never turn empty evidence or a literature citation into an observable criterion.

Required functions:

    initialState()
    applyAction(serializableState, action)
    observe(state)
    validateInvariants(state) -> boolean
    assess(state) -> {correct, message, scope: "this_response_only"}
    createPresentation(stageRoot, {controlsRoot, dispatch, getState})
      -> {render(observed, presentationTime), dispose(), info}

The browser passes a third `render` argument with `seeking: true` for deterministic replay. Scene transitions may animate live input, but seeking must stop outstanding tweens and render the requested state immediately. An optional `onAssessment(assessment)` presentation hook may show feedback or a celebration; it must not alter domain state or determine correctness. Dispose animation callbacks, GPU resources and event listeners when leaving the lesson.

State contains no DOM, renderer, timers, audio, or persistence. Presentation renders observables without changing domain truth. Use deterministic discrete events; integrated simulations need a designed deterministic replay adapter.

For a useful custom asset, set assetRequirement to custom_mesh and declare assetFiles entries with path (relative to the plugin), target (a safe assets/ path), SHA-256, license, and provenance. Generate the asset before planning. The compiler verifies and copies it, including into video compositions. Browser code loads the declared target relative to the document; never depend on the original local path. Keep local assets and runtime dependencies ready before a frame seek.

Each fixture supplies actions, independent expectedObservation fields, and optionally expectedCorrect. Include positive, contrasting, and boundary examples that test meaning.

acceptance describes actual UI steps: click with selector, select with label/value, press with label/key, assert_text with selector/text, assert_observed with field/value. The runner then clicks the shared check button, expects correct feedback, and checks reset, repeated-time rendering, mobile layout, and offline playback. Do not bypass UI with dispatch-only steps.

Optional presentationChecks list time, selector, attribute, and equals to verify time-driven presentation independently of model events. The extension example uses a guided attention ring to exercise this contract.

contentReview.status stays pending until relevant sources, assumptions, and fixed examples have actually been reviewed. source_reviewed records limited source review, not expert/human endorsement. Unsupported claims need review or narrower scope. Preserve URLs and limitations.

    node cli.mjs generate --topic <ID> --plugin <path.plugin.mjs> --out output/<fresh-directory>
    node cli.mjs verify --dir output/<fresh-directory>

The compiler pins the plugin hash and copies source into the artifact. Plugin changes require a new plan. Rebuilding edited artifact code invalidates checks; verify again.
