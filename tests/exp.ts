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
	references<U>(table: U) : U;
}




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


const user = bar.table<User>('user').map((mapper) => {
	return {
		id: mapper.column().string(),
		email: mapper.column().string(),	
	}
});

const line = bar.table<Line>('line').map((table) => {
	return {
		lineId: table.column().string()
	}
});

const customerCore = bar.table<Customer>('customer').map((table) => {
	return {
		customerId: table.column().string(),
		name: table.column().string(),		
	};
});


const lineCore = bar.table<Line>('line').map((mapper) => {
	return {
		lineId: mapper.column().string(),
		user: mapper.references(user)
	};
});

const customer = bar.table<Customer>('customer').map((table) => {
	return {
		customerId: table.column().string(),
		line: table.references(line),
		user: table.references(user)
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

class User {
	id: string;
	email: string;
	customer?: Customer;
}

class Customer {
	customerId: string;
	name: string;
	user: User;
	line: Line;
}

class Line {
	lineId: string;
}
;