// map2.d.ts

/**
 * RelationType must be one of these three string literals.
 */
export type RelationType = 'hasMany' | 'hasOne' | 'references';

/**
 * A single‐relation definition.
 *
 *  • `type`: one of 'hasMany' | 'hasOne' | 'references'
 *  • `target`: the name of another table in the same map
 *  • `fkColumns`: a readonly array of column‐names in THIS table that serve as the foreign key(s).
 *
 *    – For a single‐column FK: `fkColumns: ['orderId'] as const`.
 *    – For a composite FK: `fkColumns: ['orderId','productId'] as const`.
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
 *  • `columns`: a record of column‐names → their TypeScript types.
 *  • `primaryKey`: a readonly array of column‐names (one or more). TS will treat these
 *     as valid keys into `columns` (via `as const` on the schema).
 *  • `relations?`: an object mapping relation‐names → RelationDefinition.
 */
export type TableDefinition<
  Tables extends Record<string, any>
> = {
  columns: Record<string, any>;
  primaryKey: readonly (keyof any)[];
  relations?: Record<string, RelationDefinition<Tables>>;
};

/**
 * Recursively expand any nested object/array into a plain‐object type.
 *  • If T is Array<U>, then DeepExpand<T> = Array<DeepExpand<U>>.
 *  • If T is object, then DeepExpand<T> = { [K in keyof T]: DeepExpand<T[K]> }.
 *  • Otherwise (primitive), DeepExpand<T> = T.
 */
export type DeepExpand<T> =
  T extends Array<infer U>
    ? Array<DeepExpand<U>>
    : T extends object
    ? { [K in keyof T]: DeepExpand<T[K]> }
    : T;

/**
 * FetchStrategy<M, K> may specify:
 *  • Individual columns (keys from M[K]['columns']) mapped to `true | false`.
 *    – If any column is `true`, only those are included.
 *    – Else if any column is `false`, all except those are included.
 *    – If no column‐keys appear, all columns are included by default.
 *  • Relation keys (from M[K]['relations']) mapped to nested FetchStrategy for that target.
 */
export type FetchStrategy<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M
> =
  // column‐level flags
  Partial<Record<keyof M[K]['columns'], boolean>> &
  // relation‐level nested strategies
  (M[K] extends { relations: infer R }
    ? { [RName in keyof R]?: FetchStrategy<M, R[RName]['target']> }
    : {});

/**
 * PrimaryKeyOf<M, K>:
 *  • If `primaryKey` = ['id'], then PrimaryKeyOf<M, K> = columns['id'].
 *  • Otherwise (composite), = { key: columns[key], … } for each key.
 */
export type PrimaryKeyOf<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M
> = M[K]['primaryKey'] extends readonly [infer Single]
  ? Single extends keyof M[K]['columns']
    ? M[K]['columns'][Single]
    : never
  : {
      [P in Extract<M[K]['primaryKey'][number], keyof M[K]['columns']>]: M[K]['columns'][P];
    };

/**
 * Helpers to compute which column‐names are selected under FS.
 */
type ColumnNames<M extends Record<string, TableDefinition<M>>, K extends keyof M> =
  keyof M[K]['columns'];

type TrueKeys<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M,
  FS extends Record<string, any>
> = {
  [C in ColumnNames<M, K>]: FS extends Record<C, infer B> ? (B extends true ? C : never) : never;
}[ColumnNames<M, K>];

type FalseKeys<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M,
  FS extends Record<string, any>
> = {
  [C in ColumnNames<M, K>]: FS extends Record<C, infer B> ? (B extends false ? C : never) : never;
}[ColumnNames<M, K>];

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
 * 1) Include exactly the columns from SelectedColumns<M, K, FS>.
 * 2) For each `RName` in FS that is also a relation key:
 *     - If relation type = 'hasMany', then
 *         RName: DeepExpand<Selection<M, target, FS[RName]>>[]
 *     - If type = 'hasOne' or 'references', then
 *         RName: DeepExpand<Selection<M, target, FS[RName]>> | null
 * 3) Omit any relation not mentioned in FS.
 */
export type Selection<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M,
  FS extends Record<string, any>
> =
  // 1) Column selection
  { [C in SelectedColumns<M, K, FS>]: M[K]['columns'][C] } &
  // 2) Relation selection
  (
    M[K] extends { relations: infer R }
      ? {
          [RName in Extract<keyof FS, keyof R>]: R[RName] extends RelationDefinition<M>
            ? R[RName]['type'] extends 'hasMany'
              ? DeepExpand<Selection<M, R[RName]['target'], FS[RName]>>[]
              : DeepExpand<Selection<M, R[RName]['target'], FS[RName]>> | null
            : never;
        }
      : {}
  );

