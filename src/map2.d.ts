export type ORMColumnType = 'string' | 'bigint' | 'uuid' | 'date' | 'numeric' | 'boolean';

type NormalizeColumn<T> =
  T extends ORMColumnType ? { type: T; notNull?: false } :
  T extends { type: ORMColumnType } ? T :
  never;

type IsRequired<CT> = NormalizeColumn<CT>['notNull'] extends true ? true : false;

type ColumnTypeToTS<CT> =
  NormalizeColumn<CT>['type'] extends 'numeric' ? number :
  NormalizeColumn<CT>['type'] extends 'boolean' ? boolean :
  string;

export type RelationType = 'hasMany' | 'hasOne' | 'references';

export type RelationDefinition<Tables extends Record<string, any>> = {
  type: RelationType;
  target: keyof Tables;
  fkColumns: readonly (keyof any)[];
};

export type TableDefinition<Tables extends Record<string, any>> = {
  columns: Record<string, ORMColumnType | { type: ORMColumnType; notNull?: boolean }>;
  primaryKey: readonly (keyof any)[];
  relations?: Record<string, RelationDefinition<Tables>>;
};

export interface BooleanFilterType {
  and(other: BooleanFilterType): BooleanFilterType;
  or(other: BooleanFilterType): BooleanFilterType;
  not(): BooleanFilterType;
}

export interface ColumnFilterType<Val> {
  equal(value: Val | null | undefined): BooleanFilterType;
  notEqual(value: Val | null | undefined): BooleanFilterType;
  lessThan(value: Val | null | undefined): BooleanFilterType;
  lessThanOrEqual(value: Val | null | undefined): BooleanFilterType;
  greaterThan(value: Val | null | undefined): BooleanFilterType;
  greaterThanOrEqual(value: Val | null | undefined): BooleanFilterType;
  in(values: (Val | null | undefined)[]): BooleanFilterType;
  notIn(values: (Val | null | undefined)[]): BooleanFilterType;
  isNull(): BooleanFilterType;
  isNotNull(): BooleanFilterType;
}

export type TableRefs<M extends Record<string, TableDefinition<M>>, Target extends keyof M> =
  ColumnRefs<M, Target> &
  RelationRefs<M, Target> & {
    exists(): BooleanFilterType;
  };

export type HasManyRelationFilter<M extends Record<string, TableDefinition<M>>, Target extends keyof M> = {
  any(predicate: (row: TableRefs<M, Target>) => BooleanFilterType): BooleanFilterType;
  all(predicate: (row: TableRefs<M, Target>) => BooleanFilterType): BooleanFilterType;
  none(predicate: (row: TableRefs<M, Target>) => BooleanFilterType): BooleanFilterType;
  exists(): BooleanFilterType;
};

export type FilterableSingleRelation<M extends Record<string, TableDefinition<M>>, Target extends keyof M> =
  TableRefs<M, Target> & {
    (predicate: (row: TableRefs<M, Target>) => BooleanFilterType): BooleanFilterType;
  };

export type ColumnRefs<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
  [C in keyof M[K]['columns']]: ColumnFilterType<ColumnTypeToTS<M[K]['columns'][C]>>;
};

export type RelationRefs<M extends Record<string, TableDefinition<M>>, K extends keyof M> =
  M[K] extends { relations: infer R }
    ? {
        [RName in keyof R]: R[RName] extends RelationDefinition<M>
          ? R[RName]['type'] extends 'hasMany'
            ? HasManyRelationFilter<M, R[RName]['target']> & TableRefs<M, R[RName]['target']>
            : R[RName]['type'] extends 'hasOne' | 'references'
              ? FilterableSingleRelation<M, R[RName]['target']>
              : never
          : never;
      }
    : {};

export type OrderBy<M extends Record<string, TableDefinition<M>>, K extends keyof M> = Array<
  | `${Extract<keyof M[K]['columns'], string>}`
  | `${Extract<keyof M[K]['columns'], string>} asc`
  | `${Extract<keyof M[K]['columns'], string>} desc`
>;

export type FetchStrategy<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
  orderBy?: OrderBy<M, K>;
  where?: (row: TableRefs<M, K>) => BooleanFilterType;
} & Partial<Record<keyof M[K]['columns'], boolean>> & (
  M[K] extends { relations: infer R }
    ? { [RName in keyof R]?: true | false | FetchStrategy<M, R[RName]['target']> }
    : {}
);

type TrueKeys<M extends Record<string, TableDefinition<M>>, K extends keyof M, FS extends Record<string, any>> = {
  [C in keyof M[K]['columns']]: FS extends Record<C, infer B> ? (B extends true ? C : never) : never;
}[keyof M[K]['columns']];

type FalseKeys<M extends Record<string, TableDefinition<M>>, K extends keyof M, FS extends Record<string, any>> = {
  [C in keyof M[K]['columns']]: FS extends Record<C, infer B> ? (B extends false ? C : never) : never;
}[keyof M[K]['columns']];

type SelectedColumns<M extends Record<string, TableDefinition<M>>, K extends keyof M, FS extends Record<string, any>> =
  TrueKeys<M, K, FS> extends never
    ? (FalseKeys<M, K, FS> extends never
        ? keyof M[K]['columns']
        : Exclude<keyof M[K]['columns'], FalseKeys<M, K, FS>>)
    : TrueKeys<M, K, FS>;

