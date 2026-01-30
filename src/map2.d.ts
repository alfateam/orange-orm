//map2.d.ts - Extended Row Types with Relations Support
import type { PGliteOptions } from './pglite.d.ts';
import type { ConnectionConfiguration } from 'tedious';
import type { D1Database } from '@cloudflare/workers-types';
import type { PoolAttributes } from 'oracledb';
import type { AxiosInterceptorManager, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

export type ORMColumnType = 'string' | 'bigint' | 'uuid' | 'date' | 'numeric' | 'boolean' | 'json' | 'binary';

// Base column definition with space-prefixed required properties
export type ORMColumnDefinition = {
  ' type': ORMColumnType;
  ' notNull'?: boolean;
  ' notNullExceptInsert'?: boolean;
};

// JSON column definition with custom TypeScript type
export type ORMJsonColumnDefinition<T = any> = {
  ' type': 'json';
  ' tsType': T;
  ' notNull'?: boolean;
  ' notNullExceptInsert'?: boolean;
};

type NormalizeColumn<T> =
  T extends ORMColumnType
  ? { ' type': T; ' notNull'?: boolean; ' notNullExceptInsert'?: boolean }
  : T extends { ' type': ORMColumnType }
  ? { ' notNull'?: boolean; ' notNullExceptInsert'?: boolean } & T
  : T extends { ' type': 'json'; ' tsType': any }
  ? { ' notNull'?: boolean; ' notNullExceptInsert'?: boolean } & T
  : never;

type IsRequired<CT> = CT extends { ' notNull': true } ? true : false;

type IsRequiredInsert<CT> =
  NormalizeColumn<CT>[' notNullExceptInsert'] extends true
  ? false  // If notNullExceptInsert is true, then it's NOT required for insert
  : NormalizeColumn<CT>[' notNull'] extends true
  ? true   // If notNull is true (and notNullExceptInsert is not true), then it IS required for insert
  : false; // Otherwise, it's optional

type ColumnTypeToTS<CT> =
  NormalizeColumn<CT>[' type'] extends 'numeric' ? number :
  NormalizeColumn<CT>[' type'] extends 'boolean' ? boolean :
  NormalizeColumn<CT>[' type'] extends 'json'
  ? CT extends { ' type': 'json'; ' tsType': infer T } ? T : any :
  NormalizeColumn<CT>[' type'] extends 'date' ? (string | Date) :
  string;

export type RelationType = 'hasMany' | 'hasOne' | 'references';

export type RelationDefinition<Tables extends Record<string, any>> = {
  type: RelationType;
  target: keyof Tables;
};

export type TableDefinition<Tables extends Record<string, any>> = {
  columns: Record<string, ORMColumnDefinition | ORMJsonColumnDefinition>;
  primaryKey: readonly (keyof any)[];
  relations?: Record<string, RelationDefinition<Tables>>;
};

export interface RawFilter {
  sql: string | (() => string);
  parameters?: any[];
}

export interface Filter extends RawFilter {
  and(other: RawFilter | RawFilter[], ...filters: RawFilter[]): Filter;
  or(other: RawFilter | RawFilter[], ...filters: RawFilter[]): Filter;
  not(): Filter;
}

type StringOnlyMethods = {
  startsWith(value: string | null | undefined): Filter;
  iStartsWith(value: string | null | undefined): Filter;
  endsWith(value: string | null | undefined): Filter;
  iEndsWith(value: string | null | undefined): Filter;
  contains(value: string | null | undefined): Filter;
  iContains(value: string | null | undefined): Filter;
  iEqual(value: string | null | undefined): Filter;
  ieq(value: string | null | undefined): Filter;
};

export type ColumnFilterType<Val, ColumnType = any> = {
  equal(value: Val | null | undefined): Filter;
  eq(value: Val | null | undefined): Filter;
  notEqual(value: Val | null | undefined): Filter;
  ne(value: Val | null | undefined): Filter;
  lessThan(value: Val | null | undefined): Filter;
  lt(value: Val | null | undefined): Filter;
  lessThanOrEqual(value: Val | null | undefined): Filter;
  le(value: Val | null | undefined): Filter;
  greaterThan(value: Val | null | undefined): Filter;
  gt(value: Val | null | undefined): Filter;
  greaterThanOrEqual(value: Val | null | undefined): Filter;
  ge(value: Val | null | undefined): Filter;
  in(values: (Val | null | undefined)[]): Filter;
  between(from: Val | null | undefined, to: Val | null | undefined): Filter;
  notIn(values: (Val | null | undefined)[]): Filter;
} & (ColumnType extends 'string' ? StringOnlyMethods : {});

export type JsonArray = Array<JsonValue>;
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = string | number | boolean | null | JsonArray | JsonObject;

export type ColumnRefs<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
  [C in keyof M[K]['columns']]: ColumnFilterType<
    ColumnTypeToTS<M[K]['columns'][C]>,
    NormalizeColumn<M[K]['columns'][C]>[' type']
  >;
};

