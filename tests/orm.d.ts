// declare namespace ORM {

// 	interface ORM {		
// 		table: (tableName: string) => Table<{}>;
// 		tableOf: <T>(tableName: string) => Table<T>;
// 	}


// }

// interface UuidColumnType {
// 	equalTo(value: string): Filter;
// }

// interface DateColumnType {
// 	greaterThan(value: Date): Filter;
// 	between(from: Date, to: Date): Filter;
// }

// interface StringColumnType {
// 	equalTo(value: string): Filter;
// 	greaterThan(value: string): Filter;
// 	startsWith(value: string): Filter;
// 	endsWith(value: string): Filter;
// }

// interface NumberColumnType {
// 	greaterThan(value: number): Filter;
// 	between(from: number, to: number): Filter;
// }

// interface ColumnType {
// 	string: () => StringColumnType;
// 	uuid: () => UuidColumnType;
// 	number: () => NumberColumnType;
// 	date: () => DateColumnType;
// }

// interface RawFilter {
// 	sql: string | (() => string);
// 	parameters?: any[];
// }

// interface Filter extends RawFilter {
// 	and<T extends RawFilter>(otherFilter: T): Filter;
// }

// type Table<T> = ((<U>(callback: (mapper: ColumnMapper<T>) => U) => MappedTable<T, U>) & MappedTable<T, T>);

// type FetchingStrategy<T> = {
// 	[K in keyof T]?: boolean | FetchingStrategy<T[K]>;
// } & {
// 	orderBy?: Array<OrderBy<Extract<keyof T, string>>>;
// 	limit?: number;
// 	offset?: number;
// };

// type OrderBy<T extends string> = `${T} ${'asc' | 'desc'}` | T;

// type ReferenceMapper<TFrom, TTo> = {
// 	by(foreignKey: keyof TFrom): MappedTable<any, TTo>;
// };

// type ColumnMapper<T> = {
// 	column: (columnName: string) => ColumnType;
// 	references: <TTo>(mappedTable: MappedTable<any, TTo>) => ReferenceMapper<T, TTo>;
// };

// type MappedTable<T, U> = ((<V>(callback: (mapper: ColumnMapper<U>) => V) => MappedTable<T, U & V>) & {
//     getMany: <FS extends FetchingStrategy<U>>(filter: Filter, fetchingStrategy: FS) => FetchedProperties<Required<U>, Required<FS>>;
// } & U);

// type AtLeastOneTrue<T> = {
// 	[K in keyof T]: T[K] extends true ? true : never;
// }[keyof T] extends never ? false : true;

// type ExtractColumns<T, TStrategy> = {
// 	[K in keyof TStrategy]: K extends keyof T
// 	? T[K] extends StringColumnType | UuidColumnType | NumberColumnType | DateColumnType ? TStrategy[K] : never
// 	: never
// }

// type FetchedProperties<T, TStrategy> = AtLeastOneTrue<RemoveNever<ExtractColumns<T, TStrategy>>> extends true
// 	? {
// 		[K in keyof T]: K extends keyof TStrategy
// 		? TStrategy[K] extends true 
// 			? T[K] extends StringColumnType | UuidColumnType | NumberColumnType | DateColumnType			
// 				? T[K]
// 				: FetchedProperties<Required<T[K]>, {}>		
// 			: TStrategy[K] extends false
// 				? never
// 				: FetchedProperties<Required<T[K]>, Required<TStrategy[K]>>			
// 		: never
// 	}
// 	: {
// 		[K in keyof T]: K extends keyof TStrategy
// 		? TStrategy[K] extends true 
// 			? T[K] extends StringColumnType | UuidColumnType | NumberColumnType | DateColumnType			
// 				? T[K]
// 				: FetchedProperties<Required<T[K]>, {}>		
// 			: TStrategy[K] extends false
// 				? never
// 				: FetchedProperties<Required<T[K]>, Required<TStrategy[K]>>			
// 		: NegotiateDefaultStrategy<T[K]>
// 	};

// type NegotiateDefaultStrategy<T> = T extends StringColumnType | UuidColumnType | NumberColumnType | DateColumnType ? T : never

// type RemoveNever<T> = {
// 	[K in keyof T as T[K] extends never ? never : K]: T[K] extends object ? RemoveNever<T[K]> : T[K]
// };

