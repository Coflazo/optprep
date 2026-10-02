# Contributing to OptPrep

Thank you for helping. Three kinds of contribution help the most.

## Report a format change

If your Optiver online assessment differed from OptPrep's replica, [open a format report](https://github.com/Coflazo/optprep/issues/new?template=format-report.yml). Say which task, how many questions, the time limit, the scoring and the month you sat it. Do not paste real test questions: describe the format only.

## Add or fix a question family

Each family lives in `src/sections/<task>/families/` and exports:

- `generate(rng, { difficulty, variant })`, which returns an item with a prompt, options or an answer, and a solution;
- `verify(item)`, which recomputes the answer independently of `generate`;
- `lesson`, the short worked explanation shown in Learn mode.

Every wrong option needs a `misconception`: the belief that produces it. Write questions from scratch. Never copy questions from Optiver or from paid prep sites.

## Code

```bash
npm test                          # all JavaScript tests
node tools/responsive-audit.mjs   # needs: npm i --no-save playwright-core
(cd backend && uv run pytest -q)  # Python tests
```

The app has no build step and no runtime dependencies; keep it that way. Match the style of the file you are editing. Pull requests run CI on Linux, macOS and Windows.

By contributing you agree that your work is released under the MIT license.
