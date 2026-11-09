/** Subset of @capacitor-community/sqlite used by the native adapter. */
export interface NativeSQLitePlugin {
  createConnection(options: { database: string; version: number; encrypted: boolean; mode: string; readonly: boolean }): Promise<void>;
  closeConnection(options: { database: string; readonly: boolean }): Promise<void>;
  open(options: { database: string; readonly: boolean }): Promise<void>;
  close(options: { database: string; readonly: boolean }): Promise<void>;
  getUrl(options: { database: string; readonly: boolean }): Promise<{ url?: string }>;
  deleteDatabase(options: { database: string; readonly: boolean }): Promise<void>;
  query(options: { database: string; statement: string; values: any[]; readonly: boolean }): Promise<{ values?: any[] }>;
  run(options: { database: string; statement: string; values: any[]; transaction: boolean; readonly: boolean; returnMode?: 'all' | 'no' }): Promise<{ changes?: { changes?: number; lastId?: number; values?: any[] } }>;
  execute(options: { database: string; statements: string; transaction: boolean; readonly: boolean }): Promise<{ changes?: { changes?: number; lastId?: number } }>;
}
