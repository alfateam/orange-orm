declare const Modes: {
    readonly text: 0;
    readonly binary: 1;
};
type Mode = (typeof Modes)[keyof typeof Modes];
type BufferParameter = ArrayBuffer | ArrayBufferView;

type MessageName = 'parseComplete' | 'bindComplete' | 'closeComplete' | 'noData' | 'portalSuspended' | 'replicationStart' | 'emptyQuery' | 'copyDone' | 'copyData' | 'rowDescription' | 'parameterDescription' | 'parameterStatus' | 'backendKeyData' | 'notification' | 'readyForQuery' | 'commandComplete' | 'dataRow' | 'copyInResponse' | 'copyOutResponse' | 'authenticationOk' | 'authenticationMD5Password' | 'authenticationCleartextPassword' | 'authenticationSASL' | 'authenticationSASLContinue' | 'authenticationSASLFinal' | 'error' | 'notice';
type BackendMessage = {
    name: MessageName;
    length: number;
};
declare const parseComplete: BackendMessage;
declare const bindComplete: BackendMessage;
declare const closeComplete: BackendMessage;
declare const noData: BackendMessage;
declare const portalSuspended: BackendMessage;
declare const replicationStart: BackendMessage;
declare const emptyQuery: BackendMessage;
declare const copyDone: BackendMessage;
declare class AuthenticationOk implements BackendMessage {
    readonly length: number;
    readonly name = "authenticationOk";
    constructor(length: number);
}
declare class AuthenticationCleartextPassword implements BackendMessage {
    readonly length: number;
    readonly name = "authenticationCleartextPassword";
    constructor(length: number);
}
declare class AuthenticationMD5Password implements BackendMessage {
    readonly length: number;
    readonly salt: Uint8Array;
    readonly name = "authenticationMD5Password";
    constructor(length: number, salt: Uint8Array);
}
declare class AuthenticationSASL implements BackendMessage {
    readonly length: number;
    readonly mechanisms: string[];
    readonly name = "authenticationSASL";
    constructor(length: number, mechanisms: string[]);
}
declare class AuthenticationSASLContinue implements BackendMessage {
    readonly length: number;
    readonly data: string;
    readonly name = "authenticationSASLContinue";
    constructor(length: number, data: string);
}
declare class AuthenticationSASLFinal implements BackendMessage {
    readonly length: number;
    readonly data: string;
    readonly name = "authenticationSASLFinal";
    constructor(length: number, data: string);
}
type AuthenticationMessage = AuthenticationOk | AuthenticationCleartextPassword | AuthenticationMD5Password | AuthenticationSASL | AuthenticationSASLContinue | AuthenticationSASLFinal;
interface NoticeOrError {
    message: string | undefined;
    severity: string | undefined;
    code: string | undefined;
    detail: string | undefined;
    hint: string | undefined;
    position: string | undefined;
    internalPosition: string | undefined;
    internalQuery: string | undefined;
    where: string | undefined;
    schema: string | undefined;
    table: string | undefined;
    column: string | undefined;
    dataType: string | undefined;
    constraint: string | undefined;
    file: string | undefined;
    line: string | undefined;
    routine: string | undefined;
}
declare class DatabaseError extends Error implements NoticeOrError {
    readonly length: number;
    readonly name: MessageName;
    severity: string | undefined;
    code: string | undefined;
    detail: string | undefined;
    hint: string | undefined;
    position: string | undefined;
    internalPosition: string | undefined;
    internalQuery: string | undefined;
    where: string | undefined;
    schema: string | undefined;
    table: string | undefined;
    column: string | undefined;
    dataType: string | undefined;
    constraint: string | undefined;
    file: string | undefined;
    line: string | undefined;
    routine: string | undefined;
    constructor(message: string, length: number, name: MessageName);
}
declare class CopyDataMessage implements BackendMessage {
    readonly length: number;
    readonly chunk: Uint8Array;
    readonly name = "copyData";
    constructor(length: number, chunk: Uint8Array);
}
declare class CopyResponse implements BackendMessage {
    readonly length: number;
    readonly name: MessageName;
    readonly binary: boolean;
    readonly columnTypes: number[];
    constructor(length: number, name: MessageName, binary: boolean, columnCount: number);
}
declare class Field {
    readonly name: string;
    readonly tableID: number;
    readonly columnID: number;
    readonly dataTypeID: number;
    readonly dataTypeSize: number;
    readonly dataTypeModifier: number;
    readonly format: Mode;
    constructor(name: string, tableID: number, columnID: number, dataTypeID: number, dataTypeSize: number, dataTypeModifier: number, format: Mode);
}
declare class RowDescriptionMessage implements BackendMessage {
    readonly length: number;
    readonly fieldCount: number;
    readonly name: MessageName;
    readonly fields: Field[];
    constructor(length: number, fieldCount: number);
}
declare class ParameterDescriptionMessage implements BackendMessage {
    readonly length: number;
    readonly parameterCount: number;
    readonly name: MessageName;
    readonly dataTypeIDs: number[];
    constructor(length: number, parameterCount: number);
}
declare class ParameterStatusMessage implements BackendMessage {
    readonly length: number;
    readonly parameterName: string;
    readonly parameterValue: string;
    readonly name: MessageName;
    constructor(length: number, parameterName: string, parameterValue: string);
}
declare class BackendKeyDataMessage implements BackendMessage {
    readonly length: number;
    readonly processID: number;
    readonly secretKey: number;
    readonly name: MessageName;
    constructor(length: number, processID: number, secretKey: number);
}
declare class NotificationResponseMessage implements BackendMessage {
    readonly length: number;
    readonly processId: number;
    readonly channel: string;
    readonly payload: string;
    readonly name: MessageName;
    constructor(length: number, processId: number, channel: string, payload: string);
}
declare class ReadyForQueryMessage implements BackendMessage {
    readonly length: number;
    readonly status: string;
    readonly name: MessageName;
    constructor(length: number, status: string);
}
declare class CommandCompleteMessage implements BackendMessage {
    readonly length: number;
    readonly text: string;
    readonly name: MessageName;
    constructor(length: number, text: string);
}
declare class DataRowMessage implements BackendMessage {
    length: number;
    fields: (string | null)[];
    readonly fieldCount: number;
    readonly name: MessageName;
    constructor(length: number, fields: (string | null)[]);
}
declare class NoticeMessage implements BackendMessage, NoticeOrError {
    readonly length: number;
    readonly message: string | undefined;
    constructor(length: number, message: string | undefined);
    readonly name = "notice";
    severity: string | undefined;
    code: string | undefined;
    detail: string | undefined;
    hint: string | undefined;
    position: string | undefined;
    internalPosition: string | undefined;
    internalQuery: string | undefined;
    where: string | undefined;
    schema: string | undefined;
    table: string | undefined;
    column: string | undefined;
    dataType: string | undefined;
    constraint: string | undefined;
    file: string | undefined;
    line: string | undefined;
    routine: string | undefined;
}

