
export interface Rdb {
    table(name: string): Table;
    end(): Promise<void>;
    pg(connectionString : string, options?: PoolOptions) : Pool;
    sqlite(connectionString : string, options?: PoolOptions) : Pool;
    sap(connectionString : string, options?: PoolOptions) : Pool;
    mssql(connectionString : string, options?: PoolOptions) : Pool;
    mySql(connectionString : string, options?: PoolOptions) : Pool;
}

export interface Pool {
    end(): Promise<void>;
}

export interface PoolOptions {
    size?: number;
}

export interface Join {
    by(...columns: string[]) : JoinBy;
}

export interface JoinBy {
    as(propertyName: string): JoinRelation;
}

export interface JoinRelation{

}


export interface Table {
    primaryColumn(column: string) : Column;
    column(column: string) : Column;
    join(table: Table) : Join;
    hasMany(join: JoinRelation) : HasMany;
    hasOne(join: JoinRelation) : HasOne;
}

interface HasMany {
    as(propertyName: string): void;
}


interface HasOne {
    as(propertyName: string): void;
}

export interface Column {
    serializable(value: boolean): Column;
    string(): ColumnOf<string>;
    numeric(): ColumnOf<number>;
    guid(): ColumnOf<string>;
    binary(): ColumnOf<Buffer>;
    boolean(): ColumnOf<boolean>;
    json(): ColumnOf<Record<string,unknown>>;
    date(): DateColumn;
}
export interface DateColumn {
    serializable(value: boolean): DateColumn;
    as(dbName: string) : DateColumn;
    default(value: Date | string |  (() => Date | string)): DateColumn
    dbNull(value: Date | string | null) : DateColumn;
}

export interface ColumnOf<T> {
    serializable(value: boolean): ColumnOf<T>;
    default(value: T | (() => T)): ColumnOf<T>;
    dbNull(value: T | null) : ColumnOf<T>;
    as(dbName: string) : ColumnOf<T>;
}

declare const rdb: Rdb;
export default rdb;