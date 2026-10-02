# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Candidates preparing for the Optiver trading online assessment: students applying to the Career Kickstarter, graduates, interns and PhDs applying to trader and quant trader roles. They usually study alone, in short daily sessions, on laptops and phones, with one attempt every eight months at stake.

## Product Purpose

Help a candidate pass the online assessment with exam-accurate practice: real timing and real scoring for each task, questions whose answers are independently verified, a lesson for every question type, and progress that shows exactly what to fix next. Success is a candidate who reaches the assessment knowing their pace, their weak patterns and how each task is scored.

## Positioning

Free and open source. Every answer is checked by an independent verifier. It is honest about what nobody outside Optiver knows: pass lines are not published and formats drift between cycles, so every format number carries its source and stays editable.

## Operating Context

- Tasks covered: 80-in-8 mental maths, Beat the Odds, NumberLogic, Likelihood List, Intervals, Orderbooks, Zap-N games, and a market-making round for after the online assessment.
- Role presets choose the battery a candidate will actually sit.
- Practice, timed sets, full exam replicas, a study guide with short steps and a question after every step, a mistake history and weak-pattern review.

## Capabilities and Constraints

- Unofficial. Never uses Optiver test content, logos or letterforms; Optiver is named only in plain text with a not-affiliated line.
- Works offline as a web app, installs on any OS, needs no account; progress stays on the device unless the user opts into their own GitHub Gist sync.
- No build step: vanilla JavaScript ES modules. Optional Python backend and C++ engine for verification and analytics.

## Brand Commitments

- Name: OptPrep. Descriptor: "for the Optiver online assessment".
- Palette direction set by the user: the navy-and-orange feel of the Optiver website, colours only.
- Voice: plain, calm, direct, like a good tutor. No hype.

## Evidence on Hand

- 2,500+ library questions verified outside JavaScript (see `backend/data/verification/report.json`).
- Format sources: QuantVault, Aptitude Test Prep, Tradermath, PracHub (links in `config/presets.js`).
- No testimonials, user counts or pass-rate claims exist. Do not invent them.

## Product Principles

1. Accuracy over flattery: the exam replica must feel like the real clock, and readiness never overstates.
2. One next step: every screen tells the candidate the single most useful thing to do now.
3. Show the mechanism: solutions explain why an answer is right and what belief makes the wrong one tempting.
4. Short sessions compound: a few focused minutes a day, with visible progress.

## Accessibility & Inclusion

WCAG 2.2 AA in both themes, full keyboard use, screen-reader labels on every control and chart, reduced-motion respected, 44 px touch targets.
