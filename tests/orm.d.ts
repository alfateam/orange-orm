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

	export type ReferenceMapper<TFrom, TTo> = {
		by(foreignKey: keyof TFrom): MappedTable<any, TTo>;
	};

	export type ColumnMapper<T> = {
		column: (columnName: string) => ColumnType;
		references: <TTo>(mappedTable: MappedTable<any, TTo>) => ReferenceMapper<T, TTo>;
	};

	
	type MappedTable<T, U> = {
		map: <V>(callback: (mapper: ColumnMapper<U>) => V) => MappedTable<T, U & V>;
		getMany: <F>(filter?: Filter, fetchingStrategy?: FetchingStrategy<U & F>) => Promise<RemoveNever<PickFromStrategy<F, T>>[]>;
	  } & MappedColumnType<U>;

	export interface ORM {
		table: <T>(tableName: string) => Table<T>;
	}

	type PickFromStrategy<F, T> = {
		[K in keyof T]:
		  K extends keyof F ?
			F[K] extends true ? T[K] :
			F[K] extends FetchingStrategy<infer U> ? PickFromStrategy<F[K], T[K]> :
			never :
		  never;
	  };

	  type RemoveNever<T> = {
		[K in keyof T as T[K] extends never ? never : K]: T[K] extends object ? RemoveNever<T[K]> : T[K]
	  };
		  
	
}

declare const orm: ORM.ORM;
export default orm;
