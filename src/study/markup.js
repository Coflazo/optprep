// Inline markup for lesson text, tokenised into data and rendered with text nodes only
// (never innerHTML), so lesson strings can never inject markup.
//   **bold**  *italic*  `code`  {{numerator|denominator}}  x^{sup}  a_{sub}
const RULES = [
  { t: 'b', re: /\*\*([^*]+?)\*\*/y },
  { t: 'i', re: /\*([^*\s][^*]*?)\*/y },
  { t: 'code', re: /`([^`]+?)`/y },
  { t: 'frac', re: /\{\{([^|{}]+)\|([^|{}]+)\}\}/y },
  { t: 'sup', re: /\^\{([^{}]+)\}/y },
  { t: 'sub', re: /_\{([^{}]+)\}/y },
];

export function tokenize(s) {
  const out = [];
  let buf = '';
  let i = 0;
  const flush = () => { if (buf) { out.push({ t: 'text', v: buf }); buf = ''; } };
  while (i < s.length) {
    let hit = null;
    for (const r of RULES) {
      r.re.lastIndex = i;
      const m = r.re.exec(s);
      if (m) { hit = { r, m }; break; }
    }
    if (!hit) { buf += s[i]; i += 1; continue; }
    flush();
    const { r, m } = hit;
    out.push(r.t === 'frac' ? { t: 'frac', n: m[1].trim(), d: m[2].trim() } : { t: r.t, v: m[1] });
    i += m[0].length;
  }
  flush();
  return out;
}

// DOM rendering (browser only).
export function renderInline(s, h) {
  return tokenize(String(s ?? '')).map((k) => {
    switch (k.t) {
      case 'b': return h('strong', {}, k.v);
      case 'i': return h('em', {}, k.v);
      case 'code': return h('code', {}, k.v);
      case 'sup': return h('sup', {}, k.v);
      case 'sub': return h('sub', {}, k.v);
      case 'frac': return h('span', { class: 'frac', role: 'math', 'aria-label': `${k.n} over ${k.d}` }, h('span', { class: 'frac-n' }, k.n), h('span', { class: 'frac-d' }, k.d));
      default: return k.v;
    }
  });
}
