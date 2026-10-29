import { DatabaseSync } from 'node:sqlite';
import type { Db, Opener } from '../driver.ts';

/**
 * Test-only driver. It wraps Node's built-in SQLite in the same shape
 * expo-sqlite presents, so the repository runs its real SQL against a real
 * engine — on a real file, which is what makes "the notes are still there
 * after a restart" something we can actually check.
 */
function wrap(raw: DatabaseSync): Db {
  return {
    async execAsync(sql) {
      raw.exec(sql);
    },
    async runAsync(sql, params = []) {
      return raw.prepare(sql).run(...(params as never[]));
    },
    async getAllAsync<T>(sql: string, params: unknown[] = []) {
      return raw.prepare(sql).all(...(params as never[])) as T[];
    },
    async getFirstAsync<T>(sql: string, params: unknown[] = []) {
      return (raw.prepare(sql).get(...(params as never[])) as T) ?? null;
    },
    async withTransactionAsync(fn) {
      raw.exec('BEGIN');
      try {
        await fn();
        raw.exec('COMMIT');
      } catch (e) {
        raw.exec('ROLLBACK');
        throw e;
      }
    },
  };
}

/** Every open of `path` behaves like a fresh app launch against the same file. */
export function fileDriver(path: string): Opener {
  return async () => wrap(new DatabaseSync(path));
}
