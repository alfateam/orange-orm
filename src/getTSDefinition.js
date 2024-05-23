const typeMap = {
	StringColumn: 'string',
	BooleanColumn: 'boolean',
	UUIDColumn: 'string',
	BinaryColumn: 'string',
	JSONColumn: 'object',
	DateColumn: 'Date | string',
	NumberColumn: 'number',
};

function getTSDefinition(tableConfigs, {isNamespace = false, isHttp = false} = {}) {
	const rootTablesAdded = new Map();
	const tableNames = new Set();
	const tablesAdded = new Map();
	let src = '';
	const defs = tableConfigs.map(getTSDefinitionTable).join('');
	const tables = tableConfigs.reduce((tables, x) => {
		tables[x.name] = x.table;
		return tables;
	}, {});
	src += getPrefixTs(isNamespace);
	if (isNamespace)
		src += startNamespace(tables, isHttp);
	src += defs;
	src += getRdbClientTs(tables, isHttp);
	if (isNamespace)
		src += '}';
	return src;


	function getTSDefinitionTable({table, customFilters, name}) {
		let Name = name.substr(0, 1).toUpperCase() + name.substr(1);
		name = name.substr(0, 1).toLowerCase() + name.substr(1);
		let result = '' + getTable(table, Name, name, customFilters);
		return result;
	}

	function getTable(table, Name, name, customFilters) {
		const _columns = columns(table);
		const _tableRelations = tableRelations(table);
		return `
export interface ${Name}Table {
	count(filter?: RawFilter): Promise<number>;
	getAll(): Promise<${Name}Array>;
	getAll(fetchingStrategy: ${Name}Strategy): Promise<${Name}Array>;
	getMany(filter?: RawFilter): Promise<${Name}Array>;
	getMany(filter: RawFilter, fetchingStrategy: ${Name}Strategy): Promise<${Name}Array>;
	getMany(${name}s: Array<${Name}>): Promise<${Name}Array>;
	getMany(${name}s: Array<${Name}>, fetchingStrategy: ${Name}Strategy): Promise<${Name}Array>;
	getOne(filter?: RawFilter): Promise<${Name}Row>;
	getOne(filter?: RawFilter, fetchingStrategy?: ${Name}Strategy): Promise<${Name}Row>;
	getOne(${name}: ${Name}): Promise<${Name}Row>;
	getOne(${name}: ${Name}, fetchingStrategy: ${Name}Strategy): Promise<${Name}Row>;
	getById(${getIdArgs(table)}): Promise<${Name}Row>;
	getById(${getIdArgs(table)}, fetchingStrategy: ${Name}Strategy): Promise<${Name}Row>;

	update(${name}s: ${Name}[]): Promise<${Name}Array>;
	update(${name}s: ${Name}[], fetchingStrategy: ${Name}Strategy): Promise<${Name}Array>;
	update(${name}: ${Name}): Promise<${Name}Row>;
	update(${name}: ${Name}, fetchingStrategy: ${Name}Strategy): Promise<${Name}Row>;

	updateChanges(${name}s: ${Name}[], old${name}s: ${Name}[]): Promise<${Name}Array>;
	updateChanges(${name}s: ${Name}[],old${name}s: ${Name}[], fetchingStrategy: ${Name}Strategy): Promise<${Name}Array>;
	updateChanges(${name}: ${Name}, old${name}: ${Name}): Promise<${Name}Row>;
	updateChanges(${name}: ${Name},old${name}: ${Name}, fetchingStrategy: ${Name}Strategy): Promise<${Name}Row>;
	
	insert(${name}s: ${Name}[]): Promise<${Name}Array>;
	insert(${name}s: ${Name}[], fetchingStrategy: ${Name}Strategy): Promise<${Name}Array>;
	insert(${name}: ${Name}): Promise<${Name}Row>;
	insert(${name}: ${Name}, fetchingStrategy: ${Name}Strategy): Promise<${Name}Row>;
	insertAndForget(${name}s: ${Name}[]): Promise<void>;
	insertAndForget(${name}: ${Name}): Promise<void>;
	delete(filter?: RawFilter): Promise<void>;
	delete(${name}s: Array<${Name}>): Promise<void>;
	deleteCascade(filter?: RawFilter): Promise<void>;
	deleteCascade(${name}s: Array<${Name}>): Promise<void>;
	proxify(${name}s: ${Name}[]): ${Name}Array;
	proxify(${name}s: ${Name}[], fetchingStrategy: ${Name}Strategy): ${Name}Array;
	proxify(${name}: ${Name}): ${Name}Row;
	proxify(${name}: ${Name}, fetchingStrategy: ${Name}Strategy): ${Name}Row;
	patch(patch: JsonPatch): Promise<void>;
	patch(patch: JsonPatch, concurrency: ${Name}Concurrency, fetchingStrategy?: ${Name}Strategy): Promise<void>;	
	customFilters: ${Name}CustomFilters;
	${_columns}
	${_tableRelations}
}

export interface ${Name}ExpressConfig {
	baseFilter?: RawFilter | ((context: ExpressContext) => RawFilter | Promise<RawFilter>);
    customFilters?: Record<string, (context: ExpressContext,...args: any[]) => RawFilter | Promise<RawFilter>>;
    concurrency?: ${Name}Concurrency;
    readonly?: boolean;
    disableBulkDeletes?: boolean;
}

export interface ${Name}CustomFilters {
	${getCustomFilters(customFilters)}
}

export interface ${Name}Array extends Array<${Name}> {
	saveChanges(): Promise<void>;
	saveChanges(concurrency: ${Name}Concurrency, fetchingStrategy?: ${Name}Strategy): Promise<void>;
	acceptChanges(): void;
	clearChanges(): void;
	refresh(): Promise<void>;
	refresh(fetchingStrategy: ${Name}Strategy): Promise<void>;
	delete(): Promise<void>;
	delete(options: ${Name}Concurrency): Promise<void>;
}

export interface ${Name}Row extends ${Name} {
	saveChanges(): Promise<void>;
	saveChanges(concurrency: ${Name}Concurrency, fetchingStrategy?: ${Name}Strategy): Promise<void>;
	acceptChanges(): void;
	clearChanges(): void;
	refresh(): Promise<void>;
	refresh(fetchingStrategy: ${Name}Strategy): Promise<void>;
	delete(): Promise<void>;
	delete(options: ${Name}Concurrency): Promise<void>;
}

${Concurrency(table, Name, true)}
`;
	}

	function getIdArgs(table) {
		let result = [];
		for (let i = 0; i < table._primaryColumns.length; i++) {
			let column = table._primaryColumns[i];
			result.push(`${column.alias}: ${typeMap[column.tsType]}`);
		}
		return result.join(', ');
	}


	function tableRelations(table) {
		let relations = table._relations;
		let result = '';
		for (let relationName in relations) {
			const tableName = getTableName(relations[relationName], relationName);
			result += `${relationName}: ${tableName}RelatedTable;`;
		}
		return result;
	}


	function columns(table) {
		let result = '';
		let separator = '';
		for (let i = 0; i < table._columns.length; i++) {
			let column = table._columns[i];
			result += `${separator}${column.alias} : ${column.tsType};`;
			separator = `
	`;
		}
		return result;
	}

	function Concurrency(table, name, isRoot) {
		name = pascalCase(name);
		if (!isRoot) {
			if (tablesAdded.has(table))
				return '';
			else {
				tablesAdded.set(table, name);
			}
		}
		let otherConcurrency = '';
		let concurrencyRelations = '';
		let strategyRelations = '';
		let regularRelations = '';
		let relations = table._relations;
		let relationName;

		let separator = `
	`;
		let visitor = {};
		visitor.visitJoin = function(relation) {
			const tableTypeName = getTableName(relation, relationName);

			otherConcurrency += `${Concurrency(relation.childTable, tableTypeName)}`;
			concurrencyRelations += `${relationName}?: ${tableTypeName}Concurrency;${separator}`;
			strategyRelations += `${relationName}?: ${tableTypeName}Strategy | boolean;${separator}`;
			regularRelations += `${relationName}?: ${tableTypeName} | null;${separator}`;
		};
		visitor.visitOne = visitor.visitJoin;
		visitor.visitMany = function(relation) {
			const tableTypeName = getTableName(relation, relationName);
			otherConcurrency += `${Concurrency(relation.childTable, tableTypeName)}`;
			concurrencyRelations += `${relationName}?: ${tableTypeName}Concurrency;${separator}`;
			strategyRelations += `${relationName}?: ${tableTypeName}Strategy | boolean;${separator}`;
			regularRelations += `${relationName}?: ${tableTypeName}[] | null;${separator}`;
		};

		for (relationName in relations) {
			var relation = relations[relationName];
			relation.accept(visitor);
		}

		let row = '';
		if (!isRoot) {
			row = `export interface ${name}RelatedTable {
	${columns(table)}
	${tableRelations(table)}
	all: (selector: (table: ${name}RelatedTable) => RawFilter) => Filter;
	any: (selector: (table: ${name}RelatedTable) => RawFilter) => Filter;
	none: (selector: (table: ${name}RelatedTable) => RawFilter) => Filter;
	exists: () => Filter;	
}`;
		}

		return `
export interface ${name}Concurrency {
	readonly?: boolean;
	concurrency?: Concurrency;
	${concurrencyColumns(table)}
	${concurrencyRelations}
}

export interface ${name} {
	${regularColumns(table)}
	${regularRelations}
}

export interface ${name}TableBase {	
	${columns(table)}
	${tableRelations(table)}
}


export interface ${name}Strategy {
	${strategyColumns(table)}
	${strategyRelations}
	limit?: number;
	offset?: number;
	orderBy?: Array<${orderByColumns(table)}> | ${orderByColumns(table)};
	where?: (table: ${name}TableBase) => RawFilter;
}

${otherConcurrency}

${row}`;

	}

	function getTableName(relation, relationName) {
		let name = rootTablesAdded.get(relation.childTable);
		if (name)
			return name;
		else {
			let name = pascalCase(relationName);
			let count = 2;
			while (tableNames.has(name)) {
				name = name + 'x' + count;
				count++;
			}
			rootTablesAdded.set(relation.childTable, name);
			tableNames.add(name);
			return name;
		}
	}
}

