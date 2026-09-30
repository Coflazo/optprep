export default {
  purpose: 'Measures working memory: how many items you can hold and manipulate at once, which is what lets you keep several prices and positions in your head while trading.',
  howItWorks: [
    'A digit code appears, then disappears. Type it and press Enter.',
    'Mode 1 types it as shown, mode 2 reversed, mode 3 sorted from low to high.',
    'Start at 3 digits. Two correct at a length add a digit; two wrong at a length end the mode.',
    'Type with the number keys or the on-screen keypad. Backspace corrects.',
  ],
  scoring: 'Forward span: the longest code you typed correctly in mode 1. Target: 9 digits. Reverse and sorted spans are recorded too.',
  strategy: [
    { say: 'Anchor: you already remember phone numbers as 3-3-4, not as ten digits. Do the same here.', why: 'Working memory holds about four chunks, not about four digits. Grouping 849-217-35 turns 8 items into 3.' },
    { say: 'Chunk by 3, and say each chunk as a number: "eight forty-nine, two seventeen, thirty-five".', why: 'A spoken number is one sound-unit, so it uses the verbal rehearsal loop efficiently. Rehearse the chunks silently until you type.' },
    { say: 'Reverse mode: store the chunks forward, then reverse chunk by chunk from the last one.', why: 'Reversing all digits at once needs every digit in play; reversing one 3-digit chunk at a time needs only three.' },
    { say: 'Sorted mode: do not store the order at all. Tally how many of each digit you see: "two 3s, one 5, three 8s".', why: 'Sorting throws the order away, so memorising it is wasted effort. A tally is a smaller object, and reading it out 0 to 9 gives the sorted answer directly.' },
    { say: 'Start typing as soon as input opens.', why: 'Rehearsal fades within seconds once you stop repeating; the first chunk is the one most at risk.' },
    { say: 'Edge case: repeated digits ("7 7") are one chunk feature, not two items. Say "double seven".', why: 'Naming the repeat compresses it and prevents typing it once.' },
  ],
  rule: 'Forward: chunk by 3 and say them as numbers. Reverse: reverse chunk by chunk. Sorted: tally counts, read out 0 to 9.',
  drills: [
    'Practise with codes read from licence plates or receipts: glance once, look away, recite in chunks.',
    'Run the sorted mode using only the tally method for a whole session, even at short lengths, until it is automatic.',
  ],
};
