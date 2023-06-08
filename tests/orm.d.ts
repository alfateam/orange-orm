declare namespace ORM {

	interface ORM {
		table: (tableName: string) => Table<{}>;
		tableOf: <T>(tableName: string) => Table<T>;
	}
}


type FetchingStrategy<T> = Omit<{
	[K in keyof T & keyof RemoveNever<AllowedColumnsAndTables<T>>]?: boolean | FetchingStrategy<T[K]>
}, 'getOne' | 'getMany'> & {
	orderBy?: Array<OrderBy<Extract<keyof AllowedColumns<T>, string>>>;
	limit?: number;
	offset?: number;
};

type OrderBy<T extends string> = `${T} ${'asc' | 'desc'}` | T;

type RelatedTable = {
	// [' relatedTable']: boolean;
};

type ReferenceMapper<TFrom, TTo> = {
	by(foreignKey: keyof TFrom): MappedTable<TTo> & RelatedTable;
};

type ColumnMapper<T> = {
	column(columnName: string) : ColumnType;
	references<TTo>(mappedTable: MappedTable<TTo>) : ReferenceMapper<T, TTo>;
};

type MappedTable<T> = {
	getOne<FS extends FetchingStrategy<T>>(filter?: Filter | null, fetchingStrategy?: FS | null) : StrategyToRow<FetchedProperties<T, FS>>;
	map<V extends AllowedColumnsAndTables<V>>(callback: (mapper: ColumnMapper<T>) => V) : MappedTable<T & MapColumnDefs<V>>;
} & T;

type Table<T> = {
	map<U extends AllowedColumnsAndTables<U>>(callback: (mapper: ColumnMapper<T>) => U) : MappedTable<T & MapColumnDefs<U>>;
};


type NotNullProperties<T> = Pick<T, { [K in keyof T]: T[K] extends NotNull ? K : never }[keyof T]>;
type NullProperties<T> = Pick<T, { [K in keyof T]: T[K] extends NotNull ? never : K }[keyof T]>;

type MapColumnDefs<T> = MapColumnDefsNull<NullProperties<T>> & MapColumnDefsNotNull<NotNullProperties<T>>

type MapColumnDefsNotNull<T> = {
	[K in keyof T as T[K] extends never ? never : K]: T[K] extends StringColumnTypeDef
	? StringColumnType & NotNull
	: T[K] extends UuidColumnTypeDef
	? UuidColumnType & NotNull
	: T[K] extends NumericColumnTypeDef
	? NumericColumnType & NotNull
	: T[K] extends DateColumnTypeDef
	? DateColumnType & NotNull
	: T[K] extends BinaryColumnTypeDef
	? BinaryColumnType & NotNull
	: T[K] extends BooleanColumnTypeDef
	? BooleanColumnType & NotNull
	: T[K] extends JSONColumnTypeDef
	? JSONColumnType & NotNull
	: T[K]
}

type MapColumnDefsNull<T> = {
	[K in keyof T as T[K] extends never ? never : K]: T[K] extends StringColumnTypeDef
	? StringColumnType
	: T[K] extends UuidColumnTypeDef
	? UuidColumnType
	: T[K] extends NumericColumnTypeDef
	? NumericColumnType
	: T[K] extends DateColumnTypeDef
	? DateColumnType
	: T[K] extends BinaryColumnTypeDef
	? BinaryColumnType
	: T[K] extends BooleanColumnTypeDef
	? BooleanColumnType
	: T[K] extends JSONColumnTypeDef
	? JSONColumnType
	: T[K]
}



type ColumnTypes = StringColumnType | UuidColumnType | NumericColumnType | DateColumnType | BinaryColumnType | BooleanColumnType | JSONColumnType;
type ColumnAndTableTypes = ColumnTypes | RelatedTable ;


type StrategyToRow<T> = {	
    [K in keyof RemoveNever<NotNullProperties<T>> ]: 
    T[K] extends StringColumnType
    ? string
    : T[K] extends UuidColumnType
    ? string
    : T[K] extends NumericColumnType
    ? number
    : T[K] extends DateColumnType
    ? string
    : T[K] extends BinaryColumnType
    ? string
    : T[K] extends BooleanColumnType
    ? boolean
    : T[K] extends JSONColumnType
    ? JsonType
    : StrategyToRow<T[K]>;
} & {
    [K in keyof RemoveNever<NullProperties<T>>]?: 
    T[K] extends StringColumnType
    ? string | null
    : T[K] extends UuidColumnType
    ? string | null
    : T[K] extends NumericColumnType
    ? number | null
    : T[K] extends DateColumnType
    ? string | null
    : T[K] extends BinaryColumnType
    ? string | null
    : T[K] extends BooleanColumnType
    ? boolean | null
    : T[K] extends JSONColumnType
    ? JsonType | null
    : StrategyToRow<T[K]> | null;
};

