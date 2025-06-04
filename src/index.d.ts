import type { Options } from './ajv';
import type { PGliteOptions } from './pglite.d.ts';
import type { RequestHandler } from 'express';
import type { D1Database } from '@cloudflare/workers-types';
import type { ConnectionConfiguration } from 'tedious';
import type { PoolAttributes } from 'oracledb';
import type { AllowedDbMap, DbMapper, MappedDbDef, MergeProperties } from './map';

declare function r(config: r.Config): unknown;

declare namespace r {

    function table(name: string): Table;
    function close(): Promise<void>;
    function d1(database: D1Database, options?: PoolOptions): Pool;
    function postgres(connectionString: string, options?: PoolOptions): Pool;
    function pglite(config?: PGliteOptions | string | undefined, options?: PoolOptions): Pool;
    function sqlite(connectionString: string, options?: PoolOptions): Pool;
    function sap(connectionString: string, options?: PoolOptions): Pool;
    function mssql(connectionConfig: ConnectionConfiguration, options?: PoolOptions): Pool;
    function mssql(connectionString: string, options?: PoolOptions): Pool;
    function mssqlNative(connectionString: string, options?: PoolOptions): Pool;
    function mysql(connectionString: string, options?: PoolOptions): Pool;
    function oracle(config: PoolAttributes, options?: PoolOptions): Pool;
    function on(type: 'query', cb: (e: QueryEvent) => void): void;
    function off(type: 'query', cb: (e: QueryEvent) => void): void;
    function map<V extends AllowedDbMap<V>>(
		fn: (mapper: DbMapper<{}>) => V
	): MappedDbDef<MergeProperties<V, V>>;

    function createPatch(original: any[], modified: any[]): JsonPatch;
    function createPatch(original: any, modified: any): JsonPatch;

    type JsonPatch = Array<{
        op: 'add' | 'remove' | 'replace' | 'copy' | 'move' | 'test';
        path: string;
        value?: any;
        from?: string;
    }>;

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

    export abstract class JoinRelation {
    	columns: ColumnDef[];
    	childTable: Table;
    }

    export interface Table {
        primaryColumn(column: string): ColumnDef;
        column(column: string): ColumnDef;
        join(table: Table): Join;
        hasMany(join: JoinRelation): HasMany;
        hasOne(join: JoinRelation): HasOne;
        formulaDiscriminators(...discriminators: string[]): Table;
        columnDiscriminators(...discriminators: string[]): Table;
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
        validate(validator: (value?: Date | string, row?: object) => void): DateColumnDef;
        notNull(): DateColumnNotNullDef;
        JSONSchema(schema: object, options?: Options): DateColumnDef;
        serializable(value: boolean): DateColumnDef;
        as(dbName: string): DateColumnDef;
        default(value: Date | string | null | undefined | (() => Date | string | null | undefined)): DateColumnDef
        dbNull(value: Date | string | null): DateColumnDef;
    }

    export interface DateColumnNotNullDef {
        validate(validator: (value: Date | string, row?: object) => void): DateColumnNotNullDef;
        JSONSchema(schema: object, options?: Options): DateColumnNotNullDef;
        serializable(value: boolean): DateColumnNotNullDef;
        as(dbName: string): DateColumnNotNullDef;
        default(value: Date | string | null | undefined | (() => Date | string | null | undefined)): DateColumnNotNullDef
        dbNull(value: Date | string | null): DateColumnNotNullDef;
    }

    export interface BinaryColumnDef {
        validate(validator: (value?: Buffer | string, row?: object) => void): BinaryColumnDef;
        notNull(): BinaryColumnNotNullDef;
        JSONSchema(schema: object, options?: Options): BinaryColumnDef;
        serializable(value: boolean): BinaryColumnDef;
        as(dbName: string): BinaryColumnDef;
        default(value: Buffer | string | null | undefined | (() => Buffer | string | null | undefined)): BinaryColumnDef
        dbNull(value: Buffer | string | null): BinaryColumnDef;
    }

