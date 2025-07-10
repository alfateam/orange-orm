import type { Options } from './ajv';
import type { PGliteOptions } from './pglite.d.ts';
import type { ConnectionConfiguration } from 'tedious';
import type { D1Database } from '@cloudflare/workers-types';
import type { PoolAttributes } from 'oracledb';
import type { DBClient } from './map2';

export type MergeProperties<T, V> = {
	[K in keyof T | keyof V]:
	K extends keyof T
	? T[K] extends MappedTableDef<infer M>
	? K extends keyof V
	? V[K] extends MappedTableDef<infer N>
	? MappedTableDef<M & N & TableAlias<K>>
	: V[K]
	: T[K]
	: T[K]
	: K extends keyof V
	? V[K] extends MappedTableDef<infer N>
	? MappedTableDef<N & TableAlias<K>>
	: V[K]
	: never;
};

export type DbMapper<T> = {
	table(tableName: string): MappedTableDefInit<{}>;
} & T;

type MappedDb<T> = {
	<O extends DbOptions<T>>(concurrency: O): NegotiateDbInstance<T, O>;
} & DbConnectable<T>;

type DbConnectable<T> = {
	http(url: string): DBClient<SchemaFromMappedDb<T>>;
	d1(database: D1Database): DBClient<SchemaFromMappedDb<T>>;
	postgres(connectionString: string, options?: PoolOptions): DBClient<SchemaFromMappedDb<T>>;
	pglite(config?: PGliteOptions| string | undefined, options?: PoolOptions): DBClient<SchemaFromMappedDb<T>>;
	sqlite(connectionString: string, options?: PoolOptions): DBClient<SchemaFromMappedDb<T>>;
	sap(connectionString: string, options?: PoolOptions): DBClient<SchemaFromMappedDb<T>>;
	mssql(connectionConfig: ConnectionConfiguration, options?: PoolOptions): DBClient<SchemaFromMappedDb<T>>;
	mssql(connectionString: string, options?: PoolOptions): DBClient<SchemaFromMappedDb<T>>;
	mssqlNative(connectionString: string, options?: PoolOptions): DBClient<SchemaFromMappedDb<T>>;
	mysql(connectionString: string, options?: PoolOptions): DBClient<SchemaFromMappedDb<T>>;
	oracle(config: PoolAttributes, options?: PoolOptions): DBClient<SchemaFromMappedDb<T>>;
};

type NegotiateDbInstance<T, C> = C extends WithDb
	? DBClient<SchemaFromMappedDb<T>>
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
	d1(database: D1Database): Pool;
	postgres(connectionString: string, options?: PoolOptions): Pool;
	pglite(config?: PGliteOptions| string | undefined, options?: PoolOptions): Pool;
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

type JsonPatch = Array<{
	op: 'add' | 'remove' | 'replace' | 'copy' | 'move' | 'test';
	path: string;
	value?: any;
	from?: string;
}>;

type ToJsonType<M> = M extends JsonOf<infer N> ? N : JsonType;

type ReturnArrayOrObj<W, V1, V2> =
	W extends any[] ? V2 :
	V1;


type ColumnToType<T> = T extends UuidColumnSymbol
	? string
	: T extends StringColumnSymbol
	? string
	: T extends NumericColumnSymbol
	? number
	: T extends DateColumnSymbol
	? string | Date
	: T extends DateWithTimeZoneColumnSymbol
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

export type AllowedDbMap<T> = {
	[P in keyof T]: T[P] extends MappedTableDef<infer U> ? T[P] : never;
};

type AllowedColumnsAndTablesStrategy<T> = {
	[P in keyof T]: T[P] extends ColumnAndTableTypes ? T[P] : never;
};
type AllowedColumnsAndTablesConcurrency<T> = {
	[P in keyof T]: T[P] extends ColumnAndTableTypes ? T[P] : never;
};



type RelatedColumns<T> = RemoveNeverFlat<{
	[K in keyof T]:
	T[K] extends StringColumnTypeDef<infer M> ? StringColumnSymbol
	: T[K] extends UuidColumnTypeDef<infer M> ? UuidColumnSymbol
	: T[K] extends NumericColumnTypeDef<infer M> ? NumericColumnSymbol
	: T[K] extends DateColumnTypeDef<infer M> ? DateColumnSymbol
	: T[K] extends DateWithTimeZoneColumnTypeDef<infer M> ? DateWithTimeZoneColumnSymbol
	: T[K] extends BinaryColumnTypeDef<infer M> ? BinaryColumnSymbol
	: T[K] extends BooleanColumnTypeDef<infer M> ? BooleanColumnSymbol
	: T[K] extends JSONColumnTypeDef<infer M> ? JSONColumnSymbol
	: T[K] extends ManyRelation
	? RelatedColumns<T[K]>
	: T[K] extends RelatedTable
	? RelatedColumns<T[K]>
	: never;
}>;

