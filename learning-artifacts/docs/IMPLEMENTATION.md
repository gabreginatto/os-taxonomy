# Delivered implementation and validation

This is the implemented first version of the Astra-reviewed design. The architecture and broader policy documents remain a roadmap; this file records what actually ran.

## Delivered

- A repository Codex skill with topic/series planning, tool selection, source-grounded authoring, validation, and handoff instructions.
- A Node CLI for search, plan, generate, verify, serve, rebuild, video, asset, and verify-asset.
- Exact ID/name resolution, ambiguity handling, transitive hard-prerequisite ordering, explicit background assumptions, and a preserved semantic-conflict fixture.
- Six catalog learning activities with independent serializable models and scoped evidence mappings.
- A tested custom-topic extension contract with fixed model fixtures, source-review metadata, UI acceptance steps, optional presentation-time probes, and checksum/provenance-checked local assets.
- HTML/SVG, Three.js, and GSAP presentation; background Blender GLB export/loading; HyperFrames single-topic MP4 output with arbitrary-time replay and decoded-state frame comparisons.
- Frozen dependency/guidance versions, manifest/source fingerprints, stale-review invalidation, provenance, and content/runtime attribution.
- A separate Munger_Models research/course-design package produced by GPT-6.1 Sol.

## Executed checks

| Check | Outcome |
|---|---|
| Compiler unit tests | 14 passed, zero failed/skipped |
| Six-topic browser series | Passed model fixtures, learner interactions, reset, arbitrary seeks, renderer selection, mobile/touch checks, session isolation, rapid switching, and local-only requests |
| Custom fraction-notation extension | Passed fixed positive/negative model examples, actual UI interaction, reset, presentation-time probes, and browser checks |
| Fraction MP4 | Actual six-second 1280×720 export at 10 fps; decoded stage/readout matched expected scenario states |
| Three.js day/night MP4 | Same export checks, including known day/night observations and decoded visual comparison |
| Deliberately frozen video | Rejected despite having a valid container/duration |
| Blender asset adapter | Background GLB export; asset then loaded and visibly rendered by the browser renderer |
| Original taxonomy validator | Passed references and checksums; original data/schema/validator files unchanged |
| Munger research validator | 23 models, 52 mappings, 29 topics, 40 prerequisite edges, 23 source anchors; six corruption cases rejected |
| Reusable setup | Installation ran twice; pinned dependencies/guidance restored without changing source data |
| Startup | The documented showcase server returned the expected application entry; the server was then stopped |

Representative desktop/mobile screenshots and decoded video frames were inspected by the implementation agent. This is agent review, not a human educator/expert review or a learner trial.

The generated run summary is in output/latest-validation.json and its referenced run directory. Stable copies are output/showcase, output/fractions-demo, output/daynight-demo, and output/notation-demo. Generated files/dependencies are ignored by Git. Versioned screenshots and the compact summary are in examples/.

## Limits

- The compiler is deterministic for its existing models; an agent authors new topic-specific plugins. It does not fabricate arbitrary scientifically correct lessons solely from a topic name.
- Content checks cover declared examples and evidence subsets. They do not certify all topic criteria, general learner mastery, or educational effectiveness.
- New custom plugins currently target one topic per artifact; catalog topics can form one navigable series.
- Video is one scripted scenario through one lesson. No automatic full-course movie assembly, narration service, or interactive-deck compiler is included.
- Blender MCP is not configured; headless Blender is the working asset route.
- Shared content-addressed caching, hosted generation, accounts, analytics, and broader integrated simulation adapters remain future design work.
- Cloud WebGL uses software graphics. Phone/tablet performance has not been measured.
- The Munger catalog uses a pinned unofficial speech/book mirror because official and secondary pages were blocked. Its attribution and empirical claims need independent corroboration before public course release. The folder is a research/course proposal, not a built Munger course.

## Cloud reuse

Tested install_script and start_skill contents were saved to the environment configuration draft. The existing repository/network/credential settings were preserved. Saving a draft does not publish it or establish restoration in a fresh task. Review and save the draft in environment settings, then publish the environment to retain the prepared snapshot.