type messages_AuthenticationCleartextPassword = AuthenticationCleartextPassword;
declare const messages_AuthenticationCleartextPassword: typeof AuthenticationCleartextPassword;
type messages_AuthenticationMD5Password = AuthenticationMD5Password;
declare const messages_AuthenticationMD5Password: typeof AuthenticationMD5Password;
type messages_AuthenticationMessage = AuthenticationMessage;
type messages_AuthenticationOk = AuthenticationOk;
declare const messages_AuthenticationOk: typeof AuthenticationOk;
type messages_AuthenticationSASL = AuthenticationSASL;
declare const messages_AuthenticationSASL: typeof AuthenticationSASL;
type messages_AuthenticationSASLContinue = AuthenticationSASLContinue;
declare const messages_AuthenticationSASLContinue: typeof AuthenticationSASLContinue;
type messages_AuthenticationSASLFinal = AuthenticationSASLFinal;
declare const messages_AuthenticationSASLFinal: typeof AuthenticationSASLFinal;
type messages_BackendKeyDataMessage = BackendKeyDataMessage;
declare const messages_BackendKeyDataMessage: typeof BackendKeyDataMessage;
type messages_BackendMessage = BackendMessage;
type messages_CommandCompleteMessage = CommandCompleteMessage;
declare const messages_CommandCompleteMessage: typeof CommandCompleteMessage;
type messages_CopyDataMessage = CopyDataMessage;
declare const messages_CopyDataMessage: typeof CopyDataMessage;
type messages_CopyResponse = CopyResponse;
declare const messages_CopyResponse: typeof CopyResponse;
type messages_DataRowMessage = DataRowMessage;
declare const messages_DataRowMessage: typeof DataRowMessage;
type messages_DatabaseError = DatabaseError;
declare const messages_DatabaseError: typeof DatabaseError;
type messages_Field = Field;
declare const messages_Field: typeof Field;
type messages_MessageName = MessageName;
type messages_NoticeMessage = NoticeMessage;
declare const messages_NoticeMessage: typeof NoticeMessage;
type messages_NotificationResponseMessage = NotificationResponseMessage;
declare const messages_NotificationResponseMessage: typeof NotificationResponseMessage;
type messages_ParameterDescriptionMessage = ParameterDescriptionMessage;
declare const messages_ParameterDescriptionMessage: typeof ParameterDescriptionMessage;
type messages_ParameterStatusMessage = ParameterStatusMessage;
declare const messages_ParameterStatusMessage: typeof ParameterStatusMessage;
type messages_ReadyForQueryMessage = ReadyForQueryMessage;
declare const messages_ReadyForQueryMessage: typeof ReadyForQueryMessage;
type messages_RowDescriptionMessage = RowDescriptionMessage;
declare const messages_RowDescriptionMessage: typeof RowDescriptionMessage;
declare const messages_bindComplete: typeof bindComplete;
declare const messages_closeComplete: typeof closeComplete;
declare const messages_copyDone: typeof copyDone;
declare const messages_emptyQuery: typeof emptyQuery;
declare const messages_noData: typeof noData;
declare const messages_parseComplete: typeof parseComplete;
declare const messages_portalSuspended: typeof portalSuspended;
declare const messages_replicationStart: typeof replicationStart;
declare namespace messages {
  export { messages_AuthenticationCleartextPassword as AuthenticationCleartextPassword, messages_AuthenticationMD5Password as AuthenticationMD5Password, type messages_AuthenticationMessage as AuthenticationMessage, messages_AuthenticationOk as AuthenticationOk, messages_AuthenticationSASL as AuthenticationSASL, messages_AuthenticationSASLContinue as AuthenticationSASLContinue, messages_AuthenticationSASLFinal as AuthenticationSASLFinal, messages_BackendKeyDataMessage as BackendKeyDataMessage, type messages_BackendMessage as BackendMessage, messages_CommandCompleteMessage as CommandCompleteMessage, messages_CopyDataMessage as CopyDataMessage, messages_CopyResponse as CopyResponse, messages_DataRowMessage as DataRowMessage, messages_DatabaseError as DatabaseError, messages_Field as Field, type messages_MessageName as MessageName, messages_NoticeMessage as NoticeMessage, messages_NotificationResponseMessage as NotificationResponseMessage, messages_ParameterDescriptionMessage as ParameterDescriptionMessage, messages_ParameterStatusMessage as ParameterStatusMessage, messages_ReadyForQueryMessage as ReadyForQueryMessage, messages_RowDescriptionMessage as RowDescriptionMessage, messages_bindComplete as bindComplete, messages_closeComplete as closeComplete, messages_copyDone as copyDone, messages_emptyQuery as emptyQuery, messages_noData as noData, messages_parseComplete as parseComplete, messages_portalSuspended as portalSuspended, messages_replicationStart as replicationStart };
}

