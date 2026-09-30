// Countdown with an injectable clock so exam timing is testable.
export function makeCountdown(ms, now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())) {
  const start = now();
  let penalty = 0;
  const remaining = () => Math.max(0, ms - (now() - start) - penalty);
  return {
    remaining,
    elapsed: () => now() - start,
    expired: () => remaining() <= 0,
    penalize: (p) => { penalty += p; },
  };
}
