declare namespace ORM {

	interface ORM {
		table: (tableName: string) => Table<{}>;
		tableOf: <T>(tableName: string) => Table<T>;
	}
}


type FetchingStrategy<T> = Omit<{
	[K in keyof T & keyof RemoveNever<AllowedColumnsAndTablesStrategy<T>>]?: boolean | FetchingStrategy<T[K]>
}, 'getOne' | 'getMany'> & {
	orderBy?: Array<OrderBy<Extract<keyof AllowedColumns<T>, string>>>;
	limit?: number;
	offset?: number;
};

type OrderBy<T extends string> = `${T} ${'asc' | 'desc'}` | T;

type RelatedTable = {
	[' relatedTable']: boolean;
};

type ReferenceMapper<TFrom, TTo> = {
	by(foreignKey: keyof TFrom): MappedTable<TTo> & RelatedTable;
};

type ColumnMapper<T> = {
	column(columnName: string) : ColumnType<{}>;
	primaryColumn(columnName: string) : ColumnType<IsPrimary>;
	references<TTo>(mappedTable: MappedTable<TTo>) : ReferenceMapper<T, TTo>;
};

type MappedTable<T> = {
	getOne<FS extends FetchingStrategy<T>>(filter?: Filter | null, fetchingStrategy?: FS | null) : StrategyToRow<FetchedProperties<T, FS>>;
	map<V extends AllowedColumnsAndTablesMap<V>>(callback: (mapper: ColumnMapper<T>) => V) : MappedTable<T & MapColumnDefs<V>>;
} & T;

type Table<T> = {
	map<U extends AllowedColumnsAndTablesMap<U>>(callback: (mapper: ColumnMapper<T>) => U) : MappedTable<T & MapColumnDefs<U>>;
};



type NotNullProperties<T> = Pick<T, { [K in keyof T]: T[K] extends NotNull ? K : never }[keyof T]>;
type NullProperties<T> = Pick<T, { [K in keyof T]: T[K] extends NotNull ? never : K }[keyof T]>;

type MapColumnDefs<T> = {
	[K in keyof T as T[K] extends never ? never : K]: T[K] extends StringColumnTypeDef<infer M>
	? StringColumnType<M>
	: T[K] extends UuidColumnTypeDef<infer M>
	? UuidColumnType<M>
	: T[K] extends NumericColumnTypeDef<infer M>
	? NumericColumnType<M>
	: T[K] extends DateColumnTypeDef<infer M>
	? DateColumnType<M>
	: T[K] extends BinaryColumnTypeDef<infer M>
	? BinaryColumnType<M>
	: T[K] extends BooleanColumnTypeDef<infer M>
	? BooleanColumnType<M>
	: T[K] extends JSONColumnTypeDef<infer M>
	? JSONColumnType<M>
	: T[K]
}

type ColumnTypes<M> = StringColumnType<M> | UuidColumnType<M> | NumericColumnType<M> | DateColumnType<M> | BinaryColumnType<M> | BooleanColumnType<M> | JSONColumnType<M>;
type ColumnAndTableTypes<M> = ColumnTypes<M> | RelatedTable ;


type StrategyToRow<T> = {	
    [K in keyof RemoveNever<NotNullProperties<T>> ]: 
    T[K] extends StringColumnType<infer M>
    ? string
    : T[K] extends UuidColumnType<infer M>
    ? string
    : T[K] extends NumericColumnType<infer M>
    ? number
    : T[K] extends DateColumnType<infer M>
    ? string
    : T[K] extends BinaryColumnType<infer M>
    ? string
    : T[K] extends BooleanColumnType<infer M>
    ? boolean
    : T[K] extends JSONColumnType<infer M>
    ? JsonType
    : StrategyToRow<T[K]>;
} & {
    [K in keyof RemoveNever<NullProperties<T>>]?: 
    T[K] extends StringColumnType<infer M>
    ? string | null
    : T[K] extends UuidColumnType<infer M>
    ? string | null
    : T[K] extends NumericColumnType<infer M>
    ? number | null
    : T[K] extends DateColumnType<infer M>
    ? string | null
    : T[K] extends BinaryColumnType<infer M>
    ? string | null
    : T[K] extends BooleanColumnType<infer M>
    ? boolean | null
    : T[K] extends JSONColumnType<infer M>
    ? JsonType | null
    : StrategyToRow<T[K]> | null;
};

type JsonValue = null | boolean | number | string | JsonArray | JsonObject;

interface JsonArray extends Array<JsonValue> { }

interface JsonObject { [key: string]: JsonValue; }

type JsonType = JsonArray | JsonObject;