type IDBFS = Emscripten.FileSystemType & {
    quit: () => void;
    dbs: Record<string, IDBDatabase>;
};
type FS = typeof FS & {
    filesystems: {
        MEMFS: Emscripten.FileSystemType;
        NODEFS: Emscripten.FileSystemType;
        IDBFS: IDBFS;
    };
    quit: () => void;
};
interface PostgresMod extends Omit<EmscriptenModule, 'preInit' | 'preRun' | 'postRun'> {
    preInit: Array<{
        (mod: PostgresMod): void;
    }>;
    preRun: Array<{
        (mod: PostgresMod): void;
    }>;
    postRun: Array<{
        (mod: PostgresMod): void;
    }>;
    FS: FS;
    WASM_PREFIX: string;
    INITIAL_MEMORY: number;
    pg_extensions: Record<string, Promise<Blob | null>>;
    _use_wire: (state: number) => void;
    _pgl_initdb: () => number;
    _pgl_backend: () => void;
    _pgl_shutdown: () => void;
    _interactive_write: (msgLength: number) => void;
    _interactive_one: () => void;
    _interactive_read: () => number;
}
type PostgresFactory<T extends PostgresMod = PostgresMod> = (moduleOverrides?: Partial<T>) => Promise<T>;
declare const _default: PostgresFactory<PostgresMod>;

type postgresMod_FS = FS;
type postgresMod_PostgresMod = PostgresMod;
declare namespace postgresMod {
  export { type postgresMod_FS as FS, type postgresMod_PostgresMod as PostgresMod, _default as default };
}

type DumpTarCompressionOptions = 'none' | 'gzip' | 'auto';

declare const WASM_PREFIX = "/tmp/pglite";
declare const PGDATA: string;
type FsType = 'nodefs' | 'idbfs' | 'memoryfs' | 'opfs-ahp';
/**
 * Filesystem interface.
 * All virtual filesystems that are compatible with PGlite must implement
 * this interface.
 */
interface Filesystem {
    /**
     * Initiate the filesystem and return the options to pass to the emscripten module.
     */
    init(pg: PGlite, emscriptenOptions: Partial<PostgresMod>): Promise<{
        emscriptenOpts: Partial<PostgresMod>;
    }>;
    /**
     * Sync the filesystem to any underlying storage.
     */
    syncToFs(relaxedDurability?: boolean): Promise<void>;
    /**
     * Sync the filesystem from any underlying storage.
     */
    initialSyncFs(): Promise<void>;
    /**
     * Dump the PGDATA dir from the filesystem to a gziped tarball.
     */
    dumpTar(dbname: string, compression?: DumpTarCompressionOptions): Promise<File | Blob>;
    /**
     * Close the filesystem.
     */
    closeFs(): Promise<void>;
}
/**
 * Base class for all emscripten built-in filesystems.
 */
declare class EmscriptenBuiltinFilesystem implements Filesystem {
    protected dataDir?: string;
    protected pg?: PGlite;
    constructor(dataDir?: string);
    init(pg: PGlite, emscriptenOptions: Partial<PostgresMod>): Promise<{
        emscriptenOpts: Partial<PostgresMod>;
    }>;
    syncToFs(_relaxedDurability?: boolean): Promise<void>;
    initialSyncFs(): Promise<void>;
    closeFs(): Promise<void>;
    dumpTar(dbname: string, compression?: DumpTarCompressionOptions): Promise<Blob | File>;
}
/**
 * Abstract base class for all custom virtual filesystems.
 * Each custom filesystem needs to implement an interface similar to the NodeJS FS API.
 */
declare abstract class BaseFilesystem implements Filesystem {
    protected dataDir?: string;
    protected pg?: PGlite;
    readonly debug: boolean;
    constructor(dataDir?: string, { debug }?: {
        debug?: boolean;
    });
    syncToFs(_relaxedDurability?: boolean): Promise<void>;
    initialSyncFs(): Promise<void>;
    closeFs(): Promise<void>;
    dumpTar(dbname: string, compression?: DumpTarCompressionOptions): Promise<Blob | File>;
    init(pg: PGlite, emscriptenOptions: Partial<PostgresMod>): Promise<{
        emscriptenOpts: Partial<PostgresMod>;
    }>;
    abstract chmod(path: string, mode: number): void;
    abstract close(fd: number): void;
    abstract fstat(fd: number): FsStats;
    abstract lstat(path: string): FsStats;
    abstract mkdir(path: string, options?: {
        recursive?: boolean;
        mode?: number;
    }): void;
    abstract open(path: string, flags?: string, mode?: number): number;
    abstract readdir(path: string): string[];
    abstract read(fd: number, buffer: Uint8Array, // Buffer to read into
    offset: number, // Offset in buffer to start writing to
    length: number, // Number of bytes to read
    position: number): number;
    abstract rename(oldPath: string, newPath: string): void;
    abstract rmdir(path: string): void;
    abstract truncate(path: string, len: number): void;
    abstract unlink(path: string): void;
    abstract utimes(path: string, atime: number, mtime: number): void;
    abstract writeFile(path: string, data: string | Uint8Array, options?: {
        encoding?: string;
        mode?: number;
        flag?: string;
    }): void;
    abstract write(fd: number, buffer: Uint8Array, // Buffer to read from
    offset: number, // Offset in buffer to start reading from
    length: number, // Number of bytes to write
    position: number): number;
}
type FsStats = {
    dev: number;
    ino: number;
    mode: number;
    nlink: number;
    uid: number;
    gid: number;
    rdev: number;
    size: number;
    blksize: number;
    blocks: number;
    atime: number;
    mtime: number;
    ctime: number;
};
declare const ERRNO_CODES: {
    readonly EBADF: 8;
    readonly EBADFD: 127;
    readonly EEXIST: 20;
    readonly EINVAL: 28;
    readonly EISDIR: 31;
    readonly ENODEV: 43;
    readonly ENOENT: 44;
    readonly ENOTDIR: 54;
    readonly ENOTEMPTY: 55;
};

