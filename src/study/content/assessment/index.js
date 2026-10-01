// Book 1: how the assessment works. Strategy lessons: formats, scoring, pacing,
// closest-value answering, calibration, and how to train with this app.
// Formats are read from config, so this book cannot drift from the exam replicas.
import { SECTIONS, PORTAL_ORDER } from '../../../../config/sections.js';

const sec = (key, title) => ({ type: 'section', key, title });
const fmt = (x) => String(Math.round(x * 1000) / 1000);
const secs = (c) => (c.exam.perItemSeconds ? c.exam.perItemSeconds : c.exam.totalSeconds / c.exam.count);
const SCORING = { plusMinus: '+1 right, −1 wrong, 0 skipped', exactOrder: '1 point only for the exact order', ratio: 'lower ÷ upper if the truth is inside, else 0', solved: 'boards solved; a wrong submit costs time' };

const sixTasks = {
  id: 'assessment/six-tasks', book: 'assessment', kind: 'strategy', title: 'The six tasks at a glance',
  summary: 'What each portal task asks, how long you get, and how it is scored.',
  blocks: [
    sec('formats', 'The formats'),
    { type: 'text', text: 'The portal lists six tasks. Each is a separate sitting with its own clock, and a task you open cannot be reset, so you take each one only when its row in Readiness says Ready.' },
    { type: 'compare', columns: ['Task', 'Questions', 'Time', 'Scoring', 'Going back'], rows: PORTAL_ORDER.filter((id) => id !== 'zapn').map((id) => {
      const c = SECTIONS[id];
      return [c.title, String(c.exam.count), c.exam.perItemSeconds ? `${c.exam.perItemSeconds} s each` : `${c.exam.totalSeconds / 60} min total`, SCORING[c.exam.scoring], c.exam.navigation === 'free' ? 'yes, skip and return' : 'no'];
    }).concat([['Zap-N', '9 games', 'per game', 'speed, accuracy and planning per game', 'no']]) },
    { type: 'diagram', diagram: 'flow', spec: { root: 'start', nodes: [
      { id: 'start', text: 'Portal order', kind: 'note' },
      ...PORTAL_ORDER.map((id, i) => ({ id, text: `${i + 1}. ${id === 'zapn' ? 'Zap-N: 9 mini-games' : `${SECTIONS[id].title}: ${SECTIONS[id].kind === 'mcq' ? 'multiple choice' : SECTIONS[id].kind === 'rank' ? 'order three statements' : SECTIONS[id].kind === 'interval' ? 'give a range' : 'build a trade'}`}`, kind: 'a' })),
    ], edges: PORTAL_ORDER.map((id, i) => ({ from: i ? PORTAL_ORDER[i - 1] : 'start', to: id })) }, caption: 'The tasks in the order the portal lists them.' },
    { type: 'check', scope: 'the format table', questions: [
      { type: 'choice', q: 'In which task can you skip a question and come back to it later?', options: ['NumberLogic', 'Beat the Odds', 'Likelihood List', 'Intervals'], answer: 0, explain: 'NumberLogic has one 25-minute clock and free navigation; the others move forward only.' },
      { type: 'choice', q: 'Which task gives partial credit for a close answer?', options: ['Intervals', 'Likelihood List', 'Beat the Odds', 'Orderbooks'], answer: 0, traps: { 1: 'Likelihood List scores only the exact order' }, explain: 'Intervals scores lower ÷ upper whenever the truth is inside the range, so a tight range scores near 1.' },
    ] },
    sec('rule', 'Rule'),
    { type: 'callout', tone: 'rule', text: 'Six separate sittings, one clock each, no resets: open a task only when its row says Ready.' },
    sec('predict', 'Predict'),
    { type: 'predict', question: 'Before reading the next lesson: in a task scored +1/−1, is it ever right to leave a question blank?', answer: 'Yes: whenever your chance of being right is below one half.', explain: 'The next lesson derives this from the expected score.' },
  ],
};