type AggregateColumns<T> = RemoveNeverFlat<{
	[K in keyof T]:
	T[K] extends NumericColumnTypeDef<infer M> ? NumericColumnSymbol
	: T[K] extends ManyRelation
	? AggregateColumns<T[K]>
	: T[K] extends RelatedTable
	? AggregateColumns<T[K]>
	: never;
}>;

type TablesDeep<T> = RemoveNeverFlat<{
	[K in keyof T]:
	T[K] extends ManyRelation
	? TablesDeep<T[K]>
	: T[K] extends RelatedTable
	? TablesDeep<T[K]>
	: never;
}>;

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
	concurrency?: ConcurrencyValues;
};

type DbConcurrency<T> = {
	[K in keyof T]: T[K] extends MappedTableDef<infer U>
	? Concurrency<U>
	: never;
} & {
	readonly?: boolean;
	concurrency?: ConcurrencyValues;
};


type ConcurrencyValues = 'optimistic' | 'skipOnConflict' | 'overwrite';


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
		): MappedTableDef<TTo> & RelatedTable & NotNullRelationHelper<MappedTableDef<TTo> & RelatedTable>;
	}
	: 5 extends TPrimaryCount
	? {
		by<C1 extends keyof KeyCandidates1<TFrom, TTo>, C2 extends keyof KeyCandidates2<TFrom, TTo>, C3 extends keyof KeyCandidates2<TFrom, TTo>, C4 extends keyof KeyCandidates2<TFrom, TTo>, C5 extends keyof KeyCandidates2<TFrom, TTo>>(
			column: C1,
			column2: C2,
			column3: C3,
			column4: C4,
			column5: C5
		): MappedTableDef<TTo> & RelatedTable & NotNullRelationHelper<MappedTableDef<TTo> & RelatedTable>;
	}
	: 4 extends TPrimaryCount
	? {
		by<C1 extends keyof KeyCandidates1<TFrom, TTo>, C2 extends keyof KeyCandidates2<TFrom, TTo>, C3 extends keyof KeyCandidates2<TFrom, TTo>, C4 extends keyof KeyCandidates2<TFrom, TTo>>(
			column: C1,
			column2: C2,
			column3: C3,
			column4: C4
		): MappedTableDef<TTo> & RelatedTable & NotNullRelationHelper<MappedTableDef<TTo> & RelatedTable>;
	}
	: 3 extends TPrimaryCount
	? {
		by<C1 extends keyof KeyCandidates1<TFrom, TTo>, C2 extends keyof KeyCandidates2<TFrom, TTo>, C3 extends keyof KeyCandidates2<TFrom, TTo>>(
			column: C1,
			column2: C2,
			column3: C3
		): MappedTableDef<TTo> & RelatedTable & NotNullRelationHelper<MappedTableDef<TTo> & RelatedTable>;
	}
	: 2 extends TPrimaryCount
	? {
		by<C1 extends keyof KeyCandidates1<TFrom, TTo>, C2 extends keyof KeyCandidates2<TFrom, TTo>>(
			column: C1,
			column2: C2
		): MappedTableDef<TTo> & RelatedTable & NotNullRelationHelper<MappedTableDef<TTo> & RelatedTable>;
	}
	: 1 extends TPrimaryCount
	? {
		by<C1 extends keyof KeyCandidates1<TFrom, TTo>>(
			column: C1
		): MappedTableDef<TTo> & RelatedTable & NotNullRelationHelper<MappedTableDef<TTo> & RelatedTable>;
	}
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
		): MappedTableDef<TTo> & RelatedTable & TExtra & NotNullRelationHelper<MappedTableDef<TTo> & RelatedTable & TExtra>;
	}
	: 5 extends TPrimaryCount
	? {
		by(
			column: keyof KeyCandidates1<TTo, TFrom>,
			column2: keyof KeyCandidates2<TTo, TFrom>,
			column3: keyof KeyCandidates3<TTo, TFrom>,
			column4: keyof KeyCandidates4<TTo, TFrom>,
			column5: keyof KeyCandidates5<TTo, TFrom>
		): MappedTableDef<TTo> & RelatedTable & TExtra & NotNullRelationHelper<MappedTableDef<TTo> & RelatedTable & TExtra>;
	}
	: 4 extends TPrimaryCount
	? {
		by(
			column: keyof KeyCandidates1<TTo, TFrom>,
			column2: keyof KeyCandidates2<TTo, TFrom>,
			column3: keyof KeyCandidates3<TTo, TFrom>,
			column4: keyof KeyCandidates4<TTo, TFrom>
		): MappedTableDef<TTo> & RelatedTable & TExtra & NotNullRelationHelper<MappedTableDef<TTo> & RelatedTable & TExtra>;
	}
	: 3 extends TPrimaryCount
	? {
		by(
			column: keyof KeyCandidates1<TTo, TFrom>,
			column2: keyof KeyCandidates2<TTo, TFrom>,
			column3: keyof KeyCandidates3<TTo, TFrom>
		): MappedTableDef<TTo> & RelatedTable & TExtra & NotNullRelationHelper<MappedTableDef<TTo> & RelatedTable & TExtra>;
	}
	: 2 extends TPrimaryCount
	? {
		by(
			column: keyof KeyCandidates1<TTo, TFrom>,
			column2: keyof KeyCandidates2<TTo, TFrom>
		): MappedTableDef<TTo> & RelatedTable & TExtra & NotNullRelationHelper<MappedTableDef<TTo> & RelatedTable & TExtra>;
	}
	: 1 extends TPrimaryCount
	? {
		by(
			column: keyof KeyCandidates1<TTo, TFrom>
		): MappedTableDef<TTo> & RelatedTable & TExtra & NotNullRelationHelper<MappedTableDef<TTo> & RelatedTable & TExtra>;
	}
	: {};

