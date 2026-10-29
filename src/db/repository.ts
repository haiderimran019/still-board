import { DONE_WINDOW_DAYS } from '../config';
import type { Db, Opener } from './driver';
import { expoOpener } from './driver';
import { migrate } from './migrations';
import { between, needsRenumber, renumber, STEP } from './positions';
import type { Note, NoteRow, Section } from './schema';
import { SECTIONS, toNote } from './schema';

/**
 * The only file that knows SQLite exists. Everything above it deals in Notes.
 * Swapping the store — for a synced backend, say — means rewriting this file
 * and nothing else.
 */

const DB_NAME = 'still.db';
let dbp: Promise<Db> | null = null;
let open: Opener = expoOpener;

/**
 * Test seam: point the repository at a different SQLite driver. Nothing in the
 * app calls this — on a phone the default expo-sqlite driver is used.
 */
export function __useDriver(opener: Opener): void {
  open = opener;
  dbp = null;
}

function db(): Promise<Db> {
  if (!dbp) {
    dbp = (async () => {
      const d = await open(DB_NAME);
      await d.execAsync('PRAGMA journal_mode = WAL');
      await migrate(d);
      return d;
    })();
  }
  return dbp;
}

const now = () => Date.now();
const id = () => Math.random().toString(36).slice(2, 10) + now().toString(36);

/** Opens the database and runs migrations. Safe to call more than once. */
export async function init(): Promise<void> {
  await db();
}

// ---------- reads ----------

/** Everything still on the board, in section then position order. */
export async function listBoard(): Promise<Note[]> {
  const d = await db();
  const rows = await d.getAllAsync<NoteRow>(
    `SELECT * FROM notes
     WHERE completed_at IS NULL
     ORDER BY CASE section WHEN 'now' THEN 0 WHEN 'next' THEN 1 ELSE 2 END, position`
  );
  return rows.map(toNote);
}

/** Cleared notes, newest first, bounded so Done can't become a second backlog. */
export async function listDone(days: number = DONE_WINDOW_DAYS): Promise<Note[]> {
  const d = await db();
  const since = now() - days * 86_400_000;
  const rows = await d.getAllAsync<NoteRow>(
    `SELECT * FROM notes
     WHERE completed_at IS NOT NULL AND completed_at >= ?
     ORDER BY completed_at DESC`,
    [since]
  );
  return rows.map(toNote);
}

export async function countIn(section: Section): Promise<number> {
  const d = await db();
  const r = await d.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM notes WHERE section = ? AND completed_at IS NULL',
    [section]
  );
  return r?.n ?? 0;
}

// ---------- writes ----------

/**
 * Appends to the end of a section. The limit on Now is a product rule, not a
 * storage one, so it is enforced above this layer — see the store.
 */
export async function create(text: string, section: Section): Promise<Note> {
  const d = await db();
  const last = await d.getFirstAsync<{ p: number | null }>(
    'SELECT MAX(position) AS p FROM notes WHERE section = ? AND completed_at IS NULL',
    [section]
  );
  const t = now();
  const note: Note = {
    id: id(),
    text: text.trim(),
    section,
    position: (last?.p ?? 0) + STEP,
    tint: Math.floor(Math.random() * 4),
    createdAt: t,
    updatedAt: t,
    completedAt: null,
  };
  await d.runAsync(
    `INSERT INTO notes (id, text, section, position, tint, created_at, updated_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
    [note.id, note.text, note.section, note.position, note.tint, note.createdAt, note.updatedAt]
  );
  return note;
}

export async function edit(noteId: string, text: string): Promise<void> {
  const d = await db();
  await d.runAsync('UPDATE notes SET text = ?, updated_at = ? WHERE id = ?', [
    text.trim(),
    now(),
    noteId,
  ]);
}

/**
 * Puts a note at `index` within `section`, counting only notes still on the
 * board and excluding the note being moved.
 */
export async function place(noteId: string, section: Section, index: number): Promise<void> {
  const d = await db();
  const siblings = await d.getAllAsync<{ id: string; position: number }>(
    `SELECT id, position FROM notes
     WHERE section = ? AND completed_at IS NULL AND id != ?
     ORDER BY position`,
    [section, noteId]
  );

  const i = Math.max(0, Math.min(index, siblings.length));
  const before = i > 0 ? siblings[i - 1].position : null;
  const after = i < siblings.length ? siblings[i].position : null;

  if (needsRenumber(before, after)) {
    // The gap has been halved until floats stopped moving. Spread the section
    // out again, then place into the fresh gaps.
    const spread = renumber(siblings.length);
    await d.withTransactionAsync(async () => {
      for (let k = 0; k < siblings.length; k++) {
        await d.runAsync('UPDATE notes SET position = ? WHERE id = ?', [spread[k], siblings[k].id]);
      }
    });
    const b = i > 0 ? spread[i - 1] : null;
    const a = i < spread.length ? spread[i] : null;
    await d.runAsync('UPDATE notes SET section = ?, position = ?, updated_at = ? WHERE id = ?', [
      section,
      between(b, a),
      now(),
      noteId,
    ]);
    return;
  }

  await d.runAsync('UPDATE notes SET section = ?, position = ?, updated_at = ? WHERE id = ?', [
    section,
    between(before, after),
    now(),
    noteId,
  ]);
}

/** Appends to the end of a section — what the "move to" menu does. */
export async function moveToEnd(noteId: string, section: Section): Promise<void> {
  const n = await countIn(section);
  await place(noteId, section, n);
}

export async function complete(noteId: string): Promise<void> {
  const d = await db();
  const t = now();
  await d.runAsync('UPDATE notes SET completed_at = ?, updated_at = ? WHERE id = ?', [t, t, noteId]);
}

/** Undo for a completed note: back to the board, at the end of its section. */
export async function uncomplete(noteId: string): Promise<void> {
  const d = await db();
  await d.runAsync('UPDATE notes SET completed_at = NULL, updated_at = ? WHERE id = ?', [
    now(),
    noteId,
  ]);
  const r = await d.getFirstAsync<{ section: Section }>('SELECT section FROM notes WHERE id = ?', [
    noteId,
  ]);
  if (r) await moveToEnd(noteId, r.section);
}

export async function remove(noteId: string): Promise<void> {
  const d = await db();
  await d.runAsync('DELETE FROM notes WHERE id = ?', [noteId]);
}

// ---------- first run ----------

const SEED: Array<[string, Section]> = [
  ['Finish data structures assignment', 'now'],
  ['Reply to Ayesha about the group project', 'now'],
  ['Pay hostel fee', 'now'],
  ['Update portfolio', 'next'],
  ['Book dentist appointment', 'next'],
  ['Learn photography', 'someday'],
  ['Read the Kahneman book properly', 'someday'],
];

/**
 * An empty board teaches nobody what the three sections are for, so a first run
 * arrives with a few examples. Returns true if it actually seeded.
 */
export async function seedIfEmpty(): Promise<boolean> {
  const d = await db();
  const r = await d.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM notes');
  if ((r?.n ?? 0) > 0) return false;
  for (const [text, section] of SEED) await create(text, section);
  return true;
}

/** Development only — wipes the board. Nothing in the UI calls this. */
export async function __resetAll(): Promise<void> {
  const d = await db();
  await d.runAsync('DELETE FROM notes');
}

export { SECTIONS };
export type { Note, Section };
