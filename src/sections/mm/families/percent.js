// 80-in-8: percentages. x% of y, which percent, the whole from a part (reverse percent),
// percentage change, and the price before a rise or fall.
import { family, q, L, modeOf, verifyExpr, judge, parseLabel, tenthsLine } from '../lib.js';

const P = (p) => q(Math.round(p * 10), 1000); // percent -> fraction: 12.5 -> 1/8
const pl = (p) => L(q(Math.round(p * 10), 10)); // 12.5 -> '12.5'
const FRACTION = { 50: '1/2', 25: '1/4', 75: '3/4', 12.5: '1/8', 20: '1/5', 10: '1/10' };

// Build p% of y from 10%, 5%, 2.5% and 1% chunks (or a fraction when p is one).
function chunkSteps(p, y) {
  const r = P(p).mul(y);
  if (FRACTION[p] && p !== 10) return [
    { say: `${p}% is ${FRACTION[p]}.`, why: 'Common percents are simple fractions: 50% = 1/2, 25% = 1/4, 20% = 1/5, 12.5% = 1/8.' },
    { say: `Take ${FRACTION[p]} of ${y}.`, math: `${y} × ${FRACTION[p]} = ${L(r)}`, why: 'Taking a fraction of a number is dividing by the bottom and multiplying by the top.' },
  ];
  const t = Math.floor(p / 10), rem = Math.round((p - 10 * t) * 10) / 10, ten = q(y, 10);
  const steps = [{ say: 'Find 10% first.', math: `10% of ${y} = ${y} ÷ 10 = ${L(ten)}`, why: 'Dividing by 10 gives 10%; every other percent is built from it.' }];
  const parts = [];
  if (t > 1) { steps.push({ say: `${t * 10}% = ${t} × ${L(ten)} = ${L(ten.mul(t))}.`, why: `${t * 10}% is ${t} lots of 10%.` }); parts.push(ten.mul(t)); }
  else if (t === 1) parts.push(ten);
  if (rem === 5) { steps.push({ say: `5% = half of 10% = ${L(ten.div(2))}.`, why: '5% is half of 10%.' }); parts.push(ten.div(2)); }
  else if (rem === 2.5) { steps.push({ say: `2.5% = a quarter of 10% = ${L(ten.div(4))}.`, why: '2.5% is a quarter of 10%.' }); parts.push(ten.div(4)); }
  else if (rem === 7.5) { steps.push({ say: `7.5% = three quarters of 10% = ${L(ten.mul(3).div(4))}.`, why: '7.5% is 5% + 2.5%.' }); parts.push(ten.mul(3).div(4)); }
  else if (rem > 0) { steps.push({ say: `${rem}% = ${rem} × 1% = ${rem} × ${L(q(y, 100))} = ${L(q(y, 100).mul(rem))}.`, why: '1% is a tenth of 10%.' }); parts.push(q(y, 100).mul(rem)); }
  if (parts.length > 1 || steps.length < 2) steps.push({ say: 'Add the chunks.', math: `${p}% of ${y} = ${parts.map(L).join(' + ')} = ${L(r)}`, why: 'Add the chunks: percents of the same number add.' });
  return steps;
}

const of = {
  levels: [1, 2],
  build(rng, d) {
    const p = d === 1 ? rng.pick([10, 20, 25, 50, 5, 15, 30, 40, 75, 60]) : rng.pick([12.5, 35, 45, 7, 17.5, 65, 85, 2.5, 8, 95, 55, 3]);
    const y = d === 1 ? 20 * rng.int(2, 30) : rng.int(4, 90) * 10 + (rng.chance(0.3) ? 5 : 0);
    const r = P(p).mul(y);
    const mode = modeOf(r);
    if (mode === 'frac') return null;
    const wrong = [[r.mul(10), `Took 1% of ${y} as ${L(q(y, 10))} (that is 10%), so the answer is ten times too big.`], [r.div(10), `Took 1% of ${y} as ${L(q(y, 1000))}: one place too far.`],
      [P(100 - p).mul(y), `Found the ${pl(100 - p)}% that is left after taking ${pl(p)}%, not ${pl(p)}% itself.`]];
    if (p !== 10) wrong.push([q(y, 10), `Found 10% (${L(q(y, 10))}) and stopped there.`]);
    if (p % 10 === 5) wrong.push([P(p - 5).mul(y).add(q(y, 200)), 'Took 5% as one tenth of 10% instead of half of it.']);
    if (Number.isInteger(p) && y % p === 0) wrong.push([q(y, p), `Divided ${y} by ${p} instead of taking ${p}%.`]);
    return {
      text: `${pl(p)}% of ${y} = ?`, value: r, mode, wrong,
      ask: `Find ${pl(p)} hundredths of ${y}.`,
      steps: chunkSteps(p, y),
      fast: FRACTION[p] ? `${pl(p)}% = ${FRACTION[p]}: ${L(r)}.` : `${pl(p)} lots of 1% (${L(q(y, 100))}): ${pl(p)} × ${L(q(y, 100))} = ${L(r)}.`,
      check: `${pl(p)}% is ${p < 50 ? 'less than half' : p === 50 ? 'exactly half' : 'more than half'}, so the answer is ${p < 50 ? 'below' : p === 50 ? 'equal to' : 'above'} ${y / 2}; 10% is ${L(q(y, 10))}.`,
      picture: tenthsLine(y, [{ x: r.toNumber(), label: `${pl(p)}%` }], `0 to ${y} in ten steps of 10% (${L(q(y, 10))} each). ${pl(p)}% lands at ${L(r)}, ${p < 50 ? 'left of' : p === 50 ? 'at' : 'right of'} the halfway mark ${L(q(y, 2))}.`, { target: r.toNumber() }),
      hints: [`10% of ${y} is ${L(q(y, 10))}.`, `Build ${pl(p)}% from 10%, 5% and 1%.`],
      params: { p, y },
    };
  },
};

