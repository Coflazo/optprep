import { family, q, L, list, diffsQ, PRIMES, stepText } from '../lib.js';

const isPrime = (n) => n > 1 && PRIMES.every((p) => p * p > n || n % p);

export default family({
  id: 'prime-gaps',
  title: 'Gaps are the primes',
  skill: 'When the gaps are irregular but increasing, check whether they are consecutive primes',
  levels: [3, 4],
  show: 6,
  params: (rng, d) => ({ a: rng.int(1, 20), s: d === 3 ? rng.int(0, 2) : rng.int(2, 7) }),
  terms: ({ a, s }, n) => { const out = [q(a)]; for (let i = 1; i < n; i++) out.push(out[i - 1].add(q(PRIMES[s + i - 1]))); return out; },
  rule: ({ s }) => `add consecutive primes ${PRIMES.slice(s, s + 3).join(', ')}, …`,
  explain: ({ s }, { shown }) => [
    { say: `Gaps: ${list(diffsQ(shown))}.`, why: 'Subtracting neighbours is always the first test.' },
    { say: 'The gaps are consecutive primes.', why: 'Their own differences are irregular, which rules out a second-difference rule.' },
  ],
  compute: ({ s }, all, k) => `Next prime gap ${PRIMES[s + k - 1]}; term ${k + 1} = ${stepText(all[k - 1], all[k])}.`,
  rivals: ({ s }, { shown }) => {
    const n = shown.length, a = shown[n - 1], lastP = PRIMES[s + n - 2], nextP = PRIMES[s + n - 1];
    const out = [{ value: a.add(q(PRIMES[s + n])), misconception: `Skipped a prime: the gap after ${lastP} is ${nextP}, not ${PRIMES[s + n]}.` }];
    for (let v = lastP + 2; v < nextP; v += 2) if (!isPrime(v)) { out.push({ value: a.add(q(v)), misconception: `Used ${v} as the next gap; it is odd but not prime.` }); break; }
    out.push({ value: a.add(q(lastP + 2)), misconception: `Assumed the gaps step by 2 (${lastP} → ${lastP + 2}); consecutive primes do not.` });
    return out;
  },
  hints: () => ['Write the gaps.', 'Do the gaps form a famous list?'],
  anchor: 'Arithmetic sequences add a fixed gap; here the gaps are the primes, a list you already know.',
  srule: 'Gaps are consecutive primes → add the next prime.',
  lesson: {
    purpose: 'A primes list one layer down is a favourite way to make a sequence look random.',
    anchor: 'Adding the counting numbers gives gaps 1, 2, 3, …; this family swaps the counting numbers for the primes.',
    steps: [
      { say: 'Write the gaps; if they are irregular but all prime and increasing, they are the prime list.', why: 'Recognition replaces formula here: primes have no formula.' },
      { say: 'Next term = last + next prime.', why: 'The gap list continues in order.' },
    ],
    predict: { question: '1, 3, 6, 11, 18, 29, ? Predict the next gap.', answer: 'Gaps 2, 3, 5, 7, 11, so 13: the term is 42.' },
    rule: 'Gaps are consecutive primes → add the next prime.',
    contrast: 'If the gaps are 3, 5, 7, 9 (odd numbers), the next gap is 11, but 9 → 11 → 13 → 15 continues differently: 15 is not prime.',
    edge: 'Early primes 2, 3, 5, 7 look like "add 1 then 2"; you need at least four gaps to separate primes from simpler rules.',
  },
});
