import assert from 'node:assert/strict';

import { dayLabel, groupByDay, windowNote } from '../done.ts';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  console.log(`  ok  ${name}`);
  passed++;
}

// Thursday 29 October 2026.
const now = new Date(2026, 9, 29, 15, 0);
const at = (d: number, h = 12) => new Date(2026, 9, d, h).getTime();

test('recent days are named, older ones are dated', () => {
  assert.equal(dayLabel(at(29, 9), now), 'Today');
  assert.equal(dayLabel(at(28), now), 'Yesterday');
  assert.equal(dayLabel(at(26), now), 'Monday');
  assert.equal(dayLabel(at(10), now), '10 Oct');
});

test('midnight today is still today, not yesterday', () => {
  assert.equal(dayLabel(at(29, 0), now), 'Today');
});

test('notes group by the day they were cleared, newest day first', () => {
  const g = groupByDay(
    [
      { id: 'a', completedAt: at(28, 9) },
      { id: 'b', completedAt: at(29, 9) },
      { id: 'c', completedAt: at(29, 14) },
    ],
    now
  );
  assert.deepEqual(g.map((x) => x.label), ['Today', 'Yesterday']);
  assert.deepEqual(g[0].notes.map((n) => n.id), ['c', 'b'], 'newest first within a day');
  assert.deepEqual(g[1].notes.map((n) => n.id), ['a']);
});

test('a note with no completion time is left out, not guessed at', () => {
  const g = groupByDay([{ id: 'a', completedAt: null }, { id: 'b', completedAt: at(29) }], now);
  assert.equal(g.length, 1);
  assert.deepEqual(g[0].notes.map((n) => n.id), ['b']);
});

test('an empty history says so plainly', () => {
  assert.equal(groupByDay([], now).length, 0);
  assert.match(windowNote(0), /Nothing cleared/);
  assert.match(windowNote(5), /still saved/);
});

console.log(`\n${passed} passed`);
