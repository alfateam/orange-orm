//map2.d.ts
export type ORMColumnType = 'string' | 'bigint' | 'uuid' | 'date' | 'numeric' | 'boolean' | 'json' | 'binary';

type NormalizeColumn<T> =
  T extends ORMColumnType ? { type: T; notNull?: false } :
  T extends { type: ORMColumnType } ? T :
  T extends { type: 'json'; tsType: any } ? T :
  never;



type IsRequired<CT> = CT extends { notNull: true } ? true : false;


type ColumnTypeToTS<CT> =
  NormalizeColumn<CT>['type'] extends 'numeric' ? number :
  NormalizeColumn<CT>['type'] extends 'boolean' ? boolean :
  NormalizeColumn<CT>['type'] extends 'json'
    ? CT extends { type: 'json'; tsType: infer T } ? T : any :
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
  and(other: RawFilter | RawFilter[], ...filters: RawFilter[]): BooleanFilterType;
  or(other: RawFilter | RawFilter[], ...filters: RawFilter[]): BooleanFilterType;
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
  where?: ((row: RootTableRefs<M, K>) => RawFilter | Array<PrimaryKeyObject<M, K>>) ;

};

export type PrimaryKeyObject<M extends Record<string, TableDefinition<M>>, K extends keyof M> =
  M[K]['primaryKey'] extends readonly (infer Keys extends keyof M[K]['columns'])[]
    ? { [PK in Keys]: ColumnTypeToTS<M[K]['columns'][PK]> }
    : never;


// Column selection properties
type ColumnSelection<M extends Record<string, TableDefinition<M>>, K extends keyof M> =
  Partial<Record<keyof M[K]['columns'], boolean>>;

// Relation selection properties (excluding reserved names)
type RelationSelection<M extends Record<string, TableDefinition<M>>, K extends keyof M> =
  M[K] extends { relations: infer R }
    ? {
        [RName in keyof R as RName extends ReservedFetchStrategyProps ? never : RName]?:
  R[RName] extends { target: infer T }
    ? T extends keyof M
      ? true | false | FetchStrategy<M, T>
      : never
    : never;

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

// Column selection refs without filter methods - only for getting values/references
type ColumnSelectionRefs<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
  [C in keyof M[K]['columns']]: ColumnTypeToTS<M[K]['columns'][C]>;
};

// Relation selection refs without filter methods - supports deep nesting
// In selectors, all relation types just provide access to the target table structure
// But WITHOUT aggregate functions (only available at root level)
type RelationSelectionRefs<M extends Record<string, TableDefinition<M>>, K extends keyof M> =
  M[K] extends { relations: infer R }
    ? {
        [RName in keyof R]: R[RName] extends RelationDefinition<M>
          ? R[RName]['type'] extends 'hasMany' | 'hasOne' | 'references'
            ? SelectionRefsWithoutAggregates<M, R[RName]['target']> // Use version without aggregates
            : never
          : never;
      }
    : {};

// Selection refs without aggregate functions (for use inside aggregate function selectors)
type SelectionRefsWithoutAggregates<M extends Record<string, TableDefinition<M>>, Target extends keyof M> =
  ColumnSelectionRefs<M, Target> & RelationSelectionRefs<M, Target>;

// Aggregate function types that work with numeric columns
type AggregateFunctions<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
  count(selector: (row: SelectionRefsWithoutAggregates<M, K>) => NumericColumnValue<M, K>): number;
  avg(selector: (row: SelectionRefsWithoutAggregates<M, K>) => NumericColumnValue<M, K>): number;
  sum(selector: (row: SelectionRefsWithoutAggregates<M, K>) => NumericColumnValue<M, K>): number;
  max(selector: (row: SelectionRefsWithoutAggregates<M, K>) => NumericColumnValue<M, K>): number;
  min(selector: (row: SelectionRefsWithoutAggregates<M, K>) => NumericColumnValue<M, K>): number;
};

