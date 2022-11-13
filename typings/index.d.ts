declare function r(config: r.Config): r.Rdb;

declare namespace r {

    function table(name: string): Table;
    function end(): Promise<void>;
    function pg(connectionString: string, options?: PoolOptions): Pool;
    function sqlite(connectionString: string, options?: PoolOptions): Pool;
    function sap(connectionString: string, options?: PoolOptions): Pool;
    function mssql(connectionString: string, options?: PoolOptions): Pool;
    function mySql(connectionString: string, options?: PoolOptions): Pool;

    export interface Pool {
        end(): Promise<void>;
        transaction(fn: () => Promise<unknown>): Promise<void>;
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

    }

    export interface Table {
        primaryColumn(column: string): ColumnDef;
        column(column: string): ColumnDef;
        join(table: Table): Join;
        hasMany(join: JoinRelation): HasMany;
        hasOne(join: JoinRelation): HasOne;
    }

    interface HasMany {
        as(propertyName: string): void;
    }


    interface HasOne {
        as(propertyName: string): void;
    }

    export interface ColumnDef {
        serializable(value: boolean): ColumnDef;
        string(): ColumnOf<string>;
        numeric(): ColumnOf<number>;
        guid(): ColumnOf<string>;
        binary(): ColumnOf<Buffer>;
        boolean(): ColumnOf<boolean>;
        json(): ColumnOf<Record<string, unknown>>;
        date(): DateColumn;
    }
    export interface DateColumn {
        serializable(value: boolean): DateColumn;
        as(dbName: string): DateColumn;
        default(value: Date | string | (() => Date | string)): DateColumn
        dbNull(value: Date | string | null): DateColumn;
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

    export enum Concurrencies {
        Optimistic = 'optimistic',
        SkipOnConflict = 'skipOnConflict',
        Overwrite = 'overwrite'
    }

    export interface ExpressConfig<TStrategy, TConcurrency> {
        db?: unknown | string | (() => unknown | string);
        customFilters?: CustomFilters;
        baseFilter?: RawFilter | ((request?: import('express').Request, response?: import('express').Response) => RawFilter | Promise<RawFilter>);
        strategy?: TStrategy;
        defaultConcurrency?: Concurrencies;
        concurrency?: TConcurrency;
    }

    export interface Express {
        dts: import('express').RequestHandler
    }

    export interface CustomFilters {
        [key: string]: (...args: any[]) => RawFilter | CustomFilters
    }

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

    export interface BinaryColumn extends ColumnBase<any> {

    }

    export interface StringColumn extends ColumnBase<string> {
        startsWith(value: string | null): Filter;
        /**
         * ignore case
         */
        iStartsWith(value: string | null): Filter;
        endsWith(value: string | null): Filter;
        /**
         * ignore case
         */
        iEndsWith(value: string | null): Filter;
        contains(value: string | null): Filter;
        /**
         * ignore case
         */
        iContains(value: string | null): Filter;
        /**
         * ignore case
         */
        iEqual(value: string | null): Filter;
        /**
         * equal, ignore case
         */
        iEq(value: string | null): Filter;
        /**
         * equal, ignore case
         */
        EQ(value: string | null): Filter;
        /**
         * equal, ignore case
         */
        iEq(value: string | null): Filter;
    }


    interface ColumnBase<TType> {
        equal(value: TType | null): Filter;
        /**
         * equal
         */
        eq(value: TType | null): Filter;
        notEqual(value: TType | null): Filter;
        /**
         * not equal
         */
        ne(value: TType | null): Filter;
        lessThan(value: TType | null): Filter;
        /**
         * less than
         */
        lt(value: TType | null): Filter;
        lessThanOrEqual(value: TType | null): Filter;
        /**
         * less than or equal
         */
        le(value: TType | null): Filter;
        greaterThan(value: TType | null): Filter;
        /**
         * greater than
         */
        gt(value: TType | null): Filter;
        greaterThanOrEqual(value: TType | null): Filter;
        /**
         * greater than or equal
         */
        ge(value: TType | null): Filter;
        between(from: TType, to: TType | null): Filter;
        in(values: TType[] | null): Filter;
    }

    interface ColumnBase2<TType, TType2> {
        equal(value: TType2 | null): Filter;
        equal(value: TType | null): Filter;
        /**
         * equal
         */
        eq(value: TType2 | null): Filter;
        eq(value: TType | null): Filter;
        notEqual(value: TType2 | null): Filter;
        notEqual(value: TType | null): Filter;
        /**
         * not equal
         */
        ne(value: TType2 | null): Filter;
        ne(value: TType | null): Filter;
        lessThan(value: TType2 | null): Filter;
        lessThan(value: TType | null): Filter;
        /**
         * less than
         */
        lt(value: TType2 | null): Filter;
        lt(value: TType | null): Filter;
        lessThanOrEqual(value: TType2 | null): Filter;
        lessThanOrEqual(value: TType | null): Filter;
        /**
         * less than or equal
         */
        le(value: TType2 | null): Filter;
        le(value: TType | null): Filter;
        greaterThan(value: TType2 | null): Filter;
        greaterThan(value: TType | null): Filter;
        /**
         * greater than
         */
        gt(value: TType2 | null): Filter;
        gt(value: TType | null): Filter;
        greaterThanOrEqual(value: TType2 | null): Filter;
        greaterThanOrEqual(value: TType | null): Filter;
        /**
         * greater than or equal
         */
        ge(value: TType2 | null): Filter;
        ge(value: TType | null): Filter;
        between(from: TType | TType2, to: TType | TType2): Filter;
        in(values: Array<TType | TType2>[] | null): Filter;
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

    export interface TablesConfig {
        tables: unknown
    }

    export interface TransactionOptions {
        schema?: string[] | string;
    }

}

export = r;