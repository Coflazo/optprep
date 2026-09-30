import { h } from '../dom.js';

// Five options, keys 1-5 or A-E select. Response: { choice } or null.
export function mcqView(item, { onChange } = {}) {
  let choice = null;
  let locked = false;
  const buttons = item.options.map((o, i) => h('button', {
    class: 'option', type: 'button', 'aria-pressed': 'false',
    onclick: () => select(i),
  }, h('span', { class: 'key' }, 'ABCDE'[i]), h('span', { class: 'val' }, o.label)));
  function select(i) {
    if (locked) return;
    choice = i;
    buttons.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    onChange?.();
  }
  const el = h('div', { class: 'options', role: 'group', 'aria-label': 'Answer options' }, buttons);
  const onKey = (e) => {
    if (e.target.closest?.('input, textarea')) return;
    const k = e.key.toUpperCase();
    const i = '12345'.indexOf(k) >= 0 ? '12345'.indexOf(k) : 'ABCDE'.indexOf(k);
    if (i >= 0 && i < buttons.length) { select(i); e.preventDefault(); }
  };
  return {
    el,
    keyHandler: onKey,
    response: () => (choice == null ? null : { choice }),
    setResponse: (r) => { if (r?.choice != null) select(r.choice); },
    lock: () => { locked = true; buttons.forEach((b) => { b.disabled = true; }); },
    reveal: (res, response) => {
      buttons.forEach((b, i) => {
        if (i === item.answerIndex) b.classList.add('is-correct');
        else if (response?.choice === i) b.classList.add('is-wrong');
      });
    },
  };
}
