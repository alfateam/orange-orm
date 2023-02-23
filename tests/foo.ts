

// type StringColumn = {
// 	equal(s: string): Filter;
// 	startsWith(s: string): Filter;
// }

// type NumberColumn = {
// 	equal(s: number): Filter;
// }

// type numberColumn = {
// 	equal(s: number): Filter;
// 	bar(s: number): Filter;
// }
// type RelatedTable<T> = TableCore<Required<T>> & {
//     exists: () => Filter;

// }

// type RelatedTables<T> = TableCore<T> & {
// 	exists() : Filter;
// 	all: (selector: (table: RelatedTable<T>) => RawFilter) => Filter;
//     any: (selector: (table: RelatedTable<T>) => RawFilter) => Filter;
//     none: (selector: (table: RelatedTable<T>) => RawFilter) => Filter;
//     exists: () => Filter;

// }


// type Column<T extends number | string > = 
// T extends number ? NumberColumn : (
// 	StringColumn
// );

// type Table<T> = TableCore<T> & Methods<T>;
// type TableCore<T> = {
// 	[p in keyof Required<T>]: Required<T>[p] extends string | number ? 
// 	Column<Required<T>[p]> : (Required<T>[p] extends Array<infer U> ?
// 			 RelatedTables<U> : RelatedTable<Required<T>[p]>);	
// }




// // type TableCore<T> = {
// // 	[p in keyof Required<T>]: Required<T>[p]  extends infer U extends number | string? 
// // 	Capitalize<p U>  : ( 
// // 		 Required<T>[p] extends Array<infer U> ?
// // 			 RelatedTables<U> : RelatedTable<Required<T>[p]>);	
// // }

// //@ts-ignore
// const foo: Table<User> = new Table<User>();
// foo.
// const filter = foo.customer.id.equal('22');
// const filter2 = foo.lines.all((table) => {
// 	return table.count.equal(2);
// });
// const filter3 = filter2.and(filter);
// const res  = await foo.getAll({name: false, count: true, id: false, email: true, orderBy: ["count"] });
// res.


// type Strategy<T> = {
// 	[K in keyof T as Required<T>[K] extends string | number? K: never]: boolean;
// }  & {
// 	limit?: number;
// 	offset?: number;
// 	orderBy?: Array< keyof  {
// 		[P in keyof T as `${string & P}` | `${string & P} desc`]
// 	}>
// }


// type Methods<T> = {
// 	getMany(filter: Filter): Promise<RowArray<T>>;
// 	getAll(strategy: Strategy<T>): Promise<RowArray<T>>;
// }

// type RowArray<T> = {
// 	saveChanges(): Promise<void>;
// } & T[]

// type Row<T> = {
// 	saveChanges(): Promise<void>;
// } & T


// interface RawFilter {
// 	sql: string | (() => string);
// 	parameters?: any[];
// }

// interface Filter extends RawFilter {
// 	and(filter: Filter, ...filters: Filter[]): Filter;
// 	or(filter: Filter, ...filters: Filter[]): Filter;
// 	not(): Filter;
// }

// class User {
// 	id: string;
// 	email?: string;
// 	// name: string;
// 	// count: number;
// 	// someDate: Date;
// 	// customer?: Customer;
// 	// lines?: Line[];
// }

// class Customer {
// 	id: string;
// 	name: string;
// }

// class Line {
// 	lineId: string;
// 	count?: number;
// 	user: User;
// 	foo: SomeJSON;
// }


// interface SomeJSON {
// 	name: string;
// 	address: string;
// }

// type Mapping<T> = {

};

// interface R {
// 	table<T>(mapping : Mapping<T>): Table<T>;		
// }

// interface Mapper {
// 	join(name: string, from: any, to: any) : Mapper
// 	on(name: string): Mapper;
// 	reverse(): Mapper
// 	primaryColumn(name: string) : Mapper
// 	numeric() : Mapper;
// 	relation(left: any, joinTo: any) : Relation
// }

// interface Relation {
// 	on(name: string) : {reverse(): ManyRelation}
// }
// interface ManyRelation {
// 	one(): OneRelation;
// }

// interface OneRelation {

// }

// const rdb = {} as R;
// // const line = rdb.table<Line>({})
// const line = rdb.table<Line>((mapper: Mapper) => {
// 	return {
// 		id: mapper.primaryColumn('id').numeric(),
// 		// customer: mapper.join(user).by('customerId')		
// 		user: mapper.relation(line, user).on('customerId')
// 	}
// });
// const line2 = rdb.table<Line>({
// 		id: rdb.primaryColumn('id').numeric(),
// 		// user: rdb.hasMany((relation) => relation(line2, user).on('customerId'))
// 	}
// );
// const user = rdb.table<User>((mapper: Mapper) => {
// 	return {
// 		id: mapper.primaryColumn('id').numeric(),
// 		lines: mapper.relation(line, user).on('customerId').reverse()
// 	}
// });

// //@ts-ignore
// const foo: Table<User> = new Table<User>();
// foo.c
// const filter = foo.customer.id.equal('22');
// const filter2 = foo.lines.all((table) => {
// 	return table.count.equal(2);
// });
// const filter3 = filter2.and(filter);
// const res  = await foo.getAll({name: false, count: true, id: false, email: true, orderBy: ["count"] });
// res.


// type User = {
//   email: string;
//   name: string;
//   count: number;
//   customer: Customer;
//   lines: Line[];
// }






interface Rdb {
	config()
}


