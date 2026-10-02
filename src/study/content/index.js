// All study books in reading order.
import assessment from './assessment/index.js';
import prob from './prob/index.js';
import bto from './bto/index.js';
import ll from './ll/index.js';
import nl from './nl/index.js';
import iv from './iv/index.js';
import ob from './ob/index.js';
import zapn from './zapn/index.js';
import mm from './mm/index.js';
import { lessonsOf } from '../schema.js';

export const BOOKS = [assessment, prob, mm, bto, ll, nl, iv, ob, zapn];
export const BOOK_BY_ID = Object.fromEntries(BOOKS.map((b) => [b.id, b]));
export const ALL_LESSONS = BOOKS.flatMap((b) => (b.pending ? [] : lessonsOf(b)));
export const LESSON_BY_ID = Object.fromEntries(ALL_LESSONS.map((l) => [l.id, l]));
// Section id + family id -> lesson id, for "Study this" links from practice.
export const lessonForFamily = (sectionId, familyId) => ALL_LESSONS.find((l) => l.kind === 'family' && l.book === sectionId && l.family === familyId)?.id ?? null;
