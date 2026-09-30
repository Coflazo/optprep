export default {
  purpose: 'Measures visual precision under time pressure: whether you can verify a string character by character fast enough, instead of trusting its overall shape.',
  howItWorks: [
    'A target code appears with four candidates below it. Exactly one candidate is identical.',
    'The others differ by one or two characters: a look-alike swap (O and 0, I and 1, S and 5, B and 8, Z and 2) or two neighbours swapped.',
    'Press 1 to 4, or click. 30 rounds; the time limit falls from 5 s to 3 s and codes grow from 7 to 10 characters. No answer in time counts as wrong.',
  ],
  scoring: 'Accuracy over 30 rounds, timeouts counted as wrong. Target: 90% or better.',
  strategy: [
    { say: 'Anchor: this is proofreading a phone number, not reading a word. Your eye reads words by shape; codes must be read by character.', why: 'Word reading fills in expected letters, which is exactly the O-for-0 error the distractors are built from.' },
    { say: 'Split the target into chunks of 3 or 4 and hold one chunk at a time.', why: 'Three or four characters fit in working memory at once, so each comparison is a single glance instead of a re-read.' },
    { say: 'Eliminate, do not confirm. Compare one chunk across all four candidates and drop every candidate that fails.', why: 'Three candidates are wrong, so each chunk usually removes one or two of them. When one candidate is left you are done, without checking the rest of it.' },
    { say: 'Check the end of the code first, then the start.', why: 'Candidates report that distractors share their beginnings with the target, so the start carries little information. This trainer places differences anywhere, so still finish the elimination pass.' },
    { say: 'Watch the look-alike pairs: O/0/D/Q, I/1/L/7, S/5, B/8/3, Z/2, G/6, and neighbour swaps like 47 versus 74.', why: 'These are the only kinds of difference used. Knowing the list turns a vague "looks the same" into a specific check.' },
    { say: 'Edge case: if two candidates still survive, compare them to each other, not to the target.', why: 'The two differ in exactly the place that matters. Find it, then check only that position in the target.' },
  ],
  rule: 'Chunk by 3-4, end first, eliminate across all four, then check the survivor pair against each other.',
  drills: [
    'Run a practice game saying each chunk silently ("K-5-O") before comparing it.',
    'Write down every error with the pair you confused. After three runs your personal look-alike list is the one to drill.',
  ],
};
