---
name: OptPrep
description: Exam-accurate practice for the Optiver online assessment, drawn as a machine-scored answer sheet.
colors:
  bg: "#F4F7FA"
  surface: "#FFFFFF"
  surface-2: "#EBF5FD"
  surface-3: "#CFE3F4"
  text: "#0F2442"
  text-2: "#3C5B7C"
  text-3: "#4F6F91"
  border: "#CFE3F4"
  border-strong: "#6E8AA5"
  accent: "#011735"
  accent-text: "#FFFFFF"
  brand: "#FF3300"
  brand-text: "#CC2900"
  brand-bg: "#FFEDE7"
  ink: "#D2492A"
  ink-rule: "#EDB6AA"
  ring: "#CC2900"
  correct: "#00754A"
  correct-bg: "#E3F5EC"
  wrong: "#C8102E"
  wrong-bg: "#FCE8EB"
  warn: "#8A5300"
  warn-bg: "#FFF3DC"
  viz-1: "#3C5B7C"
  viz-2: "#FF3300"
  viz-3: "#00754A"
  viz-4: "#7F00FF"
  viz-5: "#94ADBF"
typography:
  display:
    fontFamily: "Roboto, system-ui, -apple-system, SF Pro Text, Helvetica Neue, sans-serif"
    fontSize: "clamp(26px, 2.2vw + 14px, 32px)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Roboto, system-ui, -apple-system, SF Pro Text, Helvetica Neue, sans-serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Roboto, system-ui, -apple-system, SF Pro Text, Helvetica Neue, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.35
  prompt:
    fontFamily: "Roboto, system-ui, -apple-system, SF Pro Text, Helvetica Neue, sans-serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Roboto, system-ui, -apple-system, SF Pro Text, Helvetica Neue, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Roboto, system-ui, -apple-system, SF Pro Text, Helvetica Neue, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.5
  data:
    fontFamily: "Roboto Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  answer:
    fontFamily: "Roboto Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "tnum"
  score:
    fontFamily: "Roboto Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "36px"
    fontWeight: 600
    lineHeight: 1.1
    fontFeature: "tnum"
rounded:
  sm: "4px"
  md: "6px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "32px"
  rail: "22px"
  sidebar: "248px"
  tabbar: "64px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-text}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "color-mix(in srgb, #011735 86%, #FF3300)"
  button-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-default-hover:
    backgroundColor: "{colors.surface-2}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-2}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-small:
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "34px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  bubble:
    backgroundColor: "{colors.surface}"
    rounded: "50%"
    width: "14px"
    height: "18px"
  bubble-filled:
    backgroundColor: "{colors.text}"
  answer-option:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.answer}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
    height: "52px"
  answer-option-selected:
    backgroundColor: "{colors.surface-2}"
  answer-option-correct:
    backgroundColor: "{colors.correct-bg}"
  answer-option-wrong:
    backgroundColor: "{colors.wrong-bg}"
  next-step:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "20px 22px"
  score-box:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.score}"
    rounded: "{rounded.md}"
    padding: "10px 16px 12px"
    width: "140px"
  grid-row-current:
    backgroundColor: "{colors.brand-bg}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "12px 10px"
  nav-item:
    textColor: "{colors.text-2}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
    height: "36px"
  nav-item-current:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
  stamp-mastered:
    backgroundColor: "{colors.correct-bg}"
    textColor: "{colors.correct}"
    rounded: "{rounded.sm}"
    padding: "1px 7px"
  stamp-needs-review:
    backgroundColor: "{colors.warn-bg}"
    textColor: "{colors.warn}"
    rounded: "{rounded.sm}"
    padding: "1px 7px"
  toast:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-text}"
    rounded: "{rounded.md}"
    padding: "10px 12px 10px 16px"
---

# Design System: OptPrep

## Overview

**Creative North Star: "The Machine-Scored Answer Sheet"**

