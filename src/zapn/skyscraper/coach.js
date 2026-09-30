export default {
  purpose: 'Measures planning: whether you build the full move sequence in your head before acting, instead of moving blocks and hoping. Moves, total time and the pause before your first move are all recorded.',
  howItWorks: [
    'Three towers hold coloured blocks. Only the top block of a tower can move, and only onto a tower that still has room.',
    'Rebuild the target picture in as few moves as possible. Every level has a known minimum, shown after the level in practice mode.',
    '10 levels, from 3 blocks and 2 moves up to 6 blocks and 9 moves.',
    'Move with the mouse (click a tower, then the destination) or keys 1, 2, 3 for source then destination.',
  ],
  scoring: 'Moves above the optimum, averaged over levels. Target: at most 2 extra moves per level on average. Planning time is recorded separately, so a long pause before the first move is cheap; wasted moves are not.',
  strategy: [
    { say: 'Anchor: this is Tower of Hanoi without the size rule. The constraint that matters is the same: a block can only land where the tower has room, and only the top moves.', why: 'Both puzzles are about what must be cleared out of the way first, so the same backward reasoning applies.' },
    { say: 'Plan from the bottom of the target up. Ask: which block must sit at the bottom of each target tower, and what is on top of it now?', why: 'A bottom block can only be placed once its destination is empty and it is uncovered, so it fixes the first constraints of the plan.' },
    { say: 'Park blocks you must clear on the tower you will not need next, not the nearest one.', why: 'A parked block that blocks the next placement costs two extra moves: one to move it again, one to put it back.' },
    { say: 'Count the plan before you touch anything and compare it with the lower bound: every block not already resting on its final base must move at least once.', why: 'If your plan is well above that count, some block moves twice; find it. Planning time is scored separately, so a 10-second pause that saves one move is a good trade.' },
    { say: 'Edge case: a block already in its final place is not always safe to leave. If a block below it in the target is still missing, it must move.', why: 'Target towers build bottom-up; a correctly coloured block at the wrong height is still out of place.' },
  ],
  rule: 'Bottom-up: fix each target tower from its base. Park on the tower you need last. Count the plan, then move without stopping.',
  drills: [
    'Before each level, say the full move list out loud (for example "red to 3, blue to 2, red to 2"), then execute it without pausing.',
    'After a level where you went over the optimum, replay the optimal sequence in practice mode and find the first move where you left it.',
  ],
};
