// Market-making view: one field per round. Quote (bid, ask, size), then the reveal, then
// the next round; after round 8 the session sheet. No motion: every change is instant.
import { h, mount as put, clear } from '../ui/dom.js';
import { choice, field, setRail } from '../ui/sheet.js';
import { createSession, ROUNDS, SIZES } from './engine.js';
import { roundNote, sessionNote, num, money } from './coach.js';

const TRADE = { buy: 'You sold', sell: 'You bought' };

export function mount(container, { rng, onFinish } = {}) {
  let session = null, size = SIZES[0];

  const head = () => {
    const st = session.state;
    return h('div', { class: 'qhead' },
      h('span', {}, `Round ${Math.min(st.round + 1, ROUNDS)} of ${ROUNDS}`),
      h('span', { class: 'num' }, `P&L ${money(st.pnl.toNumber())}`));
  };

  function start(focus) {
    session = createSession(rng);
    quote(focus);
  }

  function quote(focus) {
    const q = session.current();
    setRail(session.state.round / ROUNDS, `Round ${session.state.round + 1} of ${ROUNDS}`);
    const bid = h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', class: 'big', name: 'bid', 'aria-describedby': 'mk-error' });
    const ask = h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', class: 'big', name: 'ask', 'aria-describedby': 'mk-error' });
    const error = h('p', { class: 'exam-note', id: 'mk-error', role: 'alert' });
    const form = h('form', {
      class: 'mk-quote', novalidate: true,
      onsubmit: (e) => {
        e.preventDefault();
        const res = session.quote({ bid: bid.value, ask: ask.value, size });
        if (res.error) error.textContent = res.error;
        else reveal(res.entry);
      },
      // Enter on a size bubble submits too, like Enter in the price boxes.
      onkeydown: (e) => { if (e.key === 'Enter' && e.target.type === 'radio') { e.preventDefault(); form.requestSubmit(); } },
    },
    h('div', { class: 'mk-prices' }, h('label', {}, 'Bid', bid), h('label', {}, 'Ask', ask)),
    choice({ legend: 'Size', name: 'mk-size', columns: true, value: size, options: SIZES.map((v) => ({ value: v, label: String(v) })), onChange: (v) => { size = v; } }),
    error,
    h('button', { class: 'btn primary', type: 'submit' }, 'Quote'));
    put(container, head(), field(q.label,
      h('p', {}, `${q.setup} ${q.botLine}`),
      h('p', { class: 'muted small-note' }, `Your ask can be at most ${q.cap} above your bid.`),
      form));
    if (focus) bid.focus();
  }

  function reveal(e) {
    setRail((session.state.round + 1) / ROUNDS, `Round ${e.n} of ${ROUNDS} done`);
    const last = e.n === ROUNDS;
    const go = h('button', { class: 'btn primary', type: 'button', onclick: () => { session.next(); if (session.isOver()) finish(); else quote(true); } }, last ? 'See the results' : 'Next round');
    const trade = e.action === 'pass'
      ? `The other trader passed on your ${num(e.bid)} / ${num(e.ask)}.`
      : `${TRADE[e.action]} ${e.size} at your ${e.action === 'buy' ? 'ask' : 'bid'} of ${num(e.price)}.`;
    put(container, head(), field(e.label,
      h('p', {}, trade),
      h('p', {}, `${e.drawText} ${e.label}: ${e.settlement}. Fair value was ${e.fairText}.`),
      h('p', {}, 'P&L this round ', h('span', { class: 'num big' }, money(e.pnl))),
      h('p', { class: 'muted' }, roundNote(e)),
      go));
    go.focus();
  }

  function finish() {
    const res = session.result();
    const note = sessionNote(session.state.log);
    const trades = session.state.log.filter((e) => e.action !== 'pass');
    setRail(1, 'Session complete');
    const again = h('button', { class: 'btn primary', type: 'button', onclick: () => start(true) }, 'Play again');
    put(container,
      field('Session',
        h('div', { class: 'summary-stats' },
          h('span', {}, 'P&L ', h('span', { class: 'num big' }, money(res.pnl))),
          h('span', {}, 'Edge vs fair value ', h('span', { class: 'num big' }, money(res.edge))),
          h('span', {}, 'Picked off ', h('span', { class: 'num big' }, `${trades.filter((e) => e.pickedOff).length}/${trades.length}`))),
        h('p', {}, note.text),
        h('p', {}, h('strong', {}, note.habit))),
      h('div', {}, h('table', { class: 'data' },
        h('thead', {}, h('tr', {}, ['Round', 'Number', 'Market', 'Fair', 'Trade', 'P&L'].map((x, i) => h('th', { class: i >= 3 && i !== 4 ? 'r' : null }, x)))),
        h('tbody', {}, session.state.log.map((e) => h('tr', {},
          h('td', { class: 'num' }, String(e.n)),
          h('td', {}, e.label),
          h('td', { class: 'num' }, `${num(e.bid)} / ${num(e.ask)} × ${e.size}`),
          h('td', { class: 'num r' }, num(e.fair)),
          h('td', {}, e.action === 'pass' ? 'None' : `${e.action === 'buy' ? 'Sold' : 'Bought'}${e.pickedOff ? ', picked off' : ''}`),
          h('td', { class: 'num r' }, money(e.pnl))))))),
      h('div', { class: 'row', style: { marginTop: '16px' } }, again));
    again.focus();
    onFinish?.(res);
  }

  start(false);
  return () => clear(container);
}