export type RootTableRefs<M extends Record<string, TableDefinition<M>>, Target extends keyof M> =
  ColumnRefs<M, Target> & RelationRefs<M, Target>;

export type RelationTableRefs<M extends Record<string, TableDefinition<M>>, Target extends keyof M> =
  ColumnRefs<M, Target> & RelationRefs<M, Target> & {
    exists(): Filter;
  };

export type HasManyRelationFilter<M extends Record<string, TableDefinition<M>>, Target extends keyof M> = {
  any(predicate: (row: RelationTableRefs<M, Target>) => Filter): Filter;
  all(predicate: (row: RelationTableRefs<M, Target>) => Filter): Filter;
  none(predicate: (row: RelationTableRefs<M, Target>) => Filter): Filter;
  exists(): Filter;
};

export type FilterableSingleRelation<M extends Record<string, TableDefinition<M>>, Target extends keyof M> =
  RelationTableRefs<M, Target> & {
    (predicate: (row: RelationTableRefs<M, Target>) => Filter): Filter;
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

export type OrderBy<M extends Record<string, TableDefinition<M>>, K extends keyof M> =
  | `${Extract<keyof M[K]['columns'], string>}`
  | `${Extract<keyof M[K]['columns'], string>} asc`
  | `${Extract<keyof M[K]['columns'], string>} desc`
  | Array<
      | `${Extract<keyof M[K]['columns'], string>}`
      | `${Extract<keyof M[K]['columns'], string>} asc`
      | `${Extract<keyof M[K]['columns'], string>} desc`
    >;

// Reserved property names that should not conflict with relation selectors
type ReservedFetchStrategyProps = 'orderBy' | 'where';

// Base fetch strategy properties (reserved props)
type BaseFetchStrategy<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
  orderBy?: OrderBy<M, K>;
  limit?: number;
  offset?: number;
  where?: WhereFunc<M, K>;
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
  [C in keyof M[K]['columns']]: M[K]['columns'][C];
};


// type ColumnSelectionRefs<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
//   // Required columns (notNull = true)
//   [C in keyof M[K]['columns'] as IsRequired<M[K]['columns'][C]> extends true ? C : never]: ColumnTypeToTS<M[K]['columns'][C]>;
// } & {
//   // Optional columns (nullable)
//   [C in keyof M[K]['columns'] as IsRequired<M[K]['columns'][C]> extends true ? never : C]?: ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
// };

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

// Base aggregate function type
type BaseAggregateFunction = {
  __aggregateFunction: true;
  __functionType?: 'count' | 'sum' | 'avg' | 'max' | 'min';
};

// Standard aggregate function for count, sum, avg
type AggregateFunction = BaseAggregateFunction & {
  returnType: 'numeric';
  __functionType?: 'count' | 'sum' | 'avg';
};

// Special type for max/min that preserves the column type
type AggregateMinMaxFunction<T> = BaseAggregateFunction & {
  returnType: T;
  __functionType: 'max' | 'min';
};

// Update AggregateFunctions to include the function type and proper return types
type AggregateFunctions<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
  count(selector: (row: SelectionRefsWithoutAggregates<M, K>) => AnyColumnDefinition<M, K>): AggregateFunction & { __functionType: 'count' };
  avg(selector: (row: SelectionRefsWithoutAggregates<M, K>) => NumericColumnDefinition<M, K>): AggregateFunction & { __functionType: 'avg' };
  sum(selector: (row: SelectionRefsWithoutAggregates<M, K>) => NumericColumnDefinition<M, K>): AggregateFunction & { __functionType: 'sum' };
  max<T extends AnyColumnDefinition<M, K>>(selector: (row: SelectionRefsWithoutAggregates<M, K>) => T): AggregateMinMaxFunction<T> & { __functionType: 'max' };
  min<T extends AnyColumnDefinition<M, K>>(selector: (row: SelectionRefsWithoutAggregates<M, K>) => T): AggregateMinMaxFunction<T> & { __functionType: 'min' };
};

// NEW ── any column, any table (local or related)
type AnyColumnDefinition<
  M extends Record<string, TableDefinition<M>>,
  K extends keyof M
