export interface Rdb {
    table(name: string): Table;
}      

export interface Table {
    primaryColumn(column: string) : Column;
    column(column: string) : Column;
}

export interface Column {
    serializable(value: boolean): Column;
    string(): ColumnOf<string>;
    numeric(): ColumnOf<number>;
    guid(): ColumnOf<string>;
    binary(): ColumnOf<Buffer>;
    boolean(): ColumnOf<boolean>;
    json(): ColumnOf<object>;
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
    default(value: T | (() => T)): ColumnOf<T>
    dbNull(value: T | null) : ColumnOf<T>

}

declare const rdb: Rdb;
export default rdb;