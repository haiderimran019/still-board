import assert from 'node:assert/strict';

import { toBackup } from '../../backup/format.ts';
import type { Note } from '../../db/schema.ts';
import { syncBoard, syncSaid } from '../sync.ts';

/**
 * Sync is the one piece here that can destroy a board someone else is still
 * using, so the order of operations is pinned down against fakes: what is
 * uploaded, when, and — most of all — when nothing is uploaded at all.
 */

let passed = 0;
async function test(name: string, fn: () => Promise<void>) {
  await fn();
  console.log(`  ok  ${name}`);
  passed++;
}

const note = (id: string, text: string): Note => ({
  id,
  text,
  section: 'now',
  position: 1024,
  tint: 0,
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
  completedAt: null,
  remindAt: null,
  priority: 0,
});

/** A phone with a board on it and a Drive folder that may hold another. */
function phone(mine: Note[], remote: string | null) {
  const uploads: string[] = [];
  let board = [...mine];
  return {
    uploads,
    board: () => board,
    deps: {
      download: async () => ({ ok: true as const, value: remote }),
      upload: async (json: string) => {
        uploads.push(json);
        return { ok: true as const, value: 'saved' as const };
      },
      exportAll: async () => [...board],
      importNotes: async (incoming: readonly Note[]) => {
        const here = new Set(board.map((n) => n.id));
        const added = incoming.filter((n) => !here.has(n.id));
        board = [...board, ...added];
        return added.length;
      },
      now: () => 1_700_000_500_000,
    },
  };
}

await test('a first sync puts this board on the account', async () => {
  const p = phone([note('a', 'Pay the fee')], null);
  const out = await syncBoard(p.deps);
  assert.ok(out.ok);
  assert.equal(out.pulled, 0);
  assert.equal(out.total, 1);
  assert.equal(p.uploads.length, 1);
  assert.ok(p.uploads[0].includes('Pay the fee'));
});

await test('signing in on a second phone brings the first phone’s notes over', async () => {
  const remote = JSON.stringify(toBackup([note('a', 'Pay the fee')], 1_700_000_100_000));
  const p = phone([note('b', 'Call home')], remote);
  const out = await syncBoard(p.deps);
  assert.ok(out.ok);
  assert.equal(out.pulled, 1, 'the note from the other phone arrived');
  assert.deepEqual(
    p.board().map((n) => n.id).sort(),
    ['a', 'b']
  );
});

await test('what goes up is both boards, not just this one', async () => {
  const remote = JSON.stringify(toBackup([note('a', 'Pay the fee')], 1_700_000_100_000));
  const p = phone([note('b', 'Call home')], remote);
  await syncBoard(p.deps);
  // The whole failure this guards against: pulling the other board down and
  // then uploading only this one, which deletes it for the other phone.
  assert.equal(p.uploads.length, 1);
  assert.ok(p.uploads[0].includes('Pay the fee'), 'the other phone’s note survived');
  assert.ok(p.uploads[0].includes('Call home'), 'this phone’s note is there too');
});

await test('nothing already here is duplicated', async () => {
  const remote = JSON.stringify(toBackup([note('a', 'Pay the fee')], 1_700_000_100_000));
  const p = phone([note('a', 'Pay the fee')], remote);
  const out = await syncBoard(p.deps);
  assert.ok(out.ok);
  assert.equal(out.pulled, 0);
  assert.equal(p.board().length, 1);
});

await test('a backup that cannot be read is never uploaded over', async () => {
  const p = phone([note('b', 'Call home')], '{ not json at all');
  const out = await syncBoard(p.deps);
  assert.equal(out.ok, false);
  assert.equal(p.uploads.length, 0, 'the unreadable file was left exactly as it was');
});

await test('a Drive that will not answer changes nothing', async () => {
  const p = phone([note('b', 'Call home')], null);
  const out = await syncBoard({
    ...p.deps,
    download: async () => ({ ok: false as const, reason: 'No connection to Drive.' }),
  });
  assert.equal(out.ok, false);
  assert.equal(p.uploads.length, 0);
  assert.equal(syncSaid(out), 'No connection to Drive.');
});

await test('a failed upload is reported rather than claimed as a success', async () => {
  const p = phone([note('b', 'Call home')], null);
  const out = await syncBoard({
    ...p.deps,
    upload: async () => ({ ok: false as const, reason: 'Drive is full.' }),
  });
  assert.equal(out.ok, false);
  assert.equal(syncSaid(out), 'Drive is full.');
});

console.log(`\n${passed} sync tests passed`);
