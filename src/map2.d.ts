// map2.d.ts

/**
 * ---- ORM column‐type literals ----
 * Represent column types as string constants so schema can be used in plain JS/TS.
 *   • "string"  → TS `string`
 *   • "bigint"  → TS `string` (bigints as strings)
 *   • "uuid"    → TS `string`
 *   • "date"    → TS `string` (ISO date strings)
 *   • "numeric" → TS `number`
 */
export type ORMColumnType = 'string' | 'bigint' | 'uuid' | 'date' | 'numeric';

/** Convert each ORMColumnType to its corresponding TS type. */
type ColumnTypeToTS<CT extends ORMColumnType> =
  CT extends 'numeric' ? number : string;

/**
 * RelationType must be one of these three string literals.
 */
export type RelationType = 'hasMany' | 'hasOne' | 'references';

/**
 * A single‐relation definition.
 *
 *  • `type`: 'hasMany' | 'hasOne' | 'references'  
 *  • `target`: the name of another table in this same map  
 *  • `fkColumns`: a readonly array of column‐names in THIS table that serve as the foreign key(s).
 */
export type RelationDefinition<
  Tables extends Record<string, any>
> = {
  type: RelationType;
  target: keyof Tables;
  fkColumns: readonly (keyof any)[];
};

/**
 * A single‐table definition.
 *
 *  • `columns`: record of column‐names → ORMColumnType (string constant).  
 *  • `primaryKey`: readonly array of column‐names (must match keys in `columns`).  
 *  • `relations?`: object mapping relation‐names → RelationDefinition.
 */
export type TableDefinition<
  Tables extends Record<string, any>
> = {
  columns: Record<string, ORMColumnType>;
  primaryKey: readonly (keyof any)[];
  relations?: Record<string, RelationDefinition<Tables>>;
};

/**
 * Recursively expand any nested object/array into a plain‐object type.
 */
export type DeepExpand<T> =
  T extends Array<infer U>
    ? Array<DeepExpand<U>>
    : T extends object
    ? { [K in keyof T]: DeepExpand<T[K]> }
    : T;

/**
 * BooleanFilterType: can combine with AND, OR, NOT.
 */
export interface BooleanFilterType {
  and(other: BooleanFilterType): BooleanFilterType;
  or(other: BooleanFilterType): BooleanFilterType;
  not(): BooleanFilterType;
}

/**
 * ColumnFilterType<Val> supports equality and comparison for values of type Val.
 */
export interface ColumnFilterType<Val> {
  equal(value: Val): BooleanFilterType;
  notEqual(value: Val): BooleanFilterType;
  lessThan(value: Val): BooleanFilterType;
  lessThanOrEqual(value: Val): BooleanFilterType;
  greaterThan(value: Val): BooleanFilterType;
  greaterThanOrEqual(value: Val): BooleanFilterType;
  in(values: Val[]): BooleanFilterType;
  notIn(values: Val[]): BooleanFilterType;
  isNull(): BooleanFilterType;
  isNotNull(): BooleanFilterType;
}

/**
 * A wrapper to allow both:
 *   - direct property access: x.customer.name.equal(...)
 *   - callable form: x.customer(x => x.name.equal(...))
 */
export type FilterableSingleRelation<M extends Record<string, TableDefinition<M>>, Target extends keyof M> =
  TableRefs<M, Target> & {
    (predicate: (row: TableRefs<M, Target>) => BooleanFilterType): BooleanFilterType;
  };

/**
 * For any table Target, TableRefs<M,Target> provides:
 *  • Column filters (ColumnRefs<M,Target>)  
 *  • Relation filters for hasMany (HasManyRelationFilter<M,Target>)  
 *  • Relation refs for hasOne/references (SingleRelationRefs<M,Target>)  
 *  • exists() on the table as a whole  
 *
 * Note: No callable signature.  Only exists(), so `prototype`, `toString`, etc. do not appear.
 */
export type TableRefs<
  M extends Record<string, TableDefinition<M>>,
  Target extends keyof M
> = ColumnRefs<M, Target> &
  RelationRefs<M, Target> & {
    exists(): BooleanFilterType;
  };

/**
 * HasManyRelationFilter<M,Target> provides any/all/none/exists on a hasMany relation.
 *  • `any(predicate)`      → BooleanFilterType  
 *  • `all(predicate)`      → BooleanFilterType  
 *  • `none(predicate)`     → BooleanFilterType  
 *  • `exists()`             → BooleanFilterType  
 *
 * The `predicate` receives `TableRefs<M,TargetTable>` so you can nest deeply.
 */
export type HasManyRelationFilter<
  M extends Record<string, TableDefinition<M>>,
  Target extends keyof M
