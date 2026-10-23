# Munger models: research and course-design proposal

A prioritized set of **23 Munger-associated reasoning models/groups**, mapped to the local taxonomy for possible child and teen lessons. This is not a canonical fixed complete list, a finished course, an installed skill, or learner-tested material. Most ideas were developed by other disciplines and thinkers; Munger emphasized their combination and practical use.

The catalog contains **52 scoped mappings to 29 exact topic IDs**, **40 distinct direct hard-prerequisite edges**, and **69 proposed objective → action → check → transfer sequences** across ages 6–8, 9–12 and 13–17. Source taxonomy: commit `96a7933754af672e1bfdbf7ecb05c325860c6e0d`, 1,590 topics, 3,221 dependencies. No taxonomy data was edited.

Three implemented activities use the taxonomy-to-lesson skill: [Choice Islands](../learning-artifacts/lessons/opportunity-cost/README.md) teaches opportunity cost through personal choices and original-budget challenges; [Save the Moon Garden](../learning-artifacts/lessons/inversion/README.md), with Astra as design director, teaches inversion through causal predictions, reversible changes and delivery rehearsals. [Press Club](../learning-artifacts/lessons/economies-of-scale/README.md) is an age-15 print-studio game on fixed-cost spreading, bottlenecks, coordination overhead, idle capacity and a noodle-stall transfer problem, using Costs & Revenue as a partial foundation. All three distinguish partial taxonomy foundations from authored mental-model objectives. Automated model/browser checks and design review are distinct from child or classroom review; the rest of this catalog remains a course-design proposal.

## Read this package

| File | Purpose |
|---|---|
| [mental-models.json](mental-models.json) | Definitions, attribution distinctions, citations, required concepts, exact evidence mappings, direct hard prerequisites, gaps and age-band lesson contracts |
| [course-guidelines.md](course-guidelines.md) | Future skill planning, evidence discipline, domain/renderer separation and tool-routing guidance |
| [age-pathways.md](age-pathways.md) | Navigable course clusters, topic sets, prerequisites, checks and transfer tasks by age |
| [sources.md](sources.md) and [sources.json](sources.json) | Retrieved versus blocked sources, provenance, date distinctions and verification instructions |
| [validate.py](validate.py) and [validation-report.json](validation-report.json) | Reference/graph checks and results from this research session |

## What the evidence supports

Direct support exists for **components** of concrete opportunity-cost trade-offs, elementary probability, testable predictions and evidence-based conclusions, natural selection, and peer-pressure recognition/resistance. It does not establish complete general-model mastery. Most other connections are foundations or explicitly limited analogies.

Important gaps remain: base rates and conditional probability, calibration, repeated percentage growth, comparative advantage, formal feedback, causal inference, model validity, scale economics and interacting psychological effects. The taxonomy includes a risk/bias topic and a trophic-cascade topic whose evidence arrays are empty. Some other evidence arrays contain literature references rather than observable criteria. The catalog preserves these distinctions rather than turning related names into coverage claims.

The intended outcome is **better justified reasoning in new contexts**: selecting relevant models, explaining assumptions and trade-offs, testing claims, representing uncertainty and knowing when more information is needed. Child examples use play tokens, safe designs, fictional stories and disclosed toy datasets. This is reasoning education, not investment advice.

## Source-access limitation

One unofficial GitHub mirror of *Poor Charlie’s Almanack* was readable. Its speech sections and 23 short retrieval anchors were checked against a pinned HTML hash. Official Berkshire, Stripe Press and Farnam Street pages returned proxy 403; their content was not read or used as evidence. The mirror has transcription defects, and its correspondence to an authorized edition is unverified. Independent corroboration and current empirical psychology review remain outstanding before public course release. See [the full access record](sources.md).

The USC speech is attributed to **1994**, with a **1995 publication date** in the mirror. The **25-tendency psychology text is a combined 2005 revision**, not an exact transcript of a single 1995 speech. The 1986 Harvard School commencement was at a Los Angeles preparatory school. These distinctions matter when citing Munger.

## Catalog

Counts are **direct component / foundation / analogy-only mappings**, not scores, percentages of mastery or complete coverage. Every model also has explicit missing concepts.

| Stable course ID | Model/group | Attribution | D/F/A |
|---|---|---|---|
| latticework | A latticework of multiple models | Emphasized existing idea | 0/3/0 |
| inversion | Inversion and failure prevention | Emphasized existing idea | 0/2/0 |
| circle-of-competence | Circle of competence and calibrated confidence | Emphasized existing idea | 0/1/1 |
| opportunity-cost | Opportunity cost and trade-offs | Disciplinary model used | 1/1/0 |
| incentives | Incentives and incentive-caused bias | Emphasized existing idea | 0/2/0 |
| compounding | Compounding and repeated growth | Disciplinary model used | 0/3/0 |
| probabilistic-thinking | Probability, base rates and updating | Disciplinary model used | 2/1/0 |
| margin-of-safety | Margin of safety and redundancy | Disciplinary model used | 0/2/0 |
| feedback | Feedback loops and adaptation | Editorial framing/extension | 0/0/2 |
| second-order-effects | Second-order consequences and systems | Emphasized existing idea | 0/1/1 |
| scale | Scale, specialization and constraints | Disciplinary model used | 0/2/0 |
| comparative-advantage | Comparative advantage and cooperation | Disciplinary model used | 0/2/0 |
| falsification | Disconfirmation and testing beliefs | Emphasized existing idea | 2/1/0 |
| models-and-reality | Models, assumptions and limits | Editorial framing/extension | 0/2/1 |
| evolution | Evolution, variation and adaptation | Disciplinary model used | 1/1/0 |
| misjudgment | Psychology of misjudgment: interacting tendencies | Emphasized existing idea | 0/3/0 |
| confirmation | Confirmation bias and motivated belief | Editorial framing/extension | 0/2/0 |
| availability | Availability and salience | Emphasized existing idea | 0/2/0 |
| commitment | Commitment, consistency and sunk costs | Emphasized existing idea | 0/2/0 |
| authority | Authority, expertise and evidence | Emphasized existing idea | 0/2/0 |
| liking-disliking | Liking, disliking and association | Emphasized existing idea | 0/2/0 |
| social-proof | Social proof and independent judgment | Emphasized existing idea | 1/1/0 |
| lollapalooza | Lollapalooza: interacting causes and pressures | Emphasized existing idea | 0/2/0 |

## Validation

From the repository root:

```bash
python Munger_Models/validate.py --self-test
```

The saved report records successful checks of all IDs, exact field text and evidence indices, mapped topic ages, direct hard-prerequisite snapshots, source/anchor references and acyclic stored/proposed graphs. Six deliberate corruption cases were rejected. An additional session check verified all 23 anchors against the pinned source HTML’s hash and byte count; reproducing it requires the separately retrieved source file as described in [sources.md](sources.md).

These checks establish traceability and integrity. They cannot prove semantic mappings, authenticate a speech, validate psychological effect sizes, demonstrate a browser lesson, or infer learner mastery. A future generator must still inspect transitive prerequisites, review semantic conflicts, build and test the artifact, and report partial or unrun criteria honestly.