// declare const orm: ORM.ORM;
// export default orm;
//todo
declare namespace ORM {

	interface ORM {		
		table: (tableName: string) => Table<{}>;
		tableOf: <T>(tableName: string) => Table<T>;
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


type FetchingStrategy<T> = {
	[K in keyof T]?: boolean | FetchingStrategy<T[K]>;
} & {
	orderBy?: Array<OrderBy<Extract<keyof AllowedColumns<T>, string>>>;	
	limit?: number;
	offset?: number;
};


 type OrderBy<T extends string> = `${T} ${'asc' | 'desc'}` | T;

// [P in keyof T as `${string & P}` | `${string & P} desc`]

// orderBy?: Array< keyof  {
// 	[P in keyof T as `${string & P}` | `${string & P} desc`]


type RelatedTable = {
	isRelatedTable: () => boolean;
//   ['__RelatedTableMarker__']: 'exclude';
};

type ReferenceMapper<TFrom, TTo> = {
	by(foreignKey: keyof TFrom): MappedTable<any, TTo> & RelatedTable;
};

type ColumnMapper<T> = {
	column: (columnName: string) => ColumnType;
	references: <TTo>(mappedTable: MappedTable<any, TTo>) => ReferenceMapper<T, TTo>;
};


type MappedTable<T, U> = (<V extends AllowedColumnsAndTables<V>>(callback: (mapper: ColumnMapper<U>) => V) => MappedTable<T, U & V>) & {
	getMany: <FS extends FetchingStrategy<U>>(filter: Filter, fetchingStrategy: FS) => StrategyToRow<FetchedProperties<Required<U>, Required<FS>>>;
  } & U;
  
  type Table<T> = (<U extends AllowedColumnsAndTables<U>>(callback: (mapper: ColumnMapper<T>) => U) => MappedTable<T, U>) & MappedTable<T,T>;


type ColumnTypes = StringColumnType | UuidColumnType | NumberColumnType | DateColumnType;
type ColumnAndTableTypes = ColumnTypes | RelatedTable  ;


type StrategyToRow<T> = {
	[K in keyof T as T[K] extends never ? never : K]: T[K] extends StringColumnType
	? string
		:T[K] extends NumberColumnType
		? number
		:T[K] extends UuidColumnType
		? string
		:T[K] extends DateColumnType
		? string
	: StrategyToRow<T[K]>
  };

  type AllowedColumnsAndTables<T> = {
  [P in keyof T]: T[P] extends ColumnAndTableTypes
  	? T[P] 
	:  never;
};

  type AllowedColumns<T> = RemoveNever<{
  [P in keyof T]: T[P] extends ColumnTypes
  	? T[P] 
	:  never;
}>;

type AtLeastOneTrue<T> = {
	[K in keyof T]: T[K] extends true ? true : never;
}[keyof T] extends never ? false : true;

type ExtractColumns<T, TStrategy> = {
	[K in keyof TStrategy]: K extends keyof T
	? T[K] extends StringColumnType | UuidColumnType | NumberColumnType | DateColumnType ? TStrategy[K] : never
	: never
}
	type FetchedProperties<T, TStrategy> = AtLeastOneTrue<RemoveNever<ExtractColumns<T, TStrategy>>> extends true
	? {
		[K in keyof T]: K extends keyof TStrategy
		? TStrategy[K] extends true 
			? T[K] extends StringColumnType | UuidColumnType | NumberColumnType | DateColumnType			
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
			? T[K] extends StringColumnType | UuidColumnType | NumberColumnType | DateColumnType			
				? T[K]
				: FetchedProperties<Required<T[K]>, {}>		
			: TStrategy[K] extends false
				? never
				: FetchedProperties<Required<T[K]>, Required<TStrategy[K]>>			
		: NegotiateDefaultStrategy<T[K]>
	};


type NegotiateDefaultStrategy<T> = T extends StringColumnType | UuidColumnType | NumberColumnType | DateColumnType ? T : never

type RemoveNever<T> = {
	[K in keyof T as T[K] extends never ? never : K]: T[K] extends object ? RemoveNever<T[K]> : T[K]
};

declare const orm: ORM.ORM;
export default orm;
