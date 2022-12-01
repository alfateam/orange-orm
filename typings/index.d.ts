declare function r(config: r.Config): r.Rdb;

declare namespace r {

    function table(name: string): Table;
    function end(): Promise<void>;
    function postgres(connectionString: string, options?: PoolOptions): Pool;
    function sqlite(connectionString: string, options?: PoolOptions): Pool;
    function sap(connectionString: string, options?: PoolOptions): Pool;
    function mssql(connectionString: string, options?: PoolOptions): Pool;
    function mysql(connectionString: string, options?: PoolOptions): Pool;
    function on(type: 'query', cb: (e: QueryEvent) => void): void;
    function off(type: 'query', cb: (e: QueryEvent) => void): void;

    export interface QueryEvent {
        sql: string,
        parameters: []
    }    

    export interface QueryResult {
        sql: string,
        parameters: [],
        result: []
    }


    export interface Pool {
        end(): Promise<void>;
    }

    export interface PoolOptions {
        size?: number;
    }

    export interface Join {
        by(...columns: string[]): JoinBy;
    }

    export interface JoinBy {
        as(propertyName: string): JoinRelation;
    }

    export interface JoinRelation {
        columns: ColumnDef[];
	    childTable: Table;
    }

    export interface Table {
        primaryColumn(column: string): ColumnDef;
        column(column: string): ColumnDef;
        join(table: Table): Join;
        hasMany(join: JoinRelation): HasMany;
        hasOne(join: JoinRelation): HasOne;
    }

    export interface HasMany {
        as(propertyName: string): void;
    }

    export interface HasOne {
        as(propertyName: string): void;
    }

    export interface ColumnDef {
        serializable(value: boolean): ColumnDef;
        string(): ColumnOf<string>;
        numeric(): ColumnOf<number>;
        uuid(): ColumnOf<string>;
        binary(): BinaryColumnDef;
        boolean(): ColumnOf<boolean>;
        json(): ColumnOf<Record<string, unknown>>;
        date(): DateColumnDef;
    }
    export interface DateColumnDef {
        serializable(value: boolean): DateColumnDef;
        as(dbName: string): DateColumnDef;
        default(value: Date | string | (() => Date | string)): DateColumnDef
        dbNull(value: Date | string | null): DateColumnDef;
    }

    export interface BinaryColumnDef {
        serializable(value: boolean): BinaryColumnDef;
        as(dbName: string): BinaryColumnDef;
        default(value: Buffer | string | (() => Buffer | string)): BinaryColumnDef
        dbNull(value: Buffer | string | null): BinaryColumnDef;
    }

    export interface ColumnOf<T> {
        serializable(value: boolean): ColumnOf<T>;
        default(value: T | (() => T)): ColumnOf<T>;
        dbNull(value: T | null): ColumnOf<T>;
        as(dbName: string): ColumnOf<T>;
    }

    export interface Rdb {
        (config: Config): Rdb;
    }

    var filter: Filter;
    export interface RawFilter {
        sql: string | (() => string);
        parameters?: any[];
    }

    export interface Filter extends RawFilter {
        and(filter: Filter, ...filters: Filter[]): Filter;
        or(filter: Filter, ...filters: Filter[]): Filter;
        not(): Filter;
    }

    export type RdbRequest = {
        method: string;
        headers: Headers;
        body: any;
    }

    export type Concurrency = 'optimistic' | 'skipOnConflict' | 'overwrite';

    // export interface ExpressConfig<TStrategy, TConcurrency> {
    //     db?: unknown | string | (() => unknown | string);
    //     customFilters?: CustomFilters;
    //     baseFilter?: RawFilter | ((request?: import('express').Request, response?: import('express').Response) => RawFilter | Promise<RawFilter>);
    //     strategy?: TStrategy;
    //     defaultConcurrency?: Concurrencies;
    //     concurrency?: TConcurrency;
    // }

    // export interface Express {
    //     dts: import('express').RequestHandler
    // }

    // export interface CustomFilters {
    //     [key: string]: (...args: any[]) => RawFilter | CustomFilters
    // }

    export interface BooleanColumn extends ColumnBase<boolean> {
    }

    export interface JSONColumn extends ColumnBase<object> {
    }

    export interface UUIDColumn extends ColumnBase<string> {
    }

    export interface DateColumn extends ColumnBase2<Date, string> {
    }

    export interface NumberColumn extends ColumnBase<number> {
    }

    export interface BinaryColumn extends ColumnBase2<Buffer, string> {

    }

    export interface StringColumn extends ColumnBase<string> {
    }


    interface ColumnBase<TType> {
    }

    interface ColumnBase2<TType, TType2> {
    }

    export interface ResponseOptions {
        retry(): void;
        attempts: number;
    }

    export interface ResponseOptions {
        retry(): void;
        attempts: number;
    }

    export interface TransactionOptions {
        schema?: string[] | string;
    }

    export type Config = DbConfig | TablesConfig;

    export interface DbConfig {
        db: Pool | (() => Pool);
    }

    type Url =`${'http://'|'https://'}${string}`;

    export interface TablesConfig {
        tables: Record<string, Url | Table>
    }

    export interface TransactionOptions {
        schema?: string[] | string;
    }

}

export = r;