> =
  // columns on the current table
  M[K]['columns'][keyof M[K]['columns']] |
  // columns on related tables
  (M[K] extends { relations: infer R }
    ? {
      [RName in keyof R]: R[RName] extends { target: infer Target extends keyof M }
      ? M[Target]['columns'][keyof M[Target]['columns']]
      : never;
    }[keyof R]
    : never);

// CHANGE from NumericColumnValue to NumericColumnDefinition:
type NumericColumnDefinition<M extends Record<string, TableDefinition<M>>, K extends keyof M> =
  // Direct numeric columns
  {
    [C in keyof M[K]['columns']]: NormalizeColumn<M[K]['columns'][C]>[' type'] extends 'numeric'
    ? M[K]['columns'][C]  // Return column definition, not TS type
    : never;
  }[keyof M[K]['columns']] |
  // Numeric columns from related tables
  (M[K] extends { relations: infer R }
    ? {
      [RName in keyof R]: R[RName] extends { target: infer Target extends keyof M }
      ? {
        [C in keyof M[Target]['columns']]: NormalizeColumn<M[Target]['columns'][C]>[' type'] extends 'numeric'
        ? M[Target]['columns'][C]  // Return column definition, not TS type
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
  // Column definitions from any table
  (M extends Record<string, TableDefinition<M>>
    ? {
      [TableKey in keyof M]: M[TableKey]['columns'][keyof M[TableKey]['columns']]
    }[keyof M]
    : never) |
  // Base aggregate function marker (covers both regular and min/max)
  BaseAggregateFunction;

// ADD helper to convert column definition to TypeScript type:
type ColumnDefinitionToTS<CD> = CD extends ORMColumnDefinition | ORMJsonColumnDefinition
  ? ColumnTypeToTS<CD>
  : never;

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

export type AggregateStrategy<M extends Record<string, TableDefinition<M>>, K extends keyof M> =
  BaseAggregateStrategy<M, K>
  | CustomAggregateSelectors<M, K>;

type WhereFunc<M extends Record<string, TableDefinition<M>>, K extends keyof M> = (row: RootTableRefs<M, K>) => RawFilter | Array<PrimaryKeyObject<M, K>>;

type BaseAggregateStrategy<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
  limit?: number;
  offset?: number;
  where?: WhereFunc<M, K>;
};

type CustomAggregateSelectors<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
  [key: string]: (row: RootSelectionRefs<M, K>) => ValidSelectorReturnTypes<M, K>;
} & {
  where?: WhereFunc<M, K>;
} & {
  // Explicitly prevent limit/offset in selectors
  limit?: never;
  offset?: never;
};

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

type IsActualColumnReference<T, M extends Record<string, TableDefinition<M>>, K extends keyof M> =
  T extends ColumnTypeToTS<infer CT>
  ? CT extends ORMColumnDefinition | ORMJsonColumnDefinition
  ? true
  : false
  : false;

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

type InferSelectorReturnType<T, M extends Record<string, TableDefinition<M>>, K extends keyof M> =
  IsFromColumnSelectionRefs<M, K, T> extends true ? T : never;

type IsAggregateFunction<T> = T extends BaseAggregateFunction ? true : false;

type IsRequiredAggregate<T> = T extends BaseAggregateFunction & { __functionType: infer FType }
  ? FType extends 'count' | 'sum' | 'avg' ? true : false
  : false;

type IsMinMaxAggregate<T> = T extends AggregateMinMaxFunction<any> & { __functionType: infer FType }
  ? FType extends 'max' | 'min' ? true : false
  : false;

type ExtractMinMaxColumnType<T> = T extends AggregateMinMaxFunction<infer ColType>
  ? ColumnDefinitionToTS<ColType>
  : never;

// Updated CustomSelectorProperties with conditional nullability
type CustomSelectorProperties<M extends Record<string, TableDefinition<M>>, K extends keyof M, FS extends Record<string, any>> = {
  // Required properties (count, sum, avg) - no question mark, no null/undefined
  [P in keyof FS as
    P extends keyof M[K]['columns'] ? never :
    P extends ReservedFetchStrategyProps ? never :
    P extends (M[K] extends { relations: infer R } ? keyof R : never) ? never :
    FS[P] extends (row: any) => any ?
      (FS[P] extends (row: RootSelectionRefs<M, K>) => infer ReturnType
        ? IsRequiredAggregate<ReturnType> extends true
          ? P  // Required aggregates
          : never
        : never)
      : never
  ]: FS[P] extends (row: RootSelectionRefs<M, K>) => infer ReturnType
      ? number  // Required aggregate functions (count, sum, avg) return required number
      : never;
} & {
  // Optional properties (max, min, plain columns) - with question mark AND null/undefined
  [P in keyof FS as
    P extends keyof M[K]['columns'] ? never :
    P extends ReservedFetchStrategyProps ? never :
    P extends (M[K] extends { relations: infer R } ? keyof R : never) ? never :
    FS[P] extends (row: any) => any ?
      (FS[P] extends (row: RootSelectionRefs<M, K>) => infer ReturnType
        ? IsRequiredAggregate<ReturnType> extends true
          ? never  // Required aggregates are not optional
          : P  // Everything else is optional
        : never)
      : never
  ]?: FS[P] extends (row: RootSelectionRefs<M, K>) => infer ReturnType
        ? IsMinMaxAggregate<ReturnType> extends true
          ? ExtractMinMaxColumnType<ReturnType> | null | undefined
          : IsAggregateFunction<ReturnType> extends true
            ? number | null | undefined
            : ReturnType extends ORMColumnDefinition | ORMJsonColumnDefinition
              ? ColumnDefinitionToTS<ReturnType> | null | undefined
              : never
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

// Helper type to get primary key columns that are required (notNull)
type RequiredPrimaryKeyColumns<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
  [PK in M[K]['primaryKey'][number]]: PK extends keyof M[K]['columns']
    ? IsRequired<M[K]['columns'][PK]> extends true
      ? PK
      : never
    : never;
}[M[K]['primaryKey'][number]];

// Helper type to get primary key columns that are optional (nullable)
type OptionalPrimaryKeyColumns<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
  [PK in M[K]['primaryKey'][number]]: PK extends keyof M[K]['columns']
    ? IsRequired<M[K]['columns'][PK]> extends true
      ? never
      : PK
    : never;
}[M[K]['primaryKey'][number]];

