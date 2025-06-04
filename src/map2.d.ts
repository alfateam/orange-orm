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
 *  • `fkColumns`: a readonly array of column‐names (strings) in THIS table that serve as the foreign key(s).
 *
 *    – If you reference a single‐column PK, use e.g. `fkColumns: ['orderId'] as const`.
 *    – If you reference a composite PK (e.g. ['orderId','productId']), list all of them.
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
 *     as valid keys into `columns` (via your `as const` on the schema).
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
 * Recursively expand any nested object/array into a fresh plain‐object type.
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
 * ModelFor<M, K> = the “full” nested shape for table K in map M:
 *  1) All columns of M[K]['columns'].
 *  2) For each relation in M[K]['relations'], recurses to ModelFor<M, target>.
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
 *  • If K has no `relations`, then FetchStrategy<M, K> = {}.
 *  • Otherwise, it’s an object whose keys are exactly `keyof M[K]['relations']`,
 *    and whose values are themselves FetchStrategy<M, target>.
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
 * Selection<M, K, FS> = the type returned for table K when you pass `FS`:
 *  1) Always include every column of M[K]['columns'].
 *  2) For each `RName` in `FS`:
 *       - If that relation’s type = 'hasMany', then
 *           RName: Array<Selection<M, target, FS[RName]>>
 *       - If type = 'hasOne' or 'references', then
 *           RName: Selection<M, target, FS[RName]> | null
 *  3) Any relation not mentioned in FS is omitted entirely.
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
 * PrimaryKeyOf<M, K>:
 *  • If `primaryKey` is `['id']` (single‐element), then PrimaryKeyOf<M, K> = the column‐type of `id`.
 *  • Otherwise (composite), PrimaryKeyOf<M, K> = an object whose keys are each element
 *    in the `primaryKey` tuple, and whose values are taken from `columns[thatKey]`.
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
 * RowWithSave<M, K, FS> = a selected row type for table K (with fetch strategy FS),
 * extended with saveChanges overloads:
 *
 *   - saveChanges(): Promise<SavedRow<rootColumns>>
 *   - saveChanges<FS2 extends FetchStrategy<M,K>>(fetchStrategy: FS2): Promise<SavedRow<nestedColumns(FS2)>>
 *
 * Where SavedRow<...> is each property also extended with saveChanges again.
 */
export type RowWithSave<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M,
  FS extends Record<string, any>
> = DeepExpand<Selection<M, K, FS>> & {
  saveChanges(): Promise<RowWithSave<M, K, {}>>;
  saveChanges<FS2 extends FetchStrategy<M, K>>(
    fetchStrategy: FS2
  ): Promise<RowWithSave<M, K, FS2>>;
};

/**
 * ArrayWithSave<M, K, FS> = an array of selected rows for table K (with fetch strategy FS),
 * extended with saveChanges overloads that return a new ArrayWithSave as well:
 *
 *   - saveChanges(): Promise<ArrayWithSave<M, K, {}>>
 *   - saveChanges<FS2 extends FetchStrategy<M,K>>(fetchStrategy: FS2): Promise<ArrayWithSave<M, K, FS2>>
 */
export type ArrayWithSave<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M,
  FS extends Record<string, any>
> = Array<RowWithSave<M, K, FS>> & {
  saveChanges(): Promise<ArrayWithSave<M, K, {}>>;
  saveChanges<FS2 extends FetchStrategy<M, K>>(
    fetchStrategy: FS2
  ): Promise<ArrayWithSave<M, K, FS2>>;
};

/**
 * DBClient<M> supplies, for each table K:
 *
 *   // getAll without fetch‐strategy:
 *   getAll(): Promise<ArrayWithSave<M, K, {}>>
 *
 *   // getAll with fetch‐strategy:
 *   getAll<FS extends FetchStrategy<M, K>>(fetchStrategy: FS): Promise<ArrayWithSave<M, K, FS>>
 *
 *   // getById without fetch‐strategy:
 *   getById(id: PrimaryKeyOf<M, K>): Promise<RowWithSave<M, K, {}> | null>
 *
 *   // getById with fetch‐strategy:
 *   getById<FS extends FetchStrategy<M, K>>(
 *     id: PrimaryKeyOf<M, K>,
 *     fetchStrategy: FS
 *   ): Promise<RowWithSave<M, K, FS> | null>
 */
export type DBClient<M extends Record<string, TableDefinition<M>>> = {
  [TableName in keyof M]: {
    getAll(): Promise<ArrayWithSave<M, TableName, {}>>;
    getAll<FS extends FetchStrategy<M, TableName>>(
      fetchStrategy: FS
    ): Promise<ArrayWithSave<M, TableName, FS>>;

    getById(
      id: PrimaryKeyOf<M, TableName>
    ): Promise<RowWithSave<M, TableName, {}> | null>;
    getById<FS extends FetchStrategy<M, TableName>>(
      id: PrimaryKeyOf<M, TableName>,
      fetchStrategy: FS
    ): Promise<RowWithSave<M, TableName, FS> | null>;
  };
};

/**
 * The single entry‐point.  `db(schema)` infers M = typeof schema,
 * and returns a DBClient<M> that has both getAll(...) and getById(...),
 * with saveChanges(fetchStrategy?) appropriately typed, and arrays / returned rows
 * from saveChanges also supporting saveChanges themselves.
 */
export function db<
  M extends Record<string, TableDefinition<M>>
>(schema: M): DBClient<M>;
