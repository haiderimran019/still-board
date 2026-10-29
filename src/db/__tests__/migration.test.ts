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

/** Exactly the schema shipped as version 1 — do not update this when v3 lands. */
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

  await test('the new column arrives empty rather than guessed at', async () => {
    for (const n of await repo.listBoard()) assert.equal(n.remindAt, null);
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

  console.log(`\n${passed} migration tests passed (a real v1 database, upgraded in place)`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