function regularColumns(table) {
	let result = '';
	let separator = '';
	for (let i = 0; i < table._columns.length; i++) {
		let column = table._columns[i];
		if (column._notNull)
			result += `${separator}${column.alias} : ${typeMap[column.tsType]};`;
		else
			result += `${separator}${column.alias}? : ${typeMap[column.tsType]} | null;`;
		separator = `
	`;
	}
	return result;
}

function orderByColumns(table) {
	let result = '';
	let separator = '';
	for (let i = 0; i < table._columns.length; i++) {
		let column = table._columns[i];
		result += `${separator}'${column.alias}' | '${column.alias} desc'`;
		separator = '| ';
	}
	return result;
}


function pascalCase(name) {
	return name[0].toUpperCase() + name.substr(1);
}

function concurrencyColumns(table) {
	let result = '';
	let separator = '';
	for (let i = 0; i < table._columns.length; i++) {
		let column = table._columns[i];
		result += `${separator}${column.alias}? : ColumnConcurrency;`;
		separator = `
	`;
	}
	return result;
}

function strategyColumns(table) {
	let primarySet = new Set(table._primaryColumns);
	let result = '';
	let separator = '';
	for (let i = 0; i < table._columns.length; i++) {
		let column = table._columns[i];
		if (primarySet.has(column))
			continue;
		result += `${separator}${column.alias}? : boolean;`;
		separator = `
	`;
	}
	return result;
}