const which = {
  levels: [2],
  build(rng) {
    const p = rng.pick([5, 10, 15, 20, 25, 30, 40, 45, 60, 75, 12.5, 35, 80]), y = 20 * rng.int(2, 25);
    const z = P(p).mul(y);
    if (z.d !== 1n) return null;
    const v = q(Math.round(p * 10), 10);
    const wrong = [[v.mul(10), `Multiplied ${L(z)}/${y} by 1000 instead of 100.`], [v.div(10), `Multiplied ${L(z)}/${y} by 10 instead of 100.`], [q(100).sub(v), `Gave the percent of ${y} that is NOT ${L(z)}.`]];
    if (!z.eq(v)) wrong.push([z, `Took the part ${L(z)} itself as the percent.`]);
    return {
      text: `?% of ${y} = ${L(z)}`, value: v, mode: 'pct', wrong,
      ask: `${L(z)} is what percent of ${y}?`,
      steps: [
        { say: 'Write the part over the whole.', math: `${L(z)}/${y}${q(Number(z.n), y).toString() !== `${L(z)}/${y}` ? ` = ${q(Number(z.n), y)}` : ''}`, why: 'Part over whole: the percent is this fraction written in hundredths.' },
        { say: 'Scale the fraction to hundredths.', math: `${q(Number(z.n), y)} = ${pl(p)}/100 = ${pl(p)}%`, why: 'Scale the fraction to hundredths (× 100).' },
      ],
      picture: tenthsLine(y, [{ x: z.toNumber(), label: `${L(z)}` }], `0 to ${y} in ten steps of 10% (${y / 10} each). ${L(z)} is ${L(z.div(q(y, 10)))} steps along: ${pl(p)}%.`, { target: z.toNumber() }),
      fast: `10% of ${y} is ${y / 10}; ${L(z)} is ${L(z.div(q(y, 10)))} of those, so ${pl(p)}%.`,
      check: `${pl(p)}% of ${y} = ${L(z)}. ${L(z)} is ${z.cmp(y / 2) < 0 ? 'less' : 'more'} than half of ${y}, so the percent is ${z.cmp(y / 2) < 0 ? 'below' : 'above'} 50.`,
      hints: [`Write ${L(z)} out of ${y} as a fraction.`, `How many 10%s of ${y} (${y / 10} each) make ${L(z)}?`],
      params: { y, z: L(z) },
    };
  },
};