type FilesystemType = 'nodefs' | 'idbfs' | 'memoryfs';
type DebugLevel = 0 | 1 | 2 | 3 | 4 | 5;
type RowMode = 'array' | 'object';
interface ParserOptions {
    [pgType: number]: (value: string) => any;
}
interface SerializerOptions {
    [pgType: number]: (value: any) => string;
}
interface QueryOptions {
    rowMode?: RowMode;
    parsers?: ParserOptions;
    serializers?: SerializerOptions;
    blob?: Blob | File;
    onNotice?: (notice: NoticeMessage) => void;
    paramTypes?: number[];
}
interface ExecProtocolOptions {
    syncToFs?: boolean;
    throwOnError?: boolean;
    onNotice?: (notice: NoticeMessage) => void;
}
interface ExtensionSetupResult<TNamespace = any> {
    emscriptenOpts?: any;
    namespaceObj?: TNamespace;
    bundlePath?: URL;
    init?: () => Promise<void>;
    close?: () => Promise<void>;
}
type ExtensionSetup<TNamespace = any> = (pg: PGliteInterface, emscriptenOpts: any, clientOnly?: boolean) => Promise<ExtensionSetupResult<TNamespace>>;
interface Extension<TNamespace = any> {
    name: string;
    setup: ExtensionSetup<TNamespace>;
}
type ExtensionNamespace<T> = T extends Extension<infer TNamespace> ? TNamespace : any;
type Extensions = {
    [namespace: string]: Extension | URL;
};
type InitializedExtensions<TExtensions extends Extensions = Extensions> = {
    [K in keyof TExtensions]: ExtensionNamespace<TExtensions[K]>;
};
interface ExecProtocolResult {
    messages: BackendMessage[];
    data: Uint8Array;
}
interface DumpDataDirResult {
    tarball: Uint8Array;
    extension: '.tar' | '.tgz';
    filename: string;
}
export interface PGliteOptions<TExtensions extends Extensions = Extensions> {
    dataDir?: string;
    username?: string;
    database?: string;
    fs?: Filesystem;
    debug?: DebugLevel;
    relaxedDurability?: boolean;
    extensions?: TExtensions;
    loadDataDir?: Blob | File;
    initialMemory?: number;
    wasmModule?: WebAssembly.Module;
    fsBundle?: Blob | File;
    parsers?: ParserOptions;
    serializers?: SerializerOptions;
}
type PGliteInterface<T extends Extensions = Extensions> = InitializedExtensions<T> & {
    readonly waitReady: Promise<void>;
    readonly debug: DebugLevel;
    readonly ready: boolean;
    readonly closed: boolean;
    close(): Promise<void>;
    query<T>(query: string, params?: any[], options?: QueryOptions): Promise<Results<T>>;
    sql<T>(sqlStrings: TemplateStringsArray, ...params: any[]): Promise<Results<T>>;
    exec(query: string, options?: QueryOptions): Promise<Array<Results>>;
    describeQuery(query: string): Promise<DescribeQueryResult>;
    transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>;
    execProtocolRaw(message: Uint8Array, options?: ExecProtocolOptions): Promise<Uint8Array>;
    execProtocol(message: Uint8Array, options?: ExecProtocolOptions): Promise<ExecProtocolResult>;
    runExclusive<T>(fn: () => Promise<T>): Promise<T>;
    listen(channel: string, callback: (payload: string) => void): Promise<() => Promise<void>>;
    unlisten(channel: string, callback?: (payload: string) => void): Promise<void>;
    onNotification(callback: (channel: string, payload: string) => void): () => void;
    offNotification(callback: (channel: string, payload: string) => void): void;
    dumpDataDir(compression?: DumpTarCompressionOptions): Promise<File | Blob>;
    refreshArrayTypes(): Promise<void>;
};
type PGliteInterfaceExtensions<E> = E extends Extensions ? {
    [K in keyof E]: E[K] extends Extension ? Awaited<ReturnType<E[K]['setup']>>['namespaceObj'] extends infer N ? N extends undefined | null | void ? never : N : never : never;
} : Record<string, never>;
type Row<T = {
    [key: string]: any;
}> = T;
type Results<T = {
    [key: string]: any;
}> = {
    rows: Row<T>[];
    affectedRows?: number;
    fields: {
        name: string;
        dataTypeID: number;
    }[];
    blob?: Blob;
};
interface Transaction {
    query<T>(query: string, params?: any[], options?: QueryOptions): Promise<Results<T>>;
    sql<T>(sqlStrings: TemplateStringsArray, ...params: any[]): Promise<Results<T>>;
    exec(query: string, options?: QueryOptions): Promise<Array<Results>>;
    rollback(): Promise<void>;
    get closed(): boolean;
}
type DescribeQueryResult = {
    queryParams: {
        dataTypeID: number;
        serializer: Serializer;
    }[];
    resultFields: {
        name: string;
        dataTypeID: number;
        parser: Parser;
    }[];
};