type AllowedColumnsAndTablesMap<T> = {
	[P in keyof T]: T[P] extends ColumnTypeOf<infer U> | RelatedTable
	? T[P]
	: never;
};



type AllowedColumnsAndTablesStrategy<T> = {
	[P in keyof T]: T[P] extends ColumnAndTableTypes<infer M>
	? T[P]
	: never;
};

type AllowedColumns<T> = RemoveNever<{
	[P in keyof T]: T[P] extends ColumnTypes<infer M>
	? T[P]
	: never;
}>;

type AtLeastOneTrue<T> = {
	[K in keyof T]: T[K] extends true ? true : never;
}[keyof T] extends never ? false : true;

type ExtractColumns<T, TStrategy> = {
	[K in keyof TStrategy]: K extends keyof T ? 
	T[K] extends ColumnTypes<infer M> ? TStrategy[K] : never
	: never
}

type FetchedProperties<T, TStrategy> = FetchedColumnProperties<T, TStrategy> & FetchedRelationProperties<T, TStrategy>;

type FetchedRelationProperties<T, TStrategy> = RemoveNeverFlat<{
	[K in keyof T]: K extends keyof TStrategy ? TStrategy[K] extends true ? 
		T[K] extends ColumnTypes<infer M> ?
			never
			: FetchedProperties<T[K], {}>
		: TStrategy[K] extends false ?
			never
			: FetchedProperties<T[K], TStrategy[K]>
		: never
}>;

type FetchedColumnProperties<T, TStrategy> = RemoveNeverFlat<AtLeastOneTrue<RemoveNever<ExtractColumns<T, TStrategy>>> extends true ? 	
	{
		[K in keyof T]: K extends keyof TStrategy ? 
			TStrategy[K] extends true ? 
				T[K] extends ColumnTypes<infer M> ? 
					T[K]
					: never
				: never
		: never
	}
	: {
		[K in keyof T]: K extends keyof TStrategy ? 
			TStrategy[K] extends true ? 
				T[K] extends ColumnTypes<infer M> ? 
					T[K]
					: never
				: never
		: NegotiateDefaultStrategy<T[K]>
	}>;


type NegotiateDefaultStrategy<T> = T extends ColumnTypes<infer M> ? T : never

type RemoveNever<T> = {
	[K in keyof T as T[K] extends never ? never : K]: T[K] extends object ? RemoveNever<T[K]> : T[K]
};

type RemoveNeverFlat<T> = {
	[K in keyof T as T[K] extends never ? never : K]: T[K]
};

type UuidColumnType<M> = {
	equal(value: string | null): Filter;
	eq(value: string): Filter;
	notEqual(value: string | null): Filter
	ne(value: string): Filter
	lessThan(value: string): Filter;
	lt(value: string): Filter;
	lessThanOrEqual(value: string): Filter;
	le(value: string): Filter;
	greaterThan(value: string): Filter;
	gt(value: string): Filter;
	greaterThanOrEqual(value: string): Filter;
	ge(value: string): Filter;
	between(from: string, to: string): Filter;
	in(values: Array<string | null>): Filter;
} & M

type BinaryColumnType<M> = {
	equal(value: string | null): Filter;
	eq(value: string): Filter;
	notEqual(value: string | null): Filter
	ne(value: string): Filter
	lessThan(value: string): Filter;
	lt(value: string): Filter;
	lessThanOrEqual(value: string): Filter;
	le(value: string): Filter;
	greaterThan(value: string): Filter;
	gt(value: string): Filter;
	greaterThanOrEqual(value: string): Filter;
	ge(value: string): Filter;
	between(from: string, to: string): Filter;
	in(values: Array<string | null>): Filter;
} & M

type BooleanColumnType<M> = {
	equal(value: boolean | null): Filter;
	eq(value: boolean): Filter;
	notEqual(value: boolean | null): Filter
	ne(value: boolean): Filter
	lessThan(value: boolean): Filter;
	lt(value: boolean): Filter;
	lessThanOrEqual(value: boolean): Filter;
	le(value: boolean): Filter;
	greaterThan(value: boolean): Filter;
	gt(value: boolean): Filter;
	greaterThanOrEqual(value: boolean): Filter;
	ge(value: boolean): Filter;
	between(from: boolean, to: boolean): Filter;
	in(values: Array<boolean | null>): Filter;
} & M


type DateColumnType<M> = {
	equal(value: string | Date | null): Filter;
	eq(value: string | Date): Filter;
	notEqual(value: string | Date | null): Filter
	ne(value: string | Date): Filter
	lessThan(value: string | Date): Filter;
	lt(value: string | Date): Filter;
	lessThanOrEqual(value: string | Date): Filter;
	le(value: string | Date): Filter;
	greaterThan(value: string | Date): Filter;
	gt(value: string | Date): Filter;
	greaterThanOrEqual(value: string | Date): Filter;
	ge(value: string | Date): Filter;
	between(from: string | Date, to: string | Date): Filter;
	in(values: Array<string | Date | null>): Filter;
} & M