type RequiredColumnKeys<M extends Record<string, TableDefinition<M>>, K extends keyof M, FS extends Record<string, any>> = {
  [C in SelectedColumns<M, K, FS>]: IsRequired<M[K]['columns'][C]> extends true ? C : never;
}[SelectedColumns<M, K, FS>];

type OptionalColumnKeys<M extends Record<string, TableDefinition<M>>, K extends keyof M, FS extends Record<string, any>> =
  Exclude<SelectedColumns<M, K, FS>, RequiredColumnKeys<M, K, FS>>;

export type Selection<M extends Record<string, TableDefinition<M>>, K extends keyof M, FS extends Record<string, any>> =
  {
    [C in RequiredColumnKeys<M, K, FS>]: ColumnTypeToTS<M[K]['columns'][C]>;
  } & {
    [C in OptionalColumnKeys<M, K, FS>]?: ColumnTypeToTS<M[K]['columns'][C]>;
  } & (
    M[K] extends { relations: infer R }
      ? {
          [RName in Extract<keyof FS, keyof R> as FS[RName] extends false ? never : RName]?: (
            R[RName] extends RelationDefinition<M>
              ? R[RName]['type'] extends 'hasMany'
                ? Array<DeepExpand<Selection<M, R[RName]['target'], FS[RName] extends true ? {} : Extract<FS[RName], Record<string, any>>>>>
                : DeepExpand<Selection<M, R[RName]['target'], FS[RName] extends true ? {} : Extract<FS[RName], Record<string, any>>>> | null
              : never
          );
        }
      : {}
  );

export type PrimaryKeyArgs<M extends Record<string, TableDefinition<M>>, K extends keyof M> =
  M[K]['primaryKey'] extends readonly [infer A extends keyof M[K]['columns']]
    ? [key1: ColumnTypeToTS<M[K]['columns'][A]>]
  : M[K]['primaryKey'] extends readonly [infer A extends keyof M[K]['columns'], infer B extends keyof M[K]['columns']]
    ? [key1: ColumnTypeToTS<M[K]['columns'][A]>, key2: ColumnTypeToTS<M[K]['columns'][B]>]
  : M[K]['primaryKey'] extends readonly [infer A extends keyof M[K]['columns'], infer B extends keyof M[K]['columns'], infer C extends keyof M[K]['columns']]
    ? [key1: ColumnTypeToTS<M[K]['columns'][A]>, key2: ColumnTypeToTS<M[K]['columns'][B]>, key3: ColumnTypeToTS<M[K]['columns'][C]>]
  : M[K]['primaryKey'] extends readonly [infer A extends keyof M[K]['columns'], infer B extends keyof M[K]['columns'], infer C extends keyof M[K]['columns'], infer D extends keyof M[K]['columns']]
    ? [key1: ColumnTypeToTS<M[K]['columns'][A]>, key2: ColumnTypeToTS<M[K]['columns'][B]>, key3: ColumnTypeToTS<M[K]['columns'][C]>, key4: ColumnTypeToTS<M[K]['columns'][D]>]
  : M[K]['primaryKey'] extends readonly [infer A extends keyof M[K]['columns'], infer B extends keyof M[K]['columns'], infer C extends keyof M[K]['columns'], infer D extends keyof M[K]['columns'], infer E extends keyof M[K]['columns']]
    ? [key1: ColumnTypeToTS<M[K]['columns'][A]>, key2: ColumnTypeToTS<M[K]['columns'][B]>, key3: ColumnTypeToTS<M[K]['columns'][C]>, key4: ColumnTypeToTS<M[K]['columns'][D]>, key5: ColumnTypeToTS<M[K]['columns'][E]>]
  : M[K]['primaryKey'] extends readonly [infer A extends keyof M[K]['columns'], infer B extends keyof M[K]['columns'], infer C extends keyof M[K]['columns'], infer D extends keyof M[K]['columns'], infer E extends keyof M[K]['columns'], infer F extends keyof M[K]['columns']]
    ? [key1: ColumnTypeToTS<M[K]['columns'][A]>, key2: ColumnTypeToTS<M[K]['columns'][B]>, key3: ColumnTypeToTS<M[K]['columns'][C]>, key4: ColumnTypeToTS<M[K]['columns'][D]>, key5: ColumnTypeToTS<M[K]['columns'][E]>, key6: ColumnTypeToTS<M[K]['columns'][F]>]
  : never;

export type TableClient<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
  getAll(): Promise<Array<DeepExpand<Selection<M, K, {}>>>>;
  getAll<strategy extends FetchStrategy<M, K>>(strategy: strategy): Promise<Array<DeepExpand<Selection<M, K, strategy>>>>;

  getById<strategy extends FetchStrategy<M, K>>(
    ...args: [...PrimaryKeyArgs<M, K>, strategy?: strategy]
  ): Promise<DeepExpand<Selection<M, K, strategy>> | null>;

};

export type DBClient<M extends Record<string, TableDefinition<M>>> = {
  [TableName in keyof M]: TableRefs<M, TableName> & TableClient<M, TableName>;
} & {
  filter: BooleanFilterType;
  and(f: BooleanFilterType): BooleanFilterType;
  or(f: BooleanFilterType): BooleanFilterType;
  not(f: BooleanFilterType): BooleanFilterType;
};

export function db<M extends Record<string, TableDefinition<M>>>(schema: M): DBClient<M>;

export type DeepExpand<T> =
  T extends Array<infer U>
    ? Array<DeepExpand<U>>
    : T extends object
      ? { [K in keyof T]: DeepExpand<T[K]> }
      : T;
