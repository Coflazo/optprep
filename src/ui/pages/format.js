// One-line description of an exam replica's format.
export function formatLine(cfg) {
  const e = cfg.exam;
  const time = e.perItemSeconds ? `${e.perItemSeconds} s each` : `${Math.round(e.totalSeconds / 60)} min total`;
  const scoring = { plusMinus: '+1 / −1 / skip 0', exactOrder: '1 point per exact order', ratio: 'lower ÷ upper if inside', solved: 'boards solved; wrong submit costs time' }[e.scoring];
  return `${e.count} questions, ${time}, ${scoring}`;
}