// Type for insert operations - requires notNull columns but allows notNullExceptInsert to be optional
type InsertRow<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
  // Required columns (notNull but not notNullExceptInsert)
  [C in keyof M[K]['columns'] as IsRequiredInsert<M[K]['columns'][C]> extends true ? C : never]: ColumnTypeToTS<M[K]['columns'][C]>;
} & {
  // Optional columns (nullable, or notNullExceptInsert)
  [C in keyof M[K]['columns'] as IsRequiredInsert<M[K]['columns'][C]> extends true ? never : C]?: ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
};

// Type for updateChanges and replace operations
type UpdateChangesRow<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
  // Required primary key columns
  [C in RequiredPrimaryKeyColumns<M, K>]: ColumnTypeToTS<M[K]['columns'][C]>;
} & {
  // Optional primary key columns
  [C in OptionalPrimaryKeyColumns<M, K>]?: ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
} & {
  // All other columns are optional
  [C in Exclude<keyof M[K]['columns'], M[K]['primaryKey'][number]>]?: IsRequired<M[K]['columns'][C]> extends true
    ? ColumnTypeToTS<M[K]['columns'][C]>
    : ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
};

// NEW: Extended row types with relations support

// Type for relation rows - only respects notNull, ignores notNullExceptInsert
type RelationRow<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
  // Required columns (notNull = true, ignoring notNullExceptInsert)
  [C in keyof M[K]['columns'] as IsRequired<M[K]['columns'][C]> extends true ? C : never]: ColumnTypeToTS<M[K]['columns'][C]>;
} & {
  // Optional columns (all others)
  [C in keyof M[K]['columns'] as IsRequired<M[K]['columns'][C]> extends true ? never : C]?: ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
};

// Helper type to create relation data for insert/update operations
type RelationData<M extends Record<string, TableDefinition<M>>, K extends keyof M> =
  M[K] extends { relations: infer R }
  ? {
    [RName in keyof R]?: R[RName] extends RelationDefinition<M>
    ? R[RName]['type'] extends 'hasMany'
    ? R[RName]['target'] extends keyof M
    ? Array<RelationRowWithRelations<M, R[RName]['target']>>
    : never
    : R[RName]['type'] extends 'hasOne' | 'references'
    ? R[RName]['target'] extends keyof M
    ? RelationRowWithRelations<M, R[RName]['target']> | null
    : never
    : never
    : never;
  }
  : {};

// Relation row type with nested relations support
type RelationRowWithRelations<M extends Record<string, TableDefinition<M>>, K extends keyof M> = 
  RelationRow<M, K> & RelationData<M, K>;

