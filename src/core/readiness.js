// A section is "ready" when its last N exam runs all meet the target in config.
export function runMeetsTarget(run, target) {
  switch (target.metric) {
    case 'net': return run.score >= target.value;
    case 'netPct': return run.max > 0 && run.score / run.max >= target.value;
    case 'mean': return run.max > 0 && run.score / run.max >= target.value;
    default: throw new Error(`unknown metric ${target.metric}`);
  }
}

export function readiness(examRuns, target, window = 3) {
  const recent = [...examRuns].sort((a, b) => a.finishedAt - b.finishedAt).slice(-window);
  let streak = 0;
  for (let i = recent.length - 1; i >= 0 && runMeetsTarget(recent[i], target); i--) streak++;
  return { ready: recent.length === window && streak === window, streak, needed: window };
}
