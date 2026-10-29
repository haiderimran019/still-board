/**
 * The slice of a SQLite connection this app actually uses.
 *
 * `expo-sqlite` satisfies this on a phone. Declaring it ourselves means the
 * repository can also be pointed at a plain SQLite engine in a test, so the
 * SQL gets exercised for real rather than mocked away.
 */
export type Db = {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: unknown[]): Promise<unknown>;
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
};

/** Opens (or creates) the named database file. */
export type Opener = (name: string) => Promise<Db>;

/**
 * Loaded lazily so that a test which supplies its own driver never pulls in
 * expo-sqlite — it needs a React Native runtime and would not load in Node.
 */
export const expoOpener: Opener = async (name) => {
  const SQLite = await import('expo-sqlite');
  return (await SQLite.openDatabaseAsync(name)) as unknown as Db;
};
