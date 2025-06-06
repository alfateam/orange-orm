// map2.d.ts

/**
 * ---- ORM column‐type literals ----
 * Represent column types as string constants so schema can be written in plain JS/TS.
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
 * FetchStrategy<M, K> may specify:
 *  • Columns (keys of M[K]['columns']) → boolean (true/false).
 *    – If any column is `true`, include only those.
 *    – Else if any column is `false`, include all except those.
 *    – If no column flags appear, include all columns.
 *  • Relations (keys of M[K]['relations']) → `true` | `false` | nested FetchStrategy.
 */
export type FetchStrategy<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M
> =
  Partial<Record<keyof M[K]['columns'], boolean>> &
  (M[K] extends { relations: infer R }
    ? { [RName in keyof R]?: true | false | FetchStrategy<M, R[RName]['target']> }
    : {});

/**
 * PrimaryKeyOf<M, K>:
 *  • If `primaryKey = ['id']`, then PrimaryKeyOf<M, K> = ColumnTypeToTS<M[K]['columns']['id']>.
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

/** Helper: all column‐names of table K. */
type ColumnNames<M extends Record<string, TableDefinition<M>>, K extends keyof M> =
  keyof M[K]['columns'];

/** Helper: union of column‐names flagged `true` in FS. */
type TrueKeys<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M,
  FS extends Record<string, any>
> = {
  [C in ColumnNames<M, K>]: FS extends Record<C, infer B> ? (B extends true ? C : never) : never;
}[ColumnNames<M, K>];

/** Helper: union of column‐names flagged `false` in FS. */
type FalseKeys<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M,
  FS extends Record<string, any>
> = {
  [C in ColumnNames<M, K>]: FS extends Record<C, infer B> ? (B extends false ? C : never) : never;
}[ColumnNames<M, K>];

/**
 * Compute exactly which columns to include:
 *  • If any TrueKeys exist, pick exactly those.
 *  • Else if any FalseKeys exist, pick all except those.
 *  • Else pick all columns.
 */
type SelectedColumns<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M,
  FS extends Record<string, any>
> =
  TrueKeys<M, K, FS> extends never
    ? (FalseKeys<M, K, FS> extends never
        ? ColumnNames<M, K>
        : Exclude<ColumnNames<M, K>, FalseKeys<M, K, FS>>)
    : TrueKeys<M, K, FS>;

/**
 * Selection<M, K, FS> = the returned shape for table K given strategy FS:
 *
 * 1) Map each included column (from SelectedColumns<…>) to TS type via ColumnTypeToTS<…>.
 * 2) For each RName ∈ (keyof FS ∩ keyof M[K]['relations']):
 *     - If FS[RName] is `false`, omit that relation.
 *     - Else let RS = FS[RName] extends true ? {} : Extract<FS[RName], Record<string, any>>.
 *       • If relation type = 'hasMany', then
 *           RName: DeepExpand<Selection<M, target, RS>>[]
 *       • If type = 'hasOne' or 'references', then
 *           RName: DeepExpand<Selection<M, target, RS>> | null
 * 3) Omit relations not mentioned in FS.
 */
export type Selection<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M,
  FS extends Record<string, any>
