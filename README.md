<!-- DEMO-GIF: replaced by the chosen launch clip -->

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/wordmark-dark.svg">
    <img src="assets/wordmark.svg" alt="optprep" height="56">
  </picture>
</p>

<p align="center"><strong>Free practice for the Optiver online assessment.</strong><br>
80-in-8, Beat the Odds, NumberLogic, Likelihood List, Intervals, Orderbooks and Zap-N, on the real clocks, with a lesson for every question type.</p>

<p align="center">
  <a href="https://coflazo.github.io/optprep/"><img alt="Open OptPrep" src="https://img.shields.io/badge/open-OptPrep-011735?style=flat-square"></a>
  <a href="https://github.com/Coflazo/optprep/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/Coflazo/optprep/ci.yml?branch=main&style=flat-square&label=tests"></a>
  <a href="https://github.com/Coflazo/optprep/releases"><img alt="Release" src="https://img.shields.io/github/v/release/Coflazo/optprep?style=flat-square"></a>
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-011735?style=flat-square"></a>
</p>

You get one attempt at the Optiver online assessment every eight months. OptPrep lets you sit it as many times as you like first: the same clocks, the same scoring, fresh questions every time, and a lesson that shows you why each wrong answer looked right.

## Start

Open [coflazo.github.io/optprep](https://coflazo.github.io/optprep/) in any browser. You install nothing, and it keeps working offline after the first visit. Your browser's Install button puts it on your dock or home screen.

To run it yourself on macOS, Linux or Windows, you need Node 20 or newer:

```bash
npx optprep
```

Or from the source:

```bash
git clone https://github.com/Coflazo/optprep.git
cd optprep
npm start            # or: python serve.py
```

Your progress stays on your device. Settings has backup and restore, and optional sync to a private gist in your own GitHub account, encrypted with a passphrase if you add one.

## What you practise

Pick the battery you will sit, and OptPrep matches the tasks and clocks to it.

| Battery | Tasks |
|---|---|
| Career Kickstarter: Trading | Beat the Odds, NumberLogic, Likelihood List, Intervals (45 s each), Orderbooks, Zap-N |
| Trader and Quant Trader | 80-in-8, NumberLogic (15 in 25 min), Beat the Odds (30 questions), Likelihood List, Zap-N |
| Everything | Every task at its most commonly reported format |

| Task | Exam replica | Scoring |
|---|---|---|
| 80-in-8 | 80 questions in 8 minutes, tap to answer, no going back | +1 right, −1 wrong |
| Beat the Odds | 20 questions, 90 s each | +1, −1, or skip for 0 |
| NumberLogic | 26 sequences in 25 minutes, skip and return | +1, −1, or skip for 0 |
| Likelihood List | 15 sets of three statements, 90 s each | 1 point for the exact order |
| Intervals | 18 estimates, 60 s each | lower ÷ upper when the truth is inside |
| Orderbooks | 20 boards in 8 minutes | boards solved; a wrong submit costs 5 s |
| Zap-N | 9 games | each scored against the best possible play |

After the online assessment, Optiver's interviews include market-making games. OptPrep's bonus round has you quote two-sided markets against a trader who knows more than you.

## How you learn

Each task has a roadmap that runs from Foundations to Exam pace. A skill has five levels. Three clean answers in a row earn a level; the fifth also needs exam speed.

Lessons move in short steps. You meet one idea, answer a question on it, then move to the next.

Every wrong option in the question bank carries the belief that produces it. When you miss, OptPrep names the belief you used and walks you through the solution with a picture and the shortcut an expert takes inside the time limit.

OptPrep also keeps a list of the skills and beliefs that keep costing you points, with recent answers weighted more. One tap gives you ten questions on any of them.

Set a daily goal of five, ten or twenty minutes. Only time spent answering or reading counts toward it.

## Limits

- Optiver publishes no pass lines. The Ready mark means your last three full exams met OptPrep's bar, which sits above the lines candidates report. It lowers your risk. It cannot promise a pass.
- The battery changes between roles and years. Every format number lives in [`config/sections.js`](config/sections.js) and [`config/presets.js`](config/presets.js) with its source. If your online assessment looked different, [open a format report](https://github.com/Coflazo/optprep/issues/new?template=format-report.yml) and the next release will match it.
- Zap-Q, the personality questionnaire, has no right answers to practise. Answer it honestly and consistently.
- Software engineering, quant developer and quant researcher assessments are different tests. OptPrep does not cover them.

## How the questions are checked

Every question family has a generator and an independent verifier. A second pipeline re-checks the whole library outside JavaScript:

- Orderbooks: every board re-solved by a C++ branch and bound.
- NumberLogic: every sequence searched by a C++ rule library, so no wrong option fits an equally simple rule.
- Beat the Odds and Likelihood List: probabilities re-simulated by C++ Monte Carlo.
- Intervals: truths recomputed in Python from the drawn figures.
- Zap-N: optimal play re-solved in C++ for Skyscraper, NumberBox, Figure It Out and Balloon.

```bash
npm test                                                  # JavaScript tests
(cd backend && uv run pytest -q)                          # Python tests
cmake -S engine -B engine/build && cmake --build engine/build && ctest --test-dir engine/build
(cd backend && uv run python -m oa_backend.pipeline)      # re-check the full library
```

## Inside

| Part | Language | What it does |
|---|---|---|
| App | JavaScript, no dependencies | Generators and verifiers, exam replicas, lessons, games, progress |
| Engine | C++20 | Monte Carlo, orderbook search and game solvers behind a JSON-lines CLI |
| Backend | Python, standard library | Optional local server: SQLite progress, an exam forecast, the verification pipeline |

The design system lives in [`src/ui/styles.css`](src/ui/styles.css) and in the [Figma file](https://www.figma.com/design/SSJJYxsaSQq6rflRuGf0xZ).

## Contributing

Format reports matter most: they keep the replicas honest. Code and question families are welcome too. Read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## License

[MIT](LICENSE). OptPrep is an independent project. It is not affiliated with or endorsed by Optiver, and it contains no Optiver test content.
