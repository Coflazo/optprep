// Every Orderbooks family. Kept apart from index.js so bank.js can import it without a cycle.
import crossed from './families/crossed.js';
import bundleRich from './families/bundle-rich.js';
import bundleCheap from './families/bundle-cheap.js';
import weighted from './families/weighted.js';
import spread from './families/spread.js';
import chain from './families/chain.js';
import decoy from './families/decoy.js';
import hidden from './families/hidden.js';

export const families = [crossed, bundleRich, bundleCheap, weighted, spread, chain, decoy, hidden];
