#!/usr/bin/env node
// Builds the README comparison chart from docs/compare/competitors.json:
// docs/media/compare-light.svg and docs/media/compare-dark.svg.
// Two panels share one row per product: the lowest listed price for the Optiver content,
// and which of the seven Optiver tasks it covers. OptPrep is the accent; everything else is
// one neutral grey. Fonts are embedded so GitHub and npm draw the same letters.
//   node tools/readme-charts.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const data = JSON.parse(readFileSync(`${ROOT}docs/compare/competitors.json`, 'utf8'));

// Palette checked with the dataviz validator against GitHub's light and dark surfaces.
const THEMES = {
  light: { text: '#0F2442', text2: '#3C5B7C', muted: '#4F6F91', rule: '#CFE3F4', grey: '#7F96AD', accent: '#D2492A' },
  dark: { text: '#DCE5EE', text2: '#A9C0D4', muted: '#94ADBF', rule: '#1C3557', grey: '#5E7EA0', accent: '#E26A4A' },
};

const TASK_ABBR = { '80-in-8': '80', 'Beat the Odds': 'BtO', NumberLogic: 'NL', 'Likelihood List': 'LL', Intervals: 'IV', Orderbooks: 'OB', 'Zap-N': 'Zap' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const font = (file) => readFileSync(`${ROOT}assets/fonts/${file}`).toString('base64');
const FONTS = `@font-face{font-family:R;font-weight:400 700;src:url(data:font/woff2;base64,${font('roboto-latin.woff2')}) format("woff2")}`
  + `@font-face{font-family:M;font-weight:400 600;src:url(data:font/woff2;base64,${font('roboto-mono-latin.woff2')}) format("woff2")}`;

// Lowest listed price in EUR. Rates are ECB reference quotes: units of the currency per euro.
export function entryEUR(p, rates) {
  if (p.price.amount === 0) return 0;
  const rate = p.price.currency === 'EUR' ? 1 : rates[p.price.currency];
  if (!rate) throw new Error(`${p.name}: no EUR rate for ${p.price.currency}`);
  return p.price.amount / rate;
}

// The order every chart and table uses: cheapest first, then most tasks covered.
export function rows(d = data) {
  const covered = (p) => d.tasks.filter((t) => p.tasks[t] === 'yes').length;
  return d.products.map((p) => ({ ...p, eur: entryEUR(p, d.rates), covered: covered(p) }))
    .sort((a, b) => a.eur - b.eur || b.covered - a.covered || a.name.localeCompare(b.name));
}

const niceMax = (v) => { const step = 10 ** Math.floor(Math.log10(v || 1)); return Math.ceil((v || 1) / step) * step; };
export const money = (p) => (p.price.amount === 0 ? 'Free' : `${{ EUR: '€', USD: '$', GBP: '£' }[p.price.currency] ?? `${p.price.currency} `}${p.price.amount}${p.price.vat ? ' + VAT' : ''}${p.price.per ? ` / ${p.price.per}` : ''}`);

export function chart(theme, d = data) {
  const c = THEMES[theme];
  const list = rows(d);
  // Columns: name, price as listed, price bar in EUR, then the seven task bubbles.
  const TX = 184, PX = 352, PW = 192, CX = 584, GAP = 40, TOP = 56, ROW = 40, BAR = 16;
  const W = CX + 8 + d.tasks.length * GAP + 24; // room for the n/7 count
  const H = TOP + list.length * ROW + 64;
  const max = niceMax(Math.max(...list.map((p) => p.eur)));
  const out = [];
  const t = (x, y, s, { size = 13, fill = c.text, weight = 400, anchor = 'start', mono = false } = {}) =>
    out.push(`<text x="${x}" y="${y}" font-family="${mono ? 'M' : 'R'},${mono ? 'ui-monospace,Menlo,monospace' : 'Roboto,system-ui,sans-serif'}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`);

  // Panel headers.
  t(TX, 20, 'Lowest listed price for the Optiver content', { size: 12, fill: c.text2, weight: 500 });
  t(PX, 42, 'in EUR', { size: 11, fill: c.muted, mono: true });
  t(CX, 20, 'Optiver tasks covered', { size: 12, fill: c.text2, weight: 500 });
  d.tasks.forEach((task, i) => t(CX + 8 + i * GAP, 42, TASK_ABBR[task] ?? task, { size: 11, fill: c.muted, anchor: 'middle', mono: true }));
  out.push(`<line x1="0" y1="${TOP - 4}" x2="${W}" y2="${TOP - 4}" stroke="${c.rule}" stroke-width="1"/>`);

  list.forEach((p, i) => {
    const y = TOP + i * ROW + ROW / 2;
    const ink = p.self ? c.accent : c.grey;
    t(0, y + 4.5, p.name, { size: 14, weight: p.self ? 700 : 400, fill: c.text });
    // Price bar: square at the baseline, 4 px rounded at the data end.
    const w = (p.eur / max) * PW;
    if (w > 0) {
      const r = Math.min(4, w);
      out.push(`<path d="M${PX} ${y - BAR / 2}h${w - r}a${r} ${r} 0 0 1 ${r} ${r}v${BAR - 2 * r}a${r} ${r} 0 0 1 -${r} ${r}h-${w - r}z" fill="${ink}"/>`);
    }
    t(TX, y + 4.5, money(p), { size: 13, mono: true, weight: p.self ? 600 : 400, fill: p.self ? c.text : c.text2 });
    // Coverage: filled = covered, ring with a dot = partly, empty ring = not covered or not stated.
    d.tasks.forEach((task, k) => {
      const cx = CX + 8 + k * GAP, v = p.tasks[task];
      if (v === 'yes') out.push(`<circle cx="${cx}" cy="${y}" r="7" fill="${ink}"/>`);
      else {
        out.push(`<circle cx="${cx}" cy="${y}" r="6.25" fill="none" stroke="${ink}" stroke-width="1.5"/>`);
        if (v === 'partial') out.push(`<circle cx="${cx}" cy="${y}" r="2.5" fill="${ink}"/>`);
      }
    });
    t(CX + 8 + d.tasks.length * GAP - 8, y + 4.5, `${p.covered}/${d.tasks.length}`, { size: 12, mono: true, fill: p.self ? c.text : c.muted });
    if (i < list.length - 1) out.push(`<line x1="0" y1="${y + ROW / 2}" x2="${W}" y2="${y + ROW / 2}" stroke="${c.rule}" stroke-width="1"/>`);
  });

  // Legend and source line.
  const ly = TOP + list.length * ROW + 26;
  out.push(`<circle cx="7" cy="${ly - 4}" r="6" fill="${c.grey}"/>`); t(20, ly, 'covered', { size: 12, fill: c.text2 });
  out.push(`<circle cx="92" cy="${ly - 4}" r="5.25" fill="none" stroke="${c.grey}" stroke-width="1.5"/><circle cx="92" cy="${ly - 4}" r="2.25" fill="${c.grey}"/>`); t(105, ly, 'partly', { size: 12, fill: c.text2 });
  out.push(`<circle cx="164" cy="${ly - 4}" r="5.25" fill="none" stroke="${c.grey}" stroke-width="1.5"/>`); t(177, ly, 'not covered or not stated', { size: 12, fill: c.text2 });
  t(0, ly + 24, `Prices as listed on each product's own page on ${d.checkedLabel}, in EUR at that day's ECB rates for the bars. Sources: docs/compare/competitors.json`, { size: 11, fill: c.muted });

  const label = `Lowest listed price and Optiver task coverage. ${list.map((p) => `${p.name}: ${money(p)}, ${p.covered} of ${d.tasks.length} tasks`).join('; ')}.`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title><style>${FONTS}</style>${out.join('')}</svg>\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync(`${ROOT}docs/media`, { recursive: true });
  for (const theme of Object.keys(THEMES)) writeFileSync(`${ROOT}docs/media/compare-${theme}.svg`, chart(theme));
  console.log(`Wrote docs/media/compare-light.svg and compare-dark.svg (${rows().length} products).`);
}
