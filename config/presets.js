// Role presets: which tasks a candidate actually sits, with the timings reported for that
// battery. Formats come from candidate reports (sources below) and drift by cycle, so
// every number stays editable here. Applying a preset changes clocks and question
// counts in place; the readiness targets below are this trainer's bar, not Optiver cutoffs.
import { SECTIONS, PORTAL_ORDER } from './sections.js';

export const ZAPN_ALL = ['balloon', 'skyscraper', 'shapeshift', 'codecompare', 'pincode', 'numberbox', 'figureitout', 'theswitch', 'stockmaster'];

export const SOURCES = {
  overview: { label: 'QuantVault: Optiver online assessment', url: 'https://quantvault.org/optiver-online-assessment.html' },
  mm: { label: 'QuantVault: Optiver 80-in-8', url: 'https://quantvault.org/optiver-80-in-8.html' },
  iv: { label: 'QuantVault: Optiver Intervals', url: 'https://quantvault.org/optiver-intervals.html' },
  ll: { label: 'QuantVault: Likelihood List', url: 'https://quantvault.org/optiver-likelihood-list.html' },
  zapn: { label: 'QuantVault: Zap-N', url: 'https://quantvault.org/zap-n.html' },
  atp: { label: 'Aptitude Test Prep: Optiver assessment', url: 'https://aptitude-test-prep.com/employers/trading-assessments/optiver-assessment/' },
};

export const PRESETS = {
  kickstarter: {
    id: 'kickstarter',
    title: 'Career Kickstarter: Trading',
    who: 'Final-year students applying to the five-day Amsterdam programme.',
    sections: ['bto', 'nl', 'll', 'iv', 'ob', 'zapn'],
    zapn: ZAPN_ALL,
    timing: { iv: { perItemSeconds: 45 }, nl: { navigation: 'free' } },
    sources: ['overview', 'iv', 'ob', 'll'],
  },
  trader: {
    id: 'trader',
    title: 'Trader and Quant Trader',
    who: 'Graduate, intern and PhD trading roles: the 80-in-8 plus the reasoning battery.',
    sections: ['mm', 'nl', 'bto', 'll', 'zapn'],
    zapn: ZAPN_ALL,
    timing: {
      nl: { count: 15, totalSeconds: 25 * 60, navigation: 'forward' },
      bto: { count: 30, perItemSeconds: 90 },
    },
    targets: { nl: { metric: 'netPct', value: 0.7, label: 'net score at least 70% of the maximum' } },
    note: 'Recent reports mention three Zap-N games for these roles, and which three varies, so all nine stay on the path.',
    sources: ['overview', 'mm', 'zapn'],
  },
  full: {
    id: 'full',
    title: 'Everything',
    who: 'Not sure which battery you will get. Practise every task at its most common reported format.',
    sections: ['mm', 'bto', 'nl', 'll', 'iv', 'ob', 'zapn'],
    zapn: ZAPN_ALL,
    timing: {},
    sources: ['overview', 'atp'],
  },
};

export const DEFAULT_PRESET = 'full';
const KNOWN = new Set([...PORTAL_ORDER, 'zapn']);

// A stored preset ({id} for built-ins, a full object for custom) → the battery to train.
export function resolvePreset(p) {
  if (p?.id === 'custom') {
    const sections = (p.sections || []).filter((s) => KNOWN.has(s) && (s === 'zapn' || SECTIONS[s]));
    const zapn = (p.zapn || []).filter((g) => ZAPN_ALL.includes(g));
    return { id: 'custom', title: 'Custom', who: 'Your own selection.', sections: sections.length ? sections : PRESETS.full.sections, zapn: zapn.length ? zapn : ZAPN_ALL, timing: p.timing || {}, targets: {}, sources: [] };
  }
  const base = PRESETS[p?.id] || PRESETS[DEFAULT_PRESET];
  return { targets: {}, ...base };
}

// Section order for the nav, the path and the mock: the preset's order, existing tasks only.
export const presetSections = (resolved) => resolved.sections.filter((s) => s === 'zapn' || SECTIONS[s]);

const BASE = Object.fromEntries(Object.entries(SECTIONS).map(([id, s]) => [id, { exam: { ...s.exam }, target: { ...s.target } }]));

// Point every SECTIONS entry at the preset's timing and targets. Pure in effect: applying
// the same preset twice gives the same config, and switching presets starts from the base.
export function applyPreset(resolved) {
  for (const [id, s] of Object.entries(SECTIONS)) {
    const base = BASE[id] || { exam: { ...s.exam }, target: { ...s.target } };
    s.exam = { ...base.exam, ...(resolved.timing?.[id] || {}) };
    s.target = { ...base.target, ...(resolved.targets?.[id] || {}) };
  }
  return resolved;
}

// The clock a run was taken under, stamped on the run so readiness never mixes a 60 s
// run with a 45 s one.
export function timingOf(exam) {
  const t = { count: exam.count };
  if (exam.perItemSeconds) t.perItemSeconds = exam.perItemSeconds;
  if (exam.totalSeconds) t.totalSeconds = exam.totalSeconds;
  return t;
}

// A run counts toward readiness under the current timing when it had at least as many
// questions and no more time per question.
export function timingAtLeastAsStrict(run, exam) {
  if (!run) return false;
  if (!run.timing) return true; // runs from before timing was stamped count under the base format
  const per = (t) => (t.perItemSeconds ?? t.totalSeconds / t.count);
  return run.timing.count >= exam.count && per(run.timing) <= per(exam) + 1e-9;
}

let active = applyPreset(resolvePreset(null));
export const activePreset = () => active;
export function activatePreset(stored) { active = applyPreset(resolvePreset(stored)); return active; }

// Pass lines candidates have reported, with their source. Only verified reports belong
// here; a task without one says so on the page.
export const REPORTED = {
  mm: { text: 'about 55 net, 70+ competitive', source: 'mm' },
};
