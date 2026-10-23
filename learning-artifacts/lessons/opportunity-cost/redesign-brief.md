# Choice Islands redesign: make the missed opportunity tangible

Design review for the user's request to make the mechanics and trade-offs understandable. This is an implementation brief, not evidence of learner testing.

## What made the previous version confusing

- The user had to learn seven islands, two resource limits, stars, preference scores, two selection modes, four missions, and a definition question before understanding the first decision.
- “Your YES” and “best NO” were new vocabulary for concepts the learner had not experienced. “No” also suggested all rejected options, although opportunity cost concerns the best alternative.
- A toy click silently changed the meaning of the next toy click. There was little visible transition between choosing an activity and proposing an alternative.
- Leftover money was prominent while the original-resource counterfactual was in supporting prose. The main interface therefore encouraged the exact misconception the model intended to prevent.
- Stars looked like rewards, prices, or happiness quantities. Their fictional ordering required a disclaimer before they were usable.
- Most interface elements were available all the time. The actual task was less visually prominent than controls and decoration.

## Recommended scope

Build two small scenes with one action at a time. Scene 1 elicits the learner's own preferences in a no-money example. Scene 2 checks a specific counterfactual using a fictional character's explicit preferences. Preserve the colorful, actual Three.js toys, direct picking, accessible label buttons, and a few purposeful transitions. Remove tracks, sliders, utility scores, sunk costs, ties, and open-ended explanation fields from this version.

Title: **One afternoon. One choice.**

Subtitle: **See what choosing one thing means giving up.**

The main stage, prompt, and current action should fit together on a normal laptop viewport. On phones, put the question before the stage and the primary action immediately after it. No critical instruction should be below an unrelated panel.

## Scene 1: your afternoon

Three 3D toys represent three whole-afternoon plans. Each uses the same single two-hour block; all are free. This removes the need to compute feasibility while learning the idea.

| ID | Toy | Label | Benefit used in the reveal |
| --- | --- | --- | --- |
| robot | Robot | Build a robot | making a robot of your own |
| game | Controller | Play with friends | playing together with your friends |
| park | Tree / outdoor toy | Go to the park | enjoying an afternoon outdoors |

Do not add a “rest” option just for model completeness. This is an explicitly limited fictional menu, and every option is feasible. Do not claim it lists every possible real-world alternative.

### 1. Initial: choose

Persistent constraint chip: **2 free hours · enough time for one plan**.

Prompt: **How would you spend your afternoon?**

Supporting sentence: **Each plan takes the whole two hours. Tap the one you would most like to do.**

Each label has its activity name and “2 hours · free.” All three islands are clickable. Clicking selects and raises a toy and displays a compact preview: “Your choice: Build a robot.” The primary button reads **Choose this afternoon**. A second toy click changes the tentative choice. This explicit commitment prevents the same click surface from unexpectedly changing meaning immediately after selection.

### 2. Decision: next-best alternative

On commit, the choice is visibly set aside with **You chose this**. The two remaining toys stay in their positions. Animate a modest arrow or camera emphasis, not an elaborate relocation the learner must track.

Prompt: **If you couldn't [chosen activity], what would you do instead?**

Supporting sentence: **Pick the remaining plan you would want most.**

The original chosen island is visibly unavailable for this question. The two alternatives are clickable. Selecting one adds **My next choice** and enables **See my trade-off**. A small **Change my first choice** control returns to the initial state and clears the second answer.

There is no objective right or wrong personal preference. The two choices elicit an ordering: chosen > runner-up > remaining option. Do not show green “correct,” score, mastery, or a victory for this action.

### 3. Reveal: name the idea after the experience

Heading: **One choice opens one door and closes another.**

Two adjacent, concrete labels:

- **You choose:** Build a robot — making a robot of your own.
- **Your next-best option:** Play with friends — playing together with your friends.

Then: **By choosing the robot, you give up the chance to play with friends that afternoon. The value of that missed chance is your opportunity cost.**

The unselected third toy stays small/quiet with: **You also skip the park, but you said you would rather play with friends. We compare your choice with the best alternative.**

A final short line: **No money changed hands. Your time still had an opportunity cost.**

Primary action: **Try a challenge**. Secondary: **Try a different afternoon**.

This is a worked introduction using the learner's stated preferences, not an assessment. If they prefer a different ordering later, allow them to change it; preferences are not errors.

## Scene 2: Leah's project challenge

Use a new scene heading and a clear change of perspective: **Now help Leah spot her trade-off.**

Facts visible throughout:

**Leah had £10 and one project place. She chose the robot for £8.**

“One project place” makes the plans mutually exclusive even when cash remains. Each project is a complete plan; unused money stays saved. No time constraint is needed in this scene.

Keep the selected robot (£8) visible on a small “Leah chose” pedestal. Present these alternatives as three toy islands:

| Alternative | Cost | Stated preference |
| --- | --- | --- |
| Observatory visit | £12 | Wants most, but cannot afford |
| Make a science film | £10 | Next on her wish list |
| Garden experiment | £6 | After the film |

Show an easily readable, authored wishlist: **Of the other plans, Leah would most like: 1. Observatory → 2. Film → 3. Garden.** This is an ordinal list of her preferences, not a happiness score or a claim about what the learner should like. State in parent notes that the list ranks complete plans including saved money.

### 4. Challenge: rewind the decision

Use a visible before/after wallet strip:

