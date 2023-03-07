import { Filter } from "../typings"

interface Rdb2 {
	table<T>(dbName: string): TableBuilder<T>;
	define<T>(defs: T): Extend<T>
}

type Extend<T> = {
	[key in keyof T]: T[key] extends TableDef<infer U, infer VMap> ? Table<T[key], U, VMap> : T[key]
}

type Table<W, U, UMap> = W & {
	getAll(strategy:  Partial<Pick<MappedStrategy<Required<W>>, AllowedStrategies<Required<W>>>>): Promise<U[]>
	// getAll(strategy: MappedStrategy<Required<W>>): Promise<U[]>
	// getAll(strategy: Pick<W, AllowedStrategies<Required<W>>>): Promise<U[]>
	getAll2(): Promise<U[]>
}


interface Person {
	id: number;
	name: string;
	lastName: string;
	foo: boolean;
	load: () => Promise<Person>;
}

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

type f = SubType2<Person, string, boolean>;


type AllowedStrategies<T> = {
	[key in keyof T]: Required<T>[key] extends StringColumn ? 
	key : T[key] extends TableDef<infer Sub, infer SubMap> ? (T[key] extends Sub?  never: key) : never;
}[keyof T]

type Strategy2<T> = Pick<T, AllowedStrategies<Required<T>>>;

// type Lars<T> = Pick<T, AllowedStrategies<Required<T>>>;

type MappedStrategy<T> = {
	[key in keyof T]: Required<T>[key] extends StringColumn ? 
	boolean : Required<T[key]> extends infer W extends TableDef<infer Sub, infer SubMap> ?  Partial<MappedStrategy<Pick<W, AllowedStrategies<Required<W>>>>> : number;
}




// type Strat<T> = Pick<T, AllowedStrategies<T>>

// type Strategy<T> = Pick<T,StrategyHelper<Required<T>>[keyof T]>;
// type Strategy<T> = Omit<StrategyHelper<Required<T>>[keyof T];




type FilteredKeys<T, U> = { [P in keyof T]: T[P] extends U ? P : never }[keyof T];

type FooMap<T> = T extends infer TT
	? {
		[key in FilteredKeys<T, StringColumn>]: FooItem<T[key]>
	}
	: never

type FooItem<T> = T extends StringColumn ? { value: T } : undefined;



// type Strategy<T> = {
// 	[key in keyof KeysMatching<T, StringColumn>]: Required<KeysMatching<T, StringColumn>>[key] extends StringColumn ? 
// 	boolean : Required<KeysMatching<T, StringColumn>>[key] extends TableDef<infer Sub, infer SubMap> ? Strategy<Required<KeysMatching<T, StringColumn>>[key]> : never;
// }

type TableBuilder<T> = {
	map<TMap extends TableDef<T, TMap>>(fn: (mapper: Mapper<T>) => TMap): TableDef<T, TMap>
	// map<TMap extends Table<T, TMap>>(map: TMap): Table<T, TMap>
}

type Mapper<T> = {
	column(): ColumnDef
	primaryColumn(): PrimaryColumnDef
	// references<OtherTable extends Table<infer U, infer TTableMap>>(table: OtherTable) : Table<infer U, infer TTableMap>;
	// references<U extends Table<infer U, infer TTableMap extends Table<U, TTableMap>>>(table: U) : Table<infer U, infer TTableMap>;
	references<U>(table: U): Reference<T, U>;
}

type KeysOf<T, Key extends keyof T = keyof T> = Key extends string
	? T[Key] extends string ? `${Key}` | Key : never
	: never;

type Reference<From, To> = {
	by(...keys: Array<KeysOf<From>>): To
	// by<K extends keyof From>(...keys: K[]) : To
};



type ColumnDef = {
	string(): StringColumn
}

type PrimaryColumnDef = {
	string(): PrimaryStringColumn
}

type TableDef<T, TTableMap extends TableDef<T, TTableMap>> = {
	[key in keyof Partial<T>]: TTableMap[key] extends string | StringColumnMap | StringColumn ? StringColumn :
	(TTableMap[key] extends TableDef<infer C, infer CTableMap> ? TableDef<C, CTableMap> : T[key]);
}
type TableDefAll<T, TTableMap extends TableDef<T, TTableMap>> = {
	[key in keyof Partial<T>]: TTableMap[key] extends string | StringColumnMap | StringColumn ? StringColumn :
	(TTableMap[key] extends TableDefAll<infer C, infer CTableMap> ? TableDefAll<C, CTableMap> : never);
}

// type TableDefAll<T, TTableMap extends TableDef<T,TTableMap>> = {
// 	[key in keyof Required<T>]: Required<TTableMap>[key] extends string | StringColumnMap | StringColumn ? StringColumn : 
// 	(Required<TTableMap>[key] extends TableDefAll<infer C, infer CTableMap> ? TableDef<C, CTableMap> : never);
// }


// type ChildTable<T, TTableMap extends Table<T,TTableMap>> = {
// 	[key in keyof Partial<T>]: TTableMap[key] extends string | StringColumnMap | StringColumn ? StringColumn : 
// 	(TTableMap[key] extends Table<infer C, infer CTableMap> ? Table<C, CTableMap> : TTableMap[key]);
// }
// & 
// {
// 	exists: Filter;
// }




//@ts-ignore
const bar: Rdb2 = {};



const deliveryAddress2 = bar.table<DeliveryAddress>('deliveryAddress').map((table) => {
	return {
		addressId: table.column().string(),
		order: table.references(order)
	}
});




type StringColumn = {
	equals(string: string): Filter;
}

type PrimaryStringColumn = PrimaryColumn & {
	equals(string: string): Filter;
}

type Column = {

}

type PrimaryColumn = {

}

interface ColumnMap {
	string(): StringColumnMap,
	number(): NumberColumnMap,
	date(): DateColumnMap,
	uuid(): UuidColumnMap,
	binary(): BinaryColumnMap,
	json(): JSONColumnMap,
	boolean(): BooleanColumnMap,
}


interface StringColumnMap extends NColumnMap<'string'> {

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
interface StringColumnMap extends NColumnMap<'string'> {

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

class Order {
	id: string;
	customer?: Customer;
	customerId?: string;
	deliveryAddress?: DeliveryAddress;
	orderLines?: OrderLine;
}

class Customer {
	customerId: string;
	name: string;
}

class OrderLine {
	lineId: string;
}

class DeliveryAddress {
	addressId: string;
	order: Order
}
;


const customer = bar.table<Customer>('customer').map((table) => {
	return {
		customerId: table.column().string(),
		name: table.column().string()
	}
});

const deliveryAddress = bar.table<DeliveryAddress>('deliveryAddress').map((table) => {
	return {
		addressId: table.column().string()
	}
});

const order0 = bar.table<Order>('order').map((mapper) => {
	return {
		id: mapper.column().string(),
		customerId: mapper.column().string()
	}
});


const order = bar.table<Order>('order').map((mapper) => {
	return {
		id: mapper.column().string(),
		customerId: mapper.column().string(),
		customer: customer,
		// deliveryAddress: mapper.references(deliveryAddress).by('customerId')
	}
});


order.deliveryAddress
const db = bar.define({
	customer: customer,
	order: order
});


