import { isLabeledStatement } from "typescript";

declare namespace ORM {

	interface ORM {
		table: (tableName: string) => Table<{}>;
		tableOf: <T>(tableName: string) => Table<T>;
	}
}


type FetchingStrategy<T> = Omit<{
	[K in keyof T & keyof RemoveNever<AllowedColumnsAndTablesStrategy<T>>]?: 
	T[K] extends ColumnTypes<infer M>
		? boolean
		: boolean | FetchingStrategy<T[K]>
}, 'getOne' | 'getMany'> & {
	orderBy?: Array<OrderBy<Extract<keyof AllowedColumns<T>, string>>>;
	limit?: number;
	offset?: number;
};

type OrderBy<T extends string> = `${T} ${'asc' | 'desc'}` | T;

type RelatedTable = {
	[' relatedTable']: boolean;
};


type PickTypesOf<T, U> = {
	[K in keyof T as T[K] extends U ? K : never]: T[K];
};

type PickTypesOfTuple<T, U, V> = {
	[K in keyof T as T[K] extends U ? T[K] extends V ? K : never: never]: T[K];
};


type ExtractPrimary<T> = PickTypesOf<T, IsPrimary>;
type ExtractPrimary1<T> = PickTypesOf<T, PickPropertyValue1<PickTypesOf<T, IsPrimary>>>;
type ExtractPrimary2<T> = PickTypesOf<T, PickPropertyValue2<PickTypesOf<T, IsPrimary>>>;


type ExtractPrimary3<T> = PickTypesOf<T, IsPrimary & PickPropertyValue3<T>>;
type ExtractPrimary4<T> = PickTypesOf<T, IsPrimary & PickPropertyValue4<T>>;
type ExtractPrimary5<T> = PickTypesOf<T, IsPrimary & PickPropertyValue5<T>>;
type ExtractPrimary6<T> = PickTypesOf<T, IsPrimary & PickPropertyValue6<T>>;

type ToColumnTypes<T> = {
	[K in keyof T]:
	T[K] extends UuidColumnSymbol
	? UuidColumnSymbol
	: T[K] extends StringColumnSymbol
	? StringColumnSymbol
	: T[K] extends NumericColumnSymbol
	? NumericColumnSymbol
	: T[K] extends DateColumnSymbol
	? DateColumnSymbol
	: T[K] extends BinaryColumnSymbol
	? BinaryColumnSymbol
	: T[K] extends BooleanColumnSymbol
	? BooleanColumnSymbol
: T[K] extends JSONColumnSymbol
	? JSONColumnSymbol
	: never
}[keyof T];

type KeyCandidates<TFrom, TTo> = PickTypesOf<TFrom, ToColumnTypes<ExtractPrimary<TTo>>>;
type KeyCandidates1<TFrom, TTo> = PickTypesOf<TFrom, ToColumnTypes<ExtractPrimary1<TTo>>>;
type KeyCandidates2<TFrom, TTo> = PickTypesOf<TFrom, ToColumnTypes<ExtractPrimary2<TTo>>>;
type KeyCandidates3<TFrom, TTo> = PickTypesOf<TFrom, ToColumnTypes<ExtractPrimary3<TTo>>>;
type KeyCandidates4<TFrom, TTo> = PickTypesOf<TFrom, ToColumnTypes<ExtractPrimary4<TTo>>>;
type KeyCandidates5<TFrom, TTo> = PickTypesOf<TFrom, ToColumnTypes<ExtractPrimary5<TTo>>>;
type KeyCandidates6<TFrom, TTo> = PickTypesOf<TFrom, ToColumnTypes<ExtractPrimary6<TTo>>>;
type ReferenceMapper<TFrom, TTo> = ReferenceMapperHelper<TFrom, TTo, CountProperties<ExtractPrimary<TTo>>>;
type OneMapper<TFrom, TTo> = HasMapperHelper<TFrom, TTo, CountProperties<ExtractPrimary<TFrom>>>;
type ManyMapper<TFrom, TTo> = HasMapperHelper<TFrom, TTo, CountProperties<ExtractPrimary<TFrom>>, ManyRelation>;