type JsonValue = null | boolean | number | string | JsonArray | JsonObject;

interface JsonArray extends Array<JsonValue> { }

interface JsonObject { [key: string]: JsonValue; }

type JsonType = JsonArray | JsonObject;

type AllowedColumnsAndTables<T> = {
	[P in keyof T]: T[P] extends ColumnTypeOf<infer V> | RelatedTable
	? T[P]
	: never;
};

type AllowedColumns<T> = RemoveNever<{
	[P in keyof T]: T[P] extends ColumnTypes
	? T[P]
	: never;
}>;

type AtLeastOneTrue<T> = {
	[K in keyof T]: T[K] extends true ? true : never;
}[keyof T] extends never ? false : true;

type ExtractColumns<T, TStrategy> = {
	[K in keyof TStrategy]: K extends keyof T ? 
	T[K] extends ColumnTypes ? TStrategy[K] : never
	: never
}

type FetchedProperties<T, TStrategy> = FetchedColumnProperties<T, TStrategy> & FetchedRelationProperties<T, TStrategy>;

type FetchedRelationProperties<T, TStrategy> = RemoveNeverFlat<{
	[K in keyof T]: K extends keyof TStrategy ? TStrategy[K] extends true ? 
		T[K] extends ColumnTypes ?
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
				T[K] extends ColumnTypes ? 
					T[K]
					: never
				: never
		: never
	}
	: {
		[K in keyof T]: K extends keyof TStrategy ? 
			TStrategy[K] extends true ? 
				T[K] extends ColumnTypes ? 
					T[K]
					: never
				: never
		: NegotiateDefaultStrategy<T[K]>
	}>;


type NegotiateDefaultStrategy<T> = T extends ColumnTypes ? T : never

type RemoveNever<T> = {
	[K in keyof T as T[K] extends never ? never : K]: T[K] extends object ? RemoveNever<T[K]> : T[K]
};

type RemoveNeverFlat<T> = {
	[K in keyof T as T[K] extends never ? never : K]: T[K]
};

interface UuidColumnType {
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
}

interface BinaryColumnType {
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
}

interface BooleanColumnType {
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
}

interface DateColumnType {
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
}

interface StringColumnType {
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
}

interface NumericColumnType {
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
}

interface JSONColumnType {
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
}

interface ColumnType {
	string: () => StringColumnTypeDef;
	uuid: () => UuidColumnTypeDef;
	numeric: () => NumericColumnTypeDef;
	date: () => DateColumnTypeDef;
	binary(): BinaryColumnTypeDef;
	boolean(): BooleanColumnTypeDef;
	json(): JSONColumnTypeDef;
}

type StringColumnTypeDef = {
	notNull() : StringColumnTypeDef & NotNull;
} & ColumnTypeOf<StringColumnType>

type NumericColumnTypeDef = {
	notNull() : NumericColumnTypeDef & NotNull;
} & ColumnTypeOf<NumericColumnType>;

type UuidColumnTypeDef = {
	notNull() : UuidColumnTypeDef & NotNull;
} & ColumnTypeOf<UuidColumnType>;

type JSONColumnTypeDef = {
	notNull() : JSONColumnTypeDef & NotNull;
} & ColumnTypeOf<JSONColumnType>;

type BinaryColumnTypeDef = {
	notNull() : BinaryColumnTypeDef & NotNull;
} & ColumnTypeOf<BinaryColumnType>;

type BooleanColumnTypeDef = {
	notNull() : BooleanColumnTypeDef & NotNull;
} & ColumnTypeOf<BooleanColumnType>;

type DateColumnTypeDef = {
	notNull() : DateColumnTypeDef & NotNull;
} & ColumnTypeOf<DateColumnType>;

interface ColumnTypeOf<T> {
	[' type']: T;
}

type NotNull = {
	[' notNull']: boolean;
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
