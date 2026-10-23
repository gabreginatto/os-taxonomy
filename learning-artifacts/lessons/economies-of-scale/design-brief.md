# Press Club — design brief (age 15, economies of scale)

Design direction by Fable (advisor), written for a from-scratch replacement of the earlier "Little Works" activity. The implementing engineer independently re-derived every number in §4 with a separate script and the unit tests; each week’s winning configuration is unique under the stated rules. One typo in the original table (committed cost for week 2’s trap, £600 → £660) was corrected; its total was already right. This brief is a design decision, not evidence of learner testing.

## 1. Why the previous game was replaced

- It was a quiz. Correctness was `config === X && answer === 'spread'`. The 3D stations illustrated a radio button; nothing was ever produced, queued, sold or paid for, and results appeared instantly on toggle, so there was no moment of consequence.
- Five experiments used four unrelated cost functions, so no number carried over and the learner could never predict anything before pressing a button.
- Headings answered their own question ("Why are only 40 toys leaving?") and the full six-plan bar chart was handed over before a single plan had been run.
- No stakes, budget or failure state. Every option was free and reversible, so brute force dominated reasoning.
- The scene was near-identical across experiments while the real differences (queue, idle capacity, overhead) were only text. Floating per-object labels overlapped.
- The transfer task was two preselected plans and a radio pick: no configuration, no transfer of method.
- Kept from the old design: the fresh-daily-rental framing (no sunk-cost confusion) and the distinction between using one studio more fully and changing its size.

## 2. The big idea: one business, one model, one chart

**PRESS CLUB — a screen-print studio that prints merch.** The learner runs it for five working weeks. Merch is something a 15-year-old buys and sells; a print studio has exactly the structure needed and nothing about it is babyish.

- **Fixed vs variable:** the studio lease and press leases are paid before the first shirt — navy and teal blocks that sit in the cost bar at the start of every day. Blanks and ink are yellow blocks that only appear as shirts are printed.
- **Bottleneck:** pallets flow Intake → Presses → Curing tunnels → Dock. Add presses without tunnels and printed-but-uncured shirts pile up with a red tag: ink paid for, nothing sold.
- **Coordination overhead:** every pair of press teams must sync, drawn as cables between every pair of presses (1 at 2 presses, 6 at 4, 15 at 6), with a grey block in the same cost bar.

Everything is measured in pence per shirt, and every day the learner runs becomes a dot on their own ledger chart. The U-curve is never shown up front.

## 3. Core loop (one day per round)

1. **Set up the day.** Lease presses and tunnels (week 1: choose how many orders to accept). Before running, the HUD shows only what is knowable in advance: committed cost, print and cure capacity, orders.
2. **Run the day.** The model computes the result first; a short playback then shows pallets being printed, cured, piling up or docking while the cost bar grows and the cost-per-shirt ticker counts down. Reduced motion and seeking skip straight to the final frame.
3. **Read the result.** Sold/orders, day cost, cost per shirt, profit — and a new dot on the ledger.
4. **Decide.** Change the setup and run again, or press Check when the current setup is the answer. Each week has six days; when they run out the week restarts (earlier days stay on the ledger, faded). Days are the budget that makes thinking cheaper than clicking.

## 4. The model (weeks 1–4; week 5 re-skins it)

All values in integer pence. Leases are fresh daily contracts.

| Item | Value |
|---|---|
| Studio lease per day (includes 1 tunnel) | 48 000 |
| Press lease per press per day; prints 30/day | 6 000 |
| Extra tunnel per day; cures 40/day | 6 000 |
| Sync per pair of presses per day | 6 000 × n(n−1)/2 |
| Blank + ink per shirt printed | 400 |

```
committed = 48000 + 6000n + 6000(t−1) + 6000·n(n−1)/2
printed   = min(orders, 30n)
cured     = min(printed, 40t)
stuck     = printed − cured
total     = committed + 400·printed
avg       = total / cured
profit    = price·cured − total
```

