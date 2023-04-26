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

// type StringKeyOf<T> = Extract<keyof T, string>;

// type PickKeys<T, K extends StringKeyOf<T>> = {
//   <Keys extends (K | `asc ${K}`)[]>(): (obj: T) => Pick<T, Extract<Keys[number], K>>;
// }
// interface Bar {
// 	id: string;
// 	bar: string;
// }

// function blabla(arg: StringKeyOf<Bar>) : any {
// 	return 1;
// }


// const f = blabla(['a']);

// interface Rdb2 {
// 	table<T>(dbName: string): TableBuilder<T>;
// 	// define<T extends TableDef<infer V, infer VMap>>(defs: T): Extend<T>
// 	define<T, TTableMap extends TableDef<infer V, infer VMap>>(defs: T): Extend<T>
// 	// TableDef<T, TTableMap extends TableDef<T, TTableMap>>
// }

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
			TTableMap[key]);
	}

// type KeysOf<T, Key extends keyof T = keyof T> = Key extends string
// ? T[Key] extends string ? `${Key}` | Key : never
// : never;

// type PrimaryKeys<T> = {
// 	[key in keyof T]: T[key] extends PrimaryColumn ? key : never
// }[keyof T]

// type GetById<T> = MapGetById<Pick<T, PrimaryKeys<T>>>;



// [key in keyof TMap as TMap[key] extends StringColumnDef ? 'valid': (TMap[key] extends TableDef<infer C, infer CTableMap> ? (TMap[key] extends C?  'valid' : 'invalid') : 'invalid')]


// interface Person {
// 	id: number;
// 	name: string;
// 	lastName: string;
// 	foo: boolean;
// 	load: () => Promise<Person>;
// }

type FilterFlags<Base, Condition> = {
	[Key in keyof Base]:
	Base[Key] extends Condition ? Key : never
};

type AllowedNames<Base, Condition> =
	FilterFlags<Base, Condition>[keyof Base]

type SubType<Base, Condition> =
	Pick<Base, AllowedNames<Base, Condition>>


type FilterFlags2<Base, Condition, Condition2> = {
	[Key in keyof Base]:
	Base[Key] extends Condition | Condition2 ? Key : never
};

type AllowedNames2<Base, Condition, Condition2> =
	FilterFlags2<Base, Condition, Condition2>[keyof Base]

type SubType2<Base, Condition, Condition2> =
	Pick<Base, AllowedNames2<Base, Condition, Condition2>>

// type f = SubType2<Person, string, boolean>;


type AllowedStrategies<T> = {
	[key in keyof T]: Required<T>[key] extends StringColumnDef | JSONColumnDef ?
	key : T[key] extends TableDef<infer Sub, infer SubMap> ? (T[key] extends Sub ? never : key) : never;
}[keyof T]


type Strategy<TTableDef> = Partial<Pick<MappedStrategy<Required<TTableDef>>, AllowedStrategies<Required<TTableDef>>>> & { limit?: number, orderBy: OrderBy<TTableDef>[] }


// type MappedStrategy<T> = {
// 	[key in keyof T]: Required<T>[key] extends StringColumnDef ? 
// 	boolean : Required<T[key]> extends infer W extends TableDef<infer Sub, infer SubMap> ?  Strategy<W> : number;	
// } 

type MappedStrategy<T> = {
	[key in keyof T]: Required<T>[key] extends StringColumnDef | JSONColumnDef ?
	boolean : Required<T[key]> extends infer W extends TableDef<infer Sub, infer SubMap> ? Partial<MappedStrategy<Pick<W, AllowedStrategies<Required<W>>>>> : number;
}


//this works
// type staffKeys<T> = {
// 	[K in keyof T]: `asc ${(string & keyof T)}` | `desc ${(string & keyof T)}` | K;
//   }[keyof T];

type ColumnKeys<T> = {
	[key in keyof T]: Required<T>[key] extends StringColumnDef | string | JSONColumnDef ?
	key : never;
}[keyof T]


type OrderBy<T> = AscDesc<Pick<T, ColumnKeys<Required<T>>>>;

type AscDesc<T> = {
	[K in keyof T]: `asc ${(string & keyof T)}` | `desc ${(string & keyof T)}` | K;
}[keyof T];

