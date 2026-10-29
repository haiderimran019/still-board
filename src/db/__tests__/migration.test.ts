import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import * as repo from '../repository.ts';
import { SCHEMA_VERSION } from '../schema.ts';
import { fileDriver } from './nodeDriver.ts';

/**
 * The upgrade path, which is the one thing in this app that can destroy
 * something irreplaceable. A phone that already has notes on it must come
 * through a schema change with every one of them intact.
 */

/** Exactly the schema shipped as version 1 — never update this one. */
const V1_SQL = `
CREATE TABLE IF NOT EXISTS notes (
  id           TEXT    PRIMARY KEY NOT NULL,
  text         TEXT    NOT NULL,
  section      TEXT    NOT NULL CHECK (section IN ('now','next','someday')),
  position     REAL    NOT NULL,
  tint         INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  completed_at INTEGER
);
PRAGMA user_version = 1;
`;

/**
 * Exactly the schema shipped as version 3, indexes and all — never update it.
 *
 * v4 is the first migration that rebuilds the table rather than adding to it,
 * because the list of sections is a CHECK constraint and SQLite cannot alter
 * one. A rebuild is the step that can quietly lose a board, and the phones
 * taking it are the ones already running v3 — so it gets a starting point of
 * its own rather than riding on the v1 case.
 */
const V3_SQL = `
CREATE TABLE IF NOT EXISTS notes (
  id           TEXT    PRIMARY KEY NOT NULL,
  text         TEXT    NOT NULL,
  section      TEXT    NOT NULL CHECK (section IN ('now','next','someday')),
  position     REAL    NOT NULL,
  tint         INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  completed_at INTEGER,
  remind_at    INTEGER,
  priority     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS notes_board ON notes (section, position) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS notes_due   ON notes (remind_at) WHERE remind_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS notes_done  ON notes (completed_at DESC) WHERE completed_at IS NOT NULL;
PRAGMA user_version = 3;
`;

const dir = mkdtempSync(join(tmpdir(), 'still-mig-'));
const file = join(dir, 'still.db');
const driver = fileDriver(file);

let passed = 0;
async function test(name: string, fn: () => Promise<void>) {
  await fn();
  console.log(`  ok  ${name}`);
  passed++;
}

try {
  // Build a phone that is still on version 1, with notes already on its board.
  const old = await driver(file);
  await old.execAsync(V1_SQL);
  const t = Date.now();
  for (const [i, [text, section]] of (
    [
      ['Hand in the lab report', 'now'],
      ['Call home', 'now'],
      ['Learn to swim', 'someday'],
    ] as const
  ).entries()) {
    await old.runAsync(
      `INSERT INTO notes (id, text, section, position, tint, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [`old-${i}`, text, section, (i + 1) * 1024, i, t, t]
    );
  }

  repo.__useDriver(driver);
  await repo.init();

  await test('every note survives the upgrade to the current schema', async () => {
    const board = await repo.listBoard();
    assert.equal(board.length, 3);
    assert.deepEqual(
      board.map((n) => n.text),
      ['Hand in the lab report', 'Call home', 'Learn to swim']
    );
  });

  await test('the new columns arrive empty rather than guessed at', async () => {
    // A phone two versions behind catches up in one launch: v1 -> v2 -> v3.
    for (const n of await repo.listBoard()) {
      assert.equal(n.remindAt, null, 'no reminder invented');
      assert.equal(n.priority, 0, 'no urgency invented');
    }
  });

  await test('the upgraded board takes urgency like a fresh one', async () => {
    const note = (await repo.listBoard())[0];
    await repo.setPriority(note.id, 3);
    repo.__useDriver(driver);
    await repo.init();
    assert.equal((await repo.listBoard()).find((n) => n.id === note.id)?.priority, 3);
  });

  await test('the database records its new version', async () => {
    const d = await driver(file);
    const row = await d.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    assert.equal(row?.user_version, SCHEMA_VERSION);
  });

  await test('a second launch does not try to migrate again', async () => {
    repo.__useDriver(driver);
    await repo.init();
    assert.equal((await repo.listBoard()).length, 3, 'still three, and no error thrown');
  });

  await test('the upgraded board takes reminders like a fresh one', async () => {
    const note = (await repo.listBoard()).find((n) => n.section === 'now')!;
    const when = Date.now() + 3_600_000;
    await repo.setReminder(note.id, when);
    repo.__useDriver(driver);
    await repo.init();
    assert.equal((await repo.listBoard()).find((n) => n.id === note.id)?.remindAt, when);
  });

  // ---------- a phone that is on v3, which is the real upgrade path ----------

  await test('a v3 board survives the table rebuild that v4 needs', async () => {
    const dir3 = mkdtempSync(join(tmpdir(), 'still-v3-'));
    try {
      const file3 = join(dir3, 'still.db');
      const d3 = fileDriver(file3);
      const old3 = await d3(file3);
      await old3.execAsync(V3_SQL);

      const t3 = Date.now();
      const due = t3 + 7_200_000;
      await old3.runAsync(
        `INSERT INTO notes (id, text, section, position, tint, created_at, updated_at, completed_at, remind_at, priority)
         VALUES ('v3-a', 'Pay the hostel fee', 'now', 1024, 2, ?, ?, NULL, ?, 3)`,
        [t3, t3, due]
      );
      await old3.runAsync(
        `INSERT INTO notes (id, text, section, position, tint, created_at, updated_at, completed_at, remind_at, priority)
         VALUES ('v3-b', 'Fix the bike chain', 'someday', 2048, 1, ?, ?, ?, NULL, 0)`,
        [t3, t3, t3]
      );

      repo.__useDriver(d3);
      await repo.init();

      // Everything that was on the board is still on it, with every column
      // it had — a rebuild that silently dropped a reminder or an urgency
      // would look like a working migration right up until someone noticed.
      const board = await repo.listBoard();
      assert.equal(board.length, 1, 'the live note is still live');
      assert.equal(board[0].id, 'v3-a');
      assert.equal(board[0].remindAt, due, 'the reminder came through');
      assert.equal(board[0].priority, 3, 'the urgency came through');
      assert.equal(board[0].tint, 2);

      const done = await repo.listDone();
      assert.equal(done.length, 1, 'the finished note is still finished');
      assert.equal(done[0].id, 'v3-b');

      // The indexes are dropped by name before the rename, so they have to
      // come back with the new table or every read goes to a scan.
      const idx = await old3.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'notes'"
      );
      const names = idx.map((r) => r.name);
      for (const want of ['notes_board', 'notes_due', 'notes_done']) {
        assert.ok(names.includes(want), `${want} was rebuilt`);
      }

      // And the whole point of the rebuild: the new section is allowed now,
      // while the constraint still refuses anything that isn't a section.
      await repo.moveToEnd('v3-a', 'nextweek');
      assert.equal((await repo.listBoard())[0].section, 'nextweek');
      await assert.rejects(
        () => old3.runAsync(
          `INSERT INTO notes (id, text, section, position, created_at, updated_at)
           VALUES ('bad', 'x', 'later', 1, 1, 1)`
        ),
        'the section list is still enforced'
      );
    } finally {
      rmSync(dir3, { recursive: true, force: true });
      repo.__useDriver(driver);
      await repo.init();
    }
  });

  console.log(`\n${passed} migration tests passed (real v1 and v3 databases, upgraded in place)`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
