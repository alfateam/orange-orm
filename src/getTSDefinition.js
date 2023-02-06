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
		return `
export interface ${Name}Table {
	getAll(): Promise<${Name}Array>;
	getAll(fetchingStrategy: ${Name}Strategy): Promise<${Name}Array>;
	getMany(filter?: RawFilter): Promise<${Name}Array>;
	getMany(filter: RawFilter, fetchingStrategy: ${Name}Strategy): Promise<${Name}Array>;
	getMany(${name}s: Array<${Name}>): Promise<${Name}Array>;
	getMany(${name}s: Array<${Name}>, fetchingStrategy: ${Name}Strategy): Promise<${Name}Array>;
	getOne(filter?: RawFilter): Promise<${Name}Row>;
	getOne(filter: RawFilter, fetchingStrategy: ${Name}Strategy): Promise<${Name}Row>;
	getOne(${name}: ${Name}): Promise<${Name}Row>;
	getOne(${name}: ${Name}, fetchingStrategy: ${Name}Strategy): Promise<${Name}Row>;
	getById(${getIdArgs(table)}): Promise<${Name}Row>;
	getById(${getIdArgs(table)}, fetchingStrategy: ${Name}Strategy): Promise<${Name}Row>;
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
	customFilters: ${Name}CustomFilters;
	${columns(table)}
	${tableRelations(table)}
}

export interface ${Name}ExpressConfig {
	baseFilter?: RawFilter | ((context: ExpressContext) => RawFilter | Promise<RawFilter>);
    customFilters?: Record<string, (context: ExpressContext,...args: any[]) => RawFilter | Promise<RawFilter>>;
    concurrency?: ${Name}Concurrency;
    defaultConcurrency?: Concurrency;
    readonly?: boolean;
    disableBulkDeletes?: boolean;
}

export interface ${Name}CustomFilters {
	${getCustomFilters(customFilters)}
}

export interface ${Name}Array extends Array<${Name}> {
	saveChanges(): Promise<void>;
	saveChanges(concurrency: ${Name}ConcurrencyOptions): Promise<void>;
	saveChanges(fetchingStrategy: ${Name}Strategy): Promise<void>;
	saveChanges(concurrency: ${Name}ConcurrencyOptions, fetchingStrategy: ${Name}Strategy): Promise<void>;
	acceptChanges(): void;
	clearChanges(): void;
	refresh(): Promise<void>;
	refresh(fetchingStrategy: ${Name}Strategy): Promise<void>;
	delete(): Promise<void>;
	delete(options: ${Name}ConcurrencyOptions): Promise<void>;
}

export interface ${Name}Row extends ${Name} {
	saveChanges(): Promise<void>;
	saveChanges(concurrency: ${Name}ConcurrencyOptions): Promise<void>;
	saveChanges(fetchingStrategy: ${Name}Strategy): Promise<void>;
	saveChanges(concurrency: ${Name}ConcurrencyOptions, fetchingStrategy: ${Name}Strategy): Promise<void>;
	acceptChanges(): void;
	clearChanges(): void;
	refresh(): Promise<void>;
	refresh(fetchingStrategy: ${Name}Strategy): Promise<void>;
	delete(): Promise<void>;
	delete(options: ${Name}ConcurrencyOptions): Promise<void>;
}

export interface ${Name}ConcurrencyOptions {
	defaultConcurrency?: Concurrency
	concurrency?: ${Name}Concurrency;
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
			strategyRelations += `${relationName}?: ${tableTypeName}Strategy;${separator}`;
			regularRelations += `${relationName}?: ${tableTypeName} | null;${separator}`;
		};
		visitor.visitOne = visitor.visitJoin;
		visitor.visitMany = function(relation) {
			const tableTypeName = getTableName(relation, relationName);
			otherConcurrency += `${Concurrency(relation.childTable, tableTypeName)}`;
			concurrencyRelations += `${relationName}?: ${tableTypeName}Concurrency;${separator}`;
			strategyRelations += `${relationName}?: ${tableTypeName}Strategy ;${separator}`;
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
	${concurrencyColumns(table)}
	${concurrencyRelations}
}

export interface ${name} {
	${regularColumns(table)}
	${regularRelations}
}

export interface ${name}Strategy {
	${strategyColumns(table)}
	${strategyRelations}
	limit?: number;
	offset?: number;
	orderBy?: Array<${orderByColumns(table)}> | ${orderByColumns(table)};
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
				name = name + '_' + count;
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
	let primarySet = new Set(table._primaryColumns);
	let result = '';
	let separator = '';
	for (let i = 0; i < table._columns.length; i++) {
		let column = table._columns[i];
		if (primarySet.has(column))
			continue;
		result += `${separator}${column.alias}? : Concurrency;`;
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
				result += '\n' + tabs + p + ': (' + getParamNames(obj[p]) + ') => import(\'rdb\').Filter;';
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
import type { AxiosInterceptorManager, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { BooleanColumn, JSONColumn, UUIDColumn, DateColumn, NumberColumn, BinaryColumn, StringColumn, Concurrency, Filter, RawFilter, TransactionOptions, Pool, Express, Url } from 'rdb';
export { RequestHandler } from 'express';
export { Concurrency, Filter, RawFilter, Config, TransactionOptions, Pool } from 'rdb';
export = r;
declare function r(config: Config): r.RdbClient;
`;

	return `
/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import schema from './schema';
import type { AxiosInterceptorManager, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { BooleanColumn, JSONColumn, UUIDColumn, DateColumn, NumberColumn, BinaryColumn, StringColumn, Concurrency, Filter, RawFilter, TransactionOptions, Pool, Express, Url } from 'rdb';
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

	function and(filter: Filter, ...filters: Filter[]): Filter;
	function or(filter: Filter, ...filters: Filter[]): Filter;
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
		request: AxiosInterceptorManager<AxiosRequestConfig>;
		response: AxiosInterceptorManager<AxiosResponse>;
	};
	function reactive(proxyMethod: (obj: unknown) => unknown): void;	
	function and(filter: Filter, ...filters: Filter[]): Filter;
	function or(filter: Filter, ...filters: Filter[]): Filter;
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

export interface ExpressConfig {
	db?: Pool | (() => Pool);
	tables?: ExpressTables;
	defaultConcurrency?: Concurrency;
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
        request: AxiosInterceptorManager<AxiosRequestConfig>;
        response: AxiosInterceptorManager<AxiosResponse>;
    };
	reactive(proxyMethod: (obj: unknown) => unknown): void;
	and(filter: Filter, ...filters: Filter[]): Filter;
	or(filter: Filter, ...filters: Filter[]): Filter;
	not(): Filter;
	transaction(fn: (transaction: RdbClient) => Promise<unknown>, options?: TransactionOptions): Promise<void>;
	filter: Filter;`;
		else
			result += `
	(config: {db: Pool | (() => Pool)}): RdbClient;
	and(filter: Filter, ...filters: Filter[]): Filter;
	or(filter: Filter, ...filters: Filter[]): Filter;
	not(): Filter;
	query(filter: RawFilter | string): Promise<unknown[]>;
	query<T>(filter: RawFilter | string): Promise<T[]>;
	transaction(fn: (transaction: RdbClient) => Promise<unknown>, options?: TransactionOptions): Promise<void>;
	filter: Filter;
	express(): Express;
	express(config: ExpressConfig): Express;`;
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