// Market making: a bonus round for after the online assessment. The game lives in src/mk/;
// a finished session is stored with the Zap-N runs under 'mk', which awards XP.
import { h, mount } from '../dom.js';
import { makeRng } from '../../core/rng.js';
import * as game from '../../mk/view.js';

export function mkPage(root, { store }) {
  const stage = h('div', { class: 'mk' });
  mount(root,
    h('h1', {}, 'Market making'),
    h('p', { class: 'lede' }, 'After the online assessment, Optiver\'s later interview rounds can include market-making games; this is practice for those, not part of the online assessment. Quote a bid and an ask on a number nobody has seen, against a trader who knows part of it. A session is eight rounds.'),
    stage);
  return game.mount(stage, {
    rng: makeRng(`mk:${Date.now()}`),
    onFinish: ({ pnl, edge, rounds }) => store.recordZapn('mk', { pnl, edge, rounds }),
  });
}
