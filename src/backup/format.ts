import { APP_NAME } from '../config';
import { SECTIONS, type Note, type Section } from '../db/schema';

/**
 * A board, as a file.
 *
 * This is the format a backup is written in and read back from, and it is
 * kept apart from both the database and the network so it can be tested
 * exhaustively. Restoring is the single most dangerous thing this app does —
 * a parser that accepts a malformed file and hands back half a board would
 * quietly destroy someone's notes — so the rule here is that the whole file
 * is either valid or rejected, and the reason is always reported.
 */

export const BACKUP_VERSION = 1;

export type BackupFile = {
  app: string;
  version: number;
  exportedAt: number;
  notes: Note[];
};

export type ParseResult =
  | { ok: true; notes: Note[]; exportedAt: number }
  | { ok: false; reason: string };

export function toBackup(notes: readonly Note[], at: number): BackupFile {
  return { app: APP_NAME, version: BACKUP_VERSION, exportedAt: at, notes: [...notes] };
}

export function backupFilename(at: number): string {
  const d = new Date(at);
  const p = (n: number) => String(n).padStart(2, '0');
  return `board-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

function isSection(v: unknown): v is Section {
  return typeof v === 'string' && (SECTIONS as readonly string[]).includes(v);
}

function num(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function nullableNum(v: unknown): v is number | null {
  return v === null || v === undefined || num(v);
}

/** One note, checked field by field. Returns null if it cannot be trusted. */
function readNote(raw: unknown): Note | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;

  if (typeof r.id !== 'string' || r.id.length === 0) return null;
  if (typeof r.text !== 'string') return null;
  if (!isSection(r.section)) return null;
  if (!num(r.position)) return null;
  if (!num(r.createdAt) || !num(r.updatedAt)) return null;
  if (!nullableNum(r.completedAt) || !nullableNum(r.remindAt)) return null;

  return {
    id: r.id,
    text: r.text,
    section: r.section,
    position: r.position,
    // Older files predate tints, and a missing tint is not a reason to
    // refuse someone their notes back.
    tint: num(r.tint) ? r.tint : 0,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    completedAt: num(r.completedAt) ? r.completedAt : null,
    remindAt: num(r.remindAt) ? r.remindAt : null,
  };
}

export function parseBackup(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, reason: "That file isn't readable as a backup." };
  }

  if (typeof data !== 'object' || data === null) {
    return { ok: false, reason: "That file isn't a board backup." };
  }
  const f = data as Record<string, unknown>;

  if (!num(f.version)) return { ok: false, reason: "That file isn't a board backup." };
  if (f.version > BACKUP_VERSION) {
    return {
      ok: false,
      reason: 'That backup was made by a newer version of the app. Update first.',
    };
  }
  if (!Array.isArray(f.notes)) return { ok: false, reason: 'That backup has no notes in it.' };

  const notes: Note[] = [];
  const seen = new Set<string>();
  for (const raw of f.notes) {
    const note = readNote(raw);
    // One bad note means the file cannot be trusted as a whole.
    if (!note) return { ok: false, reason: 'That backup is damaged, so nothing was changed.' };
    if (seen.has(note.id)) {
      return { ok: false, reason: 'That backup lists the same note twice, so it was not used.' };
    }
    seen.add(note.id);
    notes.push(note);
  }

  return { ok: true, notes, exportedAt: num(f.exportedAt) ? f.exportedAt : 0 };
}

/**
 * What restoring would actually do. Notes already on the board are left
 * exactly as they are — a restore adds, it never overwrites or removes, so
 * running it twice is harmless and running it on the wrong phone is not a
 * catastrophe.
 */
export function newNotesOnly(incoming: readonly Note[], existing: readonly Note[]): Note[] {
  const have = new Set(existing.map((n) => n.id));
  return incoming.filter((n) => !have.has(n.id));
}