// Helper type to extract numeric column values from the schema
type NumericColumnValue<M extends Record<string, TableDefinition<M>>, K extends keyof M> =
  // Direct numeric columns
  {
    [C in keyof M[K]['columns']]: NormalizeColumn<M[K]['columns'][C]>['type'] extends 'numeric'
      ? ColumnTypeToTS<M[K]['columns'][C]>
      : never;
  }[keyof M[K]['columns']] |
  // Numeric columns from related tables
  (M[K] extends { relations: infer R }
    ? {
        [RName in keyof R]: R[RName] extends { target: infer Target extends keyof M }
          ? {
              [C in keyof M[Target]['columns']]: NormalizeColumn<M[Target]['columns'][C]>['type'] extends 'numeric'
                ? ColumnTypeToTS<M[Target]['columns'][C]>
                : never;
            }[keyof M[Target]['columns']]
          : never;
      }[keyof R]
    : never);

// Root selection refs for custom selectors (no filter methods) - supports deep nesting + aggregates
type RootSelectionRefs<M extends Record<string, TableDefinition<M>>, Target extends keyof M> =
  ColumnSelectionRefs<M, Target> & RelationSelectionRefs<M, Target> & AggregateFunctions<M, Target>;

// Valid return types for custom selectors - now supports deep paths through any relation type
type ValidSelectorReturnTypes<M extends Record<string, TableDefinition<M>>, K extends keyof M> =
  // Direct column types
  ColumnTypeToTS<M[K]['columns'][keyof M[K]['columns']]> |
  // Related table column types (any depth, any relation type)
  (M extends Record<string, TableDefinition<M>>
    ? {
        [TableKey in keyof M]: ColumnTypeToTS<M[TableKey]['columns'][keyof M[TableKey]['columns']]>
      }[keyof M]
    : never);

// Custom selector functions - allows arbitrary property names with selector functions
// Uses RootSelectionRefs which supports deep nesting without filter methods
type CustomSelectors<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
  [key: string]: (row: RootSelectionRefs<M, K>) => ValidSelectorReturnTypes<M, K>;
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

// Helper type to check if a value is actually a column reference from the row object
// This is a bit of a hack - we check if the type has the structure of a ColumnFilterType
// but without the filter methods (which is what ColumnSelectionRefs provides)
type IsActualColumnReference<T, M extends Record<string, TableDefinition<M>>, K extends keyof M> =
  T extends ColumnTypeToTS<infer CT>
    ? CT extends ORMColumnType | { type: ORMColumnType; notNull?: boolean } | { type: 'json'; tsType: any }
      ? true
      : false
    : false;

// Alternative approach: Check if the type matches what we'd get from accessing ColumnSelectionRefs
type IsFromColumnSelectionRefs<M extends Record<string, TableDefinition<M>>, K extends keyof M, T = any> =
  T extends ColumnSelectionRefs<M, K>[keyof ColumnSelectionRefs<M, K>] ? true :
  T extends (M[K] extends { relations: infer R }
    ? {
        [RName in keyof R]: R[RName] extends { target: infer Target extends keyof M }
          ? ColumnSelectionRefs<M, Target>[keyof ColumnSelectionRefs<M, Target>]
          : never;
      }[keyof R]
    : never) ? true :
  T extends number ? true : // Allow aggregate function return type (number)
  false;

// Helper type to infer the TypeScript type from selector return values
// Only allows types that come from actual column selections or aggregate functions
type InferSelectorReturnType<T, M extends Record<string, TableDefinition<M>>, K extends keyof M> =
  IsFromColumnSelectionRefs<M, K, T> extends true ? T : never;