    export interface BinaryColumnNotNullDef {
        validate(validator: (value: Buffer | string, row?: object) => void): BinaryColumnNotNullDef;
        JSONSchema(schema: object, options?: Options): BinaryColumnNotNullDef;
        serializable(value: boolean): BinaryColumnNotNullDef;
        as(dbName: string): BinaryColumnNotNullDef;
        default(value: Buffer | string | null | undefined | (() => Buffer | string | null | undefined)): BinaryColumnNotNullDef
        dbNull(value: Buffer | string | null): BinaryColumnNotNullDef;
    }

    export interface ColumnOf<T> {
        validate(validator: (value?: T, row?: object) => void): ColumnOf<T>;
        notNull(): ColumnNotNullOf<T>;
        JSONSchema(schema: object, options?: Options): ColumnOf<T>;
        serializable(value: boolean): ColumnOf<T>;
        default(value: T | null | undefined | (() => T | null | undefined)): ColumnOf<T>;
        dbNull(value: T | null): ColumnOf<T>;
        as(dbName: string): ColumnOf<T>;
    }

    export interface ColumnNotNullOf<T> {
        validate(validator: (value: T, row?: object) => void): ColumnNotNullOf<T>;
        notNull(): ColumnNotNullOf<T>;
        JSONSchema(schema: object, options?: Options): ColumnNotNullOf<T>;
        serializable(value: boolean): ColumnNotNullOf<T>;
        default(value: T | null | undefined | (() => T | null | undefined)): ColumnNotNullOf<T>;
        dbNull(value: T | null): ColumnNotNullOf<T>;
        as(dbName: string): ColumnNotNullOf<T>;
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

    export type Concurrency = 'optimistic' | 'skipOnConflict' | 'overwrite';

    export interface ColumnConcurrency {
        readonly?: boolean;
        concurrency?: Concurrency;
    }

    export interface Express extends RequestHandler {
        db: import('express').RequestHandler
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

    export interface BinaryColumn extends ColumnBase2<Buffer, string> {

    }

    export interface StringColumn extends ColumnBase<string> {
        startsWith(value: string | null): Filter;
        /**
        * ignore case, postgres only
         */
        iStartsWith(value: string | null): Filter;
        endsWith(value: string | null): Filter;
        /**
         * ignore case, postgres only
         */
        iEndsWith(value: string | null): Filter;
        contains(value: string | null): Filter;
        /**
         * ignore case, postgres only
         */
        iContains(value: string | null): Filter;
        /**
         * ignore case
         */
        iEqual(value: string | null): Filter;
        /**
        * ignore case, postgres only
        * */
        iEq(value: string | null): Filter;
        /**
         * ignore case, postgres only
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
        equal(value: TType | TType2 | null): Filter;
        /**
         * equal
         */
        eq(value: TType | TType2 | null): Filter;
        notEqual(value: TType | TType2 | null): Filter;
        /**
         * not equal
         */
        ne(value: TType | TType2 | null): Filter;
        lessThan(value: TType | TType2 | null): Filter;
        /**
         * less than
         */
        lt(value: TType | TType2 | null): Filter;
        lessThanOrEqual(value: TType | TType2 | null): Filter;
        /**
         * less than or equal
         */
        le(value: TType | TType2 | null): Filter;
        greaterThan(value: TType | TType2 | null): Filter;
        /**
         * greater than
         */
        gt(value: TType | TType2 | null): Filter;
        greaterThanOrEqual(value: TType | TType2 | null): Filter;
        /**
         * greater than or equal
         */
        ge(value: TType | TType2 | null): Filter;
        between(from: TType | TType2, to: TType | TType2): Filter;
        in(values: Array<TType | TType2>[] | null): Filter;
    }

    export interface TransactionOptions {
        schema?: string[] | string;
    }

    export type Config = DbConfig | TablesConfig;

    export interface DbConfig {
        db: Pool | Url | (() => Pool);
    }

    export type Url = `${'http://' | 'https://'}${string}`;

    export interface TablesConfig {
        tables: Record<string, Table>
    }

    export interface TransactionOptions {
        schema?: string[] | string;
    }

}

export = r;