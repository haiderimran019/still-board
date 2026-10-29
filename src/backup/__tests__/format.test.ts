import assert from 'node:assert/strict';

import type { Note } from '../../db/schema.ts';
import { backupFilename, newNotesOnly, parseBackup, toBackup } from '../format.ts';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  console.log(`  ok  ${name}`);
  passed++;
}

const note = (over: Partial<Note> = {}): Note => ({
  id: 'n1',
  text: 'Hand in the lab report',
  section: 'now',
  position: 1024,
  tint: 2,
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
  completedAt: null,
  remindAt: null,
  ...over,
});

const round = (notes: Note[]) => parseBackup(JSON.stringify(toBackup(notes, 1_700_000_000_000)));

test('a board survives a round trip unchanged', () => {
  const notes = [note(), note({ id: 'n2', section: 'someday', completedAt: 1_700_000_100_000 })];
  const r = round(notes);
  assert.ok(r.ok);
  assert.deepEqual(r.notes, notes);
});

test('the filename is dated and sortable', () => {
  assert.equal(backupFilename(new Date(2026, 9, 5, 14).getTime()), 'board-2026-10-05.json');
});

for (const [what, text] of [
  ['not JSON at all', 'hello'],
  ['JSON that is not an object', '[1,2,3]'],
  ['an object with no version', '{"notes":[]}'],
  ['notes that are not a list', '{"version":1,"notes":"lots"}'],
] as const) {
  test(`refuses ${what}`, () => {
    const r = parseBackup(text);
    assert.equal(r.ok, false);
    assert.ok(!r.ok && r.reason.length > 0, 'and says why');
  });
}

test('refuses a backup from a newer version of the app', () => {
  const r = parseBackup('{"version":99,"notes":[]}');
  assert.equal(r.ok, false);
  assert.match(!r.ok ? r.reason : '', /newer version/);
});

test('one damaged note rejects the whole file rather than half-restoring', () => {
  const good = note();
  const bad = { ...note({ id: 'n2' }), section: 'later' };
  const r = parseBackup(JSON.stringify({ version: 1, notes: [good, bad] }));
  assert.equal(r.ok, false);
  assert.match(!r.ok ? r.reason : '', /nothing was changed/);
});

test('a file listing the same note twice is refused', () => {
  const r = parseBackup(JSON.stringify({ version: 1, notes: [note(), note()] }));
  assert.equal(r.ok, false);
});

test('an older file without tints or reminders still restores', () => {
  const old = {
    id: 'n1',
    text: 'From an old backup',
    section: 'next',
    position: 2048,
    createdAt: 1,
    updatedAt: 1,
    completedAt: null,
  };
  const r = parseBackup(JSON.stringify({ version: 1, notes: [old] }));
  assert.ok(r.ok);
  assert.equal(r.notes[0].tint, 0);
  assert.equal(r.notes[0].remindAt, null);
});

test('an empty board is a valid backup, not an error', () => {
  const r = round([]);
  assert.ok(r.ok);
  assert.deepEqual(r.notes, []);
});

test('restoring only ever adds; it never touches what is already there', () => {
  const existing = [note({ id: 'a', text: 'mine, edited since' })];
  const incoming = [note({ id: 'a', text: 'the old wording' }), note({ id: 'b' })];
  const add = newNotesOnly(incoming, existing);
  assert.deepEqual(add.map((n) => n.id), ['b']);
});

test('restoring the same file twice adds nothing the second time', () => {
  const incoming = [note({ id: 'a' }), note({ id: 'b' })];
  const after = newNotesOnly(incoming, incoming);
  assert.deepEqual(after, []);
});

console.log(`\n${passed} passed`);