// Extended insert row type with optional relations
type InsertRowWithRelations<M extends Record<string, TableDefinition<M>>, K extends keyof M> = 
  InsertRow<M, K> & RelationData<M, K>;

// Extended update/replace row type with optional relations
type UpdateChangesRowWithRelations<M extends Record<string, TableDefinition<M>>, K extends keyof M> = 
  UpdateChangesRow<M, K> & RelationData<M, K>;

// Extended type for bulk update operations with optional relations
type UpdateRowWithRelations<M extends Record<string, TableDefinition<M>>, K extends keyof M> = 
  Partial<{
    [C in keyof M[K]['columns']]: IsRequired<M[K]['columns'][C]> extends true
    ? ColumnTypeToTS<M[K]['columns'][C]>
    : ColumnTypeToTS<M[K]['columns'][C]> | null | undefined;
  }> & RelationData<M, K>;

// REFACTORED: Separate Active Record Methods for Individual Rows vs Arrays

// Active record methods for individual rows
type ActiveRecordMethods<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
  saveChanges(): Promise<void>;
  saveChanges(concurrency: ConcurrencyConfig<M>[K]): Promise<void>;
  acceptChanges(): void;
  clearChanges(): void;
  refresh(): Promise<void>;
  refresh<strategy extends FetchStrategy<M, K>>(strategy: strategy): Promise<DeepExpand<Selection<M, K, strategy>> & ActiveRecordMethods<M, K>>;
  delete(): Promise<void>;
  delete<strategy extends FetchStrategy<M, K>>(strategy: strategy): Promise<void>;
};

// Active record methods for arrays of rows
type ArrayActiveRecordMethods<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
  saveChanges(): Promise<void>;
  saveChanges(concurrency: ConcurrencyConfig<M>[K]): Promise<void>;
  acceptChanges(): void;
  clearChanges(): void;
  refresh(): Promise<void>;
  refresh<strategy extends FetchStrategy<M, K>>(strategy: strategy): Promise<Array<DeepExpand<Selection<M, K, strategy>>>>;
  delete(): Promise<void>;
  delete<strategy extends FetchStrategy<M, K>>(strategy: strategy): Promise<void>;
};

// Helper type to add individual active record methods to selection results
type WithActiveRecord<T, M extends Record<string, TableDefinition<M>>, K extends keyof M> =
  T & ActiveRecordMethods<M, K>;

// Helper type to add array active record methods to arrays without adding them to individual items
type WithArrayActiveRecord<T extends Array<any>, M extends Record<string, TableDefinition<M>>, K extends keyof M> =
  T & ArrayActiveRecordMethods<M, K>;

// Separate CustomSelectorProperties for aggregate (allows column name overlap)
type AggregateCustomSelectorProperties<M extends Record<string, TableDefinition<M>>, K extends keyof M, FS extends Record<string, any>> = {
  // Required properties (count, sum, avg) - no question mark, no null/undefined
  [P in keyof FS as
    P extends ReservedFetchStrategyProps ? never :
    P extends (M[K] extends { relations: infer R } ? keyof R : never) ? never :
    FS[P] extends (row: any) => any ?
      (FS[P] extends (row: RootSelectionRefs<M, K>) => infer ReturnType
        ? IsRequiredAggregate<ReturnType> extends true
          ? P  // Required aggregates
          : never
        : never)
      : never
  ]: FS[P] extends (row: RootSelectionRefs<M, K>) => infer ReturnType
      ? number  // Required aggregate functions (count, sum, avg) return required number
      : never;
} & {
  // Optional properties (max, min, plain columns) - with question mark AND null/undefined
  [P in keyof FS as
    P extends ReservedFetchStrategyProps ? never :
    P extends (M[K] extends { relations: infer R } ? keyof R : never) ? never :
    FS[P] extends (row: any) => any ?
      (FS[P] extends (row: RootSelectionRefs<M, K>) => infer ReturnType
        ? IsRequiredAggregate<ReturnType> extends true
          ? never  // Required aggregates are not optional
          : P  // Everything else is optional
        : never)
      : never
  ]?: FS[P] extends (row: RootSelectionRefs<M, K>) => infer ReturnType
        ? IsMinMaxAggregate<ReturnType> extends true
          ? ExtractMinMaxColumnType<ReturnType> | null | undefined
          : IsAggregateFunction<ReturnType> extends true
            ? number | null | undefined
            : ReturnType extends ORMColumnDefinition | ORMJsonColumnDefinition
              ? ColumnDefinitionToTS<ReturnType> | null | undefined
              : never
        : never;
};