> = {
  any(predicate: (row: TableRefs<M, Target>) => BooleanFilterType): BooleanFilterType;
  all(predicate: (row: TableRefs<M, Target>) => BooleanFilterType): BooleanFilterType;
  none(predicate: (row: TableRefs<M, Target>) => BooleanFilterType): BooleanFilterType;
  exists(): BooleanFilterType;
};

/**
 * SingleRelationRefs<M,Target> provides for a single‐row relation (hasOne or references),
 * the same TableRefs<M,Target> so you can navigate filters on that related row.
 */
export type SingleRelationRefs<
  M extends Record<string, TableDefinition<M>>,
  Target extends keyof M
> = TableRefs<M, Target> | null;

/**
 * For each table K, ColumnRefs<M,K> provides a ColumnFilterType for each column C.
 */
export type ColumnRefs<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M
> = {
  [C in keyof M[K]['columns']]: ColumnFilterType<ColumnTypeToTS<M[K]['columns'][C]>>;
};

export type RelationRefs<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M
> = M[K] extends { relations: infer R }
  ? {
      [RName in keyof R]: R[RName] extends RelationDefinition<M>
        ? R[RName]['type'] extends 'hasMany'
          ? HasManyRelationFilter<M, R[RName]['target']> & TableRefs<M, R[RName]['target']>
          : R[RName]['type'] extends 'hasOne' | 'references'
            ? FilterableSingleRelation<M, R[RName]['target']> // ← changed here
            : never
        : never;
    }
  : {};

/**
 * OrderBy<M,K> = array of column names or "column asc"/"column desc" literals for table K.
 *  • Extract<keyof M[K]['columns'], string> yields each column name as a string.
 *  • Template literal offers "colName", "colName asc", "colName desc".
 */
export type OrderBy<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M
> = Array<
  | `${Extract<keyof M[K]['columns'], string>}`
  | `${Extract<keyof M[K]['columns'], string>} asc`
  | `${Extract<keyof M[K]['columns'], string>} desc`
>;

/**
 * FetchStrategy<M,K> describes allowed properties:
 *  • orderBy?: OrderBy<M,K>  
 *  • where?: (row: TableRefs<M,K>) => BooleanFilterType  
 *  • Column flags: Partial<Record<keyof M[K]['columns'], boolean>>  
 *  • Relation flags: { [RName in keyof M[K]['relations']]?: true | false | FetchStrategy<M,RTarget> }  
 *
 * Example:
 *   {
 *     orderBy: ['placedAt desc', 'status asc'],
 *     where: x => x.status.equal('open').and(x.lines.any(l => l.quantity.greaterThan(5))),
 *     status: true,
 *     customer: { email: true, orderBy: ['name asc'], where: c => c.name.equal('John Doe') }
 *   }
 */
export type FetchStrategy<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M
> = {
  orderBy?: OrderBy<M, K>;
  where?: (row: TableRefs<M, K>) => BooleanFilterType;
} & Partial<Record<keyof M[K]['columns'], boolean>> & (
  M[K] extends { relations: infer R }
    ? { [RName in keyof R]?: true | false | FetchStrategy<M, R[RName]['target']> }
    : {}
);

/**
 * PrimaryKeyOf<M,K>:
 *  • If primaryKey = ['id'], then PrimaryKeyOf<M,K> = ColumnTypeToTS<M[K]['columns']['id']>.  
 *  • Otherwise (composite), = { [P in each PK column]: ColumnTypeToTS<M[K]['columns'][P]> }.
 */
export type PrimaryKeyOf<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M
> =
  M[K]['primaryKey'] extends readonly [infer Single]
    ? Single extends keyof M[K]['columns']
      ? ColumnTypeToTS<M[K]['columns'][Single]>
      : never
    : {
        [P in Extract<M[K]['primaryKey'][number], keyof M[K]['columns']>]:
          ColumnTypeToTS<M[K]['columns'][P]>;
      };

/**
 * Compute exactly which columns to include:
 *  • If any column flags set true, include only those.  
 *  • Else if any column flags set false, include all except those.  
 *  • Else include all columns.
 */
type TrueKeys<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M,
  FS extends Record<string, any>
> = {
  [C in keyof M[K]['columns']]: FS extends Record<C, infer B> ? (B extends true ? C : never) : never;
}[keyof M[K]['columns']];

type FalseKeys<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M,
  FS extends Record<string, any>
> = {
  [C in keyof M[K]['columns']]: FS extends Record<C, infer B> ? (B extends false ? C : never) : never;
}[keyof M[K]['columns']];

type SelectedColumns<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M,
  FS extends Record<string, any>
> =
  TrueKeys<M, K, FS> extends never
    ? (FalseKeys<M, K, FS> extends never
        ? keyof M[K]['columns']
        : Exclude<keyof M[K]['columns'], FalseKeys<M, K, FS>>)
    : TrueKeys<M, K, FS];