| Week / demand / price | n | t | printed | cured | stuck | committed | total | £/shirt | profit |
|---|---|---|---|---|---|---|---|---|---|
| 1 · 10 at £24 | 1 | 1 | 10 | 10 | 0 | 540 | 580 | 58.00 | −340 |
| 1 · 20 | 1 | 1 | 20 | 20 | 0 | 540 | 620 | 31.00 | −140 |
| 1 · 30 | 1 | 1 | 30 | 30 | 0 | 540 | 660 | 22.00 | **+60** |
| 2 · 60 at £20 (trap) | 2 | 1 | 60 | 40 | 20 | 660 | 900 | 22.50 | −100 |
| 2 | 2 | 2 | 60 | 60 | 0 | 720 | 960 | 16.00 | **+240** |
| 3 · takes ≤200 at £15 | 1 | 1 | 30 | 30 | 0 | 540 | 660 | 22.00 | −210 |
| 3 | 2 | 2 | 60 | 60 | 0 | 720 | 960 | 16.00 | −60 |
| 3 | 3 | 3 | 90 | 90 | 0 | 960 | 1320 | 14.67 | +30 |
| 3 (trap) | 4 | 2 | 120 | 80 | 40 | 1140 | 1620 | 20.25 | −420 |
| 3 **best** | 4 | 3 | 120 | 120 | 0 | 1200 | 1680 | **14.00** | **+120** |
| 3 | 5 | 4 | 150 | 150 | 0 | 1560 | 2160 | 14.40 | +90 |
| 3 | 6 | 5 | 180 | 180 | 0 | 1980 | 2700 | 15.00 | 0 |
| 4 · 60 at £17 (trap) | 4 | 3 | 60 | 60 | 0 | 1200 | 1440 | 24.00 | −420 |
| 4 | 2 | 3 | 60 | 60 | 0 | 780 | 1020 | 17.00 | 0 |
| 4 **best** | 2 | 2 | 60 | 60 | 0 | 720 | 960 | **16.00** | **+60** |

Long-run cost per shirt at full capacity with just-enough tunnels: 22.00, 16.00, 14.67, 14.00, 14.40, 15.00 for 1–6 presses.

**Week 5 transfer — Night Noodles.** Pitch fee £200/day (includes one prep bench); extra bench £60, preps 80 bowls/day; wok £45/day, cooks 50/day; sync £35 per pair of woks; ingredients £2.40 per bowl prepped; 150 bowls ordered at £6. The bottleneck can now sit upstream: too few benches starve the woks. Unique profitable setup: 3 woks + 2 benches, £860 total, £5.73/bowl, +£40. Spot checks: 3/1 → 80 cooked, £7.90, −£152; 2/2 → 50 prepped bowls wasted, £7.45, −£145; 4/2 → £6.73, −£110; 3/3 → £6.13, −£20.

## 5. Weeks

Common check rule: correct only if the current setup is the one last run, that run meets the week's target, the week's "seen it" condition holds, and the one reasoning pick is right. Each failure gets its own message.

1. **The rent doesn't care.** One press, one tunnel; accept 10, 20 or 30 hoodies at £24. Target: profit (only 30). Seen it: two different volumes run. Idea: fixed cost spread over more units.
2. **Where does it jam?** A band wants 60 tees at £20; the week opens at 2 presses, 1 tunnel. Target: profit (only 2/2). Seen it: a day with stuck shirts. Idea: bottleneck.
3. **How big?** A festival tent buys every cured shirt at £15, up to 200. Target: the most profitable day (only 4/3). Seen it: three press counts run. Idea: economies, then diseconomies, of scale.
4. **Orders fall.** 60 shirts at £17; opens at last week's 4/3. Target: profit (only 2/2). Seen it: a day with idle capacity. Idea: the right size follows demand; idle leases still cost.
5. **Night Noodles.** Transfer to a different business and numbers. Target: profit (only 3 woks/2 benches). Seen it: two setups run. Tests whether the method carries to one more fictional case, not mastery.

## 6. Scene and interaction

Fixed orthographic camera fitted to a constant world box, so adding stations never moves the camera. Rows: intake (front), first station, second station, dock with a large green Run button (back). A segmented cost bar runs along the front edge with a green revenue flag. Sync cables arc between every pair of the synced station. Every pallet is 10 real units from the model. At most three projected HTML badges, on fixed anchors (two row counts, one pile badge); row badges drop below 400px. Every 3D pick has a DOM twin (steppers, order buttons, Run). No people, trees, trucks, orbit camera or floating per-object labels.

## 7. Cut

No definition quiz, no answer radios before a result, no pre-drawn curve or "compare all plans" table, no per-week fresh formulas, no free-text grading or mastery language, no instructions hidden in accordions, no goal text that answers the question.

## 8. Assumptions and limits

All figures fictional. Leases are fresh daily contracts, so shrinking has no sunk cost here; real capital purchases do. The sync rule is an invented stand-in for coordination overhead, not a business law. Blanks and ink cost the same at every size (bulk discounts are deliberately excluded so only fixed-cost spreading and coordination move the curve). Uncured shirts have no value that day; no inventory, uncertainty, defects, wages beyond leases, tax or finance. Not taught: marginal cost, short- vs long-run curves by name, demand curves, pricing, supplier bargaining, learning curves, network effects. A correct week is a bounded response, not mastery.
