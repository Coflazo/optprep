import { h } from '../dom.js';
import { positionOutcome } from '../../core/check.js';
import { fmtNum } from '../../core/format.js';

// Tap a bid to sell one unit there, an ask to buy one unit. The position panel shows
// the net quantity per product and the locked-in profit. Correct = flat and profit > 0.
export function orderbookView(item, { onChange } = {}) {
  const board = item.board;
  let trades = [];
  let locked = false;
  const tradeList = h('div', { class: 'ob-trades' });
  const netRow = h('div', { class: 'ob-net num' });
  const priceBtn = (ins, side) => h('button', {
    class: `btn small ob-${side}`, type: 'button',
    'aria-label': `${side === 'buy' ? 'Buy' : 'Sell'} one ${ins.name || ins.id} at ${side === 'buy' ? ins.ask : ins.bid}`,
    onclick: () => { if (locked) return; trades.push({ id: ins.id, side }); render(); onChange?.(); },
  }, fmtNum(side === 'buy' ? ins.ask : ins.bid));
  const table = h('table', { class: 'ob-table' },
    h('thead', {}, h('tr', {}, h('th', {}, 'Instrument'), h('th', {}, 'Contains'), h('th', { style: { textAlign: 'right' } }, 'Bid (you sell)'), h('th', { style: { textAlign: 'right' } }, 'Ask (you buy)'))),
    h('tbody', {}, board.instruments.map((ins) => h('tr', {},
      h('td', {}, h('strong', {}, ins.name || ins.id)),
      h('td', { class: 'muted' }, legsText(board, ins)),
      h('td', { style: { textAlign: 'right' } }, priceBtn(ins, 'sell')),
      h('td', { style: { textAlign: 'right' } }, priceBtn(ins, 'buy'))))));
  function render() {
    tradeList.replaceChildren(...(trades.length ? trades.map((t, i) => {
      const ins = board.instruments.find((x) => x.id === t.id);
      return h('span', { class: `badge ${t.side === 'buy' ? 'warn' : ''}` },
        `${t.side === 'buy' ? 'Buy' : 'Sell'} ${ins.name || ins.id} @ ${fmtNum(t.side === 'buy' ? ins.ask : ins.bid)} `,
        locked ? null : h('button', { class: 'linkish', type: 'button', 'aria-label': 'Remove trade', onclick: () => { trades.splice(i, 1); render(); onChange?.(); } }, '×'));
    }) : [h('span', { class: 'muted' }, 'No trades yet. Tap a price.')]));
    if (!trades.length) { netRow.textContent = ''; return; }
    const net = board.products.map(() => 0);
    for (const t of trades) board.instruments.find((x) => x.id === t.id).legs.forEach((q, k) => { net[k] += (t.side === 'buy' ? 1 : -1) * q; });
    const { profit } = positionOutcome(board, trades);
    netRow.textContent = `Net: ${board.products.map((p, k) => `${p} ${net[k] > 0 ? '+' : ''}${net[k]}`).join('  ')}   Cash: ${profit >= 0 ? '+' : ''}${fmtNum(profit)}`;
  }
  render();
  const el = h('div', { class: 'ob' }, table, h('h3', {}, 'Your position'), tradeList, netRow,
    h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { class: 'btn small', type: 'button', onclick: () => { if (!locked) { trades = []; render(); onChange?.(); } } }, 'Clear')));
  return {
    el,
    response: () => (trades.length ? { trades: [...trades] } : null),
    setResponse: (r) => { trades = [...(r?.trades || [])]; render(); },
    clear: () => { trades = []; render(); },
    lock: () => { locked = true; el.querySelectorAll('button').forEach((b) => { b.disabled = true; }); render(); },
    reveal: () => {},
  };
}

function legsText(board, ins) {
  const parts = ins.legs.map((q, k) => (q === 0 ? null : `${q > 0 ? (q === 1 ? '' : q) : (q === -1 ? '−' : `−${-q}`)}${board.products[k]}`)).filter(Boolean);
  return parts.join(' + ').replace(/\+ −/g, '− ');
}
