// 80-in-8 mental arithmetic: every family is a generator + independent verifier + lesson.
// Order follows the method ladder: whole-number operations, then decimals, fractions and
// percents, then the reversed and multi-step shapes.
import addsub from './families/addsub.js';
import multiply from './families/multiply.js';
import divide from './families/divide.js';
import decimals from './families/decimals.js';
import fractions from './families/fractions.js';
import percent from './families/percent.js';
import missing from './families/missing.js';
import mixed from './families/mixed.js';

export const families = [addsub, multiply, divide, decimals, fractions, percent, missing, mixed];

export default { id: 'mm', families, bank: [] };
