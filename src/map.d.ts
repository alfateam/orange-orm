import type { ConnectionConfiguration } from 'tedious';
import type { PoolAttributes } from 'oracledb';
import type { AxiosInterceptorManager, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type {
	UuidColumnSymbol, BinaryColumnSymbol, DateColumnSymbol, DateWithTimeZoneColumnSymbol, StringColumnSymbol,
	NumericColumnSymbol, JSONColumnSymbol, IsPrimary, ExtractPrimary, RemoveNever, ToJsonType, Concurrency, FetchedProperties, FetchingStrategy, StrategyToRowData, PickPropertyValue1, PickPropertyValue2, PickPropertyValue3,PickPropertyValue4 ,PickPropertyValue5 ,PickPropertyValue6, PickTypesOf, ColumnToType, CountProperties, MappedColumnsAndRelations, StrategyToInsertRowData, Filter, FetchedAggregateProperties, AggregateStrategy, StrategyToUpdateRowData, JSONColumnType, AllowedColumnsAndTablesStrategy, ColumnSymbols, BooleanColumnSymbol, RawFilter, MappedTableDef, DbConcurrency, ConcurrencyValues, MappedTableDefInit, AllowedDbMap 
} from './types';

export type MappedDbDef<T> = {
	map<V extends AllowedDbMap<V>>(
		callback: (mapper: DbMapper<T>) => V
	): MappedDbDef<MergeProperties<T, V>>;
	<O extends DbOptions<T>>(concurrency: O): NegotiateDbInstance<T, O>;
} & T & DbConnectable<T>;

type MergeProperties<T, V> = {
	[K in keyof T | keyof V]:
	K extends keyof T ? (T[K] extends MappedTableDef<infer M>
		? (K extends keyof V ? (V[K] extends MappedTableDef<infer N> ? MappedTableDef<M & N> : V[K]) : T[K])
		: T[K])
	: (K extends keyof V ? V[K] : never);
};


export type DbMapper<T> = {
	table(tableName: string): MappedTableDefInit<{}>;
} & T;

type MappedDb<T> = (<O extends DbOptions<T>>(concurrency: O) => NegotiateDbInstance<T, O>) & DbConnectable<T>;

type DbConnectable<T> = {
	http(url: string): MappedDbInstance<T>;
	postgres(connectionString: string, options?: PoolOptions): MappedDbInstance<T>;
	sqlite(connectionString: string, options?: PoolOptions): MappedDbInstance<T>;
	sap(connectionString: string, options?: PoolOptions): MappedDbInstance<T>;
	mssql(connectionConfig: ConnectionConfiguration, options?: PoolOptions): MappedDbInstance<T>;
	mssql(connectionString: string, options?: PoolOptions): MappedDbInstance<T>;
	mssqlNative(connectionString: string, options?: PoolOptions): MappedDbInstance<T>;
	mysql(connectionString: string, options?: PoolOptions): MappedDbInstance<T>;
	oracle(config: PoolAttributes, options?: PoolOptions): MappedDbInstance<T>;
};

type NegotiateDbInstance<T, C> = C extends WithDb
	? MappedDbInstance<T>
	: MappedDb<T>;

type WithDb = {
	db: Pool | ((connectors: Connectors) => Pool | Promise<Pool>)
};

type DbOptions<T> = {
	[K in keyof T]?: T[K] extends MappedTableDef<infer U>
	? Concurrency<U>
	: never;
} & {
	concurrency?: ConcurrencyValues;
	readonly?: boolean;
	db?: Pool | ((connectors: Connectors) => Pool | Promise<Pool>);
};

interface Connectors {
	http(url: string): Pool;
	postgres(connectionString: string, options?: PoolOptions): Pool;
	sqlite(connectionString: string, options?: PoolOptions): Pool;
	sap(connectionString: string, options?: PoolOptions): Pool;
	mssql(connectionConfig: ConnectionConfiguration, options?: PoolOptions): Pool;
	mssql(connectionString: string, options?: PoolOptions): Pool;
	oracle(config: PoolAttributes, options?: PoolOptions): Pool;
}

export interface Pool {
	end(): Promise<void>;
}

export interface PoolOptions {
	size?: number;
}

type MappedDbInstance<T> = {
	[K in keyof T]: T[K] extends MappedTableDef<infer U>
	? MappedTable<T[K]>
	: never;
} & {
	filter: Filter;
	and(filter: Filter | RawFilter[], ...filters: RawFilter[]): Filter;
	or(filter: Filter | RawFilter[], ...filters: RawFilter[]): Filter;
	not(): Filter;
	query(filter: RawFilter | string): Promise<unknown[]>;
	query<T>(filter: RawFilter | string): Promise<T[]>;
	createPatch(original: any[], modified: any[]): JsonPatch;
	createPatch(original: any, modified: any): JsonPatch;
	<O extends DbOptions<T>>(concurrency: O): MappedDbInstance<T>;
	transaction(
		fn: (db: MappedDbInstance<T>) => Promise<unknown>
	): Promise<void>;
	saveChanges(arraysOrRow: { saveChanges(): Promise<void> }): Promise<void>;
	express(): import('express').RequestHandler;
	express(config: ExpressConfig<T>): import('express').RequestHandler;
	readonly metaData: DbConcurrency<T>;
	interceptors: WithInterceptors;
} & DbConnectable<T> & WithInterceptors;

interface WithInterceptors {
	request: AxiosInterceptorManager<InternalAxiosRequestConfig>;
	response: AxiosInterceptorManager<AxiosResponse>;
}


type ExpressConfig<T> = {
	[K in keyof T]?: T[K] extends MappedTableDef<infer U>
	? ExpressTableConfig<T>
	: never;
} & {
	db?: Pool | ((connectors: Connectors) => Pool | Promise<Pool>);
}

type ExpressTableConfig<T> = {
	baseFilter?: RawFilter | ((db: MappedDbInstance<T>, req: import('express').Request, res: import('express').Response) => RawFilter);
}


type JsonPatch = Array<{
	op: 'add' | 'remove' | 'replace' | 'copy' | 'move' | 'test';
	path: string;
	value?: any;
	from?: string;
}>;


type PrimaryRowFilter<T> = StrategyToRowDataPrimary<ExtractPrimary<T>>;
type StrategyToRowDataPrimary<T> = {
	[K in keyof T]: T[K] extends StringColumnSymbol
	? string
	: T[K] extends UuidColumnSymbol
	? string
	: T[K] extends NumericColumnSymbol
	? number
	: T[K] extends DateColumnSymbol
	? string | Date
	: T[K] extends DateWithTimeZoneColumnSymbol
	? string | Date
	: T[K] extends BinaryColumnSymbol
	? string
	: T[K] extends BooleanColumnSymbol
	? boolean
	: T[K] extends JSONColumnType<infer M>
	? ToJsonType<M>
	: never;
};


type ExpandedFetchingStrategy<T> = {
	[K in keyof T &
	keyof RemoveNever<
		AllowedColumnsAndTablesStrategy<T>
	>]?: T[K] extends ColumnSymbols
	? true
	: ExpandedFetchingStrategy<T[K]>;
};

type ExpandedMappedTable<T, FL = ExpandedFetchingStrategy<T>> = {
	getOne(
		filter?: Filter | PrimaryRowFilter<T>
	): Promise<StrategyToRow<FetchedProperties<T, FL>, T>>;
	getOne<FS extends FetchingStrategy<T>>(
		filter?: Filter | PrimaryRowFilter<T>,
		fetchingStrategy?: FS
	): Promise<StrategyToRow<FetchedProperties<T, FL>, T>>;

	update(
		values: StrategyToUpdateRowData<T>,
		where: FetchingStrategy<T>
	): Promise<void>;

	update<FS extends FetchingStrategy<T>>(
		values: StrategyToUpdateRowData<T>,
		where: FetchingStrategy<T>,
		strategy: FS
	): Promise<StrategyToRowArray<FetchedProperties<T, FL>, T>>;

	replace(
		row: StrategyToInsertRowData<T> | StrategyToInsertRowData<T>[]
	): Promise<void>;

	replace<FS extends FetchingStrategy<T>>(
		row: StrategyToInsertRowData<T>,
		strategy: FS
	): Promise<StrategyToRow<FetchedProperties<T, FL>, T>>;

	replace<FS extends FetchingStrategy<T>>(
		rows: StrategyToInsertRowData<T>[],
		strategy: FS
	): Promise<StrategyToRowArray<FetchedProperties<T, FL>, T>>;


	updateChanges(
		row: StrategyToInsertRowData<T>,
		originalRow: StrategyToInsertRowData<T>
	): Promise<StrategyToRow<FetchedProperties<T, FL>, T>>;

	updateChanges(
		rows: StrategyToInsertRowData<T>[],
		originalRows: StrategyToInsertRowData<T>[]
	): Promise<StrategyToRowArray<FetchedProperties<T, FL>, T>>;

	updateChanges<FS extends FetchingStrategy<T>>(
		row: StrategyToInsertRowData<T>,
		originalRow: StrategyToInsertRowData<T>,
		strategy: FS
	): Promise<StrategyToRow<FetchedProperties<T, FL>, T>>;

	updateChanges<FS extends FetchingStrategy<T>>(
		rows: StrategyToInsertRowData<T>[],
		originalRows: StrategyToInsertRowData<T>[],
		strategy: FS
	): Promise<StrategyToRowArray<FetchedProperties<T, FL>, T>>;

	insert(
		row: StrategyToInsertRowData<T>
	): Promise<StrategyToRow<FetchedProperties<T, FL>, T>>;

	insert(
		rows: StrategyToInsertRowData<T>[]
	): Promise<StrategyToRowArray<FetchedProperties<T, FL>, T>>;

	insert<FS extends FetchingStrategy<T>>(
		row: StrategyToInsertRowData<T>,
		strategy: FS
	): Promise<StrategyToRow<FetchedProperties<T, FL>, T>>;

	insert<FS extends FetchingStrategy<T>>(
		rows: StrategyToInsertRowData<T>[],
		strategy: FS
	): Promise<StrategyToRowArray<FetchedProperties<T, FL>, T>>;

	insertAndForget(
		row: StrategyToRowData<T>
	): Promise<void>;

	insertAndForget(
		row: StrategyToRowData<T>[]
	): Promise<void>;

	getMany(
		filter?: Filter | PrimaryRowFilter<T>[]
	): Promise<StrategyToRowArray<FetchedProperties<T, FL>, T>>;
	getMany<FS extends FetchingStrategy<T>>(
		filter?: Filter | PrimaryRowFilter<T>[],
		fetchingStrategy?: FS
	): Promise<StrategyToRowArray<FetchedProperties<T, FL>, T>>;
	getAll(): Promise<StrategyToRowArray<FetchedProperties<T, FL>, T>>;
	getAll<FS extends FetchingStrategy<T>>(
		fetchingStrategy: FS
	): Promise<StrategyToRowArray<FetchedProperties<T, FL>, T>>;
	aggregate<FS extends AggregateStrategy<T>>(
		fetchingStrategy: FS
	): Promise<StrategyToRowData<FetchedAggregateProperties<T, FL>>[]>;
	count(filter?: Filter | PrimaryRowFilter<T>[]): Promise<number>;
	delete(filter?: Filter | PrimaryRowFilter<T>[]): Promise<void>;
	deleteCascade(filter?: Filter | PrimaryRowFilter<T>[]): Promise<void>;

	proxify(
		row: StrategyToInsertRowData<T>
	): StrategyToRow<FetchedProperties<T, FL>, T>;

	proxify(
		row: StrategyToInsertRowData<T>[]
	): StrategyToRowArray<FetchedProperties<T, FL>, T>;

	proxify<FS extends FetchingStrategy<T>>(
		row: StrategyToInsertRowData<T>,
		strategy: FS
	): StrategyToRow<FetchedProperties<T, FL>, T>;

	proxify<FS extends FetchingStrategy<T>>(
		row: StrategyToInsertRowData<T>[],
		strategy: FS
	): StrategyToRowArray<FetchedProperties<T, FL>, T>;


	patch<C extends Concurrency<T>>(
		patch: JsonPatch,
		concurrency?: C
	): Promise<void>;

	tsType<FS extends FetchingStrategy<T>>(
		strategy: FS
	): StrategyToRowData<FetchedProperties<T, FS>>;
	tsType(
	): StrategyToRowData<FetchedProperties<T, FL>>;

	readonly metaData: Concurrency<T>;
} & MappedColumnsAndRelations<T> &
	GetById<T, CountProperties<ExtractPrimary<T>>>;

type ReturnArrayOrObj<W, V1, V2> =
	W extends any[] ? V2 :
	V1;

type MappedTable<T> = {
	expand(): ExpandedMappedTable<T>
	getOne(
		filter?: Filter | PrimaryRowFilter<T>
	): Promise<StrategyToRow<FetchedProperties<T, {}>, T>>;
	getOne<FS extends FetchingStrategy<T>>(
		filter?: Filter | PrimaryRowFilter<T>,
		fetchingStrategy?: FS
	): Promise<StrategyToRow<FetchedProperties<T, FS>, T>>;

	update(
		values: StrategyToUpdateRowData<T>,
		where: FetchingStrategy<T>
	): Promise<void>;

	update<FS extends FetchingStrategy<T>>(
		values: StrategyToUpdateRowData<T>,
		where: FetchingStrategy<T>,
		strategy: FS
	): Promise<StrategyToRowArray<FetchedProperties<T, FS>, T>>;

	replace(
		row: StrategyToInsertRowData<T> | StrategyToInsertRowData<T>[]
	): Promise<void>;

	replace<FS extends FetchingStrategy<T>>(
		row: StrategyToInsertRowData<T>,
		strategy: FS
	): Promise<StrategyToRow<FetchedProperties<T, FS>, T>>;

	replace<FS extends FetchingStrategy<T>>(
		rows: StrategyToInsertRowData<T>[],
		strategy: FS
	): Promise<StrategyToRowArray<FetchedProperties<T, FS>, T>>;

	updateChanges(
		modifiedRow: StrategyToInsertRowData<T>,
		originalRow: StrategyToInsertRowData<T>
	): Promise<StrategyToRow<FetchedProperties<T, {}>, T>>;


	updateChanges(
		modifiedRows: StrategyToInsertRowData<T>[],
		originalRows: StrategyToInsertRowData<T>[]
	): Promise<StrategyToRowArray<FetchedProperties<T, {}>, T>>;

	updateChanges<FS extends FetchingStrategy<T>>(
		modifiedRow: StrategyToInsertRowData<T>,
		originalRow: StrategyToInsertRowData<T>,
		strategy: FS
	): Promise<StrategyToRow<FetchedProperties<T, FS>, T>>;

	updateChanges<FS extends FetchingStrategy<T>>(
		modifiedRows: StrategyToInsertRowData<T>[],
		originalRows: StrategyToInsertRowData<T>[],
		strategy: FS
	): Promise<StrategyToRowArray<FetchedProperties<T, FS>, T>>;

	insert(
		row: StrategyToInsertRowData<T>
	): Promise<StrategyToRow<FetchedProperties<T, {}>, T>>;

	insert(
		rows: StrategyToInsertRowData<T>[]
	): Promise<StrategyToRowArray<FetchedProperties<T, {}>, T>>;

	insert<FS extends FetchingStrategy<T>>(
		row: StrategyToInsertRowData<T>,
		strategy: FS
	): Promise<StrategyToRow<FetchedProperties<T, FS>, T>>;

	insert<FS extends FetchingStrategy<T>>(
		rows: StrategyToInsertRowData<T>[],
		strategy: FS
	): Promise<StrategyToRowArray<FetchedProperties<T, FS>, T>>;

	insertAndForget<TRow extends StrategyToInsertRowData<T> | StrategyToInsertRowData<T>[]>(
		row: TRow
	): Promise<void>;
	getMany(
		filter?: Filter | PrimaryRowFilter<T>[]
	): Promise<StrategyToRowArray<FetchedProperties<T, {}>, T>>;
	getMany<FS extends FetchingStrategy<T>>(
		filter?: Filter | PrimaryRowFilter<T>[],
		fetchingStrategy?: FS
	): Promise<StrategyToRowArray<FetchedProperties<T, FS>, T>>;
	getAll(): Promise<StrategyToRowArray<FetchedProperties<T, {}>, T>>;
	getAll<FS extends FetchingStrategy<T>>(
		fetchingStrategy: FS
	): Promise<StrategyToRowArray<FetchedProperties<T, FS>, T>>;

	aggregate<FS extends AggregateStrategy<T>>(
		fetchingStrategy: FS
	): Promise<StrategyToRowData<FetchedAggregateProperties<T, FS>>[]>;

	count(filter?: Filter | PrimaryRowFilter<T>[]): Promise<number>;
	delete(filter?: Filter | PrimaryRowFilter<T>[]): Promise<void>;
	deleteCascade(filter?: Filter | PrimaryRowFilter<T>[]): Promise<void>;

	proxify(
		row: StrategyToInsertRowData<T>
	): StrategyToRow<FetchedProperties<T, {}>, T>;

	proxify(
		row: StrategyToInsertRowData<T>[]
	): StrategyToRowArray<FetchedProperties<T, {}>, T>;

	proxify<FS extends FetchingStrategy<T>>(
		row: StrategyToInsertRowData<T>,
		strategy: FS
	): StrategyToRow<FetchedProperties<T, FS>, T>;

	proxify<FS extends FetchingStrategy<T>>(
		row: StrategyToInsertRowData<T>[],
		strategy: FS
	): StrategyToRowArray<FetchedProperties<T, FS>, T>;

	patch<C extends Concurrency<T>>(
		patch: JsonPatch,
		concurrency?: C
	): Promise<void>;

	tsType<FS extends FetchingStrategy<T>>(
		strategy: FS
	): StrategyToRowData<FetchedProperties<T, FS>>;
	tsType(
	): StrategyToRowData<FetchedProperties<T, {}>>;

	readonly metaData: Concurrency<T>;
} & MappedColumnsAndRelations<T> &
	GetById<T, CountProperties<ExtractPrimary<T>>>;

type GetById<T, Count extends number> = Count extends 1
	? {
		getById(
			id: ColumnToType<PickPropertyValue1<PickTypesOf<T, IsPrimary>>>
		): Promise<StrategyToRow<FetchedProperties<T, {}>, T>>;
		getById<FS extends FetchingStrategy<T>>(
			id: ColumnToType<PickPropertyValue1<PickTypesOf<T, IsPrimary>>>,
			fetchingStrategy: FS
		): Promise<StrategyToRow<FetchedProperties<T, FS>, T>>;
	}
	: Count extends 2
	? {
		getById(
			id: ColumnToType<PickPropertyValue1<PickTypesOf<T, IsPrimary>>>,
			id2: ColumnToType<PickPropertyValue2<PickTypesOf<T, IsPrimary>>>
		): Promise<StrategyToRow<FetchedProperties<T, {}>, T>>;
		getById<FS extends FetchingStrategy<T>>(
			id: ColumnToType<PickPropertyValue1<PickTypesOf<T, IsPrimary>>>,
			id2: ColumnToType<PickPropertyValue2<PickTypesOf<T, IsPrimary>>>,
			fetchingStrategy: FS
		): Promise<StrategyToRow<FetchedProperties<T, FS>, T>>;
	}
	: Count extends 3
	? {
		getById(
			id: ColumnToType<PickPropertyValue1<PickTypesOf<T, IsPrimary>>>,
			id2: ColumnToType<PickPropertyValue2<PickTypesOf<T, IsPrimary>>>,
			id3: ColumnToType<PickPropertyValue3<PickTypesOf<T, IsPrimary>>>
		): Promise<StrategyToRow<FetchedProperties<T, {}>, T>>;
		getById<FS extends FetchingStrategy<T>>(
			id: ColumnToType<PickPropertyValue1<PickTypesOf<T, IsPrimary>>>,
			id2: ColumnToType<PickPropertyValue2<PickTypesOf<T, IsPrimary>>>,
			id3: ColumnToType<PickPropertyValue3<PickTypesOf<T, IsPrimary>>>,
			fetchingStrategy: FS
		): Promise<StrategyToRow<FetchedProperties<T, FS>, T>>;
	}
	: Count extends 4
	? {
		getById(
			id: ColumnToType<PickPropertyValue1<PickTypesOf<T, IsPrimary>>>,
			id2: ColumnToType<PickPropertyValue2<PickTypesOf<T, IsPrimary>>>,
			id3: ColumnToType<PickPropertyValue3<PickTypesOf<T, IsPrimary>>>,
			id4: ColumnToType<PickPropertyValue4<PickTypesOf<T, IsPrimary>>>
		): Promise<StrategyToRow<FetchedProperties<T, {}>, T>>;
		getById<FS extends FetchingStrategy<T>>(
			id: ColumnToType<PickPropertyValue1<PickTypesOf<T, IsPrimary>>>,
			id2: ColumnToType<PickPropertyValue2<PickTypesOf<T, IsPrimary>>>,
			id3: ColumnToType<PickPropertyValue3<PickTypesOf<T, IsPrimary>>>,
			id4: ColumnToType<PickPropertyValue4<PickTypesOf<T, IsPrimary>>>,
			fetchingStrategy: FS
		): Promise<StrategyToRow<FetchedProperties<T, FS>, T>>;
	}
	: Count extends 5
	? {
		getById(
			id: ColumnToType<PickPropertyValue1<PickTypesOf<T, IsPrimary>>>,
			id2: ColumnToType<PickPropertyValue2<PickTypesOf<T, IsPrimary>>>,
			id3: ColumnToType<PickPropertyValue3<PickTypesOf<T, IsPrimary>>>,
			id4: ColumnToType<PickPropertyValue4<PickTypesOf<T, IsPrimary>>>,
			id5: ColumnToType<PickPropertyValue5<PickTypesOf<T, IsPrimary>>>
		): Promise<StrategyToRow<FetchedProperties<T, {}>, T>>;
		getById<FS extends FetchingStrategy<T>>(
			id: ColumnToType<PickPropertyValue1<PickTypesOf<T, IsPrimary>>>,
			id2: ColumnToType<PickPropertyValue2<PickTypesOf<T, IsPrimary>>>,
			id3: ColumnToType<PickPropertyValue3<PickTypesOf<T, IsPrimary>>>,
			id4: ColumnToType<PickPropertyValue4<PickTypesOf<T, IsPrimary>>>,
			id5: ColumnToType<PickPropertyValue5<PickTypesOf<T, IsPrimary>>>,
			fetchingStrategy: FS
		): Promise<StrategyToRow<FetchedProperties<T, FS>, T>>;
	}
	: Count extends 6
	? {
		getById(
			id: ColumnToType<PickPropertyValue1<PickTypesOf<T, IsPrimary>>>,
			id2: ColumnToType<PickPropertyValue2<PickTypesOf<T, IsPrimary>>>,
			id3: ColumnToType<PickPropertyValue3<PickTypesOf<T, IsPrimary>>>,
			id4: ColumnToType<PickPropertyValue4<PickTypesOf<T, IsPrimary>>>,
			id5: ColumnToType<PickPropertyValue5<PickTypesOf<T, IsPrimary>>>,
			id6: ColumnToType<PickPropertyValue6<PickTypesOf<T, IsPrimary>>>
		): Promise<StrategyToRow<FetchedProperties<T, {}>, T>>;
		getById<FS extends FetchingStrategy<T>>(
			id: ColumnToType<PickPropertyValue1<PickTypesOf<T, IsPrimary>>>,
			id2: ColumnToType<PickPropertyValue2<PickTypesOf<T, IsPrimary>>>,
			id3: ColumnToType<PickPropertyValue3<PickTypesOf<T, IsPrimary>>>,
			id4: ColumnToType<PickPropertyValue4<PickTypesOf<T, IsPrimary>>>,
			id5: ColumnToType<PickPropertyValue5<PickTypesOf<T, IsPrimary>>>,
			id6: ColumnToType<PickPropertyValue6<PickTypesOf<T, IsPrimary>>>,
			fetchingStrategy: FS
		): Promise<StrategyToRow<FetchedProperties<T, FS>, T>>;
	}
	: never;

type StrategyToRow<T, U> = StrategyToRowData<T> & {
	saveChanges(): Promise<void>;
	saveChanges<C extends Concurrency<U>>(concurrency?: C): Promise<void>;
	acceptChanges(): void;
	clearChanges(): void;
	refresh(): Promise<void>;
	refresh<FS extends FetchingStrategy<U>>(
		fetchingStrategy?: FS
	): Promise<StrategyToRow<FetchedProperties<U, FS>, U>>;
	delete(): Promise<void>;
	delete(concurrency: Concurrency<U>): Promise<void>;
};


type StrategyToRowArray<T, U> = StrategyToRowData<T>[] & {
	saveChanges(): Promise<void>;
	saveChanges<C extends Concurrency<U>>(concurrency?: C): Promise<void>;
	acceptChanges(): void;
	clearChanges(): void;
	refresh(): Promise<void>;
	refresh<FS extends FetchingStrategy<U>>(
		fetchingStrategy?: FS
	): Promise<StrategyToRowArray<FetchedProperties<U, FS>, U>>;
	delete(): Promise<void>;
	delete(concurrency: Concurrency<U>): Promise<void>;
};

