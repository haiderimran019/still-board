import assert from 'node:assert/strict';

import { clockTime, nextAtHour, reminderChoices, reminderLabel } from '../schedule.ts';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  console.log(`  ok  ${name}`);
  passed++;
}

const on = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m, 0, 0);

test('clock times read the way people say them', () => {
  assert.equal(clockTime(on(29, 18, 30).getTime()), '6:30 pm');
  assert.equal(clockTime(on(29, 9, 5).getTime()), '9:05 am');
  assert.equal(clockTime(on(29, 0, 0).getTime()), '12:00 am');
  assert.equal(clockTime(on(29, 12, 0).getTime()), '12:00 pm');
});

test('an hour that has already passed today means tomorrow', () => {
  assert.equal(nextAtHour(on(29, 10), 18), on(29, 18).getTime(), 'morning: this evening');
  assert.equal(nextAtHour(on(29, 20), 18), on(30, 18).getTime(), 'after 6pm: tomorrow evening');
  assert.equal(nextAtHour(on(29, 18), 18), on(30, 18).getTime(), 'exactly 6pm has gone');
});

test('reminders read as today, tomorrow, or a date', () => {
  const now = on(29, 10);
  assert.equal(reminderLabel(on(29, 18).getTime(), now), 'today 6:00 pm');
  assert.equal(reminderLabel(on(30, 8).getTime(), now), 'tomorrow 8:00 am');
  assert.equal(reminderLabel(on(31, 8).getTime(), now), '31 Oct 8:00 am');
});

test('a reminder in the past says so rather than lying about the time', () => {
  assert.equal(reminderLabel(on(29, 9).getTime(), on(29, 10)), 'due');
});

test('the evening button renames itself once evening has gone', () => {
  assert.equal(reminderChoices(on(29, 10))[1].label, 'This evening');
  assert.equal(reminderChoices(on(29, 21))[1].label, 'Tomorrow evening');
});

test('every choice is in the future, whatever time it is', () => {
  for (const h of [0, 7, 8, 12, 17, 18, 23]) {
    const now = on(29, h, 30);
    for (const c of reminderChoices(now)) {
      assert.ok(c.at > now.getTime(), `${c.key} at ${h}:30 was not in the future`);
    }
  }
});

console.log(`\n${passed} passed`);
