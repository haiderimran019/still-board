import assert from 'node:assert/strict';

import { dropTarget, isNoOp, sectionAt } from '../drag.ts';
import type { NoteRect, SectionRect } from '../drag.ts';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  console.log(`  ok  ${name}`);
  passed++;
}

// A board laid out the way it is on screen: Now 100-300, Next 320-480,
// Someday 500-620. The gaps are the dividers between sections.
const sections: SectionRect[] = [
  { section: 'now', y: 100, h: 200 },
  { section: 'next', y: 320, h: 160 },
  { section: 'someday', y: 500, h: 120 },
];

// Three notes in Now at 110, 180, 250; each 60 tall.
const notes: NoteRect[] = [
  { id: 'a', section: 'now', y: 110, h: 60 },
  { id: 'b', section: 'now', y: 180, h: 60 },
  { id: 'c', section: 'now', y: 250, h: 60 },
  { id: 'd', section: 'next', y: 330, h: 60 },
];

test('the finger finds the section it is over', () => {
  assert.equal(sectionAt(sections, 150), 'now');
  assert.equal(sectionAt(sections, 400), 'next');
  assert.equal(sectionAt(sections, 550), 'someday');
});

test('a drag off the top or bottom still picks the nearest section', () => {
  assert.equal(sectionAt(sections, 0), 'now', 'above the board');
  assert.equal(sectionAt(sections, 9999), 'someday', 'below the board');
});

test('the gap between two sections is not a dead zone', () => {
  assert.equal(sectionAt(sections, 310), 'now', 'between Now and Next');
  assert.equal(sectionAt(sections, 490), 'next', 'between Next and Someday');
});

test('dropping above the first note inserts at the top', () => {
  assert.deepEqual(dropTarget(sections, notes, 115, 'd'), { section: 'now', index: 0 });
});

test('past the middle of a note means after it', () => {
  // 'a' spans 110-170, so its middle is 140.
  assert.deepEqual(dropTarget(sections, notes, 139, 'd'), { section: 'now', index: 0 });
  assert.deepEqual(dropTarget(sections, notes, 141, 'd'), { section: 'now', index: 1 });
});

test('dropping below everything appends', () => {
  assert.deepEqual(dropTarget(sections, notes, 299, 'd'), { section: 'now', index: 3 });
});

test('the dragged note is not counted against itself', () => {
  // Moving 'a' (the top note) down past 'b': with 'a' removed the list is
  // [b, c], and past b's middle (210) the answer must be 1, not 2.
  assert.deepEqual(dropTarget(sections, notes, 215, 'a'), { section: 'now', index: 1 });
  // And dragging 'a' to the very bottom of Now lands at the end of two notes.
  assert.deepEqual(dropTarget(sections, notes, 295, 'a'), { section: 'now', index: 2 });
});

test('dragging into an empty stretch of another section lands at its end', () => {
  assert.deepEqual(dropTarget(sections, notes, 470, 'a'), { section: 'next', index: 1 });
  assert.deepEqual(dropTarget(sections, notes, 550, 'a'), { section: 'someday', index: 0 });
});

test('a drop that changes nothing is recognised as such', () => {
  assert.equal(isNoOp({ section: 'now', index: 1 }, 'now', 1), true);
  assert.equal(isNoOp({ section: 'now', index: 2 }, 'now', 1), false);
  assert.equal(isNoOp({ section: 'next', index: 1 }, 'now', 1), false);
});

test('an unmeasured board refuses rather than guessing', () => {
  assert.equal(dropTarget([], notes, 200, 'a'), null);
});

console.log(`\n${passed} passed`);