const minusOne = {
  id: 'assessment/minus-one-rule', book: 'assessment', kind: 'strategy', title: 'The −1 rule: when to answer and when to skip',
  summary: 'Answer when P(right) > 1/2; the expected score of a guess is 2p − 1.',
  prerequisites: ['assessment/six-tasks'],
  blocks: [
    sec('ev', 'Expected score of answering'),
    { type: 'text', text: 'Beat the Odds and NumberLogic score +1 for right, −1 for wrong and 0 for a skip. If you answer with probability p of being right, your expected score is p × (+1) + (1 − p) × (−1).' },
    { type: 'formula', text: 'E[score] = p − (1 − p) = 2p − 1' },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 0, max: 1, label: 'p = chance your answer is right' }, y: { min: -1, max: 1, label: 'expected points' }, curves: [{ label: 'answer: 2p − 1', points: [[0, -1], [0.5, 0], [1, 1]] }, { label: 'skip: 0', points: [[0, 0], [1, 0]] }], vlines: [{ x: 0.5, label: 'break-even' }] }, caption: 'Answering beats skipping exactly when the line is above zero: p > 1/2.' },
    { type: 'check', scope: 'E[score] = 2p − 1', questions: [
      { make: (rng) => { const p = rng.pick([0.3, 0.4, 0.6, 0.7, 0.8]); return { type: 'number', q: `You are right with probability ${p}. What is the expected score of answering?`, answer: 2 * p - 1, tolerance: 1e-9, explain: `2 × ${p} − 1 = ${fmt(2 * p - 1)}.` }; } },
      { type: 'choice', q: 'At which chance of being right are answering and skipping worth the same?', options: ['1/2', '1/5', '2/3', '1/4'], answer: 0, traps: { 1: 'one in five options is the blind-guess rate, not the break-even point' }, explain: '2p − 1 = 0 at p = 1/2.' },
    ] },
    sec('elimination', 'Elimination changes p'),
    { type: 'text', text: 'A blind guess among 5 options has p = 1/5, expected score 2/5 − 1 = −0.6: never guess blind. Each option you rule out raises p. With k options left, p = 1/k.' },
    { type: 'compare', columns: ['Options left', 'p', 'Expected score', 'Decision'], rows: [5, 4, 3, 2, 1].map((k) => [String(k), `1/${k}`, fmt(2 / k - 1), 2 / k - 1 > 1e-9 ? 'answer' : Math.abs(2 / k - 1) < 1e-9 ? 'either (worth 0)' : 'skip']) },
    { type: 'check', scope: 'p = 1/k after elimination', questions: [
      { type: 'choice', q: 'You have ruled out 3 of the 5 options for certain. Guess or skip?', options: ['Either: guessing is worth 0', 'Guess: guessing is worth +0.5', 'Skip: guessing is worth −0.2'], answer: 0, traps: { 1: 'p = 1/2 gives 2p − 1 = 0, not +0.5', 2: 'used p = 2/5; with two options left p = 1/2' }, explain: 'Two options left: p = 1/2, 2p − 1 = 0.' },
      { type: 'number', q: 'Expected score of guessing uniformly among 4 remaining options?', answer: -0.5, tolerance: 1e-9, explain: 'p = 1/4, 2 × 1/4 − 1 = −0.5.' },
    ] },
    sec('rule', 'Rule'),
    { type: 'callout', tone: 'rule', text: 'Answer only when P(right) > 1/2 (EV = 2p − 1). Never guess blind among 5 (−0.6 per guess).' },
    sec('predict', 'Predict'),
    { type: 'predict', question: 'Your "unsure" answers are right 45% of the time. Over 10 unsure questions, what do answering and skipping score on average?', answer: 'Answering: 10 × (2 × 0.45 − 1) = −1 point. Skipping: 0. Skip.', explain: 'The home page tracks your real sure/unsure accuracy for exactly this decision.' },
  ],
};

