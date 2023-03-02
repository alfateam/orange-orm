import { Filter } from "../typings"

interface Rdb2 {
	table<T>(dbName: string): TableBuilder<T>;
}


type TableBuilder<T> = {
	map<TMap extends TableMapOf<T>>(map: TMap): Table<T, TMap>
}

type TableMapOf<T> = {
	[key in keyof T]-?: T[key] extends string ? StringColumnMap : any;
};


type Table<T, TTableMap extends TableMapOf<T>> = {
	[key in keyof T]-?: TTableMap[key] extends StringColumnMap ? StringColumn : (TTableMap[key] extends Table<infer C, infer CTableMap> ? ChildTableOf<C, CTableMap> : Date);
}  & {
	getAll(): Promise<[T]>;
}


type ChildTableOf<T, TTableMap extends TableMapOf<T>> = {
	[key in keyof T]-?: TTableMap[key] extends StringColumnMap ? StringColumn : (TTableMap[key] extends Table<infer C, infer CTableMap> ? ChildTableOf<C, CTableMap> : Date);
}
& ChildTable;


type ChildTable = {
	exists: Filter;
}


//@ts-ignore
const bar: Rdb2 = {};

const line = bar.table<Line>('line').map({
	lineId: {columnType: 'string'}	
});
const customer = bar.table<Customer>('customer').map({
	customerId: { columnType: 'string' },
	name: { columnType: 'string' },
	line: line
});


const user = bar.table<User>('user').map({
	id: { columnType: 'string' },
	email: { columnType: 'string' },
	customer: customer
});

// user.customer.

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
	// name: string;
	// count: number;
	// someDate: Date;
	customer?: Customer;
	// lines?: Line[];
}

class Customer {
	customerId: string;
	name: string;
	line: Line;
}

class Line {
	lineId: string;
	// count?: number;
	// user: User;
	// foo: SomeJSON;
}
;