declare const BOOL = 16;
declare const BYTEA = 17;
declare const CHAR = 18;
declare const INT8 = 20;
declare const INT2 = 21;
declare const INT4 = 23;
declare const REGPROC = 24;
declare const TEXT = 25;
declare const OID = 26;
declare const TID = 27;
declare const XID = 28;
declare const CID = 29;
declare const JSON = 114;
declare const XML = 142;
declare const PG_NODE_TREE = 194;
declare const SMGR = 210;
declare const PATH = 602;
declare const POLYGON = 604;
declare const CIDR = 650;
declare const FLOAT4 = 700;
declare const FLOAT8 = 701;
declare const ABSTIME = 702;
declare const RELTIME = 703;
declare const TINTERVAL = 704;
declare const CIRCLE = 718;
declare const MACADDR8 = 774;
declare const MONEY = 790;
declare const MACADDR = 829;
declare const INET = 869;
declare const ACLITEM = 1033;
declare const BPCHAR = 1042;
declare const VARCHAR = 1043;
declare const DATE = 1082;
declare const TIME = 1083;
declare const TIMESTAMP = 1114;
declare const TIMESTAMPTZ = 1184;
declare const INTERVAL = 1186;
declare const TIMETZ = 1266;
declare const BIT = 1560;
declare const VARBIT = 1562;
declare const NUMERIC = 1700;
declare const REFCURSOR = 1790;
declare const REGPROCEDURE = 2202;
declare const REGOPER = 2203;
declare const REGOPERATOR = 2204;
declare const REGCLASS = 2205;
declare const REGTYPE = 2206;
declare const UUID = 2950;
declare const TXID_SNAPSHOT = 2970;
declare const PG_LSN = 3220;
declare const PG_NDISTINCT = 3361;
declare const PG_DEPENDENCIES = 3402;
declare const TSVECTOR = 3614;
declare const TSQUERY = 3615;
declare const GTSVECTOR = 3642;
declare const REGCONFIG = 3734;
declare const REGDICTIONARY = 3769;
declare const JSONB = 3802;
declare const REGNAMESPACE = 4089;
declare const REGROLE = 4096;
declare const types: {
    string: {
        to: number;
        from: number[];
        serialize: (x: string | number) => string;
        parse: (x: string) => string;
    };
    number: {
        to: number;
        from: number[];
        serialize: (x: number) => string;
        parse: (x: string) => number;
    };
    bigint: {
        to: number;
        from: number[];
        serialize: (x: bigint) => string;
        parse: (x: string) => number | bigint;
    };
    json: {
        to: number;
        from: number[];
        serialize: (x: any) => string;
        parse: (x: string) => any;
    };
    boolean: {
        to: number;
        from: number[];
        serialize: (x: boolean) => "t" | "f";
        parse: (x: string) => x is "t";
    };
    date: {
        to: number;
        from: number[];
        serialize: (x: Date | string | number) => string;
        parse: (x: string | number) => Date;
    };
    bytea: {
        to: number;
        from: number[];
        serialize: (x: Uint8Array) => string;
        parse: (x: string) => Uint8Array;
    };
};
type Parser = (x: string, typeId?: number) => any;
type Serializer = (x: any) => string;
type TypeHandler = {
    to: number;
    from: number | number[];
    serialize: Serializer;
    parse: Parser;
};
type TypeHandlers = {
    [key: string]: TypeHandler;
};
declare const parsers: {
    [key: string]: (x: string, typeId?: number) => any;
    [key: number]: (x: string, typeId?: number) => any;
};
declare const serializers: {
    [key: string]: Serializer;
    [key: number]: Serializer;
};
declare function parseType(x: string | null, type: number, parsers?: ParserOptions): any;
declare function arraySerializer(xs: any, serializer: Serializer | undefined, typarray: number): string;
declare function arrayParser(x: string, parser: Parser, typarray: number): any;