type StringColumnType<M> = {
	equal(value: string | null): Filter;
	eq(value: string): Filter;
	notEqual(value: string | null): Filter
	ne(value: string): Filter
	lessThan(value: string): Filter;
	lt(value: string): Filter;
	lessThanOrEqual(value: string): Filter;
	le(value: string): Filter;
	greaterThan(value: string): Filter;
	gt(value: string): Filter;
	greaterThanOrEqual(value: string): Filter;
	ge(value: string): Filter;
	between(from: string, to: string): Filter;
	in(values: Array<string | null>): Filter;

	startsWith(value: string): Filter;
	endsWith(value: string): Filter;
	contains(value: string): Filter;
	iStartsWith(value: string): Filter;
	iEndsWith(value: string): Filter;
	iContains(value: string): Filter;
	iEqual(value: string | null): Filter;
	ieq(value: string | null): Filter;
} & M

type NumericColumnType<M> = {
	equal(value: number | null): Filter;
	eq(value: number): Filter;
	notEqual(value: number | null): Filter
	ne(value: number): Filter
	lessThan(value: number): Filter;
	lt(value: number): Filter;
	lessThanOrEqual(value: number): Filter;
	le(value: number): Filter;
	greaterThan(value: number): Filter;
	gt(value: number): Filter;
	greaterThanOrEqual(value: number): Filter;
	ge(value: number): Filter;
	between(from: number, to: number): Filter;
	in(values: Array<number | null>): Filter;
} & M

type JSONColumnType<M> = {
	equal(value: JsonType | null): Filter;
	eq(value: JsonType): Filter;
	notEqual(value: JsonType | null): Filter
	ne(value: JsonType): Filter
	lessThan(value: JsonType): Filter;
	lt(value: JsonType): Filter;
	lessThanOrEqual(value: JsonType): Filter;
	le(value: JsonType): Filter;
	greaterThan(value: JsonType): Filter;
	gt(value: JsonType): Filter;
	greaterThanOrEqual(value: JsonType): Filter;
	ge(value: JsonType): Filter;
	between(from: JsonType, to: JsonType): Filter;
	in(values: Array<JsonType | null>): Filter;
} & M

interface IsPrimary {
	[' isPrimary'] : true;
}

type NotNull = {
	[' notNull']: boolean;
}

interface ColumnType<M> {
	string: () => StringColumnTypeDef<M>;
	uuid: () => UuidColumnTypeDef<M>;
	numeric: () => NumericColumnTypeDef<M>;
	date: () => DateColumnTypeDef<M>;
	binary(): BinaryColumnTypeDef<M>;
	boolean(): BooleanColumnTypeDef<M>;
	json(): JSONColumnTypeDef<M>;
}

type StringColumnTypeDef<M> = {
	notNull() : StringColumnTypeDef<M & NotNull> & NotNull;
} & ColumnTypeOf<StringColumnType<M>> & M

type NumericColumnTypeDef<M> = {
	notNull() : NumericColumnTypeDef<M  & NotNull> & NotNull;
} & ColumnTypeOf<NumericColumnType<M>>;

type UuidColumnTypeDef<M> = {
	notNull() : UuidColumnTypeDef<M  & NotNull> & NotNull;
} & ColumnTypeOf<UuidColumnType<M>> & M;

type JSONColumnTypeDef<M> = {
	notNull() : JSONColumnTypeDef<M  & NotNull> & NotNull;
} & ColumnTypeOf<JSONColumnType<M>> & M;

type BinaryColumnTypeDef<M> = {
	notNull() : BinaryColumnTypeDef<M  & NotNull> & NotNull;
} & ColumnTypeOf<BinaryColumnType<M>> & M;

type BooleanColumnTypeDef<M> = {
	notNull() : BooleanColumnTypeDef<M  & NotNull> & NotNull;
} & ColumnTypeOf<BooleanColumnType<M>> & M;

type DateColumnTypeDef<M> = {
	notNull() : DateColumnTypeDef<M  & NotNull> & NotNull;
} & ColumnTypeOf<DateColumnType<M>> & M;

interface ColumnTypeOf<T> {
	[' type']: T;
}


interface RawFilter {
	sql: string | (() => string);
	parameters?: any[];
}

interface Filter extends RawFilter {
	and<T extends RawFilter>(otherFilter: T): Filter;
}

declare const orm: ORM.ORM;
export default orm;
