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
    } else if (from < 2) {
      // v2 adds reminders. ALTER TABLE ... ADD COLUMN keeps every existing
      // row and backfills NULL, so nobody's board is touched.
      await db.execAsync('ALTER TABLE notes ADD COLUMN remind_at INTEGER');
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS notes_due ON notes (remind_at) WHERE remind_at IS NOT NULL'
      );
    }
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  });
}