const pacing = {
  id: 'assessment/pacing', book: 'assessment', kind: 'strategy', title: 'Pacing each task',
  summary: 'Seconds per question, checkpoints, and when to move on.',
  prerequisites: ['assessment/six-tasks'],
  blocks: [
    sec('budgets', 'Time per question'),
    { type: 'compare', columns: ['Task', 'Seconds per question', 'Clock'], rows: PORTAL_ORDER.filter((id) => id !== 'zapn').map((id) => [SECTIONS[id].title, fmt(secs(SECTIONS[id])), SECTIONS[id].exam.perItemSeconds ? 'resets every question' : 'one clock for the whole task']) },
    { type: 'text', text: 'Per-question clocks (Beat the Odds, Likelihood List, Intervals) cannot be banked: unused seconds vanish. The single clocks (NumberLogic, Orderbooks) can: finishing the easy questions fast pays for the hard ones.' },
    { type: 'check', scope: 'per-question vs single clocks', questions: [
      { type: 'choice', q: 'You finish a Beat the Odds question in 40 seconds. What happens to the other 50?', options: ['They are lost', 'They carry over to the next question', 'They add to the Zap-N clock'], answer: 0, explain: 'Beat the Odds has a fresh 90-second clock per question.' },
      { type: 'number', q: `NumberLogic: ${SECTIONS.nl.exam.count} questions in ${SECTIONS.nl.exam.totalSeconds / 60} minutes. Average seconds per question (1 decimal)?`, answer: Math.round(secs(SECTIONS.nl) * 10) / 10, tolerance: 0.051, explain: `${SECTIONS.nl.exam.totalSeconds} ÷ ${SECTIONS.nl.exam.count} = ${fmt(secs(SECTIONS.nl))} s.` },
    ] },
    sec('checkpoints', 'Checkpoints'),
    { type: 'text', text: 'NumberLogic ramps in difficulty, so an even pace is wrong: aim to be past question 13 with more than half the time left. Orderbooks gives about 24 seconds a board; if a board has not clicked in 40 seconds, skip it.' },
    { type: 'diagram', diagram: 'numberline', spec: { min: 0, max: 25, step: 5, marks: [{ x: 10, label: 'Q13 by 10 min' }, { x: 20, label: 'Q22 by 20 min' }] }, caption: 'NumberLogic checkpoints (minutes): bank time on the easy first half.' },
    { type: 'check', scope: 'the NumberLogic checkpoints', questions: [
      { make: (rng) => { const q = rng.int(9, 16); return { type: 'choice', stable: true, q: `NumberLogic, 10 minutes gone, you are starting question ${q}. Against the checkpoint plan, where are you?`, options: ['Ahead of plan', 'On plan', 'Behind plan'], answer: q > 13 ? 0 : q === 13 ? 1 : 2, explain: 'The plan is question 13 by 10 minutes.' }; } },
    ] },
    sec('rule', 'Rule'),
    { type: 'callout', tone: 'rule', text: 'Per-question clocks: use them, they do not carry over. Single clocks: bank time on easy items; skip anything stuck past about twice the average.' },
    sec('predict', 'Predict'),
    { type: 'predict', question: 'Orderbooks gives 480 seconds for 20 boards. You spent 60 seconds on board 1 and it is still not solved. What should you do?', answer: 'Skip it: 60 s is two and a half boards of time.', explain: 'A wrong submit costs time too, so do not fire guesses at it either.' },
  ],
};

