import assert from 'node:assert/strict';

import { actionSaid, actionsFor, readAction } from '../noteActions.ts';
import type { Note } from '../../db/schema.ts';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  console.log(`  ok  ${name}`);
  passed++;
}

const note = (over: Partial<Note> = {}): Note => ({
  id: 'n1',
  text: 'Pay hostel fee',
  section: 'now',
  position: 1,
  tint: 0,
  createdAt: 0,
  updatedAt: 0,
  completedAt: null,
  remindAt: null,
  priority: 0,
  ...over,
});

const names = (n: Note, i: number, c: number) => actionsFor(n, i, c).map((a) => a.name);

test('every gesture has an action behind it', () => {
  const got = names(note(), 1, 3);
  assert.ok(got.includes('finish'), 'finishing');
  assert.ok(got.includes('delete'), 'dropping');
  assert.ok(got.includes('up') && got.includes('down'), 'reordering');
  assert.ok(
    got.some((n) => n.startsWith('move:')),
    'moving between sections'
  );
});

test('a note is never offered a move into the section it is already in', () => {
  for (const section of ['now', 'next', 'nextweek', 'someday'] as const) {
    const got = names(note({ section }), 0, 1);
    assert.ok(!got.includes(`move:${section}`), section);
    assert.equal(got.filter((n) => n.startsWith('move:')).length, 3, `${section} offers the other three`);
  }
});

test('the ends of a list do not offer a move that would do nothing', () => {
  assert.ok(!names(note(), 0, 3).includes('up'), 'the first note cannot go up');
  assert.ok(!names(note(), 2, 3).includes('down'), 'the last note cannot go down');
  const alone = names(note(), 0, 1);
  assert.ok(!alone.includes('up') && !alone.includes('down'), 'an only note does not reorder');
});

test('every action carries words, not just a name', () => {
  for (const a of actionsFor(note(), 1, 3)) {
    assert.ok(a.label.length > 0, a.name);
    assert.ok(!a.label.includes(':'), `${a.name} is not reading out its own id`);
  }
});

test('names survive the round trip', () => {
  for (const a of actionsFor(note(), 1, 3)) {
    assert.notEqual(readAction(a.name), null, a.name);
  }
  assert.deepEqual(readAction('up'), { kind: 'shift', by: -1 });
  assert.deepEqual(readAction('down'), { kind: 'shift', by: 1 });
  assert.deepEqual(readAction('move:nextweek'), { kind: 'move', to: 'nextweek' });
});

test('an action we do not recognise is ignored rather than thrown', () => {
  assert.equal(readAction('activate'), null);
  assert.equal(readAction('move:'), null);
  assert.equal(readAction('move:nowhere'), null);
  assert.equal(readAction(''), null);
});

test('something is said back for every action', () => {
  const n = note();
  assert.match(actionSaid({ kind: 'finish' }, n), /Pay hostel fee/);
  assert.match(actionSaid({ kind: 'delete' }, n), /undo/i);
  assert.match(actionSaid({ kind: 'shift', by: -1 }, n), /up/i);
  assert.match(actionSaid({ kind: 'move', to: 'nextweek' }, n), /Next week/);
});

console.log(`\n${passed} note action tests passed`);