const base = {
  levels: [3],
  build(rng) {
    const p = rng.pick([5, 10, 15, 20, 25, 30, 40, 60, 75, 12.5, 35, 8]), y = 10 * rng.int(4, 90);
    const z = P(p).mul(y);
    if (z.d !== 1n) return null;
    const zi = Number(z.n);
    const wrong = [[q(y * 10), 'Place slip: × 10 too many when scaling 1% up to 100%.'], [q(y, 10), 'Place slip: one zero short when scaling 1% up to 100%.'],
      [P(p).mul(zi), `Took ${pl(p)}% of ${zi} instead of finding the number that ${zi} is ${pl(p)}% of.`], [z.mul(Math.round(p * 10)).div(10), `Multiplied ${zi} by ${pl(p)} instead of dividing by ${pl(p)}%.`],
      [z.div(P(100 - p)), `Divided by ${pl(100 - p)}% instead of ${pl(p)}%.`], [z.mul(P(100 + p)), `Added ${pl(p)}% to ${zi}.`]];
    return {
      text: `${pl(p)}% of ? = ${zi}`, value: q(y), mode: 'int', wrong,
      ask: `${zi} is ${pl(p)}% of what number?`,
      steps: [
        { say: `${pl(p)}% is ${zi}, so scale down to 1%.`, math: `1% = ${zi} ÷ ${pl(p)} = ${L(z.div(P(p)).div(100))}`, why: 'Scale the known percent down to 1%.' },
        { say: 'Scale up to 100%.', math: `100% = 100 × ${L(z.div(P(p)).div(100))} = ${y}`, why: 'The whole is 100%.' },
      ],
      picture: tenthsLine(y, [{ x: zi, label: `${pl(p)}% = ${zi}` }], `The whole ${y} in ten steps of 10% (${y / 10} each). The known part ${zi} sits at ${pl(p)}%, well short of the end, so the whole is bigger than ${zi}.`, { start: zi, target: y }),
      fast: FRACTION[p] ? `${pl(p)}% = ${FRACTION[p]}, so the whole is ${zi} × ${FRACTION[p].split('/')[1]}${FRACTION[p].startsWith('1/') ? '' : ` ÷ ${FRACTION[p].split('/')[0]}`} = ${y}.` : `${zi} ÷ ${pl(p)} × 100 = ${y}.`,
      check: `${pl(p)}% of ${y} = ${zi}. The whole is bigger than the part: ${y} > ${zi}.`,
      hints: [`If ${pl(p)}% is ${zi}, what is 1%?`, 'Then multiply by 100.'],
      params: { p, z: zi },
    };
  },
};

const CHANGES = [5, 10, 12.5, 15, 20, 25, 30, 40, 50, 60, 75, -5, -10, -12.5, -15, -20, -25, -30, -40, -50, -60, -75];
const change = {
  levels: [2, 3],
  build(rng) {
    const c = rng.pick(CHANGES), a = rng.pick([20, 40, 60, 80, 120, 160, 200, 240, 250, 400, 480, 500, 640, 800]);
    const bq = q(a).mul(q(1).add(P(c)));
    if (bq.d !== 1n || bq.n === BigInt(a)) return null;
    const b = Number(bq.n), v = q(Math.round(c * 10), 10), rise = c > 0;
    const wrong = [[q(b, a).mul(100), `Gave ${b} as a percent of ${a} (${L(q(b * 100, a))}%), not the change.`], [v.neg(), `Called a ${rise ? 'rise' : 'fall'} a ${rise ? 'fall' : 'rise'}: the sign is wrong.`],
      [q(b - a, b).mul(100), `Divided the change by the new value ${b} instead of the old value ${a}.`]];
    if (Math.abs(b - a) !== Math.abs(c)) wrong.push([q(b - a), `Gave the change in units (${b - a}) as a percent.`]);
    return {
      text: `Percentage change from ${a} to ${b} = ?`, value: v, mode: 'pct', wrong, mixedSigns: true,
      ask: `By what percent of ${a} did the value move from ${a} to ${b}?`,
      steps: [
        { say: 'Find the change in units, with its sign.', math: `${b} − ${a} = ${b - a}`, why: 'First the change in units, with its sign: up is +, down is −.' },
        { say: 'Divide by the old value.', math: `${b - a}/${a} = ${L(q(b - a, a))} = ${L(v)}%`, why: 'Percentage change is always measured against the starting value.' },
      ],
      picture: { diagram: 'numberline', spec: { min: 0, max: Math.max(a, b), step: a / 10, start: a, target: b }, caption: `Ticks every ${L(q(a, 10))}, which is 10% of the old value ${a}. The new value ${b} is ${L(q(Math.abs(b - a) * 10, a))} ticks ${rise ? 'above' : 'below'} the start: ${L(v)}%. Ticks sized from ${b} would give a different answer.` },
      fast: `1% of ${a} is ${L(q(a, 100))}; ${b - a} is ${L(v)} of those: ${L(v)}%.`,
      check: `${a} ${rise ? '+' : '−'} ${pl(Math.abs(c))}% of ${a} = ${b}. A ${rise ? 'rise' : 'fall'} is ${rise ? 'positive' : 'negative'}.`,
      hints: [`How much did it move? ${b} − ${a}.`, `Divide by the starting value ${a}.`],
      params: { a, b },
    };
  },
};

