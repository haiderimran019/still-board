import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import * as repo from '../repository.ts';
import { SECTIONS } from '../schema.ts';
import { fileDriver } from './nodeDriver.ts';

const dir = mkdtempSync(join(tmpdir(), 'still-'));
const file = join(dir, 'still.db');
const driver = fileDriver(file);

let passed = 0;
async function test(name: string, fn: () => Promise<void>) {
  await fn();
  console.log(`  ok  ${name}`);
  passed++;
}

/** Drops the connection and opens the file again — a force-quit and relaunch. */
async function relaunch() {
  repo.__useDriver(driver);
  await repo.init();
}

try {
  await relaunch();

  await test('a first launch seeds the board', async () => {
    assert.equal(await repo.seedIfEmpty(), true);
    assert.equal((await repo.listBoard()).length, 8);
    assert.equal(await repo.countIn('now'), 3);
  });

  await test('a second launch does not seed again', async () => {
    assert.equal(await repo.seedIfEmpty(), false);
    assert.equal((await repo.listBoard()).length, 8);
  });

  await test('notes survive a force-quit and relaunch', async () => {
    const before = (await repo.listBoard()).length;
    await repo.create('Written before the crash', 'next');
    await relaunch();
    const texts = (await repo.listBoard()).map((n) => n.text);
    assert.ok(texts.includes('Written before the crash'));
    // Counted against what was there, not a number written down here: the
    // point is that nothing else went missing over the restart.
    assert.equal(texts.length, before + 1);
  });

  await test('migrations do not run twice', async () => {
    // A second migrate() on an existing file must leave the rows alone.
    const before = (await repo.listBoard()).length;
    await relaunch();
    assert.equal((await repo.listBoard()).length, before);
  });

  await test('the board comes back in section order, not insertion order', async () => {
    const sections = (await repo.listBoard()).map((n) => n.section);
    // Every section's notes are contiguous, and the sections run in the
    // order the board shows them. Written against SECTIONS rather than
    // spelled out, so adding a fifth one cannot leave this passing by
    // accident while the board puts it in the wrong place.
    const seen = SECTIONS.filter((s) => sections.includes(s));
    const firsts = seen.map((s) => sections.indexOf(s));
    const lasts = seen.map((s) => sections.lastIndexOf(s));
    assert.equal(sections.indexOf('now'), 0);
    for (let i = 0; i < seen.length; i++) {
      assert.equal(lasts[i] - firsts[i] + 1, sections.filter((s) => s === seen[i]).length);
      if (i > 0) assert.ok(lasts[i - 1] < firsts[i], `${seen[i - 1]} comes before ${seen[i]}`);
    }
  });

  await test('editing a note persists', async () => {
    const board = await repo.listBoard();
    await repo.edit(board[0].id, '  Trimmed on the way in  ');
    await relaunch();
    assert.equal((await repo.listBoard())[0].text, 'Trimmed on the way in');
  });

  await test('place() reorders within a section', async () => {
    const now = (await repo.listBoard()).filter((n) => n.section === 'now');
    const last = now[now.length - 1];
    await repo.place(last.id, 'now', 0);
    await relaunch();
    const after = (await repo.listBoard()).filter((n) => n.section === 'now');
    assert.equal(after[0].id, last.id);
    assert.equal(after.length, now.length);
  });

  await test('moving across sections keeps the counts right', async () => {
    const before = await repo.countIn('now');
    const note = (await repo.listBoard()).find((n) => n.section === 'now')!;
    await repo.moveToEnd(note.id, 'someday');
    assert.equal(await repo.countIn('now'), before - 1);
    const someday = (await repo.listBoard()).filter((n) => n.section === 'someday');
    assert.equal(someday[someday.length - 1].id, note.id);
  });

  await test('completing moves a note off the board and into Done', async () => {
    const note = (await repo.listBoard())[0];
    const boardBefore = (await repo.listBoard()).length;
    await repo.complete(note.id);
    await relaunch();
    assert.equal((await repo.listBoard()).length, boardBefore - 1);
    assert.ok((await repo.listDone()).some((n) => n.id === note.id));
  });

  await test('undo puts a completed note back at the end of its section', async () => {
    const done = (await repo.listDone())[0];
    await repo.uncomplete(done.id);
    const section = (await repo.listBoard()).filter((n) => n.section === done.section);
    assert.equal(section[section.length - 1].id, done.id);
    assert.equal((await repo.listDone()).length, 0);
  });

  await test('Done is bounded by its window', async () => {
    const note = (await repo.listBoard())[0];
    await repo.complete(note.id);
    assert.equal((await repo.listDone(30)).length, 1, 'just cleared, so in the last month');

    // Backdated by hand rather than asked for with a window of zero days.
    // "Cleared less than nothing ago" is a race against the clock between
    // the write and the read, not a boundary worth asserting.
    const d = await driver(file);
    await d.runAsync('UPDATE notes SET completed_at = ? WHERE id = ?', [
      Date.now() - 31 * 86_400_000,
      note.id,
    ]);
    assert.equal((await repo.listDone(30)).length, 0, 'past the window, so out of Done');
    assert.equal((await repo.listDone(60)).length, 1, 'and back inside a wider one');
  });

  await test('delete is permanent', async () => {
    const note = (await repo.listBoard())[0];
    await repo.remove(note.id);
    await relaunch();
    assert.ok(!(await repo.listBoard()).some((n) => n.id === note.id));
  });

  await test('50 reorders into the same gap stay correctly ordered', async () => {
    // Fractional positions run out of room eventually; the repository is
    // supposed to renumber rather than lose the order.
    const target = (await repo.listBoard()).filter((n) => n.section === 'next');
    assert.ok(target.length >= 2, 'need something to insert between');
    for (let i = 0; i < 50; i++) {
      const next = (await repo.listBoard()).filter((n) => n.section === 'next');
      await repo.place(next[next.length - 1].id, 'next', 1);
    }
    await relaunch();
    const after = (await repo.listBoard()).filter((n) => n.section === 'next');
    const positions = after.map((n) => n.position);
    assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
    assert.equal(new Set(positions).size, positions.length, 'positions must stay distinct');
  });

  await test('swapping into a full Now by completing the outgoing note', async () => {
    await repo.__resetAll();
    for (let i = 0; i < 7; i++) await repo.create(`Now ${i}`, 'now');
    const out = (await repo.listBoard())[0];
    const made = await repo.createInNowBySwapping('The new one', out.id, 'complete');
    await relaunch();
    assert.equal(await repo.countIn('now'), 7, 'Now stays at its limit');
    assert.ok((await repo.listDone()).some((n) => n.id === out.id));
    assert.ok((await repo.listBoard()).some((n) => n.id === made.id));
  });

  await test('swapping by moving the outgoing note to Next', async () => {
    const out = (await repo.listBoard()).filter((n) => n.section === 'now')[0];
    await repo.createInNowBySwapping('Another new one', out.id, 'move');
    await relaunch();
    assert.equal(await repo.countIn('now'), 7);
    const next = (await repo.listBoard()).filter((n) => n.section === 'next');
    assert.equal(next[next.length - 1].id, out.id, 'the outgoing note lands at the end of Next');
  });

  await test('swapping by deleting the outgoing note', async () => {
    const out = (await repo.listBoard()).filter((n) => n.section === 'now')[0];
    await repo.createInNowBySwapping('A third new one', out.id, 'delete');
    await relaunch();
    assert.equal(await repo.countIn('now'), 7);
    assert.ok(!(await repo.listBoard()).some((n) => n.id === out.id));
    assert.ok(!(await repo.listDone()).some((n) => n.id === out.id));
  });

  await test('a failed swap leaves Now exactly as it was', async () => {
    const before = (await repo.listBoard()).filter((n) => n.section === 'now').map((n) => n.id);
    await assert.rejects(
      // A text of the wrong type makes the INSERT fail after the outgoing note
      // has already been moved — exactly the half-done case the transaction exists for.
      repo.createInNowBySwapping({} as unknown as string, before[0], 'move')
    );
    await relaunch();
    const after = (await repo.listBoard()).filter((n) => n.section === 'now').map((n) => n.id);
    assert.deepEqual(after, before, 'nothing moved, nothing lost');
  });

  await test('reminders belong to Now and nowhere else', async () => {
    await repo.__resetAll();
    const inNow = await repo.create('Submit the form', 'now');
    const inNext = await repo.create('Tidy the room', 'next');
    const when = Date.now() + 3_600_000;

    await repo.setReminder(inNow.id, when);
    await repo.setReminder(inNext.id, when);
    await relaunch();

    const board = await repo.listBoard();
    assert.equal(board.find((n) => n.id === inNow.id)?.remindAt, when);
    assert.equal(board.find((n) => n.id === inNext.id)?.remindAt, null, 'Next cannot be reminded');
  });

  await test('a note leaving Now gives up its reminder', async () => {
    const note = (await repo.listBoard()).find((n) => n.remindAt !== null)!;
    await repo.moveToEnd(note.id, 'someday');
    await relaunch();
    assert.equal((await repo.listBoard()).find((n) => n.id === note.id)?.remindAt, null);
  });

  await test('finishing a note cancels its reminder', async () => {
    const note = await repo.create('Pick up the parcel', 'now');
    await repo.setReminder(note.id, Date.now() + 3_600_000);
    await repo.complete(note.id);
    await relaunch();
    assert.equal((await repo.listDone()).find((n) => n.id === note.id)?.remindAt, null);
  });

  await test('exporting includes finished notes, not just the board', async () => {
    await repo.__resetAll();
    const a = await repo.create('On the board', 'now');
    const b = await repo.create('Already done', 'now');
    await repo.complete(b.id);
    const all = await repo.exportAll();
    assert.equal(all.length, 2);
    assert.ok(all.some((n) => n.id === a.id));
    assert.ok(all.some((n) => n.id === b.id && n.completedAt !== null));
  });

  await test('importing adds what is missing and leaves the rest untouched', async () => {
    const before = await repo.exportAll();
    const mine = before[0];
    const incoming = [
      { ...mine, text: 'AN OLDER WORDING FROM THE FILE' },
      { ...mine, id: 'from-backup', text: 'Only in the backup', section: 'next' as const },
    ];
    const added = await repo.importNotes(incoming);
    await relaunch();

    assert.equal(added, 1, 'only the one that was missing');
    const after = await repo.exportAll();
    assert.equal(after.find((n) => n.id === mine.id)?.text, mine.text, 'mine was not overwritten');
    assert.ok(after.some((n) => n.id === 'from-backup'));
  });

  await test('importing the same backup twice changes nothing the second time', async () => {
    const all = await repo.exportAll();
    assert.equal(await repo.importNotes(all), 0);
    assert.equal((await repo.exportAll()).length, all.length);
  });

  await test('a restored note comes back without a live reminder behind it', async () => {
    await repo.__resetAll();
    const added = await repo.importNotes([
      {
        id: 'r1',
        text: 'Had a reminder on the old phone',
        section: 'now',
        position: 1024,
        tint: 0,
        createdAt: 1,
        updatedAt: 1,
        completedAt: null,
        remindAt: Date.now() + 1000,
        priority: 2,
      },
    ]);
    assert.equal(added, 1);
    assert.equal((await repo.listBoard())[0].remindAt, null);
  });

  console.log(`\n${passed} repository tests passed (real SQLite, reopened from disk)`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
