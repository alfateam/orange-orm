export interface Rdb {
    table(name: string): table;
}      

export interface table {
    
}

declare const rdb: Rdb;
export default rdb;