Every screen is a form the candidate fills in and a machine grades. Two inks share the page: an orange drop-out ink prints the form itself (bubble rings, field frames, rules, row numbers, field labels), and a navy graphite records everything the candidate has marked (filled bubbles, chosen answers, progress, the timing rail). A choice is a bubble you fill, the timer is the invigilator's clock, and submitting is a scan: one orange line sweeps the sheet, grades each row as it passes, and then prints the score in the corner box.

The system is calm and dense in the way exam paper is dense: hairline rules, white sheet surfaces on a cool, low-glare field, square-ish 6px corners, no shadows, and hierarchy carried by size and weight rather than colour or decoration. Orange is rare and functional; it marks the printed form and the one place the eye should go next. It rejects the cartoon learning-app path outright: no round progress nodes, no mascots, no confetti.

The palette direction comes from the user's brief (the navy-and-orange feel of the Optiver website, colours only). Optiver appears only as the assessment's name in plain text, with the not-affiliated line in the sidebar foot; the product never uses Optiver's marks, letterforms or test content.

**Key Characteristics:**
- Two inks: orange drop-out ink for the form, navy graphite for the candidate's marks.
- Answer bubbles (upright ovals) as the core control for levels, goals, radio choices and multiple-choice keys.
- Flat white sheets on a #F4F7FA field; tonal layering, one shadow in the whole system (the toast).
- 6px corners, 1px rules, 1.5px printed rings.
- Roboto for words, Roboto Mono with tabular numerals for anything counted, timed or scored.
- One next step per screen; the current row is banded, never striped.
- Motion at a lively, game-like level, built on transform and opacity only, with reduced motion respected.

## Colors

A cool navy-and-white sheet printed in one orange ink, with three grading colours that appear only after an answer is judged.

