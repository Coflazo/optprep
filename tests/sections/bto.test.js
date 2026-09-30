import section from '../../src/sections/bto/index.js';
import { familySuite, volumeSuite } from '../helpers/harness.js';

for (const f of section.families) familySuite('bto', f);
volumeSuite('bto', section.families, { min: 40 }); // raised to 300 once all families land