**Before choosing: £10** → **Robot: £8** → **After choosing: £2**.

Highlight **Before choosing: £10** when the prompt appears. The cost of the chosen robot should not be subtracted from the feasibility of counterfactual alternatives.

Prompt: **Which is the best other plan Leah could have chosen instead of the robot?**

Supporting sentence: **Go back to the moment before she spent any money.**

All three alternative labels can be inspected. The £12 observatory has a visible lock and **Needs £2 more than she had**. If the learner clicks it, explain the constraint without submitting it as a valid choice. This prevents decorative locking from being the only instruction. Film and garden are clickable guesses; **Check my answer** submits the selected guess.

Wrong garden feedback: **The garden fits her £10 budget. But Leah wanted to make the film more, and it also cost £10. Which feasible alternative did she value most?**

Observatory feedback: **Leah wanted this most, but she only had £10. A £12 visit was never an available choice. Look for her favorite plan that fit the original £10.**

Correct film reveal: **Yes. Leah could have spent her original £10 making the film. Choosing the robot means giving up that chance. The value of making the film is the opportunity cost.**

Explicit distinction: **£8 is the money she paid. £2 is what she has left. Neither amount tells us the value of her missed film-making opportunity.**

Optional second response, only after the toy answer, if needed for stronger evidence:

**Why can the £10 film count when she has only £2 left?**

- **She could have chosen it using her £10 before buying the robot.**
- **She must be able to buy it with the £2 she has left.**

This question directly checks the misconception; it should not be a three-definition quiz placed beside the first selection task. If included, do not mark the challenge complete until it is answered.

### 5. Transfer and finish

Finish with one optional conversation prompt: **Think of something you chose today. What would you most want to have done instead? Was it actually possible at the time?**

Label it **Talk it through**, with no free-text grading or mastery claim. Primary replay action: **Make another choice**.

Do not add the prior four advanced missions to this first redesign. More teaching is useful only after the central experience is clear. The older material can remain in version history and be considered separately after learner feedback.

## Implementation architecture

Use an explicit serializable phase/state machine. Do not retain a renderer-only `pickMode` that changes what the next click does invisibly.

Suggested state:

```js
{
  scene: 'afternoon', // afternoon | project
  phase: 'choose', // choose | alternative | reveal | challenge | complete
  selected: null,
  alternative: null,
  submitted: false,
  reason: null,
  usedHelp: false
}
```

Actions: `select`, `confirmChoice`, `selectAlternative`, `reveal`, `startChallenge`, `checkAlternative`, optional `answerReason`, `retry`, `reset`. Give each action a valid scene/phase guard. A tentative selection does not silently submit an answer. All rendering, keyboard buttons, and 3D raycasts dispatch the same actions.

Personal scene observation should expose chosen benefit and runner-up benefit, but assessment should say `scope: 'preference_elicitation_only'` or return no assessed result. Any two distinct choices are valid. If the host API requires a boolean, avoid using the host check/celebration flow for this scene; never use `correct: true` as a preference judgment.

Project challenge domain truth uses `originalCash: 10`, `selectedCost: 8`, `leftCash: 2`. The alternative feasibility function takes original cash explicitly. The fictional preference order can be an ordered ID array, avoiding numeric utility entirely. `bestAlternativeIds` filters alternatives for feasibility before taking the first preferred ID. In this authored scene, the selected robot is fixed and outside the alternative wishlist.

Use a single prompt block, single stage, and single primary action. Render only controls relevant to the current phase. Retain a small progress caption: **1 Your choice → 2 Your next choice → 3 Leah's challenge**. Avoid presenting these as a large parallel menu.

For mobile, four objects including the chosen robot are the maximum; two-by-two positions and short labels are sufficient. A fixed gentle camera is enough. Orbit can remain optional, but camera navigation should not compete with the learning task. No continuous ambient animation is required.

Honor reduced motion and deterministic seek. The reveal may use a short ring/link animation between the two compared options, but the text and static positions must fully communicate the relationship. Colors need corresponding text: “Your choice,” “Next choice,” “Cannot afford.”

## Acceptance criteria

- A new learner can see the constraint and first required action without scrolling past unrelated controls.
- No YES/NO vocabulary, star ratings, utility scores, cash/time sliders, tracks, or simultaneous definition form remains.
- First click selects; a labeled button commits; the next phase is obvious.
- Every pair of distinct personal choices produces the matching benefit comparison without marking the preference right or wrong.
- The third option is not added to opportunity cost; the comparison uses the elicited runner-up only.
- £10 film is feasible with original £10 even after selecting the £8 robot. £12 observatory is infeasible. £6 garden is feasible but lower in Leah's stated preference order.
- Incorrect guesses give a specific reason and allow retry. Wrong-choice feedback never accidentally advances to completion.
- Returning to the first choice clears dependent answers. Restart clears the current attempt. The active phase is reproducible from serialized state.
- Both actual toy raycasts and keyboard labels work. Desktop and phone screenshots show all labels readable without overlap.
- The documentation distinguishes teaching, authored-response checks, and unassessed personal discussion. No new source taxonomy coverage or mastery is claimed.

Run package tests and fresh generate/verify per `learning-artifacts/AGENTS.md`; update independent domain tests, actual UI acceptance, README and learning contract to the reduced scope. Remove obsolete claims about thresholds, ties, sunk costs, sliders, and four missions from current documentation.