// type OrderBy<T> = {
// 	[K in keyof T]: `asc ${(string & keyof T)}` | `desc ${(string & keyof T)}` | K;
//   }[keyof T];

// type OrderBy<T> = {
// 	[K in keyof T]: `asc ${(string & keyof T)}` | `desc ${(string & keyof T)}` | K;
//   }[keyof T];


type TableBuilder<T> = {
	map<TMap extends TableDef<T, TMap>>(fn: (mapper: Mapper<T>) => TMap): TableDef<T, TMap>
	// map<TMap extends Table<T, TMap>>(map: TMap): Table<T, TMap>
}

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


type NegotiateTableDefHelper<T, TMap> = {
	[key in keyof TMap as TMap[key] extends StringColumnDef ? 'valid' : (TMap[key] extends TableDef<infer C, infer CTableMap> ? (TMap[key] extends C ? 'valid' : 'invalid') : 'invalid')]
}




type TableDef<T, TTableMap extends TableDef<T, TTableMap>> = {
	[key in keyof Partial<T>]: TTableMap[key] extends string | StringColumnDef ? StringColumnDef :
	(TTableMap[key] extends TableDef<infer C, infer CTableMap> ? TableDef<C, CTableMap> : T[key]);
}
type TableDefAll<T, TTableMap extends TableDef<T, TTableMap>> = {
	[key in keyof Partial<T>]: TTableMap[key] extends string | StringColumnDefMap | StringColumnDef ? StringColumnDef :
	(TTableMap[key] extends TableDefAll<infer C, infer CTableMap> ? TableDefAll<C, CTableMap> : never);
}

// type TableDefAll<T, TTableMap extends TableDef<T,TTableMap>> = {
// 	[key in keyof Required<T>]: Required<TTableMap>[key] extends string | StringColumnDefMap | StringColumnDef ? StringColumnDef : 
// 	(Required<TTableMap>[key] extends TableDefAll<infer C, infer CTableMap> ? TableDef<C, CTableMap> : never);
// }


// type ChildTable<T, TTableMap extends Table<T,TTableMap>> = {
// 	[key in keyof Partial<T>]: TTableMap[key] extends string | StringColumnDefMap | StringColumnDef ? StringColumnDef : 
// 	(TTableMap[key] extends Table<infer C, infer CTableMap> ? Table<C, CTableMap> : TTableMap[key]);
// }
// & 
// {
// 	exists: Filter;
// }




//@ts-ignore
const bar: Rdb2 = {};

// export default bar;


type StringColumnDef = {
	isColumn: true;
	// equals(string: string): Filter;
}

type StringColumn = {
	equals(string: string): Filter;
}

type ColumnDef = {
	isColumn: true;
}

type JSONColumnDef = {
	isColumn: true;
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

interface ColumnMap {
	string(): StringColumnDefMap,
	number(): NumberColumnMap,
	date(): DateColumnMap,
	uuid(): UuidColumnMap,
	binary(): BinaryColumnMap,
	json(): JSONColumnMap,
	boolean(): BooleanColumnMap,
}


interface StringColumnDefMap extends NColumnMap<'string'> {

}

interface NumberColumnMap extends NColumnMap<'number'> {

}

interface DateColumnMap extends NColumnMap<'date'> {

}
interface UuidColumnMap extends NColumnMap<'uuid'> {

}

interface BinaryColumnMap extends NColumnMap<'binary'> {
}

interface BooleanColumnMap extends NColumnMap<'boolean'> {
}

interface JSONColumnMap extends NColumnMap<'json'> {
}
interface StringColumnDefMap extends NColumnMap<'string'> {

}

interface NumberColumnMap extends NColumnMap<'number'> {

}

interface DateColumnMap extends NColumnMap<'date'> {

}
interface UuidColumnMap extends NColumnMap<'uuid'> {

}

interface BinaryColumnMap extends NColumnMap<'binary'> {
}

interface BooleanColumnMap extends NColumnMap<'boolean'> {
}

interface JSONColumnMap extends NColumnMap<'json'> {
}

type ColumnTypes = 'string' | 'boolean' | 'number' | 'date' | 'uuid' | 'binary' | 'json';

type NColumnMap<TColumnType extends ColumnTypes> = {
	columnType: TColumnType
}

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