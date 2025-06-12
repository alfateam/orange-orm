//map2.d.ts
export type ORMColumnType = 'string' | 'bigint' | 'uuid' | 'date' | 'numeric' | 'boolean' | 'json' | 'binary';

type NormalizeColumn<T> =
  T extends ORMColumnType ? { type: T; notNull?: false } :
  T extends { type: ORMColumnType } ? T :
  T extends { type: 'json'; tsType: any } ? T :
  never;

type IsRequired<CT> = NormalizeColumn<CT>['notNull'] extends true ? true : false;

type ColumnTypeToTS<CT> =
  NormalizeColumn<CT>['type'] extends 'numeric' ? number :
  NormalizeColumn<CT>['type'] extends 'boolean' ? boolean :
  NormalizeColumn<CT>['type'] extends 'json' ? NormalizeColumn<CT>['tsType'] :
  NormalizeColumn<CT>['type'] extends 'date' ? (string | Date) :
  string;

export type RelationType = 'hasMany' | 'hasOne' | 'references';

export type RelationDefinition<Tables extends Record<string, any>> = {
  type: RelationType;
  target: keyof Tables;
};

export type TableDefinition<Tables extends Record<string, any>> = {
  columns: Record<string, ORMColumnType | { type: ORMColumnType; notNull?: boolean }>;
  primaryKey: readonly (keyof any)[];
  relations?: Record<string, RelationDefinition<Tables>>;
};

export interface RawFilter {
  sql: string | (() => string);
  parameters?: any[];
}

export interface BooleanFilterType extends RawFilter {
  and(other: BooleanFilterType | RawFilter[], ...filters: RawFilter[]): BooleanFilterType;
  or(other: BooleanFilterType | RawFilter[], ...filters: RawFilter[]): BooleanFilterType;
  not(): BooleanFilterType;
}

type StringOnlyMethods = {
  startsWith(value: string | null | undefined): BooleanFilterType;
  iStartsWith(value: string | null | undefined): BooleanFilterType;
  endsWith(value: string | null | undefined): BooleanFilterType;
  iEndsWith(value: string | null | undefined): BooleanFilterType;
  contains(value: string | null | undefined): BooleanFilterType;
  iContains(value: string | null | undefined): BooleanFilterType;
  iEqual(value: string | null | undefined): BooleanFilterType;
  ieq(value: string | null | undefined): BooleanFilterType;
};

export type ColumnFilterType<Val, ColumnType = any> = {
  equal(value: Val | null | undefined): BooleanFilterType;
  eq(value: Val | null | undefined): BooleanFilterType;
  notEqual(value: Val | null | undefined): BooleanFilterType;
  ne(value: Val | null | undefined): BooleanFilterType;
  lessThan(value: Val | null | undefined): BooleanFilterType;
  lt(value: Val | null | undefined): BooleanFilterType;
  le(value: Val | null | undefined): BooleanFilterType;
  greaterThan(value: Val | null | undefined): BooleanFilterType;
  gt(value: Val | null | undefined): BooleanFilterType;
  greaterThanOrEqual(value: Val | null | undefined): BooleanFilterType;
  ge(value: Val | null | undefined): BooleanFilterType;
  in(values: (Val | null | undefined)[]): BooleanFilterType;
  between(from: Val | null | undefined, to: Val | null | undefined): BooleanFilterType;
  notIn(values: (Val | null | undefined)[]): BooleanFilterType;
  isNull(): BooleanFilterType;
  isNotNull(): BooleanFilterType;
} & (ColumnType extends 'string' ? StringOnlyMethods : {});

export type JsonArray = Array<JsonValue>;
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = string | number | boolean | null | JsonArray | JsonObject;

export type DeepExpand<T> =
  T extends Date ? T :
  T extends Array<infer U> ? Array<DeepExpand<U>> :
  T extends object ? { [K in keyof T]: DeepExpand<T[K]> } :
  T;