type ReferenceMapperHelper<TFrom, TTo, TPrimaryCount> =
	6 extends TPrimaryCount ?
	{
		by(column: keyof KeyCandidates1<TFrom, TTo>, column2: KeyCandidates2<TFrom, TTo>, column3: KeyCandidates3<TFrom, TTo>, column4: KeyCandidates4<TFrom, TTo>, column5: KeyCandidates5<TFrom, TTo>, column6: KeyCandidates6<TFrom, TTo>): MappedTable<TTo> & RelatedTable;
	} :
	5 extends TPrimaryCount ?
	{
		by(column: keyof KeyCandidates1<TFrom, TTo>, column2: KeyCandidates2<TFrom, TTo>, column3: KeyCandidates3<TFrom, TTo>, column4: KeyCandidates4<TFrom, TTo>, column5: KeyCandidates5<TFrom, TTo>): MappedTable<TTo> & RelatedTable;
	} :
	4 extends TPrimaryCount ?
	{
		by(column: keyof KeyCandidates1<TFrom, TTo>, column2: KeyCandidates2<TFrom, TTo>, column3: KeyCandidates3<TFrom, TTo>, column4: KeyCandidates4<TFrom, TTo>): MappedTable<TTo> & RelatedTable;
	} :
	3 extends TPrimaryCount ?
	{
		by(column: keyof KeyCandidates1<TFrom, TTo>, column2: KeyCandidates2<TFrom, TTo>, column3: KeyCandidates3<TFrom, TTo>): MappedTable<TTo> & RelatedTable;
	} :
	2 extends TPrimaryCount ?
	{
		by(column: keyof KeyCandidates1<TFrom, TTo>, column2: keyof KeyCandidates2<TFrom, TTo>): MappedTable<TTo> & RelatedTable;
	} :
	1 extends TPrimaryCount ?
	{
		by(column: keyof KeyCandidates1<TFrom, TTo>): MappedTable<TTo> & RelatedTable;
	} :
	{}

type HasMapperHelper<TFrom, TTo, TPrimaryCount, TExtra = {}> =
	6 extends TPrimaryCount ?
	{
		by(column: keyof KeyCandidates1<TTo, TFrom>, column2: KeyCandidates2<TTo, TFrom>, column3: KeyCandidates3<TTo, TFrom>, column4: KeyCandidates4<TTo, TFrom>, column5: KeyCandidates5<TTo, TFrom>, column6: KeyCandidates6<TTo, TFrom>): MappedTable<TTo> & RelatedTable & TExtra;
	} :
	5 extends TPrimaryCount ?
	{
		by(column: keyof KeyCandidates1<TTo, TFrom>, column2: KeyCandidates2<TTo, TFrom>, column3: KeyCandidates3<TTo, TFrom>, column4: KeyCandidates4<TTo, TFrom>, column5: KeyCandidates5<TTo, TFrom>): MappedTable<TTo> & RelatedTable & TExtra;
	} :
	4 extends TPrimaryCount ?
	{
		by(column: keyof KeyCandidates1<TTo, TFrom>, column2: KeyCandidates2<TTo, TFrom>, column3: KeyCandidates3<TTo, TFrom>, column4: KeyCandidates4<TTo, TFrom>): MappedTable<TTo> & RelatedTable & TExtra;
	} :
	3 extends TPrimaryCount ?
	{
		by(column: keyof KeyCandidates1<TTo, TFrom>, column2: KeyCandidates2<TTo, TFrom>, column3: KeyCandidates3<TTo, TFrom>): MappedTable<TTo> & RelatedTable & TExtra;
	} :
	2 extends TPrimaryCount ?
	{
		by(column: keyof KeyCandidates1<TTo, TFrom>, column2: KeyCandidates2<TTo, TFrom>): MappedTable<TTo> & RelatedTable & TExtra;
	} :
	1 extends TPrimaryCount ?
	{
		by(column: keyof KeyCandidates1<TTo, TFrom>): MappedTable<TTo> & RelatedTable & TExtra;
	} :
	{}

