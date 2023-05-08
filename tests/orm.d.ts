declare namespace ORM {

	interface ORM {
		table: <T>(tableName: string) => Table<T>;
	}


}

interface UuidColumnType {
	equalTo(value: string): Filter;
}

interface DateColumnType {
	greaterThan(value: Date): Filter;
	between(from: Date, to: Date): Filter;
}

interface StringColumnType {
	equalTo(value: string): Filter;
	greaterThan(value: string): Filter;
	startsWith(value: string): Filter;
	endsWith(value: string): Filter;
}

interface NumberColumnType {
	greaterThan(value: number): Filter;
	between(from: number, to: number): Filter;
}

interface ColumnType {
	string: () => StringColumnType;
	uuid: () => UuidColumnType;
	number: () => NumberColumnType;
	date: () => DateColumnType;
}

interface RawFilter {
	sql: string | (() => string);
	parameters?: any[];
}

interface Filter extends RawFilter {
	and<T extends RawFilter>(otherFilter: T): Filter;
}

type Table<T> = {
	map: <U>(callback: (mapper: ColumnMapper<T>) => U) => MappedTable<T, U>;
};

type ExtractProperties<TFrom, T, K extends keyof T> = {
	[P in keyof T]:
	T[P] extends true
	? (P extends keyof TFrom ? TFrom[P] : never)
	: T[P] extends object
	? ExtractProperties<TFrom, T[P], keyof T[P]>
	: P extends keyof TFrom
	? TFrom[P]
	: never;
}[K];

type FetchingStrategy<T> = {
	[K in keyof T]?: boolean | FetchingStrategy<T[K]>;
} & {
	orderBy?: Array<OrderBy<Extract<keyof T, string>>>;
	limit?: number;
	offset?: number;
};

type OrderBy<T extends string> = `${T} ${'asc' | 'desc'}` | T;

type ReferenceMapper<TFrom, TTo> = {
	by(foreignKey: keyof TFrom): MappedTable<any, TTo>;
};

type ColumnMapper<T> = {
	column: (columnName: string) => ColumnType;
	references: <TTo>(mappedTable: MappedTable<any, TTo>) => ReferenceMapper<T, TTo>;
};


type MappedTable<T, U> = {
	map: <V>(callback: (mapper: ColumnMapper<U>) => V) => MappedTable<T, U & V>;
	getMany: <FS extends FetchingStrategy<U>>(filter: Filter, fetchingStrategy: FS) => FetchedProperties<Required<U>, Required<FS>>
} & U;

type FetchedProperties<T, TStrategy> = {
	[K in keyof T]: K extends keyof TStrategy
	? TStrategy[K] extends boolean ? (TStrategy[K] extends true
		? T[K]
		: never)
	: FetchedProperties<T[K] , TStrategy[K]>
	: NegotiateDefaultStrategy<T[K]>
};

type NegotiateDefaultStrategy<T> = T extends StringColumnType | UuidColumnType | NumberColumnType | DateColumnType ? T : never


declare const orm: ORM.ORM;
export default orm;
