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
- **Study guide.** A written course, separate from practice: 132 lessons in 8 books (assessment strategy, probability foundations, and one lesson per question type: 99 families and 9 Zap-N games). Each lesson:
  - opens with a challenge to attempt before any teaching; afterwards you pick the attempt closest to yours and the derivation marks the step where it breaks;
  - shows the picture (grid, tree, Venn, difference ladder, order book, game state) before the algebra;
  - derives the method one move at a time, and each move opens only after 1 to 3 questions that use nothing but that move (at most three teaching blocks ever pass without a question);
  - has an expert think-aloud that plays at exam pace (including a wrong turn and its recovery), worked examples revealed step by step with "why?" prompts, a faded example, named traps, a find-the-error solution, a variation table (change one thing, predict the effect), and near and far transfer questions;
  - counts as mastered after three fresh questions right at the first attempt without hints, with a second badge for doing it inside the exam's time per question.

  A wrong answer names the false belief and gives one more try before showing the answer; a miss in try-it asks you to find the first step you would not have written and name the error type. Multiple-choice options are shuffled (numbers sorted) so position never gives the answer away. Reviews start with writing the rule from memory; a failed review switches the scaffolds back on. A mistake log groups misses by the belief behind them, a weekly review asks you to read your own numbers before the app does, and the study home always shows one next step. Each book has a method recognition tree, a cheat sheet with a recall mode, a recognition drill and interleaved mixed practice. Every diagram's numbers are checked by a validator in the test suite.
- **Adaptive practice.** It picks weak families more often, missed families come back through spaced repetition, and a calibration panel says when skipping beats guessing under the −1 rule.
- **Zap-N:** all nine reported games (Balloon, Skyscraper, Shapeshift, CodeCompare, Pincode, NumberBox, Figure It Out, The Switch, Stock Master). Each has a coach, and the optimisers score you against the best possible play.
- **Readiness gate.** A section turns Ready after three full exams in a row at a target set above the reported pass lines. A started portal task cannot be reset, so open it only when its row says Ready.

## Run

```bash
cmake -S engine -B engine/build -G Ninja -DCMAKE_PREFIX_PATH=/usr/local && cmake --build engine/build
./run.sh                                   # http://127.0.0.1:8765 (Python backend if uv is present)
npm test                                   # JS tests (node --test)
ctest --test-dir engine/build              # 34 C++ tests (GoogleTest)
(cd backend && uv run pytest -q)           # 12 Python tests
(cd backend && uv run python -m oa_backend.pipeline)   # verify every library question
```

Without the backend the app still runs from static files and keeps progress in the browser. With it, answers and exam runs go to SQLite, the home page shows an exam forecast, and the verification report is served at `/api/verification`.

## How the pieces fit

| Layer | Language | Job |
|---|---|---|
| App | JavaScript (no dependencies) | Question generators with their own verifiers, exam replicas, teaching, Zap-N games, instant feedback in the browser |
| Engine (`engine/`) | C++20 | Heavy computation behind a JSON-lines CLI: parallel Monte Carlo (238M samples/s), orderbook branch and bound, NumberBox exhaustive search, Skyscraper BFS, Figure It Out and Balloon optimal play, NumberLogic rule search that flags ambiguous sequences |
| Backend (`backend/`) | Python 3.13 | HTTP API on 127.0.0.1, SQLite progress, a logistic ability model with bootstrap exam forecasts, and the verification pipeline that re-checks every library question in a second language |

## Verification results

The pipeline exports the fixed library (2,500+ questions) and checks each one outside JavaScript:
- **Orderbooks:** all 500 boards re-solved by an independent C++ branch and bound, with the same "single indecomposable package" objective; 0 disagreements.
- **NumberLogic:** all 520 sequences searched by the C++ rule library; 0 are ambiguous (no wrong option is explained by an equally simple rule).
- **Beat the Odds:** 184 questions re-simulated by C++ Monte Carlo within 4 standard errors.
- **Intervals:** 152 truths recomputed exactly in Python from the drawn visuals (dot counts, path lengths, medians) or closed forms; 13 simulated in C++.
- **Zap-N:** 300 Skyscraper optima, 300 NumberBox solutions, and every Figure It Out and Balloon optimum re-solved in C++. JS and C++ agree on every one.

The first runs of these checks found real bugs, all now fixed:
- a data race in a Monte Carlo sampler;
- two wrong pruning bounds in the orderbook search (spread instruments can trade at negative prices);
- a solver-objective mismatch between the JS and C++ orderbook solvers.

## Layout

```
config/sections.js     exam formats and readiness targets (edit here if the real format differs)
engine/                C++20 engine, GoogleTest suite, benchmarks
backend/               Python server, SQLite, analytics, verification pipeline
tools/                 Node exporters feeding the pipeline
src/core/              seeded RNG, exact fractions, combinatorics, Markov solver, scoring,
                       item contract, store, spaced repetition, adaptive picking, readiness
src/sections/<id>/     question families (generate + verify + lesson) and curated banks
src/zapn/<game>/       engine (pure, tested), view, coach
src/study/             Study guide: lesson schema and validators, micro-check grading, inline
                       markup (text nodes only), block renderers, pages, progress
src/study/diagrams/    one file per diagram type: render + an arithmetic validator
src/study/content/     one folder per book, one module per lesson (pure data)
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