type NotNullRelationHelper<T> = {
	notNull(): T & NotNull;
}

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
	{ [K in keyof T]: T[K] extends NotNull ? K : T[K] extends ManyRelation ? K : never }[keyof T]
>;


type NullProperties<T> = Pick<
	T,
	{ [K in keyof T]: T[K] extends NotNull | ManyRelation ? never : K }[keyof T]
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
type UuidColumnType<M> = M &
	UuidColumnSymbol;

type BinaryColumnSymbol = {
	[' isBinary']: true;
};
type BinaryColumnType<M> = M &
	BinaryColumnSymbol;

type BooleanColumnSymbol = {
	[' isBoolean']: true;
};

type BooleanColumnType<M> = M &
	BooleanColumnSymbol;

type DateColumnSymbol = {
	[' isDate']: true;
};

type DateColumnType<M> = M &
	DateColumnSymbol;

type DateWithTimeZoneColumnSymbol = {
	[' isDateTimeZone']: true;
};

type DateWithTimeZoneColumnType<M> = M &
	DateWithTimeZoneColumnSymbol;

type StringColumnSymbol = {
	[' isString']: true;
};

type StringColumnType<M> = M &
	StringColumnSymbol;

type NumericColumnSymbol = {
	[' isNumeric']: true;
};
type NumericColumnType<M> = M &
	NumericColumnSymbol;

type JSONColumnSymbol = {
	[' isJSON']: true;
};

type JSONColumnType<M> =  M &
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
	default(value: string | null | undefined | (() => string | null | undefined)): StringColumnTypeDef<M>;
	dbNull(value: string): StringColumnTypeDef<M>;
} & ColumnTypeOf<StringColumnType<M>> &
	M;

type NumericColumnTypeDef<M> = NumericValidator<M> & {
	primary(): NumericColumnTypeDef<M & IsPrimary> & IsPrimary;
	notNull(): NumericColumnTypeDef<M & NotNull> & NotNull;
	notNullExceptInsert(): NumericColumnTypeDef<M & NotNull & NotNullExceptInsert> & NotNull & NotNullExceptInsert;
	serializable(value: boolean): NumericColumnTypeDef<M>;
	JSONSchema(schema: object, options?: Options): NumericColumnTypeDef<M>;
	default(value: number | null | undefined | (() => string | null | undefined)): NumericColumnTypeDef<M>;
	dbNull(value: number): NumericColumnTypeDef<M>;
} & ColumnTypeOf<NumericColumnType<M>> &
	M;

