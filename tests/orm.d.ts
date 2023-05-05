declare namespace ORM {
	export type ColumnMapper = {
	  column: (columnName: string) => ColumnType;
	  references: (targetTable: Table<any>) => ReferenceMapper;
	  hasMany: (targetTable: Table<any>) => HasManyMapper;
	};
  
	export interface ColumnType {
	  string: () => StringColumnType;
	  number: () => NumberColumnType;
	  date: () => DateColumnType;	  
	}
  
	export interface StringColumnType {
	  greaterThan(value: string): Filter;
	  startsWith(value: string): Filter;
	  endsWith(value: string): Filter;
	}
  
	export interface NumberColumnType {
	  greaterThan(value: number): Filter;
	  between(from: number, to: number): Filter;
	}
  
	export interface DateColumnType {
	  greaterThan(value: Date): Filter;
	  between(from: Date, to: Date): Filter;
	}
  
	export interface Filter {
	  and(otherFilter: Filter): Filter;
	}
  
	export interface ReferenceMapper {
	  by(foreignKey: string): any;
	}
  
	export interface HasManyMapper {
	  by(foreignKey: string): any[];
	}
  
	export type Table<T> = {
		map: (callback: (mapper: ColumnMapper) => Partial<MappedType<T>>) => MappedTable<T>;
	  };
  
	  export type MappedProperties<T> = {
		[P in keyof T]: T[P] extends string
		  ? StringColumnType
		  : T[P] extends number
		  ? NumberColumnType
		  : T[P] extends Date
		  ? DateColumnType
		  : MappedTable<T[P]>;
	  };
	
	  export type MappedTable<T> = MappedProperties<T> & {
		getMany: (filter?: Filter) => Promise<T[]>;
	  };
  
	export interface ORM {
	  table: <T>(tableName: string) => Table<T>;
	}

	type MappedType<T> = {
		[K in keyof T]: T[K] extends string
		  ? StringColumnType
		  : T[K] extends number
		  ? NumberColumnType
		  : T[K] extends Date
		  ? DateColumnType
		  : T[K] extends Array<infer U>
		  ? MappedType<U>[]
		  : MappedType<T[K]>;
	  };
	  
  }
  
  declare const orm: ORM.ORM;
  export default orm;
  