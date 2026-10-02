import { h } from '../dom.js';
import { superscripts } from '../../core/format.js';

// Order three statements, most likely first. Drag, or use the up/down buttons,
// or keyboard: 1-3 selects a row, ArrowUp/ArrowDown moves it.
export function rankView(item, { onChange } = {}) {
  let order = item.statements.map((_, i) => i);
  let locked = false;
  let selected = null;
  const list = h('ol', { class: 'rank-list', 'aria-label': 'Most likely at the top' });
  function move(pos, dir) {
    const to = pos + dir;
    if (locked || to < 0 || to >= order.length) return;
    [order[pos], order[to]] = [order[to], order[pos]];
    selected = order[to];
    render();
    onChange?.();
  }
  function render() {
    list.replaceChildren(...order.map((si, pos) => {
      const row = h('li', {
        class: `rank-row${selected === si ? ' is-selected' : ''}`, draggable: locked ? 'false' : 'true', dataset: { si: String(si) },
        ondragstart: (e) => { e.dataTransfer.setData('text/plain', String(pos)); },
        ondragover: (e) => e.preventDefault(),
        ondrop: (e) => {
          e.preventDefault();
          const from = Number(e.dataTransfer.getData('text/plain'));
          if (locked || Number.isNaN(from) || from === pos) return;
          const [x] = order.splice(from, 1);
          order.splice(pos, 0, x);
          render(); onChange?.();
        },
        onclick: () => { selected = si; render(); },
      },
      h('span', { class: 'rank-pos num' }, String(pos + 1)),
      h('span', { class: 'rank-text' }, item.statements[si].text),
      h('span', { class: 'rank-p num', hidden: true }),
      h('span', { class: 'rank-move' },
        h('button', { class: 'btn small', type: 'button', 'aria-label': 'Move up', disabled: locked || pos === 0, onclick: (e) => { e.stopPropagation(); move(pos, -1); } }, 'Up'),
        h('button', { class: 'btn small', type: 'button', 'aria-label': 'Move down', disabled: locked || pos === order.length - 1, onclick: (e) => { e.stopPropagation(); move(pos, 1); } }, 'Down')));
      return row;
    }));
  }
  render();
  const el = h('div', { class: 'rank' }, h('div', { class: 'muted small-note' }, 'Top = most likely. Drag rows, use Up/Down, or press 1-3 then the arrow keys.'), list);
  return {
    el,
    keyHandler: (e) => {
      if (locked) return;
      if ('123'.includes(e.key)) { selected = order[Number(e.key) - 1]; render(); e.preventDefault(); }
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && selected != null) {
        move(order.indexOf(selected), e.key === 'ArrowUp' ? -1 : 1); e.preventDefault();
      }
    },
    response: () => ({ order: [...order] }),
    setResponse: (r) => { if (r?.order) { order = [...r.order]; render(); } },
    lock: () => { locked = true; render(); },
    reveal: () => {
      [...list.children].forEach((row) => {
        const si = Number(row.dataset.si);
        const pos = [...list.children].indexOf(row);
        const p = row.querySelector('.rank-p');
        p.hidden = false;
        const st = item.statements[si];
        p.textContent = `p = ${st.exact || st.p.toFixed(3)}`;
        // How this statement's probability is found: the link to check when the order was wrong.
        if (st.how && !row.querySelector('.rank-how')) row.querySelector('.rank-text').append(h('div', { class: 'rank-how muted small-note' }, superscripts(st.how)));
        row.classList.add(item.answerOrder[pos] === si ? 'is-correct' : 'is-wrong');
      });
    },
  };
}