const closest = {
  id: 'assessment/closest-value', book: 'assessment', kind: 'strategy', title: 'Answering "pick the closest value"',
  summary: 'Bracket the answer, then pick the option inside the bracket.',
  prerequisites: ['assessment/minus-one-rule'],
  blocks: [
    sec('bracket', 'Bracket, do not compute'),
    { type: 'text', text: 'Beat the Odds asks for the option **closest** to the true value, and options are usually spread out. You rarely need the exact number: a lower and an upper bound that contain only one option are enough.' },
    { type: 'diagram', diagram: 'numberline', spec: { min: 0, max: 1, step: 0.1, marks: [{ x: 0.12, label: 'A' }, { x: 0.3, label: 'B' }, { x: 0.52, label: 'C' }, { x: 0.7, label: 'D' }, { x: 0.9, label: 'E' }], barriers: [0.4, 0.6] }, caption: 'If you know the answer is between 0.4 and 0.6, only C survives. No exact computation needed.' },
    { type: 'check', scope: 'bracketing', questions: [
      // The inside option's rank varies (0 to 2 options below the bracket), so sorted order gives nothing away.
      { make: (rng) => { const r2 = (x) => Math.round(x * 100) / 100, lo = rng.pick([0.2, 0.3, 0.4]), hi = r2(lo + 0.15), k = rng.int(0, 2);
        const inside = r2(lo + 0.07), opts = [...[lo - 0.17, lo - 0.09].slice(2 - k), inside, ...[hi + 0.1, hi + 0.25, hi + 0.4].slice(0, 3 - k)].map(r2);
        return { type: 'choice', q: `You know the answer lies between ${lo} and ${hi}. Options: ${opts.join(', ')}. Which do you pick?`, options: opts.map(String), answer: opts.indexOf(inside), explain: `Only ${inside} is inside the bracket.` }; } },
    ] },
    sec('sanity', 'Sanity checks that eliminate'),
    { type: 'list', items: ['A probability above 1 or below 0 is impossible.', 'Complement check: if the event is "at least one", the answer is usually large; "all of them" is usually small.', 'Symmetry: if two outcomes are interchangeable, their probabilities are equal.'] },
    { type: 'check', scope: 'the three sanity checks', questions: [
      { type: 'choice', q: 'Five fair coins are tossed. Which option is closest to P(at least one head)?', options: ['0.97', '0.03', '0.16', '0.5', '0.84'], answer: 0, traps: { 1: 'that is P(no heads) = 1/32, the complement', 2: 'that is about P(exactly one head), 5/32', 3: 'a coin-flip guess: "at least one" of five is large', 4: 'removed "exactly one head" instead of "no heads"' }, explain: '"At least one" of five: 1 − 1/32 ≈ 0.969.' },
    ] },
    sec('rule', 'Rule'),
    { type: 'callout', tone: 'rule', text: 'Bracket first: two quick bounds that leave one option beat an exact computation that runs out of time.' },
    sec('predict', 'Predict'),
    { type: 'predict', question: 'Options are 0.05, 0.1, 0.2, 0.4, 0.8 and your rough estimate is 0.15. What must you check before answering?', answer: 'Whether the true value is nearer 0.1 or 0.2: the midpoint 0.15 sits between them, so refine the estimate first.', explain: 'Bracketing fails exactly when your bracket straddles the midpoint of two options.' },
  ],
};

