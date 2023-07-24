import type { Options } from 'ajv';
import type { ConnectionConfig } from 'tedious';


export type MappedDbDef<T> = {
	map<V extends AllowedDbMap<V>>(
		callback: (mapper: DbMapper<T>) => V
	): MappedDbDef<MergeProperties<T, V>>;
	<O extends DbOptions<T>>(concurrency: O): NegotiateDbInstance<T, O>;
} & T;

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

type MappedDb<T> = {
	<O extends DbOptions<T>>(concurrency: O): NegotiateDbInstance<T, O>;
};

type NegotiateDbInstance<T, C> = C extends WithDb
	? MappedDbInstance<T>
	: MappedDb<T>;

type WithDb = { db: (connectors: Connectors) => Pool };

type DbOptions<T> = {
	[K in keyof T]?: T[K] extends MappedTableDef<infer U>
	? Concurrency<U>
	: never;
} & {
	concurrency?: ConcurrencyValues;
	readonly?: boolean;
	db?: (connectors: Connectors) => Pool;
};

interface Connectors {
	http(url: string): Pool;
	postgres(connectionString: string, options?: PoolOptions): Pool;
	sqlite(connectionString: string, options?: PoolOptions): Pool;
	sap(connectionString: string, options?: PoolOptions): Pool;
	mssql(connectionConfig: ConnectionConfig, options?: PoolOptions): Pool;
	mssql(connectionString: string, options?: PoolOptions): Pool;
	mysql(connectionString: string, options?: PoolOptions): Pool;
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
	and(filter: Filter, ...filters: Filter[]): Filter;
	or(filter: Filter, ...filters: Filter[]): Filter;
	not(): Filter;
	query(filter: RawFilter | string): Promise<unknown[]>;
	query<T>(filter: RawFilter | string): Promise<T[]>;
	createPatch(original: any[], modified: any[]): JsonPatch;
	createPatch(original: any, modified: any): JsonPatch;
	<O extends DbOptions<T>>(concurrency: O): MappedDbInstance<T>;
	transaction(
		fn: (db: MappedDbInstance<T>) => Promise<unknown>
	): Promise<void>;
};

type JsonPatch = Array<{
	op: 'add' | 'remove' | 'replace' | 'copy' | 'move' | 'test';
	path: string;
	value?: any;
	from?: string;
}>;