type UuidColumnTypeDef<M> = UuidValidator<M> & {
	primary(): UuidColumnTypeDef<M & IsPrimary> & IsPrimary;
	notNull(): UuidColumnTypeDef<M & NotNull> & NotNull;
	notNullExceptInsert(): UuidColumnTypeDef<M & NotNull & NotNullExceptInsert> & NotNull & NotNullExceptInsert;
	serializable(value: boolean): UuidColumnTypeDef<M>;
	JSONSchema(schema: object, options?: Options): UuidColumnTypeDef<M>;
	default(value: string | null | undefined | (() => string | null | undefined)): UuidColumnTypeDef<M>;
	dbNull(value: string): UuidColumnTypeDef<M>;
} & ColumnTypeOf<UuidColumnType<M>> &
	M;

type JSONColumnTypeDef<M> = JSONValidator<M> & {
	primary(): JSONColumnTypeDef<M & IsPrimary> & IsPrimary;
	notNull(): JSONColumnTypeDef<M & NotNull> & NotNull;
	notNullExceptInsert(): JSONColumnTypeDef<M & NotNull & NotNullExceptInsert> & NotNull & NotNullExceptInsert;
	serializable(value: boolean): JSONColumnTypeDef<M>;
	JSONSchema(schema: object, options?: Options): JSONColumnTypeDef<M>;
	default(value: ToJsonType<M> | null | undefined | (() => string | null | undefined)): JSONColumnTypeDef<M>;
	dbNull(value: ToJsonType<M>): JSONColumnTypeDef<M>;
} & ColumnTypeOf<JSONColumnType<M>> &
	M;

type BinaryColumnTypeDef<M> = BinaryValidator<M> & {
	primary(): BinaryColumnTypeDef<M & IsPrimary> & IsPrimary;
	notNull(): BinaryColumnTypeDef<M & NotNull> & NotNull;
	notNullExceptInsert(): BinaryColumnTypeDef<M & NotNull & NotNullExceptInsert> & NotNull & NotNullExceptInsert;
	serializable(value: boolean): BinaryColumnTypeDef<M>;
	JSONSchema(schema: object, options?: Options): BinaryColumnTypeDef<M>;
	default(value: string | null | undefined | (() => string | null | undefined)): BinaryColumnTypeDef<M>;
	dbNull(value: string): BinaryColumnTypeDef<M>;
} & ColumnTypeOf<BinaryColumnType<M>> &
	M;

type BooleanColumnTypeDef<M> = BooleanValidator<M> & {
	primary(): BooleanColumnTypeDef<M & IsPrimary> & IsPrimary;
	notNull(): BooleanColumnTypeDef<M & NotNull> & NotNull;
	notNullExceptInsert(): BooleanColumnTypeDef<M & NotNull & NotNullExceptInsert> & NotNull & NotNullExceptInsert;
	serializable(value: boolean): BooleanColumnTypeDef<M>;
	JSONSchema(schema: object, options?: Options): BooleanColumnTypeDef<M>;
	default(value: boolean | null | undefined | (() => string | null | undefined)): BooleanColumnTypeDef<M>;
	dbNull(value: boolean): BooleanColumnTypeDef<M>;
} & ColumnTypeOf<BooleanColumnType<M>> &
	M;

type DateColumnTypeDef<M> = DateValidator<M> & {
	primary(): DateColumnTypeDef<M & IsPrimary> & IsPrimary;
	notNull(): DateColumnTypeDef<M & NotNull> & NotNull;
	notNullExceptInsert(): DateColumnTypeDef<M & NotNull & NotNullExceptInsert> & NotNull & NotNullExceptInsert;
	serializable(value: boolean): DateColumnTypeDef<M>;
	JSONSchema(schema: object, options?: Options): DateColumnTypeDef<M>;
	default(value: string | Date | null | undefined | (() => string | Date | null | undefined)): DateColumnTypeDef<M>;
	dbNull(value: string | Date): DateColumnTypeDef<M>;
} & ColumnTypeOf<DateColumnType<M>> &
	M;

