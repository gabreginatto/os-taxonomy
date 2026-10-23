# Sources and access record

Research date: 2026-10-18. This package paraphrases ideas in original language. It does not redistribute a book, certify a transcript, or reproduce long quotations.

## What was actually read

The readable source was an [HTML mirror of *Poor Charlie’s Almanack*](https://raw.githubusercontent.com/CoffeeTalk101/poor-charlies-almanack/dd0fa310e94db8f2990c2fac47fed6fafb74a9ca/index.html), hosted by CoffeeTalk101 on GitHub, pinned to revision `dd0fa310e94db8f2990c2fac47fed6fafb74a9ca`. Its [repository metadata](https://github.com/CoffeeTalk101/poor-charlies-almanack/blob/dd0fa310e94db8f2990c2fac47fed6fafb74a9ca/metadata.opf) labels it an expanded third edition. It attributes the collection to Charles T. Munger and editor Peter D. Kaufman, among others. The original publisher, rights status and correspondence to an authorized edition have not been authenticated.

The pinned HTML returned HTTP 200, 1,155,077 bytes, SHA-256 `8d6e9313a71639a6134180d0a0a5768eeadef392fb44e996bf546b45f62a78f7`. The following sections were inspected; dates and publication history below are **attributions in the mirror**, not independently confirmed facts.

| Section | Attributed date/context | Findings used |
|---|---|---|
| Harvard School Commencement Speech | June 13, 1986; a Los Angeles preparatory school, not a Harvard University commencement | Inversion, learning from others, attention to disconfirming evidence |
| A Lesson on Elementary, Worldly Wisdom as It Relates to Investment Management and Business | USC business class, April 14, 1994; introduction says published in *Outstanding Investor Digest*, May 5, 1995 | Multidisciplinary latticework, elementary probability, compound interest, circle of competence, engineering backups, scale, limitations of accounting, Graham’s margin of safety |
| A Lesson on Elementary, Worldly Wisdom, Revisited | Stanford Law School, April 19, 1996 | Repeated multidisciplinary reasoning and interacting influences; introduction discloses editorial abridgment and comments |
| Academic Economics: Strengths and Faults after Considering Interdisciplinary Needs | UC Santa Barbara, October 3, 2003 | Opportunity cost, incentives, comparative advantage, higher-order consequences |
| The Psychology of Human Misjudgment | Expanded 2005 combined revision | Twenty-five overlapping tendencies; incentives, liking/disliking, consistency, social proof, availability, authority and lollapalooza |

The expanded psychology text explicitly describes a combined revision with new material rather than one delivered speech. It lists antecedent talks in 1992, 1994 and April 24, 1995. **Do not present its twenty-five-item sequence as an exact transcript of a single 1995 talk.** Likewise, USC’s 1994 speech date and a 1995 publication date should not be conflated.

The mirror contains visible OCR/transcription defects, duplicated text and disrupted headings. We use short retrieval anchors to locate passages, never as authenticated wording. Multiple chapters of the same collection are **one underlying source**, not independent corroboration. Source association is provisional; the models’ accuracy and modern psychology evidence need separate review before public course release. Historical anecdotes and classic experiments in the collection have not been checked against current research.

## Attempted sources that could not be read

| Source | Publisher/type | Actual access outcome |
|---|---|---|
| [2014 shareholder letter](https://www.berkshirehathaway.com/letters/2014ltr.pdf) | Berkshire Hathaway; primary corporate document | Proxy tunnel 403; content not read |
| [Poor Charlie’s Almanack](https://press.stripe.com/poor-charlies-almanack) | Stripe Press; publisher page | Proxy tunnel 403; content not read |
| [Worldly-wisdom transcript](https://fs.blog/great-talks/a-lesson-on-worldly-wisdom/) | Farnam Street; secondary transcript | Proxy tunnel 403; content not read |
| [Misjudgment transcript](https://fs.blog/great-talks/psychology-human-misjudgment/) | Farnam Street; secondary transcript | Proxy tunnel 403; content not read |

These URLs are follow-up reading targets, **not supporting citations for claims in this package**. No proxy bypass, alternate tunnel, credential extraction or access-policy change was attempted. GitHub code search required sign-in; subsequent repository searches were rate limited (429). There was no general web search/browser tool available in this subtask.

## Provenance and review policy

[Sources JSON](sources.json) records source types, access outcomes, hashes, chapter contexts and 23 short anchors. Each model cites a retrieved source ID and anchor ID and states precisely what is attributed to Munger versus added by the course designer. No claim of Munger inventing probability, compounding, natural selection, opportunity cost, comparative advantage or margin of safety is made. Graham is credited for the margin-of-safety discussion; Ricardo and Smith are acknowledged in the economics discussion. Even the “Munger emphasized” category means emphasis and synthesis, not invention.

Before releasing lessons, compare source attributions with an authorized edition or reliable recording, add independently checked primary/secondary references where possible, and review empirical claims against current evidence. Attribution to a famous investor does not establish a model’s scientific validity or an educational intervention’s effectiveness. A child should be able to question Munger’s claims using the same evidence standards taught in the course.

## Reproduce reference checks

From the repository root:

```bash
python Munger_Models/validate.py --self-test
```

This verifies all topic IDs, exact supporting text, evidence indices, mapped age ranges, stored direct hard prerequisites, source references and both graph orderings. It rejects stale taxonomy hashes. It cannot authenticate a speech or prove the editorial semantic mappings are correct.

For optional source-byte checks, retrieve the pinned HTTPS URL above with TLS verification and the environment’s configured proxy. Keep the full source outside the repository, then run:

```bash
python Munger_Models/validate.py --self-test --source-html /tmp/munger-source-pinned.html
```

That checks the source hash, byte count and every stored anchor against the retrieved text. The checked-in [validation report](validation-report.json) records this stronger check from the research session, including six deliberately corrupted in-memory cases that were rejected.