type ToJsonType<M> = M extends JsonOf<infer N> ? N : JsonType;

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

	insert<TRow extends StrategyToInsertRowData<T>>(
		row: TRow
	): Promise<StrategyToRow<FetchedProperties<T, FL>, T>>;
	insertAndForget<TRow extends StrategyToRowData<T>>(
		row: TRow
	): Promise<void>;
	insert<TRow extends StrategyToInsertRowData<T>, FS extends FetchingStrategy<T>>(
		row: TRow,
		strategy: FS
	): Promise<StrategyToRow<FetchedProperties<T, FL>, T>>;

	getMany(
		filter?: Filter | PrimaryRowFilter<T>[]
	): Promise<StrategyToRowArray<FetchedProperties<T, FL>, T>>;
	getMany<FS extends FetchingStrategy<T>>(
		filter?: Filter | PrimaryRowFilter<T>[],
		fetchingStrategy?: FS
	): Promise<StrategyToRowArray<FetchedProperties<T, FL>, T>>;
	getAll(): StrategyToRowArray<FetchedProperties<T, FL>, T>;
	getAll<FS extends FetchingStrategy<T>>(
		fetchingStrategy?: FS
	): Promise<StrategyToRowArray<FetchedProperties<T, FL>, T>>;

	delete(filter?: Filter | PrimaryRowFilter<T>[]): Promise<void>;
	deleteCascade(filter?: Filter | PrimaryRowFilter<T>[]): Promise<void>;

	proxify<TRow extends StrategyToRowData<T>>(
		row: TRow
	): StrategyToRow<FetchedProperties<T, FL>, T>;
	proxify<TRow extends StrategyToRowData<T>, FS extends FetchingStrategy<T>>(
		row: TRow,
		strategy: FS
	): StrategyToRow<FetchedProperties<T, FL>, T>;
	proxify<TRow extends StrategyToRowData<T>[]>(
		rows: TRow[]
	): StrategyToRowArray<FetchedProperties<T, FL>, T>;
	proxify<
		TRow extends StrategyToRowData<T>[],
		FS extends FetchingStrategy<T>
	>(
		rows: TRow[],
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


type MappedTable<T> = {
	expand(): ExpandedMappedTable<T>
	getOne(
		filter?: Filter | PrimaryRowFilter<T>
	): Promise<StrategyToRow<FetchedProperties<T, {}>, T>>;
	getOne<FS extends FetchingStrategy<T>>(
		filter?: Filter | PrimaryRowFilter<T>,
		fetchingStrategy?: FS
	): Promise<StrategyToRow<FetchedProperties<T, FS>, T>>;

	insert<TRow extends StrategyToInsertRowData<T>>(
		row: TRow
	): Promise<StrategyToRow<FetchedProperties<T, {}>, T>>;
	insertAndForget<TRow extends StrategyToRowData<T>>(
		row: TRow
	): Promise<void>;
	insert<TRow extends StrategyToInsertRowData<T>, FS extends FetchingStrategy<T>>(
		row: TRow,
		strategy: FS
	): Promise<StrategyToRow<FetchedProperties<T, FS>, T>>;

	getMany(
		filter?: Filter | PrimaryRowFilter<T>[]
	): Promise<StrategyToRowArray<FetchedProperties<T, {}>, T>>;
	getMany<FS extends FetchingStrategy<T>>(
		filter?: Filter | PrimaryRowFilter<T>[],
		fetchingStrategy?: FS
	): Promise<StrategyToRowArray<FetchedProperties<T, FS>, T>>;
	getAll(): StrategyToRowArray<FetchedProperties<T, {}>, T>;
	getAll<FS extends FetchingStrategy<T>>(
		fetchingStrategy?: FS
	): Promise<StrategyToRowArray<FetchedProperties<T, FS>, T>>;

	delete(filter?: Filter | PrimaryRowFilter<T>[]): Promise<void>;
	deleteCascade(filter?: Filter | PrimaryRowFilter<T>[]): Promise<void>;

	proxify<TRow extends StrategyToRowData<T>>(
		row: TRow
	): StrategyToRow<FetchedProperties<T, {}>, T>;
	proxify<TRow extends StrategyToRowData<T>, FS extends FetchingStrategy<T>>(
		row: TRow,
		strategy: FS
	): StrategyToRow<FetchedProperties<T, FS>, T>;
	proxify<TRow extends StrategyToRowData<T>[]>(
		rows: TRow[]
	): StrategyToRowArray<FetchedProperties<T, {}>, T>;
	proxify<
		TRow extends StrategyToRowData<T>[],
		FS extends FetchingStrategy<T>
	>(
		rows: TRow[],
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

type ColumnToType<T> = T extends UuidColumnSymbol
	? string
	: T extends StringColumnSymbol
	? string
	: T extends NumericColumnSymbol
	? number
	: T extends DateColumnSymbol
	? string | Date
	: T extends DateWithTimeZoneSymbol
	? string | Date
	: T extends BinaryColumnSymbol
	? string
	: T extends BooleanColumnSymbol
	? boolean
	: T extends JsonOf<infer M>
	? M
	: T extends JSONColumnSymbol
	? JsonType
	: never;

type MappedColumnsAndRelations<T> = RemoveNeverFlat<{
	[K in keyof T]: T[K] extends StringColumnTypeDef<infer M>
	? StringColumnType<M>
	: T[K] extends UuidColumnTypeDef<infer M>
	? UuidColumnType<M>
	: T[K] extends NumericColumnTypeDef<infer M>
	? NumericColumnType<M>
	: T[K] extends DateColumnTypeDef<infer M>
	? DateColumnType<M>
	: T[K] extends DateWithTimeZoneColumnTypeDef<infer M>
	? DateWithTimeZoneColumnType<M>
	: T[K] extends BinaryColumnTypeDef<infer M>
	? BinaryColumnType<M>
	: T[K] extends BooleanColumnTypeDef<infer M>
	? BooleanColumnType<M>
	: T[K] extends JSONColumnTypeDef<infer M>
	? JSONColumnType<M>
	: T[K] extends ManyRelation
	? MappedColumnsAndRelations<PickTypesOf<T[K], RelatedTable>> &
	ManyTable<T[K]>
	: T[K] extends RelatedTable
	? MappedColumnsAndRelations<T[K]> & OneOrJoinTable<T[K]>
	: never;
}>;

type OneOrJoinTable<T> = ((
	fn: (table: MappedColumnsAndRelations<T>) => RawFilter
) => Filter) & {
	exists: () => Filter;
};

type ManyTable<T> = ((
	fn: (table: MappedColumnsAndRelations<T>) => RawFilter
) => Filter) & {
	all(selector: (table: MappedColumnsAndRelations<T>) => RawFilter): Filter;
	any(selector: (table: MappedColumnsAndRelations<T>) => RawFilter): Filter;
	none(selector: (table: MappedColumnsAndRelations<T>) => RawFilter): Filter;
	exists(): Filter;
};

export type AllowedDbMap<T> = {
	[P in keyof T]: T[P] extends MappedTableDef<infer U> ? T[P] : never;
};

type AllowedColumnsAndTablesStrategy<T> = {
	[P in keyof T]: T[P] extends ColumnAndTableTypes ? T[P] : never;
};
type AllowedColumnsAndTablesConcurrency<T> = {
	[P in keyof T]: T[P] extends ColumnAndTableTypes ? T[P] : never;
};

type FetchingStrategy<T> = {
	[K in keyof T &
	keyof RemoveNever<
		AllowedColumnsAndTablesStrategy<T>
	>]?: T[K] extends ColumnSymbols
	? boolean
	: boolean | FetchingStrategy<T[K]>;
} & {
	orderBy?:
	| OrderBy<Extract<keyof AllowedColumns<T>, string>>[]
	| OrderBy<Extract<keyof AllowedColumns<T>, string>>;
	limit?: number;
	offset?: number;
};

type ConcurrencyValues = 'optimistic' | 'skipOnConflict' | 'overwrite';

type ColumnConcurrency = {
	readonly?: boolean;
	concurrency?: ConcurrencyValues;
};

type ColumnSymbols =
	| StringColumnSymbol
	| UuidColumnSymbol
	| NumericColumnSymbol
	| DateColumnSymbol
	| DateWithTimeZoneColumnSymbol
	| BooleanColumnSymbol
	| BinaryColumnSymbol
	| JSONColumnSymbol;

type Concurrency<T> = {
	[K in keyof T &
	keyof RemoveNever<
		AllowedColumnsAndTablesConcurrency<T>
	>]?: T[K] extends ColumnSymbols ? ColumnConcurrency : Concurrency<T[K]>;
} & {
	readonly?: boolean;
	concurrency?: number;
};

type OrderBy<T extends string> = `${T} ${'asc' | 'desc'}` | T;

type RelatedTable = {
	[' relatedTable']: boolean;
};

type PickTypesOf<T, U> = {
	[K in keyof T as T[K] extends U ? K : never]: T[K];
};

type ExtractPrimary<T> = PickTypesOf<T, IsPrimary>;
type ExtractPrimary1<T> = PickTypesOf<
	T,
	PickPropertyValue1<PickTypesOf<T, IsPrimary>>
>;

type ExtractPrimary2<T> = PickTypesOf<
	T,
	PickPropertyValue2<PickTypesOf<T, IsPrimary>>
>;
type ExtractPrimary3<T> = PickTypesOf<
	T,
	PickPropertyValue3<PickTypesOf<T, IsPrimary>>
>;
type ExtractPrimary4<T> = PickTypesOf<
	T,
	PickPropertyValue4<PickTypesOf<T, IsPrimary>>
>;
type ExtractPrimary5<T> = PickTypesOf<
	T,
	PickPropertyValue5<PickTypesOf<T, IsPrimary>>
>;
type ExtractPrimary6<T> = PickTypesOf<
	T,
	PickPropertyValue6<PickTypesOf<T, IsPrimary>>
>;

type ToColumnTypes<T> = {
	[K in keyof T]: T[K] extends UuidColumnSymbol
	? UuidColumnSymbol
	: T[K] extends StringColumnSymbol
	? StringColumnSymbol
	: T[K] extends NumericColumnSymbol
	? NumericColumnSymbol
	: T[K] extends DateColumnSymbol
	? DateColumnSymbol
	: T[K] extends DateWithTimeZoneColumnSymbol
	? DateWithTimeZoneColumnSymbol
	: T[K] extends BinaryColumnSymbol
	? BinaryColumnSymbol
	: T[K] extends BooleanColumnSymbol
	? BooleanColumnSymbol
	: T[K] extends JSONColumnSymbol
	? JSONColumnSymbol
	: never;
}[keyof T];

type KeyCandidates1<TFrom, TTo> = PickTypesOf<
	TFrom,
	ToColumnTypes<ExtractPrimary1<TTo>>
>;
type KeyCandidates2<TFrom, TTo> = PickTypesOf<
	TFrom,
	ToColumnTypes<ExtractPrimary2<TTo>>
>;
type KeyCandidates3<TFrom, TTo> = PickTypesOf<
	TFrom,
	ToColumnTypes<ExtractPrimary3<TTo>>
>;
type KeyCandidates4<TFrom, TTo> = PickTypesOf<
	TFrom,
	ToColumnTypes<ExtractPrimary4<TTo>>
>;
type KeyCandidates5<TFrom, TTo> = PickTypesOf<
	TFrom,
	ToColumnTypes<ExtractPrimary5<TTo>>
>;
type KeyCandidates6<TFrom, TTo> = PickTypesOf<
	TFrom,
	ToColumnTypes<ExtractPrimary6<TTo>>
>;
type ReferenceMapper<TFrom, TTo> = ReferenceMapperHelper<
	TFrom,
	TTo,
	CountProperties<ExtractPrimary<TTo>>
>;
type OneMapper<TFrom, TTo> = HasMapperHelper<
	TFrom,
	TTo,
	CountProperties<ExtractPrimary<TFrom>>,
	OneRelation
>;
type ManyMapper<TFrom, TTo> = HasMapperHelper<
	TFrom,
	TTo,
	CountProperties<ExtractPrimary<TFrom>>,
	ManyRelation
>;

type ReferenceMapperHelper<TFrom, TTo, TPrimaryCount> =
	6 extends TPrimaryCount
	? {
		by<C1 extends keyof KeyCandidates1<TFrom, TTo>, C2 extends keyof KeyCandidates2<TFrom, TTo>, C3 extends keyof KeyCandidates2<TFrom, TTo>, C4 extends keyof KeyCandidates2<TFrom, TTo>, C5 extends keyof KeyCandidates2<TFrom, TTo>, C6 extends keyof KeyCandidates2<TFrom, TTo>>(
			column: C1,
			column2: C2,
			column3: C3,
			column4: C4,
			column5: C5,
			column6: C6
		): MappedTableDef<TTo> & RelatedTable & NegotiateNotNullRef<Pick<TFrom, C1 | C2 | C3 | C4 | C5 | C6>>;
	}
	: 5 extends TPrimaryCount
	? {
		by<C1 extends keyof KeyCandidates1<TFrom, TTo>, C2 extends keyof KeyCandidates2<TFrom, TTo>, C3 extends keyof KeyCandidates2<TFrom, TTo>, C4 extends keyof KeyCandidates2<TFrom, TTo>, C5 extends keyof KeyCandidates2<TFrom, TTo>>(
			column: C1,
			column2: C2,
			column3: C3,
			column4: C4,
			column5: C5
		): MappedTableDef<TTo> & RelatedTable & NegotiateNotNullRef<Pick<TFrom, C1 | C2 | C3 | C4 | C5>>;
	}
	: 4 extends TPrimaryCount
	? {
		by<C1 extends keyof KeyCandidates1<TFrom, TTo>, C2 extends keyof KeyCandidates2<TFrom, TTo>, C3 extends keyof KeyCandidates2<TFrom, TTo>, C4 extends keyof KeyCandidates2<TFrom, TTo>>(
			column: C1,
			column2: C2,
			column3: C3,
			column4: C4
		): MappedTableDef<TTo> & RelatedTable & NegotiateNotNullRef<Pick<TFrom, C1 | C2 | C3 | C4>>;
	}
	: 3 extends TPrimaryCount
	? {
		by<C1 extends keyof KeyCandidates1<TFrom, TTo>, C2 extends keyof KeyCandidates2<TFrom, TTo>, C3 extends keyof KeyCandidates2<TFrom, TTo>>(
			column: C1,
			column2: C2,
			column3: C3
		): MappedTableDef<TTo> & RelatedTable & NegotiateNotNullRef<Pick<TFrom, C1 | C2 | C3>>;
	}
	: 2 extends TPrimaryCount
	? {
		by<C1 extends keyof KeyCandidates1<TFrom, TTo>, C2 extends keyof KeyCandidates2<TFrom, TTo>>(
			column: C1,
			column2: C2
		): MappedTableDef<TTo> & RelatedTable & NegotiateNotNullRef<Pick<TFrom, C1 | C2>>;
	}
	: 1 extends TPrimaryCount
	? {
		by<C1 extends keyof KeyCandidates1<TFrom, TTo>>(
			column: C1
		): MappedTableDef<TTo> & RelatedTable & NegotiateNotNullRef<Pick<TFrom, C1>>;
	}
	: {};


type NegotiateNotNullRef<T> = keyof T extends never
	? {}
	: T extends Record<keyof T, NotNull>
	? NotNull
	: {};

type HasMapperHelper<
	TFrom,
	TTo,
	TPrimaryCount,
	TExtra = {}
> = 6 extends TPrimaryCount
	? {
		by(
			column: keyof KeyCandidates1<TTo, TFrom>,
			column2: keyof KeyCandidates2<TTo, TFrom>,
			column3: keyof KeyCandidates3<TTo, TFrom>,
			column4: keyof KeyCandidates4<TTo, TFrom>,
			column5: keyof KeyCandidates5<TTo, TFrom>,
			column6: keyof KeyCandidates6<TTo, TFrom>
		): MappedTableDef<TTo> & RelatedTable & TExtra;
	}
	: 5 extends TPrimaryCount
	? {
		by(
			column: keyof KeyCandidates1<TTo, TFrom>,
			column2: keyof KeyCandidates2<TTo, TFrom>,
			column3: keyof KeyCandidates3<TTo, TFrom>,
			column4: keyof KeyCandidates4<TTo, TFrom>,
			column5: keyof KeyCandidates5<TTo, TFrom>
		): MappedTableDef<TTo> & RelatedTable & TExtra;
	}
	: 4 extends TPrimaryCount
	? {
		by(
			column: keyof KeyCandidates1<TTo, TFrom>,
			column2: keyof KeyCandidates2<TTo, TFrom>,
			column3: keyof KeyCandidates3<TTo, TFrom>,
			column4: keyof KeyCandidates4<TTo, TFrom>
		): MappedTableDef<TTo> & RelatedTable & TExtra;
	}
	: 3 extends TPrimaryCount
	? {
		by(
			column: keyof KeyCandidates1<TTo, TFrom>,
			column2: keyof KeyCandidates2<TTo, TFrom>,
			column3: keyof KeyCandidates3<TTo, TFrom>
		): MappedTableDef<TTo> & RelatedTable & TExtra;
	}
	: 2 extends TPrimaryCount
	? {
		by(
			column: keyof KeyCandidates1<TTo, TFrom>,
			column2: keyof KeyCandidates2<TTo, TFrom>
		): MappedTableDef<TTo> & RelatedTable & TExtra;
	}
	: 1 extends TPrimaryCount
	? {
		by(
			column: keyof KeyCandidates1<TTo, TFrom>
		): MappedTableDef<TTo> & RelatedTable & TExtra;
	}
	: {};

type ColumnMapperInit<T> = {
	column(columnName: string): ColumnType<{}>;
	primaryColumn(columnName: string): ColumnType<IsPrimary>;
};

type ColumnMapper<T> = {
	references<TTo>(mappedTable: MappedTableDef<TTo>): ReferenceMapper<T, TTo>;
	hasOne<TTo>(mappedTable: MappedTableDef<TTo>): OneMapper<T, TTo>;
	hasMany<TTo>(mappedTable: MappedTableDef<TTo>): ManyMapper<T, TTo>;
};

type ManyRelation = {
	[' isManyRelation']: true;
};

type OneRelation = {
	[' isOneRelation']: true;
};

type MappedTableDefInit<T> = {
	map<V extends AllowedColumnsAndTablesWithPrimaryMap<V>>(
		callback: (mapper: ColumnMapperInit<T>) => V
	): MappedTableDef<T & V>;
} & T;

type MappedTableDef<T> = {
	map<V extends AllowedColumnsAndTablesMap<V>>(
		callback: (mapper: ColumnMapper<T>) => V
	): MappedTableDef<T & V>;
	formulaDiscriminators(...discriminators: string[]): MappedTableDef<T>;
	columnDiscriminators(...discriminators: string[]): MappedTableDef<T>;
} & T;

type NotNullProperties<T> = Pick<
	T,
	{ [K in keyof T]: T[K] extends NotNull ? K : never }[keyof T]
>;
type NullProperties<T> = Pick<
	T,
	{ [K in keyof T]: T[K] extends NotNull ? never : K }[keyof T]
>;

type NotNullInsertProperties<T> = Pick<
	T,
	{ [K in keyof T]: T[K] extends NotNullExceptInsert
		? never
		: T[K] extends NotNull ? K : never
	}[keyof T]
>;
type NullInsertProperties<T> = Pick<
	T,
	{ [K in keyof T]: T[K] extends NotNullExceptInsert
		? K
		: T[K] extends NotNull ? never : K
	}[keyof T]
>;

type ColumnTypes = ColumnSymbols;
type ColumnAndTableTypes = ColumnSymbols | RelatedTable;

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

type JsonValue = null | boolean | number | string | JsonArray | JsonObject;

interface JsonArray extends Array<JsonValue> { }

interface JsonObject {
	[key: string]: JsonValue;
}

type JsonType = JsonArray | JsonObject;

type AllowedColumnsAndTablesMap<T> = {
	[P in keyof T]: T[P] extends ColumnTypeOf<infer U> | RelatedTable
	? T[P]
	: never;
};

type AllowedColumnsAndTablesWithPrimaryMap<T> = 1 extends CountFirstPrimary<
	ExtractPrimary<T>
>
	? {
		[P in keyof T]: T[P] extends ColumnTypeOf<infer U> | RelatedTable
		? T[P]
		: never;
	}
	: NeedsPrimaryKey;

type NeedsPrimaryKey = {
	['Primary column']: void;
};

type CountFirstPrimary<T> = UnionOfTypes<MapPropertiesTo1<T>>;

type AllowedColumns<T> = RemoveNever<{
	[P in keyof T]: T[P] extends ColumnTypes ? T[P] : never;
}>;

type AtLeastOneOf<T, U> = {
	[K in keyof T]: T[K] extends U ? true : never;
}[keyof T] extends never
	? false
	: true;

type AtLeastOneTrue<T> = {
	[K in keyof T]: T[K] extends true ? true : never;
}[keyof T] extends never
	? false
	: true;

type ExtractColumnBools<T, TStrategy> = RemoveNever<{
	[K in keyof TStrategy]: K extends keyof T
	? T[K] extends ColumnSymbols
	? TStrategy[K]
	: never
	: never;
}>;

type NegotiateNotNull<T> = T extends NotNull ? NotNull : {};

type FetchedProperties<T, TStrategy> = FetchedColumnProperties<T, TStrategy> &
	FetchedRelationProperties<T, TStrategy>;

type FetchedRelationProperties<T, TStrategy> = RemoveNeverFlat<{
	[K in keyof T]: K extends keyof TStrategy
	? TStrategy[K] extends true
	? T[K] extends ColumnSymbols
	? never
	: T[K] extends ManyRelation
	? FetchedProperties<T[K], {}> & ManyRelation
	: FetchedProperties<T[K], {}> & NegotiateNotNull<T[K]>
	: TStrategy[K] extends false
	? never
	: T[K] extends ManyRelation
	? FetchedProperties<T[K], TStrategy[K]> & ManyRelation
	: FetchedProperties<T[K], TStrategy[K]> & NegotiateNotNull<T[K]>
	: never;
}>;

type FetchedColumnProperties<T, TStrategy> = RemoveNeverFlat<
	AtLeastOneTrue<ExtractColumnBools<T, TStrategy>> extends true
	? {
		[K in keyof T]: K extends keyof TStrategy
		? TStrategy[K] extends true
		? T[K] extends ColumnSymbols
		? T[K]
		: never
		: never
		: never;
	}
	: {
		[K in keyof T]: K extends keyof TStrategy
		? TStrategy[K] extends true
		? T[K] extends ColumnSymbols
		? T[K]
		: never
		: never
		: NegotiateDefaultStrategy<T[K]>;
	}
>;

type StrategyToRowData<T> = {
	[K in keyof RemoveNever<
		NotNullProperties<T>
	>]: T[K] extends StringColumnSymbol
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
	: T[K] extends JsonOf<infer M>
	? M
	: T[K] extends JSONColumnSymbol
	? JsonType
	: T[K] extends ManyRelation
	? StrategyToRowData<T[K]>[]
	: StrategyToRowData<T[K]>;
} & {
		[K in keyof RemoveNever<
			NullProperties<T>
		>]?: T[K] extends StringColumnSymbol
		? string | null
		: T[K] extends UuidColumnSymbol
		? string | null
		: T[K] extends NumericColumnSymbol
		? number | null
		: T[K] extends DateColumnSymbol
		? string | Date | null
		: T[K] extends DateWithTimeZoneColumnSymbol
		? string | Date | null
		: T[K] extends BinaryColumnSymbol
		? string | null
		: T[K] extends BooleanColumnSymbol
		? boolean | null
		: T[K] extends JsonOf<infer M>
		? M | null
		: T[K] extends JSONColumnSymbol
		? JsonType | null
		: T[K] extends ManyRelation
		? StrategyToRowData<T[K]>[]
		: StrategyToRowData<T[K]>;
	};

type StrategyToInsertRowData<T> = {
	[K in keyof RemoveNever<
		NotNullInsertProperties<T>
	>]: T[K] extends StringColumnSymbol
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
	: T[K] extends JsonOf<infer M>
	? M
	: T[K] extends JSONColumnSymbol
	? JsonType
	: T[K] extends ManyRelation
	? StrategyToRowData<T[K]>[]
	: StrategyToRowData<T[K]>;
} & {
		[K in keyof RemoveNever<
			NullInsertProperties<T>
		>]?: T[K] extends StringColumnSymbol
		? string | null
		: T[K] extends UuidColumnSymbol
		? string | null
		: T[K] extends NumericColumnSymbol
		? number | null
		: T[K] extends DateColumnSymbol
		? string | Date | null
		: T[K] extends DateWithTimeZoneColumnSymbol
		? string | Date | null
		: T[K] extends BinaryColumnSymbol
		? string | null
		: T[K] extends BooleanColumnSymbol
		? boolean | null
		: T[K] extends JsonOf<infer M>
		? M | null
		: T[K] extends JSONColumnSymbol
		? JsonType | null
		: // : never
		T[K] extends ManyRelation
		? StrategyToRowData<T[K]>[]
		: StrategyToRowData<T[K]>;
	};

type NegotiateDefaultStrategy<T> = T extends ColumnSymbols ? T : never;

type RemoveNever<T> = {
	[K in keyof T as T[K] extends never ? never : K]: T[K] extends object
	? RemoveNever<T[K]>
	: T[K];
};

type RemoveNeverFlat<T> = {
	[K in keyof T as T[K] extends never ? never : K]: T[K];
};

type UuidColumnSymbol = {
	[' isUuid']: true;
};
type UuidColumnType<M> = {
	equal(value: string | null | undefined): Filter;
	eq(value: string | null | undefined): Filter;
	notEqual(value: string | null | undefined): Filter;
	ne(value: string | null | undefined): Filter;
	lessThan(value: string | null | undefined): Filter;
	lt(value: string | null | undefined): Filter;
	lessThanOrEqual(value: string | null | undefined): Filter;
	le(value: string | null | undefined): Filter;
	greaterThan(value: string | null | undefined): Filter;
	gt(value: string | null | undefined): Filter;
	greaterThanOrEqual(value: string | null | undefined): Filter;
	ge(value: string | null | undefined): Filter;
	between(from: string | null | undefined, to: string | null | undefined): Filter;
	in(values: Array<string | null | undefined>): Filter;
} & M &
	UuidColumnSymbol;

type BinaryColumnSymbol = {
	[' isBinary']: true;
};
type BinaryColumnType<M> = {
	equal(value: string | null | undefined): Filter;
	eq(value: string | null | undefined): Filter;
	notEqual(value: string | null | undefined): Filter;
	ne(value: string | null | undefined): Filter;
	lessThan(value: string | null | undefined): Filter;
	lt(value: string | null | undefined): Filter;
	lessThanOrEqual(value: string | null | undefined): Filter;
	le(value: string | null | undefined): Filter;
	greaterThan(value: string | null | undefined): Filter;
	gt(value: string | null | undefined): Filter;
	greaterThanOrEqual(value: string | null | undefined): Filter;
	ge(value: string | null | undefined): Filter;
	between(from: string | null | undefined, to: string | null | undefined): Filter;
	in(values: Array<string | null | undefined>): Filter;
} & M &
	BinaryColumnSymbol;

type BooleanColumnSymbol = {
	[' isBoolean']: true;
};

type BooleanColumnType<M> = {
	equal(value: boolean | null | undefined): Filter;
	eq(value: boolean | null | undefined): Filter;
	notEqual(value: boolean | null | undefined): Filter;
	ne(value: boolean | null | undefined): Filter;
	lessThan(value: boolean | null | undefined): Filter;
	lt(value: boolean | null | undefined): Filter;
	lessThanOrEqual(value: boolean | null | undefined): Filter;
	le(value: boolean | null | undefined): Filter;
	greaterThan(value: boolean | null | undefined): Filter;
	gt(value: boolean | null | undefined): Filter;
	greaterThanOrEqual(value: boolean | null | undefined): Filter;
	ge(value: boolean | null | undefined): Filter;
	between(from: boolean | null | undefined, to: boolean | null | undefined): Filter;
	in(values: Array<boolean | null | undefined>): Filter;
} & M &
	BooleanColumnSymbol;

type DateColumnSymbol = {
	[' isDate']: true;
};

type DateColumnType<M> = {
	equal(value: string | Date | null | undefined): Filter;
	eq(value: string | Date | null | undefined): Filter;
	notEqual(value: string | Date | null | undefined): Filter;
	ne(value: string | Date | null | undefined): Filter;
	lessThan(value: string | Date | null | undefined): Filter;
	lt(value: string | Date | null | undefined): Filter;
	lessThanOrEqual(value: string | Date | null | undefined): Filter;
	le(value: string | Date | null | undefined): Filter;
	greaterThan(value: string | Date | null | undefined): Filter;
	gt(value: string | Date | null | undefined): Filter;
	greaterThanOrEqual(value: string | Date | null | undefined): Filter;
	ge(value: string | Date | null | undefined): Filter;
	between(from: string | Date, to: string | Date | null | undefined): Filter;
	in(values: Array<string | Date | null | undefined>): Filter;
} & M &
DateColumnSymbol;

type DateWithTimeZoneColumnSymbol = {
	[' isDateTimeZone']: true;
};

type DateWithTimeZoneColumnType<M> = {
	equal(value: string | Date | null | undefined): Filter;
	eq(value: string | Date | null | undefined): Filter;
	notEqual(value: string | Date | null | undefined): Filter;
	ne(value: string | Date | null | undefined): Filter;
	lessThan(value: string | Date | null | undefined): Filter;
	lt(value: string | Date | null | undefined): Filter;
	lessThanOrEqual(value: string | Date | null | undefined): Filter;
	le(value: string | Date | null | undefined): Filter;
	greaterThan(value: string | Date | null | undefined): Filter;
	gt(value: string | Date | null | undefined): Filter;
	greaterThanOrEqual(value: string | Date | null | undefined): Filter;
	ge(value: string | Date | null | undefined): Filter;
	between(from: string | Date, to: string | Date | null | undefined): Filter;
	in(values: Array<string | Date | null | undefined>): Filter;
} & M &
	DateWithTimeZoneColumnSymbol;

type StringColumnSymbol = {
	[' isString']: true;
};

type StringColumnType<M> = {
	equal(value: string | null | undefined): Filter;
	eq(value: string | null | undefined): Filter;
	notEqual(value: string | null | undefined): Filter;
	ne(value: string | null | undefined): Filter;
	lessThan(value: string | null | undefined): Filter;
	lt(value: string | null | undefined): Filter;
	lessThanOrEqual(value: string | null | undefined): Filter;
	le(value: string | null | undefined): Filter;
	greaterThan(value: string | null | undefined): Filter;
	gt(value: string | null | undefined): Filter;
	greaterThanOrEqual(value: string | null | undefined): Filter;
	ge(value: string | null | undefined): Filter;
	between(from: string | null | undefined, to: string | null | undefined): Filter;
	in(values: Array<string | null | undefined>): Filter;

	startsWith(value: string | null | undefined): Filter;
	endsWith(value: string | null | undefined): Filter;
	contains(value: string | null | undefined): Filter;
	iStartsWith(value: string | null | undefined): Filter;
	iEndsWith(value: string | null | undefined): Filter;
	iContains(value: string | null | undefined): Filter;
	iEqual(value: string | null | undefined): Filter;
	ieq(value: string | null | undefined): Filter;
} & M &
	StringColumnSymbol;

type NumericColumnSymbol = {
	[' isNumeric']: true;
};
type NumericColumnType<M> = {
	equal(value: number | null | undefined): Filter;
	eq(value: number | null | undefined): Filter;
	notEqual(value: number | null | undefined): Filter;
	ne(value: number | null | undefined): Filter;
	lessThan(value: number | null | undefined): Filter;
	lt(value: number | null | undefined): Filter;
	lessThanOrEqual(value: number | null | undefined): Filter;
	le(value: number | null | undefined): Filter;
	greaterThan(value: number | null | undefined): Filter;
	gt(value: number | null | undefined): Filter;
	greaterThanOrEqual(value: number | null | undefined): Filter;
	ge(value: number | null | undefined): Filter;
	between(from: number, to: number | null | undefined): Filter;
	in(values: Array<number | null | undefined>): Filter;
} & M &
	NumericColumnSymbol;

type JSONColumnSymbol = {
	[' isJSON']: true;
};

type JSONColumnType<M> = {
	equal(value: ToJsonType<M> | null | undefined): Filter;
	eq(value: ToJsonType<M> | null | undefined): Filter;
	notEqual(value: ToJsonType<M> | null | undefined): Filter;
	ne(value: ToJsonType<M> | null | undefined): Filter;
	lessThan(value: ToJsonType<M> | null | undefined): Filter;
	lt(value: ToJsonType<M> | null | undefined): Filter;
	lessThanOrEqual(value: ToJsonType<M> | null | undefined): Filter;
	le(value: ToJsonType<M> | null | undefined): Filter;
	greaterThan(value: ToJsonType<M> | null | undefined): Filter;
	gt(value: ToJsonType<M> | null | undefined): Filter;
	greaterThanOrEqual(value: ToJsonType<M> | null | undefined): Filter;
	ge(value: ToJsonType<M> | null | undefined): Filter;
	between(from: ToJsonType<M>, to: ToJsonType<M> | null | undefined): Filter;
	in(values: Array<ToJsonType<M> | null | undefined>): Filter;
} & M &
	JSONColumnSymbol;

interface IsPrimary {
	[' isPrimary']: boolean;
}

type NotNull = {
	[' notNull']: boolean;
};

type NotNullExceptInsert = {
	[' notNullExceptInsert']: boolean;
};

type JsonOf<T> = {
	[' isjsonOf']: boolean;
	type: T;
};

interface ColumnType<M> {
	string(): StringColumnTypeDef<M & StringColumnSymbol>;
	uuid(): UuidColumnTypeDef<M & UuidColumnSymbol>;
	numeric(): NumericColumnTypeDef<M & NumericColumnSymbol>;
	date(): DateColumnTypeDef<M & DateColumnSymbol>;
	dateWithTimeZone(): DateWithTimeZoneColumnTypeDef<M & DateWithTimeZoneColumnSymbol>;
	binary(): BinaryColumnTypeDef<M & BinaryColumnSymbol>;
	boolean(): BooleanColumnTypeDef<M & BooleanColumnSymbol>;
	json(): JSONColumnTypeDef<M & JSONColumnSymbol>;
	jsonOf<T>(): JSONColumnTypeDef<M & JSONColumnSymbol & JsonOf<T>>;
	jsonOf<T>(helper: T): JSONColumnTypeDef<M & JSONColumnSymbol & JsonOf<T>>;
}

type UuidValidator<M> = M extends NotNull
	? {
		validate(validator: (value: string) => void): UuidColumnTypeDef<M>;
	}
	: {
		validate(
			validator: (value?: string | null) => void
		): UuidColumnTypeDef<M>;
	};
type StringValidator<M> = M extends NotNull
	? {
		validate(validator: (value: string) => void): StringColumnTypeDef<M>;
	}
	: {
		validate(
			validator: (value?: string | null) => void
		): StringColumnTypeDef<M>;
	};
type NumericValidator<M> = M extends NotNull
	? {
		validate(validator: (value: number) => void): NumericColumnTypeDef<M>;
	}
	: {
		validate(
			validator: (value?: number | null) => void
		): NumericColumnTypeDef<M>;
	};
type BinaryValidator<M> = M extends NotNull
	? {
		validate(validator: (value: string) => void): BinaryColumnTypeDef<M>;
	}
	: {
		validate(
			validator: (value?: string | null) => void
		): BinaryColumnTypeDef<M>;
	};
type BooleanValidator<M> = M extends NotNull
	? {
		validate(validator: (value: boolean) => void): BooleanColumnTypeDef<M>;
	}
	: {
		validate(
			validator: (value?: boolean | null) => void
		): BooleanColumnTypeDef<M>;
	};
type JSONValidator<M> = M extends NotNull
	? {
		validate(
			validator: (value: ToJsonType<M>) => void
		): JSONColumnTypeDef<M>;
	}
	: {
		validate(
			validator: (value?: ToJsonType<M> | null) => void
		): JSONColumnTypeDef<M>;
	};
type DateValidator<M> = M extends NotNull
	? {
		validate(
			validator: (value: string | Date) => void
		): DateColumnTypeDef<M>;
	}
	: {
		validate(
			validator: (value?: string | Date | null) => void
		): DateColumnTypeDef<M>;
	};

type DateWithTimeZoneValidator<M> = M extends NotNull
	? {
		validate(
			validator: (value: string | Date) => void
		): DateWithTimeZoneColumnTypeDef<M>;
	}
	: {
		validate(
			validator: (value?: string | Date | null) => void
		): DateWithTimeZoneColumnTypeDef<M>;
	};

type StringColumnTypeDef<M> = StringValidator<M> & {
	primary(): StringColumnTypeDef<M & IsPrimary> & IsPrimary;
	notNull(): StringColumnTypeDef<M & NotNull> & NotNull;
	notNullExceptInsert(): StringColumnTypeDef<M & NotNull & NotNullExceptInsert> & NotNull & NotNullExceptInsert;
	serializable(value: boolean): StringColumnTypeDef<M>;
	JSONSchema(schema: object, options?: Options): StringColumnTypeDef<M>;
	default(value: string | (() => string)): StringColumnTypeDef<M>;
	dbNull(value: string): StringColumnTypeDef<M>;
} & ColumnTypeOf<StringColumnType<M>> &
	M;

type NumericColumnTypeDef<M> = NumericValidator<M> & {
	primary(): NumericColumnTypeDef<M & IsPrimary> & IsPrimary;
	notNull(): NumericColumnTypeDef<M & NotNull> & NotNull;
	notNullExceptInsert(): NumericColumnTypeDef<M & NotNull & NotNullExceptInsert> & NotNull & NotNullExceptInsert;
	serializable(value: boolean): NumericColumnTypeDef<M>;
	JSONSchema(schema: object, options?: Options): NumericColumnTypeDef<M>;
	default(value: number | (() => string)): NumericColumnTypeDef<M>;
	dbNull(value: number): NumericColumnTypeDef<M>;
} & ColumnTypeOf<NumericColumnType<M>> &
	M;

type UuidColumnTypeDef<M> = UuidValidator<M> & {
	primary(): UuidColumnTypeDef<M & IsPrimary> & IsPrimary;
	notNull(): UuidColumnTypeDef<M & NotNull> & NotNull;
	notNullExceptInsert(): UuidColumnTypeDef<M & NotNull & NotNullExceptInsert> & NotNull & NotNullExceptInsert;
	serializable(value: boolean): UuidColumnTypeDef<M>;
	JSONSchema(schema: object, options?: Options): UuidColumnTypeDef<M>;
	default(value: string | (() => string)): UuidColumnTypeDef<M>;
	dbNull(value: string): UuidColumnTypeDef<M>;
} & ColumnTypeOf<UuidColumnType<M>> &
	M;

type JSONColumnTypeDef<M> = JSONValidator<M> & {
	primary(): JSONColumnTypeDef<M & IsPrimary> & IsPrimary;
	notNull(): JSONColumnTypeDef<M & NotNull> & NotNull;
	notNullExceptInsert(): JSONColumnTypeDef<M & NotNull & NotNullExceptInsert> & NotNull & NotNullExceptInsert;
	serializable(value: boolean): JSONColumnTypeDef<M>;
	JSONSchema(schema: object, options?: Options): JSONColumnTypeDef<M>;
	default(value: ToJsonType<M> | (() => string)): JSONColumnTypeDef<M>;
	dbNull(value: ToJsonType<M>): JSONColumnTypeDef<M>;
} & ColumnTypeOf<JSONColumnType<M>> &
	M;

type BinaryColumnTypeDef<M> = BinaryValidator<M> & {
	primary(): BinaryColumnTypeDef<M & IsPrimary> & IsPrimary;
	notNull(): BinaryColumnTypeDef<M & NotNull> & NotNull;
	notNullExceptInsert(): BinaryColumnTypeDef<M & NotNull & NotNullExceptInsert> & NotNull & NotNullExceptInsert;
	serializable(value: boolean): BinaryColumnTypeDef<M>;
	JSONSchema(schema: object, options?: Options): BinaryColumnTypeDef<M>;
	default(value: string | (() => string)): BinaryColumnTypeDef<M>;
	dbNull(value: string): BinaryColumnTypeDef<M>;
} & ColumnTypeOf<BinaryColumnType<M>> &
	M;

type BooleanColumnTypeDef<M> = BooleanValidator<M> & {
	primary(): BooleanColumnTypeDef<M & IsPrimary> & IsPrimary;
	notNull(): BooleanColumnTypeDef<M & NotNull> & NotNull;
	notNullExceptInsert(): BooleanColumnTypeDef<M & NotNull & NotNullExceptInsert> & NotNull & NotNullExceptInsert;
	serializable(value: boolean): BooleanColumnTypeDef<M>;
	JSONSchema(schema: object, options?: Options): BooleanColumnTypeDef<M>;
	default(value: boolean | (() => string)): BooleanColumnTypeDef<M>;
	dbNull(value: boolean): BooleanColumnTypeDef<M>;
} & ColumnTypeOf<BooleanColumnType<M>> &
	M;

type DateColumnTypeDef<M> = DateValidator<M> & {
	primary(): DateColumnTypeDef<M & IsPrimary> & IsPrimary;
	notNull(): DateColumnTypeDef<M & NotNull> & NotNull;
	notNullExceptInsert(): DateColumnTypeDef<M & NotNull & NotNullExceptInsert> & NotNull & NotNullExceptInsert;
	serializable(value: boolean): DateColumnTypeDef<M>;
	JSONSchema(schema: object, options?: Options): DateColumnTypeDef<M>;
	default(value: string | Date | (() => string | Date)): DateColumnTypeDef<M>;
	dbNull(value: String | Date): DateColumnTypeDef<M>;
} & ColumnTypeOf<DateColumnType<M>> &
	M;

type DateWithTimeZoneColumnTypeDef<M> = DateValidator<M> & {
	primary(): DateWithTimeZoneColumnTypeDef<M & IsPrimary> & IsPrimary;
	notNull(): DateWithTimeZoneColumnTypeDef<M & NotNull> & NotNull;
	notNullExceptInsert(): DateWithTimeZoneColumnTypeDef<M & NotNull & NotNullExceptInsert> & NotNull & NotNullExceptInsert;
	serializable(value: boolean): DateWithTimeZoneColumnTypeDef<M>;
	JSONSchema(schema: object, options?: Options): DateWithTimeZoneColumnTypeDef<M>;
	default(value: string | Date | (() => string | Date)): DateWithTimeZoneColumnTypeDef<M>;
	dbNull(value: String | Date): DateWithTimeZoneColumnTypeDef<M>;
} & ColumnTypeOf<DateWithTimeZoneColumnType<M>> &
	M;

interface ColumnTypeOf<T> {
	[' type']: T;
}

type MapPropertiesTo1<T, V extends number = 1> = { [K in keyof T]: V };
type MapPropertiesTo2<T, V extends number = 2> = {
	[K in keyof T]: UnionOfTypes<MapPropertiesTo1<Omit<T, K>, V>>;
};
type MapPropertiesTo3<T, V extends number = 3> = {
	[K in keyof T]: UnionOfTypes<MapPropertiesTo2<Omit<T, K>, V>>;
};
type MapPropertiesTo4<T, V extends number = 4> = {
	[K in keyof T]: UnionOfTypes<MapPropertiesTo3<Omit<T, K>, V>>;
};
type MapPropertiesTo5<T, V extends number = 5> = {
	[K in keyof T]: UnionOfTypes<MapPropertiesTo4<Omit<T, K>, V>>;
};
type MapPropertiesTo6<T, V extends number = 6> = {
	[K in keyof T]: UnionOfTypes<MapPropertiesTo5<Omit<T, K>, V>>;
};
type UnionOfTypes<T> = T[keyof T];
// type CountProperties<T> = UnionOfTypes<MapPropertiesTo6<T>> | UnionOfTypes<MapPropertiesTo5<T>> | UnionOfTypes<MapPropertiesTo4<T>> | UnionOfTypes<MapPropertiesTo3<T>> | UnionOfTypes<MapPropertiesTo2<T>> | UnionOfTypes<MapPropertiesTo1<T>>;

interface RawFilter {
	sql: string | (() => string);
	parameters?: any[];
}

interface Filter extends RawFilter {
	and(filter: Filter, ...filters: Filter[]): Filter;
	or(filter: Filter, ...filters: Filter[]): Filter;
	not(): Filter;
}

type UnionToIntersection<U> = (
	U extends any ? (k: U) => void : never
) extends (k: infer I) => void
	? I
	: never;

type PopFront<T extends any[]> = ((...t: T) => void) extends (
	_: any,
	...rest: infer R
) => void
	? R
	: never;

type TupleToUnion<T extends any[]> = T extends (infer First)[]
	? First
	: T extends []
	? never
	: T extends [infer First, ...infer Rest]
	? First | TupleToUnion<Rest>
	: never;

type First<T extends any[]> = T extends [infer Target, ...any[]]
	? Target
	: never;

type UnionToTuple<T> = UnionToIntersection<
	T extends any ? (t: T) => void : never
> extends (t: infer T1) => void
	? [...UnionToTuple<Exclude<T, T1>>, T1]
	: [];

type FirstOfUnion<T> = First<UnionToTuple<T>>;

type ToKeyObjects<T> = {
	[K in keyof T]: { name: K; value: T[K] };
}[keyof T];

type ToKeys<T> = {
	[K in keyof T]: K;
}[keyof T];

type GetKeys<T> = {
	[K in keyof T]: T[K];
}[keyof T];

type ToUnionTuple<T> = UnionToTuple<ToKeyObjects<T>>;
type PropertyToTuple<T> = FirstOfUnion<ToKeyObjects<T>>;

type PickProperty<T> = PropertyToTuple<T>;
type PickProperty2<T> = FirstOfUnion<TupleToUnion<PopFront<ToUnionTuple<T>>>>;
type PickProperty3<T> = FirstOfUnion<
	TupleToUnion<PopFront<PopFront<ToUnionTuple<T>>>>
>;
type PickProperty4<T> = FirstOfUnion<
	TupleToUnion<PopFront<PopFront<PopFront<ToUnionTuple<T>>>>>
>;
type PickProperty5<T> = FirstOfUnion<
	TupleToUnion<PopFront<PopFront<PopFront<PopFront<ToUnionTuple<T>>>>>>
>;
type PickProperty6<T> = FirstOfUnion<
	TupleToUnion<
		PopFront<PopFront<PopFront<PopFront<PopFront<ToUnionTuple<T>>>>>>
	>
>;

type PickPropertyName1<T> = GetKeys<Omit<PickProperty<T>, 'value'>>;
type PickPropertyName2<T> = GetKeys<Omit<PickProperty2<T>, 'value'>>;
type PickPropertyName3<T> = GetKeys<Omit<PickProperty3<T>, 'value'>>;
type PickPropertyName4<T> = GetKeys<Omit<PickProperty4<T>, 'value'>>;
type PickPropertyName5<T> = GetKeys<Omit<PickProperty5<T>, 'value'>>;
type PickPropertyName6<T> = GetKeys<Omit<PickProperty6<T>, 'value'>>;

type PickPropertyValue1<T> = GetKeys<Omit<PickProperty<T>, 'name'>>;
type PickPropertyValue2<T> = GetKeys<Omit<PickProperty2<T>, 'name'>>;
type PickPropertyValue3<T> = GetKeys<Omit<PickProperty3<T>, 'name'>>;
type PickPropertyValue4<T> = GetKeys<Omit<PickProperty4<T>, 'name'>>;
type PickPropertyValue5<T> = GetKeys<Omit<PickProperty5<T>, 'name'>>;
type PickPropertyValue6<T> = GetKeys<Omit<PickProperty6<T>, 'name'>>;

type CountProperties<T> = CountPropertiesHelper<UnionToTuple<ToKeys<T>>>;
type CountPropertiesHelper<
	T extends any[],
	C extends number = 0
> = T extends [] ? C : CountPropertiesHelper<PopFront<T>, Increment<C>>;

type Increment<C extends number> = C extends 0
	? 1
	: C extends 1
	? 2
	: C extends 2
	? 3
	: C extends 3
	? 4
	: C extends 4
	? 5
	: 0;