export type TableClient<M extends Record<string, TableDefinition<M>>, K extends keyof M> = {
  // Array methods - return arrays with array-level active record methods, but individual items are plain
  getAll(): Promise<WithArrayActiveRecord<Array<DeepExpand<Selection<M, K, {}>>>, M, K>>;
  getAll<strategy extends FetchStrategy<M, K>>(strategy: strategy): Promise<WithArrayActiveRecord<Array<DeepExpand<Selection<M, K, strategy>>>, M, K>>;
  getMany(filter?: RawFilter | Array<PrimaryKeyObject<M, K>>): Promise<WithArrayActiveRecord<Array<DeepExpand<Selection<M, K, {}>>>, M, K>>;
  getMany<strategy extends FetchStrategy<M, K>>(filter?: RawFilter | Array<PrimaryKeyObject<M, K>>, strategy?: strategy): Promise<WithArrayActiveRecord<Array<DeepExpand<Selection<M, K, strategy>>>, M, K>>;

  // Aggregate methods - return plain objects (no active record methods)
  aggregate<strategy extends AggregateStrategy<M, K>>(strategy: strategy): Promise<Array<DeepExpand<AggregateCustomSelectorProperties<M, K, strategy>>>>;

  // Single item methods - return individual objects with individual active record methods
  getOne<strategy extends FetchStrategy<M, K>>(
    filter?: RawFilter | Array<PrimaryKeyObject<M, K>>
  ): Promise<WithActiveRecord<DeepExpand<Selection<M, K, strategy>>, M, K>>;

  getOne<strategy extends FetchStrategy<M, K>>(
    filter?: RawFilter | Array<PrimaryKeyObject<M, K>>,
    strategy?: strategy
  ): Promise<WithActiveRecord<DeepExpand<Selection<M, K, strategy>>, M, K>>;

  getById<strategy extends FetchStrategy<M, K>>(
    ...args: [...PrimaryKeyArgs<M, K>, strategy: strategy]
  ): Promise<WithActiveRecord<DeepExpand<Selection<M, K, strategy>>, M, K>>;

  getById(
    ...args: [...PrimaryKeyArgs<M, K>]
  ): Promise<WithActiveRecord<DeepExpand<Selection<M, K, {}>>, M, K>>;

  // UPDATED: Bulk update methods with relations support
  update(
    row: UpdateRowWithRelations<M, K>,
    opts: { where: (row: RootTableRefs<M, K>) => RawFilter }
  ): Promise<void>;

  update<strategy extends FetchStrategy<M, K>>(
    row: UpdateRowWithRelations<M, K>,
    opts: { where: (row: RootTableRefs<M, K>) => RawFilter },
    strategy: strategy
  ): Promise<WithArrayActiveRecord<Array<DeepExpand<Selection<M, K, strategy>>>, M, K>>;

  // Count and delete methods (no active record methods needed)
  count(filter?: RawFilter | Array<PrimaryKeyObject<M, K>>,): Promise<number>;
  delete(filter?: RawFilter | Array<PrimaryKeyObject<M, K>>,): Promise<void>;
  deleteCascade(filter?: RawFilter | Array<PrimaryKeyObject<M, K>>,): Promise<void>;

  // UPDATED: Replace methods with relations support
  replace(
    row: Array<UpdateChangesRowWithRelations<M, K>>
  ): Promise<void>;

  replace<strategy extends FetchStrategy<M, K>>(
    row: UpdateChangesRowWithRelations<M, K>,
    strategy: strategy
  ): Promise<WithActiveRecord<DeepExpand<Selection<M, K, strategy>>, M, K>>;

  replace<strategy extends FetchStrategy<M, K>>(
    rows: Array<UpdateChangesRowWithRelations<M, K>>,
    strategy: strategy
  ): Promise<WithArrayActiveRecord<Array<DeepExpand<Selection<M, K, strategy>>>, M, K>>;

  // UPDATED: UpdateChanges methods with relations support
  updateChanges(
    row: UpdateChangesRowWithRelations<M, K>,
    originalRow: UpdateChangesRowWithRelations<M, K>
  ): Promise<WithActiveRecord<DeepExpand<Selection<M, K, {}>>, M, K>>;

  updateChanges(
    rows: Array<UpdateChangesRowWithRelations<M, K>>,
    originalRows: Array<UpdateChangesRowWithRelations<M, K>>
  ): Promise<WithArrayActiveRecord<Array<DeepExpand<Selection<M, K, {}>>>, M, K>>;

  updateChanges<strategy extends FetchStrategy<M, K>>(
    row: UpdateChangesRowWithRelations<M, K>,
    originalRow: UpdateChangesRowWithRelations<M, K>,
    strategy: strategy
  ): Promise<WithActiveRecord<DeepExpand<Selection<M, K, strategy>>, M, K>>;

  updateChanges<strategy extends FetchStrategy<M, K>>(
    rows: Array<UpdateChangesRowWithRelations<M, K>>,
    originalRows: Array<UpdateChangesRowWithRelations<M, K>>,
    strategy: strategy
  ): Promise<WithArrayActiveRecord<Array<DeepExpand<Selection<M, K, strategy>>>, M, K>>;

  // UPDATED: Insert methods with relations support - no active record methods for insertAndForget, appropriate methods for others
  insertAndForget(
    row: InsertRowWithRelations<M, K>
  ): Promise<void>;

  insertAndForget(
    rows: Array<InsertRowWithRelations<M, K>>
  ): Promise<void>;

  insert(
    row: InsertRowWithRelations<M, K>
  ): Promise<WithActiveRecord<DeepExpand<Selection<M, K, {}>>, M, K>>;

  insert(
    rows: Array<InsertRowWithRelations<M, K>>
  ): Promise<WithArrayActiveRecord<Array<DeepExpand<Selection<M, K, {}>>>, M, K>>;

  insert<strategy extends FetchStrategy<M, K>>(
    row: InsertRowWithRelations<M, K>,
    strategy: strategy
  ): Promise<WithActiveRecord<DeepExpand<Selection<M, K, strategy>>, M, K>>;

  insert<strategy extends FetchStrategy<M, K>>(
    rows: Array<InsertRowWithRelations<M, K>>,
    strategy: strategy
  ): Promise<WithArrayActiveRecord<Array<DeepExpand<Selection<M, K, strategy>>>, M, K>>;

  // UPDATED: Proxify methods with relations support
  proxify(
    row: UpdateChangesRowWithRelations<M, K>
  ): Promise<WithActiveRecord<DeepExpand<Selection<M, K, {}>>, M, K>>;

  proxify(
    rows: Array<UpdateChangesRowWithRelations<M, K>>
  ): Promise<WithArrayActiveRecord<Array<DeepExpand<Selection<M, K, {}>>>, M, K>>;

  proxify<strategy extends FetchStrategy<M, K>>(
    row: UpdateChangesRowWithRelations<M, K>,
    strategy: strategy
  ): Promise<WithActiveRecord<DeepExpand<Selection<M, K, strategy>>, M, K>>;

  proxify<strategy extends FetchStrategy<M, K>>(
    rows: Array<UpdateChangesRowWithRelations<M, K>>,
    strategy: strategy
  ): Promise<WithArrayActiveRecord<Array<DeepExpand<Selection<M, K, strategy>>>, M, K>>;

  // Patch method
  patch<strategy extends FetchStrategy<M, K>>(
    patches: JsonPatch,
    strategy: strategy,
    concurrency?: ConcurrencyConfig<M>[K]
  ): Promise<void>;

  // TypeScript type helpers
  tsType(): DeepExpand<Selection<M, K, {}>>;

  tsType<strategy extends FetchStrategy<M, K>>(
    strategy: strategy
  ): DeepExpand<Selection<M, K, strategy>>;
};

