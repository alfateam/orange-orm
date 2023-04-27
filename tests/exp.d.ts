import { Filter, RawFilter } from "../typings"

declare function r<T>(defs: T): Extend<T>;

declare namespace r {
	function table<T>(dbName: string): TableBuilder<T>;
	// function foo<T>(dbName: Array<Pick<): any;
	// function table(name: string): Table;
	// function end(): Promise<void>;
	// function postgres(connectionString: string, options?: PoolOptions): Pool;
	// function sqlite(connectionString: string, options?: PoolOptions): Pool;
	// function sap(connectionString: string, options?: PoolOptions): Pool;
	// function mssql(connectionConfig: ConnectionConfig, options?: PoolOptions): Pool;
	// function mssql(connectionString: string, options?: PoolOptions): Pool;
	// function mssqlNative(connectionString: string, options?: PoolOptions): Pool;
	// function mysql(connectionString: string, o
}

export = r;

type Extend<T> = {
	[key in keyof T]: T[key] extends TableDef<infer U, infer VMap> ? Table<T[key], U, VMap> : T[key]
}

type Table<TTableDef, T, TTableMap> = {
	getAll(strategy: Strategy<TTableDef>): Promise<T[]>
	getMany(filter: RawFilter): Promise<T[]>
	getMany(filter: RawFilter, strategy: Strategy<TTableDef>): Promise<T[]>
	getMany(rows: Partial<T>[], strategy: Strategy<TTableDef>): Promise<T[]>
	getOne(filter: RawFilter): Promise<T>
	getOne(filter: RawFilter, strategy: Strategy<TTableDef>): Promise<T>
	getOne(row: Partial<T>): Promise<T>
	getOne(row: Partial<T>, strategy: Strategy<TTableDef>): Promise<T>
} &
	{
		[key in keyof TTableMap]: TTableMap[key] extends StringColumnDef ? StringColumn : (
			TTableMap[key] extends JSONColumnDef ? JSONColumn :
			(TTableMap[key] extends TableDef<infer U, infer V> ? RelatedTable<TTableMap[key],U,V> :
			TTableMap[key]));
	}
type RelatedTable<TTableDef, T, TTableMap> = {
	exists(): Filter
} &
	{
		[key in keyof TTableMap]: TTableMap[key] extends StringColumnDef ? StringColumn : (
			TTableMap[key] extends JSONColumnDef ? JSONColumn :
			(TTableMap[key] extends TableDef<infer U, infer V> ? RelatedTable<TTableMap[key],U,V> :
			TTableMap[key]));
	}

type AllowedStrategies<T> = {
	[key in keyof T]: Required<T>[key] extends StringColumnDef | JSONColumnDef ?
	key : T[key] extends TableDef<infer Sub, infer SubMap> ? (T[key] extends Sub ? never : key) : never;
}[keyof T]



type Strategy<TTableDef> = Partial<Pick<MappedStrategy<Required<TTableDef>>, AllowedStrategies<Required<TTableDef>>>> & { limit?: number, orderBy: OrderBy<TTableDef>[] }


type MappedStrategy<T> = {
	[key in keyof T]: Required<T>[key] extends StringColumnDef | JSONColumnDef ?
	boolean : Required<T[key]> extends infer W extends TableDef<infer Sub, infer SubMap> ? Partial<MappedStrategy<Pick<W, AllowedStrategies<Required<W>>>>> : number;
}

type ColumnKeys<T> = {
	[key in keyof T]: Required<T>[key] extends StringColumnDef | string | JSONColumnDef ?
	key : never;
}[keyof T]


type OrderBy<T> = AscDesc<Pick<T, ColumnKeys<Required<T>>>>;

type AscDesc<T> = {
	[K in keyof T]: `asc ${(string & keyof T)}` | `desc ${(string & keyof T)}` | K;
}[keyof T];

type TableBuilder<T> = {
	map<TMap extends TableDef<T, TMap>>(fn: (mapper: Mapper<T>) => TMap): TableDef<T, TMap>;
};