// Helper type to extract custom selector properties and their return types
// Aggregate functions return required numbers, column selections remain optional
type CustomSelectorProperties<M extends Record<string, TableDefinition<M>>, K extends keyof M, FS extends Record<string, any>> = {
  [P in keyof FS as
    P extends keyof M[K]['columns'] ? never :
    P extends ReservedFetchStrategyProps ? never :
    P extends (M[K] extends { relations: infer R } ? keyof R : never) ? never :
    FS[P] extends (row: any) => any ?
      (InferSelectorReturnType<FS[P] extends (row: RootSelectionRefs<M, K>) => infer ReturnType ? ReturnType : never, M, K> extends never ? never : P)
      : never
  ]: FS[P] extends (row: RootSelectionRefs<M, K>) => infer ReturnType
      ? ReturnType extends number
        ? number  // Aggregate functions return required number
        : InferSelectorReturnType<ReturnType, M, K> | null | undefined  // Column selections remain optional
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
  getMany(filter: RawFilter | Array<PrimaryKeyObject<M, K>>): Promise<Array<DeepExpand<Selection<M, K, {}>>>>;
  getMany<strategy extends FetchStrategy<M, K>>(filter: RawFilter | Array<PrimaryKeyObject<M, K>>, strategy: strategy): Promise<Array<DeepExpand<Selection<M, K, strategy>>>>;



  getOne<strategy extends FetchStrategy<M, K>>(
    filter: RawFilter | Array<PrimaryKeyObject<M, K>>
  ): Promise<DeepExpand<Selection<M, K, strategy>>>;

  getOne<strategy extends FetchStrategy<M, K>>(
      filter: RawFilter | Array<PrimaryKeyObject<M, K>>,
      strategy: strategy
  ): Promise<DeepExpand<Selection<M, K, strategy>>>;

  getById<strategy extends FetchStrategy<M, K>>(
    ...args: [...PrimaryKeyArgs<M, K>, strategy: strategy]
  ): Promise<DeepExpand<Selection<M, K, strategy>>>;

  getById(
    ...args: [...PrimaryKeyArgs<M, K>]
  ): Promise<DeepExpand<Selection<M, K, {}>>>;

  update(
  row: Partial<{
    [C in keyof M[K]['columns']]: IsRequired<M[K]['columns'][C]> extends true
      ? ColumnTypeToTS<M[K]['columns'][C]>
      : ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
  }>,
  opts: { where: (row: RootTableRefs<M, K>) => RawFilter }
): Promise<void>;

update<strategy extends FetchStrategy<M, K>>(
  row: Partial<{
    [C in keyof M[K]['columns']]: IsRequired<M[K]['columns'][C]> extends true
      ? ColumnTypeToTS<M[K]['columns'][C]>
      : ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
  }>,
  opts: { where: (row: RootTableRefs<M, K>) => RawFilter },
  strategy: strategy
): Promise<Array<DeepExpand<Selection<M, K, strategy>>>>;

replace(
  row: Array<{
    [C in keyof M[K]['columns']]?: IsRequired<M[K]['columns'][C]> extends true
      ? ColumnTypeToTS<M[K]['columns'][C]>
      : ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
  } | {
    [C in keyof M[K]['columns']]?: IsRequired<M[K]['columns'][C]> extends true
      ? ColumnTypeToTS<M[K]['columns'][C]>
      : ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
  }>,
): Promise<void>;

replace<strategy extends FetchStrategy<M, K>>(
  row: {
    [C in keyof M[K]['columns']]?: IsRequired<M[K]['columns'][C]> extends true
      ? ColumnTypeToTS<M[K]['columns'][C]>
      : ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
  },
  strategy: strategy
): Promise<DeepExpand<Selection<M, K, strategy>>>;

replace<strategy extends FetchStrategy<M, K>>(
  rows: Array<{
    [C in keyof M[K]['columns']]?: IsRequired<M[K]['columns'][C]> extends true
      ? ColumnTypeToTS<M[K]['columns'][C]>
      : ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
  }>,
  strategy: strategy
): Promise<Array<DeepExpand<Selection<M, K, strategy>>>>;

updateChanges(
  row: {
    [C in keyof M[K]['columns']]?: IsRequired<M[K]['columns'][C]> extends true
      ? ColumnTypeToTS<M[K]['columns'][C]>
      : ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
  },
  originalRow: {
    [C in keyof M[K]['columns']]?: IsRequired<M[K]['columns'][C]> extends true
      ? ColumnTypeToTS<M[K]['columns'][C]>
      : ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
  }
): Promise<void>;

updateChanges(
  rows: Array<{
    [C in keyof M[K]['columns']]?: IsRequired<M[K]['columns'][C]> extends true
      ? ColumnTypeToTS<M[K]['columns'][C]>
      : ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
  }>,
  originalRows: Array<{
    [C in keyof M[K]['columns']]?: IsRequired<M[K]['columns'][C]> extends true
      ? ColumnTypeToTS<M[K]['columns'][C]>
      : ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
  }>
): Promise<void>;

updateChanges<strategy extends FetchStrategy<M, K>>(
  row: {
    [C in keyof M[K]['columns']]?: IsRequired<M[K]['columns'][C]> extends true
      ? ColumnTypeToTS<M[K]['columns'][C]>
      : ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
  },
  originalRow: {
    [C in keyof M[K]['columns']]?: IsRequired<M[K]['columns'][C]> extends true
      ? ColumnTypeToTS<M[K]['columns'][C]>
      : ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
  },
  strategy: strategy
): Promise<DeepExpand<Selection<M, K, strategy>>>;

updateChanges<strategy extends FetchStrategy<M, K>>(
  rows: Array<{
    [C in keyof M[K]['columns']]?: IsRequired<M[K]['columns'][C]> extends true
      ? ColumnTypeToTS<M[K]['columns'][C]>
      : ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
  }>,
  originalRows: Array<{
    [C in keyof M[K]['columns']]?: IsRequired<M[K]['columns'][C]> extends true
      ? ColumnTypeToTS<M[K]['columns'][C]>
      : ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
  }>,
  strategy: strategy
): Promise<Array<DeepExpand<Selection<M, K, strategy>>>>;


//todo
insertAndForget(
  row: {
    [C in keyof M[K]['columns']]?: IsRequired<M[K]['columns'][C]> extends true
      ? ColumnTypeToTS<M[K]['columns'][C]>
      : ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
  }
): Promise<void>;

insertAndForget(
  rows: Array<{
    [C in keyof M[K]['columns']]?: IsRequired<M[K]['columns'][C]> extends true
      ? ColumnTypeToTS<M[K]['columns'][C]>
      : ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
  }>
): Promise<void>;

insert(
  row: {
    [C in keyof M[K]['columns']]?: IsRequired<M[K]['columns'][C]> extends true
      ? ColumnTypeToTS<M[K]['columns'][C]>
      : ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
  }
): Promise<DeepExpand<Selection<M, K, {}>>>;

insert(
  rows: Array<{
    [C in keyof M[K]['columns']]?: IsRequired<M[K]['columns'][C]> extends true
      ? ColumnTypeToTS<M[K]['columns'][C]>
      : ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
  }>
): Promise<Array<DeepExpand<Selection<M, K, {}>>>>;

insert<strategy extends FetchStrategy<M, K>>(
  row: {
    [C in keyof M[K]['columns']]?: IsRequired<M[K]['columns'][C]> extends true
      ? ColumnTypeToTS<M[K]['columns'][C]>
      : ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
  },
  strategy: strategy
): Promise<DeepExpand<Selection<M, K, strategy>>>;

insert<strategy extends FetchStrategy<M, K>>(
  rows: Array<{
    [C in keyof M[K]['columns']]?: IsRequired<M[K]['columns'][C]> extends true
      ? ColumnTypeToTS<M[K]['columns'][C]>
      : ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
  }>,
  strategy: strategy
): Promise<Array<DeepExpand<Selection<M, K, strategy>>>>;


};

