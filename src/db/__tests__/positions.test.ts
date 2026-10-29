/**
 * Pure ordering rules, tested without a database.
 * Run: npm test
 */
import assert from 'node:assert/strict';
import { between, needsRenumber, renumber, STEP } from '../positions.ts';

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log('  ok  ' + name);
}

check('first note in an empty section', () => {
  assert.equal(between(null, null), STEP);
});

check('appending goes after the last note', () => {
  assert.equal(between(2048, null), 2048 + STEP);
});

check('inserting at the top goes before the first', () => {
  assert.equal(between(null, 1024), 0);
  assert.ok(between(null, 1024) < 1024);
});

check('inserting between two notes lands between them', () => {
  const p = between(1024, 2048);
  assert.ok(p > 1024 && p < 2048, `${p} should sit between`);
});

check('repeated inserts into the same gap stay ordered', () => {
  let lo = 1024;
  const hi = 2048;
  for (let i = 0; i < 40; i++) {
    const p = between(lo, hi);
    assert.ok(p > lo && p < hi, `iteration ${i}: ${p} escaped (${lo}, ${hi})`);
    lo = p;
  }
});

check('the gap eventually exhausts, and we detect it', () => {
  let lo = 1024;
  const hi = 2048;
  let i = 0;
  while (!needsRenumber(lo, hi) && i < 200) {
    lo = between(lo, hi);
    i++;
  }
  assert.ok(i < 200, 'should exhaust within 200 inserts');
  assert.ok(needsRenumber(lo, hi), 'exhaustion must be reported');
  console.log(`      (exhausted after ${i} inserts into the same gap)`);
});

check('an open-ended gap never needs renumbering', () => {
  assert.equal(needsRenumber(null, 1024), false);
  assert.equal(needsRenumber(1024, null), false);
});

check('renumber spreads a section evenly and in order', () => {
  const p = renumber(5);
  assert.equal(p.length, 5);
  for (let i = 1; i < p.length; i++) assert.ok(p[i] > p[i - 1]);
  assert.equal(p[0], STEP);
});

console.log(`\n${passed} passed`);
