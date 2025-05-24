/* pglite-options.d.ts */

/** Log-level for debug output (0 = silent, 5 = most verbose). */
export type DebugLevel = 0 | 1 | 2 | 3 | 4 | 5;

/** Function that converts a textual Postgres value to a JS value. */
export type Parser = (value: string, typeId?: number) => unknown;
/** Function that converts a JS value to its Postgres text form. */
export type Serializer = (value: unknown) => string;

/** Per-OID parser override map. */
export interface ParserOptions {
  [pgType: number]: Parser;
}
/** Per-OID serializer override map. */
export interface SerializerOptions {
  [pgType: number]: Serializer;
}

/** Arbitrary extension registry keyed by namespace. */
export type Extensions = Record<string, unknown>;

/** Virtual-filesystem interface (sans `init`). */
export interface Filesystem {
  syncToFs(relaxedDurability?: boolean): Promise<void>;
  initialSyncFs(): Promise<void>;
  dumpTar(
    dbname: string,
    compression?: 'none' | 'gzip' | 'auto'
  ): Promise<File | Blob>;
  closeFs(): Promise<void>;
}

/** Construction options for a `PGlite` instance. */
export interface PGliteOptions<
  TExtensions extends Extensions = Extensions
> {
  /** Directory for database files (e.g. `"idb://mydb"`, `"memory://"`). */
  dataDir?: string;
  /** PostgreSQL user name (defaults to `"postgres"`). */
  username?: string;
  /** Default database name (defaults to `"postgres"`). */
  database?: string;
  /** Custom virtual filesystem implementation. */
  fs?: Filesystem;
  /** Debug verbosity; `0` disables all logging. */
  debug?: DebugLevel;
  /** If `true`, disables `fsync` for faster but less-durable writes. */
  relaxedDurability?: boolean;
  /** Map of extension namespaces → implementations or URLs. */
  extensions?: TExtensions;
  /** Pre-seed the cluster with an existing data directory. */
  loadDataDir?: Blob | File;
  /** Initial WebAssembly memory size in bytes. */
  initialMemory?: number;
  /** Pre-compiled WASM module to reuse instead of fetching the default. */
  wasmModule?: WebAssembly.Module;
  /** Pre-bundled filesystem layer to mount at startup. */
  fsBundle?: Blob | File;
  /** Override parsers per type-OID. */
  parsers?: ParserOptions;
  /** Override serializers per type-OID. */
  serializers?: SerializerOptions;
}