type TableDef<T, TTableMap extends TableDef<T, TTableMap>> = {
	[key in keyof Partial<T>]: 
		TTableMap[key] extends  StringColumnDef ? StringColumnDef :
		TTableMap[key] extends JSONColumnDef ? JSONColumnDef :
		(TTableMap[key] extends TableDef<infer C, infer CTableMap> ? TableDef<C, CTableMap> : T[key]);
};




type Mapper<T> = {
	column(name: string): ColumnMapper
	primaryColumn(name: string): PrimaryColumnDef
	// references<OtherTable extends Table<infer U, infer TTableMap>>(table: OtherTable) : Table<infer U, infer TTableMap>;
	// references<U extends Table<infer U, infer TTableMap extends Table<U, TTableMap>>>(table: U) : Table<infer U, infer TTableMap>;
	references<U>(table: U): Reference<T, U>;
}

type KeysOf<T, Key extends keyof T = keyof T> = Key extends string
	? T[Key] extends string ? `${Key}` | Key : never
	: never;

type Reference<From, To> = {
	by(...keys: Array<KeysOf<Required<From>>>): To
	// by<K extends keyof From>(...keys: K[]) : To
};



type ColumnMapper = {
	string(): StringColumnDef
	json(): JSONColumnDef;
}

type PrimaryColumnDef = {
	string(): PrimaryStringColumnDef
}



//@ts-ignore
const bar: Rdb2 = {};

// export default bar;


type StringColumnDef = {
	isColumn: 'string';
	// equals(string: string): Filter;
}

type StringColumn = {
	equals(string: string): Filter;
}

type ColumnDef = {
	isColumn: true;
}

type JSONColumnDef = {
	isColumn: 'json';
}

type JSONColumn = {
	equals(string: string): Filter;
}

type PrimaryStringColumnDef = PrimaryColumn & {
	equals(string: string): Filter;
}

type Column = {

}

type PrimaryColumn = {

}

// interface ColumnMap {
// 	string(): StringColumnDefMap,
// 	number(): NumberColumnMap,
// 	date(): DateColumnMap,
// 	uuid(): UuidColumnMap,
// 	binary(): BinaryColumnMap,
// 	json(): JSONColumnMap,
// 	boolean(): BooleanColumnMap,
// }


// interface StringColumnDefMap extends NColumnMap<'string'> {

// }

// interface NumberColumnMap extends NColumnMap<'number'> {

// }

// interface DateColumnMap extends NColumnMap<'date'> {

// }
// interface UuidColumnMap extends NColumnMap<'uuid'> {

// }

// interface BinaryColumnMap extends NColumnMap<'binary'> {
// }

// interface BooleanColumnMap extends NColumnMap<'boolean'> {
// }

// interface JSONColumnMap extends NColumnMap<'json'> {
// }
// interface StringColumnDefMap extends NColumnMap<'string'> {

// }

// interface NumberColumnMap extends NColumnMap<'number'> {

// }

// interface DateColumnMap extends NColumnMap<'date'> {

// }
// interface UuidColumnMap extends NColumnMap<'uuid'> {

// }

// interface BinaryColumnMap extends NColumnMap<'binary'> {
// }

// interface BooleanColumnMap extends NColumnMap<'boolean'> {
// }

// interface JSONColumnMap extends NColumnMap<'json'> {
// }

// type ColumnTypes = 'string' | 'boolean' | 'number' | 'date' | 'uuid' | 'binary' | 'json';

// type NColumnMap<TColumnType extends ColumnTypes> = {
// 	columnType: TColumnType
// }

type Params = Record<string, any>

type ReqParams<A, K extends keyof A> = A[K] extends (p: infer P) => Promise<any>
	? P extends Params
	? P
	: never
	: never

type a = {
	foo: '1',
	bar: 2
}

type fn = (...args: [number, string, boolean]) => void;



type Keys<T, Key extends keyof T = keyof T> = Key extends string
	? T[Key] extends string ? `${Key}` | Key : never
	: never;


type Fn2<A, K extends keyof A> = (...args: Keys<A, K>[]) => void;
// type Fn2<A,K extends keyof A> =  (...args: [number, string, boolean]) => void;

type Foo = {
	a: '1',
	b: 2
}

// const b : Fn2<Foo>;
// b()