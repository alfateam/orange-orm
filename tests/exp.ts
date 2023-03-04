import { Filter } from "../typings"

interface Rdb2 {
	table<T>(dbName: string): TableBuilder<T>;
}


type TableBuilder<T> = {
	map<TMap extends Table<T, TMap>>(fn:  (mapper: Mapper<T>) => TMap): Table<T, TMap>
	// map<TMap extends Table<T, TMap>>(map: TMap): Table<T, TMap>
}

type Mapper<T> = {
	column() : Column
	// references<OtherTable extends Table<infer U, infer TTableMap>>(table: OtherTable) : Table<infer U, infer TTableMap>;
	// references<U extends Table<infer U, infer TTableMap extends Table<U, TTableMap>>>(table: U) : Table<infer U, infer TTableMap>;
	references<U>(table: U) : Reference<T,U>;
}

// type Columns<T> = {
// 	[key in keyof T]: T[key] extends StringColumn? T[key] : never;
// };

type KeysOf<T, Key extends keyof T = keyof T> = Key extends string
    ? `${Key}, ${KeysOf<Omit<T, Key>>}` | Key
    : never;

// type PickTypeKeys<Obj, Type, T extends keyof Obj = keyof Obj> = ({ [P in keyof Obj]: Obj[P] extends Type ? P : never })[T];
// type PickType<T, Type> = Pick<T, PickTypeKeys<T, Type>>

type Reference<From, To> = {
	by(keys: KeysOf<From>[]) : To
	// by<K extends keyof From>(...keys: K[]) : To
};



type Column = {
	string() : StringColumn
}

type Table<T, TTableMap extends Table<T,TTableMap>> = {
	[key in keyof Partial<T>]: TTableMap[key] extends string | StringColumnMap | StringColumn ? StringColumn : 
	(TTableMap[key] extends Table<infer C, infer CTableMap> ? Table<C, CTableMap> : T[key]);
}


type ChildTable<T, TTableMap extends Table<T,TTableMap>> = {
	[key in keyof Partial<T>]: TTableMap[key] extends string | StringColumnMap | StringColumn ? StringColumn : 
	(TTableMap[key] extends Table<infer C, infer CTableMap> ? Table<C, CTableMap> : TTableMap[key]);
}
& 
{
	exists: Filter;
}


//@ts-ignore
const bar: Rdb2 = {};


const customer = bar.table<Customer>('customer').map((table) => {
	return {
		customerId: table.column().string()
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
		customer: customer,
		deliveryAddress: mapper.references(order0).by()
	}
});

const deliveryAddress2 = bar.table<DeliveryAddress>('deliveryAddress').map((table) => {
	return {
		addressId: table.column().string(),
		order: table.references(order)
	}
});




type StringColumn = {
	equals(string: string): Filter;
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
	OrderLines?: OrderLine;
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