function getCustomFilters(filters) {
	return getLeafNames(filters);

	function getLeafNames(obj, tabs = '\t\t\t\t\t') {
		let result = '';
		for (let p in obj) {
			if (typeof obj[p] === 'object' && obj[p] !== null) {
				result += '\n' + tabs + p + ': {' + tabs + getLeafNames(obj[p], tabs + '\t');
				result += '\n' + tabs + '}';
			}
			else if (typeof obj[p] === 'function')
				result += '\n' + tabs + p + ': (' + getParamNames(obj[p]) + ') => import(\'orange-orm\').Filter;';
		}
		return result;
	}
}

function getParamNames(func) {
	let STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
	let ARGUMENT_NAMES = /([^\s,]+)/g;

	let fnStr = func.toString().replace(STRIP_COMMENTS, '');
	let result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
	if (result === null)
		return '';
	return result.slice(1).join(': unknown, ') + ': unknown';
}

function getPrefixTs(isNamespace) {
	if (isNamespace)
		return `
/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AxiosInterceptorManager, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { BooleanColumn, JSONColumn, UUIDColumn, DateColumn, NumberColumn, BinaryColumn, StringColumn, Concurrency, Filter, RawFilter, TransactionOptions, Pool, Express, Url, ColumnConcurrency, JsonPatch } from 'orange-orm';
export { RequestHandler } from 'express';
export { Concurrency, Filter, RawFilter, Config, TransactionOptions, Pool } from 'orange-orm';
export = r;
declare function r(config: Config): r.RdbClient;
`;

	return `
/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import schema from './schema';
import type { AxiosInterceptorManager, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { BooleanColumn, JSONColumn, UUIDColumn, DateColumn, NumberColumn, BinaryColumn, StringColumn, Concurrency, Filter, RawFilter, TransactionOptions, Pool, Express, Url, ColumnConcurrency, JsonPatch } from 'orange-orm';
export default schema as RdbClient;`;
}

