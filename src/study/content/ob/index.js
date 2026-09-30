// Book: Orderbooks. One opening foundation lesson (bids, asks, bundles, flat positions) and one
// lesson per board family, plus a recognition tree from "what is on the board" to the lesson.
import bookBasics from './book-basics.js';
import crossed from './crossed.js';
import bundleRich from './bundle-rich.js';
import bundleCheap from './bundle-cheap.js';
import weighted from './weighted.js';
import spread from './spread.js';
import chain from './chain.js';
import decoy from './decoy.js';
import hidden from './hidden.js';

const chapters = [
  { title: 'Reading the board', intro: 'Which price each tap uses, how a bundle is priced from its legs, why you must end flat, and the simplest arbitrage.', lessons: [bookBasics, crossed] },
  { title: 'Bundles against their legs', intro: 'One card against its replica, priced on the side you trade: rich, cheap, weighted, and with a minus sign.', lessons: [bundleRich, bundleCheap, weighted, spread] },
  { title: 'Harder boards', intro: 'When the obvious hedge is missing, misleading or too expensive to trade.', lessons: [chain, decoy, hidden] },
];

const tree = { diagram: 'flow', caption: 'Start at the top and answer each question about the board in front of you; every answer box opens its lesson.', spec: { root: 'basics', nodes: [
  { id: 'basics', text: 'New to bids, asks and bundles? Book basics first', kind: 'note', link: 'ob/book-basics' },
  { id: 'q-venue', text: 'Is one product quoted on several venues?', kind: 'q' },
  { id: 'a-crossed', text: 'Crossed venues: highest bid vs lowest ask', kind: 'a', link: 'ob/crossed' },
  { id: 'q-missing', text: 'Does every product inside the bundles have a card of its own?', kind: 'q' },
  { id: 'a-chain', text: 'Chain: build the missing product, B = (A + B) − A', kind: 'a', link: 'ob/chain' },
  { id: 'q-wide', text: 'Wide single products, tight bundles, and the leg check fails?', kind: 'q' },
  { id: 'a-hidden', text: 'Hidden: hedge with another bundle', kind: 'a', link: 'ob/hidden' },
  { id: 'q-minus', text: 'Does a card have a minus sign (A − B)?', kind: 'q' },
  { id: 'a-spread', text: 'Spread: copy it as buy A, sell B', kind: 'a', link: 'ob/spread' },
  { id: 'q-weight', text: 'Does a leg carry a weight (2A + B)?', kind: 'q' },
  { id: 'a-weighted', text: 'Weighted: price and trade each leg weight times', kind: 'a', link: 'ob/weighted' },
  { id: 'q-many', text: 'Several bundles, one that looks far off at mid?', kind: 'q' },
  { id: 'a-decoy', text: 'Decoy: check every card at bid and ask', kind: 'a', link: 'ob/decoy' },
  { id: 'q-side', text: 'Plain bundle: which side crosses its legs?', kind: 'q' },
  { id: 'a-rich', text: 'Bid above the legs\' asks: sell it (rich)', kind: 'a', link: 'ob/bundle-rich' },
  { id: 'a-cheap', text: 'Ask below the legs\' bids: buy it (cheap)', kind: 'a', link: 'ob/bundle-cheap' },
], edges: [
  { from: 'basics', to: 'q-venue' },
  { from: 'q-venue', to: 'a-crossed', label: 'yes' },
  { from: 'q-venue', to: 'q-missing', label: 'no, bundles' },
  { from: 'q-missing', to: 'a-chain', label: 'no' },
  { from: 'q-missing', to: 'q-wide', label: 'yes' },
  { from: 'q-wide', to: 'a-hidden', label: 'yes' },
  { from: 'q-wide', to: 'q-minus', label: 'no' },
  { from: 'q-minus', to: 'a-spread', label: 'yes' },
  { from: 'q-minus', to: 'q-weight', label: 'no' },
  { from: 'q-weight', to: 'a-weighted', label: 'yes' },
  { from: 'q-weight', to: 'q-many', label: 'no' },
  { from: 'q-many', to: 'a-decoy', label: 'yes' },
  { from: 'q-many', to: 'q-side', label: 'no' },
  { from: 'q-side', to: 'a-rich', label: 'bid' },
  { from: 'q-side', to: 'a-cheap', label: 'ask' },
] } };

export default {
  id: 'ob',
  title: 'Orderbooks',
  blurb: 'Every Orderbooks board type: read bids and asks, price any card from a replica on the side you trade, and submit only flat with cash above zero.',
  chapters,
  tree,
};
