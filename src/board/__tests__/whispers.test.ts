import assert from 'node:assert/strict';

import {
  ageWhisper,
  boxLabel,
  clearedToday,
  daysHeld,
  headerLine,
  partOfDay,
  somedayFade,
  splitSomeday,
} from '../whispers.ts';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  console.log(`  ok  ${name}`);
  passed++;
}

const at = (h: number) => new Date(2026, 9, 29, h, 0, 0);
const DAY = 86_400_000;
const NOW = Date.now();

test('the day is split into four parts', () => {
  assert.equal(partOfDay(at(7)), 'morning');
  assert.equal(partOfDay(at(13)), 'afternoon');
  assert.equal(partOfDay(at(19)), 'evening');
  assert.equal(partOfDay(at(23)), 'late');
  assert.equal(partOfDay(at(3)), 'late', 'three in the morning is still last night');
});

test('an empty board says so without fuss', () => {
  assert.equal(headerLine(at(9), 0, 0), 'A clean board.');
});

test('the header counts what is in Now', () => {
  assert.equal(headerLine(at(9), 3, 8), 'Morning · 3 in Now');
  assert.equal(headerLine(at(14), 1, 4), 'Afternoon · 1 in Now');
});

test('an empty Now is stated, not scolded', () => {
  assert.equal(headerLine(at(9), 0, 5), 'Morning — nothing in Now yet.');
});

test('late at night the board gives permission instead of a count', () => {
  assert.equal(headerLine(at(23), 5, 9), 'Late — most of this can wait for tomorrow.');
});

test('a late empty Now does not get the permission line', () => {
  // Nothing to let go of, so the line would be meaningless.
  assert.equal(headerLine(at(23), 0, 5), 'Late — nothing in Now yet.');
});

test('days held counts whole days and never goes negative', () => {
  assert.equal(daysHeld(NOW, NOW), 0);
  assert.equal(daysHeld(NOW - DAY * 3.9, NOW), 3);
  assert.equal(daysHeld(NOW + DAY, NOW), 0, 'a clock that jumped must not read as negative');
});

test('new notes get no whisper at all', () => {
  assert.equal(ageWhisper(NOW, NOW), null);
  assert.equal(ageWhisper(NOW - DAY * 3, NOW), null);
});

test('older notes are described by age, never by blame', () => {
  assert.equal(ageWhisper(NOW - DAY * 4, NOW), 'here 4 days');
  assert.equal(ageWhisper(NOW - DAY * 8, NOW), 'here a week');
  assert.equal(ageWhisper(NOW - DAY * 15, NOW), 'here two weeks');
  assert.equal(ageWhisper(NOW - DAY * 60, NOW), 'here three weeks');
  for (const d of [4, 8, 15, 60]) {
    const w = ageWhisper(NOW - DAY * d, NOW)!;
    assert.ok(!/still|overdue|late|should/i.test(w), `"${w}" must not nag`);
  }
});

test('cleared today counts today only', () => {
  const now = new Date(2026, 9, 29, 15, 0, 0);
  const today = new Date(2026, 9, 29, 9, 0, 0).getTime();
  const earlier = new Date(2026, 9, 29, 0, 1, 0).getTime();
  const yesterday = new Date(2026, 9, 28, 23, 0, 0).getTime();
  assert.equal(clearedToday([today, earlier, yesterday], now), 2);
  assert.equal(clearedToday([], now), 0);
});

test('a fresh Someday note is at full strength', () => {
  assert.equal(somedayFade(NOW, NOW), 1);
  assert.equal(somedayFade(NOW - DAY * 14, NOW), 1);
});

test('a Someday note fades gradually, never to nothing', () => {
  const mid = somedayFade(NOW - DAY * 30, NOW);
  assert.ok(mid < 1 && mid > 0.4, `expected a partial fade, got ${mid}`);
  assert.equal(somedayFade(NOW - DAY * 45, NOW), 0.4);
  assert.equal(somedayFade(NOW - DAY * 400, NOW), 0.4, 'it never disappears entirely');
});

test('the fade only ever decreases with age', () => {
  let last = 1;
  for (let d = 0; d <= 60; d++) {
    const v = somedayFade(NOW - DAY * d, NOW);
    assert.ok(v <= last, `day ${d} faded back up: ${v} > ${last}`);
    last = v;
  }
});

test('old Someday notes fold into the box, nothing is lost', () => {
  const notes = [0, 10, 44, 46, 300].map((d) => ({ createdAt: NOW - DAY * d, d }));
  const { out, boxed } = splitSomeday(notes, NOW);
  assert.deepEqual(out.map((n) => n.d), [0, 10, 44]);
  assert.deepEqual(boxed.map((n) => n.d), [46, 300]);
  assert.equal(out.length + boxed.length, notes.length, 'every note is still somewhere');
});

test('the box counts itself in plain words', () => {
  assert.equal(boxLabel(1), '1 idea resting');
  assert.equal(boxLabel(9), '9 ideas resting');
});

console.log(`\n${passed} passed`);
