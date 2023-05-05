declare namespace ORM {
	export interface UuidColumnType {
		equalTo(value: string): Filter;
	}

	export interface DateColumnType {
		greaterThan(value: Date): Filter;
		between(from: Date, to: Date): Filter;
	}

	export interface StringColumnType {
		equalTo(value: string): Filter;
		greaterThan(value: string): Filter;
		startsWith(value: string): Filter;
		endsWith(value: string): Filter;
	}

	export interface NumberColumnType {
		greaterThan(value: number): Filter;
		between(from: number, to: number): Filter;
	}

	export interface ColumnType {
		string: () => StringColumnType;
		uuid: () => UuidColumnType;
		number: () => NumberColumnType;
		date: () => DateColumnType;
	}

	export interface RawFilter {
		sql: string | (() => string);
		parameters?: any[];
	}

	export interface Filter extends RawFilter {
		and<T extends RawFilter>(otherFilter: T): Filter;
	}




	export type Table<T> = {
		map: <U>(callback: (mapper: ColumnMapper<T>) => U) => MappedTable<T, U>;
	};

	type MappedColumnType<T> = {
		[K in keyof T]: T[K] extends string
		? (StringColumnType | T[K])
		: T[K] extends Date
		? (DateColumnType | T[K])
		: T[K] extends number
		? (NumberColumnType | T[K])
		: T[K];
	};

	type FetchingStrategy<T> = {
		[K in keyof T]?: boolean | FetchingStrategy<T[K]>;
	} & {
		orderBy?: OrderBy<Extract<keyof T, string>> | OrderBy<Extract<keyof T, string>>[]; // Modify this line

	}

	type OrderBy<T extends string> = `${T} ${'asc' | 'desc'}` | T;


	export type ReferenceMapper<TFrom, TTo> = {
		by(foreignKey: keyof TFrom): MappedTable<any, TTo>;
	};

	export type ColumnMapper<T> = {
		column: (columnName: string) => ColumnType;
		references: <TTo>(mappedTable: MappedTable<any, TTo>) => ReferenceMapper<T, TTo>;
	};


	type MappedTable<TFrom, T> = {
		getMany: (filter?: Filter, fetchingStrategy?: FetchingStrategy<T>) => Promise<TFrom>[];
	} & MappedColumnType<T>;



	export interface ORM {
		table: <T>(tableName: string) => Table<T>;
	}
}

declare const orm: ORM.ORM;
export default orm;