type ColumnMapper<T> = {
	column(columnName: string): ColumnType<{}>;
	primaryColumn(columnName: string): ColumnType<IsPrimary>;
	references<TTo>(mappedTable: MappedTable<TTo>): ReferenceMapper<T, TTo>;
	hasOne<TTo>(mappedTable: MappedTable<TTo>): OneMapper<T, TTo>;
	hasMany<TTo>(mappedTable: MappedTable<TTo>): ManyMapper<T, TTo>;
};

type ManyRelation = {
	[' isManyRelation']: true
};

type MappedTable<T> = {
	getOne<FS extends FetchingStrategy<T>>(filter?: Filter, fetchingStrategy?: FS | null): StrategyToRow<FetchedProperties<T, FS>>;
	getOne<FS extends FetchingStrategy<T>>(filter?: Filter | ((table: MappedTable<T>) => Filter), fetchingStrategy?: FS | null): StrategyToRow<FetchedProperties<T, FS>>;
	map<V extends AllowedColumnsAndTablesMap2<V>>(callback: (mapper: ColumnMapper<T>) => V): MappedTable<T & MapColumnDefs<V>>;
} & T;


type Table<T> = {
	map<U extends AllowedColumnsAndTablesMap<U>>(callback: (mapper: ColumnMapper<T>) => U): MappedTable<T & MapColumnDefs<U>>;
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
type ColumnAndTableTypes<M> = ColumnTypes<M> | RelatedTable;


type StrategyToRow<T> = {
	[K in keyof RemoveNever<NotNullProperties<T>>]:
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
	: T[K] extends Array<infer V>
	? StrategyToRow<T[K]>[]
	: StrategyToRow<T[K]>
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
		: T[K] extends ManyRelation
		? StrategyToRow<T[K]>[]
		: StrategyToRow<T[K]>
	};

type JsonValue = null | boolean | number | string | JsonArray | JsonObject;

interface JsonArray extends Array<JsonValue> { }

interface JsonObject { [key: string]: JsonValue; }

type JsonType = JsonArray | JsonObject;


type AllowedColumnsAndTablesMap<T> = HasPrimary<T> extends true ? AllowedColumnsAndTablesMap2<T> : never;

type AllowedColumnsAndTablesMap2<T> = {
	[P in keyof T]: T[P] extends ColumnTypeOf<infer U> | RelatedTable
	? T[P]
	: never;
}

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

type HasPrimary<T> = AtLeastOneOf<T, IsPrimary>;

type AtLeastOneOf<T, U> = {
	[K in keyof T]: T[K] extends U ? true : never;
}[keyof T] extends never ? false : true;


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
	[K in keyof T]: 
	K extends keyof TStrategy 
		? TStrategy[K] extends true
			? T[K] extends ColumnTypes<infer M>
				? never
				: T[K] extends ManyRelation
					? FetchedProperties<T[K], {}> & ManyRelation
					: FetchedProperties<T[K], {}>
			: TStrategy[K] extends false 
				? never
				: T[K] extends ManyRelation
				? FetchedProperties<T[K], TStrategy[K]> & ManyRelation
				: FetchedProperties<T[K], TStrategy[K]>
		: never
}>;

type FetchedColumnProperties<T, TStrategy> = RemoveNeverFlat<AtLeastOneTrue<RemoveNever<ExtractColumns<T, TStrategy>>> extends true ?
	{
		[K in keyof T]: K extends keyof TStrategy 
			? TStrategy[K] extends true 
				? T[K] extends ColumnTypes<infer M> 
					? T[K]
					: never
				: never
			: never
	}
	: {
		[K in keyof T]: K extends keyof TStrategy 
			? TStrategy[K] extends true
				? T[K] extends ColumnTypes<infer M> 
					? T[K]
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

type UuidColumnSymbol = {
	[' isUuid']: true;
}
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
} & M & UuidColumnSymbol

