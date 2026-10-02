// Spiral recall inside one lesson: after every `every`-th new check, re-ask one earlier
// check so what was learned first comes back while the lesson goes on. Pure: no DOM, no
// clock, no randomness, so the choice is the same for the same answers.
//
// log: the session's answers in order, [{ block, clean, spiral? }], where block is the
// index of the check block in lesson.blocks and spiral marks a re-ask.
// Priority: the earliest check whose latest answer was wrong, then the earliest check not
// re-asked yet, then the earliest whose expanding gap has passed (every × 2^(times
// re-asked) new checks since it was last asked). Never the check just answered, never a
// second spiral before the next new check.

export const spiralBlocks = (blocks) => (blocks || []).flatMap((b, i) => (b?.type === 'check' && !b.mastery && b.questions?.length ? [i] : []));

export function nextSpiral(blocks, log, { every = 2 } = {}) {
  const last = log?.[log.length - 1];
  if (!last || last.spiral) return null;
  const news = log.filter((x) => !x.spiral);
  if (news.length % every !== 0) return null;
  const eligible = new Set(spiralBlocks(blocks));
  const seen = [...new Set(news.map((x) => x.block))].filter((b) => b !== last.block && eligible.has(b)).sort((a, b) => a - b);
  const state = (b) => {
    let latest = null, lastAt = -1, times = 0, n = 0;
    for (const x of log) {
      if (!x.spiral) n += 1;
      if (x.block !== b) continue;
      latest = x; lastAt = n;
      if (x.spiral) times += 1;
    }
    return { missed: latest && !latest.clean, times, since: news.length - lastAt };
  };
  const all = seen.map((b) => ({ b, ...state(b) }));
  return all.find((x) => x.missed && x.since > 0)?.b
    ?? all.find((x) => x.times === 0)?.b
    ?? all.find((x) => x.since >= every * 2 ** x.times)?.b
    ?? null;
}

// Which question of the block to re-ask: a generator gives fresh numbers, so prefer one.
export const spiralQuestion = (questions) => Math.max(0, questions.findIndex((q) => typeof q?.make === 'function'));