/**
 * Selection<M,K,FS> = returned shape for table K given FS:
 * 1) Columns chosen by SelectedColumns<…> with TS types.  
 * 2) For each relation RName ∈ (keyof FS ∩ keyof M[K]['relations']):  
 *      - If FS[RName] = false, omit.  
 *      - Else let RS = FS[RName] extends true ? {} : Extract<FS[RName], Record<string, any>>.  
 *        • If type = 'hasMany', RName: Selection<M,target,RS>[]  
 *        • Else RName: Selection<M,target,RS> | null  
 */
export type Selection<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M,
  FS extends Record<string, any>
> =
  // 1) Map selected columns
  { [C in SelectedColumns<M, K, FS>]: ColumnTypeToTS<M[K]['columns'][C]> } &
  // 2) Map relations
  (
    M[K] extends { relations: infer R }
      ? {
          [RName in Extract<keyof FS, keyof R> as
            FS[RName] extends false ? never : RName
          ]: R[RName] extends RelationDefinition<M>
            ? R[RName]['type'] extends 'hasMany'
              ? Array<
                  DeepExpand<
                    Selection<
                      M,
                      R[RName]['target'],
                      FS[RName] extends true ? {} : Extract<FS[RName], Record<string, any>>
                    >
                  >
                >
              : DeepExpand<
                  Selection<
                    M,
                    R[RName]['target'],
                    FS[RName] extends true ? {} : Extract<FS[RName], Record<string, any>>
                  >
                > | null
            : never;
        }
      : {}
  );

/**
 * TableClient<M,K> provides getAll and getById for table K.
 */
export type TableClient<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M
> = {
  getAll(): Promise<Array<DeepExpand<Selection<M, K, {}>>>>;
  getAll<FS extends FetchStrategy<M, K>>(fetchStrategy: FS): Promise<Array<DeepExpand<Selection<M, K, FS>>>>;

  getById(id: PrimaryKeyOf<M, K>): Promise<DeepExpand<Selection<M, K, {}>> | null>;
  getById<FS extends FetchStrategy<M, K>>(id: PrimaryKeyOf<M, K>, fetchStrategy: FS): Promise<DeepExpand<Selection<M, K, FS>> | null>;
};

/**
 * DBClient<M> supplies, for each table K:
 *  • TableRefs<M, K>   (column filters + relation filters + exists)  
 *  • TableClient<M, K> (getAll, getById)  
 *  • Root‐level filter combinators:
 *      – filter: BooleanFilterType  
 *      – and(filter): BooleanFilterType  
 *      – or(filter): BooleanFilterType  
 *      – not(filter): BooleanFilterType
 */
export type DBClient<M extends Record<string, TableDefinition<M>>> = {
  [TableName in keyof M]: TableRefs<M, TableName> & TableClient<M, TableName>;
} & {
  filter: BooleanFilterType;
  and(f: BooleanFilterType): BooleanFilterType;
  or(f: BooleanFilterType): BooleanFilterType;
  not(f: BooleanFilterType): BooleanFilterType;
};

/**
 * The single entry‐point.  `db(schema)` infers M = typeof schema
 * and returns a DBClient<M> where:
 *  • You can reference columns: `database.customers.name.equal('Lars')`.  
 *  • You can combine: `filter.and(anotherFilter)`.  
 *  • You can filter hasMany relations with `.any(...)`, `.all(...)`, `.none(...)`, `.exists()`, 
 *    and nest deeply:  
 *      e.g. `orders.lines.none(x => x.packages.any(y => y.orderLine.weight.equal(100)))`.  
 *  • For hasOne/references, you can navigate to single relation refs.  
 *  • You can shorthand a related‐row column: `database.orders.lines.weight.equal(100)`  
 *    (interpreted as `database.orders.lines.any(x => x.weight.equal(100))`).  
 *  • Pass `orderBy` array in any FetchStrategy (nested as well), with IntelliSense on allowed columns:  
 *      `await database.orders.getAll({ orderBy: ['customerId', 'placedAt desc', 'status asc'] });`  
 *  • Pass `where` predicate at any level (nested as well):  
 *      `await database.orders.getAll({ where: x => x.lines.productId.equal('p1q2r3-uuid') });`  
 *  • Nested `orderBy` or `where` on relation strategies works too:  
 *      `await database.orders.getAll({ customer: { orderBy: ['name asc'], where: c => c.name.equal('John Doe') } });`  
 *  • Root‐level:  
 *      – `database.filter.and(otherFilter)`, `database.filter.or(otherFilter)`, `database.filter.not()`.  
 *      – `database.and(filter3)`, `database.or(filter4)`, `database.not(filter5)`.  
 *  • getAll/getById as before for data retrieval.
 */
export function db<
  M extends Record<string, TableDefinition<M>>
>(schema: M): DBClient<M>;