type BinaryColumnSymbol = {
	[' isBinary']: true;
}
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
} & M & BinaryColumnSymbol


type BooleanColumnSymbol = {
	[' isBoolean']: true
}

type BooleanColumnType<M> = {
	isBoolean: boolean;
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
} & M & BooleanColumnSymbol

type DateColumnSymbol = {
	[' isDate']: true
}

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
} & M & DateColumnSymbol

type StringColumnSymbol = {
	[' isString']: true
}

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
} & M & StringColumnSymbol

type NumericColumnSymbol = {
	[' isNumeric']: true
}
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
} & M & NumericColumnSymbol

type JSONColumnSymbol = {
	[' isJSON']: true
}

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
} & M & JSONColumnSymbol

interface IsPrimary {
	[' isPrimary']: boolean;
}

type NotNull = {
	[' notNull']: boolean;
}

interface ColumnType<M> {
	string(): StringColumnTypeDef<M>;
	uuid(): UuidColumnTypeDef<M>;
	numeric(): NumericColumnTypeDef<M>;
	date(): DateColumnTypeDef<M>;
	binary(): BinaryColumnTypeDef<M>;
	boolean(): BooleanColumnTypeDef<M>;
	json(): JSONColumnTypeDef<M>;
}

type StringColumnTypeDef<M> = {
	notNull(): StringColumnTypeDef<M & NotNull> & NotNull;
} & ColumnTypeOf<StringColumnType<M>> & M

type NumericColumnTypeDef<M> = {
	notNull(): NumericColumnTypeDef<M & NotNull> & NotNull;
} & ColumnTypeOf<NumericColumnType<M>>;

type UuidColumnTypeDef<M> = {
	notNull(): UuidColumnTypeDef<M & NotNull> & NotNull;
} & ColumnTypeOf<UuidColumnType<M>> & M;

type JSONColumnTypeDef<M> = {
	notNull(): JSONColumnTypeDef<M & NotNull> & NotNull;
} & ColumnTypeOf<JSONColumnType<M>> & M;

type BinaryColumnTypeDef<M> = {
	notNull(): BinaryColumnTypeDef<M & NotNull> & NotNull;
} & ColumnTypeOf<BinaryColumnType<M>> & M;

type BooleanColumnTypeDef<M> = {
	notNull(): BooleanColumnTypeDef<M & NotNull> & NotNull;
} & ColumnTypeOf<BooleanColumnType<M>> & M;

type DateColumnTypeDef<M> = {
	notNull(): DateColumnTypeDef<M & NotNull> & NotNull;
} & ColumnTypeOf<DateColumnType<M>> & M;

interface ColumnTypeOf<T> {
	[' type']: T;
}

type MapPropertiesTo1<T, V extends number = 1> = { [K in keyof T]: V }
type MapPropertiesTo2<T, V extends number = 2> = { [K in keyof T]: UnionOfTypes<MapPropertiesTo1<Omit<T, K>, V>> }
type MapPropertiesTo3<T, V extends number = 3> = { [K in keyof T]: UnionOfTypes<MapPropertiesTo2<Omit<T, K>, V>> }
type MapPropertiesTo4<T, V extends number = 4> = { [K in keyof T]: UnionOfTypes<MapPropertiesTo3<Omit<T, K>, V>> }
type MapPropertiesTo5<T, V extends number = 5> = { [K in keyof T]: UnionOfTypes<MapPropertiesTo4<Omit<T, K>, V>> }
type MapPropertiesTo6<T, V extends number = 6> = { [K in keyof T]: UnionOfTypes<MapPropertiesTo5<Omit<T, K>, V>> }
type UnionOfTypes<T> = T[keyof T];
type CountProperties<T> = UnionOfTypes<MapPropertiesTo6<T>> | UnionOfTypes<MapPropertiesTo5<T>> | UnionOfTypes<MapPropertiesTo4<T>> | UnionOfTypes<MapPropertiesTo3<T>> | UnionOfTypes<MapPropertiesTo2<T>> | UnionOfTypes<MapPropertiesTo1<T>>;

