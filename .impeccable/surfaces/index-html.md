---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["src/ui/styles.css"]
---

# OptPrep app surface

Scope: the whole app (home, roadmaps, runner, results, study guide, progress, settings). Mode: Operate.
Audience: candidates preparing for the Optiver online assessment, short daily sessions on laptop and phone.
Task: practise under real timing, see exactly what to fix, take one next step.
Constraints: navy and orange palette pinned by the user; Roboto and Roboto Mono; no Optiver marks; WCAG AA both themes; reduced motion respected.

## Direction contract

THESIS: The app is a machine-scored answer sheet. Every choice is a bubble you fill, every timer is the invigilator's clock, every result is a scan. It refuses the cartoon learning-app path of round nodes, mascots and confetti.

OWN-WORLD: White sheet (navy night sheet in dark). Orange drop-out ink prints all form furniture: field boxes, bubble rings, rules, field labels in Roboto Mono. Navy graphite is everything the candidate marks: filled bubbles, answers, progress. A rail of timing marks runs down the left edge and fills as you go. Corners square to 6px, 1px rules, no shadows beyond one.

STORY: The candidate sees one field to fill next, fills it, gets scanned, and watches their skill rows fill from easy at the top to exam pace at the bottom.

FIRST VIEWPORT: Left edge timing rail. Top: optprep wordmark with the bubble o, streak and today's minutes in mono. Centre: the current skill row as a large field box with its five level bubbles and one primary action, Continue. Below: the section's answer grid, current row banded orange.

FORM: Exam answer sheet, my own candidate 1 of 7 (pick card), seed 529a771f. Raises: only the next decision on phones (airport wayfinding); missed rows stay lit until reviewed (gate board); study books carry a fore-edge tab rail sized by length (manual tab board); hierarchy by scale contrast alone (type specimen).

SIGNATURE INTERACTION: Submit is a scan. One orange line sweeps the sheet top to bottom, grading each row as it passes, then the score prints in the corner box.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
