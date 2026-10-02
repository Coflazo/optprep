// About: who made OptPrep, the no-affiliation notice and the privacy summary. The full texts
// are LEGAL.md and PRIVACY.md in the repository; this page carries the essentials offline.
import { h, mount } from '../dom.js';

const REPO = 'https://github.com/Coflazo/optprep';

export function aboutPage(root) {
  mount(root,
    h('h1', {}, 'About OptPrep'),
    h('p', { class: 'lede' }, 'A free practice tool for the Optiver online assessment. Coflazo, an econometrics student, built it while preparing and shares it so other candidates can practise too.'),
    h('section', { class: 'field' },
      h('h2', { class: 'field-label' }, 'No affiliation with Optiver'),
      h('p', {}, 'OptPrep is an independent personal project. It is not affiliated with, endorsed by, sponsored by or connected to Optiver or any company in the Optiver group, and Optiver has not reviewed it. "Optiver" is a trademark of its owner and appears only to say which assessment OptPrep helps you practise for.'),
      h('p', {}, 'OptPrep contains no Optiver test content. Every question is generated or written from scratch. Formats come from what candidates have reported in public and can be out of date.')),
    h('section', { class: 'field' },
      h('h2', { class: 'field-label' }, 'No guarantee'),
      h('p', {}, 'OptPrep cannot guarantee that you pass any assessment or receive any offer. Optiver publishes no pass marks; "Ready" means your recent exam replicas met OptPrep\'s own bar. The software is free under the MIT license and comes as is, without warranty.')),
    h('section', { class: 'field' },
      h('h2', { class: 'field-label' }, 'Privacy'),
      h('p', {}, 'Your progress stays in this browser on this device. OptPrep has no accounts, cookies, analytics, ads or third-party scripts, and nobody behind OptPrep ever receives your data. If you turn on GitHub sync in Settings, your progress goes to a secret gist in your own GitHub account, encrypted if you set a passphrase.')),
    h('p', { class: 'small-note' },
      h('a', { href: `${REPO}/blob/main/LEGAL.md`, target: '_blank', rel: 'noopener' }, 'Full legal notice'), ' · ',
      h('a', { href: `${REPO}/blob/main/PRIVACY.md`, target: '_blank', rel: 'noopener' }, 'Privacy notice'), ' · ',
      h('a', { href: `${REPO}/blob/main/LICENSE`, target: '_blank', rel: 'noopener' }, 'MIT license'), ' · ',
      h('a', { href: REPO, target: '_blank', rel: 'noopener' }, 'Source code')),
    h('p', { class: 'muted small-note' }, 'Governed by the law of the Netherlands. Questions go to a GitHub issue.'));
}
