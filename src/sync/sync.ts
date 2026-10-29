import { parseBackup, toBackup } from '../backup/format';
import type { DriveResult } from '../backup/drive';
import type { Note } from '../db/schema';

/**
 * Putting the board on one phone onto another, through your own Drive.
 *
 * The rule is the same one the file restore follows, and it is the whole
 * reason this is safe to run without asking: **sync only ever adds.** A note
 * this phone has never seen comes down; a note the other phone has never seen
 * goes up; nothing is overwritten and nothing is deleted. That means a
 * deletion does not travel, and an edit made in two places keeps the older
 * text — both of which are real limitations, and both of which are better
 * than the alternative, which is a background job quietly replacing a board
 * someone spent a week building.
 *
 * Everything it touches is injected, so the order of operations — the part
 * that can lose work — is tested against fakes rather than against Drive.
 */
export type SyncDeps = {
  download: () => Promise<DriveResult<string | null>>;
  upload: (json: string) => Promise<DriveResult<'saved'>>;
  exportAll: () => Promise<Note[]>;
  importNotes: (notes: readonly Note[]) => Promise<number>;
  now: () => number;
};

export type SyncOutcome =
  | { ok: true; pulled: number; total: number; at: number }
  | { ok: false; reason: string };

export async function syncBoard(d: SyncDeps): Promise<SyncOutcome> {
  const got = await d.download();
  if (!got.ok) return { ok: false, reason: got.reason };

  let pulled = 0;
  if (got.value !== null) {
    const parsed = parseBackup(got.value);
    // A backup we cannot read is not an empty backup. Uploading over it would
    // replace a board we failed to understand with one that doesn't have it —
    // so this stops, loudly, and leaves the file alone.
    if (!parsed.ok) return { ok: false, reason: `The copy in Drive can't be read: ${parsed.reason}` };
    pulled = await d.importNotes(parsed.notes);
  }

  // Exported after the merge, so what goes up is both boards, not just this
  // one. Without that, signing in on a second phone would push its own board
  // over the first one's a moment after pulling it down.
  const mine = await d.exportAll();
  const at = d.now();
  const put = await d.upload(JSON.stringify(toBackup(mine, at), null, 2));
  if (!put.ok) return { ok: false, reason: put.reason };

  return { ok: true, pulled, total: mine.length, at };
}

/** What the board says out loud when a sync finishes. */
export function syncSaid(o: SyncOutcome): string {
  if (!o.ok) return o.reason;
  if (o.pulled === 0) return 'Your board is on your account.';
  return o.pulled === 1 ? '1 note came over.' : `${o.pulled} notes came over.`;
}