/**
 * “SaveableRow”: given a plain‐selection row type T for table K, add:
 *  - saveChanges(): Promise<SaveableRow<M, K, DeepExpand<Selection<M, K, {}>>>>
 *  - saveChanges<FS2 extends FetchStrategy<M,K>>(fs: FS2): Promise<SaveableRow<M, K, DeepExpand<Selection<M, K, FS2>>>>
 *
 * The returned row is again a “saveable” fully-expanded plain object (with saveChanges).
 */
type SaveableRow<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M,
  T
> = T & {
  saveChanges(): Promise<SaveableRow<M, K, DeepExpand<Selection<M, K, {}>>>>;
  saveChanges<FS2 extends FetchStrategy<M, K>>(
    fetchStrategy: FS2
  ): Promise<SaveableRow<M, K, DeepExpand<Selection<M, K, FS2>>>>;
};

/**
 * “SaveableArray”: given a plain array of rows T for table K, add:
 *  - saveChanges(): Promise<SaveableArray<M, K, DeepExpand<Selection<M, K, {}>>>>
 *  - saveChanges<FS2 extends FetchStrategy<M,K>>(fs: FS2): Promise<SaveableArray<M, K, DeepExpand<Selection<M, K, FS2>>>>
 *
 * The returned promise gives you a new “saveable” array of fully-expanded plain rows,
 * on which you can again call saveChanges(). Individual items remain plain.
 */
type SaveableArray<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M,
  T
> = Array<T> & {
  saveChanges(): Promise<SaveableArray<M, K, DeepExpand<Selection<M, K, {}>>>>;
  saveChanges<FS2 extends FetchStrategy<M, K>>(
    fetchStrategy: FS2
  ): Promise<SaveableArray<M, K, DeepExpand<Selection<M, K, FS2>>>>;
};

/**
 * DBClient<M> supplies, for each table K:
 *
 *   // getAll, no strategy → SaveableArray<M,K,DeepExpand<Selection<M,K,{}>>>
 *   getAll(): Promise<SaveableArray<M, TableName, DeepExpand<Selection<M, TableName, {}>>>>
 *
 *   // getAll, with strategy → SaveableArray<M,K,DeepExpand<Selection<M,K,FS>>>
 *   getAll<FS extends FetchStrategy<M, TableName>>(fetchStrategy: FS):
 *     Promise<SaveableArray<M, TableName, DeepExpand<Selection<M, TableName, FS>>>>
 *
 *   // getById, no strategy → SaveableRow<M,K,DeepExpand<Selection<M,K,{}>>> | null
 *   getById(id: PrimaryKeyOf<M, TableName>):
 *     Promise<SaveableRow<M, TableName, DeepExpand<Selection<M, TableName, {}>>> | null>
 *
 *   // getById, with strategy → SaveableRow<M,K,DeepExpand<Selection<M,K,FS>>> | null
 *   getById<FS extends FetchStrategy<M, TableName>>(
 *     id: PrimaryKeyOf<M, TableName>,
 *     fetchStrategy: FS
 *   ): Promise<SaveableRow<M, TableName, DeepExpand<Selection<M, TableName, FS>>> | null>
 */
export type DBClient<M extends Record<string, TableDefinition<M>>> = {
  [TableName in keyof M]: {
    getAll(): Promise<SaveableArray<M, TableName, DeepExpand<Selection<M, TableName, {}>>>>;
    getAll<FS extends FetchStrategy<M, TableName>>(
      fetchStrategy: FS
    ): Promise<SaveableArray<M, TableName, DeepExpand<Selection<M, TableName, FS>>>>;

    getById(
      id: PrimaryKeyOf<M, TableName>
    ): Promise<SaveableRow<M, TableName, DeepExpand<Selection<M, TableName, {}>>> | null>;
    getById<FS extends FetchStrategy<M, TableName>>(
      id: PrimaryKeyOf<M, TableName>,
      fetchStrategy: FS
    ): Promise<SaveableRow<M, TableName, DeepExpand<Selection<M, TableName, FS>>> | null>;
  };
};

/**
 * The single entry-point.  `db(schema)` infers M = typeof schema
 * and returns a DBClient<M> where:
 *  • `getAll()` returns a plain-row array with `saveChanges()` on the array.
 *  • `getById(id)` returns a plain-row object with `saveChanges()` on it, and calling saveChanges again returns another saveable row.
 *  • Passing a strategy object allows fine-grained column+relation fetch as described.
 */
export function db<
  M extends Record<string, TableDefinition<M>>
>(schema: M): DBClient<M>;
