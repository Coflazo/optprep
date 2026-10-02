// Plain feedback for the market-making rounds. Pure: reads round records from
// engine.playRound and returns sentences. A mid more than an eighth of the allowed width
// from fair value is off centre; a market under three quarters of the allowed width is
// narrow. Costs are exact expected values from the engine, in points.
import { SIZES } from './engine.js';

export const num = (x) => String(Math.round(x * 100) / 100);
// Signed amounts use the minus sign (U+2212), as elsewhere in the app.
export function money(x) {
  const r = Math.round(x * 100) / 100;
  return `${r > 0 ? '+' : r < 0 ? '\u2212' : ''}${Math.abs(r).toFixed(2)}`;
}

const offCentre = (r) => Math.abs(r.midError) > r.cap / 8;
const narrow = (r) => r.width < 0.75 * r.cap;

function quoteLine(r) {
  if (offCentre(r)) {
    const up = r.midError > 0;
    return `Your mid of ${num(r.mid)} was ${num(Math.abs(r.midError))} ${up ? 'above' : 'below'} fair value (${r.fairText}), so your ${up ? 'bid was a gift to sellers' : 'ask was a gift to buyers'}.`;
  }
  if (narrow(r)) return `Your mid was on fair value, but ${num(r.width)} wide is tight when the other trader's estimate can be anywhere from ${num(r.infoLow)} to ${num(r.infoHigh)}, so use the full ${r.cap}.`;
  return `Good market: centred on fair value (${r.fairText}) and ${num(r.width)} wide.`;
}

function tradeLine(r) {
  const saw = `It saw ${r.seenText} and expected ${r.botEText}`;
  if (r.action === 'pass') return `${saw}, inside your market, so it passed.`;
  const did = r.action === 'buy' ? 'bought at your ask' : 'sold at your bid';
  if (r.pickedOff) return `${saw}, so it ${did} and picked you off; treat a trade like that as news and move your fair value toward it.`;
  return `${saw}, inside your market, so it ${did} for its own reasons; trades like that are where your spread makes money.`;
}

// One or two sentences after each round.
export const roundNote = (r) => `${quoteLine(r)} ${tradeLine(r)}`;

const BIG = Math.max(...SIZES);
const HABITS = {
  centre: (c) => `The habit to fix: work out fair value before you quote and put your mid on it. Off-centre markets cost you about ${num(c)} points of expected value.`,
  width: (c) => `The habit to fix: quote the full width the round allows. Narrow markets cost you about ${num(c)} points of expected value.`,
  size: (c) => `The habit to fix: trade size ${BIG} when your market is centred and full width. Smaller sizes left about ${num(c)} points of expected value unused.`,
  keep: () => 'Keep the habit: fair value first, mid on it, full width, and size to match.',
};

// After the session: what happened, and the single habit worth the most expected value.
// Centre and width count only rounds the round notes flagged, so a sensible rounded quote
// (3.5 / 5.5 when fair value is 4.47) is never blamed. Shrinking a losing market is never
// the top fix (centring it at full width recovers more), so size counts only good markets.
export function sessionNote(rounds) {
  const sum = (f) => rounds.reduce((a, r) => a + f(r), 0);
  const trades = rounds.filter((r) => r.action !== 'pass');
  const picked = trades.filter((r) => r.pickedOff).length;
  const costs = {
    centre: sum((r) => (offCentre(r) ? Math.max(0, r.evCentred - r.ev) * r.size : 0)),
    width: sum((r) => (narrow(r) ? Math.max(0, r.evFull - r.evCentred) * r.size : 0)),
    size: sum((r) => (r.ev > 0 ? (BIG - r.size) * r.ev : 0)),
  };
  const [worst, cost] = Object.entries(costs).sort((a, b) => b[1] - a[1])[0];
  const key = cost < 0.5 ? 'keep' : worst;
  const text = `${trades.length} ${trades.length === 1 ? 'trade' : 'trades'}, ${picked} of them picked off. On average your markets were worth ${money(sum((r) => r.ev * r.size))}; they made ${money(sum((r) => r.pnl))}, and the difference is luck.`;
  return { key, cost, costs, text, habit: HABITS[key](cost) };
}
