/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import schema from './schema';
import type { AxiosInterceptorManager, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { BooleanColumn, JSONColumn, UUIDColumn, DateColumn, NumberColumn, BinaryColumn, StringColumn, Concurrency, Filter, RawFilter, TransactionOptions, Pool, Express, Url } from 'rdb';
export default schema as RdbClient;
export interface CustomerTable {
    getAll(): Promise<CustomerArray>;
    getAll(fetchingStrategy: CustomerStrategy): Promise<CustomerArray>;
    getMany(filter?: RawFilter): Promise<CustomerArray>;
    getMany(filter: RawFilter, fetchingStrategy: CustomerStrategy): Promise<CustomerArray>;
    getMany(customers: Array<Customer>): Promise<CustomerArray>;
    getMany(customers: Array<Customer>, fetchingStrategy: CustomerStrategy): Promise<CustomerArray>;
    getOne(filter?: RawFilter): Promise<CustomerRow>;
    getOne(filter: RawFilter, fetchingStrategy: CustomerStrategy): Promise<CustomerRow>;
    getOne(customer: Customer): Promise<CustomerRow>;
    getOne(customer: Customer, fetchingStrategy: CustomerStrategy): Promise<CustomerRow>;
    getById(id: number): Promise<CustomerRow>;
    getById(id: number, fetchingStrategy: CustomerStrategy): Promise<CustomerRow>;
    insert(customers: Customer[]): Promise<CustomerArray>;
    insert(customers: Customer[], fetchingStrategy: CustomerStrategy): Promise<CustomerArray>;
    insert(customer: Customer): Promise<CustomerRow>;
    insert(customer: Customer, fetchingStrategy: CustomerStrategy): Promise<CustomerRow>;
    insertAndForget(customers: Customer[]): Promise<void>;
    insertAndForget(customer: Customer): Promise<void>;
    delete(filter?: RawFilter): Promise<void>;
    delete(customers: Array<Customer>): Promise<void>;
    deleteCascade(filter?: RawFilter): Promise<void>;
    deleteCascade(customers: Array<Customer>): Promise<void>;
    proxify(customers: Customer[]): CustomerArray;
    proxify(customers: Customer[], fetchingStrategy: CustomerStrategy): CustomerArray;
    proxify(customer: Customer): CustomerRow;
    proxify(customer: Customer, fetchingStrategy: CustomerStrategy): CustomerRow;
    customFilters: CustomerCustomFilters;
    id: NumberColumn;
    name: StringColumn;
    balance: NumberColumn;
    isActive: BooleanColumn;
}
export interface CustomerExpressConfig {
    baseFilter?: RawFilter | ((context: ExpressContext) => RawFilter | Promise<RawFilter>);
    customFilters?: Record<string, (context: ExpressContext, ...args: any[]) => RawFilter | Promise<RawFilter>>;
    concurrency?: CustomerConcurrency;
    defaultConcurrency?: Concurrency;
    readonly?: boolean;
    disableBulkDeletes?: boolean;
}
export interface CustomerCustomFilters {
}
export interface CustomerArray extends Array<Customer> {
    saveChanges(): Promise<void>;
    saveChanges(concurrency: CustomerConcurrencyOptions): Promise<void>;
    saveChanges(fetchingStrategy: CustomerStrategy): Promise<void>;
    saveChanges(concurrency: CustomerConcurrencyOptions, fetchingStrategy: CustomerStrategy): Promise<void>;
    acceptChanges(): void;
    clearChanges(): void;
    refresh(): Promise<void>;
    refresh(fetchingStrategy: CustomerStrategy): Promise<void>;
    delete(): Promise<void>;
    delete(options: CustomerConcurrencyOptions): Promise<void>;
}
export interface CustomerRow extends Customer {
    saveChanges(): Promise<void>;
    saveChanges(concurrency: CustomerConcurrencyOptions): Promise<void>;
    saveChanges(fetchingStrategy: CustomerStrategy): Promise<void>;
    saveChanges(concurrency: CustomerConcurrencyOptions, fetchingStrategy: CustomerStrategy): Promise<void>;
    acceptChanges(): void;
    clearChanges(): void;
    refresh(): Promise<void>;
    refresh(fetchingStrategy: CustomerStrategy): Promise<void>;
    delete(): Promise<void>;
    delete(options: CustomerConcurrencyOptions): Promise<void>;
}
export interface CustomerConcurrencyOptions {
    defaultConcurrency?: Concurrency;
    concurrency?: CustomerConcurrency;
}
export interface CustomerConcurrency {
    name?: Concurrency;
    balance?: Concurrency;
    isActive?: Concurrency;
}
export interface Customer {
    id?: number | null;
    name?: string | null;
    balance?: number | null;
    isActive?: boolean | null;
}
export interface CustomerStrategy {
    name?: boolean;
    balance?: boolean;
    isActive?: boolean;
    limit?: number;
    offset?: number;
    orderBy?: Array<'id' | 'id desc' | 'name' | 'name desc' | 'balance' | 'balance desc' | 'isActive' | 'isActive desc'> | 'id' | 'id desc' | 'name' | 'name desc' | 'balance' | 'balance desc' | 'isActive' | 'isActive desc';
}
export interface OrderTable {
    getAll(): Promise<OrderArray>;
    getAll(fetchingStrategy: OrderStrategy): Promise<OrderArray>;
    getMany(filter?: RawFilter): Promise<OrderArray>;
    getMany(filter: RawFilter, fetchingStrategy: OrderStrategy): Promise<OrderArray>;
    getMany(orders: Array<Order>): Promise<OrderArray>;
    getMany(orders: Array<Order>, fetchingStrategy: OrderStrategy): Promise<OrderArray>;
    getOne(filter?: RawFilter): Promise<OrderRow>;
    getOne(filter: RawFilter, fetchingStrategy: OrderStrategy): Promise<OrderRow>;
    getOne(order: Order): Promise<OrderRow>;
    getOne(order: Order, fetchingStrategy: OrderStrategy): Promise<OrderRow>;
    getById(id: number): Promise<OrderRow>;
    getById(id: number, fetchingStrategy: OrderStrategy): Promise<OrderRow>;
    insert(orders: Order[]): Promise<OrderArray>;
    insert(orders: Order[], fetchingStrategy: OrderStrategy): Promise<OrderArray>;
    insert(order: Order): Promise<OrderRow>;
    insert(order: Order, fetchingStrategy: OrderStrategy): Promise<OrderRow>;
    insertAndForget(orders: Order[]): Promise<void>;
    insertAndForget(order: Order): Promise<void>;
    delete(filter?: RawFilter): Promise<void>;
    delete(orders: Array<Order>): Promise<void>;
    deleteCascade(filter?: RawFilter): Promise<void>;
    deleteCascade(orders: Array<Order>): Promise<void>;
    proxify(orders: Order[]): OrderArray;
    proxify(orders: Order[], fetchingStrategy: OrderStrategy): OrderArray;
    proxify(order: Order): OrderRow;
    proxify(order: Order, fetchingStrategy: OrderStrategy): OrderRow;
    customFilters: OrderCustomFilters;
    id: NumberColumn;
    orderDate: DateColumn;
    customerId: NumberColumn;
    customer: CustomerRelatedTable;
    lines: LinesRelatedTable;
    deliveryAddress: DeliveryAddressRelatedTable;
}
export interface OrderExpressConfig {
    baseFilter?: RawFilter | ((context: ExpressContext) => RawFilter | Promise<RawFilter>);
    customFilters?: Record<string, (context: ExpressContext, ...args: any[]) => RawFilter | Promise<RawFilter>>;
    concurrency?: OrderConcurrency;
    defaultConcurrency?: Concurrency;
    readonly?: boolean;
    disableBulkDeletes?: boolean;
}
export interface OrderCustomFilters {
}
export interface OrderArray extends Array<Order> {
    saveChanges(): Promise<void>;
    saveChanges(concurrency: OrderConcurrencyOptions): Promise<void>;
    saveChanges(fetchingStrategy: OrderStrategy): Promise<void>;
    saveChanges(concurrency: OrderConcurrencyOptions, fetchingStrategy: OrderStrategy): Promise<void>;
    acceptChanges(): void;
    clearChanges(): void;
    refresh(): Promise<void>;
    refresh(fetchingStrategy: OrderStrategy): Promise<void>;
    delete(): Promise<void>;
    delete(options: OrderConcurrencyOptions): Promise<void>;
}
export interface OrderRow extends Order {
    saveChanges(): Promise<void>;
    saveChanges(concurrency: OrderConcurrencyOptions): Promise<void>;
    saveChanges(fetchingStrategy: OrderStrategy): Promise<void>;
    saveChanges(concurrency: OrderConcurrencyOptions, fetchingStrategy: OrderStrategy): Promise<void>;
    acceptChanges(): void;
    clearChanges(): void;
    refresh(): Promise<void>;
    refresh(fetchingStrategy: OrderStrategy): Promise<void>;
    delete(): Promise<void>;
    delete(options: OrderConcurrencyOptions): Promise<void>;
}
export interface OrderConcurrencyOptions {
    defaultConcurrency?: Concurrency;
    concurrency?: OrderConcurrency;
}
export interface OrderConcurrency {
    orderDate?: Concurrency;
    customerId?: Concurrency;
    customer?: CustomerConcurrency;
    lines?: LinesConcurrency;
    deliveryAddress?: DeliveryAddressConcurrency;
}
export interface Order {
    id?: number | null;
    orderDate?: Date | string | null;
    customerId?: number | null;
    customer?: Customer | null;
    lines?: Lines[] | null;
    deliveryAddress?: DeliveryAddress | null;
}
export interface OrderStrategy {
    orderDate?: boolean;
    customerId?: boolean;
    customer?: CustomerStrategy;
    lines?: LinesStrategy;
    deliveryAddress?: DeliveryAddressStrategy;
    limit?: number;
    offset?: number;
    orderBy?: Array<'id' | 'id desc' | 'orderDate' | 'orderDate desc' | 'customerId' | 'customerId desc'> | 'id' | 'id desc' | 'orderDate' | 'orderDate desc' | 'customerId' | 'customerId desc';
}
export interface CustomerConcurrency {
    name?: Concurrency;
    balance?: Concurrency;
    isActive?: Concurrency;
}
export interface Customer {
    id?: number | null;
    name?: string | null;
    balance?: number | null;
    isActive?: boolean | null;
}
export interface CustomerStrategy {
    name?: boolean;
    balance?: boolean;
    isActive?: boolean;
    limit?: number;
    offset?: number;
    orderBy?: Array<'id' | 'id desc' | 'name' | 'name desc' | 'balance' | 'balance desc' | 'isActive' | 'isActive desc'> | 'id' | 'id desc' | 'name' | 'name desc' | 'balance' | 'balance desc' | 'isActive' | 'isActive desc';
}
export interface CustomerRelatedTable {
    id: NumberColumn;
    name: StringColumn;
    balance: NumberColumn;
    isActive: BooleanColumn;
    all: (selector: (table: CustomerRelatedTable) => RawFilter) => Filter;
    any: (selector: (table: CustomerRelatedTable) => RawFilter) => Filter;
    none: (selector: (table: CustomerRelatedTable) => RawFilter) => Filter;
    exists: () => Filter;
}
export interface LinesConcurrency {
    orderId?: Concurrency;
    product?: Concurrency;
    order?: OrderConcurrency;
}
export interface Lines {
    id?: number | null;
    orderId?: number | null;
    product?: string | null;
    order?: Order | null;
}
export interface LinesStrategy {
    orderId?: boolean;
    product?: boolean;
    order?: OrderStrategy;
    limit?: number;
    offset?: number;
    orderBy?: Array<'id' | 'id desc' | 'orderId' | 'orderId desc' | 'product' | 'product desc'> | 'id' | 'id desc' | 'orderId' | 'orderId desc' | 'product' | 'product desc';
}
export interface OrderConcurrency {
    orderDate?: Concurrency;
    customerId?: Concurrency;
    customer?: CustomerConcurrency;
    lines?: LinesConcurrency;
    deliveryAddress?: DeliveryAddressConcurrency;
}
export interface Order {
    id?: number | null;
    orderDate?: Date | string | null;
    customerId?: number | null;
    customer?: Customer | null;
    lines?: Lines[] | null;
    deliveryAddress?: DeliveryAddress | null;
}
export interface OrderStrategy {
    orderDate?: boolean;
    customerId?: boolean;
    customer?: CustomerStrategy;
    lines?: LinesStrategy;
    deliveryAddress?: DeliveryAddressStrategy;
    limit?: number;
    offset?: number;
    orderBy?: Array<'id' | 'id desc' | 'orderDate' | 'orderDate desc' | 'customerId' | 'customerId desc'> | 'id' | 'id desc' | 'orderDate' | 'orderDate desc' | 'customerId' | 'customerId desc';
}
export interface DeliveryAddressConcurrency {
    orderId?: Concurrency;
    name?: Concurrency;
    street?: Concurrency;
    postalCode?: Concurrency;
    postalPlace?: Concurrency;
    countryCode?: Concurrency;
    order?: OrderConcurrency;
}
export interface DeliveryAddress {
    id?: number | null;
    orderId?: number | null;
    name?: string | null;
    street?: string | null;
    postalCode?: string | null;
    postalPlace?: string | null;
    countryCode?: string | null;
    order?: Order | null;
}
export interface DeliveryAddressStrategy {
    orderId?: boolean;
    name?: boolean;
    street?: boolean;
    postalCode?: boolean;
    postalPlace?: boolean;
    countryCode?: boolean;
    order?: OrderStrategy;
    limit?: number;
    offset?: number;
    orderBy?: Array<'id' | 'id desc' | 'orderId' | 'orderId desc' | 'name' | 'name desc' | 'street' | 'street desc' | 'postalCode' | 'postalCode desc' | 'postalPlace' | 'postalPlace desc' | 'countryCode' | 'countryCode desc'> | 'id' | 'id desc' | 'orderId' | 'orderId desc' | 'name' | 'name desc' | 'street' | 'street desc' | 'postalCode' | 'postalCode desc' | 'postalPlace' | 'postalPlace desc' | 'countryCode' | 'countryCode desc';
}
export interface DeliveryAddressRelatedTable {
    id: NumberColumn;
    orderId: NumberColumn;
    name: StringColumn;
    street: StringColumn;
    postalCode: StringColumn;
    postalPlace: StringColumn;
    countryCode: StringColumn;
    order: OrderRelatedTable;
    all: (selector: (table: DeliveryAddressRelatedTable) => RawFilter) => Filter;
    any: (selector: (table: DeliveryAddressRelatedTable) => RawFilter) => Filter;
    none: (selector: (table: DeliveryAddressRelatedTable) => RawFilter) => Filter;
    exists: () => Filter;
}
export interface OrderRelatedTable {
    id: NumberColumn;
    orderDate: DateColumn;
    customerId: NumberColumn;
    customer: CustomerRelatedTable;
    lines: LinesRelatedTable;
    deliveryAddress: DeliveryAddressRelatedTable;
    all: (selector: (table: OrderRelatedTable) => RawFilter) => Filter;
    any: (selector: (table: OrderRelatedTable) => RawFilter) => Filter;
    none: (selector: (table: OrderRelatedTable) => RawFilter) => Filter;
    exists: () => Filter;
}
export interface LinesRelatedTable {
    id: NumberColumn;
    orderId: NumberColumn;
    product: StringColumn;
    order: OrderRelatedTable;
    all: (selector: (table: LinesRelatedTable) => RawFilter) => Filter;
    any: (selector: (table: LinesRelatedTable) => RawFilter) => Filter;
    none: (selector: (table: LinesRelatedTable) => RawFilter) => Filter;
    exists: () => Filter;
}
export interface LinesTable {
    getAll(): Promise<LinesArray>;
    getAll(fetchingStrategy: LinesStrategy): Promise<LinesArray>;
    getMany(filter?: RawFilter): Promise<LinesArray>;
    getMany(filter: RawFilter, fetchingStrategy: LinesStrategy): Promise<LinesArray>;
    getMany(liness: Array<Lines>): Promise<LinesArray>;
    getMany(liness: Array<Lines>, fetchingStrategy: LinesStrategy): Promise<LinesArray>;
    getOne(filter?: RawFilter): Promise<LinesRow>;
    getOne(filter: RawFilter, fetchingStrategy: LinesStrategy): Promise<LinesRow>;
    getOne(lines: Lines): Promise<LinesRow>;
    getOne(lines: Lines, fetchingStrategy: LinesStrategy): Promise<LinesRow>;
    getById(id: number): Promise<LinesRow>;
    getById(id: number, fetchingStrategy: LinesStrategy): Promise<LinesRow>;
    insert(liness: Lines[]): Promise<LinesArray>;
    insert(liness: Lines[], fetchingStrategy: LinesStrategy): Promise<LinesArray>;
    insert(lines: Lines): Promise<LinesRow>;
    insert(lines: Lines, fetchingStrategy: LinesStrategy): Promise<LinesRow>;
    insertAndForget(liness: Lines[]): Promise<void>;
    insertAndForget(lines: Lines): Promise<void>;
    delete(filter?: RawFilter): Promise<void>;
    delete(liness: Array<Lines>): Promise<void>;
    deleteCascade(filter?: RawFilter): Promise<void>;
    deleteCascade(liness: Array<Lines>): Promise<void>;
    proxify(liness: Lines[]): LinesArray;
    proxify(liness: Lines[], fetchingStrategy: LinesStrategy): LinesArray;
    proxify(lines: Lines): LinesRow;
    proxify(lines: Lines, fetchingStrategy: LinesStrategy): LinesRow;
    customFilters: LinesCustomFilters;
    id: NumberColumn;
    orderId: NumberColumn;
    product: StringColumn;
    order: OrderRelatedTable;
}
export interface LinesExpressConfig {
    baseFilter?: RawFilter | ((context: ExpressContext) => RawFilter | Promise<RawFilter>);
    customFilters?: Record<string, (context: ExpressContext, ...args: any[]) => RawFilter | Promise<RawFilter>>;
    concurrency?: LinesConcurrency;
    defaultConcurrency?: Concurrency;
    readonly?: boolean;
    disableBulkDeletes?: boolean;
}
export interface LinesCustomFilters {
}
export interface LinesArray extends Array<Lines> {
    saveChanges(): Promise<void>;
    saveChanges(concurrency: LinesConcurrencyOptions): Promise<void>;
    saveChanges(fetchingStrategy: LinesStrategy): Promise<void>;
    saveChanges(concurrency: LinesConcurrencyOptions, fetchingStrategy: LinesStrategy): Promise<void>;
    acceptChanges(): void;
    clearChanges(): void;
    refresh(): Promise<void>;
    refresh(fetchingStrategy: LinesStrategy): Promise<void>;
    delete(): Promise<void>;
    delete(options: LinesConcurrencyOptions): Promise<void>;
}
export interface LinesRow extends Lines {
    saveChanges(): Promise<void>;
    saveChanges(concurrency: LinesConcurrencyOptions): Promise<void>;
    saveChanges(fetchingStrategy: LinesStrategy): Promise<void>;
    saveChanges(concurrency: LinesConcurrencyOptions, fetchingStrategy: LinesStrategy): Promise<void>;
    acceptChanges(): void;
    clearChanges(): void;
    refresh(): Promise<void>;
    refresh(fetchingStrategy: LinesStrategy): Promise<void>;
    delete(): Promise<void>;
    delete(options: LinesConcurrencyOptions): Promise<void>;
}
export interface LinesConcurrencyOptions {
    defaultConcurrency?: Concurrency;
    concurrency?: LinesConcurrency;
}
export interface LinesConcurrency {
    orderId?: Concurrency;
    product?: Concurrency;
    order?: OrderConcurrency;
}
export interface Lines {
    id?: number | null;
    orderId?: number | null;
    product?: string | null;
    order?: Order | null;
}
export interface LinesStrategy {
    orderId?: boolean;
    product?: boolean;
    order?: OrderStrategy;
    limit?: number;
    offset?: number;
    orderBy?: Array<'id' | 'id desc' | 'orderId' | 'orderId desc' | 'product' | 'product desc'> | 'id' | 'id desc' | 'orderId' | 'orderId desc' | 'product' | 'product desc';
}
export interface RdbClient {
    customer: CustomerTable;
    order: OrderTable;
    lines: LinesTable;
    (config: {
        db: Pool | (() => Pool);
    }): RdbClient;
    and(filter: Filter, ...filters: Filter[]): Filter;
    or(filter: Filter, ...filters: Filter[]): Filter;
    not(): Filter;
    query(filter: RawFilter | string): Promise<unknown[]>;
    query<T>(filter: RawFilter | string): Promise<T[]>;
    transaction(fn: (transaction: RdbClient) => Promise<unknown>, options?: TransactionOptions): Promise<void>;
    filter: Filter;
    express(): Express;
    express(config: ExpressConfig): Express;
}
export interface ExpressConfig {
    db?: Pool | (() => Pool);
    tables?: ExpressTables;
    defaultConcurrency?: Concurrency;
    readonly?: boolean;
    disableBulkDeletes?: boolean;
}
export interface ExpressContext {
    request: import('express').Request;
    response: import('express').Response;
    client: RdbClient;
}
export interface ExpressTables {
    customer?: boolean | CustomerExpressConfig;
    order?: boolean | OrderExpressConfig;
    lines?: boolean | LinesExpressConfig;
}