export type ColumnRefs<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
  [C in keyof M[K]['columns']]: ColumnFilterType<
    ColumnTypeToTS<M[K]['columns'][C]>,
    NormalizeColumn<M[K]['columns'][C]>['type']
  >;
};

export type RootTableRefs<M extends Record<string, TableDefinition<M>>, Target extends keyof M> =
  ColumnRefs<M, Target> & RelationRefs<M, Target>;

export type RelationTableRefs<M extends Record<string, TableDefinition<M>>, Target extends keyof M> =
  ColumnRefs<M, Target> & RelationRefs<M, Target> & {
    exists(): BooleanFilterType;
  };

export type HasManyRelationFilter<M extends Record<string, TableDefinition<M>>, Target extends keyof M> = {
  any(predicate: (row: RelationTableRefs<M, Target>) => BooleanFilterType): BooleanFilterType;
  all(predicate: (row: RelationTableRefs<M, Target>) => BooleanFilterType): BooleanFilterType;
  none(predicate: (row: RelationTableRefs<M, Target>) => BooleanFilterType): BooleanFilterType;
  exists(): BooleanFilterType;
};

export type FilterableSingleRelation<M extends Record<string, TableDefinition<M>>, Target extends keyof M> =
  RelationTableRefs<M, Target> & {
    (predicate: (row: RelationTableRefs<M, Target>) => BooleanFilterType): BooleanFilterType;
  };

export type RelationRefs<M extends Record<string, TableDefinition<M>>, K extends keyof M> =
  M[K] extends { relations: infer R }
    ? {
        [RName in keyof R]: R[RName] extends RelationDefinition<M>
          ? R[RName]['type'] extends 'hasMany'
            ? HasManyRelationFilter<M, R[RName]['target']> & RelationTableRefs<M, R[RName]['target']>
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

// Reserved property names that should not conflict with relation selectors
type ReservedFetchStrategyProps = 'orderBy' | 'where';

// Base fetch strategy properties (reserved props)
type BaseFetchStrategy<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
  orderBy?: OrderBy<M, K>;
  where?: (row: RootTableRefs<M, K>) => BooleanFilterType;
};

// Column selection properties
type ColumnSelection<M extends Record<string, TableDefinition<M>>, K extends keyof M> = 
  Partial<Record<keyof M[K]['columns'], boolean>>;

// Relation selection properties (excluding reserved names)
type RelationSelection<M extends Record<string, TableDefinition<M>>, K extends keyof M> =
  M[K] extends { relations: infer R }
    ? { 
        [RName in keyof R as RName extends ReservedFetchStrategyProps ? never : RName]?: 
          true | false | FetchStrategy<M, R[RName]['target']> 
      }
    : {};

// Helper type to extract only column filter types (not relation objects)
type AllColumnFilterTypes<M extends Record<string, TableDefinition<M>>, K extends keyof M> = 
  ColumnRefs<M, K>[keyof ColumnRefs<M, K>];

// Helper type to get column filter types from related tables
type RelatedColumnFilterTypes<M extends Record<string, TableDefinition<M>>, K extends keyof M> = 
  M[K] extends { relations: infer R }
    ? {
        [RName in keyof R]: R[RName] extends { target: infer Target extends keyof M }
          ? ColumnRefs<M, Target>[keyof ColumnRefs<M, Target>]
          : never;
      }[keyof R]
    : never;

// All valid column filter types (direct columns + related table columns)
type ValidColumnFilterTypes<M extends Record<string, TableDefinition<M>>, K extends keyof M> = 
  AllColumnFilterTypes<M, K> | RelatedColumnFilterTypes<M, K>;

// Custom selector functions - allows arbitrary property names with selector functions
// The return type must be a ColumnFilterType that actually exists in the schema
type CustomSelectors<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
  [key: string]: (row: RootTableRefs<M, K>) => ValidColumnFilterTypes<M, K>;
};