// Rest of the type definitions remain the same...

export type ConcurrencyStrategy = 'optimistic' | 'overwrite' | 'skipOnConflict';

export interface ColumnConcurrency {
  readonly?: boolean;
  concurrency?: ConcurrencyStrategy;
}

export type ConcurrencyConfig<M extends Record<string, TableDefinition<M>>> = {
  [K in keyof M]?: ColumnConcurrency & {
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

export type DbOptions<M extends Record<string, TableDefinition<M>>> =
  ConcurrencyConfig<M>
  & ColumnConcurrency & {
    db?: Pool | ((connectors: Connectors) => Pool | Promise<Pool>);
  };

export type DbConcurrency<M extends Record<string, TableDefinition<M>>> =
  ConcurrencyConfig<M>
  & ColumnConcurrency;

type JsonPatch = Array<{
  op: 'add' | 'remove' | 'replace' | 'copy' | 'move' | 'test';
  path: string;
  value?: any;
  from?: string;
}>;

interface WithInterceptors {
  request: AxiosInterceptorManager<InternalAxiosRequestConfig>;
  response: AxiosInterceptorManager<AxiosResponse>;
}

interface Connectors {
  http(url: string): Pool;
  d1(database: D1Database): Pool;
  postgres(connectionString: string, options?: PoolOptions): Pool;
  pglite(config?: PGliteOptions | string | undefined, options?: PoolOptions): Pool;
  sqlite(connectionString: string, options?: PoolOptions): Pool;
  sap(connectionString: string, options?: PoolOptions): Pool;
  mssql(connectionConfig: ConnectionConfiguration, options?: PoolOptions): Pool;
  mssql(connectionString: string, options?: PoolOptions): Pool;
  oracle(config: PoolAttributes, options?: PoolOptions): Pool;
}

type DbConnectable<M extends Record<string, TableDefinition<M>>> = {
  http(url: string): DBClient<M>;
  d1(database: D1Database): DBClient<M>;
  postgres(connectionString: string, options?: PoolOptions): DBClient<M>;
  pglite(config?: PGliteOptions | string | undefined, options?: PoolOptions): DBClient<M>;
  sqlite(connectionString: string, options?: PoolOptions): DBClient<M>;
  sap(connectionString: string, options?: PoolOptions): DBClient<M>;
  mssql(connectionConfig: ConnectionConfiguration, options?: PoolOptions): DBClient<M>;
  mssql(connectionString: string, options?: PoolOptions): DBClient<M>;
  mssqlNative(connectionString: string, options?: PoolOptions): DBClient<M>;
  mysql(connectionString: string, options?: PoolOptions): DBClient<M>;
  oracle(config: PoolAttributes, options?: PoolOptions): DBClient<M>;
};

export interface Pool {
  end(): Promise<void>;
}

export interface PoolOptions {
  size?: number;
}

export type DBClient<M extends Record<string, TableDefinition<M>>> = {
  [TableName in keyof M]: RootTableRefs<M, TableName> & TableClient<M, TableName>;
} & {
  close(): Promise<void>;
  filter: Filter;
  and(f: Filter | RawFilter[], ...filters: RawFilter[]): Filter;
  or(f: Filter | RawFilter[], ...filters: RawFilter[]): Filter;
  not(): Filter;
  /**
   * Register a user-defined SQLite function on the connection.
   */
  function(name: string, fn: (...args: any[]) => unknown): Promise<unknown> | void;
  query(filter: RawFilter | string): Promise<unknown[]>;
  query<T>(filter: RawFilter | string): Promise<T[]>;
  createPatch(original: any[], modified: any[]): JsonPatch;
  createPatch(original: any, modified: any): JsonPatch;
  (
    config?: DbOptions<M>
  ): DBClient<M>;
  transaction<TR = unknown>(
    fn: (db: DBClient<M>) => Promise<TR> | TR
  ): Promise<TR>;
  express(): import('express').RequestHandler;
  express(config: ExpressConfig<M>): import('express').RequestHandler;
  readonly metaData: DbConcurrency<M>;

  interceptors: WithInterceptors;
} & WithInterceptors & DbConnectable<M>;

type ExpressConfig<M extends Record<string, TableDefinition<M>>> = {
  [TableName in keyof M]?: ExpressTableConfig<M>;
} & {
  db?: Pool | ((connectors: Connectors) => Pool | Promise<Pool>);
  hooks?: ExpressHooks<M>;
}

type ExpressTableConfig<M extends Record<string, TableDefinition<M>>> = {
  baseFilter?: RawFilter | ((db: DBClient<M>, req: import('express').Request, res: import('express').Response) => RawFilter);
}

type ExpressTransactionHooks<M extends Record<string, TableDefinition<M>>> = {
  beforeBegin?: (db: DBClient<M>, req: import('express').Request, res: import('express').Response) => void | Promise<void>;
  afterBegin?: (db: DBClient<M>, req: import('express').Request, res: import('express').Response) => void | Promise<void>;
  beforeCommit?: (db: DBClient<M>, req: import('express').Request, res: import('express').Response) => void | Promise<void>;
  afterCommit?: (db: DBClient<M>, req: import('express').Request, res: import('express').Response) => void | Promise<void>;
  afterRollback?: (db: DBClient<M>, req: import('express').Request, res: import('express').Response, error?: unknown) => void | Promise<void>;
}

type ExpressHooks<M extends Record<string, TableDefinition<M>>> = ExpressTransactionHooks<M> & {
  transaction?: ExpressTransactionHooks<M>;
}

export type DeepExpand<T> =
  T extends Date ? T :
  T extends Array<infer U> ? Array<DeepExpand<U>> :
  T extends object ? { [K in keyof T]: DeepExpand<T[K]> } :
  T;

export function db<M extends Record<string, TableDefinition<M>>>(): DBClient<M>;
