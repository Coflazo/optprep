// Zap-N game lesson: The Switch (task switching). Round counts, the switch schedule, the deadline
// and the trial generator come from src/zapn/theswitch/engine.js.
import { ZAPN_TARGETS } from '../../../../config/sections.js';
import { makeRng } from '../../../core/rng.js';
import { DEFAULTS, generateTrials } from '../../../zapn/theswitch/engine.js';
import { sec, mc, pct, dec } from './balloon.js';

const { rounds: R, deadlineMs } = DEFAULTS;
const TARGET = ZAPN_TARGETS.theswitch.value;
const BUDGET = Math.floor(R * (1 - TARGET) + 1e-9);
const SWITCHES = Math.floor((R - 1) / 2);
const val = (m) => { const [a, op, b] = m.split(' '); return op === '+' ? +a + +b : +a - +b; };
const odd = (m) => Math.abs(val(m)) % 2 === 1;
const arrows = ([d, n]) => Array(n).fill(d === 'left' ? '←' : '→').join('');
const pretty = (m) => m.replace(' - ', ' − ');
const yn = (b) => (b ? 'yes' : 'no');
const fromEngine = (t) => ({ task: t.task, math: t.math.text, arrows: [[t.arrows.a.dir, t.arrows.a.n], [t.arrows.b.dir, t.arrows.b.n]], answer: yn(t.answer) });
const roundText = (t) => `Top: ${pretty(t.math.text)}. Bottom: ${arrows([t.arrows.a.dir, t.arrows.a.n])} over ${arrows([t.arrows.b.dir, t.arrows.b.n])}. The **${t.task === 'math' ? 'top' : 'bottom'}** block is highlighted.`;

const answerQ = (rng) => {
  const t = rng.pick(generateTrials(rng, 8));
  const other = t.task === 'math' ? t.arrows.same : t.math.value % 2 === 1;
  const trap = other !== t.answer ? `answered the ${t.task === 'math' ? 'bottom (arrows)' : 'top (sum)'} block, which is not highlighted` : t.task === 'math' ? 'a parity slip: check the last digits again' : 'a direction slip: compare the first arrow of each set';
  return mc({ q: `${roundText(t)} Answer?`, right: yn(t.answer), wrong: [[yn(!t.answer), trap]], explain: t.task === 'math' ? `Top is active: ${pretty(t.math.text)} = ${t.math.value}, ${t.math.value % 2 ? 'odd' : 'even'}: ${yn(t.answer)}.` : `Bottom is active: the sets point ${t.arrows.a.dir} and ${t.arrows.b.dir}: ${yn(t.answer)}.` }, rng);
};
const parityQ = (rng) => {
  const plus = rng.chance(0.5), a = rng.int(plus ? 12 : 30, 99), b = rng.int(11, plus ? 99 : a - 1), v = plus ? a + b : a - b;
  return mc({ q: `Is ${a} ${plus ? '+' : '−'} ${b} odd? Use only the last digits.`, right: yn(v % 2 === 1), at: v % 2 === 1 ? 0 : 1,
    wrong: [[yn(v % 2 !== 1), `${a % 10} is ${a % 2 ? 'odd' : 'even'} and ${b % 10} is ${b % 2 ? 'odd' : 'even'}: ${a % 2 === b % 2 ? 'same parities give even' : 'one odd, one even gives odd'}, for + and − alike`]],
    explain: `${a % 2 ? 'Odd' : 'Even'} ${plus ? '+' : '−'} ${b % 2 ? 'odd' : 'even'} is ${v % 2 ? 'odd' : 'even'} (${a} ${plus ? '+' : '−'} ${b} = ${v}).` });
};
const arrowQ = (rng) => {
  const d1 = rng.pick(['left', 'right']), d2 = rng.pick(['left', 'right']), n1 = rng.int(3, 5), n2 = rng.int(3, 5);
  return mc({ q: `Bottom highlighted: ${arrows([d1, n1])} over ${arrows([d2, n2])}. Do both sets point the same way?`, right: yn(d1 === d2), at: d1 === d2 ? 0 : 1,
    wrong: [[yn(d1 !== d2), n1 !== n2 ? 'compared the number of arrows: only the direction counts' : 'misread a direction: compare the first arrow of each set']], explain: `${d1} and ${d2}: ${yn(d1 === d2)}.` });
};