export type ConcurrencyStrategy = 'optimistic' | 'overwrite' | 'skipOnConflict';

export type ConcurrencyConfig<M extends Record<string, TableDefinition<M>>> = {
  [K in keyof M]?: {
    concurrency?: ConcurrencyStrategy;
    readonly?: boolean;
  } & {
    [C in keyof M[K]['columns']]?: {
      concurrency: ConcurrencyStrategy;
    };
  } & (
    M[K] extends { relations: infer R }
      ? {
          [RName in keyof R]?: ConcurrencyConfig<M>[R[RName] extends { target: infer T extends keyof M } ? T : never];
        }
      : {}
  );
};


export type DBClient<M extends Record<string, TableDefinition<M>>> = {
  [TableName in keyof M]: RootTableRefs<M, TableName> & TableClient<M, TableName>;
} & {
  filter: BooleanFilterType;
  and(f: BooleanFilterType | RawFilter[], ...filters: BooleanFilterType[]): BooleanFilterType;
  or(f: BooleanFilterType | RawFilter[], ...filters: BooleanFilterType[]): BooleanFilterType;
  not(): BooleanFilterType;
} & {
  (
    config?: ConcurrencyConfig<M>
  ): DBClient<M>;
};


export type DeepExpand<T> =
T extends Date ? T :
T extends Array<infer U> ? Array<DeepExpand<U>> :
T extends object ? { [K in keyof T]: DeepExpand<T[K]> } :
T;

export function db<M extends Record<string, TableDefinition<M>>>(): DBClient<M>;