### Primary
- **Night Navy** (#011735): the primary action. Fills the primary button, the toast and the skip link; one per screen at most. In dark mode it inverts to the near-white #F4F7FA so the action stays the strongest mark.
- **Graphite Navy** (#0F2442): body text and every mark the candidate makes: filled bubbles, the chosen option's key, filled timing-rail marks, met-goal bars, the exam progress bar.

### Secondary
- **Signal Orange** (#FF3300): the printed brand. The o of the wordmark, the scan line, the active tab underline, the goal line in charts, the boot bar. Never used for text: it only clears 3:1.
- **Form Ink** (#CC2900): orange as text. Field labels, roadmap row numbers, step numbers, the score label, "You are here", the focus ring (as `ring`). Dark mode lifts it to #FF7A57.
- **Drop-out Ink** (#D2492A): printed form furniture that must stay visible. Bubble rings, option key rings, step-number rings, the rule under each roadmap unit heading, the score box frame, and the border of every text and number input (3:1 against the sheet, WCAG 1.4.11). Dark #E87556.
- **Pale Drop-out Ink** (#EDB6AA): the frame of answer-bearing field boxes: the next-step box, each multiple-choice option, the lesson check block. A pale print that reads as form, not as chrome. Dark #7A3E2E, on the same ink hue.
- **Current-Row Tint** (#FFEDE7): the band behind the current roadmap row, the fill of the current row's empty bubbles, the hover wash in an option's key.

### Tertiary
- **Graded Green** (#00754A on #E3F5EC): correct answers, "Mastered" and "Ready" stamps, the "Target met" badge.
- **Graded Red** (#C8102E on #FCE8EB): wrong answers, "Below target", a low timer, a pace that is over.
- **Review Amber** (#8A5300 on #FFF3DC): "Review due" stamps and attempt notes.
- **Chart Series** (`viz-1` to `viz-5`: slate #3C5B7C, signal orange #FF3300, green #00754A, violet #7F00FF, mist #94ADBF): diagram curves, regions, strands and order-book sides only, in that order.

### Neutral
- **Cool Field** (#F4F7FA): the page behind the sheet, the rail column, sticky lesson bars. Chosen over pure white so long sessions are not eye-tiring; dark mode uses #021129.
- **Sheet White** (#FFFFFF): the sheet itself: panels, fields, options, inputs, the sidebar. Dark mode prints the sheet on night navy #011735.
- **Pale Sky Band** (#EBF5FD): selection and position. The sidebar's current item, a selected option, a checked choice, hover washes, code and formula chips.
- **Sky Track** (#CFE3F4): progress tracks and the scrollbar thumb (`surface-3`), and the hairline rule between rows (`border`).
- **Steel Rule** (#6E8AA5): default button outlines, empty rail marks, unfilled chart bars, dashed empty-state frames.
- **Slate Blue** (#3C5B7C) and **Muted Slate** (#4F6F91): secondary text (meta lines, hints, table heads) and tertiary text (nav counts, group labels, chart day labels).

### Named Rules
**The Two Inks Rule.** Orange prints the form; navy is what the candidate wrote. A ring, rule, frame or label is orange. A fill, an answer, a count of progress is navy. Never fill a bubble orange and never print form furniture in navy.

**The Rare Orange Rule.** Signal Orange (#FF3300) is a mark, not a surface. It appears as the wordmark's o, a 2px line or a thin rule; it never fills a button, a card or a background, and it never sets text.

**The Graded Colour Rule.** Green, red and amber appear only once an answer has been judged or a state has been earned. Nothing is green before it is correct.

## Typography

**Display Font:** Roboto (self-hosted woff2, with system-ui fallback)
**Body Font:** Roboto
**Label/Mono Font:** Roboto Mono (self-hosted woff2, with ui-monospace fallback)

**Character:** One neutral grotesque for every word and one monospace for every number, pinned by the brief. The pairing reads like a printed form: plain sans for the questions, typewriter-even digits for anything measured.

### Hierarchy
- **Display** (700, clamp(26px, 2.2vw + 14px, 32px), 1.15, -0.02em): the page heading, one per page ("Today", a task name, "Beat the Odds: result"). 26px on phones.
- **Headline** (600, 19px, 1.3, -0.01em): section headings on a page and the "Solution" heading of a worked solution, in text ink. The next-step title runs at 20px in the same voice.
- **Title** (600, 16px, 1.35): sub-headings. Roadmap unit heads run at 17px, task section heads at 18px, lesson activity headings (`.block-title`) at 15px.
- **Prompt** (400, 19px, 1.5): the question being answered in the runner. Lesson prompts drop to 15px.
- **Body** (400, 16px, 1.55): all reading text. Ledes at 17px in secondary text, capped at 62ch; lesson bodies capped at 72ch.
- **Label** (600, 13px): field labels in Form Ink and table heads in secondary text. Meta lines and hints run at 13px regular.
- **Data** (Roboto Mono 400, 14px, tabular): counts, format lines, badges (12px), timers (16px), pace.
- **Answer** (Roboto Mono 400, 17px, tabular): the value printed in each multiple-choice option.
- **Score** (Roboto Mono 600, 36px, 1.1, tabular): the number printed in the score box, over a 12px Form Ink label and a 13px "of N" line.

### Named Rules
**The Measured-in-Mono Rule.** Every number that is counted, timed or scored is set in Roboto Mono with tabular numerals: timers, scores, row counts, option values, formulas, badges. Words stay in Roboto. Mono is never a costume for prose.

**The Scale-Not-Case Rule.** Hierarchy comes from size and weight steps. Text is sentence case; the only capitals are the score box label, printed like the heading of a form field.

**The One Boundary Rule.** Every piece of item text passes through one `prose()` boundary before it prints: caret exponents become superscripts (2^6 prints 2⁶) and counts agree with their nouns (exactly 1 head, 1 tail then a head). No component formats item text on its own.

## Layout

The sheet is a single reading column on a quiet field, with an index beside it on desktop and a tab bar below it on phones.

- **Desktop (1024px and up):** a 248px white sidebar index, then the sheet: a 22px rail column carrying the timing rail down its left edge, then the main column, max 1040px wide, padded 40px top, clamp(20px, 4vw, 48px) at the sides and 64px at the bottom. Above 1600px the main column centres.
- **Below 1024px:** a sticky 56px top bar with the wordmark and today's stats, the rail turned into a thin 8px strip along the top of the sheet, and a fixed 64px bottom tab bar with five tabs. Main padding becomes 24px top and 16px sides, honouring safe-area insets.
- **Phones (640px and below):** the next-step box stacks its action under the title, roadmap rows re-flow into a two-line grid, and top-level panels drop their frame so the screen itself is the sheet.
- **Short landscape phones:** the rail hides and the question and options tighten to fit one screen. Dual-screen devices put the question on one segment and the answers on the other.

**Rhythm.** Spacing steps through 4, 8, 12, 16, 20 and 32px. Groups sit tight (4 to 8px inside a row, 12px between stacked items), fields and panels pad 18 to 20px, and sections open with 28 to 32px above a heading and 8 to 10px below it. Rows in tables, task lists and the roadmap grid are separated by 1px hairlines, not gaps.

**Today is quiet.** The home page shows one next-step field box, then a plain list of tasks, one row each (name, progress, Ready or Review stamps). The full answer grid lives on each task's roadmap page, not on Today. This is a user decision that replaces the direction's first-viewport grid.

### Named Rules
**The One Next Step Rule.** Each screen leads with a single primary action. On Today it is the next-step box; on a roadmap it is the current row's button; everywhere else, one Night Navy button.

## Elevation & Depth

The system is flat. Depth comes from tonal layering: the Cool Field (#F4F7FA) sits behind white sheet surfaces, and Pale Sky Band (#EBF5FD) marks selection on top of the sheet. Containers declare their edge once, with a 1px border, and carry no shadow. The single shadow in the system belongs to the toast, the only element that floats above the sheet. The mobile top bar and tab bar are near-opaque (88% and 92%) with a light backdrop blur so content scrolling beneath stays legible; under reduced transparency they turn solid.

### Shadow Vocabulary
- **Toast lift** (`box-shadow: 0 2px 8px rgba(1, 23, 53, 0.07)`; dark `0 2px 8px rgba(0, 0, 0, 0.35)`): the bottom toast only.

### Named Rules
**The Printed-Flat Rule.** Paper has no elevation. A surface is separated by its frame or its tone, never by a shadow; the toast is the one thing allowed to float.

## Shapes

Square-ish forms on a printed page. Fields, panels, buttons, options, inputs and the current-row band share one gentle 6px corner; stamps, badges, inline code and keyboard keys use 4px. Rules are 1px; printed rings are 1.5px (1.25px on roadmap rows that are not current). Bubbles are upright ovals, 14 by 18px (10 by 13px in the small set), and option and step keys reuse the same oval at 24 by 30px and 22 by 26px. Dashed 1px rules mark secondary divisions: the readiness line, the line under a solution's question, empty states, warm-ups. There are no pill-shaped controls and no fully round buttons.

### Named Rules
**The Oval Is the Answer Rule.** The oval belongs to answering. Only bubbles, answer keys and solution step numbers are oval; every container and control stays at 6px.

## Components

### Buttons
Plain, firm and quiet until pressed.
- **Shape:** gently squared (6px), 40px tall, 16px side padding, weight 500, icon gap 8px.
- **Primary:** Night Navy fill with white text. One per view.
- **Default:** Sheet White with a 1px Steel Rule outline and text ink.
- **Ghost:** no fill or frame, secondary text. **Danger:** red text on a 45% red outline. **Small:** 34px tall, 12px padding, 14px text.
- **Hover / Focus:** hover only on fine pointers. Default goes to Pale Sky Band; primary mixes 14% Signal Orange into the navy and nudges its arrow 2px right. Focus is a 2px Form Ink outline, 2px offset. Press scales to 0.97 over 160ms. Disabled drops to 45% opacity.

### Answer Bubbles (signature)
The core control: levels, daily goals, radio choices and skill progress are all rows of bubbles.
- **Ring:** 1.5px Drop-out Ink oval on Sheet White.
- **Filled:** a Graphite Navy oval inset 2px, scaling in from 0.6 over 120ms with a 30ms stagger per bubble.
- **Current row:** empty bubbles take a Form Ink ring on the Current-Row Tint; rows that are not current thin their rings to 1.25px.
- **Level-up:** new marks pop in once with a small overshoot (280ms, peak 1.15).
- **Choice groups:** each radio option is a 6px-cornered row with a bubble, label and hint; the native input stays for keyboard and screen readers. Checked rows take a Muted Slate frame on Pale Sky Band.

### Field Boxes
Printed boxes that hold an answer.
- **Frame:** 1px Pale Drop-out Ink, 6px corners, Sheet White inside. Used by the next-step box, each multiple-choice option and the lesson check block.
- **Next-step box:** 20px by 22px padding; a 20px title, a 14px secondary line naming the task and why, the level bubbles, and the primary action on the right. Hover darkens the frame to secondary text; press scales to 0.99.
- **Multiple-choice option:** at least 52px tall, the key letter (A to E) in a 24 by 30px Drop-out Ink oval in Form Ink mono, the value in 17px mono. Selecting fills the key Graphite Navy with white text on a Pale Sky Band row. After grading, the correct option turns green and a wrong pick turns red, frame and fill.
- **Field label:** 13px, weight 600, Form Ink, as the box's own heading.

### Inputs
- **Style:** 40px tall, 12px padding, 6px corners, Sheet White, 1px full Drop-out Ink border so the boundary holds 3:1. Number entry in the runner uses 18px mono.
- **Focus:** the border clears and a 2px Form Ink outline sits 1px out.
- **Values:** what the candidate types is Graphite Navy; labels around it (bid, ask) are Form Ink.

### Score Corner Box
- **Frame:** 1px full Drop-out Ink, 6px corners, at least 140px wide, top right of the result sheet beside the title.
- **Content:** right-aligned mono: a 12px Form Ink label (NET SCORE or TOTAL) with 0.04em tracking, the 36px score in text ink, and "of N" in 13px secondary text.
- **Behaviour:** hidden until the scan finishes, then it fades in over 200ms and takes focus so screen readers hear the score.

### The Scan
- **Line:** a 2px Signal Orange line sweeps the result sheet top to bottom over 900ms on the in-out curve (cubic-bezier(0.77, 0, 0.175, 1)).
- **Grading:** each row tints green or red at 60% as the line passes it; skipped rows stay plain.
- **Reduced motion:** every row is graded at once and the score prints immediately.

### Roadmap Answer Grid
- **Unit head:** a 17px heading and a mono "3 of 10" count over a 1px Drop-out Ink rule.
- **Row:** row number in Form Ink, title at weight 500 with a 13px skill line, five level bubbles, a state stamp and a quiet action, separated by hairlines.
- **Current row:** banded in the Current-Row Tint with 6px corners, a "You are here" pencil note in Form Ink, and the row's action promoted to primary. Rows further ahead drop to secondary text at weight 400.

### Stamps and Badges
What a grader writes in the margin, for real state only.
- **Stamps:** 12px, weight 500, 4px corners, 1px current-colour frame (New, In progress). "Review due" is amber on amber tint and "Mastered" or "Ready" green on green tint, frameless.
- **Badges:** 12px mono with a hairline frame; Right, Wrong and Skipped on the result table.

### Navigation
- **Sidebar:** 248px Sheet White index with the wordmark lockup at the top and the not-affiliated line at the foot. Items are 36px tall in secondary text, the top-level ones led by a Phosphor icon (regular weight); group labels are 12px tertiary text.
- **Current item:** a Pale Sky Band band with text ink at weight 500. The band alone marks it.
- **Tab bar (below 1024px):** five tabs, 11px labels under icons; the current tab goes text ink at weight 600 with a 2px Signal Orange bar on its top edge. Icons press to 0.9.
- **In-page tabs:** the current tab takes a 2px Signal Orange underline that grows from 40% width.

### Timing Rail
- **Marks:** 24 marks, 10 by 4px, empty in Steel Rule at 55% opacity, filled in Graphite Navy.
- **Meaning:** fills with today's minutes against the goal on Today and with progress in a run; full at the end of an exam.

### Worked Solution
- **Heading:** "Solution" at headline scale in text ink.
- **Order:** the question restated over a dashed rule, an optional figure, numbered steps (numbers in 22 by 26px ink ovals) with each step's arithmetic in a mono chip on Pale Sky Band, then the exam-speed path and the sanity check (13px Form Ink sub-headings), then the rule in a mono box.
- **Pacing:** steps reveal one at a time in practice, all at once in exam review.

### Lesson Blocks
- **Frame:** every interactive block shares a 1px hairline frame, 6px corners, 14 by 16px padding on Sheet White; the check block uses the Pale Drop-out Ink frame.
- **Activity headings:** the activity a block asks for (Find the error, Explain it, Worked example) is a heading in text ink at 15px, weight 600.
- **Scope note:** the question leads; what it draws on ("Uses only: ...") sits under it as a 13px secondary footnote.
- **Callouts:** a printed note: tone lives in the label colour and a faint tint of that tone, never in a stripe.

### Toast
- **Style:** Night Navy with white text, 6px corners, the system's one shadow, a Signal Orange icon.
- **Motion:** enters and leaves through the bottom edge over 400ms; under reduced motion it only fades.

### Wordmark
- **Form:** lowercase "optprep" in Roboto Bold outlines. The o is printed in Signal Orange with its counter filled like a pencil mark; the letters and the mark follow the text colour, so the wordmark works in light, dark and forced-colour modes. The o alone is the app mark.
- **Lockup:** the wordmark over the descriptor "for the Optiver online assessment" in 12px secondary text.

### Motion
Lively and game-like by the user's request, built only on transform and opacity.
- **Curves:** a strong ease-out (cubic-bezier(0.23, 1, 0.32, 1)) for anything answering the user, the in-out curve for the scan, plain ease for colour.
- **Durations:** 120ms for colour and fills, 160ms for presses, 200ms for indicators and fades, 280ms for level-up pops, 400ms for the toast and the XP ticker, 900ms for the scan. Page changes crossfade in 120 to 160ms.
- **Reduced motion:** movement goes, colour and opacity stay; animations play once; the scan and the ticker jump to their end state.

## Do's and Don'ts

### Do:
- **Do** print form furniture (rings, frames, rules, field labels, row numbers) in the orange inks and every candidate mark (fills, answers, progress) in Graphite Navy (#0F2442).
- **Do** frame answer-bearing field boxes in Pale Drop-out Ink (#EDB6AA light, #7A3E2E dark) and keep text and number inputs on full Drop-out Ink (#D2492A) so their boundary holds 3:1.
- **Do** set every number that is counted, timed or scored in Roboto Mono with tabular numerals.
- **Do** keep corners at 6px for containers and controls and 4px for stamps and badges; keep rules at 1px and printed rings at 1.5px.
- **Do** mark the current place with a band: Pale Sky Band in the sidebar, the Current-Row Tint on the roadmap.
- **Do** lead each screen with exactly one primary action.
- **Do** animate with transform and opacity only, keep UI motion at or under 300ms (the scan is the one 900ms moment), and honour reduced motion.
- **Do** gate hover effects behind fine pointers and give coarse-pointer targets at least 44px.
- **Do** route all item text through `prose()` for superscripts and count agreement.
- **Do** keep the Cool Field (#F4F7FA) behind the sheet and Sheet White (#FFFFFF) for the sheet itself.
- **Do** name Optiver only in plain text, with the not-affiliated line, and spell out "online assessment" in full.

### Don't:
- **Don't** set text in Signal Orange (#FF3300); orange text is Form Ink (#CC2900 light, #FF7A57 dark).
- **Don't** fill buttons, cards or backgrounds with orange; it prints lines, rings and the wordmark's o.
- **Don't** mark a current or toned item with a side stripe or a thick coloured left border.
- **Don't** add shadows; the toast carries the only one.
- **Don't** put a small label or kicker above a heading; an activity name is the heading itself, and scope notes go below the question as a footnote.
- **Don't** use round progress nodes, mascots, confetti or other cartoon learning-app devices.
- **Don't** use pills or fully round buttons; ovals belong to bubbles, answer keys and step numbers alone.
- **Don't** show green, red or amber before an answer has been graded or a state earned.
- **Don't** use Optiver's marks, letterforms or test content.