function startNamespace(tables, isHttp) {
	return `
declare namespace r {${getTables(isHttp)}
`;

	function getTables(isHttp) {
		let result = '';
		for (let name in tables) {
			let Name = name.substring(0, 1).toUpperCase() + name.substring(1);
			result +=
				`
	const ${name}: ${Name}Table;`;
		}
		if (!isHttp)
			result += `

	function and(filter: RawFilter | RawFilter[], ...filters: RawFilter[]): Filter;
	function or(filter: RawFilter | RawFilter[], ...filters: RawFilter[]): Filter;
	function not(): Filter;
	function transaction(fn: (transaction: RdbClient) => Promise<unknown>, options?: TransactionOptions): Promise<void>;
	function query(filter: RawFilter | string): Promise<unknown[]>;
	function query<T>(filter: RawFilter | string): Promise<T[]>;
	function transaction(fn: (transaction: RdbClient) => Promise<unknown>, options?: TransactionOptions): Promise<void>;
	const filter: Filter;
	function express(): Express;
	function express(config: ExpressConfig): Express;
`;
		else
			result += `

	const interceptors: {
		request: AxiosInterceptorManager<InternalAxiosRequestConfig>;
		response: AxiosInterceptorManager<AxiosResponse>;
	};
	function reactive(proxyMethod: (obj: unknown) => unknown): void;	
	function and(filter: RawFilter | RawFilter[], ...filters: RawFilter[]): Filter;
	function or(filter: RawFilter | RawFilter[], ...filters: RawFilter[]): Filter;
	function not(): Filter;
	const filter: Filter;
`;
		return result;
	}
}

function getRdbClientTs(tables, isHttp) {
	return `
export interface RdbClient  {${getTables(isHttp)}
}

export interface RdbConfig {
	db?: Pool | (() => Pool);
    readonly?: boolean;
    concurrency?: Concurrency;${getConcurrencyTables()}    
}

export interface MetaData {
    readonly?: boolean;
    concurrency?: Concurrency;${getConcurrencyTables()}
}

export interface ExpressConfig {
	db?: Pool | (() => Pool);
	tables?: ExpressTables;
	concurrency?: Concurrency;
	readonly?: boolean;
	disableBulkDeletes?: boolean;
}

export interface ExpressContext {
	request: import('express').Request;
	response: import('express').Response;
	client: RdbClient;
}		

export interface ExpressTables {${getExpressTables()}
}
`;
	function getConcurrencyTables() {
		let result = '';
		for (let name in tables) {
			let Name = name.substring(0, 1).toUpperCase() + name.substring(1);
			result +=
			`
	${name}?: ${Name}Concurrency;`;
		}
		return result;
	}

	function getTables(isHttp) {
		let result = '';
		for (let name in tables) {
			let Name = name.substring(0, 1).toUpperCase() + name.substring(1);
			result +=
			`
	${name}: ${Name}Table;`;
		}
		if (isHttp)
			result += `
	(config: {db: Url}): RdbClient;
	interceptors: {
        request: AxiosInterceptorManager<InternalAxiosRequestConfig>;
        response: AxiosInterceptorManager<AxiosResponse>;
    };
	reactive(proxyMethod: (obj: unknown) => unknown): void;
	and(filter: RawFilter | RawFilter[], ...filters: RawFilter[]): Filter;
	or(filter: RawFilter | RawFilter[], ...filters: RawFilter[]): Filter;
	not(): Filter;
	transaction(fn: (transaction: RdbClient) => Promise<unknown>, options?: TransactionOptions): Promise<void>;
	filter: Filter;
    createPatch(original: any[], modified: any[]): JsonPatch;
    createPatch(original: any, modified: any): JsonPatch;`;
		else
			result += `
	(config: RdbConfig): RdbClient;
	and(filter: RawFilter | RawFilter[], ...filters: RawFilter[]): Filter;
	or(filter: RawFilter | RawFilter[], ...filters: RawFilter[]): Filter;
	not(): Filter;
	query(filter: RawFilter | string): Promise<unknown[]>;
	query<T>(filter: RawFilter | string): Promise<T[]>;
	transaction(fn: (transaction: RdbClient) => Promise<unknown>, options?: TransactionOptions): Promise<void>;
	filter: Filter;
	createPatch(original: any[], modified: any[]): JsonPatch;
	createPatch(original: any, modified: any): JsonPatch;
	express(): Express;
	express(config: ExpressConfig): Express;
	readonly metaData: MetaData;`;
		return result;
	}
	function getExpressTables() {
		let result = '';
		for (let name in tables) {
			let Name = name.substring(0, 1).toUpperCase() + name.substring(1);
			result +=
				`
	${name}?: boolean | ${Name}ExpressConfig;`;
		}
		return result;
	}
}

module.exports = getTSDefinition;