const calibration = {
  id: 'assessment/calibration', book: 'assessment', kind: 'strategy', title: 'Calibration: know how sure you are',
  summary: 'Mark answers sure or unsure in practice; your own numbers decide when to skip.',
  prerequisites: ['assessment/minus-one-rule'],
  blocks: [
    sec('measure', 'Measure yourself'),
    { type: 'text', text: 'The −1 rule needs p, your chance of being right. You cannot see p directly, but you can measure it: practice asks "sure" or "unsure" on every answer, and the home page shows how often each group is right.' },
    { type: 'diagram', diagram: 'bar', spec: { title: 'Example: accuracy by confidence', xLabel: 'what you said', yLabel: 'right (%)', categories: ['sure', 'unsure'], series: [{ name: 'right', values: [88, 44] }], valueLabels: true }, caption: 'An example profile: unsure answers right 44% of the time. Under −1 scoring those should be skipped.' },
    { type: 'check', scope: 'reading your calibration', questions: [
      { make: (rng) => { const a = rng.pick([38, 44, 47, 55, 62]); return { type: 'choice', q: `Your unsure answers are right ${a}% of the time. In Beat the Odds, should you answer unsure questions?`, options: ['Yes, answer them', 'No, skip them'], answer: a > 50 ? 0 : 1, explain: `EV = 2p − 1 = ${fmt(2 * a / 100 - 1)} per unsure answer.` }; } },
    ] },
    sec('rule', 'Rule'),
    { type: 'callout', tone: 'rule', text: 'Your unsure accuracy decides: above 50%, answer; below, skip. Re-check it after every few practice sessions.' },
    sec('predict', 'Predict'),
    { type: 'predict', question: 'Your sure answers are right 97% of the time and your unsure 51%. Which group costs you more points on average: a wrong sure answer or a skipped unsure one?', answer: 'Skipping an unsure answer gives up only 2 × 0.51 − 1 = 0.02 points; wrong sure answers are rare. Both are small; work on moving questions from unsure to sure.', explain: 'Practice that turns unsure families into sure ones is worth far more than any skip rule.' },
  ],
};

const training = {
  id: 'assessment/how-to-train', book: 'assessment', kind: 'strategy', title: 'How to train with this app',
  summary: 'Study, then practice, then drill, then full exams until Ready.',
  blocks: [
    sec('loop', 'The loop'),
    { type: 'diagram', diagram: 'flow', spec: { root: 'study', nodes: [
      { id: 'study', text: 'Study the lesson (checks after every step)', kind: 'q' },
      { id: 'try', text: 'Try it: 3 fresh questions, 3/3 = mastered', kind: 'q' },
      { id: 'practice', text: 'Practice the section (weak families come up more)', kind: 'q' },
      { id: 'drill', text: 'Drill: 10 timed questions', kind: 'q' },
      { id: 'exam', text: 'Full exam replica', kind: 'q' },
      { id: 'ready', text: 'Ready: 3 exams in a row at target → open the portal task', kind: 'a' },
    ], edges: [{ from: 'study', to: 'try' }, { from: 'try', to: 'practice', label: 'mastered' }, { from: 'practice', to: 'drill' }, { from: 'drill', to: 'exam' }, { from: 'exam', to: 'ready', label: '3 at target' }] }, caption: 'Misses send you back up the loop: each miss links to the lesson for that type.' },
    { type: 'check', scope: 'the training loop', questions: [
      { type: 'choice', q: 'When does a section count as Ready?', options: ['After 3 full exams in a row at target', 'After mastering every lesson in its book', 'After one full exam above the target', 'After 100 practice questions answered'], answer: 0, traps: { 1: 'lessons prepare you; only full exams count toward Ready', 2: 'one exam can be luck: the last three must all meet the target', 3: 'practice volume is not scored; only full exams count' }, explain: 'Only full-length exams count, and the last three must all meet the target.' },
    ] },
    sec('rule', 'Rule'),
    { type: 'callout', tone: 'rule', text: 'Study → try it → practice → drill → exam; a started portal task cannot be reset, so the Ready gate decides when to open it.' },
    sec('predict', 'Predict'),
    { type: 'predict', question: 'You score at target in two exams, then miss in the third. How many more exams do you need before the section is Ready?', answer: 'Three: the streak restarts at zero.', explain: 'Ready means the last three exams all met the target.' },
  ],
};

