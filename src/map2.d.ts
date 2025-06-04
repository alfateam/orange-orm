// map2.d.ts

/**
 * RelationType must be one of these three string literals.
 */
export type RelationType = 'hasMany' | 'hasOne' | 'references';

/**
 * A single relation definition.
 *  - `type`: one of 'hasMany' | 'hasOne' | 'references'.
 *  - `target`: the name of another table in the same map.
 *  - `fkColumn`: the foreign-key column on the current table.
 */
export type RelationDefinition<Tables extends Record<string, any>> = {
  type: RelationType;
  target: keyof Tables;
  fkColumn: string;
};

/**
 * A single table definition.
 *  - `columns`: Record<columnName, columnType>.
 *  - `relations` (optional): map from a relation name to RelationDefinition.
 */
export type TableDefinition<Tables extends Record<string, any>> = {
  columns: Record<string, any>;
  relations?: {
    [relationName: string]: RelationDefinition<Tables>;
  };
};

/**
 * Recursively expand any nested object/array into a fresh plain‐object type.
 *   - If T is Array<U>, then DeepExpand<T> = Array<DeepExpand<U>>.
 *   - If T is object, then DeepExpand<T> = { [K in keyof T]: DeepExpand<T[K]> }.
 *   - Otherwise (primitive), DeepExpand<T> = T.
 */
export type DeepExpand<T> =
  T extends Array<infer U>
    ? Array<DeepExpand<U>>
    : T extends object
    ? { [K in keyof T]: DeepExpand<T[K]> }
    : T;

/**
 * ModelFor<M, K> = the “full” nested shape for table K in map M:
 *   1) All columns of M[K]['columns'].
 *   2) For each relation in M[K]['relations'], recurses to ModelFor<M, target>.
 */
export type ModelFor<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M
> = {
  [C in keyof M[K]['columns']]: M[K]['columns'][C];
} &
  (M[K] extends { relations: infer R }
    ? {
        [RName in keyof R]: R[RName] extends RelationDefinition<M>
          ? R[RName]['type'] extends 'hasMany'
            ? ModelFor<M, R[RName]['target']>[]
            : R[RName]['type'] extends 'hasOne'
            ? ModelFor<M, R[RName]['target']> | null
            : R[RName]['type'] extends 'references'
            ? ModelFor<M, R[RName]['target']> | null
            : never
          : never;
      }
    : {});

/**
 * FetchStrategy<M, K> describes which relations of table K you want to include:
 *   - If K has no `relations`, FetchStrategy<M,K> = {}.
 *   - Otherwise, it’s an object whose keys are a subset of `keyof M[K]['relations']`,
 *     and values are themselves FetchStrategy<M, TargetTable>.
 *
 * Example: for `orders` which has relations { customer, lines, deliveryAddress },
 *   FetchStrategy<M, 'orders'> = {
 *     customer?: FetchStrategy<M, 'customers'>;
 *     lines?:    FetchStrategy<M, 'orderLines'>;
 *     deliveryAddress?: FetchStrategy<M, 'deliveryAddresses'>;
 *   }
 */
export type FetchStrategy<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M
> = M[K] extends { relations: infer R }
  ? {
      [RName in keyof R]?: R[RName] extends RelationDefinition<M>
        ? FetchStrategy<M, R[RName]['target']>
        : never;
    }
  : {};

/**
 * Selection<M, K, FS> = the type returned for table K when you pass `FS` as fetch strategy:
 *   1) Always include all columns of M[K]['columns'].
 *   2) For each relation key RName that appears in FS:
 *       - If that relation’s type = 'hasMany', then RName: Array<Selection<…>>
 *       - If 'hasOne' or 'references', then RName: Selection<…> | null.
 *   3) Any relation not mentioned in FS is omitted.
 */
export type Selection<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M,
  FS extends Record<string, any>
> = {
  [C in keyof M[K]['columns']]: M[K]['columns'][C];
} &
  (
    M[K] extends { relations: infer R }
      ? {
          [RName in Extract<keyof FS, keyof R>]: R[RName] extends RelationDefinition<M>
            ? R[RName]['type'] extends 'hasMany'
              ? Selection<M, R[RName]['target'], FS[RName]>[]
              : R[RName]['type'] extends 'hasOne'
              ? Selection<M, R[RName]['target'], FS[RName]> | null
              : R[RName]['type'] extends 'references'
              ? Selection<M, R[RName]['target'], FS[RName]> | null
              : never
            : never;
        }
      : {}
  );

/**
 * DBClient<M> now supplies, for each table K:
 *
 *   // Overload #1: no arguments → return only columns
 *   getAll(): Promise<DeepExpand<Selection<M, K, {}>>[]>;
 *
 *   // Overload #2: pass a fetch-strategy FS → return Selection<M, K, FS>, fully expanded
 *   getAll<FS extends FetchStrategy<M, K>>(fetchStrategy: FS): Promise<DeepExpand<Selection<M, K, FS>>[]>;
 */
export type DBClient<M extends Record<string, TableDefinition<M>>> = {
  [TableName in keyof M]: {
    getAll(): Promise<DeepExpand<Selection<M, TableName, {}>>[]>;
    getAll<FS extends FetchStrategy<M, TableName>>(
      fetchStrategy: FS
    ): Promise<DeepExpand<Selection<M, TableName, FS>>[]>;
  };
};

/**
 * The single entry point.  `db(schema)` infers M = typeof schema,
 * and returns a DBClient<M> that has the overloaded getAll().
 */
export function db<
  M extends Record<string, TableDefinition<M>>
>(schema: M): DBClient<M>;
