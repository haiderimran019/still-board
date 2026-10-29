import type { Db } from './driver';
import { CREATE_SQL, SCHEMA_VERSION } from './schema';

/**
 * Versioned with SQLite's own `user_version`, so upgrading a phone that already
 * has notes on it is a matter of adding a case below — never dropping the table.
 */
export async function migrate(db: Db): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const from = row?.user_version ?? 0;
  if (from >= SCHEMA_VERSION) return;

  await db.withTransactionAsync(async () => {
    if (from < 1) {
      // A fresh install gets the current shape in one go — CREATE_SQL always
      // describes the latest schema, so the steps below are skipped.
      await db.execAsync(CREATE_SQL);
    } else {
      // Each step is additive and runs in order, so a phone two versions
      // behind catches up in one go without the table ever being dropped.
      if (from < 2) {
        // v2 adds reminders.
        await db.execAsync('ALTER TABLE notes ADD COLUMN remind_at INTEGER');
        await db.execAsync(
          'CREATE INDEX IF NOT EXISTS notes_due ON notes (remind_at) WHERE remind_at IS NOT NULL'
        );
      }
      if (from < 3) {
        // v3 adds urgency. Existing notes get 0 — no priority — which is
        // the truth about them rather than a guess.
        await db.execAsync('ALTER TABLE notes ADD COLUMN priority INTEGER NOT NULL DEFAULT 0');
      }
      if (from < 4) {
        // v4 adds the "Next week" section. The list of allowed sections is a
        // CHECK constraint, and SQLite cannot alter one, so the table is
        // rebuilt around it — copy, swap, drop. The old indexes follow the
        // old table through the rename, so they are dropped by name first or
        // creating the new ones collides with them.
        await db.execAsync(`
          DROP INDEX IF EXISTS notes_board;
          DROP INDEX IF EXISTS notes_due;
          DROP INDEX IF EXISTS notes_done;
          ALTER TABLE notes RENAME TO notes_v3;
        `);
        await db.execAsync(CREATE_SQL);
        await db.execAsync(`
          INSERT INTO notes
            (id, text, section, position, tint, created_at, updated_at, completed_at, remind_at, priority)
          SELECT
            id, text, section, position, tint, created_at, updated_at, completed_at, remind_at, priority
          FROM notes_v3;
          DROP TABLE notes_v3;
        `);
      }
    }
    // CREATE_SQL carries it for a fresh install and for the v4 rebuild, but
    // a phone that arrives here by any other route still needs it, and
    // IF NOT EXISTS makes saying so twice harmless.
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS prefs (
        key   TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  });
}