const howToStudy = {
  id: 'assessment/how-to-study', book: 'assessment', kind: 'strategy', title: 'How to study with this guide',
  summary: 'Why every lesson makes you try first, explain, find errors and come back later.',
  blocks: [
    sec('methods', 'What each lesson makes you do, and why'),
    { type: 'compare', columns: ['What you do', 'Why it works'], rows: [
      ['Try a challenge before any teaching', 'Productive failure: your attempt shows you what is missing, and the lesson has something to attach to.'],
      ['Answer 1-3 checks after every step', 'Retrieval: recalling beats rereading. Each check tests only that step, so a miss points at one link.'],
      ['Read the picture before the formula', 'Dual coding: a picture and words together are remembered better than either alone.'],
      ['Explain it in your own words', 'Self-explanation: gaps you cannot put into words are gaps in understanding.'],
      ['Find the error in a wrong solution', 'Error detection: spotting a named false belief protects you from making it.'],
      ['Finish a faded example', 'Worked-example fading: support is removed step by step until you solve alone.'],
      ['Three fresh questions, no hints', 'Unassisted evidence: only independent success counts as mastered.'],
      ['Come back when a review is due', 'Spacing: reviews just before forgetting make memory last.'],
      ['Mixed practice and recognition drills', 'Interleaving: choosing the method is a skill the real test demands.'],
    ] },
    { type: 'diagram', diagram: 'plot', spec: { x: { min: 0, max: 30, label: 'days after studying' }, y: { min: 0, max: 1, label: 'chance you still recall it' }, curves: [
      { label: 'no review', points: [[0, 1], [1, 0.55], [3, 0.4], [7, 0.3], [14, 0.22], [30, 0.15]] },
      { label: 'reviews at 1, 3, 7, 16 days', points: [[0, 1], [1, 0.8], [3, 0.85], [7, 0.88], [16, 0.9], [30, 0.86]] },
    ] }, caption: 'Illustrative shape of forgetting (not measured data): each review resets the curve higher and flatter. Mastered lessons come back on this schedule.' },
    { type: 'check', scope: 'the methods table', questions: [
      { type: 'choice', q: 'You reread a lesson three times and it feels easy. Which method does the guide use instead, and why?', options: ['Retrieval checks: recalling, not rereading, builds memory', 'Rereading until it feels easy, since fluency means mastery', 'Highlighting key sentences, so the rereads are faster'], answer: 0, traps: { 1: 'fluency while reading is not the same as being able to recall', 2: 'highlighting is passive: nothing is retrieved' }, explain: 'Recall is the test the exam gives you, so recall is what the guide trains.' },
    ] },
    sec('rule', 'Rule'),
    { type: 'callout', tone: 'rule', text: 'Try first, check every step, explain it, find the error, then prove it alone; come back when it is due.' },
    sec('predict', 'Predict'),
    { type: 'predict', question: 'Which will you remember better in two weeks: a lesson read twice today, or read once today and tested once in three days?', answer: 'Read once and tested in three days.', explain: 'A spaced retrieval beats an immediate reread for long-term memory.' },
  ],
};

export default {
  id: 'assessment',
  title: 'How the assessment works',
  blurb: 'Formats, scoring, the −1 rule, pacing, closest-value answering, calibration and the training loop.',
  chapters: [
    { title: 'The tasks', lessons: [sixTasks, pacing] },
    { title: 'Scoring strategy', lessons: [minusOne, closest, calibration] },
    { title: 'Training', lessons: [howToStudy, training] },
  ],
  tree: { diagram: 'flow', spec: { root: 'q', nodes: [
    { id: 'q', text: 'What do you need?', kind: 'q' },
    { id: 'a1', text: 'What each task is', kind: 'a', link: 'assessment/six-tasks' },
    { id: 'a2', text: 'Whether to answer or skip', kind: 'a', link: 'assessment/minus-one-rule' },
    { id: 'a3', text: 'How fast to go', kind: 'a', link: 'assessment/pacing' },
    { id: 'a4', text: 'How to train', kind: 'a', link: 'assessment/how-to-train' },
  ], edges: [{ from: 'q', to: 'a1' }, { from: 'q', to: 'a2' }, { from: 'q', to: 'a3' }, { from: 'q', to: 'a4' }] } },
};