const PIC = [
  { task: 'math', math: '13 + 8', arrows: [['left', 3], ['right', 4]], answer: 'yes' },
  { task: 'arrows', math: '20 - 6', arrows: [['right', 5], ['right', 3]], answer: 'yes', switch: true },
  { task: 'arrows', math: '9 + 6', arrows: [['left', 4], ['right', 3]], answer: 'no', switch: false },
  { task: 'math', math: '17 - 8', arrows: [['left', 3], ['left', 5]], answer: 'yes', switch: true },
];
const WK = generateTrials(makeRng('switch:worked'), 5).map((t, i) => ({ ...fromEngine(t), switch: i ? t.switch : undefined }));
const wSwitches = WK.filter((t) => t.switch).length;

export default {
  id: 'zapn/theswitch',
  book: 'zapn',
  kind: 'game',
  game: 'theswitch',
  title: 'The Switch: name the task, then check one thing',
  summary: 'Say "odd" or "same" before looking, then read only what that task needs: last digits for odd, first arrows for same.',
  prerequisites: [],
  objectives: [
    'Name the active task before reading any content, every round',
    'Decide whether a sum or difference is odd from the last digits alone',
    'Decide whether two arrow sets agree from their first arrows alone',
    `Hit the target: ${pct(TARGET)} accuracy, at most ${BUDGET} error in ${R} rounds`,
  ],
  blocks: [
    sec('recognise'),
    { type: 'challenge', q: `Before any teaching. Top block: 23 + 14. Bottom block: ←←← over →→→. The **top** block is highlighted; the top asks "is the result odd?" and the bottom asks "do both arrow sets point the same way?". Answer yes or no, and describe two different ways you could decide.`, answer: `Yes: 23 + 14 = ${23 + 14}, odd.`, explain: 'The fast way uses only the last digits: 3 is odd, 4 is even, odd plus even is odd. The trap is the bottom block, whose answer (no) disagrees. If you looked at the arrows at all, the lesson shows how to stop.',
      attempts: [
        { id: 'compute', label: 'Compute the sum first', approach: `Worked out 23 + 14 = ${23 + 14}, then checked whether it is odd.`, breaksAt: 'Right but slow: the last digits give the parity at a glance, and big sums invite slips.' },
        { id: 'glance', label: 'Answer whatever catches the eye', approach: 'Answered the first block you read.', breaksAt: 'The other block answers a different question and agrees with the right answer only half the time.' },
      ] },
    { type: 'text', text: `The Switch is the task-switching game of Zap-N. Every round shows two blocks: a sum or difference on top and two sets of arrows below. One block is highlighted. **Top** highlighted: is the result odd? **Bottom** highlighted: do both arrow sets point the same way? Answer Yes (right arrow or Y) or No (left arrow or N).` },
    { type: 'text', text: `${R} rounds, ${deadlineMs / 1000} s each; no answer in time counts as wrong. The highlight moves unpredictably: exactly ${SWITCHES} of the ${R - 1} changes of round are switches. Accuracy is the tracked target, ${pct(TARGET)}; the game score also weighs speed.` },
    { type: 'check', scope: 'the two questions', questions: [
      mc({ q: 'Bottom highlighted. Top: 12 + 5. Bottom: →→→ over ←←←←. Answer?', right: 'no', at: 1, wrong: [['yes', 'answered the top block (17 is odd): the bottom is highlighted']], explain: 'The sets point right and left: not the same way.' }),
    ] },

    sec('why'),
    { type: 'text', text: 'A trader flips between products with different quoting rules many times a minute. The Switch measures how cleanly you drop one rule and load the other when the context changes. The expensive error is not a slow answer; it is answering the right question about the wrong block. The game also records your switch cost, the extra time a switch round takes over a repeat, so you can see the price of each change of rule and train it down.' },

    sec('anchor'),
    { type: 'text', text: 'You know the Stroop test: name the ink colour of the word "red" printed in blue, while the word itself pulls you the other way. The Switch is Stroop with **one change**: the rule you must follow changes between rounds. The unhighlighted block always has an answer too, and it disagrees with yours half the time.' },
    { type: 'check', scope: 'the distractor block', questions: [
      mc({ q: 'You answer the unhighlighted block on some rounds. On those rounds, how often are you right?', right: 'about half the time', at: 0, wrong: [['never, the blocks always disagree', 'the two blocks agree half the time by chance'], ['always, the blocks always agree', 'the two answers are drawn separately; they disagree half the time']], explain: 'Each block’s answer is a separate coin flip, so the wrong block gives the right answer by luck half the time.' }),
    ] },

    sec('picture'),
    { type: 'text', text: 'Four rounds. The highlighted block is shaded; the other is a distractor.' },
    { type: 'diagram', diagram: 'zapn-switch', spec: { rounds: PIC }, caption: 'Rounds 2 and 4 are switches. In round 2 the unhighlighted sum (20 − 6 = 14, even) would say no; the arrows say yes.' },
    { type: 'check', scope: 'reading the rounds', questions: [
      mc({ q: 'In round 3 above, what would you answer if you mistakenly used the top block?', right: 'yes: 9 + 6 = 15 is odd', at: 0, wrong: [['no', '15 is odd, so the top block says yes'], ['it cannot be answered', 'both blocks always have an answer']], explain: 'The top says yes, the highlighted bottom says no: answering the wrong block costs this round.' }),
    ] },
    { type: 'diagram', diagram: 'table', spec: { columns: ['First number', 'Second number', 'Sum or difference'], rows: [['odd', 'odd', 'even'], ['even', 'even', 'even'], ['odd', 'even', 'odd'], ['even', 'odd', 'odd']] }, caption: 'Parity of a sum or a difference depends only on the parities of the parts, and a number’s parity is its last digit’s. Odd exactly when one part is odd and the other even.' },
    { type: 'check', scope: 'parity from last digits', questions: [{ make: parityQ }] },
    { type: 'diagram', diagram: 'flow', spec: { root: 'q', nodes: [
      { id: 'q', text: 'Which block is highlighted?', kind: 'q' },
      { id: 'odd', text: 'Say "odd". Last digits: exactly one odd?', kind: 'q' },
      { id: 'same', text: 'Say "same". First arrow of each set: equal?', kind: 'q' },
      { id: 'y1', text: 'Yes', kind: 'a' }, { id: 'n1', text: 'No', kind: 'a' },
    ], edges: [{ from: 'q', to: 'odd', label: 'top' }, { from: 'q', to: 'same', label: 'bottom' }, { from: 'odd', to: 'y1', label: 'yes' }, { from: 'odd', to: 'n1', label: 'no' }, { from: 'same', to: 'y1', label: 'yes' }, { from: 'same', to: 'n1', label: 'no' }] }, caption: 'Every round is two questions, in this order. The first one is where the costly errors happen.' },
    { type: 'check', scope: 'the whole round', questions: [{ make: answerQ }] },

    sec('derivation'),
    { type: 'steps', steps: [
      { say: 'Two blocks, one highlighted. Only the highlighted block’s question counts.', why: 'The other block is a distractor; its answer agrees with the right one only by chance.',
        checks: [{ type: 'number', q: `If you answered the unhighlighted block on all ${R} rounds, how many would you expect to get right?`, answer: R / 2, tolerance: 0.01, explain: `Half of ${R}: ${R / 2}. Far below the target.` }] },
      { answers: 'glance', say: 'Before reading any number or arrow, name the active task silently: "odd" or "same".', why: 'Naming loads the rule. The main error is answering the previous round’s task after a switch.',
        checks: [mc({ q: 'Top was active last round; now the bottom is highlighted. What do you say first?', right: '"same"', at: 1, wrong: [['"odd"', 'kept the previous round’s task: the highlight moved'], ['nothing: just look at the blocks', 'unnamed, the old rule tends to stay loaded']], explain: 'Bottom highlighted means the arrow question.' })] },
      { answers: 'compute', say: 'Odd check: a sum or difference is odd exactly when one part is odd and the other even. Read only the last digits.', why: 'Parity survives + and −, and a number’s parity is its last digit’s. You never compute the result.',
        checks: [{ make: parityQ }] },
      { say: 'Same check: compare the first arrow of each set. The number of arrows never matters.', why: 'Every arrow in a set points the same way, so one arrow speaks for the set.',
        checks: [{ make: arrowQ }] },
      { say: `Budget: ${R} rounds at ${pct(TARGET)} leaves at most ${BUDGET} error. A timeout counts as an error.`, why: `${R - BUDGET}/${R} = ${dec((R - BUDGET) / R)} passes, ${R - BUDGET - 1}/${R} = ${dec((R - BUDGET - 1) / R)} does not.`,
        checks: [{ type: 'number', q: `How many errors (wrong or late) can you make and still reach ${pct(TARGET)}?`, answer: BUDGET, hints: [`${R} × ${TARGET} = ${dec(R * TARGET, 2)} must be right.`, 'Round up the rights you need, then subtract from the total.'], explain: `${R - BUDGET} right needed, so ${BUDGET} error.` }] },
      { say: `Switches are random: ${SWITCHES} of the ${R - 1} changes of round are switches, in shuffled order. Name the task every round, even after a long run of repeats.`, why: 'A run of repeats says nothing useful about the next round; the naming habit is what protects you.',
        checks: [mc({ q: 'The top block has been highlighted five rounds in a row. What should you do next round?', right: 'name the task again from the highlight', at: 0, wrong: [['expect a switch and pre-load "same"', 'switches are shuffled; guessing the next task causes errors'], ['skip naming: it will be top again', 'repeats do not predict repeats either']], explain: 'The highlight decides, every round.' })] },
    ] },
    { type: 'explain', prompt: 'Why does naming the task before looking at the content protect accuracy more than computing faster does?', model: 'Both blocks always have an answer, and the wrong block gives the right answer only half the time, so answering the wrong block is the costly error. Naming the task from the highlight loads the right rule first. The computation itself is easy once the rule is right: last digits for odd, first arrows for same.', points: ['Both blocks always offer an answer; the distractor is right only half the time', 'The typical error after a switch is keeping the old rule', 'Naming loads the rule; the check itself is a one-glance job'] },

    sec('worked'),
    { type: 'text', text: `Five rounds straight from the game’s generator, with ${wSwitches} switches. Name the task, check one thing, answer.` },
    { type: 'diagram', diagram: 'zapn-switch', spec: { rounds: WK }, caption: 'The answers follow the rule for the highlighted block only; the other block is ignored.' },
    { type: 'steps', steps: WK.slice(0, 3).map((t, i) => ({
      say: `Round ${i + 1}: ${t.task === 'math' ? `top, say "odd". ${pretty(t.math)}: last digits ${t.math.split(' ')[0].slice(-1)} and ${t.math.split(' ')[2].slice(-1)}, so ${odd(t.math) ? 'odd' : 'even'}` : `bottom, say "same". First arrows ${t.arrows[0][0]} and ${t.arrows[1][0]}`}. Answer ${t.answer}.`,
      why: i && t.switch ? 'A switch: the named task changes, so the naming step matters most here.' : 'Same method every round, whatever came before.',
      checks: [mc({ q: `Round ${i + 1}: what would the unhighlighted block have answered?`, right: t.task === 'math' ? yn(t.arrows[0][0] === t.arrows[1][0]) : yn(odd(t.math)), at: 0, wrong: [[t.task === 'math' ? yn(t.arrows[0][0] !== t.arrows[1][0]) : yn(!odd(t.math)), t.task === 'math' ? 'misread the arrows: compare first arrows' : 'misread the parity: last digits decide']], explain: `The distractor says ${t.task === 'math' ? yn(t.arrows[0][0] === t.arrows[1][0]) : yn(odd(t.math))}; the highlighted block says ${t.answer}.` })],
    })) },

    sec('predict'),
    { type: 'predict', question: `You answer every repeat round correctly but, on switch rounds, keep the previous task one time in four. Out of ${SWITCHES} switches, how many errors do you expect, and does that meet the ${BUDGET}-error budget?`, answer: `${dec(SWITCHES / 4 / 2, 2)}: a kept task gives the wrong block's answer, which is wrong half the time. ${SWITCHES / 8 <= BUDGET ? 'Within' : 'Over'} the budget of ${BUDGET}.`, explain: `${SWITCHES} × 1/4 × 1/2 = ${dec(SWITCHES / 8, 2)} expected errors, and real play adds a few slips on top.` },

    sec('traps'),
    { type: 'traps', extra: [
      { belief: 'Compute the full sum to check if it is odd.', fix: 'Last digits decide: exactly one odd part means odd.' },
      { belief: 'A difference follows different parity rules from a sum.', fix: 'Same rule for + and −.' },
      { belief: 'Count the arrows.', fix: 'Only direction matters; compare the first arrow of each set.' },
      { belief: 'After several repeats a switch is due.', fix: 'Switches are shuffled; name the task from the highlight every round.' },
      { belief: 'Speed is what drags accuracy down after a switch.', fix: 'Being slower on switch rounds is normal. Errors come from keeping the old rule.' },
    ] },
    { type: 'erroneous', problem: 'Round: top block 17 − 8, bottom block ←←← over ←←←←, top highlighted. A candidate answers. One step is wrong.', steps: [
      'The top block is highlighted, so the question is "odd?".',
      'Last digits: 7 is odd, 8 is even.',
      'Odd minus even is even.',
      'Answer No.',
    ], errorStep: 2, explain: `One odd part and one even part give an odd result, for − exactly as for +: 17 − 8 = ${17 - 8}. Answer Yes.` },
    { type: 'check', scope: 'full rounds', questions: [{ make: answerQ }] },

    sec('speed'),
    { type: 'callout', tone: 'speed', text: 'Keep both fingers on the Yes and No keys. Look at the highlight first, say the task, then glance at exactly one thing: two last digits, or two first arrows.' },
    { type: 'callout', tone: 'speed', text: `The game score gives speed and accuracy equal weight, but the tracked target is accuracy. ${deadlineMs / 1000} s is long; spend the extra few hundred milliseconds a switch costs rather than risk an error.` },
    { type: 'thinkaloud', problem: 'Round 12. Last round was "odd". Now: top 46 + 18, bottom →→→→ over →→→, and the bottom block is highlighted.', lines: [
      { t: 0, say: `46 + 18: last digits 6 and 8, both even, so ${odd('46 + 18') ? 'odd' : 'even'}: No.`, slip: true },
      { t: 0.5, say: 'Stop: the highlight moved to the bottom. Say "same".' },
      { t: 0.8, say: 'First arrow of each set: right, right.' },
      { t: 1, say: 'Same way: Yes.' },
      { t: 1.2, say: `Check: the top block would have said ${odd('46 + 18') ? 'yes' : 'no'}, so the old task would have cost this round.` },
    ] },
    { type: 'check', scope: 'first arrows only', questions: [{ make: arrowQ }] },

    sec('rule'),
    { type: 'callout', tone: 'rule', text: 'The Switch: read the highlight, say "odd" or "same", then check one thing: last digits (odd when exactly one is odd) or first arrows (same direction).' },

    sec('contrast'),
    { type: 'compare', columns: ['Game', 'Rules', 'What decides the rule'], rows: [
      ['The Switch', 'two: odd? and same?', 'the highlight, changing unpredictably'],
      ['Shapeshift', 'one: round is right', 'never changes'],
      ['Stroop test', 'one, against a pull', 'fixed, but the word fights the colour'],
    ] },
    { type: 'variation', base: 'Top block 17 + 8 highlighted, bottom ←←← over →→→. Answer: yes (25 is odd).', rows: [
      { same: true, change: '17 − 8 instead of 17 + 8', effect: 'Still yes: one odd and one even part give an odd result for − as for +.' },
      { change: '17 + 9 instead of 17 + 8', effect: 'No: two odd parts give an even result.' },
      { fusion: true, change: '17 + 9 instead of 17 + 8, and the bottom block highlighted', effect: 'No, because the arrows point different ways. The sum change stops mattering once the bottom is highlighted.' },
      { change: 'The bottom block is highlighted instead', effect: 'No: the arrows point different ways. The sum no longer matters.' },
      { same: true, change: 'The first arrow set has 5 arrows instead of 3', effect: 'Nothing changes: arrow counts never matter, and the top is highlighted anyway.' },
      { same: true, change: 'The previous round was also top', effect: 'Nothing changes: name the task from the highlight every round.' },
    ] },
    { type: 'callout', tone: 'edge', text: 'Edge cases: a difference like 25 − 24 = 1 is odd; every difference in the game is positive, so you never meet 0. A round can have both blocks agreeing, which hides an error on that round; the habit, not the round, is what the score measures over 35 rounds.' },
    { type: 'callout', tone: 'transfer', text: 'Same idea elsewhere: parity from last digits is a NumberLogic and mental-arithmetic shortcut, and "decide which rule applies before computing" is the recognition step of every lesson in this guide.' },
    { type: 'transfer',
      near: { make: answerQ },
      far: { make: (rng) => { const a = rng.int(120, 999), b = rng.int(11, 99), c = rng.int(11, 99), v = a - b + c, odds = [a, b, c].filter((x) => x % 2).length; return mc({ q: `Mental arithmetic: is ${a} − ${b} + ${c} odd? Use last digits only.`, right: yn(v % 2 === 1), at: v % 2 === 1 ? 0 : 1, wrong: [[yn(v % 2 !== 1), `the parts have ${odds} odd number${odds === 1 ? '' : 's'}: apply the two-part rule twice (or count the odd parts: odd exactly when that count is odd)`]], explain: `${odds} odd part${odds === 1 ? '' : 's'}: ${v % 2 ? 'odd' : 'even'} (${a} − ${b} + ${c} = ${v}).` }); } },
      principle: mc({ q: 'Which idea carried over from The Switch to the mental arithmetic?', right: 'pick the rule first, then check only what that rule needs', at: 3,
        wrong: [['compute everything fully first, then pick the rule to apply', 'full computation is the slow route the last-digit rule avoids'], ['use whichever rule the previous question needed, by habit', 'that is the switch error the naming habit prevents'], ['check both blocks every time and go with the majority', 'with two blocks there is no majority, only a distractor']],
        explain: 'Decide which rule applies, then look only at what it needs: last digits for parity.' }),
    },
    { type: 'check', scope: 'the variation rows', questions: [{ make: parityQ }] },

    sec('tryit'),
    { type: 'tryit', game: 'theswitch' },
  ],
};
