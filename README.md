# optiver-oa-trainer

A local practice trainer for the six tasks in the Optiver Career Kickstarter: Trading online assessment: **Beat the Odds, NumberLogic, Likelihood List, Intervals, Orderbooks and Zap-N**.

It is an unofficial study tool. It is not made, endorsed or checked by Optiver, and it contains no Optiver test content. The formats come from public candidate reports (sources below); every question is generated or written fresh.

## What it does

- **Exam replicas** with the reported timing, navigation and scoring:
  - Beat the Odds: 90 s per question, +1 / −1 / skip, no going back.
  - NumberLogic: 26 in 25 minutes, skip and return.
  - Likelihood List: exact order only.
  - Intervals: lower ÷ upper when the truth is inside.
  - Orderbooks: 20 boards in 8 minutes, and a wrong submit costs time.
- **Hundreds of fixed questions per section, plus unlimited fresh ones.** Each section has a numbered library of at least 500 distinct questions, split into exam-sized sets (Set 1, Set 2, …). You work through them in order, practising with feedback or timed under the real rules, and your progress per set is tracked. Practice, Drill and Exam draw fresh questions without limit.
- **Checked answers.** Every question family has a generator and an independent verifier (enumeration, exact rational arithmetic, Markov-chain solves or simulation). The test suite checks that each section produces at least 500 distinct verified questions, and that every curated item from the research banks is valid and sourced.
- **Teaching built in:**
  - Learn mode runs purpose → anchor → derivation one move at a time → prediction before the reveal → compact rule → fresh test.
  - Every wrong multiple-choice option carries the false belief that produces it. A miss is answered with "your answer is what you get if you …", and then the solution unfolds step by step.
- **Adaptive practice.** It picks weak families more often, missed families come back through spaced repetition, and a calibration panel says when skipping beats guessing under the −1 rule.
- **Zap-N:** all nine reported games (Balloon, Skyscraper, Shapeshift, CodeCompare, Pincode, NumberBox, Figure It Out, The Switch, Stock Master). Each has a coach, and the optimisers score you against the best possible play.
- **Readiness gate.** A section turns Ready after three full exams in a row at a target set above the reported pass lines. A started portal task cannot be reset, so open it only when its row says Ready.

## Run

```bash
./run.sh            # serves on http://127.0.0.1:8765
npm test            # node --test, no dependencies
```

Node 22 and Python 3 are the only requirements. Progress is saved in the browser's localStorage. Use **Data and backup** to export or import it.

## Layout

```
config/sections.js     exam formats and readiness targets (edit here if the real format differs)
src/core/              seeded RNG, exact fractions, combinatorics, Markov solver, scoring,
                       item contract, store, spaced repetition, adaptive picking, readiness
src/sections/<id>/     question families (generate + verify + lesson) and curated banks
src/zapn/<game>/       engine (pure, tested), view, coach
src/ui/                shell, runner, item views, charts, pages
tests/                 contract, verifier, volume and engine tests
```

## Design

The visual system follows `src/ui/styles.css`: one near-black accent, 1px borders, radius 6–8, a single shadow, tabular monospace numbers, and light and dark modes. The Figma style guide mirrors those tokens as variables: [OA Trainer Style Guide](https://www.figma.com/design/SSJJYxsaSQq6rflRuGf0xZ).

## Sources for the formats

- QuantVault: [online assessment](https://quantvault.org/optiver-online-assessment.html), [Likelihood List](https://quantvault.org/optiver-likelihood-list.html), [Intervals](https://quantvault.org/optiver-intervals.html), [Zap-N](https://quantvault.org/zap-n.html)
- [Aptitude Test Prep: Optiver assessment](https://aptitude-test-prep.com/employers/trading-assessments/optiver-assessment/)
- [Tradermath online assessments](https://www.tradermath.org/practice/firms/optiver)
- [PracHub](https://prachub.com/companies/optiver), [TrueInterview Zap-N](https://trueinterview.io/study/zap-n-reaction-games)

These reports disagree on some counts and timings; the numbers in `config/sections.js` are the most common ones and can be changed.

## License

MIT