declare const types$1_ABSTIME: typeof ABSTIME;
declare const types$1_ACLITEM: typeof ACLITEM;
declare const types$1_BIT: typeof BIT;
declare const types$1_BOOL: typeof BOOL;
declare const types$1_BPCHAR: typeof BPCHAR;
declare const types$1_BYTEA: typeof BYTEA;
declare const types$1_CHAR: typeof CHAR;
declare const types$1_CID: typeof CID;
declare const types$1_CIDR: typeof CIDR;
declare const types$1_CIRCLE: typeof CIRCLE;
declare const types$1_DATE: typeof DATE;
declare const types$1_FLOAT4: typeof FLOAT4;
declare const types$1_FLOAT8: typeof FLOAT8;
declare const types$1_GTSVECTOR: typeof GTSVECTOR;
declare const types$1_INET: typeof INET;
declare const types$1_INT2: typeof INT2;
declare const types$1_INT4: typeof INT4;
declare const types$1_INT8: typeof INT8;
declare const types$1_INTERVAL: typeof INTERVAL;
declare const types$1_JSON: typeof JSON;
declare const types$1_JSONB: typeof JSONB;
declare const types$1_MACADDR: typeof MACADDR;
declare const types$1_MACADDR8: typeof MACADDR8;
declare const types$1_MONEY: typeof MONEY;
declare const types$1_NUMERIC: typeof NUMERIC;
declare const types$1_OID: typeof OID;
declare const types$1_PATH: typeof PATH;
declare const types$1_PG_DEPENDENCIES: typeof PG_DEPENDENCIES;
declare const types$1_PG_LSN: typeof PG_LSN;
declare const types$1_PG_NDISTINCT: typeof PG_NDISTINCT;
declare const types$1_PG_NODE_TREE: typeof PG_NODE_TREE;
declare const types$1_POLYGON: typeof POLYGON;
type types$1_Parser = Parser;
declare const types$1_REFCURSOR: typeof REFCURSOR;
declare const types$1_REGCLASS: typeof REGCLASS;
declare const types$1_REGCONFIG: typeof REGCONFIG;
declare const types$1_REGDICTIONARY: typeof REGDICTIONARY;
declare const types$1_REGNAMESPACE: typeof REGNAMESPACE;
declare const types$1_REGOPER: typeof REGOPER;
declare const types$1_REGOPERATOR: typeof REGOPERATOR;
declare const types$1_REGPROC: typeof REGPROC;
declare const types$1_REGPROCEDURE: typeof REGPROCEDURE;
declare const types$1_REGROLE: typeof REGROLE;
declare const types$1_REGTYPE: typeof REGTYPE;
declare const types$1_RELTIME: typeof RELTIME;
declare const types$1_SMGR: typeof SMGR;
type types$1_Serializer = Serializer;
declare const types$1_TEXT: typeof TEXT;
declare const types$1_TID: typeof TID;
declare const types$1_TIME: typeof TIME;
declare const types$1_TIMESTAMP: typeof TIMESTAMP;
declare const types$1_TIMESTAMPTZ: typeof TIMESTAMPTZ;
declare const types$1_TIMETZ: typeof TIMETZ;
declare const types$1_TINTERVAL: typeof TINTERVAL;
declare const types$1_TSQUERY: typeof TSQUERY;
declare const types$1_TSVECTOR: typeof TSVECTOR;
declare const types$1_TXID_SNAPSHOT: typeof TXID_SNAPSHOT;
type types$1_TypeHandler = TypeHandler;
type types$1_TypeHandlers = TypeHandlers;
declare const types$1_UUID: typeof UUID;
declare const types$1_VARBIT: typeof VARBIT;
declare const types$1_VARCHAR: typeof VARCHAR;
declare const types$1_XID: typeof XID;
declare const types$1_XML: typeof XML;
declare const types$1_arrayParser: typeof arrayParser;
declare const types$1_arraySerializer: typeof arraySerializer;
declare const types$1_parseType: typeof parseType;
declare const types$1_parsers: typeof parsers;
declare const types$1_serializers: typeof serializers;
declare const types$1_types: typeof types;
declare namespace types$1 {
  export { types$1_ABSTIME as ABSTIME, types$1_ACLITEM as ACLITEM, types$1_BIT as BIT, types$1_BOOL as BOOL, types$1_BPCHAR as BPCHAR, types$1_BYTEA as BYTEA, types$1_CHAR as CHAR, types$1_CID as CID, types$1_CIDR as CIDR, types$1_CIRCLE as CIRCLE, types$1_DATE as DATE, types$1_FLOAT4 as FLOAT4, types$1_FLOAT8 as FLOAT8, types$1_GTSVECTOR as GTSVECTOR, types$1_INET as INET, types$1_INT2 as INT2, types$1_INT4 as INT4, types$1_INT8 as INT8, types$1_INTERVAL as INTERVAL, types$1_JSON as JSON, types$1_JSONB as JSONB, types$1_MACADDR as MACADDR, types$1_MACADDR8 as MACADDR8, types$1_MONEY as MONEY, types$1_NUMERIC as NUMERIC, types$1_OID as OID, types$1_PATH as PATH, types$1_PG_DEPENDENCIES as PG_DEPENDENCIES, types$1_PG_LSN as PG_LSN, types$1_PG_NDISTINCT as PG_NDISTINCT, types$1_PG_NODE_TREE as PG_NODE_TREE, types$1_POLYGON as POLYGON, type types$1_Parser as Parser, types$1_REFCURSOR as REFCURSOR, types$1_REGCLASS as REGCLASS, types$1_REGCONFIG as REGCONFIG, types$1_REGDICTIONARY as REGDICTIONARY, types$1_REGNAMESPACE as REGNAMESPACE, types$1_REGOPER as REGOPER, types$1_REGOPERATOR as REGOPERATOR, types$1_REGPROC as REGPROC, types$1_REGPROCEDURE as REGPROCEDURE, types$1_REGROLE as REGROLE, types$1_REGTYPE as REGTYPE, types$1_RELTIME as RELTIME, types$1_SMGR as SMGR, type types$1_Serializer as Serializer, types$1_TEXT as TEXT, types$1_TID as TID, types$1_TIME as TIME, types$1_TIMESTAMP as TIMESTAMP, types$1_TIMESTAMPTZ as TIMESTAMPTZ, types$1_TIMETZ as TIMETZ, types$1_TINTERVAL as TINTERVAL, types$1_TSQUERY as TSQUERY, types$1_TSVECTOR as TSVECTOR, types$1_TXID_SNAPSHOT as TXID_SNAPSHOT, type types$1_TypeHandler as TypeHandler, type types$1_TypeHandlers as TypeHandlers, types$1_UUID as UUID, types$1_VARBIT as VARBIT, types$1_VARCHAR as VARCHAR, types$1_XID as XID, types$1_XML as XML, types$1_arrayParser as arrayParser, types$1_arraySerializer as arraySerializer, types$1_parseType as parseType, types$1_parsers as parsers, types$1_serializers as serializers, types$1_types as types };
}