type DateWithTimeZoneColumnTypeDef<M> = DateValidator<M> & {
	primary(): DateWithTimeZoneColumnTypeDef<M & IsPrimary> & IsPrimary;
	notNull(): DateWithTimeZoneColumnTypeDef<M & NotNull> & NotNull;
	notNullExceptInsert(): DateWithTimeZoneColumnTypeDef<M & NotNull & NotNullExceptInsert> & NotNull & NotNullExceptInsert;
	serializable(value: boolean): DateWithTimeZoneColumnTypeDef<M>;
	JSONSchema(schema: object, options?: Options): DateWithTimeZoneColumnTypeDef<M>;
	default(value: string | Date | null | undefined | (() => string | Date | null | undefined)): DateWithTimeZoneColumnTypeDef<M>;
	dbNull(value: string | Date): DateWithTimeZoneColumnTypeDef<M>;
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

interface RawFilter {
	sql: string | (() => string);
	parameters?: any[];
}

interface Filter extends RawFilter {
	and(filter: RawFilter | RawFilter[], ...filters: RawFilter[]): Filter;
	or(filter: RawFilter | RawFilter[], ...filters: RawFilter[]): Filter;
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


type TableAlias<Alias> = {
	__tableAlias: Alias;
  };



export type SchemaFromMappedDb<T> = {
  [K in keyof T]: T[K] extends MappedTableDef<infer Def>
    ? TableSchema<Def>
    : never;
};

type TableSchema<T> = {
  columns: {
    [K in keyof T as T[K] extends ColumnSymbols ? K : never]: ColumnToSchemaType<T[K]>;
  };
  primaryKey: ExtractPrimaryKeyNames<T>;

  relations: {
    [K in keyof T as T[K] extends RelatedTable | ManyRelation ? K : never]:
      T[K] extends ManyRelation
        ? { type: 'hasMany'; target: RelationTarget<T[K]> }
        : T[K] extends RelatedTable
          ? { type: 'hasOne'; target: RelationTarget<T[K]> }
          : never;
  };
};

type ExtractPrimaryKeyNames<T> =
  UnionToTuple<{ [K in keyof T]: T[K] extends IsPrimary ? K : never }[keyof T]> extends infer R
    ? R extends string[] ? R : []
    : [];


type RelationTarget<T> =
  T extends { __tableAlias: infer S } ? Extract<S, string> : string;

type ColumnToSchemaType<T> =
  T extends JsonOf<infer U>
    ? { ' type': 'json'; ' tsType': U }
      & (T extends NotNullExceptInsert ? { ' notNull': true; ' notNullExceptInsert': true }
         : T extends NotNull ? { ' notNull': true }
         : {}) :
  T extends JSONColumnSymbol & JsonOf<infer U>
    ? { ' type': 'json'; ' tsType': U }
      & (T extends NotNullExceptInsert ? { ' notNull': true; ' notNullExceptInsert': true }
         : T extends NotNull ? { ' notNull': true }
         : {}) :
  T extends StringColumnSymbol
    ? { ' type': 'string' }
      & (T extends NotNullExceptInsert ? { ' notNull': true; ' notNullExceptInsert': true }
         : T extends NotNull ? { ' notNull': true }
         : {}) :
  T extends UuidColumnSymbol
    ? { ' type': 'uuid' }
      & (T extends NotNullExceptInsert ? { ' notNull': true; ' notNullExceptInsert': true }
         : T extends NotNull ? { ' notNull': true }
         : {}) :
  T extends NumericColumnSymbol
    ? { ' type': 'numeric' }
      & (T extends NotNullExceptInsert ? { ' notNull': true; ' notNullExceptInsert': true }
         : T extends NotNull ? { ' notNull': true }
         : {}) :
  T extends DateColumnSymbol | DateWithTimeZoneColumnSymbol
    ? { ' type': 'date' }
      & (T extends NotNullExceptInsert ? { ' notNull': true; ' notNullExceptInsert': true }
         : T extends NotNull ? { ' notNull': true }
         : {}) :
  T extends BooleanColumnSymbol
    ? { ' type': 'boolean' }
      & (T extends NotNullExceptInsert ? { ' notNull': true; ' notNullExceptInsert': true }
         : T extends NotNull ? { ' notNull': true }
         : {}) :
  T extends BinaryColumnSymbol
    ? { ' type': 'binary' }
      & (T extends NotNullExceptInsert ? { ' notNull': true; ' notNullExceptInsert': true }
         : T extends NotNull ? { ' notNull': true }
         : {}) :
  never;

export type MappedDbDef<T> = {
  map<V extends AllowedDbMap<V>>(
    callback: (mapper: DbMapper<T>) => V
  ): MappedDbDef<MergeProperties<T, V>>;
  <O extends DbOptions<T>>(concurrency: O): NegotiateDbInstance<T, O>;

  /**
   * Returns the schema of the mapped DB as a generic type
   * Usage: type Schema = ReturnType<typeof db.toSchema>
   */
  toSchema: <U = T>() => SchemaFromMappedDb<U>;
} & T & DbConnectable<T>;