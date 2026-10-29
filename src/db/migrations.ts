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
      await db.execAsync(CREATE_SQL);
    }
    // Future versions go here as `if (from < 2) { ... }`, each one additive.
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  });
}