declare abstract class BasePGlite implements Pick<PGliteInterface, 'query' | 'sql' | 'exec' | 'transaction'> {
    #private;
    serializers: Record<number | string, Serializer>;
    parsers: Record<number | string, Parser>;
    abstract debug: DebugLevel;
    /**
     * Execute a postgres wire protocol message
     * @param message The postgres wire protocol message to execute
     * @returns The result of the query
     */
    abstract execProtocol(message: Uint8Array, { syncToFs, onNotice }: ExecProtocolOptions): Promise<ExecProtocolResult>;
    /**
     * Execute a postgres wire protocol message directly without wrapping the response.
     * Only use if `execProtocol()` doesn't suite your needs.
     *
     * **Warning:** This bypasses PGlite's protocol wrappers that manage error/notice messages,
     * transactions, and notification listeners. Only use if you need to bypass these wrappers and
     * don't intend to use the above features.
     *
     * @param message The postgres wire protocol message to execute
     * @returns The direct message data response produced by Postgres
     */
    abstract execProtocolRaw(message: Uint8Array, { syncToFs }: ExecProtocolOptions): Promise<Uint8Array>;
    /**
     * Sync the database to the filesystem
     * @returns Promise that resolves when the database is synced to the filesystem
     */
    abstract syncToFs(): Promise<void>;
    /**
     * Handle a file attached to the current query
     * @param file The file to handle
     */
    abstract _handleBlob(blob?: File | Blob): Promise<void>;
    /**
     * Get the written file
     */
    abstract _getWrittenBlob(): Promise<File | Blob | undefined>;
    /**
     * Cleanup the current file
     */
    abstract _cleanupBlob(): Promise<void>;
    abstract _checkReady(): Promise<void>;
    abstract _runExclusiveQuery<T>(fn: () => Promise<T>): Promise<T>;
    abstract _runExclusiveTransaction<T>(fn: () => Promise<T>): Promise<T>;
    /**
     * Initialize the array types
     * The oid if the type of an element and the typarray is the oid of the type of the
     * array.
     * We extract these from the databaes then create the serializers/parsers for
     * each type.
     * This should be called at the end of #init() in the implementing class.
     */
    _initArrayTypes({ force }?: {
        force?: boolean | undefined;
    }): Promise<void>;
    /**
     * Re-syncs the array types from the database
     * This is useful if you add a new type to the database and want to use it, otherwise pglite won't recognize it.
     */
    refreshArrayTypes(): Promise<void>;
    /**
     * Execute a single SQL statement
     * This uses the "Extended Query" postgres wire protocol message.
     * @param query The query to execute
     * @param params Optional parameters for the query
     * @returns The result of the query
     */
    query<T>(query: string, params?: any[], options?: QueryOptions): Promise<Results<T>>;
    /**
     * Execute a single SQL statement like with {@link PGlite.query}, but with a
     * templated statement where template values will be treated as parameters.
     *
     * You can use helpers from `/template` to further format the query with
     * identifiers, raw SQL, and nested statements.
     *
     * This uses the "Extended Query" postgres wire protocol message.
     *
     * @param query The query to execute with parameters as template values
     * @returns The result of the query
     *
     * @example
     * ```ts
     * const results = await db.sql`SELECT * FROM ${identifier`foo`} WHERE id = ${id}`
     * ```
     */
    sql<T>(sqlStrings: TemplateStringsArray, ...params: any[]): Promise<Results<T>>;
    /**
     * Execute a SQL query, this can have multiple statements.
     * This uses the "Simple Query" postgres wire protocol message.
     * @param query The query to execute
     * @returns The result of the query
     */
    exec(query: string, options?: QueryOptions): Promise<Array<Results>>;
    /**
     * Describe a query
     * @param query The query to describe
     * @returns A description of the result types for the query
     */
    describeQuery(query: string, options?: QueryOptions): Promise<DescribeQueryResult>;
    /**
     * Execute a transaction
     * @param callback A callback function that takes a transaction object
     * @returns The result of the transaction
     */
    transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>;
    /**
     * Run a function exclusively, no other transactions or queries will be allowed
     * while the function is running.
     * This is useful when working with the execProtocol methods as they are not blocked,
     * and do not block the locks used by transactions and queries.
     * @param fn The function to run
     * @returns The result of the function
     */
    runExclusive<T>(fn: () => Promise<T>): Promise<T>;
}

