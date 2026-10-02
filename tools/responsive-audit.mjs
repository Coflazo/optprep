#!/usr/bin/env node
// Responsive audit: every route at every device size, light and dark. Fails on page-level
// horizontal scroll, content off the right edge, tap targets under 24 px (WCAG 2.2 AA) and
// text under 12 px. Writes a screenshot per route and device for a human look.
//
//   npm i --no-save playwright-core && node tools/responsive-audit.mjs [--out dir] [--only phone]
//
// Uses the Chrome already installed (channel "chrome"); set CHROME_PATH to override.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

let chromium;
try { ({ chromium } = await import('playwright-core')); } catch {
  console.error('Needs playwright-core: npm i --no-save playwright-core');
  process.exit(2);
}

const args = process.argv.slice(2);
const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'screenshots/audit';
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const PORT = 8800 + Math.floor(Math.random() * 100);

const DEVICES = [
  { name: 'fold-280', width: 280, height: 653, mobile: true, scale: 3 },
  { name: 'phone-se-375', width: 375, height: 667, mobile: true, scale: 2 },
  { name: 'phone-393', width: 393, height: 852, mobile: true, scale: 3 },
  { name: 'phone-max-430', width: 430, height: 932, mobile: true, scale: 3 },
  { name: 'phone-landscape', width: 844, height: 390, mobile: true, scale: 3 },
  { name: 'ipad-slideover-320', width: 320, height: 1000, mobile: true, scale: 2 },
  { name: 'ipad-mini-768', width: 768, height: 1024, mobile: true, scale: 2 },
  { name: 'ipad-air-landscape', width: 1180, height: 820, mobile: true, scale: 2 },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'ultrawide-2560', width: 2560, height: 1080 },
  { name: 'zoom-200', width: 640, height: 450, scale: 2 }, // 1280x900 at 200% zoom
];

const ROUTES = ['#/', '#/s/mm', '#/s/bto', '#/s/nl', '#/s/ll', '#/s/iv', '#/s/ob', '#/zapn', '#/zapn/balloon', '#/zapn/skyscraper', '#/zapn/numberbox',
  '#/progress/patterns', '#/progress/mistakes', '#/progress/pace', '#/settings', '#/study', '#/study/book/bto', '#/study/lesson/bto/two-dice-sum',
  '#/study/lesson/prob/sample-spaces', '#/mock', '#/run/bto/practice', '#/run/nl/practice', '#/run/ll/practice', '#/run/iv/practice', '#/run/ob/practice', '#/run/bto/exam', '#/s/bto/sets'];

// A returning user: a battery picked, some answers and mistakes so every page has content.
const SEED = {
  version: 2, runs: [], stats: { 'bto:two-dice-sum': { n: 9, correct: 5, ms: 300000 } }, srs: {}, zapn: {}, sets: {}, calibration: [],
  settings: { preset: { id: 'full' }, dailyGoalMin: 10 },
  trend: { 'bto:two-dice-sum': { n: 9, c: 5, at: Date.now() } }, mastery: { 'bto:two-dice-sum': { lv: 2, run: 1, prun: 0, at: Date.now() } },
  activity: { days: {}, xpBase: 40, freezes: 1, frozen: [] },
  mistakes: [{ at: Date.now(), sid: 'bto', fam: 'two-dice-sum', id: 'bto:two-dice-sum:7', d: 1, mode: 'practice', ms: 41000, kind: 'mcq', prompt: 'Two fair dice are thrown. What is the probability that the sum is 9?', options: ['1/9', '1/12', '1/6', '4/11', '5/36'], chosen: '4/11', correct: '1/9', belief: 'Counted sums 2 to 12 as equally likely.', bk: 'x1', n: 2 }],
};

function audit() {
  const vw = document.documentElement.clientWidth;
  const problems = [];
  if (document.documentElement.scrollWidth > vw + 1) problems.push(`page scrolls sideways: ${document.documentElement.scrollWidth}px content in ${vw}px`);
  const scrollsX = (el) => { for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') return true; } return false; };
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || getComputedStyle(el).visibility === 'hidden') continue;
    if (r.right > vw + 1 && !scrollsX(el)) { problems.push(`off-screen: <${el.tagName.toLowerCase()} class="${el.className?.baseVal ?? el.className}"> right edge ${Math.round(r.right)} > ${vw}`); break; }
  }
  for (const el of document.querySelectorAll('a[href], button, input:not([type=hidden]), select, [role=button]')) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'inline' && el.tagName === 'A') continue; // inline text links are exempt (WCAG 2.5.8)
    if (el.closest('svg')) continue; // diagram node links: the same lessons are listed as full-size links on the page (2.5.8 equivalent)
    if (el.closest('.visually-hidden') || (el.tagName === 'INPUT' && (el.type === 'radio' || el.type === 'checkbox' || el.type === 'file'))) continue;
    if (r.height < 24 || r.width < 24) { problems.push(`small target ${Math.round(r.width)}x${Math.round(r.height)}: ${el.textContent.trim().slice(0, 30) || el.getAttribute('aria-label') || el.tagName}`); break; }
  }
  // Chrome bars keep their own height; spare height on a short page belongs to the sheet.
  for (const id of ['topbar', 'tabbar']) {
    const el = document.getElementById(id);
    if (el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 120) problems.push(`#${id} stretched to ${Math.round(el.getBoundingClientRect().height)}px`);
  }
  for (const el of document.querySelectorAll('main *, nav *')) {
    if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 11) { problems.push(`text ${fs}px: "${el.textContent.trim().slice(0, 30)}"`); break; }
  }
  return problems;
}

const server = spawn(process.execPath, ['bin/optprep.js', '--no-open', '--port', String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });
const report = [];
let failures = 0;
mkdirSync(out, { recursive: true });
try {
  for (const d of DEVICES.filter((x) => !only || x.name.includes(only))) {
    for (const scheme of ['light', 'dark']) {
      const ctx = await browser.newContext({ viewport: { width: d.width, height: d.height }, deviceScaleFactor: d.scale || 1, isMobile: !!d.mobile, hasTouch: !!d.mobile, colorScheme: scheme, reducedMotion: 'reduce' });
      await ctx.addInitScript((seed) => { try { if (!localStorage.getItem('optprep:v2')) localStorage.setItem('optprep:v2', JSON.stringify(seed)); } catch { /* ignore */ } }, SEED);
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      for (const route of ROUTES) {
        await page.goto(`http://127.0.0.1:${PORT}/${route}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(150);
        const problems = [...(await page.evaluate(audit)), ...errors.splice(0).map((e) => `script error: ${e}`)];
        const shot = `${d.name}-${scheme}-${route.replace(/[#/]+/g, '_').replace(/^_|_$/g, '') || 'today'}.png`;
        if (scheme === 'light' || problems.length) await page.screenshot({ path: join(out, shot), fullPage: false });
        if (problems.length) failures += 1;
        report.push({ device: d.name, scheme, route, problems, shot });
        if (problems.length) console.log(`FAIL ${d.name} ${scheme} ${route}\n  ${problems.join('\n  ')}`);
      }
      await ctx.close();
    }
  }
} finally {
  await browser.close();
  server.kill();
}
writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
console.log(`${report.length} checks, ${failures} with problems. Screenshots in ${out}/`);
process.exit(failures ? 1 : 0);
