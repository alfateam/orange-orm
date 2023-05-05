declare namespace ORM {
	
	export interface UuidColumnType {
	  equalTo(value: string): Filter;
	}
  
	export interface DateColumnType {
	  greaterThan(value: Date): Filter;
	  between(from: Date, to: Date): Filter;
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
  
	export interface ColumnType {
	  string: () => StringColumnType;
	  uuid: () => UuidColumnType;
	  number: () => NumberColumnType;
	  date: () => DateColumnType;
	}

	export interface RawFilter {
		sql: string | (() => string);
		parameters?: any[];
	}
	
	export interface Filter extends RawFilter {
		and<T extends RawFilter>(otherFilter: T): Filter;
	}
	export interface ReferenceMapper<T> {
		references<U>(table: MappedTable<U>): ReferenceMapper<T> & U;
		by(foreignKey: keyof T): T;
	  }
	  
	  // Update the ColumnMapper interface to include the new ReferenceMapper
	  export type ColumnMapper = {
		column: (columnName: string) => ColumnType;
		references: <T>(targetTable: MappedTable<T>) => ReferenceMapper<T>;
		hasMany: <T>(targetTable: MappedTable<T>) => HasManyMapper<T>;
	  };
	  export interface HasManyMapper<T> {
		by(foreignKey: string): T[];
	  }
  
	export type Table<T> = {
	  map: <U>(callback: (mapper: ColumnMapper) => U) => MappedTable<U>;
	};
  
	type MappedColumnType<T> = {
		[K in keyof T]: T[K] extends string ? (StringColumnType | T[K]) :
						  T[K] extends Date ? (DateColumnType | T[K]) :
						  T[K] extends number ? (NumberColumnType | T[K]) :
						  T[K];
	  };
	  
	  type MappedTable<T> = {
		getMany: (filter?: Filter) => Promise<T[]>;
	  } & MappedColumnType<T>;
	  
  
	export interface ORM {
	  table: <T>(tableName: string) => Table<T>;
	}
  }
  
  declare const orm: ORM.ORM;
  export default orm;
  