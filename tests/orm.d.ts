declare namespace ORM {
	export type ColumnMapper = {
	  column: (columnName: string) => ColumnType;
	  references: (targetTable: Table<any>) => ReferenceMapper;
	  hasMany: (targetTable: Table<any>) => HasManyMapper;
	};
  
	export interface DateColumnType {
	  greaterThan(value: Date): Filter;
	  between(from: Date, to: Date): Filter;
	}
  
	export interface StringColumnType {
	  greaterThan(value: string): Filter;
	  startsWith(value: string): Filter;
	  endsWith(value: string): Filter;
	}
  
	export interface UuidColumnType {
	  greaterThan(value: string): Filter;
	  startsWith(value: string): Filter;
	  endsWith(value: string): Filter;
	}
  
	export interface NumberColumnType {
	  greaterThan(value: number): Filter;
	  between(from: number, to: number): Filter;
	}
  
	export type ColumnType = {
	  string: () => StringColumnType;
	  uuid: () => UuidColumnType;
	  number: () => NumberColumnType;
	  date: () => DateColumnType;
	};
  
	export interface Filter {
	  and(otherFilter: Filter): Filter;
	}
  
	export interface ReferenceMapper {
	  by(foreignKey: string): any;
	}
  
	export interface HasManyMapper {
	  by(foreignKey: string): any[];
	}
  
	type MappedProperty<T> =
	  T extends string ? StringColumnType | UuidColumnType | T :
	  T extends number ? NumberColumnType | T :
	  T extends Date ? DateColumnType | T :
	  T;
  
	type MappedProperties<T> = {
	  [K in keyof T]: MappedProperty<T[K]>;
	};
  
	export type Table<T> = {
	  map: <TMap extends MappedProperties<T>>(callback: (mapper: ColumnMapper) => TMap) => MappedTable<TMap>;
	};
  
	export type MappedTable<T> = {
	  getMany: (filter?: Filter) => Promise<T[]>;
	} & T;
  
	export interface ORM {
	  table: <T>(tableName: string) => Table<T>;
	}
  }
  
  declare const orm: ORM.ORM;
  export default orm;
  