const before = {
  levels: [3],
  build(rng) {
    const p = rng.pick([10, 20, 25, 50, 5, 40, 30]), rise = rng.chance(0.5);
    const f = rise ? q(100 + p, 100) : q(100 - p, 100);
    const O = 10 * rng.int(3, 60), V = q(O).mul(f);
    if (V.d !== 1n) return null;
    const Vi = Number(V.n);
    const wrong = [[V.mul(rise ? q(100 - p, 100) : q(100 + p, 100)), `${rise ? 'Took' : 'Added'} ${p}% of the new price ${rise ? 'off' : 'back'}; the ${p}% was a share of the old price.`],
      [q(rise ? Vi - p : Vi + p), `${rise ? 'Subtracted' : 'Added'} ${p} as a number instead of ${p}%.`],
      [V.mul(f), `Applied the ${rise ? 'rise' : 'fall'} again instead of undoing it.`], [q(O + 10), `Off by 10 when dividing ${Vi} by ${L(f)}.`], [q(O - 10), `Off by 10 when dividing ${Vi} by ${L(f)}.`]];
    return {
      text: `After a ${p}% ${rise ? 'rise' : 'fall'} the price is ${Vi}. Price before = ?`, value: q(O), mode: 'int', wrong,
      ask: `Which price, ${rise ? 'raised' : 'cut'} by ${p}%, gives ${Vi}?`,
      steps: [
        { say: `The new price is ${rise ? 100 + p : 100 - p}% of the old one.`, math: `old × ${L(f)} = ${Vi}`, why: `A ${p}% ${rise ? 'rise adds' : 'fall takes'} ${p}% of the OLD price, so the new price is ${rise ? 100 + p : 100 - p}% of it.` },
        { say: 'Undo the multiplication by dividing.', math: `old = ${Vi} ÷ ${L(f)} = ${O}`, why: 'Undo a multiplication by dividing.' },
      ],
      picture: { diagram: 'numberline', spec: { min: 0, max: Math.max(O, Vi), step: O / 10, start: O, target: Vi }, caption: `Ticks every ${O / 10}, which is 10% of the old price ${O}. The ${rise ? 'rise' : 'fall'} of ${p}% moves ${p / 10} tick${p === 10 ? '' : 's'} to ${Vi}. The ticks are 10% of the old price, not of ${Vi}.` },
      fast: `${Vi} is ${rise ? 100 + p : 100 - p}%, so 1% is ${L(V.div(rise ? 100 + p : 100 - p))} and 100% is ${O}.`,
      check: `${O} ${rise ? '+' : '−'} ${p}% of ${O} (${L(q(O * p, 100))}) = ${Vi}. The old price is ${rise ? 'below' : 'above'} ${Vi}.`,
      hints: [`The new price is ${rise ? 100 + p : 100 - p}% of the old one.`, `Divide ${Vi} by ${L(f)}.`],
      params: { p, rise, V: Vi },
    };
  },
};

// Prompts that are not a single equation are re-read by pattern; the rest by the shared parser.
function verify(item) {
  const t = item.prompt.text;
  let m;
  if ((m = t.match(/^Percentage change from ([\d.]+) to ([\d.]+) = \?$/))) {
    const a = parseLabel(m[1]), b = parseLabel(m[2]);
    return judge(item, (v) => v.eq(b.sub(a).div(a).mul(100)));
  }
  if ((m = t.match(/^After a ([\d.]+)% (rise|fall) the price is ([\d.]+)\. Price before = \?$/))) {
    const p = parseLabel(m[1]).div(100), V = parseLabel(m[3]);
    return judge(item, (v) => v.mul(m[2] === 'rise' ? q(1).add(p) : q(1).sub(p)).eq(V));
  }
  return verifyExpr(item);
}

export default family({
  id: 'mm-percent',
  title: 'Percentages',
  skill: 'Percent of a number from 10%, 5% and 1% chunks; which percent; the whole from a part; percentage change; the price before a rise or fall',
  levels: [1, 2, 3],
  rule: 'Build any percent from 10%, 5% and 1%. Change is measured against the OLD value. To undo a rise or fall, divide by (100 ± p)%.',
  anchor: 'Per cent means per hundred: 15% of 240 is 15 hundredths of 240.',
  variants: { of, which, base, change, before },
  verify,
  lesson: {
    purpose: 'Percent questions hide one trap each: the base. 10% chunks make the arithmetic quick, and asking "percent of WHAT?" avoids the wrong base.',
    anchor: '10% of anything is a tenth of it. Every other percent is built from 10%, 5% (half of it) and 1% (a tenth of it).',
    steps: [
      { say: '15% of 240: 10% = 24, 5% = 12, so 36.', why: '15% = 10% + 5%.' },
      { say: 'From 80 to 92: the change is 12, and 12/80 = 15%.', why: 'Change is measured against the starting value.' },
      { say: 'After a 20% rise the price is 96: 96 is 120% of the old price, so 96 ÷ 1.2 = 80.', why: 'The 20% was a share of the old price, not of 96.' },
    ],
    predict: { question: 'A price falls 20% and then rises 20%. Is it back where it started?', answer: 'No: 100 → 80 → 96. The rise is 20% of a smaller number.' },
    rule: 'Chunks of 10%, 5%, 1%. Always ask: percent of which number?',
    contrast: 'Taking 20% off 96 (76.8) is not the same as undoing a 20% rise (80): the bases differ.',
  },
});