declare class 
PGlite extends BasePGlite implements PGliteInterface, AsyncDisposable {
    #private;
    fs?: Filesystem;
    protected mod?: PostgresMod;
    readonly dataDir?: string;
    readonly waitReady: Promise<void>;
    readonly debug: DebugLevel;
    /**
     * Create a new PGlite instance
     * @param dataDir The directory to store the database files
     *                Prefix with idb:// to use indexeddb filesystem in the browser
     *                Use memory:// to use in-memory filesystem
     * @param options PGlite options
     */
    constructor(dataDir?: string, options?: PGliteOptions);
    /**
     * Create a new PGlite instance
     * @param options PGlite options including the data directory
     */
    constructor(options?: PGliteOptions);
    /**
     * Create a new PGlite instance with extensions on the Typescript interface
     * (The main constructor does enable extensions, however due to the limitations
     * of Typescript, the extensions are not available on the instance interface)
     * @param options PGlite options including the data directory
     * @returns A promise that resolves to the PGlite instance when it's ready.
     */
    static create<O extends PGliteOptions>(options?: O): Promise<PGlite & PGliteInterfaceExtensions<O['extensions']>>;
    /**
     * Create a new PGlite instance with extensions on the Typescript interface
     * (The main constructor does enable extensions, however due to the limitations
     * of Typescript, the extensions are not available on the instance interface)
     * @param dataDir The directory to store the database files
     *                Prefix with idb:// to use indexeddb filesystem in the browser
     *                Use memory:// to use in-memory filesystem
     * @param options PGlite options
     * @returns A promise that resolves to the PGlite instance when it's ready.
     */
    static create<O extends PGliteOptions>(dataDir?: string, options?: O): Promise<PGlite & PGliteInterfaceExtensions<O['extensions']>>;
    /**
     * The Postgres Emscripten Module
     */
    get Module(): PostgresMod;
    /**
     * The ready state of the database
     */
    get ready(): boolean;
    /**
     * The closed state of the database
     */
    get closed(): boolean;
    /**
     * Close the database
     * @returns A promise that resolves when the database is closed
     */
    close(): Promise<void>;
    /**
     * Close the database when the object exits scope
     * Stage 3 ECMAScript Explicit Resource Management
     * https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html#using-declarations-and-explicit-resource-management
     */
    [Symbol.asyncDispose](): Promise<void>;
    /**
     * Handle a file attached to the current query
     * @param file The file to handle
     */
    _handleBlob(blob?: File | Blob): Promise<void>;
    /**
     * Cleanup the current file
     */
    _cleanupBlob(): Promise<void>;
    /**
     * Get the written blob from the current query
     * @returns The written blob
     */
    _getWrittenBlob(): Promise<Blob | undefined>;
    /**
     * Wait for the database to be ready
     */
    _checkReady(): Promise<void>;
    /**
     * Execute a postgres wire protocol synchronously
     * @param message The postgres wire protocol message to execute
     * @returns The direct message data response produced by Postgres
     */
    execProtocolRawSync(message: Uint8Array): Uint8Array;
    /**
     * Execute a postgres wire protocol message directly without wrapping the response.
     * Only use if `execProtocol()` doesn't suite your needs.
     *
     * **Warning:** This bypasses PGlite's protocol wrappers that manage error/notice messages,
     * transactions, and notification listeners. Only use if you need to bypass these wrappers and
     * don't intend to use the above features.
     *
     * @param message The postgres wire protocol message to execute
     * @returns The direct message data response produced by Postgres
     */
    execProtocolRaw(message: Uint8Array, { syncToFs }?: ExecProtocolOptions): Promise<Uint8Array>;
    /**
     * Execute a postgres wire protocol message
     * @param message The postgres wire protocol message to execute
     * @returns The result of the query
     */
    execProtocol(message: Uint8Array, { syncToFs, throwOnError, onNotice, }?: ExecProtocolOptions): Promise<ExecProtocolResult>;
    /**
     * Check if the database is in a transaction
     * @returns True if the database is in a transaction, false otherwise
     */
    isInTransaction(): boolean;
    /**
     * Perform any sync operations implemented by the filesystem, this is
     * run after every query to ensure that the filesystem is synced.
     */
    syncToFs(): Promise<void>;
    /**
     * Listen for a notification
     * @param channel The channel to listen on
     * @param callback The callback to call when a notification is received
     */
    listen(channel: string, callback: (payload: string) => void): Promise<() => Promise<void>>;
    /**
     * Stop listening for a notification
     * @param channel The channel to stop listening on
     * @param callback The callback to remove
     */
    unlisten(channel: string, callback?: (payload: string) => void): Promise<void>;
    /**
     * Listen to notifications
     * @param callback The callback to call when a notification is received
     */
    onNotification(callback: (channel: string, payload: string) => void): () => void;
    /**
     * Stop listening to notifications
     * @param callback The callback to remove
     */
    offNotification(callback: (channel: string, payload: string) => void): void;
    /**
     * Dump the PGDATA dir from the filesystem to a gziped tarball.
     * @param compression The compression options to use - 'gzip', 'auto', 'none'
     * @returns The tarball as a File object where available, and fallback to a Blob
     */
    dumpDataDir(compression?: DumpTarCompressionOptions): Promise<File | Blob>;
    /**
     * Run a function in a mutex that's exclusive to queries
     * @param fn The query to run
     * @returns The result of the query
     */
    _runExclusiveQuery<T>(fn: () => Promise<T>): Promise<T>;
    /**
     * Run a function in a mutex that's exclusive to transactions
     * @param fn The function to run
     * @returns The result of the function
     */
    _runExclusiveTransaction<T>(fn: () => Promise<T>): Promise<T>;
    clone(): Promise<PGliteInterface>;
    _runExclusiveListen<T>(fn: () => Promise<T>): Promise<T>;
}

export { type Filesystem as A, type BackendMessage as B, ERRNO_CODES as C, type DebugLevel as D, EmscriptenBuiltinFilesystem as E, type FilesystemType as F, type InitializedExtensions as I, type Mode as M, type Parser as P, type QueryOptions as Q, type Results as R, type SerializerOptions as S, type Transaction as T, WASM_PREFIX as W, type BufferParameter as a, PGlite as b, type PostgresMod as c, type PGliteInterface as d, type RowMode as e, type ParserOptions as f, type ExecProtocolOptions as g, type ExtensionSetupResult as h, type ExtensionSetup as i, type Extension as j, type ExtensionNamespace as k, type Extensions as l, messages as m, type ExecProtocolResult as n, type DumpDataDirResult as o, postgresMod as p, type PGliteOptions as q, type PGliteInterfaceExtensions as r, type Row as s, types$1 as t, type DescribeQueryResult as u, BaseFilesystem as v, type FsStats as w, BasePGlite as x, PGDATA as y, type FsType as z };
