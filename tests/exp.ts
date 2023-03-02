import { Filter } from "../typings"



type TableMap =  Record<string, NColumnMap<ColumnTypes>>

type ReferenceMap<TRelated> = {
	// exists(): Filter
}



// type Mapped<T> = {

// }
type Mapper = { 
	column(name: string): ColumnMap
}
interface Rdb2 {
	table<T>(fn: (mapper: Mapper) => TableMapOf<T>): Table<T, TableMapOf<T>>
	table2<T>(dbName: string): TableBuilder<T>;
}

type TableBuilder<T> = {
	map<TMap extends TableMapOf<T>>(map: TMap): Table<T, TMap>
}

// type Table<T, TTableMap extends TableMapOf<T>> = {
type Table<T, TTableMap extends TableMapOf<T>> = {
	[key in keyof T]-?: TTableMap[key] extends StringColumnMap ? StringColumn: never ;
	// [key in keyof T]-?: TTableMap[key] extends StringColumnMap ? StringColumn: (TTableMap[key] extends infer U extends TableMapOf<infer Child> ? ChildTable<U> : never) ;
	// (TTableMap[key]  extends infer Map  ? TableMapOf<Map> : never);
	// [key in keyof T as TTableMap[key]]: T[k];
	
} 
// & {
// 	getAll() : Promise<T[]>;
// }

type TableMapOf<T> = {
	[key in keyof T]-?: T[key] extends string ? StringColumnMap: any ;
	//  [key in keyof T]-?: StringColumnMap | NumberColumnMap | DateColumnMap | UuidColumnMap | BinaryColumnMap | BooleanColumnMap | any 
	//  (T[key]  extends Table<infer RTable, infer TTableMap> & TableMapOf<infer RTable> ?  Table<infer RTable, infer TTableMap> & TableMapOf<infer RTable> : never)
	//  (T[key]  extends TableMapOf<infer Related> ? TableMapOf<infer Related>: never)
	//  T[key] extends infer U extends TableMapOf<U> ? ReferenceMap<U> : never
} ;
// type TableMapOf<T> = { [key in keyof T]-?: NColumnMap<ColumnTypes>};


//@ts-ignore
const bar: Rdb2 = {};

// type MappedUser = {
// 	id: mapper.column('id').string(),		
// 	email: mapper.column('email').string(),
// }
const customer = bar.table2<Customer>('customer').map( {		
	// customerId: {columnType: 'string'},		
	customerId: {columnType: 'string'},		
	name: {columnType: 'string'},		
});



const user = bar.table2<User>('user').map( {		
	id: {columnType: 'string'},		
	email: {columnType: 'string'},
	customer:  customer
});
user.



type ChildTable<TTableMap>  = {
	// [key in keyof TTableMap]-?: TTableMap[key] extends StringColumnMap ? StringColumn: (TTableMap[key] extends infer U extends TableMapOf<infer Child> ? ChildTable<U> : never) ;
}
// & {
// 	exists() : Filter;
// }

type  StringColumn = {
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

// interface ReferenceMap<TRow> extends NColumnMap<'string'> {

// }

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
}

class Line {
	lineId: string;
	count?: number;
	user: User;
	// foo: SomeJSON;
}
;