> =
  { [C in SelectedColumns<M, K, FS>]: ColumnTypeToTS<M[K]['columns'][C]> } &
  (
    M[K] extends { relations: infer R }
      ? {
          [RName in Extract<keyof FS, keyof R> as
            FS[RName] extends false ? never : RName
          ]: R[RName] extends RelationDefinition<M>
            ? R[RName]['type'] extends 'hasMany'
              ? DeepExpand<
                  Selection<
                    M,
                    R[RName]['target'],
                    FS[RName] extends true ? {} : Extract<FS[RName], Record<string, any>>
                  >
                >[]
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
 * For any table Target, TableRefs<M, Target> provides:
 *  • Column filters (ColumnRefs<M, Target>)
 *  • Relation filters for hasMany (HasManyRelationFilter<M, Target>)
 *  • Relation refs for hasOne/references (SingleRelationRefs<M, Target>).
 */
export type TableRefs<
  M extends Record<string, TableDefinition<M>>,
  Target extends keyof M
> = ColumnRefs<M, Target> &
  RelationRefs<M, Target> & {
    // Table-level predicate shorthand: db.table(predicate) ⇒ BooleanFilterType
    (predicate: (row: TableRefs<M, Target>) => BooleanFilterType): BooleanFilterType;
  };

/**
 * HasManyRelationFilter<M, Target> provides any/all/none/exists on a hasMany relation.
 *  • `any(predicate)`                              → BooleanFilterType
 *  • `all(predicate)`                              → BooleanFilterType
 *  • `none(predicate)`                             → BooleanFilterType
 *  • `exists()`                                     → BooleanFilterType
 *
 * The `predicate` receives a full `TableRefs<M, TargetTable>` so you can filter
 * columns, hasMany and hasOne/references relations, nesting arbitrarily deep.
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
 * SingleRelationRefs<M, Target> provides, for a single‐row relation (hasOne or references),
 * the same TableRefs<M, Target> so you can navigate into filters for that single relation.
 */
export type SingleRelationRefs<
  M extends Record<string, TableDefinition<M>>,
  Target extends keyof M
> = TableRefs<M, Target>;

/**
 * For each table K, ColumnRefs<M,K> provides a ColumnFilterType for each column C.
 */
export type ColumnRefs<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M
> = {
  [C in keyof M[K]['columns']]: ColumnFilterType<ColumnTypeToTS<M[K]['columns'][C]>>;
};

/**
 * RelationRefs<M,K> provides:
 *  • For each hasMany relation RName: both HasManyRelationFilter<M, RTarget>
 *    and TableRefs<M, RTarget> to allow direct column filters shorthand + nested filters.
 *  • For each hasOne/references relation RName: SingleRelationRefs<M, RTarget> | null.
 */
export type RelationRefs<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M
> = M[K] extends { relations: infer R }
  ? {
      [RName in keyof R]: R[RName] extends RelationDefinition<M>
        ? R[RName]['type'] extends 'hasMany'
          ? HasManyRelationFilter<M, R[RName]['target']> & TableRefs<M, R[RName]['target']>
          : R[RName]['type'] extends 'hasOne' | 'references'
          ? SingleRelationRefs<M, R[RName]['target']> | null
          : never
        : never;
    }
  : {};

/**
 * TableClient<M, K> provides getAll and getById for table K.
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
 *  • TableRefs<M, K>   (all column filters + relation filters + relation refs + table-level predicate)
 *  • TableClient<M, K> (getAll, getById)
 */
export type DBClient<M extends Record<string, TableDefinition<M>>> = {
  [TableName in keyof M]: TableRefs<M, TableName> & TableClient<M, TableName>;
};

/**
 * The single entry‐point.  `db(schema)` infers M = typeof schema
 * and returns a DBClient<M> where:
 *  • You can reference columns: `database.customers.name.equal('Lars')`.
 *  • You can combine: `filter.and(anotherFilter)`.
 *  • You can filter hasMany relations with `.any(...)`, `.all(...)`, `.none(...)`, `.exists()`,
 *    and nest further deep: e.g. `orders.lines.none(x => x.packages.any(y => y.orderLine.weight.equal(100)))`.
 *  • For hasOne/references, you can navigate to single relation refs.
 *  • You can shorthand a related‐row column: `database.orders.lines.weight.equal(100)`
 *    (interpreted as `database.orders.lines.any(x => x.weight.equal(100))`).
 *  • At table‐level, you can write `database.orders(x => x.name.equal('foo'))` to get a BooleanFilterType.
 *  • getAll/getById as before for actual data fetching.
 *
 * Example usage:
 *
 *   import { db } from './map2';
 *   import { schema } from './schema';
 *
 *   const database = db(schema);
 *
 *   // Table‐level predicate:
 *   const f0 = database.orders(x => x.name.equal('foo'));
 *
 *   // Column filters:
 *   const f1 = database.customers.name.equal('Lars');
 *
 *   // Combine:
 *   const f2 = f1.and(database.customers.name.equal('Anne'));
 *
 *   // any/all/none/exists on hasMany (nested):
 *   const f3 = database.orders.lines.any(x =>
 *     x.productId.equal('p1q2r3-uuid')
 *   );
 *   const f4 = database.orders.lines.all(x =>
 *     x.price.greaterThan(50)
 *   );
 *   const f5 = database.orders.lines.none(x =>
 *     x.packages.any(y => y.weight.equal(100))
 *   );
 *
 *   // Deep nested inside any/all/none:
 *   const f6 = database.orders.lines.none(x =>
 *     x.packages.any(y => y.orderLine.weight.equal(100))
 *   );
 *
 *   // Check existence only:
 *   const f7 = database.orders.lines.exists();
 *
 *   // Shorthand column filter on hasMany target:
 *   const f8 = database.orders.lines.weight.equal(100);
 *
 *   // Standard getAll/getById:
 *   const allCusts = await database.customers.getAll({ name: true });
 *   const cust1 = await database.customers.getById('uuid-value', { email: true });
 */
export function db<
  M extends Record<string, TableDefinition<M>>
>(schema: M): DBClient<M>;
