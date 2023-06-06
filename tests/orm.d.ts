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

type RelatedTable = {};

type ReferenceMapper<TFrom, TTo> = {
	by(foreignKey: keyof TFrom): MappedTable<any, TTo> & RelatedTable;
};

type ColumnMapper<T> = {
	column: (columnName: string) => ColumnType;
	references: <TTo>(mappedTable: MappedTable<any, TTo>) => ReferenceMapper<T, TTo>;
};


type MappedTable<T, U> = {
	map: <V extends AllowedColumnsAndTables<V>>(callback: (mapper: ColumnMapper<U>) => V) => MappedTable<T, FinalTable<U & V>>;
} & U;

type Table<T> = {
	map: (<U extends AllowedColumnsAndTables<U>>(callback: (mapper: ColumnMapper<T>) => U) => MappedTable<T, FinalTable<U>>) 
};

type FinalTable<T> = {
	[K in keyof T]: T[K] extends ColumnTypeOf<StringColumnType> ? StringColumnType :
					T[K] extends ColumnTypeOf<NumericColumnType>  ? NumericColumnType :
					T[K] extends ColumnTypeOf<UuidColumnType> ? UuidColumnType :
					T[K] extends ColumnTypeOf<BooleanColumnType> ? BooleanColumnType :
					T[K] extends ColumnTypeOf<DateColumnType> ? DateColumnType :
					T[K] extends ColumnTypeOf<JSONColumnType> ? JSONColumnType :
					T[K] extends ColumnTypeOf<BinaryColumnType> ? BinaryColumnType :
					T[K];
  } & {
	getOne<FS extends FetchingStrategy<T>>(
	  filter: Filter,
	  fetchingStrategy: FS
	) : StrategyToRow<FetchedProperties<Required<T>, Required<FS>>>;
  };
  

type ColumnTypes = StringColumnType | UuidColumnType | NumericColumnType | DateColumnType | BinaryColumnType | BooleanColumnType | JSONColumnType;
type ColumnAndTableTypes = ColumnTypes | RelatedTable;


type StrategyToRow<T> = {
    [K in keyof T as T[K] extends never ? never : K]?: 
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
	[P in keyof T]: T[P] extends ColumnAndTableTypes
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
	[K in keyof TStrategy]: K extends keyof T
	? T[K] extends StringColumnType | UuidColumnType | NumericColumnType | DateColumnType | BinaryColumnType | BooleanColumnType | JSONColumnType? TStrategy[K] : never
	: never
}
type FetchedProperties<T, TStrategy> = AtLeastOneTrue<RemoveNever<ExtractColumns<T, TStrategy>>> extends true
	? {
		[K in keyof T]: K extends keyof TStrategy
		? TStrategy[K] extends true
		? T[K] extends StringColumnType | UuidColumnType | NumericColumnType | DateColumnType | BinaryColumnType | BooleanColumnType | JSONColumnType
		? T[K]
		: FetchedProperties<Required<T[K]>, {}>
		: TStrategy[K] extends false
		? never
		: FetchedProperties<Required<T[K]>, Required<TStrategy[K]>>
		: never
	}
	: {
		[K in keyof T]: K extends keyof TStrategy
		? TStrategy[K] extends true
		? T[K] extends StringColumnType | UuidColumnType | NumericColumnType | DateColumnType | BinaryColumnType | BooleanColumnType | JSONColumnType
		? T[K]
		: FetchedProperties<Required<T[K]>, {}>
		: TStrategy[K] extends false
		? never
		: FetchedProperties<Required<T[K]>, Required<TStrategy[K]>>
		: NegotiateDefaultStrategy<T[K]>
	};


type NegotiateDefaultStrategy<T> = T extends StringColumnType | UuidColumnType | NumericColumnType | DateColumnType | BinaryColumnType | BooleanColumnType | JSONColumnType ? T : never

type RemoveNever<T> = {
	[K in keyof T as T[K] extends never ? never : K]: T[K] extends object ? RemoveNever<T[K]> : T[K]
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

type NotNull = {
	_notNull: boolean;
}
type StringColumnTypeDef = {
	notNull() : StringColumnTypeDef & NotNull;
} & ColumnTypeOf<StringColumnType>

type NumericColumnTypeDef = {
	notNull() : StringColumnTypeDef  & NotNull;
} & ColumnTypeOf<NumericColumnType>;

type UuidColumnTypeDef = {
	notNull() : StringColumnTypeDef  & NotNull;
} & ColumnTypeOf<UuidColumnType>;

type JSONColumnTypeDef = {
	notNull() : StringColumnTypeDef  & NotNull;
} & ColumnTypeOf<JSONColumnType>;

type BinaryColumnTypeDef = {
	notNull() : StringColumnTypeDef  & NotNull;
} & ColumnTypeOf<BinaryColumnType>;

type BooleanColumnTypeDef = {
	notNull() : StringColumnTypeDef  & NotNull;
} & ColumnTypeOf<BooleanColumnType>;

type DateColumnTypeDef = {
	notNull() : StringColumnTypeDef  & NotNull;
} & ColumnTypeOf<DateColumnType>;

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


interface ColumnTypeOf<T> {
	_type: T;
}

interface ColumnType {
    string: () => StringColumnTypeDef;
    uuid: () => UuidColumnTypeDef;
    numeric: () => NumericColumnTypeDef;
    date: () => DateColumnTypeDef;
    binary: () => BinaryColumnTypeDef;
    boolean: () => BooleanColumnTypeDef;
    json: () => JSONColumnTypeDef;
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