// Main FetchStrategy type using union to avoid conflicts
export type FetchStrategy<M extends Record<string, TableDefinition<M>>, K extends keyof M> = 
  BaseFetchStrategy<M, K> & 
  (ColumnSelection<M, K> | RelationSelection<M, K> | CustomSelectors<M, K> | 
   (ColumnSelection<M, K> & RelationSelection<M, K>) |
   (ColumnSelection<M, K> & CustomSelectors<M, K>) |
   (RelationSelection<M, K> & CustomSelectors<M, K>) |
   (ColumnSelection<M, K> & RelationSelection<M, K> & CustomSelectors<M, K>));

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

// Helper type to infer the TypeScript type from a column filter
type InferColumnFilterTypeScript<T> = 
  T extends ColumnFilterType<infer Val, any> ? Val : never;

// Helper type to extract custom selector properties and their return types
type CustomSelectorProperties<M extends Record<string, TableDefinition<M>>, K extends keyof M, FS extends Record<string, any>> = {
  [P in keyof FS as 
    P extends keyof M[K]['columns'] ? never :
    P extends ReservedFetchStrategyProps ? never :
    P extends (M[K] extends { relations: infer R } ? keyof R : never) ? never :
    FS[P] extends (row: any) => any ? 
      (InferColumnFilterTypeScript<FS[P] extends (row: RootTableRefs<M, K>) => infer ReturnType ? ReturnType : never> extends never ? never : P)
      : never
  ]: FS[P] extends (row: RootTableRefs<M, K>) => infer ReturnType 
      ? InferColumnFilterTypeScript<ReturnType>
      : never;
};

export type Selection<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M,
  FS extends Record<string, any>
> = {
  [C in RequiredColumnKeys<M, K, FS>]: ColumnTypeToTS<M[K]['columns'][C]>;
} & {
  [C in OptionalColumnKeys<M, K, FS>]?: ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
} & (
  M[K] extends { relations: infer R }
    ? {
        [RName in keyof R & keyof FS as
          R[RName] extends { type: 'hasMany' } ? RName : never
        ]:
          R[RName] extends { target: infer Target extends keyof M }
            ? FS[RName] extends true
              ? Array<DeepExpand<Selection<M, Target, {}>>>
              : FS[RName] extends Record<string, any>
                ? Array<DeepExpand<Selection<M, Target, FS[RName]>>>
                : never
            : never;
      } & {
        [RName in keyof R & keyof FS as
          R[RName] extends { type: 'hasOne' | 'references' } ? RName : never
        ]?:
          R[RName] extends { target: infer Target extends keyof M }
            ? FS[RName] extends true
              ? DeepExpand<Selection<M, Target, {}>> | null
              : FS[RName] extends Record<string, any>
                ? DeepExpand<Selection<M, Target, FS[RName]>> | null
                : never
            : never;
      }
    : {}
) & CustomSelectorProperties<M, K, FS>;

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
    ...args: [...PrimaryKeyArgs<M, K>, strategy: strategy]
  ): Promise<DeepExpand<Selection<M, K, strategy>>>;

  getById(
    ...args: [...PrimaryKeyArgs<M, K>]
  ): Promise<DeepExpand<Selection<M, K, {}>>>;

};

export type DBClient<M extends Record<string, TableDefinition<M>>> = {
  [TableName in keyof M]: RootTableRefs<M, TableName> & TableClient<M, TableName>;
} & {
  filter: BooleanFilterType;
  and(f: BooleanFilterType | RawFilter[], ...filters: RawFilter[]): BooleanFilterType;
  or(f: BooleanFilterType | RawFilter[], ...filters: RawFilter[]): BooleanFilterType;
  not(): BooleanFilterType;
};

export function db<M extends Record<string, TableDefinition<M>>>(): DBClient<M>;

export type DeepExpand<T> =
  T extends Array<infer U>
    ? Array<DeepExpand<U>>
    : T extends object
      ? { [K in keyof T]: DeepExpand<T[K]> }
      : T;