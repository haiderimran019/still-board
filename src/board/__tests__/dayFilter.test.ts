import assert from 'node:assert/strict';

import { filterCounts, matchesFilter } from '../dayFilter.ts';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  console.log(`  ok  ${name}`);
  passed++;
}

const now = new Date(2026, 9, 29, 15, 0); // Thursday afternoon
const at = (d: number, h = 12) => new Date(2026, 9, d, h).getTime();

test('All shows everything, always', () => {
  assert.equal(matchesFilter(at(1), now, 'all'), true);
  assert.equal(matchesFilter(at(29), now, 'all'), true);
});

test('Today means since midnight, not the last 24 hours', () => {
  assert.equal(matchesFilter(at(29, 0), now, 'today'), true, 'just after midnight is today');
  assert.equal(matchesFilter(at(28, 23), now, 'today'), false, 'late last night is not');
});

test('This week reaches back six days and no further', () => {
  assert.equal(matchesFilter(at(23, 12), now, 'week'), true);
  assert.equal(matchesFilter(at(22, 23), now, 'week'), false);
});

test('Older is exactly what This week leaves out', () => {
  for (const d of [1, 10, 22, 23, 28, 29]) {
    const inWeek = matchesFilter(at(d), now, 'week');
    const inOlder = matchesFilter(at(d), now, 'older');
    assert.notEqual(inWeek, inOlder, `day ${d} was in both or neither`);
  }
});

test('Today is always part of This week', () => {
  for (const h of [0, 9, 23]) {
    if (matchesFilter(at(29, h), now, 'today')) {
      assert.ok(matchesFilter(at(29, h), now, 'week'));
    }
  }
});

test('the counts add up and nothing is counted twice', () => {
  const notes = [at(29), at(29, 1), at(26), at(10), at(1)].map((createdAt) => ({ createdAt }));
  const c = filterCounts(notes, now);
  assert.equal(c.all, 5);
  assert.equal(c.today, 2);
  assert.equal(c.week, 3);
  assert.equal(c.older, 2);
  assert.equal(c.week + c.older, c.all, 'every note lands in exactly one of the two');
});

console.log(`\n${passed} passed`);