interface RawFilter {
	sql: string | (() => string);
	parameters?: any[];
}

interface Filter extends RawFilter {
	and<T extends RawFilter>(otherFilter: T): Filter;
}

declare const orm: ORM.ORM;
export default orm;


type UnionToIntersection<U> = 
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

  type LastOf<U> = 
  UnionToIntersection<U extends any ? () => U : never> extends () => (infer L) ? L : never;

  type PopFront<T extends any[]> = 
  ((...t: T) => void) extends ((_: any, ...rest: infer R) => void) ? R : never;

  type TupleToUnion<T extends any[]> = 
  T extends (infer First)[] ? First : T extends [] ? never : T extends [infer First, ...infer Rest] ? First | TupleToUnion<Rest> : never;

type First<T extends any[]> = 
  T extends [infer Target, ...any[]] ? Target : never;

type Second<T extends any[]> = 
  T extends [infer First, infer Target,...any[]] ? Target : never;

type UnionToTuple<T> = 
  UnionToIntersection<T extends any ? (t: T) => void : never> extends ((t: infer T1) => void) ? [...UnionToTuple<Exclude<T, T1>>, T1] : [];

type FirstOfUnion<T> = First<UnionToTuple<T>>;

type ToKeyObjects<T> = {
	[K in keyof T]: {name: K, value: T[K]}
}[keyof T]

type GetKeys<T> = {
	[K in keyof T]: T[K]
}[keyof T]

type ToUnionTuple<T> = UnionToTuple<ToKeyObjects<T>>
type PropertyToTuple<T> = FirstOfUnion<ToKeyObjects<T>>


type PickProperty<T> = PropertyToTuple<T>; 
type PickProperty2<T> = FirstOfUnion<TupleToUnion<PopFront<ToUnionTuple<T>>>>
type PickProperty3<T> = FirstOfUnion<TupleToUnion<PopFront<PopFront<ToUnionTuple<T>>>>>
type PickProperty4<T> = FirstOfUnion<TupleToUnion<PopFront<PopFront<PopFront<ToUnionTuple<T>>>>>>
type PickProperty5<T> = FirstOfUnion<TupleToUnion<PopFront<PopFront<PopFront<PopFront<ToUnionTuple<T>>>>>>>
type PickProperty6<T> = FirstOfUnion<TupleToUnion<PopFront<PopFront<PopFront<PopFront<PopFront<ToUnionTuple<T>>>>>>>>


type PickPropertyName1<T> = GetKeys<Omit<PickProperty<T>,'value'>>;
type PickPropertyName2<T> = GetKeys<Omit<PickProperty2<T>, 'value'>>
type PickPropertyName3<T> = GetKeys<Omit<PickProperty3<T>, 'value'>>
type PickPropertyName4<T> = GetKeys<Omit<PickProperty4<T>, 'value'>>
type PickPropertyName5<T> = GetKeys<Omit<PickProperty5<T>, 'value'>>
type PickPropertyName6<T> = GetKeys<Omit<PickProperty6<T>, 'value'>>

type PickPropertyValue1<T> = GetKeys<Omit<PickProperty<T>,'name'>>;
type PickPropertyValue2<T> = GetKeys<Omit<PickProperty2<T>, 'name'>>
type PickPropertyValue3<T> = GetKeys<Omit<PickProperty3<T>, 'name'>>
type PickPropertyValue4<T> = GetKeys<Omit<PickProperty4<T>, 'name'>>
type PickPropertyValue5<T> = GetKeys<Omit<PickProperty5<T>, 'name'>>
type PickPropertyValue6<T> = GetKeys<Omit<PickProperty6<T>, 'name'>>
