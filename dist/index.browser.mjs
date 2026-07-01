void !function() {
	typeof self === 'undefined' && typeof global === 'object'
		? global.self = global : null;
}();import * as fastJsonPatch from 'fast-json-patch';
import * as _default from 'rfdc/default';
import * as ajv from 'ajv';
import * as onChange from '@lroal/on-change';

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function getDefaultExportFromNamespaceIfPresent (n) {
	return n && Object.prototype.hasOwnProperty.call(n, 'default') ? n['default'] : n;
}

var getTSDefinition_1;
var hasRequiredGetTSDefinition;

function requireGetTSDefinition () {
	if (hasRequiredGetTSDefinition) return getTSDefinition_1;
	hasRequiredGetTSDefinition = 1;
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

	replace(${name}s: ${Name}[] | ${Name}): Promise<void>;
	replace(${name}s: ${Name}[], fetchingStrategy: ${Name}Strategy): Promise<${Name}Array>;
	replace(${name}: ${Name}, fetchingStrategy: ${Name}Strategy): Promise<${Name}Row>;
	
	update(${name}: ${Name}): Promise<void>;
	update(${name}: ${Name}, whereStrategy: ${Name}Strategy): Promise<void>;
	update(${name}: ${Name}, whereStrategy: ${Name}Strategy): Promise<void>;
	update(${name}: ${Name}, whereStrategy: ${Name}Strategy, fetchingStrategy: ${Name}Strategy): Promise<${Name}Row[]>;

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

export interface ${Name}HonoConfig {
	baseFilter?: RawFilter | ((context: HonoContext) => RawFilter | Promise<RawFilter>);
    customFilters?: Record<string, (context: HonoContext,...args: any[]) => RawFilter | Promise<RawFilter>>;
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
import type { BooleanColumn, JSONColumn, UUIDColumn, DateColumn, NumberColumn, BinaryColumn, StringColumn, Concurrency, Filter, RawFilter, TransactionOptions, Pool, Express, Hono, Url, ColumnConcurrency, JsonPatch } from 'orange-orm';
export { RequestHandler } from 'express';
export { Concurrency, Filter, RawFilter, Config, TransactionOptions, Pool } from 'orange-orm';
export = r;
declare function r(config: Config): r.RdbClient;
type HttpInterceptorManager<T> = {
	use(onFulfilled?: (value: T) => T | Promise<T>, onRejected?: (error: any) => any): string;
	eject(id: string): void;
};
type HttpRequestConfig = {
	baseURL?: string;
	url?: string;
	method?: string;
	headers: Record<string, string>;
	data?: any;
};
type HttpResponse<T = any> = {
	data: T;
	status: number;
	statusText: string;
	headers: Record<string, string>;
	config: HttpRequestConfig;
};
`;

		return `
/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import schema from './schema';
import type { BooleanColumn, JSONColumn, UUIDColumn, DateColumn, NumberColumn, BinaryColumn, StringColumn, Concurrency, Filter, RawFilter, TransactionOptions, Pool, Express, Hono, Url, ColumnConcurrency, JsonPatch } from 'orange-orm';
type HttpInterceptorManager<T> = {
	use(onFulfilled?: (value: T) => T | Promise<T>, onRejected?: (error: any) => any): string;
	eject(id: string): void;
};
type HttpRequestConfig = {
	baseURL?: string;
	url?: string;
	method?: string;
	headers: Record<string, string>;
	data?: any;
};
type HttpResponse<T = any> = {
	data: T;
	status: number;
	statusText: string;
	headers: Record<string, string>;
	config: HttpRequestConfig;
};
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
	function transaction(fn: (transaction: RdbClient, ctx: SyncTransactionContext) => Promise<unknown>, options?: TransactionOptions): Promise<void>;
	function query(filter: RawFilter | string): Promise<unknown[]>;
	function query<T>(filter: RawFilter | string): Promise<T[]>;
	function transaction(fn: (transaction: RdbClient, ctx: SyncTransactionContext) => Promise<unknown>, options?: TransactionOptions): Promise<void>;
	const filter: Filter;
	function express(): Express;
	function express(config: ExpressConfig): Express;
	function hono(): Hono;
	function hono(config: HonoConfig): Hono;
`;
			else
				result += `

	const interceptors: {
		request: HttpInterceptorManager<HttpRequestConfig>;
		response: HttpInterceptorManager<HttpResponse>;
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
	hooks?: ExpressHooks;
}

export interface HonoConfig {
	db?: Pool | (() => Pool);
	tables?: HonoTables;
	concurrency?: Concurrency;
	readonly?: boolean;
	disableBulkDeletes?: boolean;
	hooks?: HonoHooks;
}

export interface ExpressContext {
	request: import('express').Request;
	response: import('express').Response;
	client: RdbClient;
}		

export interface HonoRequest {
	method: string;
	query: Record<string, string>;
	headers: Record<string, string>;
	json(): Promise<unknown>;
}

export interface HonoResponse {
	status(code: number): HonoResponse;
	setHeader(name: string, value: string): HonoResponse;
	json(value: unknown): unknown;
	send(value: unknown): unknown;
}

export interface HonoContext {
	request: HonoRequest;
	response: HonoResponse;
	client: RdbClient;
}

export interface SyncTransactionContext {
	sync: Record<string, unknown> & { operation?: string };
	memory: unknown;
}

export interface ExpressTransactionHooks {
	beforeBegin?: (db: Pool, request: import('express').Request, response: import('express').Response) => void | Promise<void>;
	afterBegin?: (db: Pool, request: import('express').Request, response: import('express').Response) => void | Promise<void>;
	beforeCommit?: (db: Pool, request: import('express').Request, response: import('express').Response) => void | Promise<void>;
	afterCommit?: (db: Pool, request: import('express').Request, response: import('express').Response) => void | Promise<void>;
	afterRollback?: (db: Pool, request: import('express').Request, response: import('express').Response, error?: unknown) => void | Promise<void>;
}

export interface ExpressHooks extends ExpressTransactionHooks {
	transaction?: ExpressTransactionHooks;
}

export interface HonoTransactionHooks {
	beforeBegin?: (db: Pool, request: HonoRequest, response: HonoResponse) => void | Promise<void>;
	afterBegin?: (db: Pool, request: HonoRequest, response: HonoResponse) => void | Promise<void>;
	beforeCommit?: (db: Pool, request: HonoRequest, response: HonoResponse) => void | Promise<void>;
	afterCommit?: (db: Pool, request: HonoRequest, response: HonoResponse) => void | Promise<void>;
	afterRollback?: (db: Pool, request: HonoRequest, response: HonoResponse, error?: unknown) => void | Promise<void>;
}

export interface HonoHooks extends HonoTransactionHooks {
	transaction?: HonoTransactionHooks;
}

export interface ExpressTables {${getExpressTables()}
}

export interface HonoTables {${getHonoTables()}
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
        request: HttpInterceptorManager<HttpRequestConfig>;
        response: HttpInterceptorManager<HttpResponse>;
    };
	reactive(proxyMethod: (obj: unknown) => unknown): void;
	and(filter: RawFilter | RawFilter[], ...filters: RawFilter[]): Filter;
	or(filter: RawFilter | RawFilter[], ...filters: RawFilter[]): Filter;
	not(): Filter;
	transaction(fn: (transaction: RdbClient, ctx: SyncTransactionContext) => Promise<unknown>, options?: TransactionOptions): Promise<void>;
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
	transaction(fn: (transaction: RdbClient, ctx: SyncTransactionContext) => Promise<unknown>, options?: TransactionOptions): Promise<void>;
	filter: Filter;
	createPatch(original: any[], modified: any[]): JsonPatch;
	createPatch(original: any, modified: any): JsonPatch;
	express(): Express;
	express(config: ExpressConfig): Express;
	hono(): Hono;
	hono(config: HonoConfig): Hono;
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
		function getHonoTables() {
			let result = '';
			for (let name in tables) {
				let Name = name.substring(0, 1).toUpperCase() + name.substring(1);
				result +=
					`
	${name}?: boolean | ${Name}HonoConfig;`;
			}
			return result;
		}
	}

	getTSDefinition_1 = getTSDefinition;
	return getTSDefinition_1;
}

var getMeta_1;
var hasRequiredGetMeta;

function requireGetMeta () {
	if (hasRequiredGetMeta) return getMeta_1;
	hasRequiredGetMeta = 1;
	function getMeta(table, map = new Map()) {
		if (map.has(table))
			return map.get(table).id;
		let strategy = {
			keys: table._primaryColumns.map(x => ({name: x.alias, type: x.tsType})),
			columns: {},
			relations: {},
			id: map.size
		};
		map.set(table, strategy);

		for (let i = 0; i < table._columns.length; i++) {
			const column = table._columns[i];
			strategy.columns[column.alias] = {};
			if ('serializable' in column && !column.serializable)
				strategy.columns[column.alias].serializable = false;
			else
				strategy.columns[column.alias].serializable = true;
		}

		let relations = table._relations;
		let relationName;

		let visitor = {};
		visitor.visitJoin = function(relation) {
			strategy.relations[relationName] = getMeta(relation.childTable, map);
		};

		visitor.visitMany = function(relation) {
			strategy.relations[relationName] = getMeta(relation.childTable, map);
		};

		visitor.visitOne = visitor.visitMany;

		for (relationName in relations) {
			let relation = relations[relationName];
			relation.accept(visitor);
		}
		return strategy;
	}

	getMeta_1 = getMeta;
	return getMeta_1;
}

var dateToISOString_1;
var hasRequiredDateToISOString;

function requireDateToISOString () {
	if (hasRequiredDateToISOString) return dateToISOString_1;
	hasRequiredDateToISOString = 1;
	function dateToISOString(date) {
		let tzo = -date.getTimezoneOffset();
		let dif = tzo >= 0 ? '+' : '-';

		function pad(num) {
			let norm = Math.floor(Math.abs(num));
			return (norm < 10 ? '0' : '') + norm;
		}

		function padMilli(d) {
			return (d.getMilliseconds() + '').padStart(3, '0');
		}

		return date.getFullYear() +
			'-' + pad(date.getMonth() + 1) +
			'-' + pad(date.getDate()) +
			'T' + pad(date.getHours()) +
			':' + pad(date.getMinutes()) +
			':' + pad(date.getSeconds()) +
			'.' + padMilli(date) +
			dif + pad(tzo / 60) +
			':' + pad(tzo % 60);
	}

	dateToISOString_1 = dateToISOString;
	return dateToISOString_1;
}

var stringify_1;
var hasRequiredStringify;

function requireStringify () {
	if (hasRequiredStringify) return stringify_1;
	hasRequiredStringify = 1;
	let dateToISOString = requireDateToISOString();

	function stringify(value) {
		return JSON.stringify(value, replacer);
	}

	function replacer(key, value) {
		// @ts-ignore
		if (typeof value === 'bigint')
			return value.toString();
		else if (value instanceof Date  && !isNaN(value))
			return dateToISOString(value);
		else
			return value;
	}

	stringify_1 = stringify;
	return stringify_1;
}

var sync;
var hasRequiredSync;

function requireSync () {
	if (hasRequiredSync) return sync;
	hasRequiredSync = 1;
	const stringify = requireStringify();

	function newSyncHandler(client, options = {}) {
		const syncOptions = normalizeSyncOptions(options.sync);
		if (!syncOptions || syncOptions.enabled === false)
			return null;

		const tableMeta = createTableMeta(client, syncOptions);
		const queue = createQueue(syncOptions.queue);
		const hooks = options.hooks;
		const transactionHooks = hooks && hooks.transaction;
		const transactionHookFns = {
			beforeBegin: (transactionHooks && transactionHooks.beforeBegin) || (hooks && hooks.beforeBegin),
			afterBegin: (transactionHooks && transactionHooks.afterBegin) || (hooks && hooks.afterBegin),
			beforeCommit: (transactionHooks && transactionHooks.beforeCommit) || (hooks && hooks.beforeCommit),
			afterCommit: (transactionHooks && transactionHooks.afterCommit) || (hooks && hooks.afterCommit),
			afterRollback: (transactionHooks && transactionHooks.afterRollback) || (hooks && hooks.afterRollback)
		};
		const hasTransactionHooks = !!(transactionHookFns.beforeBegin
			|| transactionHookFns.afterBegin
			|| transactionHookFns.beforeCommit
			|| transactionHookFns.afterCommit
			|| transactionHookFns.afterRollback);

		return async function handleSync(request, response) {
			try {
				const result = await queue.run(() => execute(request.body || {}, request, response));
				response.json(result);
			}
			catch (e) {
				if (e.status === undefined)
					response.status(500).send(e.message || e);
				else
					response.status(e.status).send(e.message);
			}
		};

		async function execute(body, request, response) {
			const phase = body.phase || body.action;
			if (phase === 'push')
				return pushMutations(body, request, response);
			if (phase === 'keys')
				return pullKeys(body, request, response);
			if (phase === 'rows')
				return pullRows(body, request, response);
			const error = new Error('Invalid sync phase. Use { phase: "keys" }, { phase: "rows" }, or { phase: "push" }.');
			error.status = 400;
			throw error;
		}

		async function runHookedTransaction(fn, transactionOptions, request, response) {
			if (!hasTransactionHooks)
				return client.transaction(fn, transactionOptions);

			let hookDb;
			let result;
			try {
				result = await client.transaction(async (tx) => {
					hookDb = tx;
					if (transactionHookFns.beforeBegin)
						await transactionHookFns.beforeBegin(hookDb, request, response);
					if (transactionHookFns.afterBegin)
						await transactionHookFns.afterBegin(hookDb, request, response);
					const value = await fn(tx);
					if (transactionHookFns.beforeCommit)
						await transactionHookFns.beforeCommit(hookDb, request, response);
					return value;
				}, transactionOptions);
			}
			catch (e) {
				if (transactionHookFns.afterRollback)
					await transactionHookFns.afterRollback(hookDb, request, response, e);
				throw e;
			}
			if (transactionHookFns.afterCommit)
				await transactionHookFns.afterCommit(hookDb, request, response);
			return result;
		}

		async function pushMutations(body, request, response) {
			const clientId = normalizeClientId(body.clientId ?? body.client_id);
			const mutations = normalizeMutations(body.mutations, syncOptions.limits.maxMutationsPerBatch);
			if (!clientId) {
				const error = new Error('Sync push requires "clientId".');
				error.status = 400;
				throw error;
			}
			if (mutations.length === 0) {
				return {
					phase: 'push',
					applied: 0,
					duplicates: 0,
					results: []
				};
			}

			const results = [];
			let applied = 0;
			let duplicates = 0;
			for (let i = 0; i < mutations.length; i++) {
				const mutation = mutations[i];
				await runHookedTransaction(async (tx) => {
					const claim = await claimAppliedMutation(tx, clientId, mutation.id);
					if (!claim.claimed) {
						duplicates += 1;
						results.push({ id: mutation.id, table: mutation.table, ...(claim.result || {}), duplicate: true });
						return;
					}
					const patchResult = await applyMutationPatches(tx, mutation);
					const commandResult = await applyMutationCommands(tx, mutation);
					const result = {
						id: mutation.id,
						table: mutation.table,
						applied: true,
						changed: patchResult.changed,
						result: patchResult,
						commands: commandResult.results
					};
					await updateAppliedMutation(tx, clientId, mutation.id, result);
					results.push(result);
					applied += 1;
				}, undefined, request, response);
			}

			return {
				phase: 'push',
				applied,
				duplicates,
				results
			};
		}

		async function applyMutationPatches(tx, mutation) {
			const entries = Array.isArray(mutation.patches)
				? mutation.patches
				: [{ table: mutation.table, patch: mutation.patch, options: mutation.options }];
			let changed = 0;
			const results = [];
			for (let i = 0; i < entries.length; i++) {
				const entry = entries[i];
				if (!entry || !Array.isArray(entry.patch))
					continue;
				const table = tx[entry.table];
				if (!table || typeof table.patch !== 'function') {
					const error = new Error(`Table "${entry.table}" is not exposed or does not exist`);
					error.status = 400;
					throw error;
				}
				const result = await table.patch(entry.patch, entry.options || mutation.options || {});
				changed += Array.isArray(result && result.changed) ? result.changed.length : 0;
				results.push({ table: entry.table, result });
			}
			return { changed, results };
		}

		async function applyMutationCommands(tx, mutation) {
			const commands = Array.isArray(mutation.commands) ? mutation.commands : [];
			const results = [];
			for (let i = 0; i < commands.length; i++) {
				const command = commands[i];
				const name = command && command.name;
				if (typeof name !== 'string' || name.length === 0)
					continue;
				const fn = syncOptions.commands[name];
				if (typeof fn !== 'function') {
					const error = new Error(`Sync command "${name}" is not registered`);
					error.status = 400;
					throw error;
				}
				const args = normalizeCommandArgs(command.args);
				const value = await fn(tx, args, { name, mutation });
				results.push({ name, result: value === undefined ? null : value });
			}
			return { results };
		}

		async function pullKeys(body, request, response) {
			const requestedTables = normalizeRequestedTables(body.tables, tableMeta);
			const limit = normalizeKeyBatchLimit(body.limit, syncOptions.limits);
			const token = normalizeToken(body.token, requestedTables);
			if (token && token.mode === 'changes')
				return pullKeysFromChanges(token, limit);
			if (token && token.mode === 'snapshot')
				return pullKeysFromSnapshot(token, limit, request, response);

			const startCursor = normalizeCursor(body.cursor ?? body.since);
			const bounds = await getChangeBounds(syncOptions.changeTable);
			const fallback = shouldUseSnapshot(startCursor, bounds, syncOptions.limits.maxChangeWindow);
			if (fallback.useSnapshot) {
				const upperPks = await getSnapshotUpperPks(requestedTables, request, response);
				const snapshotToken = {
					v: 1,
					mode: 'snapshot',
					tables: requestedTables,
					tableIndex: 0,
					lastPk: null,
					watermark: bounds.max,
					upperPks
				};
				const result = await pullKeysFromSnapshot(snapshotToken, limit, request, response);
				result.reason = fallback.reason;
				return result;
			}

			const changeToken = {
				v: 1,
				mode: 'changes',
				tables: requestedTables,
				cursor: startCursor,
				watermark: bounds.max
			};
			return pullKeysFromChanges(changeToken, limit);
		}

		async function pullKeysFromSnapshot(token, limit, request, response) {
			const items = [];
			let tableIndex = normalizeInteger(token.tableIndex, 0);
			let lastPk = normalizePrimaryKeyToken(token.lastPk);
			while (items.length < limit && tableIndex < token.tables.length) {
				const tableName = token.tables[tableIndex];
				const meta = tableMeta.byName.get(tableName);
				if (!meta) {
					tableIndex += 1;
					lastPk = null;
					continue;
				}
				const upperPk = getSnapshotUpperPk(token.upperPks, tableName);
				if (token.upperPks && upperPk === null) {
					tableIndex += 1;
					lastPk = null;
					continue;
				}
				const remaining = limit - items.length;
				const keys = await fetchSnapshotKeys(meta, remaining, lastPk, upperPk, request, response);
				for (let i = 0; i < keys.length; i++) {
					const pk = keys[i];
					items.push({ table: tableName, pk, key: toKeyObject(meta, pk), op: 'U' });
				}
				if (keys.length < remaining) {
					tableIndex += 1;
					lastPk = null;
				}
				else {
					lastPk = keys[keys.length - 1];
				}
			}
			const done = tableIndex >= token.tables.length;
			return {
				phase: 'keys',
				mode: 'snapshot',
				done,
				cursor: token.watermark,
				token: done ? null : {
					v: 1,
					mode: 'snapshot',
					tables: token.tables,
					tableIndex,
					lastPk,
					watermark: token.watermark,
					upperPks: token.upperPks
				},
				items
			};
		}

		async function pullKeysFromChanges(token, limit) {
			const fromCursor = normalizeInteger(token.cursor, 0);
			const watermark = normalizeInteger(token.watermark, 0);
			if (fromCursor >= watermark) {
				return {
					phase: 'keys',
					mode: 'changes',
					done: true,
					cursor: watermark,
					token: null,
					items: []
				};
			}
			const whereTables = token.tables.length === 0
				? ''
				: ` AND table_name IN (${token.tables.map((name) => sqlStringLiteral(tableMeta.byName.get(name).dbName)).join(',')})`;
			const sql = [
				'SELECT id, table_name, op, pk_json',
				`FROM ${quoteQualified(syncOptions.changeTable)}`,
				`WHERE id > ${fromCursor} AND id <= ${watermark}${whereTables}`,
				'ORDER BY id ASC',
				`LIMIT ${limit}`
			].join(' ');
			const rows = await safeQuery(sql, []);
			const dedup = new Map();
			let nextCursor = fromCursor;
			for (let i = 0; i < rows.length; i++) {
				const row = rows[i];
				const id = normalizeInteger(row.id ?? row.ID, nextCursor);
				nextCursor = id > nextCursor ? id : nextCursor;
				const rawTableName = row.table_name ?? row.TABLE_NAME;
				const meta = tableMeta.byDbName.get(rawTableName);
				if (!meta)
					continue;
				let keyObject;
				try {
					keyObject = typeof row.pk_json === 'string'
						? JSON.parse(row.pk_json)
						: JSON.parse(row.PK_JSON);
				}
				catch (_e) {
					continue;
				}
				const pk = toPkArray(meta, keyObject);
				if (!pk)
					continue;
				const mapKey = `${meta.name}|${stringify(pk)}`;
				const op = normalizeOp(row.op ?? row.OP);
				if (dedup.has(mapKey))
					dedup.delete(mapKey);
				dedup.set(mapKey, { table: meta.name, pk, key: toKeyObject(meta, pk), op });
			}
			const items = Array.from(dedup.values());
			const done = rows.length === 0 || nextCursor >= watermark;
			return {
				phase: 'keys',
				mode: 'changes',
				done,
				cursor: watermark,
				token: done ? null : {
					v: 1,
					mode: 'changes',
					tables: token.tables,
					cursor: nextCursor,
					watermark
				},
				items
			};
		}

		async function pullRows(body, request, response) {
			const rawItems = Array.isArray(body.items) ? body.items : [];
			const limit = normalizeRowsBatchLimit(rawItems.length, syncOptions.limits);
			const items = rawItems.slice(0, limit);
			const truncated = rawItems.length > limit;
			const normalizedItems = [];
			const tableKeys = new Map();
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				if (!item || typeof item.table !== 'string')
					continue;
				const meta = tableMeta.byName.get(item.table);
				if (!meta)
					continue;
				if (normalizeOp(item.op) === 'D')
					continue;
				const pk = Array.isArray(item.pk) ? item.pk : toPkArray(meta, item.key);
				if (!pk || pk.length !== meta.pkColumns.length)
					continue;
				const pkKey = stringify(pk);
				normalizedItems.push({ meta, pk, pkKey, op: normalizeOp(item.op) });
				let tableEntry = tableKeys.get(meta.name);
				if (!tableEntry) {
					tableEntry = { meta, keys: [], seen: new Set() };
					tableKeys.set(meta.name, tableEntry);
				}
				if (!tableEntry.seen.has(pkKey)) {
					tableEntry.seen.add(pkKey);
					tableEntry.keys.push(pk);
				}
			}

			const rowMap = new Map();
			const tableNames = Array.from(tableKeys.keys());
			for (let i = 0; i < tableNames.length; i++) {
				const tableName = tableNames[i];
				const tableEntry = tableKeys.get(tableName);
				const rows = await fetchRowsByPrimaryKeys(tableEntry.meta, tableEntry.keys, request, response);
				const perTable = new Map();
				for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
					const row = rows[rowIndex];
					const pk = toPkArray(tableEntry.meta, row);
					if (pk)
						perTable.set(stringify(pk), row);
				}
				rowMap.set(tableName, perTable);
			}

			const resolved = [];
			for (let i = 0; i < normalizedItems.length; i++) {
				const item = normalizedItems[i];
				const row = rowMap.get(item.meta.name)?.get(item.pkKey);
				if (row !== undefined)
					resolved.push({ table: item.meta.name, pk: item.pk, key: toKeyObject(item.meta, item.pk), row, op: item.op });
			}

			return {
				phase: 'rows',
				limit,
				requested: rawItems.length,
				truncated,
				items: resolved
			};
		}

		async function fetchSnapshotKeys(meta, limit, lastPk, upperPk, request, response) {
			if (upperPk === null)
				return [];
			const strategy = {};
			for (let i = 0; i < meta.pkColumns.length; i++) {
				strategy[meta.pkColumns[i].alias] = true;
			}
			strategy.orderBy = meta.pkColumns.map(x => x.alias);
			strategy.limit = limit;
			const filter = buildSnapshotKeysetFilter(meta, lastPk, upperPk);
			const rows = await runHookedTransaction(async (tx) => {
				return tx[meta.name].getMany(filter, strategy);
			}, { readonly: true }, request, response);
			const result = [];
			for (let i = 0; i < rows.length; i++) {
				const pk = toPkArray(meta, rows[i]);
				if (pk)
					result.push(pk);
			}
			return result;
		}

		async function getSnapshotUpperPks(tableNames, request, response) {
			const result = {};
			for (let i = 0; i < tableNames.length; i++) {
				const tableName = tableNames[i];
				const meta = tableMeta.byName.get(tableName);
				if (!meta)
					continue;
				result[tableName] = await fetchSnapshotUpperPk(meta, request, response);
			}
			return result;
		}

		async function fetchSnapshotUpperPk(meta, request, response) {
			const strategy = {};
			for (let i = 0; i < meta.pkColumns.length; i++) {
				strategy[meta.pkColumns[i].alias] = true;
			}
			strategy.orderBy = meta.pkColumns.map(x => `${x.alias} desc`);
			strategy.limit = 1;
			const rows = await runHookedTransaction(async (tx) => {
				return tx[meta.name].getMany(undefined, strategy);
			}, { readonly: true }, request, response);
			return rows.length > 0 ? toPkArray(meta, rows[0]) : null;
		}

		async function fetchRowsByPrimaryKeys(meta, keys, request, response) {
			if (!Array.isArray(keys) || keys.length === 0)
				return [];
			const keyObjects = [];
			for (let i = 0; i < keys.length; i++) {
				const pk = keys[i];
				if (!Array.isArray(pk) || pk.length !== meta.pkColumns.length)
					continue;
				keyObjects.push(toKeyObject(meta, pk));
			}
			if (keyObjects.length === 0)
				return [];
			return runHookedTransaction(async (tx) => {
				return tx[meta.name].getMany({
					where: () => keyObjects
				});
			}, { readonly: true }, request, response);
		}

		async function getChangeBounds(changeTable) {
			try {
				const sql = [
					'SELECT',
					'COALESCE(MIN(id), 0) AS min_id,',
					'COALESCE(MAX(id), 0) AS max_id',
					`FROM ${quoteQualified(changeTable)}`
				].join(' ');
				const rows = await safeQuery(sql, []);
				const row = rows[0] || {};
				return {
					exists: true,
					min: normalizeInteger(row.min_id ?? row.MIN_ID, 0),
					max: normalizeInteger(row.max_id ?? row.MAX_ID, 0)
				};
			}
			catch (_error) {
				return { exists: false, min: 0, max: 0 };
			}
		}

		async function safeQuery(sql, fallback) {
			const result = await client.query(sql);
			if (Array.isArray(result))
				return result;
			if (Array.isArray(result?.rows))
				return result.rows;
			return fallback;
		}

		async function claimAppliedMutation(tx, clientId, mutationId) {
			const rows = await safeTxQuery(tx, [
				`INSERT INTO ${quoteQualified(syncOptions.appliedMutationsTable)} (client_id, mutation_id, result_json)`,
				`VALUES (${sqlStringLiteral(clientId)}, ${sqlStringLiteral(mutationId)}, ${sqlJsonLiteral({ pending: true })})`,
				'ON CONFLICT (client_id, mutation_id) DO NOTHING',
				'RETURNING result_json'
			].join(' '), []);
			if (rows.length > 0)
				return { claimed: true };

			const existingRows = await safeTxQuery(tx, [
				'SELECT result_json',
				`FROM ${quoteQualified(syncOptions.appliedMutationsTable)}`,
				`WHERE client_id = ${sqlStringLiteral(clientId)} AND mutation_id = ${sqlStringLiteral(mutationId)}`,
				'LIMIT 1'
			].join(' '), []);
			const result = parseResultJson(existingRows[0]);
			return { claimed: false, result };
		}

		function parseResultJson(row) {
			if (!row)
				return null;
			const raw = row.result_json ?? row.RESULT_JSON;
			if (typeof raw === 'string') {
				try {
					return JSON.parse(raw);
				}
				catch (_e) {
					return null;
				}
			}
			return raw && raw === Object(raw) ? raw : null;
		}

		async function updateAppliedMutation(tx, clientId, mutationId, result) {
			await tx.query([
				`UPDATE ${quoteQualified(syncOptions.appliedMutationsTable)}`,
				`SET result_json = ${sqlJsonLiteral(result)}, applied_at = NOW()`,
				`WHERE client_id = ${sqlStringLiteral(clientId)} AND mutation_id = ${sqlStringLiteral(mutationId)}`
			].join(' '));
		}

		async function safeTxQuery(tx, sql, fallback) {
			const result = await tx.query(sql);
			if (Array.isArray(result))
				return result;
			if (Array.isArray(result?.rows))
				return result.rows;
			return fallback;
		}
	}

	const DEFAULT_SYNC_BATCH_LIMIT = 1000;
	const DEFAULT_SYNC_MUTATIONS_LIMIT = 200;
	const DEFAULT_SYNC_CHANGE_WINDOW = 100000;
	const MAX_SYNC_BATCH_LIMIT = 10000;

	function normalizeSyncOptions(sync) {
		if (!sync)
			return null;
		const queueOptions = sync.queue || {};
		const limits = sync.limits || {};
		const explicitLimits = {
			maxKeysPerBatch: isNormalizableInteger(limits.maxKeysPerBatch),
			maxRowsPerBatch: isNormalizableInteger(limits.maxRowsPerBatch)
		};
		return {
			enabled: sync.enabled !== false,
			changeTable: sync.changeTable || 'orange_changes',
			appliedMutationsTable: sync.appliedMutationsTable || 'orange_sync_applied_mutations',
			commands: normalizeCommands(sync.commands),
			queue: {
				concurrency: clamp(normalizeInteger(queueOptions.concurrency, 4), 1, 100),
				maxPending: clamp(normalizeInteger(queueOptions.maxPending, 1000), 0, 100000)
			},
			limits: {
				maxKeysPerBatch: clamp(normalizeInteger(limits.maxKeysPerBatch, DEFAULT_SYNC_BATCH_LIMIT), 1, MAX_SYNC_BATCH_LIMIT),
				maxRowsPerBatch: clamp(normalizeInteger(limits.maxRowsPerBatch, DEFAULT_SYNC_BATCH_LIMIT), 1, MAX_SYNC_BATCH_LIMIT),
				maxMutationsPerBatch: clamp(normalizeInteger(limits.maxMutationsPerBatch, DEFAULT_SYNC_MUTATIONS_LIMIT), 1, MAX_SYNC_BATCH_LIMIT),
				maxChangeWindow: clamp(normalizeInteger(limits.maxChangeWindow, DEFAULT_SYNC_CHANGE_WINDOW), 1, 100000000),
				explicit: explicitLimits
			}
		};
	}

	function normalizeCommands(commands) {
		if (!commands || commands !== Object(commands))
			return {};
		return commands;
	}

	function createTableMeta(client, syncOptions) {
		const byName = new Map();
		const byDbName = new Map();
		for (let tableName in client.tables) {
			const table = client.tables[tableName];
			const pkColumns = Array.isArray(table?._primaryColumns) ? table._primaryColumns : [];
			if (pkColumns.length === 0)
				continue;
			const dbName = table._dbName;
			if (!dbName || dbName === syncOptions.changeTable)
				continue;
			const meta = {
				name: tableName,
				dbName,
				pkColumns: pkColumns.map((col) => ({ alias: col.alias, dbName: col._dbName || col.alias }))
			};
			byName.set(tableName, meta);
			byDbName.set(dbName, meta);
			const split = dbName.split('.');
			byDbName.set(split[split.length - 1], meta);
		}
		return { byName, byDbName };
	}

	function createQueue({ concurrency, maxPending }) {
		let running = 0;
		const pending = [];
		let pendingHead = 0;
		return { run };

		function run(job) {
			return new Promise((resolve, reject) => {
				if (running >= concurrency && pending.length - pendingHead >= maxPending) {
					const error = new Error('Sync queue is full. Try again later.');
					error.status = 429;
					reject(error);
					return;
				}
				pending.push({ job, resolve, reject });
				drain();
			});
		}

		function drain() {
			while (running < concurrency && pendingHead < pending.length) {
				const next = pending[pendingHead];
				pendingHead += 1;
				if (pendingHead > 1024 && pendingHead * 2 > pending.length) {
					pending.splice(0, pendingHead);
					pendingHead = 0;
				}
				running += 1;
				Promise.resolve()
					.then(next.job)
					.then(next.resolve, next.reject)
					.finally(() => {
						running -= 1;
						drain();
					});
			}
		}
	}

	function shouldUseSnapshot(cursor, bounds, maxChangeWindow) {
		if (!Number.isFinite(cursor))
			return { useSnapshot: true, reason: 'first_sync' };
		if (!bounds.exists)
			return { useSnapshot: true, reason: 'change_table_unavailable' };
		if (cursor < bounds.min - 1)
			return { useSnapshot: true, reason: 'cursor_too_old' };
		if (bounds.max - cursor > maxChangeWindow)
			return { useSnapshot: true, reason: 'cursor_too_far_behind' };
		return { useSnapshot: false };
	}

	function normalizeRequestedTables(rawTables, tableMeta) {
		if (!Array.isArray(rawTables) || rawTables.length === 0)
			return Array.from(tableMeta.byName.keys());
		const normalized = [];
		for (let i = 0; i < rawTables.length; i++) {
			const raw = rawTables[i];
			if (typeof raw !== 'string')
				continue;
			const byName = tableMeta.byName.get(raw);
			if (byName) {
				normalized.push(byName.name);
				continue;
			}
			const byDbName = tableMeta.byDbName.get(raw);
			if (byDbName)
				normalized.push(byDbName.name);
		}
		return Array.from(new Set(normalized));
	}

	function normalizeToken(token, requestedTables) {
		if (!token || token !== Object(token))
			return null;
		if (token.v !== 1)
			return null;
		if (token.mode === 'changes') {
			return {
				v: 1,
				mode: 'changes',
				tables: requestedTables,
				cursor: normalizeInteger(token.cursor, 0),
				watermark: normalizeInteger(token.watermark, 0)
			};
		}
		if (token.mode === 'snapshot') {
			return {
				v: 1,
				mode: 'snapshot',
				tables: requestedTables,
				tableIndex: normalizeInteger(token.tableIndex, 0),
				lastPk: normalizePrimaryKeyToken(token.lastPk),
				watermark: normalizeInteger(token.watermark, 0),
				upperPks: normalizeSnapshotUpperPks(token.upperPks, requestedTables)
			};
		}
		return null;
	}

	function normalizeCursor(cursor) {
		if (cursor === null || cursor === undefined || cursor === '')
			return NaN;
		if (typeof cursor === 'number' && Number.isFinite(cursor))
			return cursor;
		if (typeof cursor === 'string') {
			const parsed = Number.parseInt(cursor, 10);
			return Number.isFinite(parsed) ? parsed : NaN;
		}
		return NaN;
	}

	function normalizeKeyBatchLimit(limit, limits) {
		const max = Math.min(
			limits.explicit.maxKeysPerBatch ? limits.maxKeysPerBatch : MAX_SYNC_BATCH_LIMIT,
			limits.explicit.maxRowsPerBatch ? limits.maxRowsPerBatch : MAX_SYNC_BATCH_LIMIT
		);
		return normalizeLimit(limit, DEFAULT_SYNC_BATCH_LIMIT, max);
	}

	function normalizeRowsBatchLimit(limit, limits) {
		const max = limits.explicit.maxRowsPerBatch ? limits.maxRowsPerBatch : MAX_SYNC_BATCH_LIMIT;
		return normalizeLimit(limit, DEFAULT_SYNC_BATCH_LIMIT, max);
	}

	function normalizeLimit(limit, fallback, max) {
		return clamp(normalizeInteger(limit, fallback), 1, max);
	}

	function normalizeInteger(value, fallback) {
		if (typeof value === 'number' && Number.isFinite(value))
			return Math.floor(value);
		if (typeof value === 'string') {
			const parsed = Number.parseInt(value, 10);
			if (Number.isFinite(parsed))
				return parsed;
		}
		return fallback;
	}

	function isNormalizableInteger(value) {
		if (typeof value === 'number')
			return Number.isFinite(value);
		if (typeof value === 'string')
			return Number.isFinite(Number.parseInt(value, 10));
		return false;
	}

	function normalizeOp(value) {
		if (typeof value !== 'string')
			return 'U';
		const op = value.toUpperCase();
		if (op === 'I' || op === 'U' || op === 'D')
			return op;
		return 'U';
	}

	function normalizeClientId(value) {
		if (typeof value !== 'string')
			return '';
		return value.trim();
	}

	function normalizeMutations(value, limit) {
		if (!Array.isArray(value))
			return [];
		const result = [];
		for (let i = 0; i < value.length && result.length < limit; i++) {
			const mutation = normalizeMutation(value[i]);
			if (mutation)
				result.push(mutation);
		}
		return result;
	}

	function normalizeMutation(value) {
		if (!value || value !== Object(value))
			return null;
		const id = value.id ?? value.mutationId ?? value.mutation_id;
		if (typeof id !== 'string' || id.length === 0)
			return null;
		const commands = Array.isArray(value.commands)
			? value.commands.map(normalizeMutationCommand).filter(Boolean)
			: [];
		if (Array.isArray(value.patches)) {
			const patches = value.patches.map(normalizeMutationPatch).filter(Boolean);
			if (patches.length === 0 && commands.length === 0)
				return null;
			return {
				id,
				patches,
				commands,
				options: value.options && value.options === Object(value.options) ? value.options : undefined
			};
		}
		const entry = normalizeMutationPatch(value);
		if (!entry && commands.length === 0)
			return null;
		return {
			id,
			...(entry || {}),
			commands,
			options: value.options && value.options === Object(value.options) ? value.options : undefined
		};
	}

	function normalizeMutationCommand(value) {
		if (!value || value !== Object(value))
			return null;
		if (typeof value.name !== 'string' || value.name.length === 0)
			return null;
		return {
			name: value.name,
			args: normalizeCommandArgs(value.args)
		};
	}

	function normalizeCommandArgs(args) {
		if (args === undefined)
			return null;
		return JSON.parse(JSON.stringify(args));
	}

	function normalizeMutationPatch(value) {
		if (!value || value !== Object(value))
			return null;
		if (typeof value.table !== 'string' || value.table.length === 0)
			return null;
		if (!Array.isArray(value.patch))
			return null;
		return {
			table: value.table,
			patch: value.patch,
			options: value.options && value.options === Object(value.options) ? value.options : undefined
		};
	}

	function toPkArray(meta, row) {
		if (!row || row !== Object(row))
			return null;
		const result = [];
		for (let i = 0; i < meta.pkColumns.length; i++) {
			const key = meta.pkColumns[i].alias;
			if (!(key in row))
				return null;
			result.push(row[key]);
		}
		return result;
	}

	function toKeyObject(meta, pk) {
		const key = {};
		for (let i = 0; i < meta.pkColumns.length && i < pk.length; i++) {
			key[meta.pkColumns[i].alias] = pk[i];
		}
		return key;
	}

	function buildSnapshotKeysetFilter(meta, lastPk, upperPk) {
		const filters = [];
		if (Array.isArray(lastPk) && lastPk.length === meta.pkColumns.length)
			filters.push(buildKeysetAfterFilter(meta, lastPk));
		if (Array.isArray(upperPk) && upperPk.length === meta.pkColumns.length) {
			const upperFilter = buildKeysetAfterFilter(meta, upperPk);
			filters.push({
				sql: `NOT (${upperFilter.sql})`,
				parameters: upperFilter.parameters
			});
		}
		const validFilters = filters.filter(Boolean);
		if (validFilters.length === 0)
			return undefined;
		return {
			sql: validFilters.map(x => `(${x.sql})`).join(' AND '),
			parameters: validFilters.reduce((all, filter) => all.concat(filter.parameters), [])
		};
	}

	function buildKeysetAfterFilter(meta, pk) {
		const clauses = [];
		const parameters = [];
		for (let i = 0; i < meta.pkColumns.length; i++) {
			const parts = [];
			for (let j = 0; j < i; j++) {
				parts.push(`${quoteIdent(meta.pkColumns[j].dbName)} = ?`);
				parameters.push(pk[j]);
			}
			parts.push(`${quoteIdent(meta.pkColumns[i].dbName)} > ?`);
			parameters.push(pk[i]);
			clauses.push(`(${parts.join(' AND ')})`);
		}
		return {
			sql: clauses.join(' OR '),
			parameters
		};
	}

	function normalizePrimaryKeyToken(value) {
		return Array.isArray(value) ? value : null;
	}

	function normalizeSnapshotUpperPks(value, tableNames) {
		if (!value || value !== Object(value))
			return null;
		const result = {};
		for (let i = 0; i < tableNames.length; i++) {
			const tableName = tableNames[i];
			if (!Object.prototype.hasOwnProperty.call(value, tableName))
				continue;
			result[tableName] = value[tableName] === null
				? null
				: normalizePrimaryKeyToken(value[tableName]);
		}
		return result;
	}

	function getSnapshotUpperPk(upperPks, tableName) {
		if (!upperPks || upperPks !== Object(upperPks))
			return undefined;
		if (!Object.prototype.hasOwnProperty.call(upperPks, tableName))
			return undefined;
		return normalizePrimaryKeyToken(upperPks[tableName]);
	}

	function clamp(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}

	function quoteQualified(name) {
		return String(name).split('.').map(quoteIdent).join('.');
	}

	function quoteIdent(name) {
		return `"${String(name).replace(/"/g, '""')}"`;
	}

	function sqlStringLiteral(value) {
		return `'${String(value).replace(/'/g, '\'\'')}'`;
	}

	function sqlJsonLiteral(value) {
		return `${sqlStringLiteral(stringify(value))}::jsonb`;
	}

	sync = newSyncHandler;
	return sync;
}

var hostExpress_1;
var hasRequiredHostExpress;

function requireHostExpress () {
	if (hasRequiredHostExpress) return hostExpress_1;
	hasRequiredHostExpress = 1;
	const getTSDefinition = requireGetTSDefinition();
	// let hostLocal = _hostLocal;
	const getMeta = requireGetMeta();
	const newSyncHandler = requireSync();

	function hostExpress(hostLocal, client, options = {}) {
		if ('db' in options && (options.db ?? undefined) === undefined || !client.db)
			throw new Error('No db specified');
		const dbOptions = { db: options.db || client.db };
		const commandHandlers = options.commands || client.__commands || {};
		let c = {};
		const readonly = { readonly: options.readonly};
		const sharedHooks = options.hooks;
		for (let tableName in client.tables) {
			const tableOptions = options[tableName] || {};
			const hooks = tableOptions.hooks || sharedHooks;
			c[tableName] = hostLocal({
				...dbOptions,
				...readonly,
				...tableOptions,
				table: client.tables[tableName],
				isHttp: true,
				client,
				hooks

			});
		}
		const syncHandler = newSyncHandler(client, {
			...options,
			sync: options.sync && {
				...options.sync,
				commands: options.sync.commands || commandHandlers
			}
		});

		async function handler(req, res) {
			if (req.method === 'POST')
				return post.apply(null, arguments);
			if (req.method === 'PATCH')
				return patch.apply(null, arguments);
			if (req.method === 'GET')
				return get.apply(null, arguments);
			if (req.method === 'OPTIONS')
				return handleOptions(req, res); // assuming the second argument is `response`

			else
				res.status(405).set('Allow', 'GET, POST, PATCH, OPTIONS').send('Method Not Allowed');
		}

		handler.db = handler;
		handler.dts = get;

		function get(request, response) {
			try {
				if (request.query.table) {
					if (!(request.query.table in c)) {
						let e = new Error('Table is not exposed or does not exist');
						// @ts-ignore
						e.status = 400;
						throw e;
					}

					const result = getMeta(client.tables[request.query.table]);
					response.setHeader('content-type', 'text/plain');
					response.status(200).send(result);
				}
				else {
					const isNamespace = request.query.isNamespace === 'true';
					let tsArg = Object.keys(c).map(x => {
						return { table: client.tables[x], customFilters: options?.tables?.[x].customFilters, name: x };
					});
					response.setHeader('content-type', 'text/plain');
					response.status(200).send(getTSDefinition(tsArg, { isNamespace, isHttp: true }));
				}
			}
			catch (e) {
				if (e.status === undefined)
					response.status(500).send(e.message || e);
				else
					response.status(e.status).send(e.message);
			}
		}

		async function patch(request, response) {
			try {
				response.json(await c[request.query.table].patch(request.body, request, response));
			}
			catch (e) {
				if (e.status === undefined)
					response.status(500).send(e.message || e);
				else
					response.status(e.status).send(e.message);

			}
		}

		async function post(request, response) {
			try {
				if (request.query.sync) {
					if (!syncHandler) {
						const e = new Error('Sync is not enabled for this endpoint');
						// @ts-ignore
						e.status = 404;
						throw e;
					}
					return syncHandler(request, response);
				}
				if (request.query.command)
					return runCommand(request, response);
				if (!request.query.table) {
					let e = new Error('Table not defined');
					// @ts-ignore
					e.status = 400;
					throw e;
				}
				else if (!(request.query.table in c)) {
					let e = new Error('Table is not exposed or does not exist');
					// @ts-ignore
					e.status = 400;
					throw e;
				}

				response.json(await c[request.query.table].post(request.body, request, response));
			}
			catch (e) {
				if (e.status === undefined)
					response.status(500).send(e.message || e);
				else
					response.status(e.status).send(e.message);
			}

		}

		async function runCommand(request, response) {
			const name = request.query.command;
			const fn = typeof name === 'string' ? commandHandlers[name] : null;
			if (typeof fn !== 'function') {
				const e = new Error(`Command "${name}" is not registered`);
				// @ts-ignore
				e.status = 400;
				throw e;
			}
			const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body || {};
			const args = normalizeCommandArgs(body.args);
			let result;
			await client.transaction(async (tx) => {
				result = await fn(tx, args);
			});
			response.json(result === undefined ? null : result);
		}

		function handleOptions(req, response) {
			response.setHeader('Access-Control-Allow-Origin', '*'); // Adjust this as per your CORS needs
			response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS'); // And any other methods you support
			response.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // And any other headers you expect in requests
			response.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight request for a day. Adjust as you see fit
			response.status(204).send(); // 204 No Content response for successful OPTIONS requests
		}

		return handler;
	}

	function normalizeCommandArgs(args) {
		if (args === undefined)
			return null;
		return JSON.parse(JSON.stringify(args));
	}

	hostExpress_1 = hostExpress;
	return hostExpress_1;
}

var hostHono_1;
var hasRequiredHostHono;

function requireHostHono () {
	if (hasRequiredHostHono) return hostHono_1;
	hasRequiredHostHono = 1;
	const getTSDefinition = requireGetTSDefinition();
	const getMeta = requireGetMeta();

	function hostHono(hostLocal, client, options = {}) {
		if ('db' in options && (options.db ?? undefined) === undefined || !client.db)
			throw new Error('No db specified');
		const dbOptions = { db: options.db || client.db };
		let c = {};
		const readonly = { readonly: options.readonly };
		const sharedHooks = options.hooks;
		for (let tableName in client.tables) {
			const tableOptions = options[tableName] || {};
			const hooks = tableOptions.hooks || sharedHooks;
			c[tableName] = hostLocal({
				...dbOptions,
				...readonly,
				...tableOptions,
				table: client.tables[tableName],
				isHttp: true,
				client,
				hooks
			});
		}

		async function handler(ctx) {
			const request = createRequest(ctx);
			const response = createResponse();

			try {
				if (request.method === 'POST')
					return await post(request, response);
				if (request.method === 'PATCH')
					return await patch(request, response);
				if (request.method === 'GET')
					return get(request, response);
				if (request.method === 'OPTIONS')
					return handleOptions(response);
				return response
					.status(405)
					.setHeader('Allow', 'GET, POST, PATCH, OPTIONS')
					.send('Method Not Allowed');
			}
			catch (e) {
				if (e.status === undefined)
					return response.status(500).send(e.message || e);
				return response.status(e.status).send(e.message);
			}
		}

		handler.db = handler;
		handler.dts = get;

		function get(request, response) {
			if (request.query.table) {
				if (!(request.query.table in c)) {
					let e = new Error('Table is not exposed or does not exist');
					// @ts-ignore
					e.status = 400;
					throw e;
				}

				const result = getMeta(client.tables[request.query.table]);
				response.setHeader('content-type', 'text/plain');
				return response.status(200).send(result);
			}
			const isNamespace = request.query.isNamespace === 'true';
			let tsArg = Object.keys(c).map(x => {
				return { table: client.tables[x], customFilters: options?.tables?.[x].customFilters, name: x };
			});
			response.setHeader('content-type', 'text/plain');
			return response.status(200).send(getTSDefinition(tsArg, { isNamespace, isHttp: true }));
		}

		async function patch(request, response) {
			const table = request.query.table;
			const body = await request.json();
			return response.json(await c[table].patch(body, request, response));
		}

		async function post(request, response) {
			if (!request.query.table) {
				let e = new Error('Table not defined');
				// @ts-ignore
				e.status = 400;
				throw e;
			}
			if (!(request.query.table in c)) {
				let e = new Error('Table is not exposed or does not exist');
				// @ts-ignore
				e.status = 400;
				throw e;
			}

			const body = await request.json();
			return response.json(await c[request.query.table].post(body, request, response));
		}

		function handleOptions(response) {
			response.setHeader('Access-Control-Allow-Origin', '*');
			response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
			response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
			response.setHeader('Access-Control-Max-Age', '86400');
			return response.status(204).send('');
		}

		function createRequest(ctx) {
			let bodyPromise;
			const query = Object.fromEntries(new URL(ctx.req.url).searchParams.entries());
			const headers = {};
			for (const [name, value] of ctx.req.raw.headers.entries())
				headers[name] = value;
			return {
				method: ctx.req.method,
				query,
				headers,
				json: async () => {
					if (!bodyPromise)
						bodyPromise = ctx.req.json();
					return bodyPromise;
				}
			};
		}

		function createResponse() {
			let statusCode = 200;
			const headers = new Headers();
			return {
				status(code) {
					statusCode = code;
					return this;
				},
				setHeader(name, value) {
					headers.set(name, value);
					return this;
				},
				json(value) {
					if (!headers.has('content-type'))
						headers.set('content-type', 'application/json');
					return new Response(JSON.stringify(value), { status: statusCode, headers });
				},
				send(value) {
					if (typeof value === 'string') {
						if (!headers.has('content-type'))
							headers.set('content-type', 'text/plain');
						return new Response(value, { status: statusCode, headers });
					}
					if (!headers.has('content-type'))
						headers.set('content-type', 'application/json');
					return new Response(JSON.stringify(value), { status: statusCode, headers });
				}
			};
		}

		return handler;
	}

	hostHono_1 = hostHono;
	return hostHono_1;
}

var require$$0$1 = /*@__PURE__*/getDefaultExportFromNamespaceIfPresent(fastJsonPatch);

var newMemoryId;
var hasRequiredNewMemoryId;

function requireNewMemoryId () {
	if (hasRequiredNewMemoryId) return newMemoryId;
	hasRequiredNewMemoryId = 1;
	let nextId = 1;

	newMemoryId = function newMemoryId() {
		return `tmp${nextId++}`;
	};
	return newMemoryId;
}

var createPatch;
var hasRequiredCreatePatch;

function requireCreatePatch () {
	if (hasRequiredCreatePatch) return createPatch;
	hasRequiredCreatePatch = 1;
	const jsonpatch = require$$0$1;
	let dateToIsoString = requireDateToISOString();
	let stringify = requireStringify();
	let newMemoryId = requireNewMemoryId();

	createPatch = function createPatch(original, dto, options) {
		let subject = toCompareObject({ d: original }, options, true);
		let clonedDto = toCompareObject({ d: dto }, options, true);
		let keyPositionMap = toKeyPositionMap(dto);
		let observer = jsonpatch.observe(subject);
		subject.d = clonedDto.d;
		let changes = jsonpatch.generate(observer);
		let clonedOriginal = toCompareObject(original, options);
		let {inserted, deleted, updated}  = splitChanges(changes);
		updated.sort(comparePatch);
		return [...inserted, ...updated, ...deleted];

		function splitChanges(changes) {
			let inserted = [];
			let deleted = [];
			let updated = [];
			for (let change of changes) {
				change.path = change.path.substring(2);
				if (change.op === 'add' && change.path.split('/').length === 2) {
					inserted.push(change);
				}
				else if (change.op === 'remove' && change.path.split('/').length === 2) {
					addOldValue(change);
					deleted.push(change);
				} else {
					addOldValue(change);
					updated.push(change);
				}
			}
			return { inserted, updated, deleted};
		}

		function addOldValue(change) {
			if (change.op === 'remove' || change.op === 'replace') {
				let splitPath = change.path.split('/');
				splitPath.shift();
				change.oldValue = splitPath.reduce(extract, clonedOriginal);
			}
			else
				return change;

			function extract(obj, element) {
				return obj[element];
			}

			return change;
		}

		function toKeyPositionMap(rows) {
			return rows.reduce((map, element, i) => {
				if (options && options.keys && element === Object(element)) {
					let key = [];
					for (let i = 0; i < options.keys.length; i++) {
						let keyName = options.keys[i].name;
						key.push(negotiateTempKey(element[keyName]));
					}
					map[stringify(key)] = i;
				}
				else if ('id' in element)
					map[stringify([element.id])] = i;
				else
					map[i] = i;
				return map;
			}, {});

		}

		function toCompareObject(object, options, isRoot) {
			if (Array.isArray(object)) {
				let copy = { __patchType: 'Array' };
				for (let i = 0; i < object.length; i++) {
					let element = toCompareObject(object[i], options);
					if (options && options.keys && element === Object(element)) {
						let key = [];
						for (let i = 0; i < options.keys.length; i++) {
							let keyName = options.keys[i].name;
							key.push(negotiateTempKey(element[keyName]));
						}
						copy[stringify(key)] = element;
					}
					else if (element === Object(element) && 'id' in element)
						copy[stringify([element.id])] = element;
					else
						copy[i] = element;
				}
				return copy;
			}
			else if (typeof object === 'bigint')
				return object.toString();
			else if (isValidDate(object))
				return dateToIsoString(object);
			else if (object === Object(object)) {
				let copy = {};
				for (let name in object) {
					copy[name] = toCompareObject(object[name], isRoot ? options : options && options.relations && options.relations[name]);
				}
				return copy;
			}
			return object;
		}

		function isValidDate(d) {
			return d instanceof Date && !isNaN(d);
		}

		function negotiateTempKey(value) {
			if (value === undefined)
				return `~${newMemoryId()}`;
			else
				return value;
		}

		function comparePatch(a, b) {
			const aPathArray = a.path.split('/');
			const bPathArray = b.path.split('/');
			return (aPathArray.length - bPathArray.length) || (keyPositionMap[aPathArray[1]] ?? Infinity - keyPositionMap[bPathArray[1]] ?? Infinity) || a.path.localeCompare(b.path);
		}

	};
	return createPatch;
}

var extractSql;
var hasRequiredExtractSql;

function requireExtractSql () {
	if (hasRequiredExtractSql) return extractSql;
	hasRequiredExtractSql = 1;
	function extract(sql) {
		if (sql && typeof(sql) === 'function')
			return sql();
		else if (sql === undefined)
			return '';
		else
			return sql;
	}

	extractSql = extract;
	return extractSql;
}

var extractParameters;
var hasRequiredExtractParameters;

function requireExtractParameters () {
	if (hasRequiredExtractParameters) return extractParameters;
	hasRequiredExtractParameters = 1;
	function extract(parameters) {
		if (parameters) {
			return parameters.slice(0);
		}
		return [];
	}

	extractParameters = extract;
	return extractParameters;
}

var newParameterized_1;
var hasRequiredNewParameterized;

function requireNewParameterized () {
	if (hasRequiredNewParameterized) return newParameterized_1;
	hasRequiredNewParameterized = 1;
	var extractSql = requireExtractSql();
	var extractParameters = requireExtractParameters();

	function Parameterized(text, parameters) {
		this._text = text;
		this.parameters = parameters;
	}

	Parameterized.prototype.sql = function() {
		return this._text;
	};

	Parameterized.prototype.prepend = function(other) {
		if (other.sql) {
			var params = other.parameters.concat(this.parameters);
			return newParameterized(other.sql() + this._text, params);
		} else
			return newParameterized(other + this._text, this.parameters);
	};

	Parameterized.prototype.append = function(other) {
		if (other.sql) {
			var params = this.parameters.concat(other.parameters);
			return newParameterized(this._text + other.sql(), params);
		} else
			return newParameterized(this._text + other, this.parameters);
	};

	function newParameterized(text, parameters) {
		text = extractSql(text);
		parameters = extractParameters(parameters);
		return new Parameterized(text, parameters);
	}

	newParameterized_1 = newParameterized;
	return newParameterized_1;
}

var negotiateNextAndFilter_1;
var hasRequiredNegotiateNextAndFilter;

function requireNegotiateNextAndFilter () {
	if (hasRequiredNegotiateNextAndFilter) return negotiateNextAndFilter_1;
	hasRequiredNegotiateNextAndFilter = 1;
	function negotiateNextAndFilter(filter, other) {
		if (!other.sql())
			return filter;
		return filter.append(' AND ').append(other);
	}

	negotiateNextAndFilter_1 = negotiateNextAndFilter;
	return negotiateNextAndFilter_1;
}

var negotiateNextOrFilter_1;
var hasRequiredNegotiateNextOrFilter;

function requireNegotiateNextOrFilter () {
	if (hasRequiredNegotiateNextOrFilter) return negotiateNextOrFilter_1;
	hasRequiredNegotiateNextOrFilter = 1;
	function negotiateNextOrFilter(filter, other) {
		if (!other.sql())
			return filter;
		return filter.prepend('(').append(' OR ').append(other).append(')');
	}

	negotiateNextOrFilter_1 = negotiateNextOrFilter;
	return negotiateNextOrFilter_1;
}

var utils;
var hasRequiredUtils;

function requireUtils () {
	if (hasRequiredUtils) return utils;
	hasRequiredUtils = 1;
	const newParameterized = requireNewParameterized();
	const negotiateNextAndFilter = requireNegotiateNextAndFilter();
	const negotiateNextOrFilter = requireNegotiateNextOrFilter();

	function newBoolean(filter) {
		var c = {};
		c.sql = filter.sql.bind(filter);
		c.parameters = filter.parameters;

		c.append = function(other) {
			var nextFilter = filter.append(other);
			return newBoolean(nextFilter);
		};

		c.prepend = function(other) {
			var nextFilter = filter.prepend(other);
			return newBoolean(nextFilter);
		};

		c.and = function(context, other) {
			if (other === undefined) {
				other = context;
				context = null;
			}
			other = negotiateRawSqlFilter(context, other);
			var nextFilter = negotiateNextAndFilter(filter, other);
			var next = newBoolean(nextFilter);
			for (var i = 2; i < arguments.length; i++) {
				next = next.and(context, arguments[i]);
			}
			return next;
		};

		c.or = function(context, other) {
			if (other === undefined) {
				other = context;
				context = null;
			}
			other = negotiateRawSqlFilter(context, other);
			var nextFilter = negotiateNextOrFilter(filter, other);
			var next = newBoolean(nextFilter);
			for (var i = 2; i < arguments.length; i++) {
				next = next.or(context, arguments[i]);
			}
			return next;
		};

		c.not = function(_context) {
			var nextFilter = filter.prepend('NOT (').append(')');
			return newBoolean(nextFilter);
		};

		return c;
	}


	function negotiateRawSqlFilter(context, filter, optionalTable, emptyArrayMeansFalse) {
		if (Array.isArray(filter) && filter.length === 0) {
			const sql = emptyArrayMeansFalse ? '1 = 2' : '1 = 1';
			return newBoolean(newParameterized(sql));
		}
		else if (Array.isArray(filter)) {
			let curFilter;
			let curObjectFilter;
			for (let i = 0; i < filter.length; i++) {
				let nextFilter = negotiateRawSqlFilter(context,filter[i], optionalTable);
				if (nextFilter.isObjectFilter)
					curObjectFilter = curObjectFilter ? curObjectFilter.or(context, nextFilter) : nextFilter;
				else
					curFilter = curFilter ? curFilter.and(context, nextFilter) : nextFilter;
			}
			if (curFilter && curObjectFilter)
				return curFilter.and(context, curObjectFilter);
			else if (curFilter)
				return curFilter;
			else
				return curObjectFilter;
		}
		else {
			let params = [];
			if (filter) {
				if (filter.and)
					return filter;
				if (filter.sql) {
					let sql = filter.sql;
					if (typeof filter.sql === 'function') {
						sql = filter.sql();
					}
					params.push(sql, filter.parameters);
				}
				else if (isObjectFilter(filter, optionalTable)) {
					return newObjectFilter(context, filter, optionalTable);
				}
				else
					params = [filter];
			} else {
				params = [filter];
			}

			let parameterized = newParameterized.apply(null, params);
			return newBoolean(parameterized);
		}
	}

	function isObjectFilter(object, optionalTable) {
		return optionalTable && object;
	}

	function newObjectFilter(context, object, table) {
		let primaryColumns = table._primaryColumns;
		let filter;
		for (let i = 0; i < primaryColumns.length; i++) {
			let column = primaryColumns[i];
			let colFilter = column.equal(context, object[column.alias]);
			filter = filter  ? filter.and(context, colFilter) : colFilter ;
		}
		filter.isObjectFilter = true;
		return filter;
	}


	utils = { negotiateRawSqlFilter, newBoolean};
	return utils;
}

var negotiateRawSqlFilter_1;
var hasRequiredNegotiateRawSqlFilter;

function requireNegotiateRawSqlFilter () {
	if (hasRequiredNegotiateRawSqlFilter) return negotiateRawSqlFilter_1;
	hasRequiredNegotiateRawSqlFilter = 1;
	const { negotiateRawSqlFilter } = requireUtils();

	negotiateRawSqlFilter_1 = negotiateRawSqlFilter;
	return negotiateRawSqlFilter_1;
}

var emptyFilter_1;
var hasRequiredEmptyFilter;

function requireEmptyFilter () {
	if (hasRequiredEmptyFilter) return emptyFilter_1;
	hasRequiredEmptyFilter = 1;
	var negotiateRawSqlFilter = requireNegotiateRawSqlFilter();
	var parameterized = requireNewParameterized()('');
	function emptyFilter() {
		return emptyFilter.and.apply(null, arguments);
	}

	emptyFilter.sql = parameterized.sql.bind(parameterized);
	emptyFilter.parameters = parameterized.parameters;

	emptyFilter.and = function(context, other) {
		if (other === undefined) {
			other = context;
			context = null;
		}
		other = negotiateRawSqlFilter(context, other);
		for (var i = 2; i < arguments.length; i++) {
			other = other.and(context, arguments[i]);
		}
		return other;
	};

	emptyFilter.or = function(context, other) {
		if (other === undefined) {
			other = context;
			context = null;
		}
		other = negotiateRawSqlFilter(context, other);
		for (var i = 2; i < arguments.length; i++) {
			other = other.or(context, arguments[i]);
		}
		return other;
	};

	emptyFilter.not = function(context, other) {
		if (other === undefined) {
			other = context;
			context = null;
		}
		other = negotiateRawSqlFilter(context, other).not(context);
		for (var i = 2; i < arguments.length; i++) {
			other = other.and(context, arguments[i]);
		}
		return other;

	};

	emptyFilter_1 = emptyFilter;
	return emptyFilter_1;
}

var executePath;
var hasRequiredExecutePath;

function requireExecutePath () {
	if (hasRequiredExecutePath) return executePath;
	hasRequiredExecutePath = 1;
	const createPatch = requireCreatePatch();
	const emptyFilter = requireEmptyFilter();
	const negotiateRawSqlFilter = requireNegotiateRawSqlFilter();
	let getMeta = requireGetMeta();
	let isSafe = Symbol();

	let _allowedOps = {
		and: true,
		or: true,
		not: true,
		AND: true,
		OR: true,
		NOT: true,
		equal: true,
		eq: true,
		EQ: true,
		notEqual: true,
		ne: true,
		NE: true,
		lessThan: true,
		lt: true,
		LT: true,
		lessThanOrEqual: true,
		le: true,
		LE: true,
		greaterThan: true,
		gt: true,
		GT: true,
		greaterThanOrEqual: true,
		ge: true,
		GE: true,
		between: true,
		in: true,
		IN: true,
		startsWith: true,
		iStartsWith: true,
		endsWith: true,
		iEndsWith: true,
		contains: true,
		iContains: true,
		iEqual: true,
		iEq: true,
		ieq: true,
		IEQ: true,
		exists: true,
		all: true,
		any: true,
		none: true,
		where: true,
		sum: true,
		avg: true,
		max: true,
		min: true,
		count: true,
		groupSum: true,
		groupAvg: true,
		groupMax: true,
		groupMin: true,
		groupCount: true,
		_aggregate: true,
		self: true,
	};

	function _executePath(context, ...rest) {

		const _ops = {
			and: emptyFilter.and.bind(null, context),
			or: emptyFilter.or.bind(null, context),
			not: emptyFilter.not.bind(null, context),
			AND: emptyFilter.and.bind(null, context),
			OR: emptyFilter.or.bind(null, context),
			NOT: emptyFilter.not.bind(null, context),
		};

		return executePath(...rest);

		async function executePath({ table, JSONFilter, baseFilter, customFilters = {}, request, response, readonly, disableBulkDeletes, isHttp, client }) {
			let allowedOps = { ..._allowedOps, insert: !readonly, ...extractRelations(getMeta(table)) };
			let ops = { ..._ops, ...getCustomFilterPaths(customFilters), getManyDto, getMany, aggregate, distinct, count, delete: _delete, cascadeDelete, update, replace };

			let res = await parseFilter(JSONFilter, table);
			if (res === undefined)
				return {};
			else
				return res;

			function parseFilter(json, table) {
				if (isFilter(json)) {
					let subFilters = [];

					let anyAllNone = tryGetAnyAllNone(json.path, table);
					if (anyAllNone) {
						const arg0 = json.args[0];
						if (isHttp && arg0 !== undefined)
							validateArgs(arg0);
						const f = arg0 === undefined
							? anyAllNone(context)
							: anyAllNone(context, x => parseFilter(arg0, x));
						if(!('isSafe' in f))
							f.isSafe = isSafe;
						return f;
					}
					else {
						for (let i = 0; i < json.args.length; i++) {
							subFilters.push(parseFilter(json.args[i], nextTable(json.path, table)));
						}
					}
					return executePath(json.path, subFilters);
				}
				else if (Array.isArray(json)) {
					const result = [];
					for (let i = 0; i < json.length; i++) {
						result.push(parseFilter(json[i], table));
					}
					return result;
				}
				else if (isColumnRef(json)) {
					return resolveColumnRef(table, json.__columnRef);
				}
				return json;

				function tryGetAnyAllNone(path, table) {
					const parts = path.split('.');
					for (let i = 0; i < parts.length; i++) {
						table = table[parts[i]];
					}

					let ops = new Set(['all', 'any', 'none', 'where', '_aggregate']);
					// let ops = new Set(['all', 'any', 'none', 'where']);
					let last = parts[parts.length - 1];
					if (last === 'count' && parts.length > 1)
						ops.add('count');
					if (ops.has(last) || (table && (table._primaryColumns || (table.any && table.all))))
						return table;
				}

				function executePath(path, args) {
					if (path in ops) {
						if (isHttp)
							validateArgs(args);
						let op = ops[path].apply(null, args);
						if (op.then)
							return op.then((o) => {
								setSafe(o);
								return o;
							});
						setSafe(op);
						return op;
					}
					let pathArray = path.split('.');
					let target = table;
					let op = pathArray[pathArray.length - 1];
					if (!allowedOps[op] && isHttp) {

						let e = new Error('Disallowed operator ' + op);
						// @ts-ignore
						e.status = 403;
						throw e;

					}
					for (let i = 0; i < pathArray.length; i++) {
						target = target[pathArray[i]];
					}

					if (!target) {
						const left = args && args[0];
						if (left) {
							target = left;
							for (let i = 0; i < pathArray.length; i++) {
								target = target[pathArray[i]];
							}
							if (target) {
								let res = target.apply(null, [context].concat(args.slice(1)));
								setSafe(res);
								return res;
							}
						}
						throw new Error(`Method '${path}' does not exist`);
					}
					let res = target.apply(null, [context, ...args]);
					setSafe(res);
					return res;
				}
			}

			async function invokeBaseFilter() {
				if (typeof baseFilter === 'function') {
					const res = await baseFilter.apply(null, [bindDb(client), request, response]);
					if (!res)
						return;
					const JSONFilter = JSON.parse(JSON.stringify(res));
					//@ts-ignore
					return executePath({ table, JSONFilter, request, response });
				}
				else
					return;
			}

			function getCustomFilterPaths(customFilters) {
				return getLeafNames(customFilters);

				function getLeafNames(obj, result = {}, current = 'customFilters.') {
					for (let p in obj) {
						if (typeof obj[p] === 'object' && obj[p] !== null)
							getLeafNames(obj[p], result, current + p + '.');
						else
							result[current + p] = resolveFilter.bind(null, obj[p]);
					}
					return result;
				}

				async function resolveFilter(fn, ...args) {
					const context = { db: bindDb(client), request, response };
					let res = fn.apply(null, [context, ...args]);
					if (res.then)
						res = await res;
					const JSONFilter = JSON.parse(JSON.stringify(res));
					//@ts-ignore
					return executePath({ table, JSONFilter, request, response });
				}
			}

			function nextTable(path, table) {
				path = path.split('.');
				let ops = new Set(['all', 'any', 'none', 'count']);
				let last = path.slice(-1)[0];
				if (ops.has(last)) {
					for (let i = 0; i < path.length - 1; i++) {
						table = table[path[i]];
					}
					return table;
				}
				else {
					let lastObj = table;
					for (let i = 0; i < path.length; i++) {
						if (lastObj)
							lastObj = lastObj[path[i]];
					}
					if (lastObj?._shallow)
						return lastObj._shallow;
					else return table;
				}
			}

			async function _delete(filter) {
				if (readonly || disableBulkDeletes) {
					let e = new Error('Bulk deletes are not allowed. Parameter "disableBulkDeletes" must be true.');
					// @ts-ignore
					e.status = 403;
					throw e;
				}
				filter = negotiateFilter(filter);
				const _baseFilter = await invokeBaseFilter();
				if (_baseFilter)
					filter = filter.and(context, _baseFilter);
				let args = [context, filter].concat(Array.prototype.slice.call(arguments).slice(1));
				return table.delete.apply(null, args);
			}

			async function cascadeDelete(filter) {
				if (readonly || disableBulkDeletes) {
					const e = new Error('Bulk deletes are not allowed. Parameter "disableBulkDeletes" must be true.');
					// @ts-ignore
					e.status = 403;
					throw e;

				}
				filter = negotiateFilter(filter);
				const _baseFilter = await invokeBaseFilter();
				if (_baseFilter)
					filter = filter.and(context, _baseFilter);
				let args = [context, filter].concat(Array.prototype.slice.call(arguments).slice(1));
				return table.cascadeDelete.apply(null, args);
			}

			function negotiateFilter(filter) {
				if (filter)
					return negotiateRawSqlFilter(context, filter, table, true);
				else
					return emptyFilter;
			}

			async function count(filter, strategy) {
				validateStrategy(table, strategy);
				filter = negotiateFilter(filter);
				const _baseFilter = await invokeBaseFilter();
				if (_baseFilter)
					filter = filter.and(context, _baseFilter);
				let args = [context, filter].concat(Array.prototype.slice.call(arguments).slice(1));
				return table.count.apply(null, args);
			}

			async function getManyDto(filter, strategy) {
				validateStrategy(table, strategy);
				filter = negotiateFilter(filter);
				const _baseFilter = await invokeBaseFilter();
				if (_baseFilter)
					filter = filter.and(context, _baseFilter);
				let args = [context, filter].concat(Array.prototype.slice.call(arguments).slice(1));
				await negotiateWhereAndAggregate(strategy);
				return table.getManyDto.apply(null, args);
			}

			async function replace(subject, strategy = { insertAndForget: true }) {
				validateStrategy(table, strategy);
				const refinedStrategy = objectToStrategy(subject, {}, table);
				const JSONFilter2 = {
					path: 'getManyDto',
					args: [subject, refinedStrategy]
				};
				const originals = await executePath({ table, JSONFilter: JSONFilter2, baseFilter, customFilters, request, response, readonly, disableBulkDeletes, isHttp, client });
				const meta = getMeta(table);
				const patch = createPatch(originals, Array.isArray(subject) ? subject : [subject], meta);
				const { changed } = await table.patch(context, patch, { strategy });
				if (Array.isArray(subject))
					return changed;
				else
					return changed[0];
			}

			async function update(subject, whereStrategy, strategy = { insertAndForget: true }) {
				validateStrategy(table, strategy);
				const refinedWhereStrategy = objectToStrategy(subject, whereStrategy, table);
				const JSONFilter2 = {
					path: 'getManyDto',
					args: [null, refinedWhereStrategy]
				};
				const rows = await executePath({ table, JSONFilter: JSONFilter2, baseFilter, customFilters, request, response, readonly, disableBulkDeletes, isHttp, client });
				const originals = new Array(rows.length);
				for (let i = 0; i < rows.length; i++) {
					const row = rows[i];
					originals[i] = { ...row };
					for (let p in subject) {
						row[p] = subject[p];
					}
				}
				const meta = getMeta(table);
				const patch = createPatch(originals, rows, meta);
				const { changed } = await table.patch(context, patch, { strategy });
				return changed;
			}

			function objectToStrategy(object, whereStrategy, table, strategy = {}) {
				strategy = { ...whereStrategy, ...strategy };
				if (Array.isArray(object)) {
					for (let i = 0; i < object.length; i++) {
						objectToStrategy(object[i], table, strategy);
					}
					return;
				}
				for (let name in object) {
					const relation = table[name]?._relation;
					if (relation && !relation.columns) {//notJoin, that is one or many
						strategy[name] = {};
						objectToStrategy(object[name], whereStrategy?.[name], table[name], strategy[name]);
					}
					else
						strategy[name] = true;
				}
				return strategy;
			}


			async function aggregate(filter, strategy) {
				validateStrategy(table, strategy);
				filter = negotiateFilter(filter);
				const _baseFilter = await invokeBaseFilter();
				if (_baseFilter)
					filter = filter.and(context, _baseFilter);
				let args = [context, filter].concat(Array.prototype.slice.call(arguments).slice(1));
				await negotiateWhereAndAggregate(strategy);
				return table.aggregate.apply(null, args);
			}

			async function distinct(filter, strategy) {
				validateStrategy(table, strategy);
				filter = negotiateFilter(filter);
				const _baseFilter = await invokeBaseFilter();
				if (_baseFilter)
					filter = filter.and(context, _baseFilter);
				let args = [context, filter].concat(Array.prototype.slice.call(arguments).slice(1));
				await negotiateWhereAndAggregate(strategy);
				return table.distinct.apply(null, args);
			}



			async function negotiateWhereAndAggregate(strategy) {
				if (typeof strategy !== 'object')
					return;

				for (let name in strategy) {
					const target = strategy[name];
					if (isFilter(target))
						strategy[name] = await parseFilter(strategy[name], table);
					else
						await negotiateWhereAndAggregate(strategy[name]);
				}

			}

			async function getMany(filter, strategy) {
				validateStrategy(table, strategy);
				filter = negotiateFilter(filter);
				const _baseFilter = await invokeBaseFilter();
				if (_baseFilter)
					filter = filter.and(context, _baseFilter);
				let args = [context, filter].concat(Array.prototype.slice.call(arguments).slice(1));
				await negotiateWhereAndAggregate(strategy);
				return table.getMany.apply(null, args);
			}

		}

		function validateStrategy(table, strategy) {
			if (!strategy || !table)
				return;

			for (let p in strategy) {
				validateOffset(strategy);
				validateLimit(strategy);
				validateOrderBy(table, strategy);
				validateStrategy(table[p], strategy[p]);
			}
		}

		function validateLimit(strategy) {
			if (!('limit' in strategy) || Number.isInteger(strategy.limit))
				return;
			const e = new Error('Invalid limit: ' + strategy.limit);
			// @ts-ignore
			e.status = 400;
		}

		function validateOffset(strategy) {
			if (!('offset' in strategy) || Number.isInteger(strategy.offset))
				return;
			const e = new Error('Invalid offset: ' + strategy.offset);
			// @ts-ignore
			e.status = 400;
			throw e;
		}

		function validateOrderBy(table, strategy) {
			if (!('orderBy' in strategy) || !table)
				return;
			let orderBy = strategy.orderBy;
			if (!Array.isArray(orderBy))
				orderBy = [orderBy];
			orderBy.reduce(validate, []);

			function validate(_, element) {
				let parts = element.split(' ').filter(x => {
					x = x.toLowerCase();
					return (!(x === '' || x === 'asc' || x === 'desc'));
				});
				for (let p of parts) {
					let col = table[p];
					if (!(col && col.equal)) {
						const e = new Error('Unknown column: ' + p);
						// @ts-ignore
						e.status = 400;
						throw e;
					}
				}
			}
		}

		function validateArgs() {
			for (let i = 0; i < arguments.length; i++) {
				const filter = arguments[i];
				if (!filter)
					continue;
				if (filter && filter.isSafe === isSafe)
					continue;
				if (filter.sql || typeof (filter) === 'string') {
					const e = new Error('Raw filters are disallowed');
					// @ts-ignore
					e.status = 403;
					throw e;
				}
				if (Array.isArray(filter))
					for (let i = 0; i < filter.length; i++) {

						validateArgs(filter[i]);
					}
			}

		}

		function isFilter(json) {
			return json instanceof Object && 'path' in json && 'args' in json;
		}

		function isColumnRef(json) {
			return json instanceof Object && typeof json.__columnRef === 'string';
		}

		function resolveColumnRef(table, path) {
			let current = table;
			const parts = path.split('.');
			for (let i = 0; i < parts.length; i++) {
				if (current)
					current = current[parts[i]];
			}

			if (!current || typeof current._toFilterArg !== 'function') {
				let e = new Error(`Column reference '${path}' is invalid`);
				// @ts-ignore
				e.status = 400;
				throw e;
			}
			return current;
		}

		function setSafe(o) {
			if (o instanceof Object)
				Object.defineProperty(o, 'isSafe', {
					value: isSafe,
					enumerable: false

				});
		}

		function extractRelations(obj) {
			let flattened = {};

			function helper(relations) {
				Object.keys(relations).forEach(key => {

					flattened[key] = true;

					if (typeof relations[key] === 'object' && Object.keys(relations[key]?.relations)?.length > 0) {
						helper(relations[key].relations);
					}
				});
			}

			helper(obj.relations);

			return flattened;
		}

		function bindDb(client) {
			var domain = context;
			let p = domain.run(() => true);

			function run(fn) {
				return p.then(domain.run.bind(domain, fn));
			}

			return client({ transaction: run });

		}
	}
	executePath = _executePath;
	return executePath;
}

var tryGetSessionContext_1;
var hasRequiredTryGetSessionContext;

function requireTryGetSessionContext () {
	if (hasRequiredTryGetSessionContext) return tryGetSessionContext_1;
	hasRequiredTryGetSessionContext = 1;
	function tryGetSessionContext(context) {
		if (context)
			return context.rdb;
	}

	tryGetSessionContext_1 = tryGetSessionContext;
	return tryGetSessionContext_1;
}

var getSessionContext_1;
var hasRequiredGetSessionContext;

function requireGetSessionContext () {
	if (hasRequiredGetSessionContext) return getSessionContext_1;
	hasRequiredGetSessionContext = 1;
	let tryGetSessionContext = requireTryGetSessionContext();

	function getSessionContext(context) {
		const rdb = tryGetSessionContext(context);
		if (!rdb)
			throw new Error('Rdb transaction is no longer available. Is promise chain broken ?');
		return rdb;
	}

	getSessionContext_1 = getSessionContext;
	return getSessionContext_1;
}

var setSessionSingleton_1;
var hasRequiredSetSessionSingleton;

function requireSetSessionSingleton () {
	if (hasRequiredSetSessionSingleton) return setSessionSingleton_1;
	hasRequiredSetSessionSingleton = 1;
	const getSessionContext = requireGetSessionContext();

	function setSessionSingleton(context, name, value) {
		const rdb = getSessionContext(context);
		rdb[name] = value;
	}

	setSessionSingleton_1 = setSessionSingleton;
	return setSessionSingleton_1;
}

var getSessionSingleton;
var hasRequiredGetSessionSingleton;

function requireGetSessionSingleton () {
	if (hasRequiredGetSessionSingleton) return getSessionSingleton;
	hasRequiredGetSessionSingleton = 1;
	var getSessionContext = requireGetSessionContext();

	getSessionSingleton = function(context, name) {
		const rdb = getSessionContext(context);
		return rdb[name];
	};
	return getSessionSingleton;
}

var negotiateNullParams_1;
var hasRequiredNegotiateNullParams;

function requireNegotiateNullParams () {
	if (hasRequiredNegotiateNullParams) return negotiateNullParams_1;
	hasRequiredNegotiateNullParams = 1;
	function negotiateNullParams(query) {
		if (query && query.parameters && query.parameters.length > 0 && (query.parameters.filter(x => x === null || x === undefined).length > 0)) {
			var splitted = query.sql().split('?');
			var sql = '';
			var parameters = [];
			var lastIndex = splitted.length - 1;
			for (var i = 0; i < lastIndex; i++) {
				if (query.parameters[i] === null || query.parameters[i] === undefined)
					sql += splitted[i] + 'null';
				else {
					sql += splitted[i] + '?';
					parameters.push(query.parameters[i]);
				}
			}
			sql += splitted[lastIndex];
			return {
				sql: () => sql,
				parameters
			};

		}
		else
			return query;
	}

	negotiateNullParams_1 = negotiateNullParams;
	return negotiateNullParams_1;
}

var resolveExecuteCommand;
var hasRequiredResolveExecuteCommand;

function requireResolveExecuteCommand () {
	if (hasRequiredResolveExecuteCommand) return resolveExecuteCommand;
	hasRequiredResolveExecuteCommand = 1;
	const getSessionSingleton = requireGetSessionSingleton();
	const negotiateNullParams = requireNegotiateNullParams();

	function resolveExecuteQuery(context, query) {
		return resolve;

		function resolve(success, failed) {
			try {
				var client = getSessionSingleton(context, 'dbClient');
				query = negotiateNullParams(query);
				client.executeCommand(query, onCompleted);
			} catch (e) {
				failed(e);
			}

			function onCompleted(err, rows) {
				if (!err)
					success(rows);
				else
					failed(err);
			}
		}

	}



	resolveExecuteCommand = resolveExecuteQuery;
	return resolveExecuteCommand;
}

var executeCommand_1;
var hasRequiredExecuteCommand;

function requireExecuteCommand () {
	if (hasRequiredExecuteCommand) return executeCommand_1;
	hasRequiredExecuteCommand = 1;
	var newResolver = requireResolveExecuteCommand();

	function executeCommand(context, query) {
		var resolver = newResolver(context, query);
		return new Promise(resolver);
	}

	executeCommand_1 = executeCommand;
	return executeCommand_1;
}

var promise;
var hasRequiredPromise;

function requirePromise () {
	if (hasRequiredPromise) return promise;
	hasRequiredPromise = 1;
	function newPromise(func) {
		if (!func)
			return Promise.resolve.apply(Promise, arguments);
		return new Promise(func);
	}

	newPromise.all = Promise.all;
	promise = newPromise;
	return promise;
}

var executeChanges_1;
var hasRequiredExecuteChanges;

function requireExecuteChanges () {
	if (hasRequiredExecuteChanges) return executeChanges_1;
	hasRequiredExecuteChanges = 1;
	var executeCommand = requireExecuteCommand();
	var newPromise = requirePromise();

	function executeChanges(context, queries) {
		if (queries.length === 0)
			return newPromise();
		var i = -1;
		return execute().then(emitChanged);


		function execute() {
			i++;
			if (i + 1 === queries.length)
				return executeCommand(context, queries[i]).then(notifyListener);
			else {
				return executeCommand(context, queries[i]).then(notifyListener).then(execute);
			}
		}

		function notifyListener(result) {
			if (result && queries[i].onResult)
				queries[i].onResult(result);
		}

		async function emitChanged() {
			for (let i = 0; i < queries.length; i++) {
				if (queries[i].emitChanged)
					await Promise.all(queries[i].emitChanged());
			}
		}


	}

	executeChanges_1 = executeChanges;
	return executeChanges_1;
}

var getChangeSet_1;
var hasRequiredGetChangeSet;

function requireGetChangeSet () {
	if (hasRequiredGetChangeSet) return getChangeSet_1;
	hasRequiredGetChangeSet = 1;
	var getSessionSingleton = requireGetSessionSingleton();
	function getChangeSet(context) {
		return getSessionSingleton(context, 'changes');
	}

	getChangeSet_1 = getChangeSet;
	return getChangeSet_1;
}

var compressChanges;
var hasRequiredCompressChanges;

function requireCompressChanges () {
	if (hasRequiredCompressChanges) return compressChanges;
	hasRequiredCompressChanges = 1;
	var newParameterized = requireNewParameterized();
	var getSessionSingleton = requireGetSessionSingleton();

	function compress(context, queries) {
		var multipleStatements = getSessionSingleton(context, 'multipleStatements');
		var compressed = [];
		var queryCount = queries.length;

		for (var i = 0; i < queryCount; i++) {
			var current = queries[i];
			if (multipleStatements && current.parameters.length === 0 && !current.disallowCompress) {
				for (var i2 = i+1; i2 < queryCount; i2++) {
					var next = queries[i2];
					if (next.parameters.length > 0 || ! next.disallowCompress)
						break;
					current = newParameterized(current.sql() + ';' + next.sql());
					i++;
				}
			}
			compressed.push(current);
		}
		return compressed;
	}

	compressChanges = compress;
	return compressChanges;
}

var popChanges_1;
var hasRequiredPopChanges;

function requirePopChanges () {
	if (hasRequiredPopChanges) return popChanges_1;
	hasRequiredPopChanges = 1;
	var getChangeSet = requireGetChangeSet();
	var compressChanges = requireCompressChanges();

	function popChanges(context) {
		var changeSet = getChangeSet(context);
		var length = changeSet.length;
		if (length > 0) {
			var lastCmd = changeSet[length-1];
			if (lastCmd.endEdit)
				lastCmd.endEdit();
			var compressed = compressChanges(context, changeSet);
			changeSet.length = 0;
			return compressed;
		}
		return changeSet;

	}

	popChanges_1 = popChanges;
	return popChanges_1;
}

var resolveExecuteQuery_1;
var hasRequiredResolveExecuteQuery;

function requireResolveExecuteQuery () {
	if (hasRequiredResolveExecuteQuery) return resolveExecuteQuery_1;
	hasRequiredResolveExecuteQuery = 1;
	const getSessionSingleton = requireGetSessionSingleton();
	const negotiateNullParams = requireNegotiateNullParams();

	function resolveExecuteQuery(context, query) {
		return resolve;

		function resolve(success, failed) {
			try {
				var client = getSessionSingleton(context, 'dbClient');
				query = negotiateNullParams(query);
				client.executeQuery(query, onCompleted);
			} catch (e) {
				failed(e);
			}

			function onCompleted(err, rows) {
				if (!err)
					success(rows);
				else
					failed(err);
			}
		}

	}



	resolveExecuteQuery_1 = resolveExecuteQuery;
	return resolveExecuteQuery_1;
}

var executeQuery_1;
var hasRequiredExecuteQuery;

function requireExecuteQuery () {
	if (hasRequiredExecuteQuery) return executeQuery_1;
	hasRequiredExecuteQuery = 1;
	var newResolver = requireResolveExecuteQuery();

	function executeQuery(context, query) {
		var resolver = newResolver(context, query);
		return new Promise(resolver);
	}

	executeQuery_1 = executeQuery;
	return executeQuery_1;
}

var executeQueriesCore_1;
var hasRequiredExecuteQueriesCore;

function requireExecuteQueriesCore () {
	if (hasRequiredExecuteQueriesCore) return executeQueriesCore_1;
	hasRequiredExecuteQueriesCore = 1;
	var executeQuery = requireExecuteQuery();

	function executeQueriesCore(context, queries) {
		var promises = [];
		var chain = Promise.resolve();
		for (var i = 0; i < queries.length; i++) {
			// Serialize execution while still returning an array of promises
			var q = chain.then(function(qi) {
				return executeQuery(context, qi);
			}.bind(null, queries[i]));
			promises.push(q);
			chain = q;
		}
		return promises;
	}

	executeQueriesCore_1 = executeQueriesCore;
	return executeQueriesCore_1;
}

var executeQueries_1;
var hasRequiredExecuteQueries;

function requireExecuteQueries () {
	if (hasRequiredExecuteQueries) return executeQueries_1;
	hasRequiredExecuteQueries = 1;
	var executeChanges = requireExecuteChanges();
	var popChanges = requirePopChanges();
	var executeQueriesCore = requireExecuteQueriesCore();

	function executeQueries(context, queries) {
		var changes = popChanges(context);

		return executeChanges(context, changes).then(onDoneChanges);

		function onDoneChanges() {
			return executeQueriesCore(context, queries);
		}
	}

	executeQueries_1 = executeQueries;
	return executeQueries_1;
}

var negotiateSql_1;
var hasRequiredNegotiateSql;

function requireNegotiateSql () {
	if (hasRequiredNegotiateSql) return negotiateSql_1;
	hasRequiredNegotiateSql = 1;
	function negotiateSql(query) {
		if(typeof(query) === 'string')
			return function() { return query; };

		var sql = query.sql;
		if(typeof(sql) === 'function')
			return sql;
		else if(typeof(sql) === 'string')
			return function() { return sql; };
		else
			throw new Error('Query lacks sql property string or function');
	}

	negotiateSql_1 = negotiateSql;
	return negotiateSql_1;
}

var negotiateParameters_1;
var hasRequiredNegotiateParameters;

function requireNegotiateParameters () {
	if (hasRequiredNegotiateParameters) return negotiateParameters_1;
	hasRequiredNegotiateParameters = 1;
	function negotiateParameters(parameters) {
		if(parameters === undefined)
			return [];
		else if(parameters.length !== undefined)
			return parameters;
		else
			throw new Error('Query has invalid parameters property. Must be undefined or array');
	}

	negotiateParameters_1 = negotiateParameters;
	return negotiateParameters_1;
}

var wrapQuery_1$3;
var hasRequiredWrapQuery$3;

function requireWrapQuery$3 () {
	if (hasRequiredWrapQuery$3) return wrapQuery_1$3;
	hasRequiredWrapQuery$3 = 1;
	var negotiateSql = requireNegotiateSql();
	var negotiateParameters = requireNegotiateParameters();

	function wrapQuery(query) {
		var safeSql = negotiateSql(query);
		var safeParameters = negotiateParameters(query.parameters);
		let obj =  {
			sql: safeSql,
			parameters: safeParameters
		};
		if (query.types)
			obj.types = query.types;
		return obj;
	}


	wrapQuery_1$3 = wrapQuery;
	return wrapQuery_1$3;
}

var query;
var hasRequiredQuery;

function requireQuery () {
	if (hasRequiredQuery) return query;
	hasRequiredQuery = 1;
	var executeQueries = requireExecuteQueries();
	var wrapQuery = requireWrapQuery$3();

	function doQuery(context, query) {
		var wrappedQuery = wrapQuery(query);
		return executeQueries(context, [wrappedQuery]).then(unwrapResult);
	}

	function unwrapResult(results) {
		return results[0];
	}

	query = doQuery;
	return query;
}

var sqliteFunction;
var hasRequiredSqliteFunction;

function requireSqliteFunction () {
	if (hasRequiredSqliteFunction) return sqliteFunction;
	hasRequiredSqliteFunction = 1;
	const executeChanges = requireExecuteChanges();
	const popChanges = requirePopChanges();
	const getSessionSingleton = requireGetSessionSingleton();

	function executeQueries(context, ...rest) {
		var changes = popChanges(context);

		return executeChanges(context, changes).then(onDoneChanges);

		function onDoneChanges() {
			var client = getSessionSingleton(context, 'dbClient');
			if (client && typeof client.function === 'function')
				return client.function.apply(client, rest);
			if (client && typeof client.createFunction === 'function')
				return client.createFunction.apply(client, rest);
			throw new Error('SQLite client does not support user-defined functions');
		}
	}

	sqliteFunction = executeQueries;
	return sqliteFunction;
}

var randomUuid_1;
var hasRequiredRandomUuid;

function requireRandomUuid () {
	if (hasRequiredRandomUuid) return randomUuid_1;
	hasRequiredRandomUuid = 1;
	function randomUuid() {
		const crypto = typeof globalThis !== 'undefined' && globalThis.crypto;
		if (crypto && typeof crypto.randomUUID === 'function')
			return crypto.randomUUID();

		const bytes = new Uint8Array(16);
		if (crypto && typeof crypto.getRandomValues === 'function') {
			crypto.getRandomValues(bytes);
		}
		else {
			for (let i = 0; i < bytes.length; i++) {
				bytes[i] = Math.floor(Math.random() * 256);
			}
		}

		bytes[6] = (bytes[6] & 0x0f) | 0x40;
		bytes[8] = (bytes[8] & 0x3f) | 0x80;

		const hex = [];
		for (let i = 0; i < 256; i++) {
			hex[i] = (i + 0x100).toString(16).slice(1);
		}
		return [
			hex[bytes[0]], hex[bytes[1]], hex[bytes[2]], hex[bytes[3]], '-',
			hex[bytes[4]], hex[bytes[5]], '-',
			hex[bytes[6]], hex[bytes[7]], '-',
			hex[bytes[8]], hex[bytes[9]], '-',
			hex[bytes[10]], hex[bytes[11]], hex[bytes[12]], hex[bytes[13]], hex[bytes[14]], hex[bytes[15]]
		].join('');
	}

	randomUuid_1 = randomUuid;
	return randomUuid_1;
}

var outboxTableSql_1;
var hasRequiredOutboxTableSql;

function requireOutboxTableSql () {
	if (hasRequiredOutboxTableSql) return outboxTableSql_1;
	hasRequiredOutboxTableSql = 1;
	function outboxTableSql(tableName = 'orange_sync_outbox') {
		return [
			`CREATE TABLE IF NOT EXISTS "${tableName}" (`,
			'"mutation_id" TEXT PRIMARY KEY,',
			'"table_name" TEXT NOT NULL,',
			'"patch_json" TEXT NOT NULL,',
			'"options_json" TEXT,',
			'"created_at_ms" INTEGER NOT NULL,',
			'"operation_id" TEXT,',
			'"operation_name" TEXT,',
			'"operation_json" TEXT,',
			'"status" TEXT NOT NULL DEFAULT \'pending\',',
			'"last_error" TEXT,',
			'"attempts" INTEGER NOT NULL DEFAULT 0,',
			'"pushed_at_ms" INTEGER,',
			'"result_json" TEXT,',
			'CHECK ("status" IN (\'pending\', \'pushed\', \'failed\'))',
			');'
		].join(' ');
	}

	outboxTableSql_1 = outboxTableSql;
	return outboxTableSql_1;
}

var crossTabLock;
var hasRequiredCrossTabLock;

function requireCrossTabLock () {
	if (hasRequiredCrossTabLock) return crossTabLock;
	hasRequiredCrossTabLock = 1;
	const randomUuid = requireRandomUuid();

	async function runWithCrossTabLock(name, config, fn) {
		const lockConfig = config || { enabled: true };
		if (!lockConfig.enabled)
			return fn();
		const locks = getWebLocks();
		if (locks)
			return runWithWebLock(locks, name, lockConfig, fn);
		const storage = getLocalStorage();
		if (storage)
			return runWithLocalStorageLock(storage, name, lockConfig, fn);
		return fn();
	}

	async function acquireCrossTabLock(name, config) {
		const lockConfig = config || { enabled: true };
		if (!lockConfig.enabled)
			return noop;

		let releaseHold;
		const hold = new Promise((resolve) => {
			releaseHold = resolve;
		});
		let resolveAcquired;
		let rejectAcquired;
		const acquired = new Promise((resolve, reject) => {
			resolveAcquired = resolve;
			rejectAcquired = reject;
		});
		const request = runWithCrossTabLock(name, {
			...lockConfig,
			releaseOnPageHide: false
		}, async () => {
			resolveAcquired();
			await hold;
		});
		request.catch(rejectAcquired);
		await acquired;

		let released = false;
		return function releaseCrossTabLock() {
			if (released)
				return;
			released = true;
			releaseHold();
			request.catch(() => {});
		};
	}

	function normalizeCrossTabLockConfig(value) {
		if (value === false)
			return { enabled: false };
		if (value === true || value === undefined || value === null)
			return { enabled: true };
		if (typeof value === 'string')
			return { enabled: true, name: value };
		if (value !== Object(value))
			throw new Error('Invalid sqlite sync crossTabLock configuration');
		return {
			enabled: value.enabled !== false,
			name: typeof value.name === 'string' && value.name.length > 0 ? value.name : undefined,
			timeoutMs: normalizePositiveInteger(value.timeoutMs),
			maxHoldMs: normalizePositiveInteger(value.maxHoldMs),
			staleMs: normalizePositiveInteger(value.staleMs),
			pollMs: normalizePositiveInteger(value.pollMs)
		};
	}

	function getWebLocks() {
		const nav = typeof globalThis !== 'undefined' ? globalThis.navigator : undefined;
		return nav && nav.locks && typeof nav.locks.request === 'function'
			? nav.locks
			: null;
	}

	async function runWithWebLock(locks, name, config, fn) {
		const options = { mode: 'exclusive' };
		const timeoutMs = config.timeoutMs;
		let timeoutId;
		let waiting = true;
		let timedOut = false;
		if (timeoutMs && typeof AbortController === 'function') {
			const controller = new AbortController();
			options.signal = controller.signal;
			timeoutId = setTimeout(() => {
				if (!waiting)
					return;
				timedOut = true;
				controller.abort();
			}, timeoutMs);
		}
		try {
			return await locks.request(name, options, async () => {
				waiting = false;
				if (timeoutId) {
					clearTimeout(timeoutId);
					timeoutId = undefined;
				}
				return runLockBody(name, config, fn);
			});
		}
		catch (e) {
			if (timedOut || e && e.name === 'AbortError')
				throw lockTimeoutError(name, timeoutMs, config);
			throw e;
		}
		finally {
			if (timeoutId)
				clearTimeout(timeoutId);
		}
	}

	function getLocalStorage() {
		if (typeof globalThis === 'undefined' || !globalThis.localStorage)
			return null;
		try {
			const key = 'orange-orm:sync-lock-probe';
			globalThis.localStorage.setItem(key, '1');
			globalThis.localStorage.removeItem(key);
			return globalThis.localStorage;
		}
		catch (_e) {
			return null;
		}
	}

	async function runWithLocalStorageLock(storage, name, config, fn) {
		const lock = await acquireLocalStorageLock(storage, name, config);
		const renewIntervalMs = Math.max(250, Math.floor(lock.staleMs / 3));
		const intervalId = setInterval(() => {
			try {
				renewLocalStorageLock(storage, lock);
			}
			catch (_e) {
				// A failed renewal will let another tab take the lock after staleMs.
			}
		}, renewIntervalMs);
		try {
			return await runLockBody(name, config, fn);
		}
		finally {
			clearInterval(intervalId);
			releaseLocalStorageLock(storage, lock);
		}
	}

	async function runLockBody(name, config, fn) {
		const operation = Promise.resolve().then(fn);
		operation.catch(() => {});
		const races = [operation];
		const cleanup = [];
		const maxHoldMs = normalizePositiveInteger(config && config.maxHoldMs);
		if (maxHoldMs) {
			races.push(new Promise((_resolve, reject) => {
				const timeoutId = setTimeout(() => reject(lockHoldTimeoutError(name, maxHoldMs, config)), maxHoldMs);
				cleanup.push(() => clearTimeout(timeoutId));
			}));
		}
		if (!config || config.releaseOnPageHide !== false) {
			const pageHide = createPageHideLockRelease(name, config);
			if (pageHide) {
				races.push(pageHide.promise);
				cleanup.push(pageHide.cleanup);
			}
		}
		try {
			return await Promise.race(races);
		}
		finally {
			for (let i = 0; i < cleanup.length; i++)
				cleanup[i]();
		}
	}

	function createPageHideLockRelease(name, config) {
		const target = typeof globalThis !== 'undefined' ? globalThis : undefined;
		if (!target || typeof target.addEventListener !== 'function' || typeof target.removeEventListener !== 'function')
			return null;
		let cleanup = () => {};
		const promise = new Promise((_resolve, reject) => {
			const release = () => reject(lockPageHiddenError(name, config));
			target.addEventListener('pagehide', release, { once: true });
			cleanup = () => target.removeEventListener('pagehide', release);
		});
		return { promise, cleanup };
	}

	async function acquireLocalStorageLock(storage, name, config) {
		const key = `orange-orm:sync-lock:${name}`;
		const owner = randomUuid();
		const staleMs = config.staleMs || 60000;
		const pollMs = config.pollMs || 100;
		const startedAt = Date.now();
		for (;;) {
			const now = Date.now();
			const current = readLocalStorageLock(storage, key);
			if (!current || current.expiresAt <= now || current.owner === owner) {
				writeLocalStorageLock(storage, key, { owner, expiresAt: now + staleMs });
				const next = readLocalStorageLock(storage, key);
				if (next && next.owner === owner)
					return { key, owner, staleMs };
			}
			if (config.timeoutMs && now - startedAt >= config.timeoutMs)
				throw lockTimeoutError(name, config.timeoutMs, config);
			await delay(pollMs);
		}
	}

	function renewLocalStorageLock(storage, lock) {
		const current = readLocalStorageLock(storage, lock.key);
		if (!current || current.owner !== lock.owner)
			return;
		writeLocalStorageLock(storage, lock.key, {
			owner: lock.owner,
			expiresAt: Date.now() + lock.staleMs
		});
	}

	function releaseLocalStorageLock(storage, lock) {
		try {
			const current = readLocalStorageLock(storage, lock.key);
			if (current && current.owner === lock.owner)
				storage.removeItem(lock.key);
		}
		catch (_e) {
			// Releasing a best-effort browser lock should not hide the result.
		}
	}

	function readLocalStorageLock(storage, key) {
		const raw = storage.getItem(key);
		if (!raw)
			return null;
		try {
			const parsed = JSON.parse(raw);
			if (!parsed || typeof parsed.owner !== 'string')
				return null;
			const expiresAt = Number(parsed.expiresAt);
			return Number.isFinite(expiresAt) ? { owner: parsed.owner, expiresAt } : null;
		}
		catch (_e) {
			return null;
		}
	}

	function writeLocalStorageLock(storage, key, value) {
		storage.setItem(key, JSON.stringify(value));
	}

	function delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	function lockTimeoutError(name, timeoutMs, config) {
		return new Error(`Timed out waiting for ${lockLabel(config)} "${name}" after ${Math.round((timeoutMs || 0) / 1000)} seconds.`);
	}

	function lockHoldTimeoutError(name, timeoutMs, config) {
		return new Error(`Timed out while holding ${lockLabel(config)} "${name}" after ${Math.round((timeoutMs || 0) / 1000)} seconds.`);
	}

	function lockPageHiddenError(name, config) {
		return new Error(`Released ${lockLabel(config)} "${name}" because the page was hidden.`);
	}

	function lockLabel(config) {
		return config && typeof config.label === 'string' && config.label.length > 0
			? config.label
			: 'sync lock';
	}

	function normalizePositiveInteger(value) {
		const parsed = Number.parseInt(value, 10);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
	}

	function normalizeLockNamePart(value) {
		return String(value).replace(/\s+/g, ' ').trim() || 'default';
	}

	function noop() {}

	crossTabLock = {
		acquireCrossTabLock,
		normalizeCrossTabLockConfig,
		normalizeLockNamePart,
		normalizePositiveInteger,
		runWithCrossTabLock
	};
	return crossTabLock;
}

var writeGate;
var hasRequiredWriteGate;

function requireWriteGate () {
	if (hasRequiredWriteGate) return writeGate;
	hasRequiredWriteGate = 1;
	const gateKey = typeof Symbol === 'function'
		? Symbol.for('orange-orm.syncWriteGate')
		: '__orangeOrmSyncWriteGate';
	const {
		acquireCrossTabLock,
		normalizeLockNamePart,
		runWithCrossTabLock
	} = requireCrossTabLock();

	function runSyncWrite(target, options, fn) {
		if (typeof options === 'function') {
			fn = options;
			options = undefined;
		}
		const gateTarget = resolveGateTarget(target);
		if (isReadonly(options))
			return Promise.resolve().then(fn);
		if (!gateTarget)
			return Promise.resolve().then(fn);
		if (isSuppressSyncOutbox(options))
			return runCrossTabWrite(gateTarget, fn);
		return getSyncWriteGate(gateTarget).runWrite(() => runCrossTabWrite(gateTarget, fn));
	}

	async function acquireSyncWrite(target, options) {
		const gateTarget = resolveGateTarget(target);
		if (isReadonly(options))
			return noop;
		if (!gateTarget)
			return noop;
		if (isSuppressSyncOutbox(options))
			return acquireCrossTabWrite(gateTarget);
		const releaseWrite = await getSyncWriteGate(gateTarget).acquireWrite();
		let releaseCrossTab = noop;
		try {
			releaseCrossTab = await acquireCrossTabWrite(gateTarget);
		}
		catch (e) {
			releaseWrite();
			throw e;
		}
		return function releaseSyncWrite() {
			releaseCrossTab();
			releaseWrite();
		};
	}

	function runSyncMaintenance(target, fn) {
		if (!resolveGateTarget(target))
			return Promise.resolve().then(fn);
		return getSyncWriteGate(target).runMaintenance(fn);
	}

	function shouldGateWrite(target, options) {
		return !!resolveWriteGateTarget(target, options);
	}

	function getSyncWriteGate(target) {
		const gateTarget = resolveGateTarget(target);
		if (!gateTarget)
			return noopGate;
		if (!gateTarget[gateKey])
			gateTarget[gateKey] = createSyncWriteGate();
		return gateTarget[gateKey];
	}

	function resolveGateTarget(target) {
		if (!target)
			return null;
		const pool = target.poolFactory || target;
		if (pool && pool.__sqliteSync)
			return pool;
		if (target.__sqliteSync)
			return target;
		return null;
	}

	function resolveWriteGateTarget(target, options) {
		if (isReadonly(options) || isSuppressSyncOutbox(options))
			return null;
		return resolveGateTarget(target);
	}

	function isReadonly(options) {
		return !!(options && options.readonly);
	}

	function isSuppressSyncOutbox(options) {
		return !!(options && options.suppressSyncOutbox);
	}

	function runCrossTabWrite(gateTarget, fn) {
		const lockConfig = getCrossTabWriteLockConfig(gateTarget);
		if (!lockConfig)
			return fn();
		return runWithCrossTabLock(resolveCrossTabWriteLockName(gateTarget, lockConfig), lockConfig, fn);
	}

	async function acquireCrossTabWrite(gateTarget) {
		const lockConfig = getCrossTabWriteLockConfig(gateTarget);
		if (!lockConfig)
			return noop;
		return acquireCrossTabLock(resolveCrossTabWriteLockName(gateTarget, lockConfig), lockConfig);
	}

	function getCrossTabWriteLockConfig(gateTarget) {
		const config = gateTarget && gateTarget.__orangeCrossTabWriteLock;
		if (!config || config.enabled === false)
			return null;
		return {
			...config,
			label: config.label || 'sqlite writer lock'
		};
	}

	function resolveCrossTabWriteLockName(gateTarget, config) {
		if (config && typeof config.name === 'string' && config.name.length > 0)
			return config.name;
		const identity = gateTarget && (
			gateTarget.__orangeSyncLockName
			|| gateTarget.__orangeSyncIdentity
			|| gateTarget.__orangeSqliteOPFSConnectionString
		);
		return `orange-orm:sqlite-write:${normalizeLockNamePart(identity || 'default')}`;
	}

	function createSyncWriteGate() {
		let activeWrites = 0;
		let maintenanceActive = false;
		let pendingMaintenance = 0;
		const writeWaiters = [];
		const maintenanceWaiters = [];

		return {
			acquireWrite,
			runWrite,
			runMaintenance,
			_isIdle
		};

		function acquireWrite() {
			if (canStartWrite()) {
				activeWrites += 1;
				return Promise.resolve(newWriteRelease());
			}
			return new Promise((resolve) => {
				writeWaiters.push(resolve);
			});
		}

		async function runWrite(fn) {
			const release = await acquireWrite();
			try {
				return await fn();
			}
			finally {
				release();
			}
		}

		async function runMaintenance(fn) {
			if (maintenanceActive)
				return fn();
			const release = await acquireMaintenance();
			try {
				return await fn();
			}
			finally {
				release();
			}
		}

		function acquireMaintenance() {
			pendingMaintenance += 1;
			return new Promise((resolve) => {
				maintenanceWaiters.push(() => {
					pendingMaintenance -= 1;
					maintenanceActive = true;
					resolve(releaseMaintenance);
				});
				drain();
			});
		}

		function releaseMaintenance() {
			maintenanceActive = false;
			drain();
		}

		function canStartWrite() {
			return !maintenanceActive && pendingMaintenance === 0;
		}

		function newWriteRelease() {
			let released = false;
			return function releaseWrite() {
				if (released)
					return;
				released = true;
				activeWrites -= 1;
				drain();
			};
		}

		function drain() {
			if (maintenanceActive)
				return;
			if (activeWrites > 0)
				return;
			if (maintenanceWaiters.length > 0) {
				const nextMaintenance = maintenanceWaiters.shift();
				nextMaintenance();
				return;
			}
			while (writeWaiters.length > 0 && canStartWrite()) {
				activeWrites += 1;
				const resolve = writeWaiters.shift();
				resolve(newWriteRelease());
			}
		}

		function _isIdle() {
			return activeWrites === 0
				&& !maintenanceActive
				&& pendingMaintenance === 0
				&& writeWaiters.length === 0
				&& maintenanceWaiters.length === 0;
		}
	}

	function noop() {}

	const noopGate = {
		acquireWrite: () => Promise.resolve(noop),
		runWrite: (fn) => Promise.resolve().then(fn),
		runMaintenance: (fn) => Promise.resolve().then(fn),
		_isIdle: () => true
	};

	writeGate = {
		acquireSyncWrite,
		getSyncWriteGate,
		runSyncMaintenance,
		runSyncWrite,
		shouldGateWrite
	};
	return writeGate;
}

var ensureOutboxOperationColumns_1;
var hasRequiredEnsureOutboxOperationColumns;

function requireEnsureOutboxOperationColumns () {
	if (hasRequiredEnsureOutboxOperationColumns) return ensureOutboxOperationColumns_1;
	hasRequiredEnsureOutboxOperationColumns = 1;
	const OPERATION_COLUMNS = [
		{ name: 'operation_id', sql: '"operation_id" TEXT' },
		{ name: 'operation_name', sql: '"operation_name" TEXT' },
		{ name: 'operation_json', sql: '"operation_json" TEXT' }
	];

	async function ensureOutboxOperationColumns(query, tableName = 'orange_sync_outbox') {
		if (typeof query !== 'function')
			return;
		let rows;
		try {
			rows = await query(`PRAGMA table_info("${String(tableName).replace(/"/g, '""')}")`);
		}
		catch (_e) {
			return;
		}
		const columns = new Set();
		const list = Array.isArray(rows) ? rows : rows && rows.rows || [];
		for (let i = 0; i < list.length; i++) {
			const name = list[i] && (list[i].name ?? list[i].NAME);
			if (typeof name === 'string')
				columns.add(name);
		}
		for (let i = 0; i < OPERATION_COLUMNS.length; i++) {
			const column = OPERATION_COLUMNS[i];
			if (columns.has(column.name))
				continue;
			try {
				await query(`ALTER TABLE "${String(tableName).replace(/"/g, '""')}" ADD COLUMN ${column.sql}`);
			}
			catch (e) {
				if (!isDuplicateColumnError(e, column.name))
					throw e;
			}
		}
	}

	function isDuplicateColumnError(error, columnName) {
		const message = error && error.message || '';
		return message.includes('duplicate column name')
			&& message.toLowerCase().includes(columnName.toLowerCase());
	}

	ensureOutboxOperationColumns_1 = ensureOutboxOperationColumns;
	return ensureOutboxOperationColumns_1;
}

var operationContext;
var hasRequiredOperationContext;

function requireOperationContext () {
	if (hasRequiredOperationContext) return operationContext;
	hasRequiredOperationContext = 1;
	const stringify = requireStringify();
	const executeQuery = requireQuery();
	const getSessionSingleton = requireGetSessionSingleton();
	const setSessionSingleton = requireSetSessionSingleton();

	const sessionKey = 'syncTransactionContext';
	const captureKey = 'syncOutboxCapture';
	const memoryByMutationId = new Map();

	function createSyncTransactionContext(sync, memory) {
		return {
			sync: isObject(sync) && !Array.isArray(sync) ? sync : {},
			memory: memory === undefined ? {} : memory
		};
	}

	function setSyncTransactionContext(context, txContext) {
		if (!context)
			return;
		if (context.__orangeDbWorkerTransactionId !== undefined) {
			context.__orangeSyncTransactionContext = txContext;
			return;
		}
		setSessionSingleton(context, sessionKey, txContext);
	}

	function getSyncTransactionContext(context) {
		if (!context)
			return undefined;
		if (context.__orangeSyncTransactionContext)
			return context.__orangeSyncTransactionContext;
		try {
			return getSessionSingleton(context, sessionKey);
		}
		catch (_e) {
			return undefined;
		}
	}

	async function flushSyncTransactionContext(context) {
		const txContext = getSyncTransactionContext(context);
		if (!txContext)
			return null;
		const state = getOutboxCaptureState(context);
		const metadata = toSyncOperationMetadata(txContext.sync, state && state.id);
		if (state)
			await updateOutboxOperationColumns(context, state, metadata);
		return metadata;
	}

	async function updateOutboxOperationFromContext(context, state) {
		const txContext = getSyncTransactionContext(context);
		if (!txContext || !state)
			return null;
		const metadata = toSyncOperationMetadata(txContext.sync, state.id);
		await updateOutboxOperationColumns(context, state, metadata);
		return metadata;
	}

	function toSyncOperationMetadata(sync, mutationId) {
		const payload = serializeSyncPayload(sync);
		const keys = Object.keys(payload);
		if (keys.length === 0)
			return null;
		const operationName = typeof payload.operation === 'string' && payload.operation.length > 0
			? payload.operation
			: undefined;
		return {
			mutationId,
			operationId: mutationId,
			operationName,
			operationJson: stringify(payload),
			context: payload
		};
	}

	function serializeSyncPayload(sync) {
		if (sync === undefined || sync === null)
			return {};
		if (!isObject(sync) || Array.isArray(sync))
			throw new Error('ctx.sync must be a JSON serializable object.');
		let json;
		try {
			json = JSON.stringify(sync);
		}
		catch (_e) {
			throw new Error('ctx.sync must be JSON serializable.');
		}
		if (json === undefined)
			throw new Error('ctx.sync must be a JSON serializable object.');
		try {
			const parsed = JSON.parse(json);
			if (!isObject(parsed) || Array.isArray(parsed))
				throw new Error('ctx.sync must be a JSON serializable object.');
			return parsed;
		}
		catch (e) {
			if (e && e.message && e.message.startsWith('ctx.sync'))
				throw e;
			throw new Error('ctx.sync must be JSON serializable.');
		}
	}

	function registerSyncOperationMemory(mutationId, memory) {
		if (typeof mutationId !== 'string' || mutationId.length === 0 || memory === undefined)
			return;
		memoryByMutationId.set(mutationId, memory);
	}

	function getSyncOperationMemory(mutationId) {
		if (typeof mutationId !== 'string')
			return undefined;
		return memoryByMutationId.get(mutationId);
	}

	function deleteSyncOperationMemory(mutationId) {
		if (typeof mutationId === 'string')
			memoryByMutationId.delete(mutationId);
	}

	function withSyncOperationMemory(event) {
		if (!event || !event.mutationId || event.memory !== undefined)
			return event;
		const memory = getSyncOperationMemory(event.mutationId);
		if (memory === undefined)
			return event;
		return {
			...event,
			memory
		};
	}

	function finalizeSyncOperationMemory(event) {
		if (!event || !event.mutationId)
			return;
		if (event.ok || event.retryable === false)
			deleteSyncOperationMemory(event.mutationId);
	}

	async function updateOutboxOperationColumns(context, state, metadata) {
		const assignments = outboxOperationAssignments(metadata);
		await executeQuery(context, [
			'UPDATE "orange_sync_outbox"',
			`SET ${assignments.join(', ')}`,
			`WHERE "mutation_id" = ${sqlStringLiteral(state.id)}`
		].join(' '));
	}

	function outboxOperationAssignments(metadata) {
		if (!metadata) {
			return [
				'"operation_id" = NULL',
				'"operation_name" = NULL',
				'"operation_json" = NULL'
			];
		}
		return [
			`"operation_id" = ${sqlNullableStringLiteral(metadata.operationId)}`,
			`"operation_name" = ${sqlNullableStringLiteral(metadata.operationName)}`,
			`"operation_json" = ${sqlNullableStringLiteral(metadata.operationJson)}`
		];
	}

	function getOutboxCaptureState(context) {
		try {
			return getSessionSingleton(context, captureKey);
		}
		catch (_e) {
			return undefined;
		}
	}

	function isObject(value) {
		return value && value === Object(value);
	}

	function sqlStringLiteral(value) {
		return `'${String(value).replace(/'/g, '\'\'')}'`;
	}

	function sqlNullableStringLiteral(value) {
		if (value === undefined || value === null)
			return 'NULL';
		return sqlStringLiteral(value);
	}

	operationContext = {
		createSyncTransactionContext,
		deleteSyncOperationMemory,
		finalizeSyncOperationMemory,
		flushSyncTransactionContext,
		getSyncOperationMemory,
		registerSyncOperationMemory,
		serializeSyncPayload,
		setSyncTransactionContext,
		toSyncOperationMetadata,
		updateOutboxOperationFromContext,
		withSyncOperationMemory
	};
	return operationContext;
}

var hostLocal_1;
var hasRequiredHostLocal;

function requireHostLocal () {
	if (hasRequiredHostLocal) return hostLocal_1;
	hasRequiredHostLocal = 1;
	let executePath = requireExecutePath();
	let getMeta = requireGetMeta();
	let setSessionSingleton = requireSetSessionSingleton();
	let executeQuery = requireQuery();
	let executeSqliteFunction = requireSqliteFunction();
	let hostExpress = requireHostExpress();
	let hostHono = requireHostHono();
	let randomUuid = requireRandomUuid();
	let stringify = requireStringify();
	let getSessionSingleton = requireGetSessionSingleton();
	let outboxTableSql = requireOutboxTableSql();
	let { runSyncWrite } = requireWriteGate();
	let ensureOutboxOperationColumns = requireEnsureOutboxOperationColumns();
	let { updateOutboxOperationFromContext } = requireOperationContext();
	const readonlyOps = ['getManyDto', 'getMany', 'aggregate', 'distinct', 'count'];
	const syncOutboxEnsuredKey = typeof Symbol === 'function'
		? Symbol.for('orange-orm.syncOutboxEnsured')
		: '__orangeOrmSyncOutboxEnsured';
	// { db, table, defaultConcurrency,
	// 	concurrency,
	// 	customFilters,
	// 	baseFilter, strategy, transaction,
	// 	readonly,
	// 	disableBulkDeletes, isBrowser }
	function hostLocal() {
		const _options = arguments[0];
		let { table, transaction, db, isHttp, hooks, client } = _options;
		const transactionHooks = hooks && hooks.transaction;
		const getTransactionHook = (name) =>
			(transactionHooks && transactionHooks[name]) || (hooks && hooks[name]);

		let c = { get, post, patch, syncCommand, query, sqliteFunction, express, hono };

		function get() {
			return getMeta(table);

		}
		async function patch(body, _req, _res) {
			if (!table) {
				const error = new Error('Table is not exposed');
				// @ts-ignore
				error.status = 400;
				throw error;
			}
			body = typeof body === 'string' ? JSON.parse(body) : body;
			let result;

			if (transaction)
				await transaction(fn);
			else {
				const resolvedDb = await resolveDb();
				await runSyncWrite(resolvedDb, undefined, () => resolvedDb.transaction(fn));
			}
			return result;

			async function fn(context) {
				setSessionSingleton(context, 'ignoreSerializable', true);
				let patch = body.patch;
				await captureSyncOutboxPatch(context, patch, body.options);
				result = await table.patch(context, patch, { ..._options, ...body.options, isHttp });
			}
		}

		async function syncCommand(body) {
			body = typeof body === 'string' ? JSON.parse(body) : body;
			if (!body || body !== Object(body))
				throw new Error('Invalid sync command payload');
			let result;

			if (transaction)
				await transaction(fn);
			else {
				const resolvedDb = await resolveDb();
				await runSyncWrite(resolvedDb, undefined, () => resolvedDb.transaction(fn));
			}
			return result;

			async function fn(context) {
				await captureSyncOutboxCommand(context, body.name, body.args);
				result = undefined;
			}
		}

		async function post(body, request, response) {
			body = typeof body === 'string' ? JSON.parse(body) : body;
			let result;

			if (transaction)
				await transaction(fn);
			else {
				const resolvedDb = await resolveDb();
				const beforeBegin = getTransactionHook('beforeBegin');
				const afterBegin = getTransactionHook('afterBegin');
				const beforeCommit = getTransactionHook('beforeCommit');
				const afterCommit = getTransactionHook('afterCommit');
				const afterRollback = getTransactionHook('afterRollback');
				const hasTransactionHooks = !!(beforeBegin
					|| afterBegin
					|| beforeCommit
					|| afterCommit
					|| afterRollback);
				if (!hasTransactionHooks && readonlyOps.includes(body.path))
					await resolvedDb.transaction({ readonly: true }, fn);
				else {
					await runSyncWrite(resolvedDb, undefined, () => resolvedDb.transaction(async (context) => {
						const hookDb = typeof client === 'function'
							? client({ transaction: (fn) => fn(context) })
							: (client || resolvedDb);
						if (afterCommit)
							setSessionSingleton(context, 'afterCommitHook', () =>
								afterCommit(hookDb, request, response)
							);
						if (afterRollback)
							setSessionSingleton(context, 'afterRollbackHook', (error) =>
								afterRollback(hookDb, request, response, error)
							);
						if (beforeBegin)
							await beforeBegin(hookDb, request, response);
						if (afterBegin)
							await afterBegin(hookDb, request, response);
						await fn(context);
						if (beforeCommit)
							await beforeCommit(hookDb, request, response);
					}));
				}

			}
			return result;

			async function fn(context) {
				setSessionSingleton(context, 'ignoreSerializable', true);
				const options = { ..._options, ...body.options, JSONFilter: body, request, response, isHttp };
				result = await executePath(context, options);
			}
		}
		async function query() {
			let args = arguments;
			let result;

			if (transaction)
				await transaction(fn);
			else {
				const resolvedDb = await resolveDb();
				result = await resolvedDb.query.apply(null, arguments);
			}

			return result;

			async function fn(...args1) {
				result = await executeQuery.apply(null, [...args1, ...args]);
			}

		}

		async function sqliteFunction() {
			let args = arguments;
			let result;

			if (transaction)
				await transaction(fn);
			else {
				const resolvedDb = await resolveDb();
				result = await resolvedDb.sqliteFunction.apply(null, arguments);
			}

			return result;

			async function fn(...args1) {
				result = await executeSqliteFunction.apply(null, [...args1, ...args]);
			}

		}

		function express(client, options) {
			return hostExpress(hostLocal, client, options);
		}

		function hono(client, options) {
			return hostHono(hostLocal, client, options);
		}

		return c;

		async function resolveDb() {
			if (typeof db !== 'function')
				return db;
			let dbPromise = db();
			if (dbPromise.then)
				db = await dbPromise;
			else
				db = dbPromise;
			return db;
		}

		async function captureSyncOutboxPatch(context, patch, options) {
			if (!Array.isArray(patch) || patch.length === 0)
				return;
			const tableName = _options.syncTableName;
			if (!tableName)
				return;
			let state = await getSyncOutboxCaptureState(context);
			if (!state)
				return;
			state.patches.push({
				table: tableName,
				patch,
				options: sanitizeSyncPatchOptions(options)
			});
			await updateSyncOutboxCaptureState(context, state);
		}

		async function captureSyncOutboxCommand(context, name, args) {
			if (typeof name !== 'string' || name.length === 0)
				throw new Error('Sync command requires a command name');
			const normalizedArgs = normalizeSyncCommandArgs(args);
			let state = await getSyncOutboxCaptureState(context);
			if (!state)
				return;
			state.commands.push({ name, args: normalizedArgs });
			await updateSyncOutboxCaptureState(context, state);
		}

		async function getSyncOutboxCaptureState(context) {
			if (getSessionSingleton(context, 'suppressSyncOutbox'))
				return null;
			const pool = getSessionSingleton(context, 'poolFactory');
			if (!pool || !pool.__sqliteSync)
				return null;
			let state = getSessionSingleton(context, 'syncOutboxCapture');
			if (!state) {
				state = { id: randomUuid(), patches: [], commands: [] };
				setSessionSingleton(context, 'syncOutboxCapture', state);
				await insertSyncOutboxPlaceholder(context, pool, state.id);
				await updateOutboxOperationFromContext(context, state);
			}
			if (!Array.isArray(state.patches))
				state.patches = [];
			if (!Array.isArray(state.commands))
				state.commands = [];
			return state;
		}

		async function insertSyncOutboxPlaceholder(context, pool, id) {
			for (let attempt = 0; attempt < 2; attempt++) {
				await ensureSyncOutboxTable(context);
				try {
					await querySyncOutbox(context, [
						'INSERT INTO "orange_sync_outbox" ("mutation_id", "table_name", "patch_json", "options_json", "created_at_ms")',
						`VALUES (${sqlStringLiteral(id)}, '*', '[]', '{}', ${Date.now()})`,
						'ON CONFLICT("mutation_id") DO NOTHING'
					].join(' '));
					return;
				}
				catch (e) {
					if (attempt === 0 && isMissingSqliteTableError(e, 'orange_sync_outbox')) {
						delete pool[syncOutboxEnsuredKey];
						continue;
					}
					throw e;
				}
			}
		}

		async function updateSyncOutboxCaptureState(context, state) {
			const metadata = await updateOutboxOperationFromContext(context, state);
			const operationAssignments = metadata === null
				? [
					'"operation_id" = NULL',
					'"operation_name" = NULL',
					'"operation_json" = NULL'
				]
				: [];
			await querySyncOutbox(context, [
				'UPDATE "orange_sync_outbox"',
				`SET "patch_json" = ${sqlStringLiteral(stringify(serializeSyncOutboxCaptureState(state)))}`
					+ (operationAssignments.length > 0 ? `, ${operationAssignments.join(', ')}` : ''),
				`WHERE "mutation_id" = ${sqlStringLiteral(state.id)}`
			].join(' '));
		}

		function serializeSyncOutboxCaptureState(state) {
			if (!Array.isArray(state.commands) || state.commands.length === 0)
				return state.patches;
			return {
				patches: state.patches,
				commands: state.commands
			};
		}

		function normalizeSyncCommandArgs(args) {
			if (args === undefined)
				return null;
			return JSON.parse(JSON.stringify(args));
		}

		async function ensureSyncOutboxTable(context) {
			const pool = getSessionSingleton(context, 'poolFactory');
			if (pool && pool[syncOutboxEnsuredKey])
				return;
			await querySyncOutbox(context, outboxTableSql());
			await ensureOutboxOperationColumns((sql) => querySyncOutbox(context, sql));
			if (pool)
				pool[syncOutboxEnsuredKey] = true;
		}

		function querySyncOutbox(context, sql) {
			return executeQuery(context, sql);
		}

		function sqlStringLiteral(value) {
			return `'${String(value).replace(/'/g, '\'\'')}'`;
		}

		function isMissingSqliteTableError(error, tableName) {
			const message = error && error.message || '';
			return message.includes(`no such table: ${tableName}`)
				|| message.includes(`no such table: "${tableName}"`);
		}

		function sanitizeSyncPatchOptions(options) {
			if (!options || options !== Object(options))
				return undefined;
			const {
				db,
				transaction,
				client,
				syncTableName,
				strategy,
				deduceStrategy,
				...rest
			} = options;
			return Object.keys(rest).length > 0 ? rest : undefined;
		}
	}

	hostLocal_1 = hostLocal;
	return hostLocal_1;
}

var cloneFromDb_1;
var hasRequiredCloneFromDb;

function requireCloneFromDb () {
	if (hasRequiredCloneFromDb) return cloneFromDb_1;
	hasRequiredCloneFromDb = 1;
	let dateToISOString = requireDateToISOString();

	function cloneFromDbFast(obj) {
		if (obj === null || typeof obj !== 'object')
			return obj;
		if (Array.isArray(obj)) {
			const arrClone = [];
			for (let i = 0; i < obj.length; i++) {
				arrClone[i] = cloneFromDbFast(obj[i]);
			}
			return arrClone;
		}
		const clone = {};
		const keys = Object.keys(obj);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			clone[key] = cloneFromDbFast(obj[key]);
		}
		return clone;
	}

	function cloneRegular(obj) {
		if (obj === null || typeof obj !== 'object')
			return obj;
		if (Array.isArray(obj)) {
			const arrClone = [];
			for (let i = 0; i < obj.length; i++) {
				arrClone[i] = cloneRegular(obj[i]);
			}
			return arrClone;
		}
		else if (obj instanceof Date  && !isNaN(obj))
			return dateToISOString(obj);
		const clone = {};
		const keys = Object.keys(obj);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			clone[key] = cloneRegular(obj[key]);
		}
		return clone;
	}

	function cloneFromDb(obj, isFast) {
		if (isFast)
			return cloneFromDbFast(obj);
		else
			return cloneRegular(obj);
	}

	cloneFromDb_1 = cloneFromDb;
	return cloneFromDb_1;
}

var netAdapter_1;
var hasRequiredNetAdapter;

function requireNetAdapter () {
	if (hasRequiredNetAdapter) return netAdapter_1;
	hasRequiredNetAdapter = 1;
	function httpAdapter(baseURL, path, httpInterceptor) {
		let c = {
			get,
			post,
			patch,
			syncCommand,
			query,
			sqliteFunction,
			express
		};

		return c;

		async function get() {
			try {
				const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
				const res = await request({ baseURL, url: path, headers, method: 'get' });
				return res.data;
			}
			catch (e) {
				if (typeof e.response?.data === 'string')
					throw new Error(e.response.data.replace(/^Error: /, ''));
				else
					throw e;
			}

		}

		async function patch(body) {
			try {

				const headers = { 'Content-Type': 'application/json' };
				const res = await request({ baseURL, url: path, headers, method: 'patch', data: body });
				return res.data;
			}
			catch (e) {
				if (typeof e.response?.data === 'string')
					throw new Error(e.response.data.replace(/^Error: /, ''));
				else
					throw e;
			}


		}

		async function post(body) {
			try {
				const headers = { 'Content-Type': 'application/json' };
				const res = await request({ baseURL, url: path, headers, method: 'post', data: body });
				return res.data;
			}
			catch (e) {
				if (typeof e.response?.data === 'string')
					throw new Error(e.response.data.replace(/^Error: /, ''));
				else throw e;
			}
		}

		async function syncCommand(body) {
			try {
				const payload = typeof body === 'string' ? JSON.parse(body) : body;
				const name = payload && payload.name;
				if (typeof name !== 'string' || name.length === 0)
					throw new Error('Sync command requires a command name');
				const headers = { 'Content-Type': 'application/json' };
				const res = await request({
					baseURL,
					url: `?command=${encodeURIComponent(name)}`,
					headers,
					method: 'post',
					data: body
				});
				return res.data;
			}
			catch (e) {
				if (typeof e.response?.data === 'string')
					throw new Error(e.response.data.replace(/^Error: /, ''));
				else throw e;
			}
		}


		function query() {
			throw new Error('Queries are not supported through http');
		}

		function sqliteFunction() {
			throw new Error('Sqlite Function is not supported through http');
		}

		function express() {
			throw new Error('Hosting in express is not supported on the client side');
		}

		async function request(config) {
			if (typeof fetch !== 'function')
				throw new Error('HTTP client requires fetch. Use a runtime with fetch support or provide a fetch polyfill.');

			config = await httpInterceptor.applyRequest(config);
			const response = await fetch(toUrl(config.baseURL, config.url), {
				method: config.method?.toUpperCase(),
				headers: config.headers,
				body: toBody(config.data)
			});
			const data = await readData(response);
			let result = {
				data,
				status: response.status,
				statusText: response.statusText,
				headers: toHeadersObject(response.headers),
				config
			};

			if (!response.ok)
				return httpInterceptor.applyResponseError(createHttpError(result));

			result = await httpInterceptor.applyResponse(result);
			return result;
		}
	}

	function toBody(data) {
		if (data === undefined)
			return undefined;
		if (typeof data === 'string')
			return data;
		return JSON.stringify(data);
	}

	function createHttpError(response) {
		const error = new Error('Request failed with status code ' + response.status);
		error.response = response;
		error.config = response.config;
		return error;
	}

	async function readData(response) {
		const text = await response.text();
		const contentType = response.headers.get('content-type') || '';
		if (text && (contentType.indexOf('application/json') !== -1 || looksLikeJson(text)))
			return JSON.parse(text);
		return text;
	}

	function looksLikeJson(text) {
		const value = text.trim();
		return value[0] === '{' || value[0] === '[';
	}

	function toHeadersObject(headers) {
		const result = {};
		headers.forEach((value, key) => result[key] = value);
		return result;
	}

	function toUrl(baseURL, path) {
		return new URL(path, baseURL).toString();
	}

	function netAdapter(url, tableName, { http, tableOptions }) {
		if (tableOptions.transaction?.done)
			delete tableOptions.transaction;

		let c = {
			get,
			post,
			patch,
			syncCommand,
			query,
			sqliteFunction
		};

		return c;

		async function get() {
			const adapter = await getInnerAdapter();
			return adapter.get.apply(null, arguments);
		}

		async function patch(_body) {
			const adapter = await getInnerAdapter();
			return adapter.patch.apply(null, arguments);
		}

		async function post(_body) {
			const adapter = await getInnerAdapter();
			return adapter.post.apply(null, arguments);
		}

		async function syncCommand(_body) {
			const adapter = await getInnerAdapter();
			if (!adapter.syncCommand)
				throw new Error('Sync commands are not supported through this adapter');
			return adapter.syncCommand.apply(null, arguments);
		}

		async function query() {
			const adapter = await getInnerAdapter();
			return adapter.query.apply(null, arguments);
		}

		async function sqliteFunction() {
			const adapter = await getInnerAdapter();
			return adapter.sqliteFunction.apply(null, arguments);
		}

		async function getInnerAdapter() {
			const db = await getDb();
			if (typeof db === 'string') {
				return httpAdapter(db, tableName === undefined ? '' : `?table=${tableName}`, http);
			}
			else if (db && db.hostLocal) {
				return db.hostLocal({ ...tableOptions, db, table: url });
			}
			else
				throw new Error('Invalid arguments');
		}

		async function getDb() {
			let db = tableOptions.db;
			if (db.transaction)
				return db;
			if (typeof db === 'function') {
				let dbPromise = db();
				if (dbPromise.then)
					db = await dbPromise;
				else
					db = dbPromise;
			}

			return db;
		}

	}

	netAdapter_1 = netAdapter;
	return netAdapter_1;
}

var toKeyPositionMap_1;
var hasRequiredToKeyPositionMap;

function requireToKeyPositionMap () {
	if (hasRequiredToKeyPositionMap) return toKeyPositionMap_1;
	hasRequiredToKeyPositionMap = 1;
	const stringify = requireStringify();
	const newMemoryId = requireNewMemoryId();

	function toKeyPositionMap(rows, options) {
		return rows.reduce((map, element, i) => {
			if (options && options.keys && element === Object(element)) {
				let key = [];
				for (let i = 0; i < options.keys.length; i++) {
					let keyName = options.keys[i].name;
					key.push(negotiateTempKey(element[keyName]));
				}
				map[stringify(key)] = i;
			}
			else if ('id' in element)
				map[stringify(element.id)] = i;
			else
				map[i] = i;
			return map;
		}, {});

	}

	function negotiateTempKey(value) {
		if (value === undefined)
			return `~${newMemoryId()}`;
		else
			return value;
	}

	toKeyPositionMap_1 = toKeyPositionMap;
	return toKeyPositionMap_1;
}

var clientMap;
var hasRequiredClientMap;

function requireClientMap () {
	if (hasRequiredClientMap) return clientMap;
	hasRequiredClientMap = 1;
	function map(index, _fn) {
		const handler = {
			get(target, prop) {
				if (prop === 'map') {
					return () => {
						return new Proxy(onFinal, handler);
					};
				} else if (typeof target[prop] !== 'undefined') {
					return target[prop];
				} else {
					return () => {
						return new Proxy({}, handler);
					};
				}
			},
			apply(target, _thisArg, argumentsList) {
				if (target === onFinal) {
					return target(...argumentsList);
				} else {
					return new Proxy({}, handler);
				}
			},
			set(target, prop, value) {
				target[prop] = value;
				return true;
			},
		};

		function dbMap(fn) {
			return fn(dbMap);
		}

		dbMap.http = (url) => url;
		dbMap.pg = throwDb;
		dbMap.pglite = throwDb;
		dbMap.postgres = throwDb;
		dbMap.mssql = throwDb;
		dbMap.mssqlNative = throwDb;
		dbMap.mysql = throwDb;
		dbMap.mariadb = throwDb;
		dbMap.sap = throwDb;
		dbMap.oracle = throwDb;
		dbMap.sqlite = throwDb;
		dbMap.d1 = throwDb;

		function throwDb() {
			throw new Error('Cannot create pool for database outside node');
		}

		function onFinal(arg) {
			if (arg && arg.db && typeof arg.db === 'function') {
				return index({
					...arg,
					db: dbMap(arg.db),
					providers: dbMap
				});
			}

			return index({ ...arg, providers: dbMap });
		}

		onFinal.http = (url) => index({ db: url, providers: dbMap });
		onFinal.pg = () => index({ db: throwDb, providers: dbMap });
		onFinal.pglite = () => index({ db: throwDb, providers: dbMap });
		onFinal.postgres = () => index({ db: throwDb, providers: dbMap });
		onFinal.mssql = () => index({ db: throwDb, providers: dbMap });
		onFinal.mssqlNative = () => index({ db: throwDb, providers: dbMap });
		onFinal.mysql = () => index({ db: throwDb, providers: dbMap });
		onFinal.mariadb = () => index({ db: throwDb, providers: dbMap });
		onFinal.sap = () => index({ db: throwDb, providers: dbMap });
		onFinal.oracle = () => index({ db: throwDb, providers: dbMap });
		onFinal.sqlite = () => index({ db: throwDb, providers: dbMap });
		onFinal.d1 = () => index({ db: throwDb, providers: dbMap });

		return new Proxy(onFinal, handler);
	}

	clientMap = map;
	return clientMap;
}

var require$$5 = /*@__PURE__*/getDefaultExportFromNamespaceIfPresent(_default);

var httpInterceptor;
var hasRequiredHttpInterceptor;

function requireHttpInterceptor () {
	if (hasRequiredHttpInterceptor) return httpInterceptor;
	hasRequiredHttpInterceptor = 1;
	class InterceptorProxy {
		constructor() {
			this.requestInterceptors = [];
			this.responseInterceptors = [];
		}

		get request() {
			return {
				use: (onFulfilled, onRejected) => {
					const id = Math.random().toString(36).substring(2, 11); // unique id
					this.requestInterceptors.push({ id, onFulfilled, onRejected });
					return id;
				},
				eject: (id) => {
					this.requestInterceptors = this.requestInterceptors.filter(interceptor => interceptor.id !== id);
				}
			};
		}

		get response() {
			return {
				use: (onFulfilled, onRejected) => {
					const id = Math.random().toString(36).substring(2, 11); // unique id
					this.responseInterceptors.push({ id, onFulfilled, onRejected });
					return id;
				},
				eject: (id) => {
					this.responseInterceptors = this.responseInterceptors.filter(interceptor => interceptor.id !== id);
				}
			};
		}

		async applyRequest(config) {
			let result = Promise.resolve(config);
			for (const { onFulfilled, onRejected } of this.requestInterceptors) {
				result = result.then(onFulfilled, onRejected);
			}
			return await result;
		}

		async applyResponse(response) {
			let result = Promise.resolve(response);
			for (const { onFulfilled, onRejected } of this.responseInterceptors) {
				result = result.then(onFulfilled, onRejected);
			}
			return await result;
		}

		async applyResponseError(error) {
			let result = Promise.reject(error);
			for (const { onFulfilled, onRejected } of this.responseInterceptors) {
				result = result.then(onFulfilled, onRejected);
			}
			return await result;
		}
	}

	httpInterceptor = function create() {
		return new InterceptorProxy();
	};
	return httpInterceptor;
}

var flags_1;
var hasRequiredFlags;

function requireFlags () {
	if (hasRequiredFlags) return flags_1;
	hasRequiredFlags = 1;
	let flags = {
		useProxy: true,
		useLazyDefaults: true
	};

	flags_1 = flags;
	return flags_1;
}

var syncAuto;
var hasRequiredSyncAuto;

function requireSyncAuto () {
	if (hasRequiredSyncAuto) return syncAuto;
	hasRequiredSyncAuto = 1;
	function createSyncAuto(syncClient, getConfig, options = {}) {
		const timers = options.timers || globalThis;
		const onlineTarget = options.onlineTarget || (typeof globalThis !== 'undefined' ? globalThis : undefined);
		let running = false;
		let activeRun = null;
		let intervalId = null;
		let unsubscribeOnline = null;

		return {
			start,
			stop,
			isRunning,
			runNow
		};

		async function start() {
			if (running)
				return activeRun || Promise.resolve();
			const config = normalizeAutoConfig(await getConfig());
			if (!config.enabled)
				return;
			running = true;
			if (config.intervalMs > 0 && timers && typeof timers.setInterval === 'function') {
				intervalId = timers.setInterval(() => {
					void runNow().catch(() => {});
				}, config.intervalMs);
			}
			subscribeOnline();
			return runNow();
		}

		function stop() {
			running = false;
			if (intervalId !== null && timers && typeof timers.clearInterval === 'function') {
				timers.clearInterval(intervalId);
				intervalId = null;
			}
			if (unsubscribeOnline) {
				unsubscribeOnline();
				unsubscribeOnline = null;
			}
		}

		function isRunning() {
			return running;
		}

		async function runNow() {
			if (activeRun)
				return activeRun;
			activeRun = runCycle()
				.finally(() => {
					activeRun = null;
				});
			return activeRun;
		}

		async function runCycle() {
			const config = normalizeAutoConfig(await getConfig());
			if (config.enabled)
				return syncClient.sync();
			return { skipped: true };
		}

		function subscribeOnline() {
			if (!onlineTarget || typeof onlineTarget.addEventListener !== 'function' || typeof onlineTarget.removeEventListener !== 'function')
				return;
			const onOnline = () => {
				if (running)
					void runNow().catch(() => {});
			};
			onlineTarget.addEventListener('online', onOnline);
			unsubscribeOnline = () => onlineTarget.removeEventListener('online', onOnline);
		}
	}

	function normalizeAutoConfig(syncConfig) {
		const auto = syncConfig && syncConfig.auto;
		if (!syncConfig || auto === false)
			return { enabled: false, intervalMs: 30000 };
		if (auto === undefined || auto === true)
			return { enabled: true, intervalMs: 30000 };
		if (auto !== Object(auto))
			return { enabled: true, intervalMs: 30000 };
		const intervalMs = normalizeIntervalMs(auto.intervalMs);
		return {
			enabled: auto.enabled !== false,
			intervalMs
		};
	}

	function normalizeIntervalMs(value) {
		const parsed = Number.parseInt(value, 10);
		if (!Number.isFinite(parsed) || parsed < 0)
			return 30000;
		return parsed;
	}

	syncAuto = {
		createSyncAuto,
		normalizeAutoConfig
	};
	return syncAuto;
}

var syncSchema;
var hasRequiredSyncSchema;

function requireSyncSchema () {
	if (hasRequiredSyncSchema) return syncSchema;
	hasRequiredSyncSchema = 1;
	const schemaStateTable = 'orange_schema_state';
	const schemaVersion = 1;
	const ensuredSchemasByDb = new WeakMap();

	async function ensureSyncSchema(db, client, tableNames, options = {}) {
		if (!db || typeof db.query !== 'function')
			return null;
		if (options === false || options && options.enabled === false)
			return null;
		const tables = client && client.tables;
		if (!tables || !Array.isArray(tableNames) || tableNames.length === 0)
			return null;

		const schema = buildSyncSchema(tables, tableNames);
		if (!schema.tables.length)
			return null;
		const sql = schemaToSql(schema);
		const schemaJson = stableStringify(schema);
		const checksum = checksumString(schemaJson);
		const scope = `sync:${schema.tables.map(x => x.name).join('|')}`;
		const ensuredKey = `${scope}:${checksum}`;
		if (isSchemaEnsured(db, ensuredKey))
			return { scope, schema, checksum, sql: sql.statements };

		await ensureSchemaStateTable(db);
		const existing = await readSchemaState(db, scope);
		const shouldUpdateState = !existing || existing.checksum !== checksum;
		if (existing && existing.checksum !== checksum && !isIndexOnlySchemaChange(existing.schemaJson, schema))
			throw new Error('Local sync schema does not match current map. Reset the local sync database or run a migration before syncing.');
		if (existing && existing.checksum === checksum) {
			markSchemaEnsured(db, ensuredKey);
			return { scope, schema, checksum, sql: sql.statements };
		}

		for (let i = 0; i < sql.statements.length; i++)
			await db.query(sql.statements[i]);

		if (shouldUpdateState)
			await writeSchemaState(db, {
				scope,
				dialect: 'sqlite',
				tables: schema.tables.map(x => x.name),
				schema,
				checksum,
				sql: sql.statements.join('\n'),
				updatedAtMs: Date.now()
			});

		markSchemaEnsured(db, ensuredKey);
		return { scope, schema, checksum, sql: sql.statements };
	}

	function isSchemaEnsured(db, key) {
		const ensured = ensuredSchemasByDb.get(db);
		return ensured ? ensured.has(key) : false;
	}

	function markSchemaEnsured(db, key) {
		let ensured = ensuredSchemasByDb.get(db);
		if (!ensured) {
			ensured = new Set();
			ensuredSchemasByDb.set(db, ensured);
		}
		ensured.add(key);
	}

	function clearEnsuredSyncSchema(db) {
		if (db)
			ensuredSchemasByDb.delete(db);
	}

	function buildSyncSchema(tables, tableNames) {
		const selected = Array.from(new Set(tableNames))
			.filter(name => tables[name])
			.sort();
		const schema = {
			version: schemaVersion,
			dialect: 'sqlite',
			tables: selected.map(name => tableToSchema(name, tables[name]))
		};
		addRelationMetadata(schema, tables, selected);
		return schema;
	}

	function tableToSchema(name, table) {
		const columns = (table._columns || []).map(columnToSchema);
		return {
			name,
			dbName: table._dbName,
			columns,
			foreignKeys: [],
			indexes: [],
			primaryKey: (table._primaryColumns || []).map(x => x._dbName)
		};
	}

	function columnToSchema(column) {
		return {
			name: column.alias,
			dbName: column._dbName,
			type: columnType(column),
			primary: column.isPrimary === true,
			notNull: column._notNull === true,
			notNullExceptInsert: column._notNullExceptInsert === true
		};
	}

	function columnType(column) {
		if (column.tsType === 'NumberColumn')
			return 'number';
		if (column.tsType === 'BooleanColumn')
			return 'boolean';
		if (column.tsType === 'BigintColumn')
			return 'bigint';
		if (column.tsType === 'BinaryColumn')
			return 'binary';
		if (column.tsType === 'JSONColumn')
			return 'json';
		if (column.tsType === 'UUIDColumn')
			return 'uuid';
		if (column.tsType === 'DateColumn' && column.hasTimeZone)
			return 'datetime-tz';
		if (column.tsType === 'DateColumn')
			return 'datetime';
		return 'string';
	}

	function schemaToSql(schema) {
		return {
			statements: schema.tables.map(tableToCreateSql).concat(schema.tables.flatMap(tableToIndexSql))
		};
	}

	function tableToCreateSql(table) {
		const hasCompositePrimaryKey = table.primaryKey.length > 1;
		const parts = table.columns.map(column => columnToSql(column, { hasCompositePrimaryKey }));
		if (table.primaryKey.length > 1)
			parts.push(`PRIMARY KEY (${table.primaryKey.map(quoteIdent).join(', ')})`);
		for (let i = 0; i < table.foreignKeys.length; i++)
			parts.push(foreignKeyToSql(table.foreignKeys[i]));
		return [
			`CREATE TABLE IF NOT EXISTS ${quoteIdent(table.dbName)} (`,
			parts.map(x => `  ${x}`).join(',\n'),
			');'
		].join('\n');
	}

	function tableToIndexSql(table) {
		return (table.indexes || []).map(index => {
			return `CREATE INDEX IF NOT EXISTS ${quoteIdent(index.dbName)} ON ${quoteIdent(table.dbName)} (${index.columns.map(quoteIdent).join(', ')});`;
		});
	}

	function columnToSql(column, options = {}) {
		const parts = [quoteIdent(column.dbName), sqliteType(column.type)];
		if (!options.hasCompositePrimaryKey && column.primary && column.type === 'number')
			parts.push('PRIMARY KEY');
		else if (!options.hasCompositePrimaryKey && column.primary)
			parts.push('PRIMARY KEY');
		if (column.notNull)
			parts.push('NOT NULL');
		return parts.join(' ');
	}

	function foreignKeyToSql(foreignKey) {
		return [
			`FOREIGN KEY (${foreignKey.columns.map(quoteIdent).join(', ')})`,
			`REFERENCES ${quoteIdent(foreignKey.referencesTable)} (${foreignKey.referencesColumns.map(quoteIdent).join(', ')})`
		].join(' ');
	}

	function sqliteType(type) {
		if (type === 'number' || type === 'boolean')
			return 'INTEGER';
		if (type === 'binary')
			return 'BLOB';
		return 'TEXT';
	}

	function addRelationMetadata(schema, tables, selectedNames) {
		const tableSchemaByObject = new Map();
		const selectedObjects = new Set();
		for (let i = 0; i < selectedNames.length; i++) {
			const table = tables[selectedNames[i]];
			const tableSchema = schema.tables[i];
			tableSchemaByObject.set(table, tableSchema);
			selectedObjects.add(table);
		}

		const seen = new Set();
		const seenForeignKeys = new Set();
		for (let i = 0; i < selectedNames.length; i++) {
			const table = tables[selectedNames[i]];
			const relations = table && table._relations;
			if (!relations)
				continue;
			for (let relationName in relations) {
				const join = extractJoinRelation(relations[relationName]);
				if (!join || !selectedObjects.has(join.parentTable) || !selectedObjects.has(join.childTable))
					continue;
				const targetSchema = tableSchemaByObject.get(join.parentTable);
				const referencesSchema = tableSchemaByObject.get(join.childTable);
				const columns = (join.columns || []).map(x => x && x._dbName).filter(Boolean);
				const referencesColumns = join.childTable && Array.isArray(join.childTable._primaryColumns)
					? join.childTable._primaryColumns.map(x => x && x._dbName).filter(Boolean)
					: [];
				if (!targetSchema || !referencesSchema || columns.length === 0 || columns.length !== referencesColumns.length)
					continue;
				addRelationIndex(targetSchema, columns, relationName, seen);
				addRelationForeignKey(targetSchema, referencesSchema, columns, referencesColumns, seenForeignKeys);
			}
		}

		for (let i = 0; i < schema.tables.length; i++) {
			schema.tables[i].indexes.sort((a, b) => a.dbName.localeCompare(b.dbName));
			schema.tables[i].foreignKeys.sort((a, b) => {
				const tableCompare = a.referencesTable.localeCompare(b.referencesTable);
				if (tableCompare !== 0)
					return tableCompare;
				return a.columns.join('|').localeCompare(b.columns.join('|'));
			});
		}
	}

	function addRelationIndex(targetSchema, columns, relationName, seen) {
		if (isPrimaryKey(targetSchema, columns))
			return;
		const key = `${targetSchema.dbName}:${columns.join('|')}`;
		if (seen.has(key))
			return;
		seen.add(key);
		targetSchema.indexes.push({
			name: `relation:${relationName}`,
			dbName: newIndexName(targetSchema.dbName, columns),
			columns
		});
	}

	function addRelationForeignKey(targetSchema, referencesSchema, columns, referencesColumns, seen) {
		const key = `${targetSchema.dbName}:${columns.join('|')}:${referencesSchema.dbName}:${referencesColumns.join('|')}`;
		if (seen.has(key))
			return;
		seen.add(key);
		targetSchema.foreignKeys.push({
			columns,
			referencesTable: referencesSchema.dbName,
			referencesColumns
		});
	}

	function extractJoinRelation(relation) {
		if (!relation || typeof relation.accept !== 'function')
			return null;
		let join;
		relation.accept({
			visitJoin: function(current) {
				join = current;
			},
			visitOne: function(current) {
				join = current && current.joinRelation;
			},
			visitMany: function(current) {
				join = current && current.joinRelation;
			}
		});
		return join;
	}

	function isPrimaryKey(tableSchema, columns) {
		if (!Array.isArray(tableSchema.primaryKey) || tableSchema.primaryKey.length !== columns.length)
			return false;
		for (let i = 0; i < columns.length; i++) {
			if (tableSchema.primaryKey[i] !== columns[i])
				return false;
		}
		return true;
	}

	function newIndexName(tableName, columns) {
		const raw = `orange_idx_${tableName}_${columns.join('_')}`;
		return raw.replace(/[^A-Za-z0-9_]/g, '_');
	}

	async function ensureSchemaStateTable(db) {
		await db.query([
			`CREATE TABLE IF NOT EXISTS ${quoteIdent(schemaStateTable)} (`,
			'"scope" TEXT PRIMARY KEY,',
			'"dialect" TEXT NOT NULL,',
			'"tables_json" TEXT NOT NULL,',
			'"schema_json" TEXT NOT NULL,',
			'"checksum" TEXT NOT NULL,',
			'"sql_text" TEXT NOT NULL,',
			'"updated_at_ms" INTEGER NOT NULL',
			');'
		].join(' '));
	}

	async function readSchemaState(db, scope) {
		const rows = await db.query(`SELECT "checksum", "schema_json" FROM ${quoteIdent(schemaStateTable)} WHERE "scope" = ${sqlStringLiteral(scope)} LIMIT 1`);
		const list = Array.isArray(rows) ? rows : rows && rows.rows || [];
		const row = list[0];
		if (!row)
			return null;
		return {
			checksum: row.checksum ?? row.CHECKSUM,
			schemaJson: row.schema_json ?? row.SCHEMA_JSON
		};
	}

	async function writeSchemaState(db, state) {
		await db.query([
			`INSERT OR REPLACE INTO ${quoteIdent(schemaStateTable)} (`,
			'"scope", "dialect", "tables_json", "schema_json", "checksum", "sql_text", "updated_at_ms"',
			') VALUES (',
			[
				sqlStringLiteral(state.scope),
				sqlStringLiteral(state.dialect),
				sqlStringLiteral(JSON.stringify(state.tables)),
				sqlStringLiteral(stableStringify(state.schema)),
				sqlStringLiteral(state.checksum),
				sqlStringLiteral(state.sql),
				String(state.updatedAtMs)
			].join(', '),
			');'
		].join(' '));
	}

	function isIndexOnlySchemaChange(existingSchemaJson, nextSchema) {
		if (typeof existingSchemaJson !== 'string')
			return false;
		try {
			const existing = JSON.parse(existingSchemaJson);
			return stableStringify(stripIndexes(existing)) === stableStringify(stripIndexes(nextSchema));
		}
		catch (_e) {
			return false;
		}
	}

	function stripIndexes(value) {
		if (Array.isArray(value))
			return value.map(stripIndexes);
		if (!value || typeof value !== 'object')
			return value;
		const result = {};
		for (let key in value) {
			if (key !== 'indexes')
				result[key] = stripIndexes(value[key]);
		}
		return result;
	}

	function quoteIdent(value) {
		return `"${String(value).replace(/"/g, '""')}"`;
	}

	function sqlStringLiteral(value) {
		if (value === null || value === undefined)
			return 'NULL';
		return `'${String(value).replace(/'/g, '\'\'')}'`;
	}

	function stableStringify(value) {
		if (value === null || typeof value !== 'object')
			return JSON.stringify(value);
		if (Array.isArray(value))
			return `[${value.map(stableStringify).join(',')}]`;
		const keys = Object.keys(value).sort();
		return `{${keys.map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
	}

	function checksumString(value) {
		let hash = 2166136261;
		for (let i = 0; i < value.length; i++) {
			hash ^= value.charCodeAt(i);
			hash = Math.imul(hash, 16777619);
		}
		return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
	}

	syncSchema = {
		ensureSyncSchema,
		clearEnsuredSyncSchema,
		buildSyncSchema,
		schemaToSql,
		stableStringify,
		checksumString
	};
	return syncSchema;
}

var syncClient;
var hasRequiredSyncClient;

function requireSyncClient () {
	if (hasRequiredSyncClient) return syncClient;
	hasRequiredSyncClient = 1;
	const randomUuid = requireRandomUuid();
	const stringify = requireStringify();
	const { createSyncAuto } = requireSyncAuto();
	const createHttpInterceptor = requireHttpInterceptor();
	const outboxTableSql = requireOutboxTableSql();
	const { ensureSyncSchema, clearEnsuredSyncSchema } = requireSyncSchema();
	const { runSyncMaintenance } = requireWriteGate();
	const {
		normalizeCrossTabLockConfig,
		normalizeLockNamePart,
		normalizePositiveInteger,
		runWithCrossTabLock
	} = requireCrossTabLock();
	const ensureOutboxOperationColumns = requireEnsureOutboxOperationColumns();
	const {
		deleteSyncOperationMemory,
		finalizeSyncOperationMemory,
		withSyncOperationMemory
	} = requireOperationContext();

	const maxPushBatchesPerSync = 1000;

	function newSyncClient(client, getDb, axiosInterceptor) {
		const sinceByScope = new Map();
		const ensuredInternalTables = new WeakMap();
		const syncStateTable = 'orange_sync_state';
		const syncClientTable = 'orange_sync_client';
		const syncOutboxTable = 'orange_sync_outbox';
		const syncPullSessionTable = 'orange_sync_pull_session';
		const syncPullItemTable = 'orange_sync_pull_item';
		const syncBaseTable = 'orange_sync_base_tables';
		const syncBasePrefix = 'orange_sync_base_data_';
		const initialReadyListeners = new Set();
		const eventListeners = new Map();
		let initialReadyEmitted = false;
		const interceptors = createHttpInterceptor();
		const lockedSync = withCrossTabSyncLock(sync);
		const lockedResetLocal = withCrossTabSyncLock(resetLocal);
		const queuedSync = serializeAsyncMethod(lockedSync);
		const observedSync = observeSyncMethod('sync', queuedSync);
		const auto = createSyncAuto({
			sync: observedSync
		}, getConfig);

		return {
			sync: observedSync,
			resetLocal: lockedResetLocal,
			start: auto.start,
			stop: auto.stop,
			isRunning: auto.isRunning,
			getConfig,
			onOperation,
			on,
			off,
			once,
			waitForInitialReady,
			interceptors
		};

		function withCrossTabSyncLock(fn) {
			return async function lockedSyncMethod(options) {
				const db = await getDb();
				const syncConfig = normalizeSyncConfig(db && db.__sqliteSync);
				if (!syncConfig)
					return fn(options);
				const lock = await resolveRuntimeCrossTabSyncLock(db, syncConfig);
				const lockConfig = withRuntimeCrossTabLockConfig(lock.config, options);
				return runWithCrossTabLock(lock.name, lockConfig, () => fn(options));
			};
		}

		function serializeAsyncMethod(fn) {
			let tail = Promise.resolve();
			return function serializedAsyncMethod(options) {
				const run = tail.then(() => fn(options));
				tail = run.catch(() => {});
				return run;
			};
		}

		async function sync(options = {}) {
			await pull(normalizeSyncOptions(options));
		}

		async function getConfig() {
			const db = await getDb();
			return normalizeSyncConfig(db && db.__sqliteSync);
		}

		function observeSyncMethod(method, fn) {
			return async function observedSyncMethod(options) {
				try {
					const result = await fn(options);
					const payload = result === undefined ? { method } : { method, result };
					emit(method, payload);
					if (method !== 'sync')
						emit('sync', payload);
					return result;
				}
				catch (error) {
					const payload = { method, error };
					emit(method + '-error', payload);
					emit('error', payload);
					throw error;
				}
			};
		}

		function emit(event, payload) {
			const listeners = eventListeners.get(event);
			if (!listeners)
				return;
			for (const listener of Array.from(listeners))
				listener(payload);
		}

		async function pull(options = {}) {
			const db = await getDb();
			const syncConfig = normalizeSyncConfig(db && db.__sqliteSync);
			if (!syncConfig)
				throw new Error('Sync is not configured. Add sync in sqlite options: sqlite(connectionString, { sync: ... })');

			const pullOptions = normalizePullOptions(options);
			const pullConfig = resolvePullConfig(syncConfig, pullOptions);
			const configuredTables = resolveSyncTables(db, pullConfig.tables, client);
			if (!Array.isArray(configuredTables) || configuredTables.length === 0)
				throw new Error('Sync pull requires mapped tables or configured tables. Set sync.tables when the client has no table map.');
			await ensureSyncSchema(db, client, configuredTables, syncConfig.schema);
			const stableBaseEnabled = isStableBaseEnabled(syncConfig);
			const hadStableBase = stableBaseEnabled && await hasStableBase(db);
			if (stableBaseEnabled && !hadStableBase)
				return runSyncMaintenance(db, () => pullCore(db, syncConfig, pullConfig, configuredTables, hadStableBase));
			return pullCore(db, syncConfig, pullConfig, configuredTables, hadStableBase);
		}

		async function pullCore(db, syncConfig, pullConfig, configuredTables, hadStableBase) {
			const stableBaseEnabled = isStableBaseEnabled(syncConfig);
			const pushResult = await pushBeforePull(db, syncConfig, hadStableBase);
			await maybeEmitInitialReady(syncConfig, configuredTables, db, 'persisted');
			const currentSince = await getScopeSince(configuredTables, db);
			const scopeKey = getScopeKey(configuredTables);
			const requestOptions = {
				tables: configuredTables,
				since: currentSince,
				db,
				scopeKey,
				_syncInterceptors: interceptors,
				_syncAxiosInterceptor: axiosInterceptor
			};
			let result;
			try {
				result = await pullStaged(pullConfig, requestOptions);
			}
			catch (e) {
				if (!shouldFallbackToPatch(e))
					throw e;
				result = await pullPatch(pullConfig, requestOptions);
			}
			if (result && result.since !== undefined && result.checkpointApplied !== true)
				await setScopeSince(configuredTables, result.since, db);
			let pushedBaseUpdated = false;
			let needsStableBaseSnapshot = stableBaseEnabled && hadStableBase && await hasStableBaseSnapshotPending(db);
			if (stableBaseEnabled && hadStableBase && didPushMutations(pushResult)) {
				if (!needsStableBaseSnapshot)
					pushedBaseUpdated = await savePushedMutationsToStableBase(db, getAcceptedPushMutations(pushResult));
				if (!pushedBaseUpdated)
					needsStableBaseSnapshot = true;
			}
			if (stableBaseEnabled && !hadStableBase)
				await clearPendingMutations(db);
			if (needsStableBaseSnapshot || shouldSaveStableBase(stableBaseEnabled, hadStableBase, pushResult, result, pushedBaseUpdated)) {
				const saved = await saveStableBase(db);
				if (saved || needsStableBaseSnapshot)
					await setStableBaseSnapshotPending(db, !saved && needsStableBaseSnapshot);
			}
			await maybeEmitInitialReady(syncConfig, configuredTables, db, 'sync');
			return result;
		}

		async function resetLocal(options = {}) {
			const db = await getDb();
			const syncConfig = normalizeSyncConfig(db && db.__sqliteSync);
			if (!syncConfig)
				throw new Error('Sync is not configured. Add sync in sqlite options: sqlite(connectionString, { sync: ... })');
			if (!options || options.force !== true)
				throw new Error('resetLocal requires { force: true } because it deletes local sync data.');

			const configuredTables = resolveSyncTables(db, normalizeConfiguredTables(options.tables) || syncConfig.tables, client);
			if (!Array.isArray(configuredTables) || configuredTables.length === 0)
				throw new Error('Sync resetLocal requires mapped tables or configured tables.');
			return runSyncMaintenance(db, async () => {
				const droppedTables = await dropLocalSyncTables(db, client, configuredTables);
				await dropExistingBaseTables(db);
				await db.query(`DROP TABLE IF EXISTS "${syncBaseTable}"`);
				sinceByScope.clear();
				ensuredInternalTables.delete(db);
				clearEnsuredSyncSchema(db);
				initialReadyEmitted = false;
				return {
					reset: true,
					tables: configuredTables,
					droppedTables
				};
			});
		}

		async function pushPending(options = {}) {
			const db = await getDb();
			const syncConfig = options._syncConfig || normalizeSyncConfig(db && db.__sqliteSync);
			if (!syncConfig)
				throw new Error('Sync is not configured. Add sync in sqlite options: sqlite(connectionString, { sync: ... })');
			const pushConfig = options._pushConfig || resolvePushConfig(syncConfig, options);
			const configuredTables = resolveSyncTables(db, syncConfig.tables, client);
			await ensureSyncSchema(db, client, configuredTables, syncConfig.schema);
			const limit = 1;
			const pending = await readPendingMutations(db, limit);
			if (pending.length === 0)
				return { phase: 'push', applied: 0, duplicates: 0, results: [] };
			const clientId = typeof options.clientId === 'string' ? options.clientId : await getClientId(db);
			let result;
			try {
				result = await sendPush(pushConfig, clientId, pending);
			}
			catch (e) {
				if (isConflictError(e) && isStableBaseEnabled(syncConfig)) {
					await rollbackFailedPushBatch(db, pending, e);
					emitOperationErrors(pending, e, false);
				}
				else {
					await markPendingMutationAttempts(db, pending, e);
					emitOperationErrors(pending, e, !isConflictError(e));
				}
				throw e;
			}
			const acceptedMutations = await markPushedMutations(db, result, pending);
			attachAcceptedPushMutations(result, acceptedMutations);
			return result;
		}

		async function pushBeforePull(db, syncConfig, hasBase) {
			if (isStableBaseEnabled(syncConfig) && !hasBase)
				return;
			const pushConfig = resolvePushConfig(syncConfig);
			const maxBatches = resolveMaxPushBatches(syncConfig);
			const results = [];
			for (let i = 0; i < maxBatches; i++) {
				const result = await pushPending({ _syncConfig: syncConfig, _pushConfig: pushConfig });
				if (!didPushBatchAdvance(result))
					break;
				results.push(result);
			}
			return combinePushResults(results);
		}

		function shouldSaveStableBase(stableBaseEnabled, hadStableBase, pushResult, pullResult, pushedBaseUpdated) {
			if (!stableBaseEnabled)
				return false;
			return !hadStableBase || didPullRows(pullResult) || didPushMutations(pushResult) && !pushedBaseUpdated;
		}

		async function hasStableBaseSnapshotPending(db) {
			const state = await readScopeState('__orange_sync_stable_base_snapshot_pending__', db);
			return state && state.since === true;
		}

		async function setStableBaseSnapshotPending(db, pending) {
			await writeScopeState('__orange_sync_stable_base_snapshot_pending__', {
				since: pending === true,
				updatedAtMs: Date.now()
			}, db);
		}

		function didPushMutations(result) {
			if (!result)
				return false;
			if (Number(result.applied) > 0 || Number(result.duplicates) > 0)
				return true;
			return Array.isArray(result.results) && result.results.length > 0;
		}

		function didPullRows(result) {
			return Number(result && result.applied) > 0;
		}

		function didPushBatchAdvance(result) {
			return getAcceptedPushMutations(result).length > 0;
		}

		function combinePushResults(results) {
			if (!Array.isArray(results) || results.length === 0)
				return;
			if (results.length === 1)
				return results[0];
			const combined = {
				phase: 'push',
				applied: 0,
				duplicates: 0,
				results: [],
				batches: results.length
			};
			const acceptedMutations = [];
			for (let i = 0; i < results.length; i++) {
				const result = results[i];
				combined.applied += Number(result && result.applied || 0);
				combined.duplicates += Number(result && result.duplicates || 0);
				if (Array.isArray(result && result.results))
					combined.results.push(...result.results);
				acceptedMutations.push(...getAcceptedPushMutations(result));
			}
			attachAcceptedPushMutations(combined, acceptedMutations);
			return combined;
		}

		async function rollbackFailedPushBatch(db, attemptedMutations, error) {
			return runSyncMaintenance(db, () => rollbackFailedPushBatchCore(db, attemptedMutations, error));
		}

		async function rollbackFailedPushBatchCore(db, attemptedMutations, error) {
			if (!await hasStableBase(db))
				return;
			const remaining = await readPendingMutationRows(db, 10000, mutationIdsToSet(attemptedMutations));
			await restoreStableBase(db);
			await ensureSyncOutboxTable(db);
			for (let i = 0; i < attemptedMutations.length; i++) {
				const failedRow = failedOutboxRow(attemptedMutations[i], error);
				if (failedRow)
					await insertOutboxRow(db, failedRow);
			}
			for (let i = 0; i < remaining.length; i++) {
				const row = remaining[i];
				const mutation = rowToMutation(row);
				if (!mutation)
					continue;
				try {
					await replayMutation(mutation);
					await insertOutboxRow(db, row);
				}
				catch (_e) {
					// A later mutation may depend on the discarded failed batch. Keep local state
					// consistent by not restoring mutations that cannot replay on the base.
				}
			}
			sinceByScope.clear();
			ensuredInternalTables.delete(db);
			clearEnsuredSyncSchema(db);
			initialReadyEmitted = false;
		}

		async function replayMutation(mutation) {
			const patches = mutationToPatchEntries(mutation);
			const commands = Array.isArray(mutation.commands) ? mutation.commands : [];
			if (patches.length === 0 && commands.length === 0)
				return;
			await client.transaction(async (tx) => {
				await tryDeferForeignKeys(tx);
				for (let i = 0; i < patches.length; i++) {
					const entry = patches[i];
					if (!tx[entry.table] || typeof tx[entry.table].patch !== 'function')
						throw new Error(`Table "${entry.table}" does not exist in this client`);
					await tx[entry.table].patch(entry.patch, {
						...(entry.options || {}),
						concurrency: 'overwrite',
						skipSelectAfterInsert: true
					});
				}
				await validateForeignKeys(tx);
			}, { suppressSyncOutbox: true });
		}

		function mutationToPatchEntries(mutation) {
			if (!mutation || mutation !== Object(mutation))
				return [];
			if (Array.isArray(mutation.patches))
				return mutation.patches.map(normalizeMutationPatch).filter(Boolean);
			const entry = normalizeMutationPatch(mutation);
			return entry ? [entry] : [];
		}

		async function sendPush(pushConfig, clientId, mutations) {
			return requestPayload({
				...pushConfig,
				syncPhase: 'push',
				body: {
					phase: 'push',
					clientId,
					mutations: mutations.map(stripMutationForPush)
				}
			}, {
				_syncInterceptors: interceptors,
				_syncAxiosInterceptor: axiosInterceptor
			});
		}

		function isConflictError(error) {
			return Number(error && error.response && error.response.status) === 409
				|| Number(error && error.status) === 409;
		}

		async function pullStaged(pullConfig, options) {
			const maxKeysPerBatch = normalizeLimit(pullConfig.maxKeysPerBatch, 1000);
			const maxRowsPerBatch = normalizeLimit(pullConfig.maxRowsPerBatch, 1000);
			const maxJournalRowsPerInsert = normalizeLimit(pullConfig.maxJournalRowsPerInsert, maxRowsPerBatch);
			const defaultPatchOptions = { ...(pullConfig.patchOptions || {}), concurrency: 'overwrite', skipSelectAfterInsert: true };
			const db = options.db;
			const scopeKey = options.scopeKey || getScopeKey(options.tables);
			await ensurePullJournalTables(db);
			const session = await stagePullJournal();
			let applied = 0;
			const shouldApplyCheckpoint = session.finalSince !== undefined;
			await client.transaction(async (tx) => {
				await tryDeferForeignKeys(tx);
				const batches = await readPullJournalBatches(tx, scopeKey);
				const hasJournalItems = batches.length > 0;
				const touchedTables = new Set();
				for (let i = 0; i < batches.length; i++) {
					const batch = batches[i];
					for (let itemIndex = 0; itemIndex < batch.length; itemIndex++)
						touchedTables.add(batch[itemIndex].table);
					const deleteItems = batch.filter(x => x.op === 'D');
					const upsertItems = batch.filter(x => x.op !== 'D' && x.row !== undefined);
					if (deleteItems.length > 0)
						applied += await applyDeleteItemsOnTx(tx, deleteItems, defaultPatchOptions);
					if (upsertItems.length > 0)
						applied += await applyRowsPayloadOnTx(tx, upsertItems, defaultPatchOptions);
				}
				if (hasJournalItems)
					await validateForeignKeys(tx);
				if (shouldApplyCheckpoint)
					await writeScopeState(scopeKey, { since: session.finalSince, updatedAtMs: Date.now() }, tx);
				if (hasJournalItems || session.persisted)
					await clearPullJournal(tx, scopeKey);
				session.tables = Array.from(touchedTables);
			}, { suppressSyncOutbox: true });
			if (shouldApplyCheckpoint)
				sinceByScope.set(scopeKey, session.finalSince);

			return {
				applied,
				tables: session.tables || [],
				since: session.finalSince,
				payload: session.payload,
				checkpointApplied: true
			};

			async function stagePullJournal() {
				let session = await readPullSession(db, scopeKey);
				let hasPersistedSession = !!session;
				if (session)
					session.persisted = true;
				if (!session)
					session = newPullSession(scopeKey, options.since);
				let reason = session.reason;
				let pendingFetch = session.done ? null : startPullBatchFetch(session, reason);
				for (let i = 0; i < 10000; i++) {
					if (session.done)
						return session;
					const batch = await resolvePullBatchFetch(pendingFetch);
					pendingFetch = null;
					reason = batch.reason;
					const nextFetch = batch.done
						? null
						: startPullBatchFetch(previewPullSession(session, batch), reason);
					if (!hasPersistedSession && batch.done && batch.keyItems.length === 0) {
						suppressPullBatchFetch(nextFetch);
						return {
							...session,
							token: batch.token || undefined,
							done: true,
							finalSince: batch.finalSince,
							payload: batch.payload,
							reason,
							status: 'ready',
							persisted: false
						};
					}
					if (!hasPersistedSession) {
						session = await createPullSession(db, scopeKey, session.since);
						hasPersistedSession = true;
					}
					try {
						session = await persistPullJournalBatch(db, scopeKey, session, batch.keysPayload, batch.keyItems, batch.rowItems, reason, maxJournalRowsPerInsert);
					}
					catch (e) {
						suppressPullBatchFetch(nextFetch);
						throw e;
					}
					pendingFetch = nextFetch;
				}
				suppressPullBatchFetch(pendingFetch);
				throw new Error('Sync failed: staged pull exceeded max iterations');
			}

			function startPullBatchFetch(session, reason) {
				return fetchPullBatch(session, reason).then(
					(batch) => ({ batch, error: null }),
					(error) => ({ batch: null, error })
				);
			}

			async function resolvePullBatchFetch(promise) {
				if (!promise)
					throw new Error('Sync failed: missing staged pull request');
				const result = await promise;
				if (result.error)
					throw result.error;
				return result.batch;
			}

			function suppressPullBatchFetch(promise) {
				if (promise && typeof promise.then === 'function')
					promise.then(() => {}, () => {});
			}

			async function fetchPullBatch(session, reason) {
				const keysPayload = await requestPayload({
					...pullConfig,
					body: {
						phase: 'keys',
						token: session.token,
						since: session.since,
						tables: options.tables,
						limit: maxKeysPerBatch
					}
				}, options);
				if (!isStagedKeysPayload(keysPayload))
					throw new Error('Sync endpoint did not return staged keys payload');
				const nextReason = reason === undefined && keysPayload.reason !== undefined
					? keysPayload.reason
					: reason;
				const keyItems = normalizeKeyItems(keysPayload.items);
				const upsertItems = keyItems.filter(x => x.op !== 'D');
				const rowItems = upsertItems.length > 0
					? await fetchRowsItems(upsertItems)
					: [];
				const token = keysPayload.done || !keysPayload.token ? null : keysPayload.token;
				const done = keysPayload.done || !keysPayload.token;
				const finalSince = keysPayload.cursor !== undefined ? keysPayload.cursor : session.finalSince;
				const payload = nextReason === undefined ? keysPayload : { ...keysPayload, reason: nextReason };
				return {
					keysPayload,
					keyItems,
					rowItems,
					token,
					done,
					finalSince,
					payload,
					reason: nextReason
				};
			}

			function previewPullSession(session, batch) {
				return {
					...session,
					token: batch.token || undefined,
					done: batch.done,
					finalSince: batch.finalSince,
					payload: batch.payload,
					reason: batch.reason,
					status: batch.done ? 'ready' : 'pending'
				};
			}

			async function fetchRowsItems(items) {
				const queue = chunkItems(items, maxRowsPerBatch);
				const rows = [];
				let prefetched = null;
				while (queue.length > 0 || prefetched) {
					let currentItems;
					let currentRowsResult;
					if (prefetched) {
						currentItems = prefetched.items;
						currentRowsResult = await prefetched.promise;
						prefetched = null;
					}
					else {
						currentItems = queue.shift();
						currentRowsResult = await requestRowsItems(currentItems);
					}
					if (!Array.isArray(currentItems) || currentItems.length === 0)
						continue;
					if (currentRowsResult.error)
						throw currentRowsResult.error;
					const payload = currentRowsResult.payload;
					if (!isRowsPayload(payload))
						throw new Error('Sync endpoint did not return rows payload');
					for (let i = 0; i < payload.items.length; i++)
						rows.push(payload.items[i]);
					const acceptedCount = getRowsAcceptedCount(payload, currentItems.length);
					const acceptedItems = acceptedCount < currentItems.length
						? currentItems.slice(0, acceptedCount)
						: currentItems;
					const missingItems = getMissingRowItems(acceptedItems, payload.items);
					if (acceptedCount >= currentItems.length && missingItems.length === 0 && queue.length > 0) {
						const nextItems = queue.shift();
						prefetched = {
							items: nextItems,
							promise: requestRowsItems(nextItems)
						};
					}
					if (acceptedCount < currentItems.length) {
						const deferredItems = currentItems.slice(acceptedCount);
						enqueueMissingRows(queue, acceptedItems, missingItems);
						if (deferredItems.length > 0)
							queue.unshift(deferredItems);
						continue;
					}
					enqueueMissingRows(queue, currentItems, missingItems);
				}
				return rows;
			}

			function requestRowsItems(items) {
				return requestPayload({
					...pullConfig,
					body: {
						phase: 'rows',
						items
					}
				}, options)
					.then(
						(payload) => ({ payload, error: null }),
						(error) => ({ payload: null, error })
					);
			}
		}

		async function pullPatch(pullConfig, options) {
			const payload = await requestPayload(pullConfig, options);
			const tablePatches = extractTablePatches(payload);
			const defaultPatchOptions = { ...(pullConfig.patchOptions || {}), concurrency: 'overwrite' };
			let applied = 0;
			if (tablePatches.length > 0) {
				await client.transaction(async (tx) => {
					await tryDeferForeignKeys(tx);
					for (let i = 0; i < tablePatches.length; i++) {
						const entry = tablePatches[i];
						if (!tx[entry.table] || typeof tx[entry.table].patch !== 'function')
							throw new Error(`Table "${entry.table}" does not exist in this client`);
						const patchOptions = { ...defaultPatchOptions, ...(entry.options || {}), concurrency: 'overwrite' };
						await tx[entry.table].patch(entry.patch, patchOptions);
						applied += entry.patch.length;
					}
					await validateForeignKeys(tx);
				}, { suppressSyncOutbox: true });
			}
			return {
				applied,
				tables: tablePatches.map(x => x.table),
				since: payload && (payload.since ?? payload.cursor),
				payload
			};
		}

		function normalizePullOptions(input) {
			if (!input || input !== Object(input))
				return {};
			const timeoutMs = normalizeTimeoutMs(input.timeoutMs);
			const result = {};
			if (timeoutMs !== undefined)
				result.timeoutMs = timeoutMs;
			return result;
		}

		function normalizeSyncOptions(input) {
			if (!input || input !== Object(input))
				return {};
			const keys = Object.keys(input);
			const invalidKeys = keys.filter(key => key !== 'timeoutMs');
			if (invalidKeys.length > 0)
				throw new Error(`Unsupported sync option "${invalidKeys[0]}". sync only accepts { timeoutMs }.`);
			return normalizePullOptions(input);
		}

		function normalizeMutationPatch(input) {
			if (!input || input !== Object(input))
				return null;
			if (typeof input.table !== 'string' || input.table.length === 0)
				return null;
			if (!Array.isArray(input.patch))
				return null;
			return {
				table: input.table,
				patch: input.patch,
				options: input.options
			};
		}

		function normalizeTimeoutMs(value) {
			const parsed = Number.parseInt(value, 10);
			if (!Number.isFinite(parsed) || parsed <= 0)
				return undefined;
			return parsed;
		}

		async function getScopeSince(tables, db) {
			const scopeKey = getScopeKey(tables);
			if (sinceByScope.has(scopeKey))
				return sinceByScope.get(scopeKey);
			const persisted = await readScopeSince(scopeKey, db);
			if (persisted !== undefined)
				sinceByScope.set(scopeKey, persisted);
			return persisted;
		}

		async function setScopeSince(tables, since, db) {
			const scopeKey = getScopeKey(tables);
			sinceByScope.set(scopeKey, since);
			await writeScopeState(scopeKey, { since, updatedAtMs: Date.now() }, db);
		}

		function getScopeKey(tables) {
			if (!Array.isArray(tables) || tables.length === 0)
				return '*';
			const dedup = Array.from(new Set(tables.filter(x => typeof x === 'string')));
			dedup.sort();
			return dedup.join('|');
		}

		async function ensureSyncStateTable(db) {
			if (isInternalTableEnsured(db, syncStateTable))
				return;
			await db.query([
				`CREATE TABLE IF NOT EXISTS "${syncStateTable}" (`,
				'"scope" TEXT PRIMARY KEY,',
				'"since_value" TEXT NOT NULL',
				');'
			].join(' '));
			markInternalTableEnsured(db, syncStateTable);
		}

		async function ensureSyncClientTable(db) {
			if (isInternalTableEnsured(db, syncClientTable))
				return;
			await db.query([
				`CREATE TABLE IF NOT EXISTS "${syncClientTable}" (`,
				'"id" TEXT PRIMARY KEY',
				');'
			].join(' '));
			markInternalTableEnsured(db, syncClientTable);
		}

		async function ensureSyncOutboxTable(db) {
			if (isInternalTableEnsured(db, syncOutboxTable))
				return;
			await db.query(outboxTableSql(syncOutboxTable));
			await ensureOutboxOperationColumns((sql) => db.query(sql), syncOutboxTable);
			markInternalTableEnsured(db, syncOutboxTable);
		}

		async function ensurePullJournalTables(db) {
			if (isInternalTableEnsured(db, syncPullSessionTable) && isInternalTableEnsured(db, syncPullItemTable))
				return;
			await db.query([
				`CREATE TABLE IF NOT EXISTS "${syncPullSessionTable}" (`,
				'"scope" TEXT PRIMARY KEY,',
				'"since_value" TEXT,',
				'"token_json" TEXT,',
				'"done" INTEGER NOT NULL DEFAULT 0,',
				'"final_since" TEXT,',
				'"payload_json" TEXT,',
				'"reason" TEXT,',
				'"status" TEXT NOT NULL,',
				'"next_seq" INTEGER NOT NULL DEFAULT 0,',
				'"next_batch" INTEGER NOT NULL DEFAULT 0,',
				'"updated_at_ms" INTEGER NOT NULL',
				');'
			].join(' '));
			await db.query([
				`CREATE TABLE IF NOT EXISTS "${syncPullItemTable}" (`,
				'"scope" TEXT NOT NULL,',
				'"batch_no" INTEGER NOT NULL,',
				'"seq" INTEGER NOT NULL,',
				'"table_name" TEXT NOT NULL,',
				'"pk_json" TEXT NOT NULL,',
				'"key_json" TEXT,',
				'"op" TEXT NOT NULL,',
				'"row_json" TEXT,',
				'PRIMARY KEY ("scope", "seq")',
				');'
			].join(' '));
			await db.query(`CREATE INDEX IF NOT EXISTS "${syncPullItemTable}_batch_idx" ON "${syncPullItemTable}" ("scope", "batch_no", "seq")`);
			markInternalTableEnsured(db, syncPullSessionTable);
			markInternalTableEnsured(db, syncPullItemTable);
		}

		async function readPullSession(db, scopeKey) {
			await ensurePullJournalTables(db);
			const rows = await db.query([
				'SELECT "scope", "since_value", "token_json", "done", "final_since", "payload_json", "reason", "status", "next_seq", "next_batch"',
				`FROM "${syncPullSessionTable}"`,
				`WHERE "scope" = ${sqlStringLiteral(scopeKey)}`,
				'LIMIT 1'
			].join(' '));
			const row = Array.isArray(rows) ? rows[0] : rows?.rows?.[0];
			if (!row)
				return null;
			return pullSessionFromRow(row);
		}

		async function createPullSession(db, scopeKey, since) {
			await ensurePullJournalTables(db);
			const now = Date.now();
			await db.query([
				`INSERT INTO "${syncPullSessionTable}" ("scope", "since_value", "token_json", "done", "final_since", "payload_json", "reason", "status", "next_seq", "next_batch", "updated_at_ms")`,
				`VALUES (${sqlStringLiteral(scopeKey)}, ${sqlNullableJsonLiteral(since)}, NULL, 0, ${sqlNullableJsonLiteral(since)}, NULL, NULL, 'pending', 0, 0, ${now})`
			].join(' '));
			return newPullSession(scopeKey, since);
		}

		function newPullSession(scopeKey, since) {
			return {
				scope: scopeKey,
				since,
				token: undefined,
				done: false,
				finalSince: since,
				payload: undefined,
				reason: undefined,
				status: 'pending',
				nextSeq: 0,
				nextBatch: 0
			};
		}

		async function persistPullJournalBatch(db, scopeKey, session, keysPayload, keyItems, rowItems, reason, maxJournalRowsPerInsert) {
			let nextSession;
			await client.transaction(async (tx) => {
				const rowMap = rowsBySyncItemKey(rowItems);
				const batchNo = session.nextBatch || 0;
				let seq = session.nextSeq || 0;
				const journalRows = [];
				for (let i = 0; i < keyItems.length; i++) {
					const item = keyItems[i];
					const rowItem = item.op === 'D' ? undefined : rowMap.get(syncItemKey(item));
					journalRows.push([
						sqlStringLiteral(scopeKey),
						String(batchNo),
						String(seq),
						sqlStringLiteral(item.table),
						sqlStringLiteral(stringify(item.pk)),
						'NULL',
						sqlStringLiteral(item.op),
						sqlNullableJsonLiteral(rowItem ? rowItem.row : undefined)
					]);
					seq += 1;
				}
				await insertPullJournalItems(tx, journalRows, maxJournalRowsPerInsert);
				const finalSince = keysPayload.cursor !== undefined ? keysPayload.cursor : session.finalSince;
				const payload = reason === undefined ? keysPayload : { ...keysPayload, reason };
				const token = keysPayload.done || !keysPayload.token ? null : keysPayload.token;
				const done = keysPayload.done || !keysPayload.token ? 1 : 0;
				await tx.query([
					`UPDATE "${syncPullSessionTable}"`,
					`SET "token_json" = ${sqlNullableJsonLiteral(token)},`,
					`"done" = ${done},`,
					`"final_since" = ${sqlNullableJsonLiteral(finalSince)},`,
					`"payload_json" = ${sqlNullableJsonLiteral(payload)},`,
					`"reason" = ${sqlNullableStringLiteral(reason)},`,
					`"status" = ${sqlStringLiteral(done ? 'ready' : 'pending')},`,
					`"next_seq" = ${seq},`,
					`"next_batch" = ${batchNo + 1},`,
					`"updated_at_ms" = ${Date.now()}`,
					`WHERE "scope" = ${sqlStringLiteral(scopeKey)}`
				].join(' '));
				nextSession = {
					...session,
					token: token || undefined,
					done: done === 1,
					finalSince,
					payload,
					reason,
					status: done ? 'ready' : 'pending',
					nextSeq: seq,
					nextBatch: batchNo + 1,
					persisted: true
				};
			}, { suppressSyncOutbox: true });
			return nextSession;
		}

		async function insertPullJournalItems(db, rows, maxRowsPerInsert) {
			if (!Array.isArray(rows) || rows.length === 0)
				return;
			const chunkSize = normalizeLimit(maxRowsPerInsert, 200);
			const prefix = `INSERT INTO "${syncPullItemTable}" ("scope", "batch_no", "seq", "table_name", "pk_json", "key_json", "op", "row_json") VALUES `;
			for (let offset = 0; offset < rows.length; offset += chunkSize) {
				const chunk = rows.slice(offset, offset + chunkSize);
				await db.query(prefix + chunk.map(row => `(${row.join(', ')})`).join(', '));
			}
		}

		async function readPullJournalBatches(db, scopeKey) {
			await ensurePullJournalTables(db);
			const rows = await db.query([
				'SELECT "batch_no", "seq", "table_name", "pk_json", "key_json", "op", "row_json"',
				`FROM "${syncPullItemTable}"`,
				`WHERE "scope" = ${sqlStringLiteral(scopeKey)}`,
				'ORDER BY "batch_no" ASC, "seq" ASC'
			].join(' '));
			const list = Array.isArray(rows) ? rows : rows?.rows || [];
			const batches = [];
			let currentBatchNo;
			let currentBatch = [];
			for (let i = 0; i < list.length; i++) {
				const item = pullItemFromRow(list[i]);
				if (!item)
					continue;
				if (currentBatchNo !== item.batchNo) {
					if (currentBatch.length > 0)
						batches.push(currentBatch);
					currentBatchNo = item.batchNo;
					currentBatch = [];
				}
				currentBatch.push(item);
			}
			if (currentBatch.length > 0)
				batches.push(currentBatch);
			return batches;
		}

		async function clearPullJournal(db, scopeKey) {
			const hasOtherSession = await hasOtherPullJournalSession(db, scopeKey);
			if (hasOtherSession) {
				await db.query(`DELETE FROM "${syncPullItemTable}" WHERE "scope" = ${sqlStringLiteral(scopeKey)}`);
				await db.query(`DELETE FROM "${syncPullSessionTable}" WHERE "scope" = ${sqlStringLiteral(scopeKey)}`);
				return;
			}
			await db.query(`DELETE FROM "${syncPullItemTable}"`);
			await db.query(`DELETE FROM "${syncPullSessionTable}"`);
		}

		async function hasOtherPullJournalSession(db, scopeKey) {
			const rows = await db.query([
				'SELECT "scope"',
				`FROM "${syncPullSessionTable}"`,
				`WHERE "scope" <> ${sqlStringLiteral(scopeKey)}`,
				'LIMIT 1'
			].join(' '));
			const list = Array.isArray(rows) ? rows : rows?.rows || [];
			return list.length > 0;
		}

		function isInternalTableEnsured(db, tableName) {
			const ensured = ensuredInternalTables.get(db);
			return ensured ? ensured.has(tableName) : false;
		}

		function markInternalTableEnsured(db, tableName) {
			let ensured = ensuredInternalTables.get(db);
			if (!ensured) {
				ensured = new Set();
				ensuredInternalTables.set(db, ensured);
			}
			ensured.add(tableName);
		}

		function clearInternalTableEnsured(db, tableName) {
			const ensured = ensuredInternalTables.get(db);
			if (ensured)
				ensured.delete(tableName);
		}

		function isMissingSqliteTableError(error, tableName) {
			const message = error && error.message || '';
			return message.includes(`no such table: ${tableName}`)
				|| message.includes(`no such table: ${quoteIdent(tableName)}`);
		}

		async function getClientId(db) {
			await ensureSyncClientTable(db);
			const rows = await db.query(`SELECT "id" FROM "${syncClientTable}" LIMIT 1`);
			const row = Array.isArray(rows) ? rows[0] : rows?.rows?.[0];
			const existing = row && (row.id ?? row.ID);
			if (typeof existing === 'string' && existing.length > 0)
				return existing;
			const id = randomUuid();
			await db.query(`INSERT INTO "${syncClientTable}" ("id") VALUES (${sqlStringLiteral(id)})`);
			return id;
		}

		async function readPendingMutations(db, limit) {
			const rows = await readPendingMutationRows(db, limit);
			const result = [];
			for (let i = 0; i < rows.length; i++) {
				const row = rows[i];
				const mutation = rowToMutation(row);
				if (mutation)
					result.push(mutation);
			}
			return result;
		}

		async function readPendingMutationRows(db, limit, excludeIds) {
			await ensureSyncOutboxTable(db);
			const rows = await db.query([
				`SELECT "mutation_id", "table_name", "patch_json", "options_json", "created_at_ms", "operation_id", "operation_name", "operation_json", "status", "last_error", "attempts", "pushed_at_ms", "result_json" FROM "${syncOutboxTable}"`,
				'WHERE "status" = \'pending\'',
				'ORDER BY "created_at_ms" ASC',
				`LIMIT ${limit}`
			].join(' '));
			const list = Array.isArray(rows) ? rows : rows?.rows || [];
			if (!excludeIds || excludeIds.size === 0)
				return list;
			return list.filter(row => !excludeIds.has(row.mutation_id ?? row.MUTATION_ID));
		}

		function rowToMutation(row) {
			const id = row.mutation_id ?? row.MUTATION_ID;
			const table = row.table_name ?? row.TABLE_NAME;
			const patchJson = row.patch_json ?? row.PATCH_JSON;
			const optionsJson = row.options_json ?? row.OPTIONS_JSON;
			if (typeof id !== 'string' || typeof table !== 'string' || typeof patchJson !== 'string')
				return null;
			try {
				const parsedPatch = JSON.parse(patchJson);
				if (table === '*') {
					if (parsedPatch && parsedPatch === Object(parsedPatch) && !Array.isArray(parsedPatch)) {
						return withOutboxMetadata({
							id,
							patches: Array.isArray(parsedPatch.patches) ? parsedPatch.patches : [],
							commands: Array.isArray(parsedPatch.commands) ? parsedPatch.commands : [],
							options: optionsJson ? JSON.parse(optionsJson) : undefined
						}, row);
					}
					return withOutboxMetadata({
						id,
						patches: parsedPatch,
						options: optionsJson ? JSON.parse(optionsJson) : undefined
					}, row);
				}
				return withOutboxMetadata({
					id,
					table,
					patch: parsedPatch,
					options: optionsJson ? JSON.parse(optionsJson) : undefined
				}, row);
			}
			catch (_e) {
				return null;
			}
		}

		function withOutboxMetadata(mutation, row) {
			const operation = rowToOperation(row);
			Object.defineProperty(mutation, '__operation', {
				value: operation,
				enumerable: false,
				configurable: true
			});
			Object.defineProperty(mutation, '__outboxRow', {
				value: row,
				enumerable: false,
				configurable: true
			});
			return mutation;
		}

		function rowToOperation(row) {
			const mutationId = row.mutation_id ?? row.MUTATION_ID;
			const operationId = row.operation_id ?? row.OPERATION_ID;
			const operationName = row.operation_name ?? row.OPERATION_NAME;
			const operationJson = row.operation_json ?? row.OPERATION_JSON;
			if (typeof mutationId !== 'string' || typeof operationName !== 'string' || operationName.length === 0)
				return null;
			const context = parseOperationContext(operationJson);
			return {
				mutationId,
				operationId,
				operationName,
				context
			};
		}

		function parseOperationContext(operationJson) {
			if (typeof operationJson !== 'string' || operationJson.length === 0)
				return {};
			try {
				const parsed = JSON.parse(operationJson);
				return parsed && parsed === Object(parsed) && !Array.isArray(parsed) ? parsed : {};
			}
			catch (_e) {
				return {};
			}
		}

		function stripMutationForPush(mutation) {
			if (!mutation || mutation !== Object(mutation))
				return mutation;
			const result = {};
			const keys = Object.keys(mutation);
			for (let i = 0; i < keys.length; i++)
				result[keys[i]] = mutation[keys[i]];
			return result;
		}

		function mutationsById(mutations) {
			const result = new Map();
			if (!Array.isArray(mutations))
				return result;
			for (let i = 0; i < mutations.length; i++) {
				const mutation = mutations[i];
				if (mutation && typeof mutation.id === 'string')
					result.set(mutation.id, mutation);
			}
			return result;
		}

		function failedOutboxRow(mutation, error) {
			const row = mutation && mutation.__outboxRow;
			if (!row)
				return null;
			const attempts = Number(row.attempts ?? row.ATTEMPTS ?? 0);
			return {
				mutation_id: row.mutation_id ?? row.MUTATION_ID,
				table_name: row.table_name ?? row.TABLE_NAME,
				patch_json: row.patch_json ?? row.PATCH_JSON,
				options_json: row.options_json ?? row.OPTIONS_JSON,
				created_at_ms: row.created_at_ms ?? row.CREATED_AT_MS,
				operation_id: row.operation_id ?? row.OPERATION_ID,
				operation_name: row.operation_name ?? row.OPERATION_NAME,
				operation_json: row.operation_json ?? row.OPERATION_JSON,
				status: 'failed',
				last_error: syncOperationError(error).message,
				attempts: Number.isFinite(attempts) ? attempts + 1 : 1,
				pushed_at_ms: undefined,
				result_json: undefined
			};
		}

		async function markPendingMutationAttempts(db, mutations, error) {
			await ensureSyncOutboxTable(db);
			const message = syncOperationError(error).message;
			for (let i = 0; i < mutations.length; i++) {
				const id = mutations[i] && mutations[i].id;
				if (typeof id !== 'string')
					continue;
				await db.query([
					`UPDATE "${syncOutboxTable}"`,
					`SET "attempts" = "attempts" + 1, "last_error" = ${sqlStringLiteral(message)}`,
					`WHERE "mutation_id" = ${sqlStringLiteral(id)} AND "status" = 'pending'`
				].join(' '));
			}
		}

		function emitOperationSuccess(mutation, result) {
			const operation = mutation && mutation.__operation;
			if (!operation || !operation.operationName)
				return;
			emitOperationEvent({
				ok: true,
				operation: operation.operationName,
				mutationId: operation.mutationId || mutation.id,
				context: operation.context || {},
				result,
				retryable: false
			});
		}

		function emitOperationErrors(mutations, error, retryable) {
			const operationError = syncOperationError(error);
			for (let i = 0; i < mutations.length; i++) {
				const mutation = mutations[i];
				const operation = mutation && mutation.__operation;
				if (!operation || !operation.operationName)
					continue;
				emitOperationEvent({
					ok: false,
					operation: operation.operationName,
					mutationId: operation.mutationId || mutation.id,
					context: operation.context || {},
					retryable,
					error: operationError
				});
			}
		}

		function emitOperationEvent(event) {
			event = withSyncOperationMemory(event);
			emit(`operation:${event.operation}`, event);
			finalizeSyncOperationMemory(event);
			if (event.ok || event.retryable === false)
				deleteSyncOperationMemory(event.mutationId);
		}

		function syncOperationError(error) {
			const rawStatus = error && (error.status ?? (error.response && error.response.status));
			const status = Number(rawStatus);
			return {
				kind: syncOperationErrorKind(status, error),
				message: extractErrorMessage(error) || (error && error.message) || 'Sync operation failed',
				status: Number.isFinite(status) ? status : undefined
			};
		}

		function syncOperationErrorKind(status, error) {
			if (status === 409)
				return 'conflict';
			if (status === 401 || status === 403)
				return 'auth';
			if (Number.isFinite(status) && status >= 500)
				return 'server';
			if (!Number.isFinite(status))
				return 'network';
			if (error && error.name === 'AbortError')
				return 'network';
			return 'unknown';
		}

		async function markPushedMutations(db, result, attemptedMutations) {
			const results = Array.isArray(result && result.results) ? result.results : [];
			if (results.length === 0)
				return [];
			await ensureSyncOutboxTable(db);
			const now = Date.now();
			const attemptedById = mutationsById(attemptedMutations);
			const acceptedMutations = [];
			for (let i = 0; i < results.length; i++) {
				const item = results[i];
				if (!item || typeof item.id !== 'string')
					continue;
				const mutation = attemptedById.get(item.id);
				await db.query([
					`UPDATE "${syncOutboxTable}"`,
					`SET "status" = 'pushed', "pushed_at_ms" = ${now}, "result_json" = ${sqlStringLiteral(stringify(item))}`,
					`WHERE "mutation_id" = ${sqlStringLiteral(item.id)}`
				].join(' '));
				if (mutation)
					acceptedMutations.push(mutation);
				emitOperationSuccess(mutation, item);
			}
			return acceptedMutations;
		}

		function attachAcceptedPushMutations(result, mutations) {
			if (!result || result !== Object(result))
				return;
			Object.defineProperty(result, '__orangeAcceptedMutations', {
				value: Array.isArray(mutations) ? mutations : [],
				enumerable: false,
				configurable: true
			});
		}

		function getAcceptedPushMutations(result) {
			return result && Array.isArray(result.__orangeAcceptedMutations)
				? result.__orangeAcceptedMutations
				: [];
		}

		async function insertOutboxRow(db, row) {
			const mutationId = row.mutation_id ?? row.MUTATION_ID;
			const tableName = row.table_name ?? row.TABLE_NAME;
			const patchJson = row.patch_json ?? row.PATCH_JSON;
			const optionsJson = row.options_json ?? row.OPTIONS_JSON;
			const createdAtMs = Number(row.created_at_ms ?? row.CREATED_AT_MS ?? Date.now());
			const operationId = row.operation_id ?? row.OPERATION_ID;
			const operationName = row.operation_name ?? row.OPERATION_NAME;
			const operationJson = row.operation_json ?? row.OPERATION_JSON;
			const status = row.status ?? row.STATUS ?? 'pending';
			const lastError = row.last_error ?? row.LAST_ERROR;
			const attempts = Number(row.attempts ?? row.ATTEMPTS ?? 0);
			const pushedAtMs = row.pushed_at_ms ?? row.PUSHED_AT_MS;
			const resultJson = row.result_json ?? row.RESULT_JSON;
			if (typeof mutationId !== 'string' || typeof tableName !== 'string' || typeof patchJson !== 'string')
				return;
			await db.query([
				`INSERT INTO "${syncOutboxTable}" ("mutation_id", "table_name", "patch_json", "options_json", "created_at_ms", "operation_id", "operation_name", "operation_json", "status", "last_error", "attempts", "pushed_at_ms", "result_json")`,
				`VALUES (${sqlStringLiteral(mutationId)}, ${sqlStringLiteral(tableName)}, ${sqlStringLiteral(patchJson)}, ${sqlNullableStringLiteral(optionsJson)}, ${Number.isFinite(createdAtMs) ? createdAtMs : Date.now()}, ${sqlNullableStringLiteral(operationId)}, ${sqlNullableStringLiteral(operationName)}, ${sqlNullableStringLiteral(operationJson)}, ${sqlStringLiteral(status)}, ${sqlNullableStringLiteral(lastError)}, ${Number.isFinite(attempts) ? attempts : 0}, ${sqlNullableNumberLiteral(pushedAtMs)}, ${sqlNullableStringLiteral(resultJson)})`,
				'ON CONFLICT("mutation_id") DO UPDATE SET',
				'"table_name" = excluded."table_name",',
				'"patch_json" = excluded."patch_json",',
				'"options_json" = excluded."options_json",',
				'"created_at_ms" = excluded."created_at_ms",',
				'"operation_id" = excluded."operation_id",',
				'"operation_name" = excluded."operation_name",',
				'"operation_json" = excluded."operation_json",',
				'"status" = excluded."status",',
				'"last_error" = excluded."last_error",',
				'"attempts" = excluded."attempts",',
				'"pushed_at_ms" = excluded."pushed_at_ms",',
				'"result_json" = excluded."result_json"'
			].join(' '));
		}

		async function clearPendingMutations(db) {
			await ensureSyncOutboxTable(db);
			await db.query(`DELETE FROM "${syncOutboxTable}" WHERE "status" = 'pending'`);
		}

		async function hasPendingMutations(db) {
			const pending = await readPendingMutationRows(db, 1);
			return pending.length > 0;
		}

		function mutationIdsToSet(mutations) {
			const result = new Set();
			if (!Array.isArray(mutations))
				return result;
			for (let i = 0; i < mutations.length; i++) {
				const id = mutations[i] && mutations[i].id;
				if (typeof id === 'string')
					result.add(id);
			}
			return result;
		}

		async function readScopeSince(scopeKey, db) {
			const state = await readScopeState(scopeKey, db);
			return state && state.since;
		}

		async function readScopeState(scopeKey, db) {
			if (!db || typeof db.query !== 'function')
				return undefined;
			let rows;
			for (let attempt = 0; attempt < 2; attempt++) {
				await ensureSyncStateTable(db);
				try {
					rows = await db.query(
						`SELECT "since_value" FROM "${syncStateTable}" WHERE "scope" = ${sqlStringLiteral(scopeKey)} LIMIT 1`
					);
					break;
				}
				catch (e) {
					if (attempt === 0 && isMissingSqliteTableError(e, syncStateTable)) {
						clearInternalTableEnsured(db, syncStateTable);
						sinceByScope.clear();
						continue;
					}
					throw e;
				}
			}
			const row = Array.isArray(rows) ? rows[0] : rows?.rows?.[0];
			if (!row)
				return undefined;
			const raw = row.since_value ?? row.SINCE_VALUE;
			if (typeof raw !== 'string' || raw.length === 0)
				return undefined;
			try {
				const parsed = JSON.parse(raw);
				if (parsed && parsed === Object(parsed) && 'since' in parsed)
					return {
						since: parsed.since,
						updatedAtMs: parsed.updatedAtMs
					};
				return { since: parsed, updatedAtMs: undefined };
			}
			catch (_e) {
				return { since: raw, updatedAtMs: undefined };
			}
		}

		async function writeScopeState(scopeKey, state, db) {
			if (!db || typeof db.query !== 'function')
				return;
			const sinceSerialized = JSON.stringify(state);
			for (let attempt = 0; attempt < 2; attempt++) {
				await ensureSyncStateTable(db);
				try {
					await db.query(
						`INSERT INTO "${syncStateTable}" ("scope", "since_value") VALUES (${sqlStringLiteral(scopeKey)}, ${sqlStringLiteral(sinceSerialized)}) `
						+ 'ON CONFLICT("scope") DO UPDATE SET "since_value" = excluded."since_value"'
					);
					return;
				}
				catch (e) {
					if (attempt === 0 && isMissingSqliteTableError(e, syncStateTable)) {
						clearInternalTableEnsured(db, syncStateTable);
						sinceByScope.clear();
						continue;
					}
					throw e;
				}
			}
		}

		async function hasStableBase(db) {
			if (!db || typeof db.query !== 'function')
				return false;
			try {
				await ensureSyncBaseTable(db);
				const rows = await db.query(`SELECT "name" FROM "${syncBaseTable}" LIMIT 1`);
				const list = Array.isArray(rows) ? rows : rows?.rows || [];
				return list.length > 0;
			}
			catch (_e) {
				return false;
			}
		}

		async function saveStableBase(db) {
			if (!db || typeof db.query !== 'function')
				return;
			return runSyncMaintenance(db, async () => {
				if (await hasPendingMutations(db))
					return false;
				await client.transaction(async (tx) => {
					await ensureSyncBaseTable(tx);
					const tables = await readSqliteTables(tx);
					await dropExistingBaseTables(tx);
					await tx.query(`DELETE FROM "${syncBaseTable}"`);
					for (let i = 0; i < tables.length; i++) {
						const table = tables[i];
						const baseName = toBaseTableName(table.name);
						await tx.query(`CREATE TABLE ${quoteIdent(baseName)} AS SELECT * FROM ${quoteIdent(table.name)}`);
						await tx.query([
							`INSERT INTO "${syncBaseTable}" ("name", "base_name", "schema_sql", "ordinal") VALUES (`,
							`${sqlStringLiteral(table.name)}, ${sqlStringLiteral(baseName)}, ${sqlNullableStringLiteral(table.sql)}, ${i}`,
							')'
						].join(' '));
					}
				}, { suppressSyncOutbox: true });
				return true;
			});
		}

		async function savePushedMutationsToStableBase(db, mutations) {
			const entries = stableBasePatchEntries(mutations);
			if (entries.length === 0)
				return true;
			return runSyncMaintenance(db, async () => {
				if (await hasPendingMutations(db))
					return false;
				await client.transaction(async (tx) => {
					await ensureSyncBaseTable(tx);
					const baseEntries = await readStableBaseEntries(tx);
					const baseByTable = new Map(baseEntries.map(entry => [entry.name, entry]));
					for (let i = 0; i < entries.length; i++) {
						const applied = await savePatchEntryToStableBase(tx, entries[i], baseByTable);
						if (!applied)
							throw new StableBaseIncrementalFallbackError();
					}
				}, { suppressSyncOutbox: true });
				return true;
			})
				.catch((error) => {
					if (error instanceof StableBaseIncrementalFallbackError)
						return false;
					throw error;
				});
		}

		function stableBasePatchEntries(mutations) {
			const source = Array.isArray(mutations) ? mutations : [];
			const entries = [];
			for (let i = 0; i < source.length; i++) {
				const mutationEntries = mutationToPatchEntries(source[i]);
				for (let j = 0; j < mutationEntries.length; j++)
					entries.push(mutationEntries[j]);
			}
			return entries;
		}

		async function savePatchEntryToStableBase(tx, entry, baseByTable) {
			const tableName = entry && entry.table;
			const patch = entry && entry.patch;
			if (typeof tableName !== 'string' || !Array.isArray(patch))
				return true;
			const baseEntry = baseByTable.get(tableName);
			const table = client.tables && client.tables[tableName];
			const primaryColumns = getPrimaryColumns(table);
			if (!baseEntry || !table || primaryColumns.length === 0)
				return false;
			const keys = patchPrimaryKeys(patch);
			for (let i = 0; i < keys.length; i++) {
				const where = primaryKeyWhereSql(primaryColumns, keys[i]);
				if (!where)
					return false;
				await tx.query(`DELETE FROM ${quoteIdent(baseEntry.baseName)} WHERE ${where}`);
				await tx.query(`INSERT INTO ${quoteIdent(baseEntry.baseName)} SELECT * FROM ${quoteIdent(table._dbName || tableName)} WHERE ${where}`);
			}
			return true;
		}

		function getPrimaryColumns(table) {
			if (!table || !Array.isArray(table._primaryColumns))
				return [];
			return table._primaryColumns
				.map(column => column && (column._dbName || column.alias || column.name))
				.filter(name => typeof name === 'string' && name.length > 0);
		}

		function patchPrimaryKeys(patch) {
			const result = [];
			const seen = new Set();
			for (let i = 0; i < patch.length; i++) {
				const key = patchOperationPrimaryKey(patch[i]);
				if (!key)
					continue;
				const serialized = stringify(key);
				if (seen.has(serialized))
					continue;
				seen.add(serialized);
				result.push(key);
			}
			return result;
		}

		function patchOperationPrimaryKey(operation) {
			if (!operation || typeof operation.path !== 'string')
				return null;
			const firstSegment = operation.path.split('/')[1];
			if (firstSegment === undefined || firstSegment.length === 0)
				return null;
			try {
				const parsed = JSON.parse(unescapeJsonPointerSegment(firstSegment));
				return Array.isArray(parsed) ? parsed : [parsed];
			}
			catch (_e) {
				return null;
			}
		}

		function primaryKeyWhereSql(primaryColumns, key) {
			if (!Array.isArray(key) || key.length !== primaryColumns.length)
				return '';
			return primaryColumns
				.map((column, index) => sqlValuePredicate(quoteIdent(column), key[index]))
				.join(' AND ');
		}

		async function restoreStableBase(db) {
			if (!db || typeof db.query !== 'function')
				return;
			await client.transaction(async (tx) => {
				await ensureSyncBaseTable(tx);
				const entries = await readStableBaseEntries(tx);
				if (entries.length === 0)
					return;
				const entryNames = new Set(entries.map(x => x.name));
				const currentTables = await readSqliteTables(tx);
				await tx.query('PRAGMA foreign_keys = OFF');
				try {
					for (let i = 0; i < currentTables.length; i++) {
						const table = currentTables[i];
						if (entryNames.has(table.name))
							continue;
						await tx.query(`DROP TABLE IF EXISTS ${quoteIdent(table.name)}`);
					}
					const currentNames = new Set(currentTables.map(x => x.name));
					for (let i = 0; i < entries.length; i++) {
						const entry = entries[i];
						if (!currentNames.has(entry.name) && entry.schemaSql)
							await tx.query(entry.schemaSql);
						await tx.query(`DELETE FROM ${quoteIdent(entry.name)}`);
					}
					for (let i = 0; i < entries.length; i++) {
						const entry = entries[i];
						await tx.query(`INSERT INTO ${quoteIdent(entry.name)} SELECT * FROM ${quoteIdent(entry.baseName)}`);
					}
				}
				finally {
					await tx.query('PRAGMA foreign_keys = ON');
				}
			}, { suppressSyncOutbox: true });
		}

		async function ensureSyncBaseTable(db) {
			await db.query([
				`CREATE TABLE IF NOT EXISTS "${syncBaseTable}" (`,
				'"name" TEXT PRIMARY KEY,',
				'"base_name" TEXT NOT NULL,',
				'"schema_sql" TEXT,',
				'"ordinal" INTEGER NOT NULL',
				');'
			].join(' '));
		}

		async function readStableBaseEntries(db) {
			const rows = await db.query([
				`SELECT "name", "base_name", "schema_sql", "ordinal" FROM "${syncBaseTable}"`,
				'ORDER BY "ordinal" ASC'
			].join(' '));
			const list = Array.isArray(rows) ? rows : rows?.rows || [];
			return list
				.map(row => ({
					name: row.name ?? row.NAME,
					baseName: row.base_name ?? row.BASE_NAME,
					schemaSql: row.schema_sql ?? row.SCHEMA_SQL,
					ordinal: row.ordinal ?? row.ORDINAL
				}))
				.filter(row => typeof row.name === 'string' && typeof row.baseName === 'string');
		}

		async function readSqliteTables(db) {
			const rows = await db.query([
				'SELECT "name", "sql" FROM sqlite_schema',
				'WHERE "type" = \'table\'',
				'ORDER BY "name" ASC'
			].join(' '));
			const list = Array.isArray(rows) ? rows : rows?.rows || [];
			return list
				.map(row => ({
					name: row.name ?? row.NAME,
					sql: row.sql ?? row.SQL
				}))
				.filter(table => shouldCheckpointTable(table.name));
		}

		async function dropExistingBaseTables(db) {
			const rows = await db.query([
				'SELECT "name" FROM sqlite_schema',
				'WHERE "type" = \'table\'',
				`AND "name" LIKE ${sqlStringLiteral(syncBasePrefix + '%')}`
			].join(' '));
			const list = Array.isArray(rows) ? rows : rows?.rows || [];
			for (let i = 0; i < list.length; i++) {
				const name = list[i].name ?? list[i].NAME;
				if (typeof name === 'string' && name.startsWith(syncBasePrefix))
					await db.query(`DROP TABLE IF EXISTS ${quoteIdent(name)}`);
			}
		}

		function shouldCheckpointTable(name) {
			return typeof name === 'string'
				&& !name.startsWith('sqlite_')
				&& name !== syncBaseTable
				&& name !== syncPullSessionTable
				&& name !== syncPullItemTable
				&& !name.startsWith(syncBasePrefix);
		}

		function toBaseTableName(name) {
			return syncBasePrefix + toHexName(name);
		}

		function toHexName(name) {
			let result = '';
			const value = String(name);
			for (let i = 0; i < value.length; i++) {
				let hex = value.charCodeAt(i).toString(16);
				while (hex.length < 4)
					hex = '0' + hex;
				result += hex;
			}
			return result || 'empty';
		}

		function on(event, listener) {
			if (typeof event !== 'string' || typeof listener !== 'function')
				return () => {};
			if (event === 'initial-ready') {
				initialReadyListeners.add(listener);
				void maybeEmitInitialReadyFromDb('persisted');
				return () => off(event, listener);
			}
			let listeners = eventListeners.get(event);
			if (!listeners) {
				listeners = new Set();
				eventListeners.set(event, listeners);
			}
			listeners.add(listener);
			return () => off(event, listener);
		}

		function onOperation(operation, listener) {
			if (typeof operation !== 'string' || typeof listener !== 'function')
				return () => {};
			return on(`operation:${operation}`, listener);
		}

		function off(event, listener) {
			if (event === 'initial-ready') {
				initialReadyListeners.delete(listener);
				return;
			}
			const listeners = eventListeners.get(event);
			if (!listeners)
				return;
			listeners.delete(listener);
			if (listeners.size === 0)
				eventListeners.delete(event);
		}

		function once(event, listener) {
			if (typeof event !== 'string' || typeof listener !== 'function')
				return () => {};
			const unsubscribe = on(event, (payload) => {
				unsubscribe();
				listener(payload);
			});
			return unsubscribe;
		}

		async function waitForInitialReady() {
			const existing = await maybeEmitInitialReadyFromDb('persisted');
			if (existing)
				return existing;
			return new Promise((resolve) => {
				const unsubscribe = once('initial-ready', (payload) => {
					unsubscribe();
					resolve(payload);
				});
			});
		}

		async function maybeEmitInitialReadyFromDb(source) {
			const db = await getDb();
			const syncConfig = normalizeSyncConfig(db && db.__sqliteSync);
			if (!syncConfig)
				return null;
			const pullConfig = resolvePullConfig(syncConfig);
			const configuredTables = resolveSyncTables(db, pullConfig.tables, client);
			if (!Array.isArray(configuredTables) || configuredTables.length === 0)
				return null;
			return maybeEmitInitialReady(syncConfig, configuredTables, db, source);
		}

		async function maybeEmitInitialReady(syncConfig, configuredTables, db, source) {
			const scopeKey = getScopeKey(configuredTables);
			const state = await readScopeState(scopeKey, db);
			const isReady = isInitialReadyState(state, syncConfig.initialReadyMaxAgeMs);
			if (!isReady) {
				initialReadyEmitted = false;
				return null;
			}
			const payload = {
				tables: configuredTables.slice(),
				since: state.since,
				updatedAtMs: state.updatedAtMs,
				source
			};
			if (!initialReadyEmitted) {
				initialReadyEmitted = true;
				emitInitialReady(payload);
			}
			return payload;
		}

		function emitInitialReady(payload) {
			for (const listener of Array.from(initialReadyListeners)) {
				listener(payload);
			}
		}
	}

	function normalizeSyncConfig(sync) {
		if (!sync)
			return null;

		if (typeof sync === 'string')
			return normalizePullConfig(sync, undefined, undefined);

		if (sync !== Object(sync))
			throw new Error('Invalid sqlite sync configuration');
		if ('endpoint' in sync)
			throw new Error('Invalid sqlite sync configuration: use "sync.url" (not "sync.endpoint").');

		const endpoint = normalizeEndpoint(sync.url ? sync : undefined);
		const tables = normalizeConfiguredTables(sync.tables);
		const initialReadyMaxAgeMs = normalizeInitialReadyMaxAgeMs(sync.initialReadyMaxAgeMs);
		return {
			...endpoint,
			pull: sync.pull === undefined ? undefined : normalizePullConfig(sync.pull, endpoint, tables),
			tables,
			initialReadyMaxAgeMs,
			schema: sync.schema,
			auto: sync.auto,
			push: sync.push === undefined ? undefined : normalizePushConfig(sync.push, endpoint),
			// Stable-base rollback is optional while browser sync is being simplified.
			stableBase: sync.stableBase !== false,
			crossTabLock: normalizeCrossTabLockConfig(sync.crossTabLock)
		};
	}

	function isStableBaseEnabled(syncConfig) {
		return !syncConfig || syncConfig.stableBase !== false;
	}

	function withRuntimeCrossTabLockConfig(config, options) {
		if (!config || !config.enabled)
			return config;
		const timeoutMs = normalizePositiveInteger(options && options.timeoutMs);
		if (!timeoutMs || config.maxHoldMs)
			return config;
		return {
			...config,
			maxHoldMs: timeoutMs
		};
	}

	async function resolveRuntimeCrossTabSyncLock(db, syncConfig) {
		const sqliteOPFS = resolveSqliteOPFSRuntime(db);
		if (!sqliteOPFS)
			return {
				name: resolveCrossTabLockName(db, syncConfig),
				config: syncConfig.crossTabLock
			};
		const vfs = await resolveSqliteOPFSVfs(sqliteOPFS);
		const forceWlLock = vfs === 'opfs-wl';
		const config = forceWlLock
			? { ...syncConfig.crossTabLock, enabled: true }
			: syncConfig.crossTabLock;
		return {
			name: resolveCrossTabLockName(db, syncConfig, vfs),
			config
		};
	}

	function resolveSqliteOPFSRuntime(db) {
		const pool = db && (db.poolFactory || db);
		if (!pool || typeof pool.__orangeSqliteOPFSConnectionString !== 'string')
			return null;
		return pool;
	}

	async function resolveSqliteOPFSVfs(pool) {
		if (pool.__orangeSqliteOPFSReady && typeof pool.__orangeSqliteOPFSReady.then === 'function') {
			const result = await pool.__orangeSqliteOPFSReady;
			return result && result.vfs || pool.__orangeSqliteOPFSVfs || pool.__orangeSqliteOPFSRequestedVfs;
		}
		return pool.__orangeSqliteOPFSVfs || pool.__orangeSqliteOPFSRequestedVfs;
	}

	function resolveCrossTabLockName(db, syncConfig, sqliteVfs) {
		const config = syncConfig && syncConfig.crossTabLock;
		if (config && typeof config.name === 'string' && config.name.length > 0 && !sqliteVfs)
			return config.name;
		const identity = db && (
			db.__orangeSyncLockName
			|| db.__orangeSyncIdentity
			|| db.poolFactory && (db.poolFactory.__orangeSyncLockName || db.poolFactory.__orangeSyncIdentity)
		);
		const endpoint = syncConfig && (syncConfig.url || syncConfig.pull && syncConfig.pull.url || syncConfig.push && syncConfig.push.url);
		const base = config && typeof config.name === 'string' && config.name.length > 0
			? config.name
			: identity || endpoint || 'default';
		const scoped = sqliteVfs ? `${base}:${sqliteVfs}` : base;
		return `orange-orm:sync:${normalizeLockNamePart(scoped)}`;
	}

	async function dropLocalSyncTables(db, client, tableNames) {
		const tableDbNames = tableNames
			.map(name => client && client.tables && client.tables[name])
			.filter(Boolean)
			.map(table => table._dbName)
			.filter(Boolean);
		const internalTables = [
			'orange_schema_state',
			'orange_sync_state',
			'orange_sync_client',
			'orange_sync_outbox',
			'orange_sync_pull_session',
			'orange_sync_pull_item'
		];
		const dropNames = Array.from(new Set(internalTables.concat(tableDbNames)));
		await db.query('PRAGMA foreign_keys = OFF');
		try {
			for (let i = 0; i < dropNames.length; i++)
				await db.query(`DROP TABLE IF EXISTS ${quoteIdent(dropNames[i])}`);
		}
		finally {
			await db.query('PRAGMA foreign_keys = ON');
		}
		return dropNames;
	}

	function normalizePullConfig(config, fallbackEndpoint, fallbackTables) {
		if (!config)
			return undefined;
		if (typeof config === 'string')
			return { ...normalizeEndpoint(config), tables: fallbackTables };
		if (config !== Object(config))
			throw new Error('Invalid sqlite sync pull configuration');

		const endpointOverrides = pickEndpointOverrides(config);
		const endpoint = config.url
			? normalizeEndpoint(config)
			: mergeEndpoint(fallbackEndpoint, endpointOverrides);
		const tables = normalizeConfiguredTables(config.tables) || fallbackTables;
		if (!endpoint)
			throw new Error('Sync pull endpoint requires "url" or sync.url');
		return {
			...endpoint,
			tables,
			patchOptions: config.patchOptions,
			maxKeysPerBatch: config.maxKeysPerBatch,
			maxRowsPerBatch: config.maxRowsPerBatch,
			maxJournalRowsPerInsert: config.maxJournalRowsPerInsert
		};
	}

	function normalizePushConfig(config, fallbackEndpoint) {
		if (!config)
			return undefined;
		if (typeof config === 'string')
			return normalizeEndpoint(config);
		if (config !== Object(config))
			throw new Error('Invalid sqlite sync push configuration');

		const endpointOverrides = pickEndpointOverrides(config);
		const endpoint = config.url
			? normalizeEndpoint(config)
			: mergeEndpoint(fallbackEndpoint, endpointOverrides);
		if (!endpoint)
			throw new Error('Sync push endpoint requires "url" or sync.url');
		return {
			...endpoint
		};
	}

	function normalizeConfiguredTables(value) {
		if (!Array.isArray(value))
			return undefined;
		const tables = value.filter(x => typeof x === 'string');
		if (tables.length === 0)
			return undefined;
		return Array.from(new Set(tables));
	}

	function quoteIdent(value) {
		return `"${String(value).replace(/"/g, '""')}"`;
	}

	class StableBaseIncrementalFallbackError extends Error {
		constructor() {
			super('Stable base incremental update needs full snapshot fallback.');
			this.name = 'StableBaseIncrementalFallbackError';
		}
	}

	function resolveSyncTables(db, configuredTables, client) {
		if (Array.isArray(configuredTables) && configuredTables.length > 0)
			return configuredTables;
		const tables = db && db.tables ? db.tables : client && client.tables;
		if (!tables)
			return configuredTables;
		const names = Object.keys(tables).filter(x => typeof x === 'string');
		if (names.length === 0)
			return configuredTables;
		return names;
	}

	function normalizeInitialReadyMaxAgeMs(value) {
		const parsed = Number.parseInt(value, 10);
		if (!Number.isFinite(parsed) || parsed <= 0)
			return undefined;
		return parsed;
	}

	function normalizeEndpoint(endpoint) {
		if (!endpoint)
			return undefined;
		if (typeof endpoint === 'string')
			return { url: endpoint };
		if (endpoint !== Object(endpoint))
			throw new Error('Invalid sqlite sync endpoint configuration');
		if (!endpoint.url)
			throw new Error('Sync endpoint requires "url"');
		return {
			url: endpoint.url,
			timeoutMs: endpoint.timeoutMs
		};
	}

	function mergeEndpoint(base, overrides) {
		if (!base)
			return undefined;
		return {
			...base,
			...overrides
		};
	}

	function pickEndpointOverrides(config) {
		if (!config || config !== Object(config))
			return {};
		const result = {};
		if (config.timeoutMs !== undefined)
			result.timeoutMs = config.timeoutMs;
		return result;
	}

	function resolvePullConfig(syncConfig, options = {}) {
		const preferred = syncConfig.pull || syncConfig;
		const pullConfig = normalizePullConfig(preferred, syncConfig, syncConfig.tables);
		if (!pullConfig || !pullConfig.url)
			throw new Error('No pull sync endpoint configured');
		if (options.timeoutMs === undefined)
			return pullConfig;
		return {
			...pullConfig,
			timeoutMs: options.timeoutMs
		};
	}

	function resolvePushConfig(syncConfig, options = {}) {
		const preferred = syncConfig.push || syncConfig;
		const pushConfig = normalizePushConfig(preferred, syncConfig);
		if (!pushConfig || !pushConfig.url)
			throw new Error('No push sync endpoint configured');
		if (options.timeoutMs === undefined)
			return pushConfig;
		return {
			...pushConfig,
			timeoutMs: options.timeoutMs
		};
	}

	function resolveMaxPushBatches(syncConfig) {
		if (isStableBaseEnabled(syncConfig))
			return 1;
		return maxPushBatchesPerSync;
	}

	async function requestPayload(config, options) {
		const syncInterceptors = options && options._syncInterceptors;
		const axiosInterceptor = options && options._syncAxiosInterceptor;
		const axios = createFetchClient();
		if (axiosInterceptor && typeof axiosInterceptor.applyTo === 'function')
			axiosInterceptor.applyTo(axios);
		const requestBody = config.body !== undefined ? config.body : {
			since: options.since,
			tables: options.tables
		};

		const request = {
			url: appendQueryParam(config.url, 'sync', config.syncPhase || 'pull'),
			method: 'post',
			timeout: config.timeoutMs,
			headers: {}
		};
		request.data = requestBody;

		const interceptedRequest = syncInterceptors && typeof syncInterceptors.applyRequest === 'function'
			? await syncInterceptors.applyRequest(request)
			: request;
		let response;
		try {
			response = await axios.request(interceptedRequest);
		}
		catch (error) {
			if (syncInterceptors && typeof syncInterceptors.applyResponseError === 'function') {
				const recovered = await syncInterceptors.applyResponseError(error);
				return recovered && recovered === Object(recovered) && 'data' in recovered
					? recovered.data
					: recovered;
			}
			throw error;
		}
		if (syncInterceptors && typeof syncInterceptors.applyResponse === 'function')
			response = await syncInterceptors.applyResponse(response);
		return response.data;
	}

	function createFetchClient() {
		return {
			request
		};

		async function request(config) {
			if (typeof fetch !== 'function')
				throw new Error('HTTP client requires fetch. Use a runtime with fetch support or provide a fetch polyfill.');

			const abortController = typeof AbortController === 'function' && config.timeout
				? new AbortController()
				: undefined;
			let timeout;
			if (abortController)
				timeout = setTimeout(() => abortController.abort(), config.timeout);

			try {
				const headers = {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
					...(config.headers || {})
				};
				const fetchOptions = {
					method: config.method?.toUpperCase(),
					headers,
					body: config.data === undefined ? undefined : JSON.stringify(config.data),
					signal: abortController && abortController.signal
				};
				if (config.credentials !== undefined)
					fetchOptions.credentials = config.credentials;
				const response = await fetch(config.url, fetchOptions);
				const data = await readPayloadResponse(response);
				const payload = {
					data,
					status: response.status,
					statusText: response.statusText,
					headers: headersToObject(response.headers),
					config
				};
				if (!response.ok) {
					const error = new Error('Request failed with status code ' + response.status);
					error.response = payload;
					throw error;
				}
				return payload;
			}
			finally {
				if (timeout)
					clearTimeout(timeout);
			}
		}
	}

	function headersToObject(headers) {
		const result = {};
		if (!headers || typeof headers.forEach !== 'function')
			return result;
		headers.forEach((value, key) => {
			result[key] = value;
		});
		return result;
	}

	async function readPayloadResponse(response) {
		const text = await response.text();
		const contentType = response.headers.get('content-type') || '';
		if (text && (contentType.indexOf('application/json') !== -1 || looksLikeJson(text)))
			return JSON.parse(text);
		return text;
	}

	function looksLikeJson(text) {
		const value = text.trim();
		return value[0] === '{' || value[0] === '[';
	}

	function appendQueryParam(url, key, value) {
		if (typeof url !== 'string')
			return url;
		const encodedKey = encodeURIComponent(key);
		const encodedValue = encodeURIComponent(value);
		const pair = `${encodedKey}=${encodedValue}`;
		if (url.includes(`${encodedKey}=`))
			return url;
		return `${url}${url.includes('?') ? '&' : '?'}${pair}`;
	}

	function isStagedKeysPayload(payload) {
		return payload
			&& payload === Object(payload)
			&& payload.phase === 'keys'
			&& Array.isArray(payload.items)
			&& 'done' in payload;
	}

	function isRowsPayload(payload) {
		return payload
			&& payload === Object(payload)
			&& payload.phase === 'rows'
			&& Array.isArray(payload.items);
	}

	function chunkItems(items, chunkSize) {
		const source = Array.isArray(items) ? items : [];
		const size = normalizeLimit(chunkSize, 200);
		const chunks = [];
		for (let i = 0; i < source.length; i += size)
			chunks.push(source.slice(i, i + size));
		return chunks;
	}

	function getRowsAcceptedCount(payload, requestedCount) {
		if (!payload || payload !== Object(payload) || payload.truncated !== true)
			return requestedCount;
		const limit = normalizeLimit(payload.limit, requestedCount);
		return Math.max(0, Math.min(limit, requestedCount));
	}

	function getMissingRowItems(requestedItems, returnedItems) {
		const returnedKeys = new Set();
		const rows = Array.isArray(returnedItems) ? returnedItems : [];
		for (let i = 0; i < rows.length; i++) {
			const key = syncItemKey(rows[i]);
			if (key)
				returnedKeys.add(key);
		}
		const missing = [];
		const requested = Array.isArray(requestedItems) ? requestedItems : [];
		for (let i = 0; i < requested.length; i++) {
			const key = syncItemKey(requested[i]);
			if (key && !returnedKeys.has(key))
				missing.push(requested[i]);
		}
		return missing;
	}

	function enqueueMissingRows(queue, requestedItems, missingItems) {
		if (!Array.isArray(missingItems) || missingItems.length === 0)
			return;
		if (missingItems.length === 1 && requestedItems.length === 1)
			return;
		if (missingItems.length === requestedItems.length) {
			const midpoint = Math.ceil(missingItems.length / 2);
			queue.unshift(missingItems.slice(midpoint));
			queue.unshift(missingItems.slice(0, midpoint));
			return;
		}
		queue.unshift(missingItems);
	}

	function syncItemKey(item) {
		if (!item || typeof item.table !== 'string' || !Array.isArray(item.pk))
			return '';
		return `${item.table}|${stringify(item.pk)}`;
	}

	function rowsBySyncItemKey(items) {
		const result = new Map();
		const rows = Array.isArray(items) ? items : [];
		for (let i = 0; i < rows.length; i++) {
			const key = syncItemKey(rows[i]);
			if (key)
				result.set(key, rows[i]);
		}
		return result;
	}

	function pullSessionFromRow(row) {
		return {
			scope: row.scope ?? row.SCOPE,
			since: parseNullableJson(row.since_value ?? row.SINCE_VALUE),
			token: parseNullableJson(row.token_json ?? row.TOKEN_JSON),
			done: Number(row.done ?? row.DONE ?? 0) === 1,
			finalSince: parseNullableJson(row.final_since ?? row.FINAL_SINCE),
			payload: parseNullableJson(row.payload_json ?? row.PAYLOAD_JSON),
			reason: row.reason ?? row.REASON,
			status: row.status ?? row.STATUS,
			nextSeq: Number(row.next_seq ?? row.NEXT_SEQ ?? 0),
			nextBatch: Number(row.next_batch ?? row.NEXT_BATCH ?? 0)
		};
	}

	function pullItemFromRow(row) {
		const table = row.table_name ?? row.TABLE_NAME;
		const pk = parseNullableJson(row.pk_json ?? row.PK_JSON);
		if (typeof table !== 'string' || !Array.isArray(pk))
			return null;
		const rowJson = row.row_json ?? row.ROW_JSON;
		const item = {
			batchNo: Number(row.batch_no ?? row.BATCH_NO ?? 0),
			seq: Number(row.seq ?? row.SEQ ?? 0),
			table,
			pk,
			key: parseNullableJson(row.key_json ?? row.KEY_JSON),
			op: normalizeChangeOp(row.op ?? row.OP)
		};
		if (rowJson !== null && rowJson !== undefined)
			item.row = parseNullableJson(rowJson);
		return item;
	}

	function parseNullableJson(value) {
		if (value === null || value === undefined)
			return undefined;
		if (typeof value !== 'string')
			return value;
		try {
			return JSON.parse(value);
		}
		catch (_e) {
			return undefined;
		}
	}

	function normalizeKeyItems(items) {
		if (!Array.isArray(items))
			return [];
		const result = [];
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (!item || typeof item.table !== 'string')
				continue;
			if (!Array.isArray(item.pk))
				continue;
			result.push({
				table: item.table,
				pk: item.pk,
				key: item.key,
				op: normalizeChangeOp(item.op)
			});
		}
		return result;
	}

	async function applyDeleteItemsOnTx(tx, items, patchOptions) {
		const deletes = Array.isArray(items) ? items : [];
		const perTable = new Map();
		for (let i = 0; i < deletes.length; i++) {
			const item = deletes[i];
			if (!item || typeof item.table !== 'string' || !Array.isArray(item.pk))
				continue;
			if (!perTable.has(item.table))
				perTable.set(item.table, []);
			perTable.get(item.table).push({
				op: 'remove',
				path: `/${JSON.stringify(item.pk)}`
			});
		}

		const tableNames = orderTablesByDependencies(tx, Array.from(perTable.keys())).reverse();
		let applied = 0;
		for (let i = 0; i < tableNames.length; i++) {
			const table = tableNames[i];
			if (!tx[table] || typeof tx[table].patch !== 'function')
				throw new Error(`Table "${table}" does not exist in this client`);
			const patch = perTable.get(table);
			await tx[table].patch(patch, patchOptions);
			applied += patch.length;
		}
		return applied;
	}

	async function applyRowsPayloadOnTx(tx, items, patchOptions) {
		const rows = Array.isArray(items) ? items : [];
		const perTable = new Map();
		for (let i = 0; i < rows.length; i++) {
			const item = rows[i];
			if (!item || typeof item.table !== 'string' || !Array.isArray(item.pk) || item.row === undefined)
				continue;
			if (!perTable.has(item.table))
				perTable.set(item.table, []);
			perTable.get(item.table).push({
				op: 'add',
				path: `/${JSON.stringify(item.pk)}`,
				value: item.row
			});
		}
		const tableNames = orderTablesByDependencies(tx, Array.from(perTable.keys()));
		if (tableNames.length === 0)
			return 0;

		let applied = 0;
		for (let i = 0; i < tableNames.length; i++) {
			const table = tableNames[i];
			if (!tx[table] || typeof tx[table].patch !== 'function')
				throw new Error(`Table "${table}" does not exist in this client`);
			const patch = perTable.get(table);
			await tx[table].patch(patch, withInsertAndForgetStrategy(patchOptions));
			applied += patch.length;
		}
		return applied;
	}

	function withInsertAndForgetStrategy(options) {
		const strategy = options && options.strategy && options.strategy === Object(options.strategy)
			? options.strategy
			: undefined;
		if (strategy && strategy.insertAndForget === false)
			return options || {};
		return { ...(options || {}), strategy: { ...(strategy || {}), insertAndForget: true } };
	}

	function orderTablesByDependencies(client, tableNames) {
		if (!Array.isArray(tableNames) || tableNames.length <= 1)
			return tableNames || [];
		const dependencyMap = buildDependencyMap(client);
		const pending = new Set(tableNames);
		const ordered = [];
		while (pending.size > 0) {
			let progressed = false;
			for (let i = 0; i < tableNames.length; i++) {
				const name = tableNames[i];
				if (!pending.has(name))
					continue;
				const deps = dependencyMap.get(name) || new Set();
				let blocked = false;
				for (let dep of deps) {
					if (pending.has(dep)) {
						blocked = true;
						break;
					}
				}
				if (!blocked) {
					pending.delete(name);
					ordered.push(name);
					progressed = true;
				}
			}
			if (!progressed) {
				for (let i = 0; i < tableNames.length; i++) {
					const name = tableNames[i];
					if (pending.has(name)) {
						pending.delete(name);
						ordered.push(name);
					}
				}
			}
		}
		return ordered;
	}

	function buildDependencyMap(client) {
		const dependencyMap = new Map();
		const tables = client && client.tables ? client.tables : {};
		const names = Object.keys(tables);
		const nameByTableObject = new Map();
		for (let i = 0; i < names.length; i++) {
			const name = names[i];
			const table = tables[name];
			if (table)
				nameByTableObject.set(table, name);
			dependencyMap.set(name, new Set());
		}

		for (let i = 0; i < names.length; i++) {
			const table = tables[names[i]];
			if (!table || !table._relations)
				continue;
			const relations = table._relations;
			for (let relationName in relations) {
				const relation = relations[relationName];
				const join = extractJoinRelation(relation);
				if (!join)
					continue;
				const fromName = nameByTableObject.get(join.parentTable);
				const toName = nameByTableObject.get(join.childTable);
				if (!fromName || !toName || fromName === toName)
					continue;
				dependencyMap.get(fromName).add(toName);
			}
		}
		return dependencyMap;
	}

	function extractJoinRelation(relation) {
		if (!relation || typeof relation.accept !== 'function')
			return;
		let join;
		relation.accept({
			visitJoin: function(current) {
				join = current;
			},
			visitOne: function(current) {
				join = current && current.joinRelation;
			},
			visitMany: function(current) {
				join = current && current.joinRelation;
			}
		});
		return join;
	}

	function normalizeChangeOp(value) {
		if (typeof value !== 'string')
			return 'U';
		const op = value.toUpperCase();
		if (op === 'I' || op === 'U' || op === 'D')
			return op;
		return 'U';
	}

	async function tryDeferForeignKeys(tx) {
		if (!tx || typeof tx.query !== 'function')
			return;
		try {
			await tx.query('PRAGMA defer_foreign_keys = ON');
		}
		catch (_e) {
			// Non-sqlite engines can safely ignore this pragma.
		}
	}

	async function validateForeignKeys(tx) {
		if (!tx || typeof tx.query !== 'function')
			return;
		try {
			const rows = await tx.query('PRAGMA foreign_key_check');
			if (Array.isArray(rows) && rows.length > 0) {
				const first = rows[0];
				throw new Error(`Foreign key validation failed after sync apply (${first.table || 'unknown table'})`);
			}
		}
		catch (e) {
			if (e && typeof e.message === 'string' && e.message.startsWith('Foreign key validation failed'))
				throw e;
			// Ignore on engines that do not support pragma.
		}
	}

	function normalizeLimit(value, fallback) {
		const parsed = Number.parseInt(value, 10);
		if (!Number.isFinite(parsed) || parsed <= 0)
			return fallback;
		return Math.min(parsed, 10000);
	}

	function extractTablePatches(payload) {
		if (!payload)
			return [];
		if (Array.isArray(payload))
			return payload.map(normalizeTablePatch);
		if (payload.table && payload.patch)
			return [normalizeTablePatch(payload)];
		if (payload.tables !== undefined)
			return normalizeTablePatchList(payload.tables);
		if (payload.patches !== undefined)
			return normalizeTablePatchList(payload.patches);
		return [];
	}

	function normalizeTablePatchList(input) {
		if (Array.isArray(input))
			return input.map(normalizeTablePatch);
		if (input !== Object(input))
			throw new Error('Invalid sync patch payload');
		const result = [];
		const names = Object.keys(input);
		for (let i = 0; i < names.length; i++) {
			const table = names[i];
			const value = input[table];
			if (Array.isArray(value))
				result.push(normalizeTablePatch({ table, patch: value }));
			else
				result.push(normalizeTablePatch({ table, ...value }));
		}
		return result;
	}

	function normalizeTablePatch(entry) {
		if (!entry || typeof entry.table !== 'string')
			throw new Error('Each sync patch entry must contain "table"');
		if (!Array.isArray(entry.patch))
			throw new Error(`Sync patch entry for "${entry.table}" must contain "patch" array`);
		return {
			table: entry.table,
			patch: entry.patch,
			options: entry.options
		};
	}

	function shouldFallbackToPatch(error) {
		const message = extractErrorMessage(error);
		if (!message)
			return false;
		return message.includes('staged keys payload')
			|| message.includes('staged rows payload')
			|| message.includes('Invalid sync phase');
	}

	function extractErrorMessage(error) {
		if (!error)
			return '';
		if (typeof error.message === 'string' && error.message)
			return error.message;
		if (typeof error.response?.data === 'string')
			return error.response.data;
		return '';
	}

	function isInitialReadyState(state, maxAgeMs) {
		if (!state || state.since === undefined || state.since === null)
			return false;
		if (maxAgeMs === undefined)
			return true;
		if (!Number.isFinite(state.updatedAtMs))
			return false;
		return Date.now() - state.updatedAtMs <= maxAgeMs;
	}

	function sqlStringLiteral(value) {
		return `'${String(value).replace(/'/g, '\'\'')}'`;
	}

	function sqlValuePredicate(columnSql, value) {
		if (value === null || value === undefined)
			return `${columnSql} IS NULL`;
		return `${columnSql} = ${sqlValueLiteral(value)}`;
	}

	function sqlValueLiteral(value) {
		if (typeof value === 'number' && Number.isFinite(value))
			return String(value);
		if (typeof value === 'bigint')
			return String(value);
		if (typeof value === 'boolean')
			return value ? '1' : '0';
		return sqlStringLiteral(value);
	}

	function sqlNullableStringLiteral(value) {
		if (value === undefined || value === null)
			return 'NULL';
		return sqlStringLiteral(value);
	}

	function sqlNullableJsonLiteral(value) {
		if (value === undefined || value === null)
			return 'NULL';
		return sqlStringLiteral(stringify(value));
	}

	function sqlNullableNumberLiteral(value) {
		if (value === undefined || value === null)
			return 'NULL';
		const parsed = Number(value);
		return Number.isFinite(parsed) ? String(parsed) : 'NULL';
	}

	function unescapeJsonPointerSegment(value) {
		return String(value).replace(/~1/g, '/').replace(/~0/g, '~');
	}

	syncClient = newSyncClient;
	return syncClient;
}

var client;
var hasRequiredClient;

function requireClient () {
	if (hasRequiredClient) return client;
	hasRequiredClient = 1;
	const createPatch = requireCreatePatch();
	const stringify = requireStringify();
	const cloneFromDb = requireCloneFromDb();
	const netAdapter = requireNetAdapter();
	const toKeyPositionMap = requireToKeyPositionMap();
	const rootMap = new WeakMap();
	const fetchingStrategyMap = new WeakMap();
	const targetKey = Symbol();
	const map = requireClientMap();
	const clone = require$$5;
	const createHttpInterceptor = requireHttpInterceptor();
	const flags = requireFlags();
	const newSyncClient = requireSyncClient();
	const { runSyncWrite } = requireWriteGate();
	const {
		createSyncTransactionContext,
		flushSyncTransactionContext,
		registerSyncOperationMemory,
		serializeSyncPayload,
		setSyncTransactionContext
	} = requireOperationContext();

	function rdbClient(options = {}) {
		flags.useLazyDefaults = false;
		if (options.pg)
			options = { db: options };
		let transaction = options.transaction;
		let _reactive = options.reactive;
		let providers = options.providers || {};
		let baseUrl = options.db;
		const commandHandlers = options.commandHandlers || options.commands || {};
		if (typeof providers === 'function')
			baseUrl = typeof options.db === 'function' ? providers(options.db) : options.db;
		const httpInterceptor = createHttpInterceptor();

		function client(_options = {}) {
			if (_options.pg)
				_options = { db: _options };
			return rdbClient({ ...options, ..._options });
		}

		client.reactive = (cb => _reactive = cb);
		client.map = map.bind(null, client);
		Object.defineProperty(client, 'metaData', {
			get: getMetaData,
			enumerable: true,
			configurable: false
		});
		client.interceptors = httpInterceptor;
		client.createPatch = _createPatch;
		client.table = table;
		client.or = column('or');
		client.and = column('and');
		client.not = column('not');
		client.filter = {
			or: client.or,
			and: client.and,
			not: client.not,
			toJSON: function() {
				return;
			}
		};
		client.query = query;
		client.function = sqliteFunction;
		client.transaction = runInTransaction;
		client.syncCommand = syncCommand;
		client.defineCommands = defineCommands;
		client.__commands = commandHandlers;
		client.commands = new Proxy({}, {
			get(_target, property) {
				if (typeof property !== 'string')
					return undefined;
				return syncCommand.bind(null, property);
			}
		});
		client.db = baseUrl;
		client.mssql = onProvider.bind(null, 'mssql');
		client.mssqlNative = onProvider.bind(null, 'mssqlNative');
		client.pg = onProvider.bind(null, 'pg');
		client.pglite = onProvider.bind(null, 'pglite');
		client.postgres = onProvider.bind(null, 'postgres');
		client.d1 = onProvider.bind(null, 'd1');
		client.sqlite = onProvider.bind(null, 'sqlite');
		client.sqliteOPFS = onProvider.bind(null, 'sqliteOPFS');
		client.sap = onProvider.bind(null, 'sap');
		client.oracle = onProvider.bind(null, 'oracle');
		client.http = onProvider.bind(null, 'http');//todo
		client.mysql = onProvider.bind(null, 'mysql');
		client.mariadb = onProvider.bind(null, 'mariadb');
		client.express = express;
		client.hono = hono;
		client.close = close;

		function close() {
			return client.db.end ? client.db.end() : Promise.resolve();
		}

		function onProvider(name, ...args) {
			let db = providers[name].apply(null, args);
			return client({ db });
		}

		if (options.tables) {
			// for (let name in options.tables) {
			// 	client[name] = table(options.tables[name], name, { ...readonly, ...clone(options[name]) });
			// }
			client.tables = options.tables;
			// return client;
		}
		client.syncClient = baseUrl && typeof baseUrl.__createSyncClient === 'function'
			? baseUrl.__createSyncClient(client, getDb, httpInterceptor)
			: newSyncClient(client, getDb, httpInterceptor);
		// else {
		let handler = {
			get(_target, property,) {
				if (property in client)
					return Reflect.get(...arguments);
				else {
					const readonly = { readonly: options.readonly, concurrency: options.concurrency };
					return table(options?.tables?.[property] || baseUrl, property, { ...readonly, ...clone(options[property]) });
				}
			}

		};
		return new Proxy(client, handler);
		// }

		function getMetaData() {
			const result = { readonly: options.readonly, concurrency: options.concurrency };
			for (let name in options.tables) {
				result[name] = getMetaDataTable(options.tables[name], inferOptions(options, name));
			}
			return result;
		}

		function inferOptions(defaults, property) {
			const parent = {};
			if ('readonly' in defaults)
				parent.readonly = defaults.readonly;
			if ('concurrency' in defaults)
				parent.concurrency = defaults.concurrency;
			return { ...parent, ...(defaults[property] || {}) };
		}


		function getMetaDataTable(table, options) {
			const result = {};
			for (let i = 0; i < table._columns.length; i++) {
				const name = table._columns[i].alias;
				result[name] = inferOptions(options, name);
			}
			for (let name in table._relations) {
				if (!isJoinRelation(name, table))
					result[name] = getMetaDataTable(table._relations[name].childTable, inferOptions(options, name));
			}

			return result;

			function isJoinRelation(name, table) {
				return table[name] && table[name]._relation.columns;
			}
		}

		async function query() {
			const adapter = netAdapter(baseUrl, undefined, { tableOptions: { db: baseUrl, transaction } });
			return adapter.query.apply(null, arguments);
		}

		async function sqliteFunction() {
			const adapter = netAdapter(baseUrl, undefined, { tableOptions: { db: baseUrl, transaction } });
			return adapter.sqliteFunction.apply(null, arguments);
		}

		async function syncCommand(name, args) {
			validateSyncCommandName(name);
			const normalizedArgs = normalizeSyncCommandArgs(args);
			const db = await getDb();
			if (db && (db.__sqliteSync || db.__orangeDbWorkerClient)) {
				const body = stringify({
					name,
					args: normalizedArgs
				});
				const adapter = netAdapter(baseUrl, undefined, { tableOptions: { db: baseUrl, transaction } });
				await adapter.syncCommand(body);
				return;
			}
			if (typeof db === 'string') {
				const body = stringify({
					name,
					args: normalizedArgs
				});
				const adapter = netAdapter(baseUrl, undefined, { tableOptions: { db: baseUrl, transaction } });
				await adapter.syncCommand(body);
				return;
			}
			await executeCommand(name, normalizedArgs);
		}

		async function executeCommand(name, args) {
			const fn = commandHandlers[name];
			if (typeof fn !== 'function')
				throw new Error(`Command "${name}" is not registered`);
			if (transaction) {
				await transaction(async (context) => {
					const tx = client({ transaction: (innerFn) => innerFn(context) });
					await fn(tx, args);
				});
				return;
			}
			await client.transaction(async (tx) => {
				await fn(tx, args);
			});
		}

		function defineCommands(contractOrHandlers, handlers) {
			return handlers || contractOrHandlers;
		}

		function validateSyncCommandName(name) {
			if (typeof name !== 'string' || name.length === 0)
				throw new Error('Sync command requires a command name');
		}

		function normalizeSyncCommandArgs(args) {
			try {
				if (args === undefined)
					return null;
				return JSON.parse(JSON.stringify(args));
			}
			catch (_e) {
				throw new Error('Sync command arguments must be JSON serializable');
			}
		}

		function express(arg) {
			if (providers.express) {
				return providers.express(client, { ...options, ...arg });
			}
			else
				throw new Error('Cannot host express clientside');
		}

		function hono(arg) {
			if (providers.hono) {
				return providers.hono(client, { ...options, ...arg });
			}
			else
				throw new Error('Cannot host hono clientside');
		}



		function _createPatch(original, modified, ...restArgs) {
			if (!Array.isArray(original)) {
				original = [original];
				modified = [modified];
			}
			let args = [original, modified, ...restArgs];
			return createPatch(...args);
		}

		async function getDb() {
			let db = baseUrl;
			if (typeof db === 'function') {
				let dbPromise = db();
				if (dbPromise.then)
					db = await dbPromise;
				else
					db = dbPromise;
			}

			return db;
		}

		async function runInTransaction(fn, _options) {
			let db = await getDb();
			if (!db.createTransaction)
				throw new Error('Transaction not supported through http');
			return runSyncWrite(db, _options, async () => {
				const transaction = db.createTransaction(_options);
				const syncContext = createSyncTransactionContext();
				let operationMetadata;

				try {
					await attachSyncContextToTransaction(transaction, syncContext);
					const nextClient = client({ transaction });
					const result = await fn(nextClient, syncContext);
					operationMetadata = await flushSyncContextOnTransaction(transaction, syncContext);
					transaction.done = true;
					await transaction(transaction.commit);
					if (operationMetadata && operationMetadata.operationName)
						registerSyncOperationMemory(operationMetadata.mutationId, syncContext.memory);
					return result;
				}
				catch (e) {
					await transaction(transaction.rollback.bind(null, e));
					throw e;
				}
			});
		}

		async function attachSyncContextToTransaction(transaction, syncContext) {
			if (typeof transaction.setSyncContext === 'function') {
				await transaction.setSyncContext(serializeSyncPayload(syncContext.sync));
				return;
			}
			await transaction((context) => {
				setSyncTransactionContext(context, syncContext);
			});
		}

		async function flushSyncContextOnTransaction(transaction, syncContext) {
			if (typeof transaction.flushSyncContext === 'function')
				return transaction.flushSyncContext(serializeSyncPayload(syncContext.sync));
			return transaction((context) => flushSyncTransactionContext(context));
		}

		function table(url, tableName, tableOptions) {
			tableOptions = tableOptions || {};
			tableOptions = { db: baseUrl, ...tableOptions, transaction, syncTableName: tableName };
			let meta;
			let c = {
				count,
				getMany,
				aggregate: groupBy,
				distinct,
				getAll,
				getOne,
				getById,
				proxify,
				update,
				replace,
				updateChanges,
				insert,
				insertAndForget,
				delete: _delete,
				deleteCascade,
				patch,
				rowType,
				rowsType,
				tsType,
				expand,
			};


			let handler = {
				get(_target, property,) {
					if (property in c)
						return Reflect.get(...arguments);
					else
						return column(property);
				}

			};
			let _table = new Proxy(c, handler);
			return _table;

			function expand() {
				return c;
			}

			function tsType() {
				return undefined;
			}

			function rowType() {
				return undefined;
			}

			function rowsType() {
				return undefined;
			}

			async function getAll() {
				let _getMany = getMany.bind(null, undefined);
				return _getMany.apply(null, arguments);
			}

			async function getMany(_, strategy) {
				let metaPromise = getMeta();
				if (looksLikeFetchStrategy(_) && (strategy === undefined || !looksLikeFetchStrategy(strategy))) {
					let meta = await metaPromise;
					if (!isPrimaryKeyObject(meta, _)) {
						let _strategy = _;
						_ = strategy;
						strategy = _strategy;
					}
				}
				strategy = extractFetchingStrategy({}, strategy);
				let args = [_, strategy].concat(Array.prototype.slice.call(arguments).slice(2));
				let rows = await getManyCore.apply(null, args);
				await metaPromise;
				return proxify(rows, strategy, true);
			}

			async function groupBy(strategy) {
				return executeGroupBy('aggregate', strategy);
			}

			async function distinct(strategy) {
				return executeGroupBy('distinct', strategy);
			}

			async function executeGroupBy(path, strategy) {
				let args = negotiateGroupBy(null, strategy);
				let body = stringify({
					path,
					args
				});
				let adapter = netAdapter(url, tableName, { http: httpInterceptor, tableOptions });
				return adapter.post(body);
			}

			async function count(_) {
				let args = [_].concat(Array.prototype.slice.call(arguments).slice(1));
				let body = stringify({
					path: 'count',
					args
				});
				let adapter = netAdapter(url, tableName, { http: httpInterceptor, tableOptions });
				return adapter.post(body);
			}

			function isRawFilter(value) {
				return value && typeof value === 'object'
					&& (typeof value.sql === 'string' || typeof value.sql === 'function');
			}

			function looksLikeFetchStrategy(value) {
				if (!value || typeof value !== 'object' || Array.isArray(value))
					return false;
				if (isRawFilter(value))
					return false;
				if (Object.keys(value).length === 0)
					return true;
				if ('where' in value || 'orderBy' in value || 'limit' in value || 'offset' in value)
					return true;
				for (let key in value) {
					const v = value[key];
					if (typeof v === 'boolean')
						return true;
					if (v && typeof v === 'object' && !Array.isArray(v))
						return true;
				}
				return false;
			}

			function isPrimaryKeyObject(meta, value) {
				if (!value || typeof value !== 'object' || Array.isArray(value))
					return false;
				if (isRawFilter(value))
					return false;
				const keyNames = meta?.keys?.map(key => key.name);
				if (!keyNames || keyNames.length === 0)
					return false;
				const keys = Object.keys(value);
				if (keys.length === 0)
					return false;
				for (let i = 0; i < keys.length; i++) {
					const key = keys[i];
					if (!keyNames.includes(key))
						return false;
					const val = value[key];
					if (val && typeof val === 'object' && !(val instanceof Date))
						return false;
				}
				return true;
			}

			function normalizeGetOneArgs(meta, filter, strategy) {
				if (looksLikeFetchStrategy(filter) && (strategy === undefined || !looksLikeFetchStrategy(strategy))) {
					if (!isPrimaryKeyObject(meta, filter))
						return { filter: strategy, strategy: filter };
				}
				return { filter, strategy };
			}

			async function getOne(filter, strategy) {
				let metaPromise = getMeta();
				let meta = await metaPromise;
				let normalized = normalizeGetOneArgs(meta, filter, strategy);
				filter = normalized.filter;
				strategy = extractFetchingStrategy({}, normalized.strategy);
				let _strategy = { ...strategy, ...{ limit: 1 } };
				let args = [filter, _strategy].concat(Array.prototype.slice.call(arguments).slice(2));
				let rows = await getManyCore.apply(null, args);
				if (rows.length === 0)
					return;
				return proxify(rows[0], strategy, true);
			}

			async function getById() {
				if (arguments.length === 0)
					return;
				let meta = await getMeta();
				let keyFilter = client.filter;
				for (let i = 0; i < meta.keys.length; i++) {
					let keyName = meta.keys[i].name;
					let keyValue = arguments[i];
					keyFilter = keyFilter.and(_table[keyName].eq(keyValue));
				}
				let args = [keyFilter].concat(Array.prototype.slice.call(arguments).slice(meta.keys.length));
				return getOne.apply(null, args);
			}

			async function getManyCore() {
				let args = negotiateWhere.apply(null, arguments);
				let body = stringify({
					path: 'getManyDto',
					args
				});
				let adapter = netAdapter(url, tableName, { http: httpInterceptor, tableOptions });
				return adapter.post(body);
			}

			function negotiateWhere(_, strategy, ...rest) {
				const args = Array.prototype.slice.call(arguments);
				if (strategy)
					return [_, negotiateWhereSingle(strategy), ...rest];
				else
					return args;


			}

			function negotiateWhereSingle(_strategy, path = '') {
				if (typeof _strategy !== 'object' || _strategy === null)
					return _strategy;

				if (Array.isArray(_strategy)) {
					return _strategy.map(item => negotiateWhereSingle(item, path));
				}

				const strategy = { ..._strategy };
				for (let name in _strategy) {
					if (name === 'where' && typeof strategy[name] === 'function')
						strategy.where = column(path + 'where')(strategy.where); // Assuming `column` is defined elsewhere.
					else if (typeof strategy[name] === 'function') {
						strategy[name] = aggregate(path, strategy[name]);
					}
					else
						strategy[name] = negotiateWhereSingle(_strategy[name], path + name + '.');
				}
				return strategy;
			}



			function negotiateGroupBy(_, strategy, ...rest) {
				const args = Array.prototype.slice.call(arguments);
				if (strategy)
					return [_, where(strategy), ...rest];
				else
					return args;

				function where(_strategy, path = '') {
					if (typeof _strategy !== 'object' || _strategy === null)
						return _strategy;

					if (Array.isArray(_strategy)) {
						return _strategy.map(item => where(item, path));
					}

					const strategy = { ..._strategy };
					for (let name in _strategy) {
						if (name === 'where' && typeof strategy[name] === 'function')
							strategy.where = column(path + 'where')(strategy.where); // Assuming `column` is defined elsewhere.
						else if (typeof strategy[name] === 'function') {
							strategy[name] = groupByAggregate(path, strategy[name]);
						}
						else
							strategy[name] = where(_strategy[name], path + name + '.');
					}
					return strategy;
				}

			}





			async function _delete() {
				let args = Array.prototype.slice.call(arguments);
				let body = stringify({
					path: 'delete',
					args
				});
				let adapter = netAdapter(url, tableName, { http: httpInterceptor, tableOptions });
				return adapter.post(body);
			}

			async function deleteCascade() {
				let args = Array.prototype.slice.call(arguments);
				let body = stringify({
					path: 'deleteCascade',
					args
				});
				let adapter = netAdapter(url, tableName, { http: httpInterceptor, tableOptions });
				return adapter.post(body);
			}

			async function update(_row, _where, strategy) {
				let args = [_row, negotiateWhereSingle(_where), negotiateWhereSingle(strategy)];
				let body = stringify({
					path: 'update',
					args
				});
				let adapter = netAdapter(url, tableName, { http: httpInterceptor, tableOptions });
				const result =  await adapter.post(body);
				if (strategy)
					return proxify(result, strategy);
			}

			async function replace(_row, strategy) {
				let args = [_row, negotiateWhereSingle(strategy)];
				let body = stringify({
					path: 'replace',
					args
				});
				let adapter = netAdapter(url, tableName, { http: httpInterceptor, tableOptions });
				const result =  await adapter.post(body);
				if (strategy)
					return proxify(result, strategy);
			}

			async function updateChanges(rows, oldRows, ...rest) {
				const concurrency = undefined;
				const args = [concurrency].concat(rest);
				if (Array.isArray(rows)) {
					const proxy = await getMany.apply(null, [rows, ...rest]);
					proxy.splice.apply(proxy, [0, proxy.length, ...rows]);
					await proxy.saveChanges.apply(proxy, args);
					return proxy;
				}
				else {
					let proxy = proxify([oldRows], args[0]);
					proxy.splice.apply(proxy, [0, 1, rows]);
					await proxy.saveChanges.apply(proxy, args);
					return proxify(proxy[0], args[0]);
				}
			}

			async function insert(rows, ...rest) {
				const concurrency = undefined;
				const args = [concurrency].concat(rest);
				if (Array.isArray(rows)) {
					let proxy = proxify([], rest[0]);
					proxy.splice.apply(proxy, [0, 0, ...rows]);
					await proxy.saveChanges.apply(proxy, args);
					return proxy;
				}
				else {
					let proxy = proxify([], args[0]);
					proxy.splice.apply(proxy, [0, 0, rows]);
					await proxy.saveChanges.apply(proxy, args);
					return proxify(proxy[0], rest[0]);
				}
			}

			async function insertAndForget(rows) {
				const concurrency = undefined;
				let args = [concurrency, { insertAndForget: true }];
				if (Array.isArray(rows)) {
					let proxy = proxify([], args[0]);
					proxy.splice.apply(proxy, [0, 0, ...rows]);
					await proxy.saveChanges.apply(proxy, args);
				}
				else {
					let proxy = proxify([], args[0]);
					proxy.splice.apply(proxy, [0, 0, rows]);
					await proxy.saveChanges.apply(proxy, args);
				}
			}


			function proxify(itemOrArray, strategy, fast) {
				if (Array.isArray(itemOrArray))
					return proxifyArray(itemOrArray, strategy, fast);
				else
					return proxifyRow(itemOrArray, strategy, fast);
			}

			function proxifyArray(array, strategy, fast) {
				let _array = array;
				if (_reactive)
					array = _reactive(array);
				let handler = {
					get(_target, property) {
						if (property === 'toJSON')
							return () => {
								return toJSON(array);
							};
						else if (property === 'save' || property === 'saveChanges')
							return saveArray.bind(null, array);
						else if (property === 'delete')
							return deleteArray.bind(null, array);
						else if (property === 'refresh')
							return refreshArray.bind(null, array);
						else if (property === 'clearChanges')
							return clearChangesArray.bind(null, array);
						else if (property === 'acceptChanges')
							return acceptChangesArray.bind(null, array);
						else if (property === targetKey)
							return _array;
						else
							return Reflect.get.apply(_array, arguments);
					}

				};

				let watcher = onChange(array, () => {
					rootMap.set(array, { json: cloneFromDb(array, fast), strategy, originalArray: [...array] });
				});
				let innerProxy = new Proxy(watcher, handler);
				if (strategy !== undefined) {
					const { limit, ...cleanStrategy } = { ...strategy };
					fetchingStrategyMap.set(array, cleanStrategy);
				}
				return innerProxy;
			}

			function proxifyRow(row, strategy, fast) {
				let _row = row;
				if (_reactive)
					row = _reactive(row);
				let handler = {
					get(_target, property,) {
						if (property === 'save' || property === 'saveChanges') //call server then acceptChanges
							return saveRow.bind(null, row);
						else if (property === 'delete') //call server then remove from json and original
							return deleteRow.bind(null, row);
						else if (property === 'refresh') //refresh from server then acceptChanges
							return refreshRow.bind(null, row);
						else if (property === 'clearChanges') //refresh from json, update original if present
							return clearChangesRow.bind(null, row);
						else if (property === 'acceptChanges') //remove from json
							return acceptChangesRow.bind(null, row);
						else if (property === 'toJSON')
							return () => {
								return toJSON(row);
							};
						else if (property === targetKey)
							return _row;
						else
							return Reflect.get(...arguments);
					}

				};
				let watcher = onChange(row, () => {
					rootMap.set(row, { json: cloneFromDb(row, fast), strategy });
				});
				let innerProxy = new Proxy(watcher, handler);
				fetchingStrategyMap.set(row, strategy);
				return innerProxy;
			}

			function toJSON(row, _meta = meta) {
				if (!row)
					return null;
				if (!_meta)
					return row;
				if (Array.isArray(row)) {
					return row.map(x => toJSON(x, _meta));
				}
				let result = {};
				for (let name in row) {
					if (name in _meta.relations)
						result[name] = toJSON(row[name], _meta.relations[name]);
					else if (name in _meta.columns) {
						if (_meta.columns[name].serializable)
							result[name] = row[name];
					}
					else
						result[name] = row[name];
				}
				return result;
			}




			async function getMeta() {
				if (meta)
					return meta;
				let adapter = netAdapter(url, tableName, { http: httpInterceptor, tableOptions });
				meta = await adapter.get();

				while (hasUnresolved(meta)) {
					meta = parseMeta(meta);
				}
				return meta;

				function parseMeta(meta, map = new Map()) {
					if (typeof meta === 'number') {
						return map.get(meta) || meta;
					}
					map.set(meta.id, meta);
					for (let p in meta.relations) {
						meta.relations[p] = parseMeta(meta.relations[p], map);
					}
					return meta;
				}

				function hasUnresolved(meta, set = new WeakSet()) {
					if (typeof meta === 'number')
						return true;
					else if (set.has(meta))
						return false;
					else {
						set.add(meta);
						return Object.values(meta.relations).reduce((prev, current) => {
							return prev || hasUnresolved(current, set);
						}, false);
					}
				}


			}

			async function saveArray(array, concurrencyOptions, strategy) {
				let deduceStrategy = false;
				let json = rootMap.get(array)?.json;
				if (!json)
					return;
				strategy = extractStrategy({ strategy }, array);
				strategy = extractFetchingStrategy(array, strategy);

				let meta = await getMeta();
				const patch = createPatch(json, array, meta);
				if (patch.length === 0)
					return;
				let body = stringify({ patch, options: { strategy, ...tableOptions, ...concurrencyOptions, deduceStrategy } });
				let adapter = netAdapter(url, tableName, { http: httpInterceptor, tableOptions });
				let p = adapter.patch(body);
				if (strategy?.insertAndForget) {
					await p;
					return;
				}

				let updatedPositions = extractChangedRowsPositions(array, patch, meta);
				let insertedPositions = getInsertedRowsPosition(array);
				let { changed, strategy: newStrategy } = await p;
				copyIntoArray(changed, array, [...insertedPositions, ...updatedPositions]);
				rootMap.set(array, { json: cloneFromDb(array), strategy: newStrategy, originalArray: [...array] });
			}

			async function patch(patch, concurrencyOptions, strategy) {
				let deduceStrategy = false;
				if (patch.length === 0)
					return;
				let body = stringify({ patch, options: { strategy, ...tableOptions, ...concurrencyOptions, deduceStrategy } });
				let adapter = netAdapter(url, tableName, { http: httpInterceptor, tableOptions });
				await adapter.patch(body);
				return;
			}

			function extractChangedRowsPositions(rows, patch, meta) {
				const positions = [];
				const originalSet = new Set(rootMap.get(rows).originalArray);
				const positionsAdded = {};
				const keyPositionMap = toKeyPositionMap(rows, meta);
				for (let i = 0; i < patch.length; i++) {
					const element = patch[i];
					const pathArray = element.path.split('/');
					const position = keyPositionMap[pathArray[1]];
					if (position >= 0 && originalSet.has(rows[position]) && !positionsAdded[position]) {
						positions.push(position);
						positionsAdded[position] = true;
					}
				}
				return positions;
			}

			function getInsertedRowsPosition(array) {
				const positions = [];
				const originalSet = new Set(rootMap.get(array).originalArray);
				for (let i = 0; i < array.length; i++) {
					if (!originalSet.has(array[i]))
						positions.push(i);
				}
				return positions;
			}

			function copyInto(from, to) {
				for (let i = 0; i < from.length; i++) {
					copyValueInto(from[i], to[i]);
				}
			}

			function copyIntoArray(from, to, positions) {
				for (let i = 0; i < from.length; i++) {
					const position = positions[i];
					if (isMergeableObject(to[position]) && isMergeableObject(from[i]))
						copyValueInto(from[i], to[position]);
					else
						to[position] = from[i];
				}
			}

			function copyValueInto(from, to) {
				if (Array.isArray(from) && Array.isArray(to)) {
					const length = Math.min(from.length, to.length);
					for (let i = 0; i < length; i++) {
						if (isMergeableObject(to[i]) && isMergeableObject(from[i]))
							copyValueInto(from[i], to[i]);
						else
							to[i] = from[i];
					}
					if (from.length !== to.length)
						to.splice(length, to.length - length, ...from.slice(length));
					return;
				}
				if (!isMergeableObject(from) || !isMergeableObject(to))
					return;
				for (let p in to) {
					if (!(p in from))
						delete to[p];
				}
				for (let p in from) {
					if (isMergeableObject(to[p]) && isMergeableObject(from[p]))
						copyValueInto(from[p], to[p]);
					else
						to[p] = from[p];
				}
			}

			function isMergeableObject(value) {
				return value && typeof value === 'object' && !(value instanceof Date);
			}


			function extractStrategy(options, obj) {
				if (options?.strategy !== undefined)
					return options.strategy;
				if (obj) {
					let context = rootMap.get(obj);
					if (context?.strategy !== undefined) {
						// @ts-ignore
						let { limit, ...strategy } = { ...context.strategy };
						return strategy;
					}
				}
			}

			function extractFetchingStrategy(obj, strategy) {
				if (strategy !== undefined)
					return strategy;
				else if (fetchingStrategyMap.get(obj) !== undefined) {
					// @ts-ignore
					const { limit, ...strategy } = { ...fetchingStrategyMap.get(obj) };
					return strategy;
				}
			}

			function clearChangesArray(array) {
				let json = rootMap.get(array)?.json;
				if (!json)
					return;
				let old = cloneFromDb(json);
				array.splice(0, old.length, ...old);
			}

			function acceptChangesArray(array) {
				const map = rootMap.get(array);
				if (!map)
					return;
				map.json = cloneFromDb(array);
				map.originalArray = [...array];
			}

			async function deleteArray(array, options) {
				if (array.length === 0)
					return;
				let meta = await getMeta();
				let patch = createPatch(array, [], meta);
				let body = stringify({ patch, options });
				let adapter = netAdapter(url, tableName, { http: httpInterceptor, tableOptions });
				let { strategy } = await adapter.patch(body);
				array.length = 0;
				rootMap.set(array, { json: cloneFromDb(array), strategy });
			}

			function setMapValue(rowsMap, keys, row, index) {
				let keyValue = row[keys[0].name];
				if (keys.length > 1) {
					let subMap = rowsMap.get(keyValue);
					if (!subMap) {
						subMap = new Map();
						rowsMap.set(keyValue, subMap);
					}
					setMapValue(subMap, keys.slice(1), row, index);
				}
				else
					rowsMap.set(keyValue, index);
			}

			function getMapValue(rowsMap, keys, row) {
				let keyValue = row[keys[0].name];
				if (keys.length > 1)
					return getMapValue(rowsMap.get(keyValue), keys.slice(1));
				else
					return rowsMap.get(keyValue);
			}

			async function refreshArray(array, strategy) {
				clearChangesArray(array);
				strategy = extractStrategy({ strategy }, array);
				strategy = extractFetchingStrategy(array, strategy);
				if (array.length === 0)
					return;
				let meta = await getMeta();
				let filter = client.filter;
				let rowsMap = new Map();
				for (let rowIndex = 0; rowIndex < array.length; rowIndex++) {
					let row = array[rowIndex];
					let keyFilter = client.filter;
					for (let i = 0; i < meta.keys.length; i++) {
						let keyName = meta.keys[i].name;
						let keyValue = row[keyName];
						keyFilter = keyFilter.and(_table[keyName].eq(keyValue));
					}
					setMapValue(rowsMap, meta.keys, row, rowIndex);
					filter = filter.or(keyFilter);
				}
				let rows = await getManyCore(filter, strategy);
				let removedIndexes = new Set();
				if (array.length !== rows.length)
					for (var i = 0; i < array.length; i++) {
						removedIndexes.add(i);
					}
				for (let i = 0; i < rows.length; i++) {
					let row = rows[i];
					let originalIndex = getMapValue(rowsMap, meta.keys, row);
					if (array.length !== rows.length)
						removedIndexes.delete(originalIndex);
					array[originalIndex] = row;
				}
				let offset = 0;
				for (let i of removedIndexes) {
					array.splice(i + offset, 1);
					offset--;
				}
				rootMap.set(array, { json: cloneFromDb(array), strategy, originalArray: [...array] });
				fetchingStrategyMap.set(array, strategy);
			}

			async function deleteRow(row, options) {
				let strategy = extractStrategy(options, row);
				let meta = await getMeta();
				let patch = createPatch([row], [], meta);
				let body = stringify({ patch, options });
				let adapter = netAdapter(url, tableName, { http: httpInterceptor, tableOptions });
				await adapter.patch(body);
				rootMap.set(row, { strategy });
			}

			async function saveRow(row, concurrencyOptions, strategy) {
				let deduceStrategy;
				if (arguments.length < 3)
					deduceStrategy = false;
				strategy = extractStrategy({ strategy }, row);
				strategy = extractFetchingStrategy(row, strategy);

				let json = rootMap.get(row)?.json;
				if (!json)
					return;
				let meta = await getMeta();

				let patch = createPatch([json], [row], meta);
				if (patch.length === 0)
					return;

				let body = stringify({ patch, options: { ...tableOptions, ...concurrencyOptions, strategy, deduceStrategy } });

				let adapter = netAdapter(url, tableName, { http: httpInterceptor, tableOptions });
				let { changed, strategy: newStrategy } = await adapter.patch(body);
				copyInto(changed, [row]);
				rootMap.set(row, { json: cloneFromDb(row), strategy: newStrategy });
			}

			async function refreshRow(row, strategy) {
				clearChangesRow(row);
				strategy = extractStrategy({ strategy }, row);
				strategy = extractFetchingStrategy(row, strategy);

				let meta = await getMeta();
				let keyFilter = client.filter;
				for (let i = 0; i < meta.keys.length; i++) {
					let keyName = meta.keys[i].name;
					let keyValue = row[keyName];
					keyFilter = keyFilter.and(_table[keyName].eq(keyValue));
				}
				let rows = await getManyCore(keyFilter, strategy);
				for (let p in row) {
					delete row[p];
				}
				if (rows.length === 0)
					return;
				for (let p in rows[0]) {
					row[p] = rows[0][p];
				}
				rootMap.set(row, { json: cloneFromDb(row), strategy });
				fetchingStrategyMap.set(row, strategy);
			}

			function acceptChangesRow(row) {
				const data = rootMap.get(row);
				if (!data)
					return;
				const { strategy } = data;
				rootMap.set(row, { json: cloneFromDb(row), strategy });
			}

			function clearChangesRow(row) {
				let json = rootMap.get(row)?.json;
				if (!json)
					return;
				let old = cloneFromDb(json);
				for (let p in row) {
					delete row[p];
				}
				for (let p in old) {
					row[p] = old[p];
				}
			}
		}
	}

	function tableProxy() {
		let handler = {
			get(_target, property,) {
				return column(property);
			}

		};
		return new Proxy({}, handler);
	}

	function aggregate(path, arg) {

		const c = {
			sum,
			count,
			avg,
			max,
			min
		};

		let handler = {
			get(_target, property,) {
				if (property in c)
					return Reflect.get(...arguments);
				else {
					subColumn = column(path + '_aggregate');
					return column(property);
				}
			}

		};
		let subColumn;
		const proxy = new Proxy(c, handler);

		const result = arg(proxy);

		if (subColumn)
			return subColumn(result.self());
		else
			return result;


		function sum(fn) {
			return column(path + '_aggregate')(fn(column('')).groupSum());
		}
		function avg(fn) {
			return column(path + '_aggregate')(fn(column('')).groupAvg());
		}
		function max(fn) {
			return column(path + '_aggregate')(fn(column('')).groupMax());
		}
		function min(fn) {
			return column(path + '_aggregate')(fn(column('')).groupMin());
		}
		function count(fn) {
			return column(path + '_aggregate')(fn(column('')).groupCount());
		}
	}

	function groupByAggregate(path, arg) {

		const c = {
			sum,
			count,
			avg,
			max,
			min
		};

		let handler = {
			get(_target, property,) {
				if (property in c)
					return Reflect.get(...arguments);
				else {
					subColumn = column(path + '_aggregate');
					return column(property);
				}
			}

		};
		let subColumn;
		const proxy = new Proxy(c, handler);

		const result = arg(proxy);

		if (subColumn)
			return subColumn(result.self());
		else
			return result;


		function sum(fn) {
			return column(path + '_aggregate')(fn(column('')).sum());
		}
		function avg(fn) {
			return column(path + '_aggregate')(fn(column('')).avg());
		}
		function max(fn) {
			return column(path + '_aggregate')(fn(column('')).max());
		}
		function min(fn) {
			return column(path + '_aggregate')(fn(column('')).min());
		}
		function count(fn) {
			return column(path + '_aggregate')(fn(column('')).count());
		}
	}

	const isColumnProxyKey = '__isColumnProxy';
	const columnPathKey = '__columnPath';
	const columnRefKey = '__columnRef';

	function column(path, ...previous) {
		function c() {
			let args = [];
			for (let i = 0; i < arguments.length; i++) {
				if (typeof arguments[i] === 'function') {
					if (arguments[i][isColumnProxyKey])
						args[i] = { [columnRefKey]: arguments[i][columnPathKey] };
					else
						args[i] = arguments[i](tableProxy());
				}
				else
					args[i] = arguments[i];
			}
			args = previous.concat(Array.prototype.slice.call(args));
			let result = { path, args };
			let handler = {
				get(_target, property) {
					if (property === 'toJSON')
						return result.toJSON;
					else if (property === 'then')
						return;
					if (property in result)
						return Reflect.get(...arguments);
					else
						return column(property, result);

				}
			};
			return new Proxy(result, handler);
		}
		let handler = {
			get(_target, property) {
				if (property === isColumnProxyKey)
					return true;
				if (property === columnPathKey)
					return path;
				if (property === 'toJSON')
					return Reflect.get(...arguments);
				else if (property === 'then')
					return;
				else {
					const nextPath = path ? path + '.' : '';
					return column(nextPath + property);
				}
			}

		};
		return new Proxy(c, handler);

	}

	function onChange(target, onChange) {

		let  notified = false;
		const proxyCache = new WeakMap();
		const handler = {
			get(target, prop, receiver) {
				const value = Reflect.get(target, prop, receiver);
				if (value instanceof Date)
					return value;
				if (typeof value === 'object' && value !== null) {
					let proxy = proxyCache.get(value);
					if (!proxy) {
						proxy = new Proxy(value, handler);
						proxyCache.set(value, proxy);
					}
					return proxy;
				}
				return value;
			},
			set(target, prop, value, receiver) {
				if (!notified) {
					notified = true;
					onChange(JSON.stringify(target));
				}
				return Reflect.set(target, prop, value, receiver);

			},
			deleteProperty(target, prop) {
				if (!notified) {
					notified = true;
					onChange(JSON.stringify(target));
				}
				return Reflect.deleteProperty(target, prop);
			}
		};

		return new Proxy(target, handler);
	}


	client = rdbClient();
	return client;
}

var newBoolean_1;
var hasRequiredNewBoolean;

function requireNewBoolean () {
	if (hasRequiredNewBoolean) return newBoolean_1;
	hasRequiredNewBoolean = 1;
	const { newBoolean } = requireUtils();

	newBoolean_1 = newBoolean;
	return newBoolean_1;
}

var encodeFilterArg_1;
var hasRequiredEncodeFilterArg;

function requireEncodeFilterArg () {
	if (hasRequiredEncodeFilterArg) return encodeFilterArg_1;
	hasRequiredEncodeFilterArg = 1;
	function encodeFilterArg(context, column, arg) {
		if (arg && typeof arg._toFilterArg === 'function')
			return arg._toFilterArg(context);
		if (column.encode.safe)
			return column.encode.safe(context, arg);
		else
			return column.encode(context, arg);
	}

	encodeFilterArg_1 = encodeFilterArg;
	return encodeFilterArg_1;
}

var quote_1;
var hasRequiredQuote$2;

function requireQuote$2 () {
	if (hasRequiredQuote$2) return quote_1;
	hasRequiredQuote$2 = 1;
	let tryGetSessionContext = requireTryGetSessionContext();

	function quote(context, name) {
		let rdb = tryGetSessionContext(context);
		if (!rdb)
			throw new Error('Rdb transaction is no longer available. Is promise chain broken ?');
		let fn = rdb.quote || (() => `"${name}"`);
		return fn(name);
	}

	quote_1 = quote;
	return quote_1;
}

var equal_1;
var hasRequiredEqual;

function requireEqual () {
	if (hasRequiredEqual) return equal_1;
	hasRequiredEqual = 1;
	var newBoolean = requireNewBoolean();
	var nullOperator = ' is ';
	var encodeFilterArg = requireEncodeFilterArg();
	var quote = requireQuote$2();

	function equal(context, column,arg,alias) {
		var operator = '=';
		var encoded = encodeFilterArg(context, column, arg);
		if (encoded.sql() == 'null')
			operator = nullOperator;
		var firstPart = quote(context, alias) + '.' + quote(context, column._dbName) + operator;
		var filter =  encoded.prepend(firstPart);
		return newBoolean(filter);
	}

	equal_1 = equal;
	return equal_1;
}

var notEqual_1;
var hasRequiredNotEqual;

function requireNotEqual () {
	if (hasRequiredNotEqual) return notEqual_1;
	hasRequiredNotEqual = 1;
	var newBoolean = requireNewBoolean();
	var encodeFilterArg = requireEncodeFilterArg();
	var nullOperator = ' is not ';
	var quote = requireQuote$2();

	function notEqual(context, column,arg,alias) {
		var operator = '<>';
		var encoded = encodeFilterArg(context, column, arg);
		if (encoded.sql() == 'null')
			operator = nullOperator;
		var firstPart = quote(context, alias) + '.' + quote(context, column._dbName) + operator;
		var filter =  encoded.prepend(firstPart);
		return newBoolean(filter);
	}

	notEqual_1 = notEqual;
	return notEqual_1;
}

var lessThan;
var hasRequiredLessThan;

function requireLessThan () {
	if (hasRequiredLessThan) return lessThan;
	hasRequiredLessThan = 1;
	var newBoolean = requireNewBoolean();
	var encodeFilterArg = requireEncodeFilterArg();
	var quote = requireQuote$2();

	function lessThanOrEqual(context, column,arg,alias) {
		var operator = '<';
		var encoded = encodeFilterArg(context, column, arg);
		var firstPart = quote(context, alias) + '.' + quote(context, column._dbName) + operator;
		var filter = encoded.prepend(firstPart);
		return newBoolean(filter);
	}

	lessThan = lessThanOrEqual;
	return lessThan;
}

var lessThanOrEqual_1;
var hasRequiredLessThanOrEqual;

function requireLessThanOrEqual () {
	if (hasRequiredLessThanOrEqual) return lessThanOrEqual_1;
	hasRequiredLessThanOrEqual = 1;
	var newBoolean = requireNewBoolean();
	var encodeFilterArg = requireEncodeFilterArg();
	var quote = requireQuote$2();

	function lessThanOrEqual(context, column,arg,alias) {
		var operator = '<=';
		var encoded = encodeFilterArg(context, column, arg);
		var firstPart = quote(context, alias) + '.' + quote(context, column._dbName) + operator;
		var filter = encoded.prepend(firstPart);
		return newBoolean(filter);
	}

	lessThanOrEqual_1 = lessThanOrEqual;
	return lessThanOrEqual_1;
}

var greaterThan_1;
var hasRequiredGreaterThan;

function requireGreaterThan () {
	if (hasRequiredGreaterThan) return greaterThan_1;
	hasRequiredGreaterThan = 1;
	var newBoolean = requireNewBoolean();
	var encodeFilterArg = requireEncodeFilterArg();
	var quote = requireQuote$2();

	function greaterThan(context, column,arg,alias) {
		var operator = '>';
		var encoded = encodeFilterArg(context, column, arg);
		var firstPart = quote(context, alias) + '.' + quote(context, column._dbName) + operator;
		var filter =  encoded.prepend(firstPart);
		return newBoolean(filter);
	}

	greaterThan_1 = greaterThan;
	return greaterThan_1;
}

var greaterThanOrEqual_1;
var hasRequiredGreaterThanOrEqual;

function requireGreaterThanOrEqual () {
	if (hasRequiredGreaterThanOrEqual) return greaterThanOrEqual_1;
	hasRequiredGreaterThanOrEqual = 1;
	var newBoolean = requireNewBoolean();
	var encodeFilterArg = requireEncodeFilterArg();
	var quote = requireQuote$2();

	function greaterThanOrEqual(context, column,arg,alias) {
		var operator = '>=';
		var encoded = encodeFilterArg(context, column, arg);
		var firstPart = quote(context, alias) + '.' + quote(context, column._dbName) + operator;
		var filter =  encoded.prepend(firstPart);
		return newBoolean(filter);
	}

	greaterThanOrEqual_1 = greaterThanOrEqual;
	return greaterThanOrEqual_1;
}

var _in_1;
var hasRequired_in;

function require_in () {
	if (hasRequired_in) return _in_1;
	hasRequired_in = 1;
	const newParameterized = requireNewParameterized();
	const newBoolean = requireNewBoolean();
	const quote = requireQuote$2();

	function _in(context, column,values,alias) {
		let filter;
		if (values.length === 0) {
			filter =  newParameterized('1=2');
			return newBoolean(filter);
		}
		const firstPart = `${quote(context, alias)}.${quote(context, column._dbName)} in (`;

		const encode = column.encode;
		const paramsSql = new Array(values.length);
		let paramsValues = [];
		for (let i = 0; i < values.length; i++) {
			paramsSql[i] = encode(context, values[i]);
			paramsValues = [...paramsValues, ...paramsSql[i].parameters];
		}
		const sql = `${firstPart +  paramsSql.map(x => x.sql()).join(',')})`;
		return newBoolean(newParameterized(sql, paramsValues));
	}

	_in_1 = _in;
	return _in_1;
}

var extractAlias;
var hasRequiredExtractAlias;

function requireExtractAlias () {
	if (hasRequiredExtractAlias) return extractAlias;
	hasRequiredExtractAlias = 1;
	function extract(table, optionalAlias) {
		if (optionalAlias)
			return optionalAlias;
		return table._rootAlias || table._dbName;
	}

	extractAlias = extract;
	return extractAlias;
}

var columnAggregate_1$1;
var hasRequiredColumnAggregate$1;

function requireColumnAggregate$1 () {
	if (hasRequiredColumnAggregate$1) return columnAggregate_1$1;
	hasRequiredColumnAggregate$1 = 1;
	const getSessionSingleton = requireGetSessionSingleton();

	function columnAggregate(context, operator, column, table, coalesce = true) {
		const quote = getSessionSingleton(context, 'quote');

		const tableAlias = quote(table._rootAlias || table._dbName);
		const columnName = quote(column._dbName);

		return {
			expression: (alias) => coalesce ? `COALESCE(${operator}(${tableAlias}.${columnName}), 0) as ${quote(alias)}` : `${operator}(${tableAlias}.${columnName}) as ${quote(alias)}`,
			joins: ['']
		};
	}

	columnAggregate_1$1 = columnAggregate;
	return columnAggregate_1$1;
}

var newDiscriminatorSql_1$1;
var hasRequiredNewDiscriminatorSql$1;

function requireNewDiscriminatorSql$1 () {
	if (hasRequiredNewDiscriminatorSql$1) return newDiscriminatorSql_1$1;
	hasRequiredNewDiscriminatorSql$1 = 1;
	const getSessionSingleton = requireGetSessionSingleton();

	function newDiscriminatorSql(context, table, alias) {
		const quote = getSessionSingleton(context, 'quote');
		alias = quote(alias);
		var result = '';
		var formulaDiscriminators = table._formulaDiscriminators;
		var columnDiscriminators = table._columnDiscriminators;
		addFormula();
		addColumn();
		return result;

		function addFormula() {
			for (var i = 0; i<formulaDiscriminators.length; i++) {
				var current = formulaDiscriminators[i].replace('@this',alias);
				and();
				result += '(' + current + ')';
			}
		}

		function addColumn() {
			for (var i = 0; i< columnDiscriminators.length; i++) {
				var current = columnDiscriminators[i].split('=');
				and();
				result += alias + '.' + quote(current[0]) + '=' + current[1];
			}
		}

		function and() {
			if(result)
				result += ' AND ';
			else
				result = ' ';
		}
	}

	newDiscriminatorSql_1$1 = newDiscriminatorSql;
	return newDiscriminatorSql_1$1;
}

var newDiscriminatorSql_1;
var hasRequiredNewDiscriminatorSql;

function requireNewDiscriminatorSql () {
	if (hasRequiredNewDiscriminatorSql) return newDiscriminatorSql_1;
	hasRequiredNewDiscriminatorSql = 1;
	var newDiscriminatorSqlCore = requireNewDiscriminatorSql$1();

	function newDiscriminatorSql(context, table, alias) {
		var result = newDiscriminatorSqlCore(context,table,alias);
		if (result)
			return ' AND' + result;
		return result;

	}

	newDiscriminatorSql_1 = newDiscriminatorSql;
	return newDiscriminatorSql_1;
}

var newShallowJoinSqlCore;
var hasRequiredNewShallowJoinSqlCore;

function requireNewShallowJoinSqlCore () {
	if (hasRequiredNewShallowJoinSqlCore) return newShallowJoinSqlCore;
	hasRequiredNewShallowJoinSqlCore = 1;
	const newDiscriminatorSql = requireNewDiscriminatorSql();
	const newParameterized = requireNewParameterized();
	const getSessionSingleton = requireGetSessionSingleton();

	function _new(context, rightTable, leftColumns, rightColumns, leftAlias, rightAlias, filter) {
		const quote = getSessionSingleton(context, 'quote');
		const leftAliasRaw = leftAlias;
		const rightAliasRaw = rightAlias;
		leftAlias = quote(leftAliasRaw);
		rightAlias = quote(rightAliasRaw);
		var sql = '';
		var delimiter = '';
		for (var i = 0; i < leftColumns.length; i++) {
			addColumn(i);
			delimiter = ' AND ';
		}

		function addColumn(index) {
			var leftColumn = leftColumns[index];
			var rightColumn = rightColumns[index];
			sql += delimiter + leftAlias + '.' + quote(leftColumn._dbName) + '=' + rightAlias + '.' + quote(rightColumn._dbName);
		}

		sql += newDiscriminatorSql(context, rightTable, rightAliasRaw);
		var result = newParameterized(sql);
		if (filter)
			result = result.append(delimiter).append(filter);
		return result;
	}

	newShallowJoinSqlCore = _new;
	return newShallowJoinSqlCore;
}

var columnAggregateGroup$1;
var hasRequiredColumnAggregateGroup$1;

function requireColumnAggregateGroup$1 () {
	if (hasRequiredColumnAggregateGroup$1) return columnAggregateGroup$1;
	hasRequiredColumnAggregateGroup$1 = 1;
	var getSessionContext = requireGetSessionContext();
	var newJoinCore = requireNewShallowJoinSqlCore();
	const getSessionSingleton = requireGetSessionSingleton();

	function columnAggregate(context, operator, column, table, coalesce = true) {
		const quote = getSessionSingleton(context, 'quote');
		const rdb = getSessionContext(context);
		const outerAlias = 'y' + rdb.aggregateCount++;
		const outerAliasQuoted = quote(outerAlias);
		const alias = quote('x');
		const foreignKeys = getForeignKeys(table);
		const select = ` LEFT JOIN (SELECT ${foreignKeys},${operator}(${alias}.${quote(column._dbName)}) as amount`;
		const onClause = createOnClause(context, table, outerAlias);
		const from = ` FROM ${quote(table._dbName)} ${alias} GROUP BY ${foreignKeys}) ${outerAliasQuoted} ON (${onClause})`;
		const join = select + from;

		return {
			expression: (alias) => coalesce ? `COALESCE(${outerAliasQuoted}.amount, 0) as ${quote(alias)}` : `${outerAliasQuoted}.amount as ${alias}`,
			joins: [join]
		};

		function getForeignKeys(table) {
			return table._primaryColumns.map(x => `${alias}.${quote(x._dbName)}`).join(',');
		}
	}

	function createOnClause(context, table, rightAlias) {
		let leftAlias = table._rootAlias || table._dbName;
		const columns = table._primaryColumns;
		return newJoinCore(context, table, columns, columns, leftAlias, rightAlias).sql();
	}



	columnAggregateGroup$1 = columnAggregate;
	return columnAggregateGroup$1;
}

var newColumn;
var hasRequiredNewColumn;

function requireNewColumn () {
	if (hasRequiredNewColumn) return newColumn;
	hasRequiredNewColumn = 1;
	const equal = requireEqual();
	const notEqual = requireNotEqual();
	const lessThan = requireLessThan();
	const lessThanOrEqual = requireLessThanOrEqual();
	const greaterThan = requireGreaterThan();
	const greaterThanOrEqual = requireGreaterThanOrEqual();
	const _in = require_in();
	const _extractAlias = requireExtractAlias();
	const quote = requireQuote$2();
	const aggregate = requireColumnAggregate$1();
	const aggregateGroup = requireColumnAggregateGroup$1();
	const newParameterized = requireNewParameterized();

	newColumn = function(table, name) {
		var c = {};
		var extractAlias = _extractAlias.bind(null, table);
		c._dbName = name;
		c.alias = name;
		table._aliases.add(name);
		Object.defineProperty(c, '_table', {
			value: table,
			enumerable: false,
			writable: false
		});
		Object.defineProperty(c, '_toFilterArg', {
			value: toFilterArg,
			enumerable: false,
			writable: false
		});

		c.dbNull = null;
		table._columns.push(c);
		table[name] = c;

		c.equal = function(context, arg, alias) {
			alias = extractAlias(alias);
			return equal(context, c, arg, alias);
		};

		c.notEqual = function(context, arg, alias) {
			alias = extractAlias(alias);
			return notEqual(context, c, arg, alias);
		};

		c.lessThan = function(context, arg, alias) {
			alias = extractAlias(alias);
			return lessThan(context, c, arg, alias);
		};

		c.lessThanOrEqual = function(context, arg, alias) {
			alias = extractAlias(alias);
			return lessThanOrEqual(context, c, arg, alias);
		};

		c.greaterThan = function(context, arg, alias) {
			alias = extractAlias(alias);
			return greaterThan(context, c, arg, alias);
		};

		c.greaterThanOrEqual = function(context, arg, alias) {
			alias = extractAlias(alias);
			return greaterThanOrEqual(context, c, arg, alias);
		};

		c.between = function(context, from, to, alias) {
			alias = extractAlias(alias);
			from = c.greaterThanOrEqual(context, from, alias);
			to = c.lessThanOrEqual(context, to, alias);
			return from.and(context, to);
		};

		c.in = function(context, arg, alias) {
			alias = extractAlias(alias);
			return _in(context, c, arg, alias);
		};

		c.eq = c.equal;
		c.EQ = c.eq;
		c.ne = c.notEqual;
		c.NE = c.ne;
		c.gt = c.greaterThan;
		c.GT = c.gt;
		c.ge = c.greaterThanOrEqual;
		c.GE = c.ge;
		c.lt = c.lessThan;
		c.LT = c.lt;
		c.le = c.lessThanOrEqual;
		c.LE = c.le;
		c.IN = c.in;
		c.self = self;

		c.groupSum = (context, ...rest) => aggregateGroup.apply(null, [context, 'sum', c, table, ...rest]);
		c.groupAvg = (context, ...rest) => aggregateGroup.apply(null, [context, 'avg', c, table, ...rest]);
		c.groupMin = (context, ...rest) => aggregateGroup.apply(null, [context, 'min', c, table, false, ...rest]);
		c.groupMax = (context, ...rest) => aggregateGroup.apply(null, [context, 'max', c, table, false, ...rest]);
		c.groupCount = (context, ...rest) => aggregateGroup.apply(null, [context, 'count', c, table, false, ...rest]);
		c.sum = (context, ...rest) => aggregate.apply(null, [context, 'sum', c, table, ...rest]);
		c.avg = (context, ...rest) => aggregate.apply(null, [context, 'avg', c, table, ...rest]);
		c.min = (context, ...rest) => aggregate.apply(null, [context, 'min', c, table, false, ...rest]);
		c.max = (context, ...rest) => aggregate.apply(null, [context, 'max', c, table, false, ...rest]);
		c.count = (context, ...rest) => aggregate.apply(null, [context, 'count', c, table, false, ...rest]);

		function self(context) {
			const tableAlias = quote(context,table._rootAlias || table._dbName);
			const columnName = quote(context, c._dbName);

			return {
				expression: (alias) => `${tableAlias}.${columnName} ${quote(context, alias)}`,
				joins: [''],
				column: c,
				groupBy: `${tableAlias}.${columnName}`
			};
		}

		function toFilterArg(context) {
			const tableAlias = quote(context, table._rootAlias || table._dbName);
			const columnName = quote(context, c._dbName);
			return newParameterized(`${tableAlias}.${columnName}`);
		}

		return c;
	};
	return newColumn;
}

var require$$0 = /*@__PURE__*/getDefaultExportFromNamespaceIfPresent(ajv);

var purify_1$5;
var hasRequiredPurify$6;

function requirePurify$6 () {
	if (hasRequiredPurify$6) return purify_1$5;
	hasRequiredPurify$6 = 1;
	function purify(value) {
		if(value == null)
			return null;
		return value;
	}

	purify_1$5 = purify;
	return purify_1$5;
}

var newEncode$8;
var hasRequiredNewEncode$8;

function requireNewEncode$8 () {
	if (hasRequiredNewEncode$8) return newEncode$8;
	hasRequiredNewEncode$8 = 1;
	var newPara = requireNewParameterized();
	var purify = requirePurify$6();

	function _new(column) {

		var encode = function(_context, value) {
			value = purify(value);
			if (value == null) {
				if (column.dbNull === null)
					return newPara('null');
				return newPara('\'' + column.dbNull + '\'');
			}
			return newPara('?', [value]);
		};

		encode.unsafe = function(_context, value) {
			value = purify(value);
			if (value == null) {
				if (column.dbNull === null)
					return 'null';
				return '\'' + column.dbNull + '\'';
			}
			return '\'' + value + '\'';
		};

		encode.direct = function(_context, value) {
			return value ;
		};

		return encode;

	}

	newEncode$8 = _new;
	return newEncode$8;
}

var newDecodeCore;
var hasRequiredNewDecodeCore;

function requireNewDecodeCore () {
	if (hasRequiredNewDecodeCore) return newDecodeCore;
	hasRequiredNewDecodeCore = 1;
	function _new(column) {

		return function(_context, value) {
			if (value == column.dbNull)
				return null;
			return value;
		};
	}

	newDecodeCore = _new;
	return newDecodeCore;
}

var newLikeColumnArg_1;
var hasRequiredNewLikeColumnArg;

function requireNewLikeColumnArg () {
	if (hasRequiredNewLikeColumnArg) return newLikeColumnArg_1;
	hasRequiredNewLikeColumnArg = 1;
	var getSessionSingleton = requireGetSessionSingleton();
	var newParameterized = requireNewParameterized();

	function newLikeColumnArg(context, column, encodedArg, prefix, suffix) {
		var encodedPrefix = prefix ? column.encode(context, prefix) : null;
		var encodedSuffix = suffix ? column.encode(context, suffix) : null;
		var engine = getSessionSingleton(context, 'engine');

		if (engine === 'mysql' || engine === 'mariadb')
			return concatWithFunction(encodedPrefix, encodedArg, encodedSuffix);
		if (engine === 'mssql' || engine === 'mssqlNative')
			return concatWithOperator('+', encodedPrefix, encodedArg, encodedSuffix);
		return concatWithOperator('||', encodedPrefix, encodedArg, encodedSuffix);
	}

	function concatWithFunction(prefix, value, suffix) {
		var args = [prefix, value, suffix].filter(Boolean);
		var sql = 'CONCAT(' + args.map(x => x.sql()).join(',') + ')';
		var parameters = [];
		for (var i = 0; i < args.length; i++)
			parameters = parameters.concat(args[i].parameters);
		return newParameterized(sql, parameters);
	}

	function concatWithOperator(operator, prefix, value, suffix) {
		var args = [prefix, value, suffix].filter(Boolean);
		var sql = '';
		var parameters = [];
		for (var i = 0; i < args.length; i++) {
			if (i > 0)
				sql += ' ' + operator + ' ';
			sql += args[i].sql();
			parameters = parameters.concat(args[i].parameters);
		}
		return newParameterized(sql, parameters);
	}

	newLikeColumnArg_1 = newLikeColumnArg;
	return newLikeColumnArg_1;
}

var startsWithCore_1;
var hasRequiredStartsWithCore;

function requireStartsWithCore () {
	if (hasRequiredStartsWithCore) return startsWithCore_1;
	hasRequiredStartsWithCore = 1;
	var newBoolean = requireNewBoolean();
	var nullOperator = ' is ';
	var quote = requireQuote$2();
	var encodeFilterArg = requireEncodeFilterArg();
	var newLikeColumnArg = requireNewLikeColumnArg();

	function startsWithCore(context, operator, column,arg,alias) {
		operator = ' ' + operator + ' ';
		var encoded = encodeFilterArg(context, column, arg);
		if (encoded.sql() == 'null')
			operator = nullOperator;
		else if (arg && typeof arg._toFilterArg === 'function')
			encoded = newLikeColumnArg(context, column, encoded, null, '%');
		else
			encoded = column.encode(context, arg + '%');
		var firstPart = quote(context, alias) + '.' + quote(context, column._dbName) + operator;
		var filter =  encoded.prepend(firstPart);
		return newBoolean(filter);
	}

	startsWithCore_1 = startsWithCore;
	return startsWithCore_1;
}

var startsWith;
var hasRequiredStartsWith;

function requireStartsWith () {
	if (hasRequiredStartsWith) return startsWith;
	hasRequiredStartsWith = 1;
	var startsWithCore = requireStartsWithCore();

	startsWith = (context, ...rest) => startsWithCore.apply(null, [context, 'LIKE', ...rest]);
	return startsWith;
}

var endsWithCore_1;
var hasRequiredEndsWithCore;

function requireEndsWithCore () {
	if (hasRequiredEndsWithCore) return endsWithCore_1;
	hasRequiredEndsWithCore = 1;
	const quote = requireQuote$2();
	var newBoolean = requireNewBoolean();
	var nullOperator = ' is ';
	var encodeFilterArg = requireEncodeFilterArg();
	var newLikeColumnArg = requireNewLikeColumnArg();

	function endsWithCore(context, operator, column,arg,alias) {
		alias = quote(context, alias);
		operator = ' ' + operator + ' ';
		var encoded = encodeFilterArg(context, column, arg);
		if (encoded.sql() == 'null')
			operator = nullOperator;
		else if (arg && typeof arg._toFilterArg === 'function')
			encoded = newLikeColumnArg(context, column, encoded, '%', null);
		else
			encoded = column.encode(context, '%' + arg);
		var firstPart = alias + '.' + quote(context, column._dbName) + operator;
		var filter =  encoded.prepend(firstPart);
		return newBoolean(filter);
	}

	endsWithCore_1 = endsWithCore;
	return endsWithCore_1;
}

var endsWith;
var hasRequiredEndsWith;

function requireEndsWith () {
	if (hasRequiredEndsWith) return endsWith;
	hasRequiredEndsWith = 1;
	var endsWithCore = requireEndsWithCore();

	endsWith = (context, ...rest) => endsWithCore.apply(null, [context, 'LIKE', ...rest]);
	return endsWith;
}

var containsCore_1;
var hasRequiredContainsCore;

function requireContainsCore () {
	if (hasRequiredContainsCore) return containsCore_1;
	hasRequiredContainsCore = 1;
	const quote = requireQuote$2();
	var newBoolean = requireNewBoolean();
	var nullOperator = ' is ';
	var encodeFilterArg = requireEncodeFilterArg();
	var newLikeColumnArg = requireNewLikeColumnArg();

	function containsCore(context, operator, column,arg,alias) {
		alias = quote(context, alias);
		operator = ' ' + operator + ' ';
		var encoded = encodeFilterArg(context, column, arg);
		if (encoded.sql() == 'null')
			operator = nullOperator;
		else if (arg && typeof arg._toFilterArg === 'function')
			encoded = newLikeColumnArg(context, column, encoded, '%', '%');
		else
			encoded = column.encode(context, '%' + arg + '%');
		var firstPart = alias + '.' + quote(context, column._dbName) + operator;
		var filter =  encoded.prepend(firstPart);
		return newBoolean(filter);
	}

	containsCore_1 = containsCore;
	return containsCore_1;
}

var contains;
var hasRequiredContains;

function requireContains () {
	if (hasRequiredContains) return contains;
	hasRequiredContains = 1;
	var containsCore = requireContainsCore();

	contains = (context, ...rest) => containsCore.apply(null, [context, 'LIKE', ...rest]);
	return contains;
}

var iStartsWith;
var hasRequiredIStartsWith;

function requireIStartsWith () {
	if (hasRequiredIStartsWith) return iStartsWith;
	hasRequiredIStartsWith = 1;
	var startsWithCore = requireStartsWithCore();

	iStartsWith = (context, ...rest) => startsWithCore.apply(null, [context, 'ILIKE', ...rest]);
	return iStartsWith;
}

var iEndsWith;
var hasRequiredIEndsWith;

function requireIEndsWith () {
	if (hasRequiredIEndsWith) return iEndsWith;
	hasRequiredIEndsWith = 1;
	var endsWithCore = requireEndsWithCore();

	iEndsWith = (context, ...rest) => endsWithCore.apply(null, [context, 'ILIKE', ...rest]);
	return iEndsWith;
}

var iContains;
var hasRequiredIContains;

function requireIContains () {
	if (hasRequiredIContains) return iContains;
	hasRequiredIContains = 1;
	var containsCore = requireContainsCore();

	iContains = (context, ...rest) => containsCore.apply(null, [context, 'ILIKE', ...rest]);
	return iContains;
}

var iEqual_1;
var hasRequiredIEqual;

function requireIEqual () {
	if (hasRequiredIEqual) return iEqual_1;
	hasRequiredIEqual = 1;
	var newBoolean = requireNewBoolean();
	var nullOperator = ' is ';
	var encodeFilterArg = requireEncodeFilterArg();
	const quote = requireQuote$2();

	function iEqual(context, column,arg,alias) {
		var operator = ' ILIKE ';
		var encoded = encodeFilterArg(context, column, arg);
		if (encoded.sql() == 'null')
			operator = nullOperator;
		var firstPart = alias + '.' + quote(context, column._dbName) + operator;
		var filter =  encoded.prepend(firstPart);
		return newBoolean(filter);
	}

	iEqual_1 = iEqual;
	return iEqual_1;
}

var string;
var hasRequiredString;

function requireString () {
	if (hasRequiredString) return string;
	hasRequiredString = 1;
	var newEncode = requireNewEncode$8();
	var newDecode = requireNewDecodeCore();
	var startsWith = requireStartsWith();
	var endsWith = requireEndsWith();
	var contains = requireContains();
	var iStartsWith = requireIStartsWith();
	var iEndsWith = requireIEndsWith();
	var iContains = requireIContains();
	var iEqual = requireIEqual();
	var purify = requirePurify$6();
	var _extractAlias = requireExtractAlias();

	function _new(table, column) {
		column.tsType = 'StringColumn';
		column.purify = purify;
		column.encode = newEncode(column);
		column.decode = newDecode(column);
		var extractAlias = _extractAlias.bind(null, table);

		column.startsWith = function(context, arg, alias) {
			alias = extractAlias(alias);
			return startsWith(context, column, arg, alias);
		};
		column.endsWith = function(context, arg, alias) {
			alias = extractAlias(alias);
			return endsWith(context, column, arg, alias);
		};
		column.contains = function(context, arg, alias) {
			alias = extractAlias(alias);
			return contains(context, column, arg, alias);
		};
		column.iStartsWith = function(context, arg, alias) {
			alias = extractAlias(alias);
			return iStartsWith(context, column, arg, alias);
		};
		column.iEndsWith = function(context, arg, alias) {
			alias = extractAlias(alias);
			return iEndsWith(context, column, arg, alias);
		};
		column.iContains = function(context, arg, alias) {
			alias = extractAlias(alias);
			return iContains(context, column, arg, alias);
		};

		column.iEqual = function(context, arg, alias) {
			alias = extractAlias(alias);
			return iEqual(context, column, arg, alias);
		};

		column.iEq = column.iEqual;
		column.IEQ = column.iEqual;
		column.ieq = column.iEqual;
	}

	string = _new;
	return string;
}

var purify_1$4;
var hasRequiredPurify$5;

function requirePurify$5 () {
	if (hasRequiredPurify$5) return purify_1$4;
	hasRequiredPurify$5 = 1;
	function purify(value) {
		if(value == null)
			return null;
		return value;
	}

	purify_1$4 = purify;
	return purify_1$4;
}

var newEncode$7;
var hasRequiredNewEncode$7;

function requireNewEncode$7 () {
	if (hasRequiredNewEncode$7) return newEncode$7;
	hasRequiredNewEncode$7 = 1;
	var newPara = requireNewParameterized();
	var purify = requirePurify$5();
	var getSessionContext = requireGetSessionContext();
	var getSessionSingleton = requireGetSessionSingleton();

	function _new(column) {

		const encode = function(context, candidate) {
			var value = purify(candidate);
			if (value == null) {
				if(column.dbNull === null)
					return newPara('null');
				return newPara('\'' + column.dbNull + '\'');
			}
			var ctx = getSessionContext(context);
			var encodeCore = getSessionSingleton(context, 'encodeJSON') || ((v) => v);
			var formatIn = ctx.formatJSONIn;
			return newPara(formatIn ? formatIn('?') : '?', [encodeCore(value)]);
		};

		encode.unsafe = function(context, candidate) {
			var value = purify(candidate);
			if (value == null) {
				if(column.dbNull === null)
					return 'null';
				return '\'' + column.dbNull + '\'';
			}
			var encodeCore = getSessionSingleton(context, 'encodeJSON') || ((v) => v);

			if (encodeCore) {
				value = encodeCore(value);
			}
			return value;
		};

		encode.direct = function(context, value) {
			var encodeCore = getSessionSingleton(context, 'encodeJSON') || ((v) => v);

			if (encodeCore) {
				value = encodeCore(value);
			}
			return value;
		};

		return encode;
	}

	newEncode$7 = _new;
	return newEncode$7;
}

var newDecode$6;
var hasRequiredNewDecode$6;

function requireNewDecode$6 () {
	if (hasRequiredNewDecode$6) return newDecode$6;
	hasRequiredNewDecode$6 = 1;
	let newDecodeCore = requireNewDecodeCore();
	let getSessionContext = requireGetSessionContext();

	function _new(column) {
		let decodeCore = newDecodeCore(column);

		return function(context, value) {
			value = decodeCore(context, value);
			if (value === null)
				return value;
			if (typeof value !== 'object') {
				let decode = getSessionContext(context).decodeJSON;
				if (decode)
					return decode(value);
				return value;
			}
			return value;
		};
	}

	newDecode$6 = _new;
	return newDecode$6;
}

var formatOutGeneric_1;
var hasRequiredFormatOutGeneric;

function requireFormatOutGeneric () {
	if (hasRequiredFormatOutGeneric) return formatOutGeneric_1;
	hasRequiredFormatOutGeneric = 1;
	var getSessionSingleton = requireGetSessionSingleton();
	const quote = requireQuote$2();

	function formatOutGeneric(context, column, fnName, alias) {
		var formatColumn = getSessionSingleton(context, fnName);
		if (formatColumn)
			return formatColumn(column, alias);
		else if (alias)
			return `${alias}.${quote(context, column._dbName)}`;
		else
			return `${quote(context, column._dbName)}`;
	}

	formatOutGeneric_1 = formatOutGeneric;
	return formatOutGeneric_1;
}

var require$$9 = /*@__PURE__*/getDefaultExportFromNamespaceIfPresent(onChange);

var json;
var hasRequiredJson;

function requireJson () {
	if (hasRequiredJson) return json;
	hasRequiredJson = 1;
	var newEncode = requireNewEncode$7();
	var newDecode = requireNewDecode$6();
	var formatOut = requireFormatOutGeneric();
	var purify = requirePurify$5();
	var onChange = require$$9;
	let clone = require$$5;

	function _new(column) {
		column.tsType = 'JSONColumn';
		column.purify = purify;
		column.encode = newEncode(column);
		column.decode = newDecode(column);
		column.formatOut = (context, ...rest) => formatOut.apply(null, [context, column, 'formatJSONOut', ...rest]);

		column.onChange = onChange;
		column.toDto = toDto;
	}

	function toDto(value) {
		return clone(value);
	}

	json = _new;
	return json;
}

var purify;
var hasRequiredPurify$4;

function requirePurify$4 () {
	if (hasRequiredPurify$4) return purify;
	hasRequiredPurify$4 = 1;
	function negotiateGuidFormat(candidate) {
		if(candidate == null)
			return null;
		var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if(!pattern.test(candidate))
			throw new TypeError(candidate +  ' is not a valid UUID');
		return candidate;
	}

	purify = negotiateGuidFormat;
	return purify;
}

var newEncode$6;
var hasRequiredNewEncode$6;

function requireNewEncode$6 () {
	if (hasRequiredNewEncode$6) return newEncode$6;
	hasRequiredNewEncode$6 = 1;
	var newPara = requireNewParameterized();
	var purify = requirePurify$4();

	function _new(column) {

		const encode = function(_context, candidate) {
			var value = purify(candidate);
			if (value == null) {
				if (column.dbNull === null)
					return newPara('null');
				return newPara('\'' + column.dbNull + '\'');
			}
			return newPara('\'' + value + '\'');
		};

		encode.unsafe = function(_context, candidate) {
			var value = purify(candidate);
			if (value == null) {
				if (column.dbNull === null)
					return 'null';
				return '\'' + column.dbNull + '\'';
			}
			return '\'' + value + '\'';
		};

		encode.direct = function(_context, value) {
			return value ;
		};


		return encode;
	}

	newEncode$6 = _new;
	return newEncode$6;
}

var newDecode$5;
var hasRequiredNewDecode$5;

function requireNewDecode$5 () {
	if (hasRequiredNewDecode$5) return newDecode$5;
	hasRequiredNewDecode$5 = 1;
	function _new(column) {

		return function(_context, value) {
			if (value == column.dbNull)
				return null;
			return value.toLowerCase();
		};
	}

	newDecode$5 = _new;
	return newDecode$5;
}

var guid;
var hasRequiredGuid;

function requireGuid () {
	if (hasRequiredGuid) return guid;
	hasRequiredGuid = 1;
	var newEncode = requireNewEncode$6();
	var newDecode = requireNewDecode$5();
	var purify = requirePurify$4();

	function _new(column) {
		column.tsType = 'UUIDColumn';
		column.purify = purify;
		column.encode = newEncode(column);
		column.decode = newDecode(column);
	}

	guid = _new;
	return guid;
}

var tryParseISO_1;
var hasRequiredTryParseISO;

function requireTryParseISO () {
	if (hasRequiredTryParseISO) return tryParseISO_1;
	hasRequiredTryParseISO = 1;
	var patternWithTime = /(\d{4}-[01]\d-[0-3]\d(T| )[0-2]\d:[0-5]\d:[0-5]\d\.\d+)|(\d{4}-[01]\d-[0-3]\d(T| )[0-2]\d:[0-5]\d:[0-5]\d)|(\d{4}-[01]\d-[0-3]\d(T| )[0-2]\d:[0-5]\d)/;
	var patternDateOnly = /^\d{4}-[01]\d-[0-3]\d$/;

	function tryParseISO(iso) {
		if (patternWithTime.test(iso) || patternDateOnly.test(iso)) {
			return iso;
		} else {
			throw new TypeError(iso + ' is not a valid Date');
		}
	}

	tryParseISO_1 = tryParseISO;
	return tryParseISO_1;
}

var purify_1$3;
var hasRequiredPurify$3;

function requirePurify$3 () {
	if (hasRequiredPurify$3) return purify_1$3;
	hasRequiredPurify$3 = 1;
	var tryParseISO = requireTryParseISO();
	var dateToISOString = requireDateToISOString();

	function purify(value) {
		if(value == null)
			return null;
		if (value.toISOString)
			return dateToISOString(value);
		if (value.indexOf('Z') > -1)
			return 	dateToISOString(new Date(value));
		var iso = tryParseISO(value);
		if (iso)
			return iso;
		return value;
	}

	purify_1$3 = purify;
	return purify_1$3;
}

var newEncode$5;
var hasRequiredNewEncode$5;

function requireNewEncode$5 () {
	if (hasRequiredNewEncode$5) return newEncode$5;
	hasRequiredNewEncode$5 = 1;
	var newPara = requireNewParameterized();
	var purify = requirePurify$3();
	var getSessionContext = requireGetSessionContext();
	var getSessionSingleton = requireGetSessionSingleton();

	function _new(column) {
		var encode = function(context, value) {
			value = purify(value);
			if (value == null) {
				if (column.dbNull === null)
					return newPara('null');
				return newPara('\'' + column.dbNull + '\'');
			}
			var ctx = getSessionContext(context);
			var encodeCore = ctx.encodeDate || encodeDate;
			var formatIn = ctx.formatDateIn;
			return newPara(formatIn ? formatIn('?') : '?', [encodeCore(value)]);
		};

		encode.unsafe = function(context, value) {
			value = purify(value);
			if (value == null) {
				if (column.dbNull === null)
					return 'null';
				return '\'' + column.dbNull + '\'';
			}
			var encodeCore = getSessionSingleton(context, 'encodeDate') || encodeDate;
			return encodeCore(value);
		};

		encode.direct = function(context, value) {
			var encodeCore = getSessionSingleton(context, 'encodeDate') || encodeDate;
			return encodeCore(value);
		};

		return encode;


	}
	function encodeDate(date) {
		date = date.toISOString ? removeTimezone(date.toISOString(date)) : removeTimezone(date);
		return date;
	}

	function removeTimezone(isoString) {
		let dateTimePattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?/;
		let match = isoString.match(dateTimePattern);
		return match ? match[0] : isoString;
	}


	newEncode$5 = _new;
	return newEncode$5;
}

var newDecode$4;
var hasRequiredNewDecode$4;

function requireNewDecode$4 () {
	if (hasRequiredNewDecode$4) return newDecode$4;
	hasRequiredNewDecode$4 = 1;
	var newDecodeCore = requireNewDecodeCore();
	var dateToISOString = requireDateToISOString();

	function _new(column) {
		var decodeCore = newDecodeCore(column);

		return function(context, value) {
			value = decodeCore(context, value);
			if (value === null)
				return value;
			else if (typeof value === 'string')
				return value.replace(' ', 'T').replace(' ', '');
			return dateToISOString(value);
		};
	}

	newDecode$4 = _new;
	return newDecode$4;
}

var formatOut_1$1;
var hasRequiredFormatOut$1;

function requireFormatOut$1 () {
	if (hasRequiredFormatOut$1) return formatOut_1$1;
	hasRequiredFormatOut$1 = 1;
	var getSessionSingleton = requireGetSessionSingleton();
	const quote = requireQuote$2();

	function formatOut(context, column, alias) {
		var formatColumn = getSessionSingleton(context, 'formatDateOut');
		if (formatColumn)
			return formatColumn(column, alias);
		else if (alias)
			return `${alias}.${quote(context, column._dbName)}`;
		else
			return `${quote(context, column._dbName)}`;
	}

	formatOut_1$1 = formatOut;
	return formatOut_1$1;
}

var date;
var hasRequiredDate;

function requireDate () {
	if (hasRequiredDate) return date;
	hasRequiredDate = 1;
	var newEncode = requireNewEncode$5();
	var newDecode = requireNewDecode$4();
	var formatOut = requireFormatOut$1();
	var purify = requirePurify$3();

	function _new(column) {
		column.tsType = 'DateColumn';
		column.purify = purify;
		column.encode = newEncode(column);
		column.decode = newDecode(column);
		column.formatOut = (context, ...rest) => formatOut.apply(null, [context, column, ...rest]);
	}

	date = _new;
	return date;
}

var newEncode$4;
var hasRequiredNewEncode$4;

function requireNewEncode$4 () {
	if (hasRequiredNewEncode$4) return newEncode$4;
	hasRequiredNewEncode$4 = 1;
	var newPara = requireNewParameterized();
	var purify = requirePurify$3();
	var getSessionContext = requireGetSessionContext();
	var getSessionSingleton = requireGetSessionSingleton();

	function _new(column) {
		var encode = function(context, value) {
			value = purify(value);
			if (value == null) {
				if (column.dbNull === null)
					return newPara('null');
				return newPara('\'' + column.dbNull + '\'');
			}
			var ctx = getSessionContext(context);
			var encodeCore = ctx.encodeDateTz || ctx.encodeDate || encodeDate;
			return newPara('?', [encodeCore(value)]);
		};

		encode.unsafe = function(context, value) {
			value = purify(value);
			if (value == null) {
				if (column.dbNull === null)
					return 'null';
				return '\'' + column.dbNull + '\'';
			}
			var encodeCore = getSessionSingleton(context, 'encodeDateTz') || getSessionSingleton(context, 'encodeDate') || encodeDate;
			return encodeCore(value);
		};

		encode.direct = function(context, value) {
			var encodeCore = getSessionSingleton(context, 'encodeDateTz') || getSessionSingleton(context, 'encodeDate') || encodeDate;
			return encodeCore(value);
		};

		return encode;
	}

	function encodeDate(date) {
		if (date.toISOString)
			return truncate(date.toISOString());
		return truncate(date);
	}

	function truncate(date) {
		return date;
	}

	newEncode$4 = _new;
	return newEncode$4;
}

var formatOut_1;
var hasRequiredFormatOut;

function requireFormatOut () {
	if (hasRequiredFormatOut) return formatOut_1;
	hasRequiredFormatOut = 1;
	var getSessionSingleton = requireGetSessionSingleton();
	const quote = requireQuote$2();

	function formatOut(context, column, alias) {
		var formatColumn = getSessionSingleton(context, 'formatDateTzOut') ||  getSessionSingleton(context, 'formatDateOut');
		if (formatColumn)
			return formatColumn(column, alias);
		else if (alias)
			return `${alias}.${quote(context, column._dbName)}`;
		else
			return `${quote(context, column._dbName)}`;
	}

	formatOut_1 = formatOut;
	return formatOut_1;
}

var dateWithTimeZone;
var hasRequiredDateWithTimeZone;

function requireDateWithTimeZone () {
	if (hasRequiredDateWithTimeZone) return dateWithTimeZone;
	hasRequiredDateWithTimeZone = 1;
	var newEncode = requireNewEncode$4();
	var newDecode = requireNewDecode$4();
	var formatOut = requireFormatOut();
	var purify = requirePurify$3();

	function _new(column) {
		column.tsType = 'DateColumn';
		column.hasTimeZone = true;
		column.purify = purify;
		column.encode = newEncode(column);
		column.decode = newDecode(column);
		column.formatOut = (context, ...rest) => formatOut.apply(null, [context, column, ...rest]);
	}

	dateWithTimeZone = _new;
	return dateWithTimeZone;
}

var purify_1$2;
var hasRequiredPurify$2;

function requirePurify$2 () {
	if (hasRequiredPurify$2) return purify_1$2;
	hasRequiredPurify$2 = 1;
	function purify(value) {
		if(value == null)
			return null;
		const parsedFloat = Number.parseFloat(value);
		if (!isNaN(parsedFloat))
			return parsedFloat;
		if (typeof(value) !== 'number')
			throw new Error('\'' + value + '\'' + ' is not a number');
		return value;
	}

	purify_1$2 = purify;
	return purify_1$2;
}

var newEncode$3;
var hasRequiredNewEncode$3;

function requireNewEncode$3 () {
	if (hasRequiredNewEncode$3) return newEncode$3;
	hasRequiredNewEncode$3 = 1;
	var purify = requirePurify$2();
	var newParam = requireNewParameterized();

	newEncode$3 = function(column) {

		function encode(_context, value) {
			value = purify(value);
			if (value == null) {
				var dbNull = column.dbNull;
				return newParam('' + dbNull + '');
			}
			return newParam('' + value);
		}

		encode.unsafe = function(_context, value) {
			value = purify(value);
			if (value == null) {
				var dbNull = column.dbNull;
				return '' + dbNull + '';
			}
			return '' + value;
		};

		encode.direct = function(_context, value) {
			return value ;
		};

		return encode;
	};
	return newEncode$3;
}

var newDecode$3;
var hasRequiredNewDecode$3;

function requireNewDecode$3 () {
	if (hasRequiredNewDecode$3) return newDecode$3;
	hasRequiredNewDecode$3 = 1;
	var newDecodeCore = requireNewDecodeCore();

	function _new(column) {
		var decodeCore = newDecodeCore(column);

		return function(context, value) {
			value = decodeCore(context, value);
			if (value === null)
				return value;
			if (typeof(value) !== 'number')
				return parseFloat(value);
			return value;
		};
	}

	newDecode$3 = _new;
	return newDecode$3;
}

var numeric;
var hasRequiredNumeric;

function requireNumeric () {
	if (hasRequiredNumeric) return numeric;
	hasRequiredNumeric = 1;
	var newEncode = requireNewEncode$3();
	var newDecode = requireNewDecode$3();
	var purify = requirePurify$2();

	function _new(column) {
		column.tsType = 'NumberColumn';
		// if (!column.isPrimary)
		// 	column.default = 0;
		column.lazyDefault = 0;
		column.purify = purify;
		column.encode = newEncode(column);
		column.decode = newDecode(column);
	}

	numeric = _new;
	return numeric;
}

var newEncode$2;
var hasRequiredNewEncode$2;

function requireNewEncode$2 () {
	if (hasRequiredNewEncode$2) return newEncode$2;
	hasRequiredNewEncode$2 = 1;
	var newPara = requireNewParameterized();
	var purify = requirePurify$6();
	var getSessionContext = requireGetSessionContext();
	var getSessionSingleton = requireGetSessionSingleton();

	function _new(column) {
		var encode = function(context, value) {
			value = purify(value);
			if (value == null) {
				if (column.dbNull === null)
					return newPara('null');
				return newPara('\'' + column.dbNull + '\'');
			}
			var ctx = getSessionContext(context);
			var encodeCore = ctx.encodeBigint || encodeBigint;
			var formatIn = ctx.formatBigintIn;
			return newPara(formatIn ? formatIn('?') : '?', [encodeCore(value)]);
		};

		encode.unsafe = function(context, value) {
			value = purify(value);
			if (value == null) {
				if (column.dbNull === null)
					return 'null';
				return '\'' + column.dbNull + '\'';
			}
			var encodeCore = getSessionSingleton(context, 'encodeBigint') || encodeBigint;
			return encodeCore(value);
		};

		encode.direct = function(context, value) {
			var encodeCore = getSessionSingleton(context, 'encodeBigint') || encodeBigint;
			return encodeCore(value);
		};

		return encode;


	}
	function encodeBigint(value) {
		return value;
	}

	newEncode$2 = _new;
	return newEncode$2;
}

var newDecode$2;
var hasRequiredNewDecode$2;

function requireNewDecode$2 () {
	if (hasRequiredNewDecode$2) return newDecode$2;
	hasRequiredNewDecode$2 = 1;
	var newDecodeCore = requireNewDecodeCore();

	function _new(column) {
		var decodeCore = newDecodeCore(column);

		return function(context, value) {
			value = decodeCore(context, value);
			if (value === null)
				return value;
			if (typeof(value) === 'string')
				return value;
			if (value.toString)
				return value.toString();
			return value;
		};
	}

	newDecode$2 = _new;
	return newDecode$2;
}

var bigint;
var hasRequiredBigint;

function requireBigint () {
	if (hasRequiredBigint) return bigint;
	hasRequiredBigint = 1;
	var newEncode = requireNewEncode$2();
	var newDecode = requireNewDecode$2();
	var formatOut = requireFormatOutGeneric();
	var purify = requirePurify$6();

	function _new(column) {
		column.tsType = 'BigintColumn';
		column.purify = purify;
		column.lazyDefault = '0';
		column.encode = newEncode(column);
		column.decode = newDecode(column);
		column.formatOut = (context, ...rest) => formatOut.apply(null, [context, column, 'formatBigintOut', ...rest]);

	}

	bigint = _new;
	return bigint;
}

var purify_1$1;
var hasRequiredPurify$1;

function requirePurify$1 () {
	if (hasRequiredPurify$1) return purify_1$1;
	hasRequiredPurify$1 = 1;
	function purify(value) {
		if (value === null || typeof (value) === 'undefined')
			return null;
		return Boolean(value);
	}

	purify_1$1 = purify;
	return purify_1$1;
}

var newEncode$1;
var hasRequiredNewEncode$1;

function requireNewEncode$1 () {
	if (hasRequiredNewEncode$1) return newEncode$1;
	hasRequiredNewEncode$1 = 1;
	var purify = requirePurify$1();
	var newParam = requireNewParameterized();
	var getSessionSingleton = requireGetSessionSingleton();

	function _new(column) {

		function encode(context, value) {
			value = purify(value);
			if (value === null) {
				if (column.dbNull === null)
					return newParam('null');
				return newParam('\'' + column.dbNull + '\'');
			}
			var encodeCore = getSessionSingleton(context, 'encodeBoolean') || encodeDefault;


			return newParam('?', [encodeCore(value)]);
		}

		encode.unsafe = function(context, value) {
			value = purify(value);
			if (value === null) {
				if (column.dbNull === null)
					return 'null';
				return '\'' + column.dbNull + '\'';
			}
			var encodeCore = getSessionSingleton(context, 'encodeBoolean') || encodeDefault;


			return encodeCore(value);
		};

		encode.direct = function(context, value) {
			var encodeCore = getSessionSingleton(context, 'encodeBoolean') || encodeDefault;

			return encodeCore(value);
		};

		return encode;
	}

	function encodeDefault(value) {
		return value;
	}

	newEncode$1 = _new;
	return newEncode$1;
}

var newDecode$1;
var hasRequiredNewDecode$1;

function requireNewDecode$1 () {
	if (hasRequiredNewDecode$1) return newDecode$1;
	hasRequiredNewDecode$1 = 1;
	var purify = requirePurify$1();

	function _new(column) {

		return function(context, value) {
			if (value == column.dbNull)
				return null;
			return purify(value);
		};
	}

	newDecode$1 = _new;
	return newDecode$1;
}

var boolean;
var hasRequiredBoolean;

function requireBoolean () {
	if (hasRequiredBoolean) return boolean;
	hasRequiredBoolean = 1;
	var newEncode = requireNewEncode$1();
	var newDecode = requireNewDecode$1();
	var purify = requirePurify$1();

	function _new(column) {
		column.tsType = 'BooleanColumn';
		column.purify = purify;
		// column.default = false;
		column.lazyDefault = false;
		column.encode = newEncode(column);
		column.decode = newDecode(column);
	}

	boolean = _new;
	return boolean;
}

var purify_1;
var hasRequiredPurify;

function requirePurify () {
	if (hasRequiredPurify) return purify_1;
	hasRequiredPurify = 1;
	function purify(value) {
		if(value == null)
			return null;
		if (isBuffer(value))
			return value.toString('base64');
		else if (typeof value === 'string')
			return value;
		else
			throw new Error('\'' + value + '\'' + ' is not a base64');
	}

	function isBuffer(value) {
		return typeof Buffer !== 'undefined'
			&& typeof Buffer.isBuffer === 'function'
			&& Buffer.isBuffer(value);
	}

	purify_1 = purify;
	return purify_1;
}

var newEncode;
var hasRequiredNewEncode;

function requireNewEncode () {
	if (hasRequiredNewEncode) return newEncode;
	hasRequiredNewEncode = 1;
	var purify = requirePurify();
	var newParam = requireNewParameterized();
	var getSessionSingleton = requireGetSessionSingleton();

	function _new(_column) {

		function encode(context, value) {
			value = purify(value);
			if (value === null)
				return newParam('null');

			var encodeCore = getSessionSingleton(context, 'encodeBinary') || encodeDefault;
			const enc = encodeCore(value);
			return newParam('?', [enc]);
		}
		encode.unsafe = function(context, value) {
			value = purify(value);
			if (value === null)
				return 'null';
			var encodeCore = getSessionSingleton(context, 'encodeBinary') || encodeDefault;
			return encodeCore(value);
		};

		encode.direct = function(context, value) {
			var encodeCore = getSessionSingleton(context, 'encodeBinary') || encodeDefault;
			return encodeCore(value);
		};

		return encode;
	}

	function encodeDefault(base64) {
		if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function')
			return Buffer.from(base64, 'base64');
		if (typeof atob !== 'function')
			throw new Error('Binary columns require Buffer or atob support.');
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++)
			bytes[i] = binary.charCodeAt(i);
		return bytes;
	}

	newEncode = _new;
	return newEncode;
}

var newDecode;
var hasRequiredNewDecode;

function requireNewDecode () {
	if (hasRequiredNewDecode) return newDecode;
	hasRequiredNewDecode = 1;
	var newDecodeCore = requireNewDecodeCore();
	var getSessionSingleton = requireGetSessionSingleton();

	function _new(column) {
		var decodeCore = newDecodeCore(column);

		return function(context, value) {

			var toBase64  = getSessionSingleton(context, 'decodeBinary') || toBase64Default;

			value = decodeCore(context, value);
			if (value === null)
				return value;
			else {
				const ret = toBase64(value);
				return ret;
			}
		};
	}

	function toBase64Default(buffer) {
		return buffer.toString('base64');

	}

	newDecode = _new;
	return newDecode;
}

var binary;
var hasRequiredBinary;

function requireBinary () {
	if (hasRequiredBinary) return binary;
	hasRequiredBinary = 1;
	var newEncode = requireNewEncode();
	var newDecode = requireNewDecode();
	var purify = requirePurify();

	function _new(column) {
		column.tsType = 'BinaryColumn';
		column.purify = purify;
		column.encode = newEncode(column);
		column.decode = newDecode(column);
	}

	binary = _new;
	return binary;
}

var column;
var hasRequiredColumn;

function requireColumn () {
	if (hasRequiredColumn) return column;
	hasRequiredColumn = 1;
	const Ajv = require$$0;

	function defineColumn(column, table) {
		var c = {};

		c.string = function() {
			requireString()(table, column);
			return c;
		};

		c.json = function() {
			requireJson()(column);
			return c;
		};

		c.jsonOf = function() {
			return c.json();
		};

		c.guid = function() {
			requireGuid()(column);
			return c;
		};
		c.uuid = c.guid;

		c.date = function() {
			requireDate()(column);
			return c;
		};

		c.dateWithTimeZone = function() {
			requireDateWithTimeZone()(column);
			return c;
		};

		c.numeric = function() {
			requireNumeric()(column);
			return c;
		};

		c.bigint = function() {
			requireBigint()(column);
			return c;
		};

		c.boolean = function() {
			requireBoolean()(column);
			return c;
		};

		c.binary = function() {
			requireBinary()(column);
			return c;
		};

		c.enum = function(values) {
			let list = values;
			if (Array.isArray(values))
				list = values;
			else if (values && typeof values === 'object') {
				const keys = Object.keys(values);
				const nonNumericKeys = keys.filter((key) => !/^-?\d+$/.test(key));
				list = (nonNumericKeys.length ? nonNumericKeys : keys).map((key) => values[key]);
			}
			else
				throw new Error('enum values must be an array');
			const allowed = new Set(list);
			column.enum = list;
			function validate(value) {
				if (value === undefined || value === null)
					return;
				if (!allowed.has(value)) {
					const formatted = list.map((v) => JSON.stringify(v)).join(', ');
					throw new Error(`Column ${column.alias} must be one of: ${formatted}`);
				}
			}
			return c.validate(validate);
		};

		c.enum2 = function(...values) {
			const list = values.length === 1 && Array.isArray(values[0])
				? values[0]
				: values;
			return c.enum(list);
		};

		c.default = function(value) {
			column.default = value;
			return c;
		};

		c.primary = function() {
			column.isPrimary = true;
			table._primaryColumns.push(column);
			return c;
		};

		c.as = function(alias) {
			var oldAlias = column.alias;
			table._aliases.delete(oldAlias);
			table._aliases.add(alias);
			table[alias] = column;
			column.alias = alias;
			return c;
		};

		c.dbNull = function(value) {
			column.dbNull = value;
			return c;
		};

		c.serializable = function(value) {
			column.serializable = value;
			return c;
		};

		c.notNull = function() {
			column._notNull = true;
			function validate(value) {
				if (value === undefined || value === null) {
					const error =  new Error(`Column ${column.alias} cannot be null or undefined`);
					error.status = 400;
					throw error;
				}
			}

			return c.validate(validate);
		};

		c.notNullExceptInsert = function() {
			column._notNullExceptInsert = true;
			function validate(value, meta) {
				if (meta.isInsert)
					return;
				if (value === undefined || value === null)
					throw new Error(`Column ${column.alias} cannot be null or undefined`);
			}

			return c.validate(validate);
		};

		c.validate = function(value) {
			let previousValue = column.validate;
			if (previousValue)
				column.validate = nestedValidate;
			else
				column.validate = invokeValidate;

			function nestedValidate() {
				try {
					previousValue.apply(null, arguments);
					invokeValidate.apply(null, arguments);
				}
				catch (e) {
					const error = new Error(e.message || e);
					// @ts-ignore
					error.status = 400;
					throw error;
				}
			}

			function invokeValidate(inputValue, meta) {
				value(inputValue, meta);
			}
			return c;
		};

		c.JSONSchema = function(schema, options) {
			let previousValidate = column.validate;
			let ajv = new Ajv(options);
			let validate = ajv.compile(schema);
			column.validate = _validate;

			function _validate() {
				if (previousValidate)
					previousValidate.apply(null, arguments);
				let valid = validate.apply(null, arguments);
				if (!valid) {
					let e = new Error(`Column ${table._dbName}.${column._dbName} violates JSON Schema: ${inspect(validate.errors)}`);
					e.errors = validate.errors;
					e.status = 400;
					throw e;
				}
			}
			return c;
		};

		return c;
	}

	function inspect(obj) {
		return JSON.stringify(obj, null, 2);
	}


	column = defineColumn;
	return column;
}

var newCollection_1;
var hasRequiredNewCollection;

function requireNewCollection () {
	if (hasRequiredNewCollection) return newCollection_1;
	hasRequiredNewCollection = 1;
	function newCollection() {
		var c = {};
		var initialArgs = [];
		for (var i = 0; i < arguments.length; i++) {
			initialArgs.push(arguments[i]);
		}
		var ranges = [initialArgs];

		c.addRange = function(otherCollection) {
			ranges.push(otherCollection);
		};

		c.add = function(element) {
			c.addRange([element]);
		};

		c.toArray = function() {
			var result = [];
			c.forEach(onEach);
			return result;

			function onEach(element) {
				result.push(element);
			}
		};

		c.forEach = function(callback) {
			var index = 0;
			for (var i = 0; i < ranges.length; i++) {
				ranges[i].forEach(onEach);
			}

			function onEach(element) {
				callback(element, index);
				index++;
			}

		};

		Object.defineProperty(c, 'length', {
			enumerable: false,
			get: function() {
				var result = 0;
				for (var i = 0; i < ranges.length; i++) {
					result += ranges[i].length;
				}
				return result;
			},
		});


		return c;
	}

	newCollection_1 = newCollection;
	return newCollection_1;
}

var newQueryContext_1;
var hasRequiredNewQueryContext;

function requireNewQueryContext () {
	if (hasRequiredNewQueryContext) return newQueryContext_1;
	hasRequiredNewQueryContext = 1;
	function newQueryContext() {
		var rows = [];

		var c = {};
		c.rows = rows;

		c.expand = function(relation) {
			rows.forEach(function(row) {
				relation.expand(row);
			});
		};

		c.add = function(row) {
			rows.push(row);
		};

		return c;
	}

	newQueryContext_1 = newQueryContext;
	return newQueryContext_1;
}

var newJoinLeg;
var hasRequiredNewJoinLeg;

function requireNewJoinLeg () {
	if (hasRequiredNewJoinLeg) return newJoinLeg;
	hasRequiredNewJoinLeg = 1;
	var newCollection = requireNewCollection();
	var newQueryContext = requireNewQueryContext();

	function newLeg(relation) {
		var c = {};
		var span = {};
		span.table = relation.childTable;
		span.legs = newCollection();
		span.queryContext = newQueryContext();
		c.span = span;
		c.name = relation.leftAlias;
		c.table = relation.parentTable;
		c.columns = relation.columns;
		c.expand = relation.expand;

		c.accept = function(visitor) {
			return visitor.visitJoin(c);
		};

		return c;
	}

	newJoinLeg = newLeg;
	return newJoinLeg;
}

var tryGetFromCacheById;
var hasRequiredTryGetFromCacheById;

function requireTryGetFromCacheById () {
	if (hasRequiredTryGetFromCacheById) return tryGetFromCacheById;
	hasRequiredTryGetFromCacheById = 1;
	function tryGet(context, table) {
		var fakeRow = {};
		var args = arguments;
		table._primaryColumns.forEach(addPkValue);

		function addPkValue(pkColumn, index){
			fakeRow[pkColumn.alias] = args[index + 2];
		}

		return table._cache.tryGet(context, fakeRow);
	}
	tryGetFromCacheById = tryGet;
	return tryGetFromCacheById;
}

var newPrimaryKeyFilter;
var hasRequiredNewPrimaryKeyFilter;

function requireNewPrimaryKeyFilter () {
	if (hasRequiredNewPrimaryKeyFilter) return newPrimaryKeyFilter;
	hasRequiredNewPrimaryKeyFilter = 1;
	function primaryKeyFilter(context, table) {
		var primaryColumns = table._primaryColumns;
		var key = arguments[2];
		var filter = primaryColumns[0].equal(context, key);
		for (var i = 2; i < primaryColumns.length; i++) {
			key = arguments[i+1];
			var colFilter = primaryColumns[i].equal(context, key);
			filter = filter.and(context, colFilter);
		}
		return filter;
	}

	newPrimaryKeyFilter = primaryKeyFilter;
	return newPrimaryKeyFilter;
}

var newShallowColumnSql;
var hasRequiredNewShallowColumnSql;

function requireNewShallowColumnSql () {
	if (hasRequiredNewShallowColumnSql) return newShallowColumnSql;
	hasRequiredNewShallowColumnSql = 1;
	const getSessionSingleton = requireGetSessionSingleton();

	function _new(context, table, alias, span, ignoreNulls) {
		const quote = getSessionSingleton(context, 'quote');
		const quotedAlias = quote(alias);
		let columnsMap = span.columns;
		var columns = table._columns;
		var sql = '';
		var separator = '';

		for (let i = 0; i < columns.length; i++) {
			var column = columns[i];
			if (!columnsMap || (columnsMap.get(column))) {
				sql = sql + separator + formatColumn(column) + ' as ' + quote('s' + alias + i);
				separator = ',';
			}
			else if (!ignoreNulls) {
				sql = sql + separator + 'null as ' + quote('s' + alias + i);
				separator = ',';
			}
		}

		for (let name in span.aggregates || {}) {
			sql = sql + separator + span.aggregates[name].expression(name);
			separator = ',';
		}

		return sql;

		function formatColumn(column) {
			const formatted = column.formatOut ? column.formatOut(context, quotedAlias) : quotedAlias + '.' + quote(column._dbName);
			if (column.dbNull === null)
				return formatted;
			else {
				const encoded = column.encode.unsafe(context, column.dbNull);
				return `CASE WHEN ${formatted}=${encoded} THEN null ELSE ${formatted} END`;
			}
		}
	}

	newShallowColumnSql = _new;
	return newShallowColumnSql;
}

var sharedJoinUtils;
var hasRequiredSharedJoinUtils;

function requireSharedJoinUtils () {
	if (hasRequiredSharedJoinUtils) return sharedJoinUtils;
	hasRequiredSharedJoinUtils = 1;
	var newShallowColumnSql = requireNewShallowColumnSql();

	function joinLegToColumnSql(context, leg, alias, ignoreNull) {
		var span = leg.span;
		var shallowColumnSql = newShallowColumnSql(context, span.table, alias, span, ignoreNull);
		var joinedColumnSql = newJoinedColumnSql(context, span, alias, ignoreNull);
		return ',' + shallowColumnSql + joinedColumnSql;
	}

	function newJoinedColumnSql(context, span, alias, ignoreNull) {
		var c = {};
		var sql = '';

		c.visitJoin = function(leg) {
			var joinSql = joinLegToColumnSql(context, leg, alias + leg.name, ignoreNull);
			sql = sql + joinSql;
		};

		c.visitOne = function(leg) {
			c.visitJoin(leg);
		};

		c.visitMany = function() {
		};


		span.legs.forEach(onEach);

		function onEach(leg) {
			leg.accept(c);
		}

		return sql;
	}


	sharedJoinUtils = { joinLegToColumnSql, newJoinedColumnSql };
	return sharedJoinUtils;
}

var newJoinedColumnSql_1;
var hasRequiredNewJoinedColumnSql;

function requireNewJoinedColumnSql () {
	if (hasRequiredNewJoinedColumnSql) return newJoinedColumnSql_1;
	hasRequiredNewJoinedColumnSql = 1;
	const { newJoinedColumnSql } = requireSharedJoinUtils();


	newJoinedColumnSql_1 = newJoinedColumnSql;
	return newJoinedColumnSql_1;
}

var newColumnSql;
var hasRequiredNewColumnSql;

function requireNewColumnSql () {
	if (hasRequiredNewColumnSql) return newColumnSql;
	hasRequiredNewColumnSql = 1;
	var newShallowColumnSql = requireNewShallowColumnSql();
	var newJoinedColumnSql = requireNewJoinedColumnSql();

	newColumnSql = function(context,table,span,alias,ignoreNull) {
		var shallowColumnSql = newShallowColumnSql(context,table,alias, span, ignoreNull);
		var joinedColumnSql = newJoinedColumnSql(context, span,alias, ignoreNull);
		return shallowColumnSql + joinedColumnSql;
	};
	return newColumnSql;
}

var newShallowJoinSql;
var hasRequiredNewShallowJoinSql;

function requireNewShallowJoinSql () {
	if (hasRequiredNewShallowJoinSql) return newShallowJoinSql;
	hasRequiredNewShallowJoinSql = 1;
	const newJoinCore = requireNewShallowJoinSqlCore();
	const getSessionSingleton = requireGetSessionSingleton();

	function _new(context, rightTable, leftColumns, rightColumns, leftAlias, rightAlias, filter) {
		const quote = getSessionSingleton(context, 'quote');
		const sql = ' JOIN ' + quote(rightTable._dbName) + ' ' + quote(rightAlias) + ' ON (';
		const joinCore = newJoinCore(context, rightTable, leftColumns, rightColumns, leftAlias, rightAlias, filter);
		return joinCore.prepend(sql).append(')');
	}

	newShallowJoinSql = _new;
	return newShallowJoinSql;
}

var joinLegToShallowJoinSql;
var hasRequiredJoinLegToShallowJoinSql;

function requireJoinLegToShallowJoinSql () {
	if (hasRequiredJoinLegToShallowJoinSql) return joinLegToShallowJoinSql;
	hasRequiredJoinLegToShallowJoinSql = 1;
	var newShallowJoinSql = requireNewShallowJoinSql();

	function toJoinSql(context,leg,alias,childAlias) {
		var columns = leg.columns;
		var childTable = leg.span.table;
		return newShallowJoinSql(context,childTable,columns,childTable._primaryColumns,alias,childAlias,leg.span.where).prepend(' LEFT');
	}

	joinLegToShallowJoinSql = toJoinSql;
	return joinLegToShallowJoinSql;
}

var joinLegToJoinSql;
var hasRequiredJoinLegToJoinSql;

function requireJoinLegToJoinSql () {
	if (hasRequiredJoinLegToJoinSql) return joinLegToJoinSql;
	hasRequiredJoinLegToJoinSql = 1;
	var joinLegToShallowJoinSql = requireJoinLegToShallowJoinSql();

	function toJoinSql(newJoinSql, context,leg,alias,childAlias) {
		return joinLegToShallowJoinSql(context,leg,alias,childAlias).append(newJoinSql(context,leg.span,childAlias));
	}


	joinLegToJoinSql = toJoinSql;
	return joinLegToJoinSql;
}

var oneLegToShallowJoinSql;
var hasRequiredOneLegToShallowJoinSql;

function requireOneLegToShallowJoinSql () {
	if (hasRequiredOneLegToShallowJoinSql) return oneLegToShallowJoinSql;
	hasRequiredOneLegToShallowJoinSql = 1;
	var newShallowJoinSql = requireNewShallowJoinSql();

	function toJoinSql(context,leg,alias,childAlias) {
		var parentTable = leg.table;
		var columns = leg.columns;
		var childTable = leg.span.table;
		return newShallowJoinSql(context,childTable,parentTable._primaryColumns,columns,alias,childAlias, leg.span.where).prepend(' LEFT');
	}

	oneLegToShallowJoinSql = toJoinSql;
	return oneLegToShallowJoinSql;
}

var oneLegToJoinSql;
var hasRequiredOneLegToJoinSql;

function requireOneLegToJoinSql () {
	if (hasRequiredOneLegToJoinSql) return oneLegToJoinSql;
	hasRequiredOneLegToJoinSql = 1;
	var oneLegToShallowJoinSql = requireOneLegToShallowJoinSql();

	function toJoinSql(newJoinSql, context,leg,alias,childAlias) {
		return oneLegToShallowJoinSql(context,leg,alias,childAlias).append(newJoinSql(context,leg.span,childAlias));
	}

	oneLegToJoinSql = toJoinSql;
	return oneLegToJoinSql;
}

var newJoinSql_1;
var hasRequiredNewJoinSql;

function requireNewJoinSql () {
	if (hasRequiredNewJoinSql) return newJoinSql_1;
	hasRequiredNewJoinSql = 1;
	const joinLegToJoinSql = requireJoinLegToJoinSql();
	const oneLegToJoinSql = requireOneLegToJoinSql();
	const newParameterized = requireNewParameterized();

	function newJoinSql(context,span,alias = '') {
		var sql = newParameterized('');
		var childAlias;

		var c = {};
		c.visitJoin = function(leg) {
			sql = joinLegToJoinSql(newJoinSql, context,leg,alias,childAlias).prepend(sql);
		};

		c.visitOne = function(leg) {
			sql = oneLegToJoinSql(newJoinSql, context,leg,alias,childAlias).prepend(sql);
		};

		c.visitMany = function() {};

		function onEachLeg(leg) {
			childAlias = alias + leg.name;
			leg.accept(c);
		}

		span.legs.forEach(onEachLeg);

		const set = new Set();
		for(let key in span.aggregates) {
			const agg = span.aggregates[key];
			for(let join of agg.joins) {
				if (!set.has(join)) {
					sql = sql.append(join);
					set.add(join);
				}
			}
		}

		return sql;
	}

	newJoinSql_1 = newJoinSql;
	return newJoinSql_1;
}

var newWhereSql_1;
var hasRequiredNewWhereSql;

function requireNewWhereSql () {
	if (hasRequiredNewWhereSql) return newWhereSql_1;
	hasRequiredNewWhereSql = 1;
	var newDiscriminatorSql = requireNewDiscriminatorSql$1();
	var newParameterized = requireNewParameterized();

	function newWhereSql(context, table, filter, alias) {
		var separator = ' where';
		var result = newParameterized('');
		var sql = filter.sql();
		var discriminator = newDiscriminatorSql(context, table, alias);
		if (sql) {
			result = filter.prepend(separator + ' ');
			separator = ' AND';
		}
		if (discriminator)
			result = result.append(separator + discriminator);

		return result;
	}

	newWhereSql_1 = newWhereSql;
	return newWhereSql_1;
}

var negotiateLimit_1;
var hasRequiredNegotiateLimit;

function requireNegotiateLimit () {
	if (hasRequiredNegotiateLimit) return negotiateLimit_1;
	hasRequiredNegotiateLimit = 1;
	function negotiateLimit(limit) {
		if(!limit)
			return ' ';

		if(limit.charAt(0) !== ' ')
			return ' ' + limit;
		return limit;
	}

	negotiateLimit_1 = negotiateLimit;
	return negotiateLimit_1;
}

var negotiateExclusive_1;
var hasRequiredNegotiateExclusive;

function requireNegotiateExclusive () {
	if (hasRequiredNegotiateExclusive) return negotiateExclusive_1;
	hasRequiredNegotiateExclusive = 1;
	var getSessionSingleton = requireGetSessionSingleton();

	function negotiateExclusive(context, table, alias, _exclusive) {
		if (table._exclusive || _exclusive) {
			var encode =  getSessionSingleton(context, 'selectForUpdateSql');
			return encode(context, alias);
		}
		return '';
	}

	negotiateExclusive_1 = negotiateExclusive;
	return negotiateExclusive_1;
}

var newSingleQuery$1;
var hasRequiredNewSingleQuery$1;

function requireNewSingleQuery$1 () {
	if (hasRequiredNewSingleQuery$1) return newSingleQuery$1;
	hasRequiredNewSingleQuery$1 = 1;
	var newColumnSql = requireNewColumnSql();
	var newJoinSql = requireNewJoinSql();
	var newWhereSql = requireNewWhereSql();
	var negotiateLimit = requireNegotiateLimit();
	var negotiateExclusive = requireNegotiateExclusive();
	var newParameterized = requireNewParameterized();
	var quote = requireQuote$2();

	function _new(context, table, filter, span, alias, innerJoin, orderBy, limit, offset, exclusive) {

		var name = quote(context, table._dbName);
		var columnSql = newColumnSql(context, table, span, alias);
		var joinSql = newJoinSql(context, span, alias);
		var whereSql = newWhereSql(context, table, filter, alias);
		var safeLimit = negotiateLimit(limit);
		var exclusiveClause = negotiateExclusive(table, alias, exclusive);
		return newParameterized('select' + safeLimit + ' ' + columnSql + ' from ' + name + ' ' + quote(context, alias))
			.append(innerJoin)
			.append(joinSql)
			.append(whereSql)
			.append(orderBy + offset + exclusiveClause);
	}

	newSingleQuery$1 = _new;
	return newSingleQuery$1;
}

var extractFilter;
var hasRequiredExtractFilter;

function requireExtractFilter () {
	if (hasRequiredExtractFilter) return extractFilter;
	hasRequiredExtractFilter = 1;
	var emptyFilter = requireEmptyFilter();

	function extract(filter) {
		if (filter)
			return filter;
		return emptyFilter;
	}

	extractFilter = extract;
	return extractFilter;
}

var extractOrderBy_1;
var hasRequiredExtractOrderBy;

function requireExtractOrderBy () {
	if (hasRequiredExtractOrderBy) return extractOrderBy_1;
	hasRequiredExtractOrderBy = 1;
	const getSessionSingleton = requireGetSessionSingleton();

	function extractOrderBy(context, table, alias, orderBy, originalOrderBy) {
		const quote = getSessionSingleton(context, 'quote');
		alias = quote(alias);
		var dbNames = [];
		var i;
		if (orderBy) {
			if (typeof orderBy === 'string')
				orderBy = [orderBy];
			for (i = 0; i < orderBy.length; i++) {
				var nameAndDirection = extractNameAndDirection(orderBy[i]);
				pushColumn(nameAndDirection.name, nameAndDirection.direction);
			}
		} else {
			if(originalOrderBy)
				return originalOrderBy;

			for (i = 0; i < table._primaryColumns.length; i++) {
				pushColumn(table._primaryColumns[i].alias);
			}
		}

		function extractNameAndDirection(orderBy) {
			var elements = orderBy.split(' ');
			var direction = '';
			if (elements.length > 1) {
				direction = ' ' + elements[1];
			}
			return {
				name: elements[0],
				direction: direction
			};
		}
		function pushColumn(property, direction) {
			direction = direction || '';
			var column = getTableColumn(property);
			var jsonQuery = getJsonQuery(property, column.alias);

			dbNames.push(alias + '.' + quote(column._dbName) + jsonQuery + direction);
		}

		function getTableColumn(property) {
			var column = table[property] || table[property.split(/(-|#)>+/g)[0]];
			if(!column){
				throw new Error(`Unable to get column on orderBy '${property}'. If jsonb query, only #>, #>>, -> and ->> allowed. Only use ' ' to seperate between query and direction. Does currently not support casting.`);
			}
			return column;
		}
		function getJsonQuery(property, column) {
			let containsJson = (/(-|#)>+/g).test(property);
			if(!containsJson){
				return '';
			}
			return property.replace(column, '');
		}

		return ' order by ' + dbNames.join(',');
	}

	extractOrderBy_1 = extractOrderBy;
	return extractOrderBy_1;
}

var extractLimit_1;
var hasRequiredExtractLimit;

function requireExtractLimit () {
	if (hasRequiredExtractLimit) return extractLimit_1;
	hasRequiredExtractLimit = 1;
	var getSessionContext = requireGetSessionContext();

	function extractLimit(context, span) {
		let limit = getSessionContext(context).limit;
		if (limit)
			return limit(span);
		else
			return '';
	}

	extractLimit_1 = extractLimit;
	return extractLimit_1;
}

var extractOffset_1;
var hasRequiredExtractOffset;

function requireExtractOffset () {
	if (hasRequiredExtractOffset) return extractOffset_1;
	hasRequiredExtractOffset = 1;
	var getSessionContext = requireGetSessionContext();

	function extractOffset(context, span) {
		let {limitAndOffset} = getSessionContext(context);
		if (limitAndOffset)
			return limitAndOffset(span);
		else
			return '';
	}

	extractOffset_1 = extractOffset;
	return extractOffset_1;
}

var newQuery_1$2;
var hasRequiredNewQuery$2;

function requireNewQuery$2 () {
	if (hasRequiredNewQuery$2) return newQuery_1$2;
	hasRequiredNewQuery$2 = 1;
	var newSingleQuery = requireNewSingleQuery$1();
	var extractFilter = requireExtractFilter();
	var extractOrderBy = requireExtractOrderBy();
	var extractLimit = requireExtractLimit();
	var extractOffset = requireExtractOffset();

	function newQuery(context, queries,table,filter,span,alias,innerJoin,orderBy,exclusive) {
		filter = extractFilter(filter);
		orderBy = extractOrderBy(context, table,alias,span.orderBy,orderBy);
		var limit = extractLimit(context, span);
		var offset = extractOffset(context, span);
		var singleQuery = newSingleQuery(context, table,filter,span,alias,innerJoin,orderBy,limit,offset,exclusive);
		queries.push(singleQuery);

		return queries;
	}

	newQuery_1$2 = newQuery;
	return newQuery_1$2;
}

var negotiateQueryContext_1;
var hasRequiredNegotiateQueryContext;

function requireNegotiateQueryContext () {
	if (hasRequiredNegotiateQueryContext) return negotiateQueryContext_1;
	hasRequiredNegotiateQueryContext = 1;
	function negotiateQueryContext(queryContext, row) {
		if (queryContext)
			queryContext.add(row);
	}

	negotiateQueryContext_1 = negotiateQueryContext;
	return negotiateQueryContext_1;
}

var isJsonUpdateSupported_1;
var hasRequiredIsJsonUpdateSupported;

function requireIsJsonUpdateSupported () {
	if (hasRequiredIsJsonUpdateSupported) return isJsonUpdateSupported_1;
	hasRequiredIsJsonUpdateSupported = 1;
	function isJsonUpdateSupported(engine) {
		return engine === 'pg' || engine === 'mysql' || engine === 'mariadb' || engine === 'sqlite' || engine === 'mssql' || engine === 'mssqlNative' || engine === 'oracle';
	}

	isJsonUpdateSupported_1 = isJsonUpdateSupported;
	return isJsonUpdateSupported_1;
}

var newUpdateCommandCore_1;
var hasRequiredNewUpdateCommandCore;

function requireNewUpdateCommandCore () {
	if (hasRequiredNewUpdateCommandCore) return newUpdateCommandCore_1;
	hasRequiredNewUpdateCommandCore = 1;
	const getSessionSingleton = requireGetSessionSingleton();
	var newParameterized = requireNewParameterized();
	const isJsonUpdateSupported = requireIsJsonUpdateSupported();

	function newUpdateCommandCore(context, table, columns, row, concurrencyState) {
		const quote = getSessionSingleton(context, 'quote');
		const engine = getSessionSingleton(context, 'engine');
		var command = newParameterized('UPDATE ' + quote(table._dbName) + ' SET');
		var separator = ' ';

		addColumns();
		addWhereId();
		addDiscriminators();
		addConcurrencyChecks();

		function addColumns() {
			for (var alias in columns) {
				var column = columns[alias];
				const columnSql = quote(column._dbName);
				const jsonUpdate = row._jsonUpdateState && row._jsonUpdateState[alias];
				if (jsonUpdate && jsonUpdate.patches && jsonUpdate.patches.length) {
					const updated = buildJsonUpdateExpression(columnSql, jsonUpdate.patches, column);
					command = command.append(separator + columnSql + '=').append(updated);
				}
				else {
					var encoded = column.encode(context, row[alias]);
					command = command.append(separator + columnSql + '=').append(encoded);
				}
				separator = ',';
			}
		}

		function addWhereId() {
			separator = ' WHERE ';
			var columns = table._primaryColumns;
			for (var i = 0; i < columns.length; i++) {
				var column = columns[i];
				var value = row[column.alias];
				var encoded = column.encode(context, value);
				command = command.append(separator + quote(column._dbName) + '=').append(encoded);
				separator = ' AND ';
			}
		}

		function addDiscriminators() {
			var discriminators = table._columnDiscriminators;
			if (discriminators.length === 0)
				return;
			discriminators = separator + discriminators.join(' AND ');
			command = command.append(discriminators);
		}

		function addConcurrencyChecks() {
			const columnsState = concurrencyState && concurrencyState.columns;
			if (!columnsState)
				return;
			for (let alias in columnsState) {
				const state = columnsState[alias];
				if (!state || state.concurrency === 'overwrite')
					continue;
				const column = table[alias];
				if (!column)
					continue;
				if (state.paths && state.paths.length) {
					for (let i = 0; i < state.paths.length; i++) {
						const pathState = state.paths[i];
						const encoded = encodeJsonValue(pathState.oldValue, column);
						const jsonPath = buildJsonPath(pathState.path);
						const columnExpr = buildJsonExtractExpression(quote(column._dbName), jsonPath, pathState.oldValue);
						command = appendJsonPathComparison(columnExpr, encoded);
					}
				}
				else {
					const encoded = (engine === 'mysql' && column.tsType === 'JSONColumn')
						? encodeJsonValue(state.oldValue, column)
						: column.encode(context, state.oldValue);
					command = appendNullSafeComparison(column, encoded);
				}
			}
		}

		function appendNullSafeComparison(column, encoded) {
			const columnSql = quote(column._dbName);
			if (engine === 'pg') {
				command = command.append(separator + columnSql + ' IS NOT DISTINCT FROM ').append(encoded);
			}
			else if (engine === 'mysql' || engine === 'mariadb') {
				command = command.append(separator + columnSql + ' <=> ').append(encoded);
			}
			else if (engine === 'sqlite') {
				command = command.append(separator + columnSql + ' IS ').append(encoded);
			}
			else if (engine === 'sap' && column.tsType === 'DateColumn') {
				if (encoded.sql() === 'null') {
					command = command.append(separator + columnSql + ' IS NULL');
				}
				else {
					command = command.append(separator + column.formatOut(context) + '=').append(encoded);
				}
			}
			else if (engine === 'sap' && column.tsType === 'JSONColumn') {
				if (encoded.sql() === 'null') {
					command = command.append(separator + columnSql + ' IS NULL');
				}
				else {
					const casted = newParameterized('CONVERT(VARCHAR(16384), ' + encoded.sql() + ')', encoded.parameters);
					command = command.append(separator + 'CONVERT(VARCHAR(16384), ' + columnSql + ')=') .append(casted);
				}
			}
			else if (engine === 'oracle' && column.tsType === 'JSONColumn') {
				if (encoded.sql() === 'null') {
					command = command.append(separator + columnSql + ' IS NULL');
				}
				else {
					const jsonValue = newParameterized('JSON(' + encoded.sql() + ')', encoded.parameters);
					const compare = newParameterized('JSON_EQUAL(' + columnSql + ', ' + jsonValue.sql() + ')', jsonValue.parameters);
					command = command.append(separator).append(compare);
				}
			}
			else {
				if (encoded.sql() === 'null')
					command = command.append(separator + columnSql + ' IS NULL');
				else
					command = command.append(separator + columnSql + '=').append(encoded);
			}
			separator = ' AND ';
			return command;
		}

		function appendJsonPathComparison(columnExpr, encoded) {
			if (engine === 'pg') {
				command = command.append(separator).append(columnExpr).append(' IS NOT DISTINCT FROM ').append(encoded);
			}
			else if (engine === 'mysql' || engine === 'mariadb') {
				command = command.append(separator).append(columnExpr).append(' <=> ').append(encoded);
			}
			else if (engine === 'sqlite') {
				command = command.append(separator).append(columnExpr).append(' IS ').append(encoded);
			}
			else if (engine === 'oracle') {
				const isJsonQuery = columnExpr.sql().indexOf('JSON_QUERY(') === 0;
				if (encoded.sql() === 'null') {
					command = command.append(separator).append(columnExpr).append(' IS NULL');
				}
				else if (isJsonQuery) {
					const jsonValue = newParameterized('JSON(' + encoded.sql() + ')', encoded.parameters);
					const compare = newParameterized('JSON_EQUAL(' + columnExpr.sql() + ', ' + jsonValue.sql() + ')', columnExpr.parameters.concat(jsonValue.parameters));
					command = command.append(separator).append(compare);
				}
				else {
					command = command.append(separator).append(columnExpr).append('=').append(encoded);
				}
			}
			else {
				if (encoded.sql() === 'null')
					command = command.append(separator).append(columnExpr).append(' IS NULL');
				else
					command = command.append(separator).append(columnExpr).append('=').append(encoded);
			}
			separator = ' AND ';
			return command;
		}

		function buildJsonUpdateExpression(columnSql, patches, column) {
			if (!isJsonUpdateSupported(engine))
				return column.encode(context, row[column.alias]);
			let expr = newParameterized(columnSql);
			for (let i = 0; i < patches.length; i++) {
				const patch = patches[i];
				expr = applyJsonPatchExpression(expr, patch, column);
			}
			return expr;
		}

		function applyJsonPatchExpression(expr, patch, column) {
			const path = patch.path || [];
			const jsonPath = buildJsonPath(path);
			if (patch.op === 'remove')
				return buildJsonRemoveExpression(expr, jsonPath);
			return buildJsonSetExpression(expr, jsonPath, patch.value, column);
		}

		function buildJsonSetExpression(expr, jsonPath, value, column) {
			if (engine === 'pg') {
				const pathLiteral = buildPgPathLiteral(jsonPath.tokens);
				const jsonValue = JSON.stringify(value === undefined ? null : value);
				const sql = 'jsonb_set(' + expr.sql() + ', ' + pathLiteral + ', ?::jsonb, true)';
				return newParameterized(sql, expr.parameters.concat([jsonValue]));
			}
			if (engine === 'mysql') {
				const jsonValue = JSON.stringify(value === undefined ? null : value);
				const sql = 'JSON_SET(' + expr.sql() + ', ' + jsonPath.sql + ', CAST(? AS JSON))';
				return newParameterized(sql, expr.parameters.concat(jsonPath.parameters, [jsonValue]));
			}
			if (engine === 'mariadb') {
				const jsonValue = JSON.stringify(value === undefined ? null : value);
				const sql = 'JSON_SET(' + expr.sql() + ', ' + jsonPath.sql + ', JSON_EXTRACT(?, \'$\'))';
				return newParameterized(sql, expr.parameters.concat(jsonPath.parameters, [jsonValue]));
			}
			if (engine === 'sqlite') {
				const jsonValue = JSON.stringify(value === undefined ? null : value);
				const sql = 'json_set(' + expr.sql() + ', ' + jsonPath.sql + ', json(?))';
				return newParameterized(sql, expr.parameters.concat(jsonPath.parameters, [jsonValue]));
			}
			if (engine === 'mssql' || engine === 'mssqlNative') {
				const mssqlValue = buildMssqlJsonValue(value);
				const sql = 'JSON_MODIFY(' + expr.sql() + ', ' + jsonPath.sql + ', ' + mssqlValue.sql() + ')';
				return newParameterized(sql, expr.parameters.concat(jsonPath.parameters, mssqlValue.parameters));
			}
			if (engine === 'oracle') {
				const jsonValue = JSON.stringify(value === undefined ? null : value);
				const sql = 'JSON_TRANSFORM(' + expr.sql() + ', SET ' + jsonPath.sql + ' = JSON(?))';
				return newParameterized(sql, expr.parameters.concat(jsonPath.parameters, [jsonValue]));
			}
			return column.encode(context, row[column.alias]);
		}

		function buildJsonRemoveExpression(expr, jsonPath) {
			if (engine === 'pg') {
				const pathLiteral = buildPgPathLiteral(jsonPath.tokens);
				const sql = expr.sql() + ' #- ' + pathLiteral;
				return newParameterized(sql, expr.parameters);
			}
			if (engine === 'mysql' || engine === 'mariadb') {
				const sql = 'JSON_REMOVE(' + expr.sql() + ', ' + jsonPath.sql + ')';
				return newParameterized(sql, expr.parameters.concat(jsonPath.parameters));
			}
			if (engine === 'sqlite') {
				const sql = 'json_remove(' + expr.sql() + ', ' + jsonPath.sql + ')';
				return newParameterized(sql, expr.parameters.concat(jsonPath.parameters));
			}
			if (engine === 'mssql' || engine === 'mssqlNative') {
				const sql = 'JSON_MODIFY(' + expr.sql() + ', ' + jsonPath.sql + ', NULL)';
				return newParameterized(sql, expr.parameters.concat(jsonPath.parameters));
			}
			if (engine === 'oracle') {
				const sql = 'JSON_TRANSFORM(' + expr.sql() + ', REMOVE ' + jsonPath.sql + ')';
				return newParameterized(sql, expr.parameters.concat(jsonPath.parameters));
			}
			return expr;
		}

		function buildJsonExtractExpression(columnSql, jsonPath, oldValue) {
			if (engine === 'pg') {
				const sql = columnSql + ' #> ' + buildPgPathLiteral(jsonPath.tokens);
				return newParameterized(sql);
			}
			if (engine === 'mysql') {
				const sql = 'JSON_EXTRACT(' + columnSql + ', ' + jsonPath.sql + ')';
				return newParameterized(sql, jsonPath.parameters);
			}
			if (engine === 'mariadb') {
				const sql = isJsonObject(oldValue)
					? 'JSON_EXTRACT(' + columnSql + ', ' + jsonPath.sql + ')'
					: 'JSON_UNQUOTE(JSON_EXTRACT(' + columnSql + ', ' + jsonPath.sql + '))';
				return newParameterized(sql, jsonPath.parameters);
			}
			if (engine === 'sqlite') {
				const sql = 'json_extract(' + columnSql + ', ' + jsonPath.sql + ')';
				return newParameterized(sql, jsonPath.parameters);
			}
			if (engine === 'mssql' || engine === 'mssqlNative') {
				const fn = isJsonObject(oldValue) ? 'JSON_QUERY' : 'JSON_VALUE';
				const sql = fn + '(' + columnSql + ', ' + jsonPath.sql + ')';
				return newParameterized(sql, jsonPath.parameters);
			}
			if (engine === 'oracle') {
				const fn = isJsonObject(oldValue) ? 'JSON_QUERY' : 'JSON_VALUE';
				const sql = fn + '(' + columnSql + ', ' + jsonPath.sql + ')';
				return newParameterized(sql, jsonPath.parameters);
			}
			return newParameterized(columnSql);
		}

		function buildJsonPath(pathTokens) {
			const tokens = Array.isArray(pathTokens) ? pathTokens : [];
			if (engine === 'pg')
				return { tokens, sql: buildPgPathLiteral(tokens), parameters: [] };
			if (engine === 'oracle') {
				let jsonPath = '$';
				for (let i = 0; i < tokens.length; i++) {
					const token = String(tokens[i]);
					if (/^\d+$/.test(token))
						jsonPath += '[' + token + ']';
					else if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(token))
						jsonPath += '.' + token;
					else
						jsonPath += '["' + token.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"]';
				}
				return { tokens, sql: '\'' + jsonPath.replace(/'/g, '\'\'') + '\'', parameters: [] };
			}
			let jsonPath = '$';
			for (let i = 0; i < tokens.length; i++) {
				const token = String(tokens[i]);
				if (/^\d+$/.test(token))
					jsonPath += '[' + token + ']';
				else if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(token))
					jsonPath += '.' + token;
				else
					jsonPath += '["' + token.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"]';
			}
			return { tokens, sql: '?', parameters: [jsonPath] };
		}

		function buildPgPathLiteral(tokens) {
			const parts = tokens.map(token => {
				const text = String(token);
				if (/^[A-Za-z0-9_]+$/.test(text))
					return text;
				return '"' + text.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
			});
			return '\'{'+ parts.join(',') + '}\'';
		}

		function encodeJsonValue(value, column) {
			if (engine === 'oracle') {
				if (value === null || value === undefined)
					return newParameterized('null');
				if (isJsonObject(value))
					return column.encode(context, value);
				if (typeof value === 'boolean' || typeof value === 'number')
					return newParameterized('?', [String(value)]);
				return newParameterized('?', [value]);
			}
			if (engine === 'pg') {
				const jsonValue = JSON.stringify(value === undefined ? null : value);
				return newParameterized('?::jsonb', [jsonValue]);
			}
			if (engine === 'mysql') {
				const jsonValue = JSON.stringify(value === undefined ? null : value);
				return newParameterized('CAST(? AS JSON)', [jsonValue]);
			}
			if (engine === 'mariadb') {
				if (isJsonObject(value)) {
					const jsonValue = JSON.stringify(value);
					return newParameterized('JSON_EXTRACT(?, \'$\')', [jsonValue]);
				}
				if (value === null || value === undefined)
					return newParameterized('null');
				return newParameterized('?', [String(value)]);
			}
			if (engine === 'sqlite') {
				if (isJsonObject(value)) {
					const jsonValue = JSON.stringify(value);
					return newParameterized('?', [jsonValue]);
				}
				if (value === null || value === undefined)
					return newParameterized('null');
				return newParameterized('?', [value]);
			}
			if (engine === 'mssql' || engine === 'mssqlNative') {
				if (isJsonObject(value))
					return newParameterized('JSON_QUERY(?)', [JSON.stringify(value)]);
				if (value === null || value === undefined)
					return newParameterized('null');
				return newParameterized('?', [String(value)]);
			}
			return column.encode(context, value);
		}

		function buildMssqlJsonValue(value) {
			if (isJsonObject(value))
				return newParameterized('JSON_QUERY(?)', [JSON.stringify(value)]);
			if (value === null || value === undefined)
				return newParameterized('null');
			return newParameterized('?', [value]);
		}

		function isJsonObject(value) {
			return value && typeof value === 'object';
		}

		return command;


	}

	newUpdateCommandCore_1 = newUpdateCommandCore;
	return newUpdateCommandCore_1;
}

var newImmutable_1;
var hasRequiredNewImmutable;

function requireNewImmutable () {
	if (hasRequiredNewImmutable) return newImmutable_1;
	hasRequiredNewImmutable = 1;
	function newImmutable(fn) {
		var result;
		var _run = runFirst;
		return run;

		function run() {
			return _run([...arguments]);
		}

		function runFirst(args) {
			result =  fn.apply(null, args);
			_run = runNIgnoreArgs;
			return result;
		}

		function runNIgnoreArgs() {
			return result;
		}
	}

	newImmutable_1 = newImmutable;
	return newImmutable_1;
}

var newObject_1;
var hasRequiredNewObject;

function requireNewObject () {
	if (hasRequiredNewObject) return newObject_1;
	hasRequiredNewObject = 1;
	function newObject() {
		return {};
	}

	newObject_1 = newObject;
	return newObject_1;
}

var createDto;
var hasRequiredCreateDto;

function requireCreateDto () {
	if (hasRequiredCreateDto) return createDto;
	hasRequiredCreateDto = 1;
	let flags = requireFlags();

	function _createDto(table, row) {
		var dto = {};
		flags.useProxy = false;
		for (let name in row) {
			let column = table[name];
			if (table._aliases.has(name)) {
				if (column.toDto)
					dto[name] = column.toDto(row[name]);
				else
					dto[name] = row[name];
			}
		}

		flags.useProxy = true;
		return dto;
	}

	createDto = _createDto;
	return createDto;
}

var newConcurrencyConflictError_1;
var hasRequiredNewConcurrencyConflictError;

function requireNewConcurrencyConflictError () {
	if (hasRequiredNewConcurrencyConflictError) return newConcurrencyConflictError_1;
	hasRequiredNewConcurrencyConflictError = 1;
	function newConcurrencyConflictError() {
		const error = new Error('The row was changed by another user.');
		error.status = 409;
		return error;
	}

	newConcurrencyConflictError_1 = newConcurrencyConflictError;
	return newConcurrencyConflictError_1;
}

var newUpdateCommand_1;
var hasRequiredNewUpdateCommand;

function requireNewUpdateCommand () {
	if (hasRequiredNewUpdateCommand) return newUpdateCommand_1;
	hasRequiredNewUpdateCommand = 1;
	let newUpdateCommandCore = requireNewUpdateCommandCore();
	let newImmutable = requireNewImmutable();
	let newColumnList = requireNewObject();
	var createPatch = requireCreatePatch();
	let createDto = requireCreateDto();
	let newConcurrencyConflictError = requireNewConcurrencyConflictError();

	function newUpdateCommand(context, table, column, row) {
		return new UpdateCommand(context, table, column, row);
	}

	function UpdateCommand(context, table, column, row) {
		this._table = table;
		this._row = row;
		this.__getCoreCommand = newImmutable(newUpdateCommandCore.bind(null, context));
		this._columnList = newColumnList();
		this._columnList[column.alias] = column;
		this.onFieldChanged = this.onFieldChanged.bind(this);
		row.subscribeChanged(this.onFieldChanged);
		this._concurrencyState = undefined;
		this._concurrencySummary = undefined;
		this._usesReturning = false;
	}

	UpdateCommand.prototype.onFieldChanged = function(_row, column) {
		this._columnList[column.alias] = column;
	};

	UpdateCommand.prototype.sql = function() {
		return this._getCoreCommand().sql();
	};

	Object.defineProperty(UpdateCommand.prototype, 'parameters', {
		get: function() {
			return this._getCoreCommand().parameters;
		}
	});

	UpdateCommand.prototype._getCoreCommand = function() {
		return this.__getCoreCommand(this._table, this._columnList, this._row, this._concurrencyState);
	};

	UpdateCommand.prototype.endEdit = function() {
		this._concurrencyState = this._row._concurrencyState;
		delete this._row._concurrencyState;

		const coreCommand = this._getCoreCommand();
		delete this._row._jsonUpdateState;
		this._usesReturning = Boolean(coreCommand._usesReturning);
		this._concurrencySummary = summarizeConcurrency(this._concurrencyState);
		if (this._concurrencySummary.hasConcurrency)
			this.onResult = this._onConcurrencyResult.bind(this);

		this._row.unsubscribeChanged(this.onFieldChanged);
		let dto = JSON.parse(JSON.stringify(createDto(this._table, this._row)));
		this._patch = createPatch([JSON.parse(this._row._oldValues)],[dto]);
		this._row._oldValues = JSON.stringify(dto);
	};

	UpdateCommand.prototype.emitChanged = function() {
		return this._table._emitChanged({row: this._row, patch: this._patch});
	};

	UpdateCommand.prototype.matches = function(otherRow) {
		return this._row === otherRow;
	};

	Object.defineProperty(UpdateCommand.prototype, 'disallowCompress', {
		get: function() {
			return this._table._emitChanged.callbacks.length > 0;

		}
	});

	UpdateCommand.prototype._onConcurrencyResult = function(result) {
		const rowCount = extractRowCount(result, this._usesReturning);
		if (rowCount === undefined)
			return;
		if (rowCount === 0 && this._concurrencySummary.hasOptimistic) {
			throw newConcurrencyConflictError();
		}
	};

	function summarizeConcurrency(concurrencyState) {
		const summary = { hasConcurrency: false, hasOptimistic: false };
		if (!concurrencyState || !concurrencyState.columns)
			return summary;
		for (let name in concurrencyState.columns) {
			const state = concurrencyState.columns[name];
			if (!state)
				continue;
			const strategy = state.concurrency || 'optimistic';
			if (strategy === 'overwrite')
				continue;
			summary.hasConcurrency = true;
			if (strategy === 'optimistic')
				summary.hasOptimistic = true;
		}
		return summary;
	}

	function extractRowCount(result, usesReturning) {
		if (usesReturning && Array.isArray(result))
			return result.length;
		if (Array.isArray(result) && typeof result[0].rowsAffected === 'number')
			return result[0].rowsAffected;
		if (!result || typeof result !== 'object')
			return;
		if (typeof result.rowsAffected === 'number')
			return result.rowsAffected;
	}

	newUpdateCommand_1 = newUpdateCommand;
	return newUpdateCommand_1;
}

var negotiateEndEdit_1;
var hasRequiredNegotiateEndEdit;

function requireNegotiateEndEdit () {
	if (hasRequiredNegotiateEndEdit) return negotiateEndEdit_1;
	hasRequiredNegotiateEndEdit = 1;
	function negotiateEndEdit(changes) {
		var last = changes[changes.length - 1];
		if (last && last.endEdit)
			last.endEdit();
	}

	negotiateEndEdit_1 = negotiateEndEdit;
	return negotiateEndEdit_1;
}

var pushCommand_1;
var hasRequiredPushCommand;

function requirePushCommand () {
	if (hasRequiredPushCommand) return pushCommand_1;
	hasRequiredPushCommand = 1;
	var getChangeSet = requireGetChangeSet();
	var negotiateEndEdit = requireNegotiateEndEdit();

	function pushCommand(context, command) {
		var changes = getChangeSet(context);
		negotiateEndEdit(changes);
		changes.push(command);
	}

	pushCommand_1 = pushCommand;
	return pushCommand_1;
}

var lastCommandMatches_1;
var hasRequiredLastCommandMatches;

function requireLastCommandMatches () {
	if (hasRequiredLastCommandMatches) return lastCommandMatches_1;
	hasRequiredLastCommandMatches = 1;
	var getChangeSet = requireGetChangeSet();

	function lastCommandMatches(context, row) {
		var changeSet = getChangeSet(context);
		var lastIndex = changeSet.length-1;
		if (lastIndex >= 0 && changeSet[lastIndex].matches)
			return changeSet[lastIndex].matches(row);
		return false;
	}

	lastCommandMatches_1 = lastCommandMatches;
	return lastCommandMatches_1;
}

var updateField_1;
var hasRequiredUpdateField;

function requireUpdateField () {
	if (hasRequiredUpdateField) return updateField_1;
	hasRequiredUpdateField = 1;
	var newUpdateCommand = requireNewUpdateCommand();
	var pushCommand = requirePushCommand();
	var lastCommandMatches = requireLastCommandMatches();

	function updateField(context, table, column, row) {
		if (lastCommandMatches(context, row))
			return;
		var command = newUpdateCommand(context, table, column, row);
		pushCommand(context, command);
	}

	updateField_1 = updateField;
	return updateField_1;
}

var emitEvent_1;
var hasRequiredEmitEvent;

function requireEmitEvent () {
	if (hasRequiredEmitEvent) return emitEvent_1;
	hasRequiredEmitEvent = 1;
	function emitEvent() {
		var callbacks = [];
		var emit = function() {

			var copy = callbacks.slice(0, callbacks.length);
			var result = [];
			for (var i = 0; i < copy.length; i++) {
				var callback = copy[i];
				result.push(callback.apply(null, arguments));
			}
			return result;
		};

		emit.add = function(callback) {
			if (!callback)
				throw new Error('missing callback');
			callbacks.push(callback);
		};

		emit.tryAdd = function(callback) {
			if (callback)
				emit.add(callback);
		};

		emit.remove = function(callback) {
			for (var i = 0; i < callbacks.length; i++) {
				if (callbacks[i] === callback) {
					callbacks.splice(i, 1);
					return;
				}
			}
		};

		emit.tryRemove = function(callback) {
			if (callback)
				emit.remove(callback);
		};

		emit.clear = function() {
			callbacks.splice(0, callbacks.length);
		};

		emit.callbacks = callbacks;

		return emit;
	}

	emitEvent_1 = emitEvent;
	return emitEvent_1;
}

var extractStrategy_1;
var hasRequiredExtractStrategy$1;

function requireExtractStrategy$1 () {
	if (hasRequiredExtractStrategy$1) return extractStrategy_1;
	hasRequiredExtractStrategy$1 = 1;
	//either..
	//strategy, table
	//or..
	//table
	function extractStrategy(_strategyOrTable, _optinonalTable) {
		let table;
		if (arguments.length === 2 && _strategyOrTable !== undefined)
			return arguments[0];
		else if (arguments.length === 2)
			table = arguments[1];
		else
			table = arguments[0];

		let strategy = {};
		let relations = table._relations;
		let relationName;

		let visitor = {};
		visitor.visitJoin = function() { };

		visitor.visitMany = function(relation) {
			strategy[relationName] = extractStrategy(relation.childTable);
		};

		visitor.visitOne = visitor.visitMany;

		for (relationName in relations) {
			let relation = relations[relationName];
			relation.accept(visitor);
		}
		return strategy;
	}


	extractStrategy_1 = extractStrategy;
	return extractStrategy_1;
}

var extractDeleteStrategy_1;
var hasRequiredExtractDeleteStrategy;

function requireExtractDeleteStrategy () {
	if (hasRequiredExtractDeleteStrategy) return extractDeleteStrategy_1;
	hasRequiredExtractDeleteStrategy = 1;
	var emptyStrategy = requireNewObject()();

	function extractDeleteStrategy(strategy) {
		if (strategy)
			return strategy;
		return emptyStrategy;
	}

	extractDeleteStrategy_1 = extractDeleteStrategy;
	return extractDeleteStrategy_1;
}

var newCascadeDeleteStrategy_1;
var hasRequiredNewCascadeDeleteStrategy;

function requireNewCascadeDeleteStrategy () {
	if (hasRequiredNewCascadeDeleteStrategy) return newCascadeDeleteStrategy_1;
	hasRequiredNewCascadeDeleteStrategy = 1;
	var newObject = requireNewObject();

	function newCascadeDeleteStrategy(strategy, table) {
		var relations = table._relations;
		var relationName;

		var c = {};
		c.visitJoin = function(){};
		c.visitOne = function(relation) {
			var subStrategy = newObject();
			strategy[relationName] = subStrategy;
			newCascadeDeleteStrategy(subStrategy, relation.childTable);
		};

		c.visitMany = c.visitOne;

		for(relationName in relations) {
			var relation = relations[relationName];
			relation.accept(c);
		}
		return strategy;
	}

	newCascadeDeleteStrategy_1 = newCascadeDeleteStrategy;
	return newCascadeDeleteStrategy_1;
}

var removeFromCache_1;
var hasRequiredRemoveFromCache;

function requireRemoveFromCache () {
	if (hasRequiredRemoveFromCache) return removeFromCache_1;
	hasRequiredRemoveFromCache = 1;
	function removeFromCache(context, row, strategy, table) {
		if (Array.isArray(row)) {
			removeManyRows();
			return;
		}
		if (row)
			removeSingleRow();

		function removeManyRows() {
			row.forEach( function(rowToRemove) {
				removeFromCache(context, rowToRemove, strategy, table);
			});
		}

		function removeSingleRow() {
			var relations = table._relations;
			for (var relationName in strategy) {
				var relation = relations[relationName];
				var rows = relation.getRowsSync(row);
				removeFromCache(context, rows, strategy[relationName], relation.childTable);
			}
			table._cache.tryRemove(context, row);
		}
	}

	removeFromCache_1 = removeFromCache;
	return removeFromCache_1;
}

var selectSql$1;
var hasRequiredSelectSql$1;

function requireSelectSql$1 () {
	if (hasRequiredSelectSql$1) return selectSql$1;
	hasRequiredSelectSql$1 = 1;
	const newParameterized = requireNewParameterized();
	const newBoolean = requireNewBoolean();
	const quote = requireQuote$2();

	function newSelectSql(context, table, alias) {
		const colName = quote(context, table._primaryColumns[0]._dbName);
		alias = quote(context, alias);
		let sql = 'SELECT ' + alias + '.' + colName + ' FROM ' + quote(context, table._dbName) + ' ' + alias;
		sql = newParameterized(sql);
		return newBoolean(sql);
	}

	selectSql$1 = newSelectSql;
	return selectSql$1;
}

var createAlias_1;
var hasRequiredCreateAlias;

function requireCreateAlias () {
	if (hasRequiredCreateAlias) return createAlias_1;
	hasRequiredCreateAlias = 1;
	function createAlias(table, depth) {
		if (depth === 0)
			return table._dbName;
		return 'x' + depth;
	}
	createAlias_1 = createAlias;
	return createAlias_1;
}

var joinSql$1;
var hasRequiredJoinSql$1;

function requireJoinSql$1 () {
	if (hasRequiredJoinSql$1) return joinSql$1;
	hasRequiredJoinSql$1 = 1;
	const newShallowJoinSql = requireNewShallowJoinSql();
	const createAlias = requireCreateAlias();

	function newJoinSql(context, relations) {
		const length = relations.length;
		let leftAlias,
			rightAlias;
		let sql = '';

		function addSql(relation) {
			const rightColumns = relation.childTable._primaryColumns;
			const leftColumns = relation.columns;
			sql += ' INNER' + newShallowJoinSql(context, relation.childTable, leftColumns, rightColumns, leftAlias, rightAlias).sql();
		}

		relations.forEach(function(relation, i) {
			leftAlias = 'x' + (length - i);
			rightAlias = createAlias(relation.childTable, length - i - 1);
			addSql(relation);

		});

		return sql;
	}

	joinSql$1 = newJoinSql;
	return joinSql$1;
}

var whereSql$1;
var hasRequiredWhereSql$1;

function requireWhereSql$1 () {
	if (hasRequiredWhereSql$1) return whereSql$1;
	hasRequiredWhereSql$1 = 1;
	var newShallowJoinSql = requireNewShallowJoinSqlCore();

	function newWhereSql(context, relations, shallowFilter, rightAlias) {
		var sql;
		var relationCount = relations.length;
		var relation = relations[0];
		var leftAlias = 'x' + relationCount;
		var table = relation.childTable;
		var leftColumns = relation.columns;
		var rightColumns = table._primaryColumns;
		where();

		function where() {
			var table = relation.childTable;
			var joinCore = newShallowJoinSql(context, table, leftColumns, rightColumns, leftAlias, rightAlias);
			if (shallowFilter.sql())
				sql = shallowFilter.prepend(' AND ').prepend(joinCore).prepend(' WHERE ');
			else
				sql = joinCore.prepend(' WHERE ');
		}

		return sql;
	}

	whereSql$1 = newWhereSql;
	return whereSql$1;
}

var subFilter$1;
var hasRequiredSubFilter$1;

function requireSubFilter$1 () {
	if (hasRequiredSubFilter$1) return subFilter$1;
	hasRequiredSubFilter$1 = 1;
	const newSelect = requireSelectSql$1();
	const newJoin = requireJoinSql$1();
	const newWhere = requireWhereSql$1();
	const createAlias = requireCreateAlias();

	function newSubFilter(context,relations, shallowFilter) {
		const relationCount = relations.length;
		if (relationCount === 0)
			return shallowFilter;
		const table = relations[0].childTable;
		const alias = createAlias(table, relationCount -1);
		const filter = newSelect(context,table,alias).prepend('EXISTS (');
		const join = newJoin(context, relations.slice(1));
		const where = newWhere(context,relations,shallowFilter,alias);
		return filter.append(join).append(where).append(')');

	}

	subFilter$1 = newSubFilter;
	return subFilter$1;
}

var newSingleCommandCore_1;
var hasRequiredNewSingleCommandCore;

function requireNewSingleCommandCore () {
	if (hasRequiredNewSingleCommandCore) return newSingleCommandCore_1;
	hasRequiredNewSingleCommandCore = 1;
	var getSessionSingleton = requireGetSessionSingleton();
	var newParameterized = requireNewParameterized();

	function newSingleCommandCore(context, table, filter, alias, concurrencyState) {
		var c = {};
		var quote = getSessionSingleton(context, 'quote');
		var engine = getSessionSingleton(context, 'engine');
		var concurrency = buildConcurrencyChecks(concurrencyState);
		var parameters = filter.parameters ? filter.parameters.slice() : [];
		if (concurrency && concurrency.parameters.length > 0)
			parameters = parameters.concat(concurrency.parameters);

		c.sql = function() {
			var whereSql = filter.sql();
			if (concurrency && concurrency.sql) {
				if (whereSql)
					whereSql += ' AND ' + concurrency.sql;
				else
					whereSql = concurrency.sql;
			}
			if (whereSql)
				whereSql = ' where ' + whereSql;
			var deleteFromSql = getSessionSingleton(context, 'deleteFromSql');
			return deleteFromSql(table, alias, whereSql);
		};

		c.parameters = parameters;

		return c;

		function buildConcurrencyChecks(state) {
			const columnsState = state && state.columns;
			if (!columnsState)
				return;
			const parts = [];
			const params = [];
			for (let alias in columnsState) {
				const columnState = columnsState[alias];
				if (!columnState || columnState.concurrency === 'overwrite')
					continue;
				const column = table[alias];
				if (!column)
					continue;
				const encoded = (engine === 'mysql' && column.tsType === 'JSONColumn')
					? encodeJsonValue(columnState.oldValue, column)
					: column.encode(context, columnState.oldValue);
				const comparison = buildNullSafeComparison(column, encoded);
				if (comparison.sql)
					parts.push(comparison.sql());
				if (comparison.parameters.length > 0)
					params.push(...comparison.parameters);
			}
			if (parts.length === 0)
				return;
			return { sql: parts.join(' AND '), parameters: params };
		}

		function buildNullSafeComparison(column, encoded) {
			const columnSql = quote(column._dbName);
			if (engine === 'pg') {
				return newParameterized(columnSql + ' IS NOT DISTINCT FROM ' + encoded.sql(), encoded.parameters);
			}
			if (engine === 'mysql' || engine === 'mariadb') {
				return newParameterized(columnSql + ' <=> ' + encoded.sql(), encoded.parameters);
			}
			if (engine === 'sqlite') {
				return newParameterized(columnSql + ' IS ' + encoded.sql(), encoded.parameters);
			}
			if (engine === 'sap' && column.tsType === 'DateColumn') {
				if (encoded.sql() === 'null')
					return newParameterized(columnSql + ' IS NULL');
				return newParameterized(column.formatOut(context) + '=' + encoded.sql(), encoded.parameters);
			}
			if (engine === 'sap' && column.tsType === 'JSONColumn') {
				if (encoded.sql() === 'null')
					return newParameterized(columnSql + ' IS NULL');
				const casted = newParameterized('CONVERT(VARCHAR(16384), ' + encoded.sql() + ')', encoded.parameters);
				return newParameterized('CONVERT(VARCHAR(16384), ' + columnSql + ')=' + casted.sql(), casted.parameters);
			}
			if (engine === 'oracle' && column.tsType === 'JSONColumn') {
				if (encoded.sql() === 'null')
					return newParameterized(columnSql + ' IS NULL');
				const jsonValue = newParameterized('JSON(' + encoded.sql() + ')', encoded.parameters);
				return newParameterized('JSON_EQUAL(' + columnSql + ', ' + jsonValue.sql() + ')', jsonValue.parameters);
			}
			if (encoded.sql() === 'null')
				return newParameterized(columnSql + ' IS NULL');
			return newParameterized(columnSql + '=' + encoded.sql(), encoded.parameters);
		}

		function encodeJsonValue(value, column) {
			if (engine === 'oracle') {
				if (value === null || value === undefined)
					return newParameterized('null');
				if (isJsonObject(value))
					return column.encode(context, value);
				if (typeof value === 'boolean' || typeof value === 'number')
					return newParameterized('?', [String(value)]);
				return newParameterized('?', [value]);
			}
			if (engine === 'pg') {
				const jsonValue = JSON.stringify(value === undefined ? null : value);
				return newParameterized('?::jsonb', [jsonValue]);
			}
			if (engine === 'mysql') {
				const jsonValue = JSON.stringify(value === undefined ? null : value);
				return newParameterized('CAST(? AS JSON)', [jsonValue]);
			}
			if (engine === 'mariadb') {
				const jsonValue = JSON.stringify(value === undefined ? null : value);
				return newParameterized('JSON_EXTRACT(?, \'$\')', [jsonValue]);
			}
			if (engine === 'sqlite') {
				if (isJsonObject(value)) {
					const jsonValue = JSON.stringify(value);
					return newParameterized('?', [jsonValue]);
				}
				if (value === null || value === undefined)
					return newParameterized('null');
				return newParameterized('?', [value]);
			}
			if (engine === 'mssql' || engine === 'mssqlNative') {
				if (isJsonObject(value))
					return newParameterized('JSON_QUERY(?)', [JSON.stringify(value)]);
				if (value === null || value === undefined)
					return newParameterized('null');
				return newParameterized('?', [String(value)]);
			}
			return column.encode(context, value);
		}

		function isJsonObject(value) {
			return value && typeof value === 'object';
		}
	}

	newSingleCommandCore_1 = newSingleCommandCore;
	return newSingleCommandCore_1;
}

var newSingleCommand;
var hasRequiredNewSingleCommand;

function requireNewSingleCommand () {
	if (hasRequiredNewSingleCommand) return newSingleCommand;
	hasRequiredNewSingleCommand = 1;
	var newSubFilter = requireSubFilter$1();
	var newDiscriminatorSql = requireNewDiscriminatorSql$1();
	var extractFilter = requireExtractFilter();
	var newSingleCommandCore = requireNewSingleCommandCore();
	var createAlias = requireCreateAlias();

	function _new(context, table, filter, relations, concurrencyState) {
		var alias = createAlias(table, relations.length);
		filter = extractFilter(filter);
		filter = newSubFilter(context, relations, filter);
		var discriminator = newDiscriminatorSql(context, table, alias);
		if (discriminator !== '')
			filter = filter.and(context, discriminator);
		return newSingleCommandCore(context, table, filter, alias, concurrencyState);
	}

	newSingleCommand = _new;
	return newSingleCommand;
}

var newDeleteCommand;
var hasRequiredNewDeleteCommand;

function requireNewDeleteCommand () {
	if (hasRequiredNewDeleteCommand) return newDeleteCommand;
	hasRequiredNewDeleteCommand = 1;
	var newSingleCommand = requireNewSingleCommand();

	function newCommand(context, queries, table, filter, strategy, relations, concurrencyState) {
		var singleCommand = newSingleCommand(context, table, filter, relations, concurrencyState);
		for (var name in strategy) {
			if (!(strategy[name] === null || strategy[name]))
				continue;
			var childStrategy = strategy[name];
			var childRelation = table._relations[name];
			var joinRelation = childRelation.joinRelation;
			var childRelations = [joinRelation].concat(relations);
			newCommand(context, queries, childRelation.childTable, filter, childStrategy, childRelations);
		}
		queries.push(singleCommand);
		return queries;
	}

	newDeleteCommand = newCommand;
	return newDeleteCommand;
}

var _delete_1$1;
var hasRequired_delete$1;

function require_delete$1 () {
	if (hasRequired_delete$1) return _delete_1$1;
	hasRequired_delete$1 = 1;
	var removeFromCache = requireRemoveFromCache();
	var pushCommand = requirePushCommand();
	var newDeleteCommand = requireNewDeleteCommand();
	var newPrimaryKeyFilter = requireNewPrimaryKeyFilter();
	var createPatch = requireCreatePatch();
	var createDto = requireCreateDto();
	var newConcurrencyConflictError = requireNewConcurrencyConflictError();

	function _delete(context, row, strategy, table) {
		var relations = [];
		removeFromCache(context, row, strategy, table);

		var args = [context, table];
		table._primaryColumns.forEach(function(primary) {
			args.push(row[primary.alias]);
		});
		var filter = newPrimaryKeyFilter.apply(null, args);
		var concurrencyState = row._concurrencyState;
		delete row._concurrencyState;
		var cmds = newDeleteCommand(context, [], table, filter, strategy, relations, concurrencyState);
		cmds.forEach(function(cmd) {
			pushCommand(context, cmd);
		});
		var cmd = cmds[0];
		var concurrencySummary = summarizeConcurrency(concurrencyState);
		if (concurrencySummary.hasConcurrency) {
			var deleteCmd = cmds[cmds.length - 1];
			deleteCmd.onResult = function(result) {
				var rowCount = extractRowCount(result);
				if (rowCount === undefined)
					return;
				if (rowCount === 0 && concurrencySummary.hasOptimistic) {
					throw newConcurrencyConflictError();
				}
			};
		}
		if (table._emitChanged.callbacks.length > 0) {
			cmd.disallowCompress = true;
			var dto = createDto(table, row);
			let patch =  createPatch([dto],[]);
			cmd.emitChanged = table._emitChanged.bind(null, {row: row, patch: patch}); //todo remove ?
		}

	}

	function summarizeConcurrency(concurrencyState) {
		const summary = { hasConcurrency: false, hasOptimistic: false };
		if (!concurrencyState || !concurrencyState.columns)
			return summary;
		for (let name in concurrencyState.columns) {
			const state = concurrencyState.columns[name];
			if (!state)
				continue;
			const strategy = state.concurrency || 'optimistic';
			if (strategy === 'overwrite')
				continue;
			summary.hasConcurrency = true;
			if (strategy === 'optimistic')
				summary.hasOptimistic = true;
		}
		return summary;
	}

	function extractRowCount(result) {
		if (Array.isArray(result) && typeof result[0].rowsAffected === 'number')
			return result[0].rowsAffected;
		if (!result || typeof result !== 'object')
			return;
		if (typeof result.rowsAffected === 'number')
			return result.rowsAffected;
	}

	_delete_1$1 = _delete;
	return _delete_1$1;
}

var toDto_1;
var hasRequiredToDto;

function requireToDto () {
	if (hasRequiredToDto) return toDto_1;
	hasRequiredToDto = 1;
	let flags = requireFlags();
	let tryGetSessionContext = requireTryGetSessionContext();

	function toDto(context, strategy, table, row, joinRelationSet) {
		let result;
		flags.useProxy = false;
		let rdb = tryGetSessionContext(context);
		let ignoreSerializable = rdb && rdb.ignoreSerializable;
		if (joinRelationSet) {
			result = toDtoSync(table, row, joinRelationSet, strategy, ignoreSerializable);
		}
		else
			result =  _toDto(table, row, strategy, ignoreSerializable);
		flags.useProxy = true;
		return result;
	}

	async function _toDto(table, row, strategy, ignoreSerializable) {
		let dto = {};
		if (!row)
			return;
		for (let name in strategy) {
			if (!strategy[name])
				continue;
			let column = table[name];
			// eslint-disable-next-line no-prototype-builtins
			if (table._aliases.has(name) && (ignoreSerializable || !('serializable' in column && !column.serializable) && row.propertyIsEnumerable(name))) {
				if (column.toDto)
					dto[name] = column.toDto(row[name]);
				else
					dto[name] = row[name];
			}
			else if (table._relations[name] && strategy[name]) {
				let child;
				let relation = table._relations[name];
				if ((strategy && !(strategy[name] || strategy[name] === null)))
					continue;
				else if (!row.isExpanded(name))
					child = await row[name];
				else
					child = relation.getRowsSync(row);
				if (!child)
					dto[name] = child;
				else if (Array.isArray(child)) {
					dto[name] = [];
					for (let i = 0; i < child.length; i++) {
						dto[name].push(await _toDto(relation.childTable, child[i], strategy && strategy[name], ignoreSerializable));
					}
				}
				else
					dto[name] = await _toDto(relation.childTable, child, strategy && strategy[name], ignoreSerializable);
			}
		}
		return dto;
	}


	function toDtoSync(table, row, joinRelationSet, strategy, ignoreSerializable) {
		let dto = {};
		if (!row)
			return;
		for (let name in row) {
			let column = table[name];
			if (table._aliases.has(name) && (ignoreSerializable || !('serializable' in column && !column.serializable))) {
				if (column.toDto)
					dto[name] = column.toDto(row[name]);
				else
					dto[name] = row[name];
			}
			else if (table._relations[name]) {
				let relation = table._relations[name];
				let join = relation.joinRelation || relation;
				if (!row.isExpanded(name) || joinRelationSet.has(join) || (strategy && !(strategy[name] || strategy[name] === null)))
					continue;
				let child = relation.getRowsSync(row);
				if (!child)
					dto[name] = child;
				else if (Array.isArray(child)) {
					dto[name] = [];
					for (let i = 0; i < child.length; i++) {
						dto[name].push(toDtoSync(relation.childTable, child[i], new Set([...joinRelationSet, join]), strategy && strategy[name], ignoreSerializable));
					}
				}
				else
					dto[name] = toDtoSync(relation.childTable, child, new Set([...joinRelationSet, join]), strategy && strategy[name], ignoreSerializable);

			}
		}
		return dto;
	}

	toDto_1 = toDto;
	return toDto_1;
}

var purifyStrategy_1;
var hasRequiredPurifyStrategy;

function requirePurifyStrategy () {
	if (hasRequiredPurifyStrategy) return purifyStrategy_1;
	hasRequiredPurifyStrategy = 1;
	function purifyStrategy(table, strategy, columns = new Map()) {
		strategy = { ...strategy };
		for (let p in strategy) {
			if (strategy[p] === null)
				strategy[p] = true;
		}

		let hasIncludedColumns;
		for (let name in strategy) {
			if (table._relations[name] && !strategy[name])
				continue;
			else if (table._relations[name])
				strategy[name] = addLeg(table._relations[name], strategy[name], columns);
			else if (table[name] && table[name].eq ) {
				if (!columns.has(table[name]))
					columns.set(table[name], strategy[name]);
				hasIncludedColumns = hasIncludedColumns || strategy[name];
			}
		}
		for (let i = 0; i < table._columns.length; i++) {
			let column = table._columns[i];
			strategy[column.alias] = !hasIncludedColumns;
		}

		table._primaryColumns.forEach(column => {
			strategy[column.alias] = true;
		});
		columns.forEach((value, key) => strategy[key.alias] = value);

		return strategy;

	}

	function addLeg(relation, strategy, columns) {
		let nextColumns = new Map();
		if (!relation.joinRelation)
			for (let i = 0; i < relation.columns.length; i++) {
				columns.set(relation.columns[i], true);
			}
		else {
			relation.joinRelation.columns.forEach(column => {
				nextColumns.set(column, true);
			});
		}
		let childTable = relation.childTable;
		return purifyStrategy(childTable, strategy, nextColumns);
	}

	purifyStrategy_1 = purifyStrategy;
	return purifyStrategy_1;
}

var newDecodeDbRow_1;
var hasRequiredNewDecodeDbRow;

function requireNewDecodeDbRow () {
	if (hasRequiredNewDecodeDbRow) return newDecodeDbRow_1;
	hasRequiredNewDecodeDbRow = 1;
	let updateField = requireUpdateField();
	let newEmitEvent = requireEmitEvent();
	let extractStrategy = requireExtractStrategy$1();
	let extractDeleteStrategy = requireExtractDeleteStrategy();
	let newCascadeDeleteStrategy = requireNewCascadeDeleteStrategy();
	let _delete = require_delete$1();
	let newObject = requireNewObject();
	let toDto = requireToDto();
	let createDto = requireCreateDto();
	let onChange = require$$9;
	let flags = requireFlags();
	let tryGetSessionContext = requireTryGetSessionContext();
	let purifyStrategy = requirePurifyStrategy();


	function newDecodeDbRow(table, dbRow, filteredAliases, shouldValidate, isInsert) {
		let aliases = filteredAliases || table._aliases;
		let columns = table._columns;
		let numberOfColumns = columns.length;
		if (dbRow.offset === undefined) {
			dbRow.offset = 0;
		}

		let offset = dbRow.offset;
		let keys = Object.keys(dbRow);

		for (let i = 0; i < numberOfColumns; i++) {
			defineColumnProperty(i);
		}

		dbRow.offset += numberOfColumns;

		function defineColumnProperty(i) {
			let column = columns[i];
			let purify = column.purify;
			let name = column.alias;
			let intName = '__' + name;
			i = offset + i;
			let key = keys[i];

			Object.defineProperty(Row.prototype, intName, {
				get: function() {
					return this._dbRow[key];
				},

				set: function(value) {
					let oldValue = this[name];
					value = purify(value);
					this._dbRow[key] = value;
					if (column.validate)
						column.validate(value, { table: table._dbName, column: column._dbName, property: column.alias, isInsert: false });
					updateField(this._context, table, column, this);
					let emit = this._emitColumnChanged[name];
					if (emit)
						emit(this, column, value, oldValue);
					this._emitChanged(this, column, value, oldValue);
				}
			});

			Object.defineProperty(Row.prototype, name, {
				enumerable: true,
				configurable: false,

				get: function() {
					if (column.onChange && flags.useProxy && (this[intName] !== null && this[intName] !== undefined) && typeof this[intName] === 'object') {
						if (!(name in this._proxies)) {
							let value = this[intName];
							this._proxies[name] = column.onChange(this._dbRow[key], () => {
								if (this[intName] !== onChange.target(value)) {
									return;
								}
								this[intName] = this._dbRow[key];
							});
						}
						return this._proxies[name];
					}
					return negotiateNull(this[intName]);
				},
				set: function(value) {
					if (column.onChange && (this[intName] !== null && this[intName] !== undefined) && value && typeof value === 'object') {
						if (this[intName] === onChange.target(value))
							return;
						this._proxies[name] = column.onChange(value, () => {
							if (this[intName] !== onChange.target(value))
								return;
							this[intName] = this._dbRow[key];
						});
					}
					this[intName] = value;
				}
			});
		}

		setRelated();

		function setRelated() {
			let relations = table._relations;
			for (let relationName in relations) {
				setSingleRelated(relationName);
			}
		}

		function setSingleRelated(name) {
			Object.defineProperty(Row.prototype, name, {
				get: function() {
					return createGetRelated(this, name)();
				}
			});
		}

		function createGetRelated(row, alias) {
			let get = row._related[alias];
			if (!get) {
				let relation = table._relations[alias];
				get = relation.toGetRelated(row._context, row);
				row._relationCacheMap.set(relation, relation.getInnerCache(row._context));
				row._related[alias] = get;
			}
			return get;
		}

		Row.prototype.subscribeChanged = function(onChanged, name) {
			let emit;
			if (name) {
				emit = this._emitColumnChanged[name] || (this._emitColumnChanged[name] = newEmitEvent());
				emit.add(onChanged);
				return;
			}
			this._emitChanged.add(onChanged);
		};

		Row.prototype.unsubscribeChanged = function(onChanged, name) {
			if (name) {
				this._emitColumnChanged[name].tryRemove(onChanged);
				return;
			}
			this._emitChanged.tryRemove(onChanged);
		};

		Row.prototype.toJSON = function() {
			return toDto(undefined, table, this, new Set());
		};


		Row.prototype.hydrate = function(context, dbRow) {
			const engine = tryGetSessionContext(context)?.engine;
			let i = offset;
			if (engine === 'sqlite') {
				const errorSeparator = '12345678-1234-1234-1234-123456789012';
				for (let p in dbRow) {
					if (typeof dbRow[p] === 'string' && dbRow[p].indexOf(errorSeparator) === 0)
						throw new Error(dbRow[p].split(errorSeparator)[1]);
					let key = keys[i];
					this._dbRow[key] = columns[i].decode(context, dbRow[p]);
					i++;
				}
			}
			else {
				for (let p in dbRow) {
					let key = keys[i];
					this._dbRow[key] = columns[i].decode(context, dbRow[p]);
					i++;
				}
			}
		};

		Row.prototype.toDto = function(strategy) {
			if (strategy === undefined) {
				strategy = extractStrategy(table);
			}
			strategy = purifyStrategy(table, strategy);
			if (!tryGetSessionContext(this._context)) {
				return toDto(this._context, strategy, table, this, new Set());
			}
			let p = toDto(this._context, strategy, table, this);
			return Promise.resolve().then(() => p);
		};

		Row.prototype.expand = function(alias) {
			let get = createGetRelated(this, alias);
			get.expanded = true;
		};

		Row.prototype.isExpanded = function(alias) {
			return this._related[alias] && this._related[alias].expanded;
		};

		Row.prototype.delete = function(strategy) {
			strategy = extractDeleteStrategy(strategy);
			_delete(this._context, this, strategy, table);
		};

		Row.prototype.cascadeDelete = function() {
			let strategy = newCascadeDeleteStrategy(newObject(), table);
			_delete(this._context, this, strategy, table);
		};

		Row.prototype.deleteCascade = Row.prototype.cascadeDelete;

		function decodeDbRow(context, row) {
			for (let i = 0; i < numberOfColumns; i++) {
				let index = offset + i;
				let key = keys[index];
				if (row[key] !== undefined && !isInsert)
					row[key] = columns[i].decode(context, row[key]);
				if (shouldValidate && columns[i].validate)
					columns[i].validate(row[key], { table: table._dbName, column: columns[i]._dbName, property: columns[i].alias, isInsert });
			}
			let target = new Row(context, row);
			const p = new Proxy(target, {
				ownKeys: function() {
					return Array.from(aliases).concat(Object.keys(target._related).filter(alias => {
						return target._related[alias] && target._related[alias].expanded;
					}));
				},
				getOwnPropertyDescriptor(target, prop) {
					if (table._aliases.has(prop) || (target._related[prop]))
						return {
							enumerable: aliases.has(prop) || (target._related[prop] && target._related[prop].expanded),
							configurable: true,
							writable: true
						};
				}
			});

			return p;
		}

		function negotiateNull(value) {
			if (value === undefined)
				return null;
			return value;
		}

		function Row(context, dbRow) {
			this._context = context;
			this._relationCacheMap = new Map();
			this._cache = table._cache.getInnerCache(context);
			this._dbRow = dbRow;
			this._related = {};
			this._emitColumnChanged = {};
			this._emitChanged = newEmitEvent();
			this._proxies = {};
			this._oldValues = JSON.stringify(createDto(table, this));
		}

		return decodeDbRow;
	}

	newDecodeDbRow_1 = newDecodeDbRow;
	return newDecodeDbRow_1;
}

var decodeDbRow_1;
var hasRequiredDecodeDbRow;

function requireDecodeDbRow () {
	if (hasRequiredDecodeDbRow) return decodeDbRow_1;
	hasRequiredDecodeDbRow = 1;
	var newDecodeDbRow = requireNewDecodeDbRow();

	function decodeDbRow(context, span, table, dbRow, shouldValidate, isInsert) {
		var decodeCache = span._decodeDbRowCache;
		if (!decodeCache) {
			decodeCache = {};
			Object.defineProperty(span, '_decodeDbRowCache', {
				enumerable: false,
				get: function() {
					return decodeCache;
				},
			});
		}
		var cacheKey = (shouldValidate ? 'v' : 'nv') + (isInsert ? ':i' : ':u');
		var decode = decodeCache[cacheKey];
		if (!decode) {
			let aliases = new Set();
			if (span.columns)
				span.columns.forEach((value, key) => {
					if (value)
						aliases.add(key.alias);
				});
			if (aliases.size === 0)
				aliases = undefined;
			decode = newDecodeDbRow(table, dbRow, aliases, shouldValidate, isInsert);
			decodeCache[cacheKey] = decode;
		}
		return decode(context, dbRow);
	}

	decodeDbRow_1 = decodeDbRow;
	return decodeDbRow_1;
}

var dbRowToRow_1;
var hasRequiredDbRowToRow;

function requireDbRowToRow () {
	if (hasRequiredDbRowToRow) return dbRowToRow_1;
	hasRequiredDbRowToRow = 1;
	var negotiateQueryContext = requireNegotiateQueryContext();
	var decodeDbRow = requireDecodeDbRow();

	function dbRowToRow(context, span, dbRow) {
		var table = span.table;
		var row = decodeDbRow(context, span, table, dbRow);
		if (!hasPrimaryKey(row, table)) {
			skipNestedLegs(span, dbRow);
			return null;
		}
		var cache = table._cache;
		if (!cache.tryGet(context, row)) {
			var queryContext = span.queryContext;
			negotiateQueryContext(queryContext, row);
			Object.defineProperty(row, 'queryContext', {
				writable: true,
				configurable: true,
				enumerable: false
			});
			row.queryContext = queryContext;
		}
		row = cache.tryAdd(context, row);

		var c = {};

		c.visitOne = function(leg) {
			let child = dbRowToRow(context, leg.span, dbRow);
			if (child)
				leg.expand(row);
		};

		c.visitJoin = function(leg) {
			let child = dbRowToRow(context, leg.span, dbRow);
			if (child)
				leg.expand(row);
		};

		c.visitMany = function() {
		};

		span.legs.forEach(onEach);

		function onEach(leg) {
			leg.accept(c);
		}

		return row;
	}

	function hasPrimaryKey(row, table) {
		return table._primaryColumns.every((column) => {
			let value = row[column.alias];
			return value !== null && value !== undefined;
		});
	}

	function skipNestedLegs(span, dbRow) {
		span.legs.forEach((leg) => {
			leg.accept({
				visitOne() {
					skipSpan(leg.span, dbRow);
				},
				visitJoin() {
					skipSpan(leg.span, dbRow);
				},
				visitMany() {
				}
			});
		});
	}

	function skipSpan(span, dbRow) {
		decodeDbRow(undefined, span, span.table, dbRow);
		skipNestedLegs(span, dbRow);
	}

	dbRowToRow_1 = dbRowToRow;
	return dbRowToRow_1;
}

var resultToPromise_1;
var hasRequiredResultToPromise;

function requireResultToPromise () {
	if (hasRequiredResultToPromise) return resultToPromise_1;
	hasRequiredResultToPromise = 1;
	function resultToPromise(result) {
		return Promise.resolve(result);
	}

	resultToPromise_1 = resultToPromise;
	return resultToPromise_1;
}

var orderBy_1;
var hasRequiredOrderBy;

function requireOrderBy () {
	if (hasRequiredOrderBy) return orderBy_1;
	hasRequiredOrderBy = 1;
	function orderBy(strategy, rows) {
		if (strategy && strategy.orderBy) {
			var comparer = createComparer(strategy.orderBy);
			return rows.sort(comparer);
		}
		return rows;
	}

	function createComparer(orderBy) {
		var comparers = [];
		if (typeof orderBy === 'string')
			orderBy = [orderBy];
		orderBy.forEach(function(order) {
			var elements = order.split(' ');
			var name = elements[0];
			var direction = elements[1] || 'asc';

			if (direction === 'asc')
				comparers.push(compareAscending);
			else
				comparers.push(compareDescending);

			function compareAscending(a, b) {
				a = a[name];
				b = b[name];
				if (a === b)
					return 0;
				if (a < b)
					return -1;
				return 1;
			}

			function compareDescending(a, b) {
				return compareAscending(b, a);
			}

		});

		function compareComposite(a, b) {
			for (var i = 0; i < comparers.length; i++) {
				var result = comparers[i](a, b);
				if (result !== 0)
					return result;
			}
			return 0;
		}

		return compareComposite;
	}

	orderBy_1 = orderBy;
	return orderBy_1;
}

var negotiateNextTick_1;
var hasRequiredNegotiateNextTick;

function requireNegotiateNextTick () {
	if (hasRequiredNegotiateNextTick) return negotiateNextTick_1;
	hasRequiredNegotiateNextTick = 1;
	function negotiateNextTick(i) {
		if (i === 0)
			return;
		if (i % 1000 === 0)
			return Promise.resolve();
		return;
	}

	negotiateNextTick_1 = negotiateNextTick;
	return negotiateNextTick_1;
}

/* eslint-disable @typescript-eslint/no-this-alias */

var rowArray;
var hasRequiredRowArray;

function requireRowArray () {
	if (hasRequiredRowArray) return rowArray;
	hasRequiredRowArray = 1;
	var resultToPromise = requireResultToPromise();
	var orderBy = requireOrderBy();
	var negotiateNextTick = requireNegotiateNextTick();

	function newRowArray() {
		var c = [];

		Object.defineProperty(c, 'toDto', {
			enumerable: false,
			writable: true,
			value: toDtoNativePromise
		});

		Object.defineProperty(c, '__toDto', {
			enumerable: false,
			writable: true,
			value: toDto
		});

		async function toDtoNativePromise() {
			let result = [];
			for (let i = 0; i < c.length; i++) {
				result.push(await c[i].toDto.apply(c[i], arguments));
			}
			return result;
		}

		return c;
	}

	function toDto(optionalStrategy) {
		var args = arguments;
		var result = [];
		var length = this.length;
		var rows = this;
		var i = -1;

		return resultToPromise().then(toDtoAtIndex);

		function toDtoAtIndex() {
			i++;
			if (i === length) {
				return orderBy(optionalStrategy, result);
			}
			var row = rows[i];
			return getDto()
				.then(onDto)
				.then(toDtoAtIndex);

			function getDto() {
				return row.__toDto.apply(row,args);
			}

			function onDto(dto) {
				result.push(dto);
				return negotiateNextTick(i);
			}
		}
	}

	rowArray = newRowArray;
	return rowArray;
}

var dbRowsToRows_1;
var hasRequiredDbRowsToRows;

function requireDbRowsToRows () {
	if (hasRequiredDbRowsToRows) return dbRowsToRows_1;
	hasRequiredDbRowsToRows = 1;
	var dbRowToRow = requireDbRowToRow();
	var newRowArray = requireRowArray();

	function dbRowsToRows(context, span, dbRows) {
		var rows = newRowArray();
		for (var i = 0; i < dbRows.length; i++) {
			var row = dbRowToRow(context, span, dbRows[i]);
			rows.push(row);
		}
		return rows;
	}

	dbRowsToRows_1 = dbRowsToRows;
	return dbRowsToRows_1;
}

var resultToRows_1;
var hasRequiredResultToRows;

function requireResultToRows () {
	if (hasRequiredResultToRows) return resultToRows_1;
	hasRequiredResultToRows = 1;
	var dbRowsToRows = requireDbRowsToRows();

	async function resultToRows(context, span, result) {
		let rows = await result[0].then(onResult);
		await expand(spanToStrategy(span), rows);
		return rows;

		function onResult(result) {
			return dbRowsToRows(context, span, result);
		}
	}

	async function expand(strategy, rows) {
		if (!rows)
			return;
		if (!Array.isArray(rows))
			rows = [rows];
		for (let p in strategy) {
			if (!(strategy[p] === null || strategy[p]))
				continue;
			for (let i = 0; i < rows.length; i++) {
				await expand(strategy[p], await rows[i][p]);
			}
		}
	}

	function spanToStrategy(span) {
		let strategy = {};

		span.legs.forEach((leg) => {
			strategy[leg.name] = spanToStrategy(leg.span);
		});
		return strategy;

	}

	resultToRows_1 = resultToRows;
	return resultToRows_1;
}

var strategyToSpan;
var hasRequiredStrategyToSpan;

function requireStrategyToSpan () {
	if (hasRequiredStrategyToSpan) return strategyToSpan;
	hasRequiredStrategyToSpan = 1;
	var newCollection = requireNewCollection();
	var newQueryContext = requireNewQueryContext();
	var purifyStrategy = requirePurifyStrategy();

	function toSpan(table, strategy) {
		var span = {};
		span.aggregates = {};
		span.legs = newCollection();
		span.table = table;
		strategy = purifyStrategy(table, strategy);
		applyStrategy(table,span,strategy);
		span.queryContext = newQueryContext();
		span.queryContext.strategy = strategy;
		return span;

		function applyStrategy(table,span,strategy) {
			let columns = new Map();
			var legs = span.legs;
			if(!strategy)
				return;
			for (var name in strategy) {
				if (table._relations[name] && !strategy[name])
					continue;
				if (table._relations[name])
					addLeg(legs,table,strategy,name);
				else if (strategy[name]?.expression && (strategy[name]?.joins || strategy[name]?.join || strategy[name]?.column))
					span.aggregates[name] = strategy[name];
				else if (table[name] && table[name].eq)
					columns.set(table[name], strategy[name]);
				else
					span[name] = strategy[name];
			}
			span.columns = columns;
		}

		function addLeg(legs,table,strategy,name) {
			var relation = table._relations[name];
			var leg = relation.toLeg();
			leg.span.queryContext.strategy = strategy;
			leg.span.where = strategy[name].where;
			leg.span.aggregates = {};
			legs.add(leg);
			var subStrategy = strategy[name];
			var childTable = relation.childTable;
			applyStrategy(childTable,leg.span,subStrategy);
		}
	}

	strategyToSpan = toSpan;
	return strategyToSpan;
}

var getMany_1;
var hasRequiredGetMany;

function requireGetMany () {
	if (hasRequiredGetMany) return getMany_1;
	hasRequiredGetMany = 1;
	let newQuery = requireNewQuery$2();
	let executeQueries = requireExecuteQueries();
	let resultToRows = requireResultToRows();
	let strategyToSpan = requireStrategyToSpan();
	let emptyInnerJoin = requireNewParameterized()();
	let negotiateRawSqlFilter = requireNegotiateRawSqlFilter();

	function getMany(context,table,filter,strategy) {
		return getManyCore(context, table,filter,strategy);
	}

	async function getManyCore(context,table,filter,strategy,exclusive) {
		let alias = table._dbName;
		let noOrderBy;
		filter = negotiateRawSqlFilter(context, filter, table);
		let span = strategyToSpan(table,strategy);
		let queries = newQuery(context, [],table,filter,span,alias,emptyInnerJoin,noOrderBy,exclusive);
		let result = await executeQueries(context, queries);
		return resultToRows(context, span,result);
	}

	getMany.exclusive = function(table,filter,strategy) {
		return getManyCore(table,filter,strategy,true);
	};

	getMany_1 = getMany;
	return getMany_1;
}

var tryGetFirstFromDb;
var hasRequiredTryGetFirstFromDb;

function requireTryGetFirstFromDb () {
	if (hasRequiredTryGetFirstFromDb) return tryGetFirstFromDb;
	hasRequiredTryGetFirstFromDb = 1;
	var getMany = requireGetMany();

	function tryGet(context, table, filter, strategy) {
		strategy = setLimit(strategy);
		return getMany(context, table, filter, strategy).then(filterRows);
	}

	function filterRows(rows) {
		if (rows.length > 0)
			return rows[0];
		return null;
	}

	tryGet.exclusive = function(context, table, filter, strategy) {
		strategy = setLimit(strategy);
		return getMany.exclusive(context, table, filter, strategy).then(filterRows);
	};

	function setLimit(strategy) {
		return {...strategy, ...{limit: 1}};
	}

	tryGetFirstFromDb = tryGet;
	return tryGetFirstFromDb;
}

var extractStrategy;
var hasRequiredExtractStrategy;

function requireExtractStrategy () {
	if (hasRequiredExtractStrategy) return extractStrategy;
	hasRequiredExtractStrategy = 1;
	function extract(_context, table) {
		var lengthWithStrategy = table._primaryColumns.length  + 3;
		if (arguments.length === lengthWithStrategy)
			return arguments[lengthWithStrategy-1];
		return;
	}

	extractStrategy = extract;
	return extractStrategy;
}

var tryGetFromDbById;
var hasRequiredTryGetFromDbById;

function requireTryGetFromDbById () {
	if (hasRequiredTryGetFromDbById) return tryGetFromDbById;
	hasRequiredTryGetFromDbById = 1;
	var newPrimaryKeyFilter = requireNewPrimaryKeyFilter();
	var tryGetFirstFromDb = requireTryGetFirstFromDb();
	var extractStrategy = requireExtractStrategy();

	function tryGet(context) {
		var filter = newPrimaryKeyFilter.apply(null, arguments);
		var table = arguments[1];
		var strategy = extractStrategy.apply(null, arguments);
		return tryGetFirstFromDb(context, table, filter, strategy);
	}

	tryGet.exclusive = function tryGet(context) {
		var filter = newPrimaryKeyFilter.apply(null, arguments);
		var table = arguments[1];
		var strategy = extractStrategy.apply(null, arguments);
		return tryGetFirstFromDb.exclusive(context, table, filter, strategy);


	};

	tryGetFromDbById = tryGet;
	return tryGetFromDbById;
}

var getFromDbById;
var hasRequiredGetFromDbById;

function requireGetFromDbById () {
	if (hasRequiredGetFromDbById) return getFromDbById;
	hasRequiredGetFromDbById = 1;
	let tryGetFromDbById = requireTryGetFromDbById();

	function get(_context, table, ...ids) {
		return tryGetFromDbById.apply(null, arguments).then((row) => onResult(table, row, ids));
	}

	get.exclusive = function(table, ...ids) {
		return tryGetFromDbById.exclusive.apply(null, arguments).then((row) => onResult(table, row, ids));
	};

	function onResult(table, row, id) {
		if (row === null)
			throw new Error(`${table._dbName  }: Row with id ${id} not found.`);
		return row;
	}

	getFromDbById = get;
	return getFromDbById;
}

var getById_1;
var hasRequiredGetById;

function requireGetById () {
	if (hasRequiredGetById) return getById_1;
	hasRequiredGetById = 1;
	let tryGetFromCacheById = requireTryGetFromCacheById();
	let getFromDbById = requireGetFromDbById();
	let resultToPromise = requireResultToPromise();
	let extractStrategy = requireExtractStrategy();

	async function getById() {
		let strategy = extractStrategy.apply(null, arguments);
		let cached =  tryGetFromCacheById.apply(null,arguments);
		if (cached) {
			await expand(cached, strategy);
			return resultToPromise(cached);

		}
		return getFromDbById.apply(null,arguments);
	}

	getById.exclusive = getFromDbById.exclusive;

	async function expand(rows, strategy) {
		if (!rows)
			return;
		if (!Array.isArray(rows))
			rows = [rows];
		for(let p in strategy) {
			if(!(strategy[p] === null || strategy[p]))
				continue;
			for (let i = 0; i < rows.length; i++) {
				await expand(await rows[i][p], strategy[p]);
			}
		}
	}

	getById_1 = getById;
	return getById_1;
}

var nullPromise;
var hasRequiredNullPromise;

function requireNullPromise () {
	if (hasRequiredNullPromise) return nullPromise;
	hasRequiredNullPromise = 1;
	nullPromise = requirePromise()(null);
	return nullPromise;
}

var newGetRelated_1;
var hasRequiredNewGetRelated;

function requireNewGetRelated () {
	if (hasRequiredNewGetRelated) return newGetRelated_1;
	hasRequiredNewGetRelated = 1;
	function newGetRelated(context, parent, relation) {
		function getRelated() {
			if (getRelated.expanded)
				return relation.getFromCache(parent);
			if (parent.queryContext)
				return relation.getRelatives(context, parent).then(onRelatives);
			return relation.getFromDb(context, parent).then(onFromDb);

			function onFromDb(rows) {
				getRelated.expanded = true;
				return rows;
			}

			function onRelatives() {
				return relation.getFromCache(parent);
			}
		}
		return getRelated;
	}

	newGetRelated_1 = newGetRelated;
	return newGetRelated_1;
}

var negotiateExpandInverse_1;
var hasRequiredNegotiateExpandInverse;

function requireNegotiateExpandInverse () {
	if (hasRequiredNegotiateExpandInverse) return negotiateExpandInverse_1;
	hasRequiredNegotiateExpandInverse = 1;
	function negotiateExpandInverse(parent, relation, children) {
		var joinRelation = relation.joinRelation;
		if (!joinRelation || !joinRelation.leftAlias)
			return;
		var firstChild = children.find(function(child) {
			return child.queryContext;
		});

		if (firstChild)
			firstChild.queryContext.expand(joinRelation);
	}

	negotiateExpandInverse_1 = negotiateExpandInverse;
	return negotiateExpandInverse_1;
}

var getRelatives_1$1;
var hasRequiredGetRelatives$1;

function requireGetRelatives$1 () {
	if (hasRequiredGetRelatives$1) return getRelatives_1$1;
	hasRequiredGetRelatives$1 = 1;
	var newPrimaryKeyFilter = requireNewPrimaryKeyFilter();
	var emptyFilter = requireEmptyFilter();
	var negotiateExpandInverse = requireNegotiateExpandInverse();

	function getRelatives(context, parent, relation) {
		var queryContext = parent.queryContext;
		var ctx = context === undefined ? null : context;
		let strategy = queryContext && queryContext.strategy[relation.leftAlias];
		var filter = emptyFilter;
		if (relation.columns.length === 1)
			createInFilter();
		else
			createCompositeFilter();

		function createInFilter() {
			var ids = [];
			var row;
			var id;
			var alias = relation.columns[0].alias;
			for (var i = 0; i < queryContext.rows.length; i++) {
				row = queryContext.rows[i];
				id = row[alias];
				if (!isNullOrUndefined(id))
					ids.push(id);
			}

			if (ids.length > 0)
				filter = relation.childTable._primaryColumns[0].in(ctx, ids);
		}

		function createCompositeFilter() {
			var keyFilter;
			for (var i = 0; i < queryContext.rows.length; i++) {
				keyFilter = rowToPrimaryKeyFilter(context, queryContext.rows[i], relation);
				if (keyFilter)
					filter = filter.or(ctx, keyFilter);
			}
		}

		return relation.childTable.getMany(filter, strategy).then(onRows);

		function onRows(rows) {
			queryContext.expand(relation);
			negotiateExpandInverse(parent, relation, rows);
			return rows;
		}

	}

	function rowToPrimaryKeyFilter(context, row, relation) {
		var key = relation.columns.map( function(column) {
			return row[column.alias];
		});
		if (key.some(isNullOrUndefined)) {
			return;
		}
		var args = [context, relation.childTable].concat(key);
		return newPrimaryKeyFilter.apply(null, args);
	}

	function isNullOrUndefined(item) {
		return item === null || item === undefined;
	}

	getRelatives_1$1 = getRelatives;
	return getRelatives_1$1;
}

var fuzzyPromise_1;
var hasRequiredFuzzyPromise;

function requireFuzzyPromise () {
	if (hasRequiredFuzzyPromise) return fuzzyPromise_1;
	hasRequiredFuzzyPromise = 1;
	function fuzzyPromise(value) {
		if (value !== undefined && value !== null)
			Object.defineProperty(value, 'then', {
				value: then,
				writable: true,
				enumerable: false,
				configurable: true
			});

		return value;

		function then(fn) {
			delete value.then;
			fn(value);
		}
	}

	fuzzyPromise_1 = fuzzyPromise;
	return fuzzyPromise_1;
}

var newJoinRelation;
var hasRequiredNewJoinRelation;

function requireNewJoinRelation () {
	if (hasRequiredNewJoinRelation) return newJoinRelation;
	hasRequiredNewJoinRelation = 1;
	var newLeg = requireNewJoinLeg(),
		getById = requireGetById(),
		nullPromise = requireNullPromise(),
		newGetRelated = requireNewGetRelated(),
		getRelatives = requireGetRelatives$1(),
		fuzzyPromise = requireFuzzyPromise();
	function _newJoin(parentTable, childTable, columnNames) {
		var c = {};

		c.parentTable = parentTable;
		c.childTable = childTable;
		c.columns = [];
		var columns = parentTable._columns;
		addColumns();

		c.accept = function(visitor) {
			visitor.visitJoin(c);
		};

		c.toLeg = function() {
			return newLeg(c);
		};

		c.getFromDb = function(parent) {
			var key = parentToArrayKey(parent);
			if (key.length === 0) {
				return nullPromise;
			}
			var args = [childTable].concat(key);
			return getById.apply(null, args);
		};

		c.getFromCache = function(parent) {
			var result = c.getRowsSync(parent);
			return fuzzyPromise(result);
		};

		c.toGetRelated = function(parent) {
			return newGetRelated(parent, c);
		};

		c.getRelatives = function(parent) {
			return getRelatives(parent, c);
		};

		c.expand = function(parent) {
			parent.expand(c.leftAlias);
		};

		c.getRowsSync = function(parent) {
			var key = parentToKey(parent);
			let cache = parent._relationCacheMap.get(c);
			return cache.tryGet(key);
		};

		c.getInnerCache = function() {
			return childTable._cache.getInnerCache();
		};

		c.notNullExceptInsert = function() {
			return c;
		};

		c.notNull = function() {
			return c;
		};


		return c;

		function addColumns() {
			var numberOfColumns = columnNames.length;
			for (var i = 0; i < columns.length; i++) {
				var curColumn = columns[i];
				tryAdd(curColumn);
				if (numberOfColumns === c.columns.length)
					return;
			}
		}

		function tryAdd(column) {
			for (var i = 0; i < columnNames.length; i++) {
				var name = columnNames[i];
				if (column._dbName === name) {
					column.default = undefined;
					// delete column.lazyDefault;
					c.columns.push(column);
					return;
				}
			}
		}

		function parentToKey(parent) {
			let key = {};
			for (let i = 0; i < c.columns.length; i++) {
				let value = parent[c.columns[i].alias];
				if (value === null || value === undefined)
					return {};
				key[childTable._primaryColumns[i].alias] = value;
			}
			return key;
		}

		function parentToArrayKey(parent) {
			let key = [];
			for (let i = 0; i < c.columns.length; i++) {
				let value = parent[c.columns[i].alias];
				if (value === null || value === undefined)
					return [];
				key.push(value);
			}
			return key;
		}
	}


	newJoinRelation = _newJoin;
	return newJoinRelation;
}

var selectSql;
var hasRequiredSelectSql;

function requireSelectSql () {
	if (hasRequiredSelectSql) return selectSql;
	hasRequiredSelectSql = 1;
	var newParameterized = requireNewParameterized();
	var newBoolean = requireNewBoolean();
	const getSessionSingleton = requireGetSessionSingleton();

	function newSelectSql(context, table, alias) {
		const quote = getSessionSingleton(context, 'quote');
		const quotedAlias  = quote(alias);
		const colName = quote(table._primaryColumns[0]._dbName);
		const sql = 'SELECT ' + quotedAlias + '.' + colName + ' FROM ' + quote(table._dbName) + ' ' + quotedAlias;
		const sqlp = newParameterized(sql);
		return newBoolean(sqlp);
	}

	selectSql = newSelectSql;
	return selectSql;
}

var joinSql;
var hasRequiredJoinSql;

function requireJoinSql () {
	if (hasRequiredJoinSql) return joinSql;
	hasRequiredJoinSql = 1;
	var newShallowJoinSql = requireNewShallowJoinSql();
	var newParameterized = requireNewParameterized();

	function newJoinSql(context, relations, depth = 0) {
		var leftAlias,
			rightAlias;
		var relation;
		var c = {};
		var sql = newParameterized('');

		c.visitJoin = function(relation) {
			//todo fix discriminators on childTable
			sql = newShallowJoinSql(context, relation.parentTable, relation.childTable._primaryColumns, relation.columns, leftAlias, rightAlias).prepend(' INNER').prepend(sql);
		};

		c.visitOne = function(relation) {
			innerJoin(relation);
		};

		c.visitMany = c.visitOne;

		function innerJoin(relation) {
			var joinRelation = relation.joinRelation;
			var table = joinRelation.childTable;
			var rightColumns = table._primaryColumns;
			var leftColumns = joinRelation.columns;

			sql = newShallowJoinSql(context, table, leftColumns, rightColumns, leftAlias, rightAlias).prepend(' INNER').prepend(sql);
		}

		for (let i = relations.length - 1; i > depth; i--) {
			leftAlias = 'x' + (i + 1);
			rightAlias = 'x' + i;
			relation = relations[i];
			relation.accept(c);
		}
		return sql;
	}

	joinSql = newJoinSql;
	return joinSql;
}

var whereSql;
var hasRequiredWhereSql;

function requireWhereSql () {
	if (hasRequiredWhereSql) return whereSql;
	hasRequiredWhereSql = 1;
	var newShallowJoinSql = requireNewShallowJoinSqlCore();

	function newWhereSql(context, relations, shallowFilter, depth = 0) {
		let relation = relations[depth];
		var c = {};
		var sql;

		c.visitJoin = function(relation) {
			var table = relation.childTable;

			//todo fix discriminators
			var alias = depth === 0 ? (relation.parentTable._rootAlias || relation.parentTable._dbName) : 'x' + depth;
			var leftColumns = relation.columns;
			var rightColumns = table._primaryColumns;
			where(alias, leftColumns, rightColumns);
		};

		c.visitOne = function(relation) {
			var joinRelation = relation.joinRelation;
			var rightColumns = joinRelation.columns;
			var childTable = joinRelation.childTable;
			var leftColumns = childTable._primaryColumns;
			//todo fix discriminators
			var alias = depth === 0 ? (childTable._rootAlias || childTable._dbName) : 'x' + depth;
			where(alias, leftColumns, rightColumns);
		};

		c.visitMany = c.visitOne;

		function where(alias, leftColumns, rightColumns) {
			var table = relation.childTable;
			var joinCore = newShallowJoinSql(context, table, leftColumns, rightColumns, alias, 'x' + (depth + 1));
			if (shallowFilter && shallowFilter.sql()) {
				sql = joinCore.prepend(' WHERE ').append(' AND ').append(shallowFilter);
			}
			else
				sql = joinCore.prepend(' WHERE ');
		}

		relation.accept(c);
		return sql;
	}

	whereSql = newWhereSql;
	return whereSql;
}

var subFilter;
var hasRequiredSubFilter;

function requireSubFilter () {
	if (hasRequiredSubFilter) return subFilter;
	hasRequiredSubFilter = 1;
	var newSelect = requireSelectSql();
	var newJoin = requireJoinSql();
	var newWhere = requireWhereSql();

	function newSubFilter(context, relations, shallowFilter, depth) {
		var relationCount = relations.length;
		var alias = 'x' + relationCount;
		var table = relations[relationCount-1].childTable;
		var exists = newSelect(context, table,alias).prepend('EXISTS (');
		var join = newJoin(context, relations, depth);
		var where = newWhere(context, relations,shallowFilter, depth);
		return exists.append(join).append(where).append(')');

	}

	subFilter = newSubFilter;
	return subFilter;
}

var columnAggregateGroup;
var hasRequiredColumnAggregateGroup;

function requireColumnAggregateGroup () {
	if (hasRequiredColumnAggregateGroup) return columnAggregateGroup;
	hasRequiredColumnAggregateGroup = 1;
	var newJoin = requireJoinSql();
	var getSessionContext = requireGetSessionContext();
	var newJoinCore = requireNewShallowJoinSqlCore();
	const getSessionSingleton = requireGetSessionSingleton();

	function columnAggregate(context, operator, column, relations, coalesce = true) {
		const quote = getSessionSingleton(context, 'quote');
		const rdb = getSessionContext(context);
		const outerAlias = 'y' + rdb.aggregateCount++;
		const outerAliasQuoted = quote(outerAlias);
		const alias = quote('x' + relations.length);
		const foreignKeys = getForeignKeys(relations[0]);
		const select = ` LEFT JOIN (SELECT ${foreignKeys},${operator}(${alias}.${quote(column._dbName)}) as amount`;
		const innerJoin = relations.length > 1 ? newJoin(context, relations).sql() : '';
		const onClause = createOnClause(context, relations[0], outerAlias);
		const from = ` FROM ${quote(relations.at(-1).childTable._dbName)} ${alias} ${innerJoin} GROUP BY ${foreignKeys}) ${outerAliasQuoted} ON (${onClause})`;
		const join = select + from;

		return {
			expression: (alias) => coalesce ? `COALESCE(${outerAliasQuoted}.amount, 0) as ${quote(alias)}` : `${outerAliasQuoted}.amount as ${alias}`,
			joins: [join]
		};

		function getForeignKeys(relation) {
			let columns;
			let alias = quote('x1');
			if (relation.joinRelation)
				columns = relation.joinRelation.columns;
			else
				columns = relation.childTable._primaryColumns;
			return columns.map(x => `${alias}.${quote(x._dbName)}`).join(',');
		}
	}

	function createOnClause(context, relation, rightAlias) {
		var c = {};
		var sql = '';
		let leftAlias = relation.parentTable._rootAlias || relation.parentTable._dbName;

		c.visitJoin = function(relation) {
			sql = newJoinCore(context, relation.childTable, relation.columns, relation.childTable._primaryColumns, leftAlias, rightAlias).sql();
		};

		c.visitOne = function(relation) {
			innerJoin(relation);
		};

		c.visitMany = c.visitOne;

		function innerJoin(relation) {
			var joinRelation = relation.joinRelation;
			var childTable = relation.childTable;
			var parentTable = relation.parentTable;
			var columns = joinRelation.columns;

			sql = newJoinCore(context, childTable, parentTable._primaryColumns, columns, leftAlias, rightAlias).sql();
		}

		relation.accept(c);
		return sql;
	}



	columnAggregateGroup = columnAggregate;
	return columnAggregateGroup;
}

var joinSqlArray;
var hasRequiredJoinSqlArray;

function requireJoinSqlArray () {
	if (hasRequiredJoinSqlArray) return joinSqlArray;
	hasRequiredJoinSqlArray = 1;
	const newShallowJoinSql = requireNewShallowJoinSql();

	function _new(context, relations) {

		let result = [];
		let leftAlias =  relations[0].parentTable._dbName;
		let rightAlias = 'z';
		let sql;


		let c = {};
		c.visitJoin = function(relation) {
			sql = newShallowJoinSql(context, relation.childTable,relation.columns,relation.childTable._primaryColumns,leftAlias,rightAlias).prepend(' LEFT').sql();
		};

		c.visitOne = function(relation) {
			sql = newShallowJoinSql(context, relation.childTable,relation.parentTable._primaryColumns,relation.joinRelation.columns,leftAlias,rightAlias).prepend(' LEFT').sql();
		};

		c.visitMany = c.visitOne;

		for (let i = 0; i < relations.length; i++) {
			rightAlias = rightAlias + relations[i].toLeg().name;
			relations[i].accept(c);
			result.push(sql);
			leftAlias = rightAlias;
		}

		return result;
	}

	joinSqlArray = _new;
	return joinSqlArray;
}

var columnAggregate_1;
var hasRequiredColumnAggregate;

function requireColumnAggregate () {
	if (hasRequiredColumnAggregate) return columnAggregate_1;
	hasRequiredColumnAggregate = 1;
	const getSessionSingleton = requireGetSessionSingleton();
	var newJoinArray = requireJoinSqlArray();

	function columnAggregate(context, operator, column, relations, coalesce = true) {
		const quote = getSessionSingleton(context, 'quote');

		let tableAlias = relations.reduce((prev,relation) => {
			return prev + relation.toLeg().name;
		}, 'z');
		tableAlias = quote(tableAlias);
		const columnName = quote(column._dbName);

		return {
			expression: (alias) => coalesce ? `COALESCE(${operator}(${tableAlias}.${columnName}), 0) as ${quote(alias)}` : `${operator}(${tableAlias}.${columnName}) as ${quote(alias)}`,

			joins: newJoinArray(context, relations)
		};
	}

	columnAggregate_1 = columnAggregate;
	return columnAggregate_1;
}

var childColumn_1;
var hasRequiredChildColumn;

function requireChildColumn () {
	if (hasRequiredChildColumn) return childColumn_1;
	hasRequiredChildColumn = 1;
	var newJoin = requireJoinSql();
	var getSessionContext = requireGetSessionContext();
	var newJoinCore = requireNewShallowJoinSqlCore();
	const getSessionSingleton = requireGetSessionSingleton();
	const _quote = requireQuote$2();


	function childColumn(context, column, relations) {
		const quote = getSessionSingleton(context, 'quote');
		const rdb = getSessionContext(context);
		const outerAlias = 'y' + rdb.aggregateCount++;
		const outerAliasQuoted = quote(outerAlias);
		const alias = 'x' + relations.length;
		const foreignKeys = getForeignKeys(context, relations[0]);
		const select = ` LEFT JOIN (SELECT ${foreignKeys},${alias}.${quote(column._dbName)} as prop`;
		const innerJoin = relations.length > 1 ? newJoin(context, relations).sql() : '';
		const onClause = createOnClause(context, relations[0], outerAlias);
		const from = ` FROM ${quote(relations.at(-1).childTable._dbName)} ${alias} ${innerJoin}) ${outerAliasQuoted} ON (${onClause})`;
		const join = select  + from ;

		return {
			expression: (alias) => `${outerAliasQuoted}.prop ${quote(alias)}`,
			joins: [join],
			column,
			groupBy:  `${outerAliasQuoted}.prop`,
		};
	}

	function createOnClause(context, relation, rightAlias) {
		var c = {};
		var sql = '';
		let leftAlias = relation.parentTable._rootAlias || relation.parentTable._dbName;

		c.visitJoin = function(relation) {
			sql = newJoinCore(context, relation.childTable,relation.columns,relation.childTable._primaryColumns,leftAlias,rightAlias).sql();
		};

		c.visitOne = function(relation) {
			innerJoin(relation);
		};

		c.visitMany = c.visitOne;

		function innerJoin(relation) {
			var joinRelation = relation.joinRelation;
			var childTable = relation.childTable;
			var parentTable = relation.parentTable;
			var columns = joinRelation.columns;

			sql = newJoinCore(context, childTable,parentTable._primaryColumns,columns,leftAlias, rightAlias).sql();
		}
		relation.accept(c);
		return sql;
	}

	function getForeignKeys(context, relation) {
		let columns;
		let alias = 'x1';
		if (relation.joinRelation)
			columns = relation.joinRelation.columns;
		else
			columns = relation.childTable._primaryColumns;
		return columns.map(x => `${alias}.${_quote(context, x._dbName)}`).join(',');
	}

	childColumn_1 = childColumn;
	return childColumn_1;
}

var newFilterArg_1;
var hasRequiredNewFilterArg;

function requireNewFilterArg () {
	if (hasRequiredNewFilterArg) return newFilterArg_1;
	hasRequiredNewFilterArg = 1;
	var newJoin = requireJoinSql();
	var newWhere = requireWhereSql();
	var newParameterized = requireNewParameterized();
	var quote = requireQuote$2();

	function newFilterArg(context, column, relations, depth = 0) {
		var relationCount = relations.length;
		var alias = 'x' + relationCount;
		var table = relations[relationCount - 1].childTable;

		var quotedAlias = quote(context, alias);
		var quotedColumn = quote(context, column._dbName);
		var quotedTable = quote(context, table._dbName);
		var select = newParameterized(`(SELECT ${quotedAlias}.${quotedColumn} FROM ${quotedTable} ${quotedAlias}`);
		var join = newJoin(context, relations, depth);
		var where = newWhere(context, relations, null, depth);
		return select.append(join).append(where).append(')');
	}

	newFilterArg_1 = newFilterArg;
	return newFilterArg_1;
}

var relatedColumn;
var hasRequiredRelatedColumn;

function requireRelatedColumn () {
	if (hasRequiredRelatedColumn) return relatedColumn;
	hasRequiredRelatedColumn = 1;
	var newSubFilter = requireSubFilter();
	var aggregateGroup = requireColumnAggregateGroup();
	var aggregate = requireColumnAggregate();
	var childColumn = requireChildColumn();
	var newFilterArg = requireNewFilterArg();

	function newRelatedColumn(column, relations, isShallow, depth) {
		var c = {};

		var alias = 'x' + relations.length;
		for (var propName in column) {
			var prop = column[propName];
			if (prop instanceof Function)

				c[propName] = wrapFilter(prop);
		}

		c.groupSum = (context, ...rest) => aggregateGroup.apply(null, [context, 'sum', column, relations, ...rest]);
		c.groupAvg = (context, ...rest) => aggregateGroup.apply(null, [context, 'avg', column, relations, ...rest]);
		c.groupMin = (context, ...rest) => aggregateGroup.apply(null, [context, 'min', column, relations, false, ...rest]);
		c.groupMax = (context, ...rest) => aggregateGroup.apply(null, [context, 'max', column, relations, false, ...rest]);
		c.groupCount = (context, ...rest) => aggregateGroup.apply(null, [context, 'count', column, relations, false, ...rest]);
		c.sum = (context, ...rest) => aggregate.apply(null, [context, 'sum', column, relations, ...rest]);
		c.avg = (context, ...rest) => aggregate.apply(null, [context, 'avg', column, relations, ...rest]);
		c.min = (context, ...rest) => aggregate.apply(null, [context, 'min', column, relations, false, ...rest]);
		c.max = (context, ...rest) => aggregate.apply(null, [context, 'max', column, relations, false, ...rest]);
		c.count = (context, ...rest) => aggregate.apply(null, [context, 'count', column, relations, false, ...rest]);
		c.self = (context, ...rest) => childColumn.apply(null, [context, column, relations, ...rest]);
		Object.defineProperty(c, '_toFilterArg', {
			value: toFilterArg,
			enumerable: false,
			writable: false
		});

		return c;

		function toFilterArg(context) {
			return newFilterArg(context, column, relations, depth);
		}

		function wrapFilter(filter) {
			return runFilter;

			function runFilter(context) {
				var args = [];
				for (var i = 0; i < arguments.length; i++) {
					args.push(arguments[i]);
				}
				args.push(alias);
				var shallowFilter = filter.apply(null, args);
				if (isShallow)
					return shallowFilter;
				return newSubFilter(context, relations, shallowFilter, depth);
			}
		}

	}

	relatedColumn = newRelatedColumn;
	return relatedColumn;
}

var any;
var hasRequiredAny;

function requireAny () {
	if (hasRequiredAny) return any;
	hasRequiredAny = 1;
	const negotiateRawSqlFilter = requireNegotiateRawSqlFilter();
	let subFilter = requireSubFilter();
	let isShallow = true;

	function newAny(newRelatedTable, relations, depth) {

		function any(context, fn) {
			let relatedTable = newRelatedTable(relations, isShallow, depth + 1);
			let arg = typeof fn === 'function' ? fn(relatedTable) : fn;
			let filter = negotiateRawSqlFilter(context, arg);
			let sub =  subFilter(context, relations, filter, depth);
			return sub;
		}
		return any;
	}

	any = newAny;

	//
	// let newRelatedTable = _newRelatedTable;
	// let negotiateRawSqlFilter = require('../column/negotiateRawSqlFilter');
	// let newSelect = require('./selectSql');
	// let newJoin = require('./joinSql');
	// let newWhere = require('./whereSql');
	// let subFilter = require('./subFilter');
	// let isShallow = true;

	// function newAny(relations, depth) {

	// 	function any(fn) {
	// 		let relationCount = relations.length;
	// 		let alias = 'x' + (depth);
	// 		// let alias = 'x' + relationCount;
	// 		let table = relations[relationCount - 1].childTable;
	// 		let exists = newSelect(table, alias).prepend('EXISTS (');
	// 		let join = newJoin(relations, depth);

	// 		let relatedTable = newRelatedTable(relations.slice(-1), isShallow, depth+1);
	// 		let arg = typeof fn === 'function' ? fn(relatedTable) : fn; //we need inner joins from here
	// 		let filter = negotiateRawSqlFilter(arg);
	// 		let where = newWhere(relations[0],filter, depth);
	// 		return exists.append(join).append(where).append(')');


	// 		// let innerJoin = newJoinSql(relations);
	// 		// let relatedTable = newRelatedTable(relations.slice(-1), isShallow);
	// 		// //relations is missing anything below any(..)
	// 		// let arg = typeof fn === 'function' ? fn(relatedTable) : fn; //we need inner joins from here
	// 		// let filter = negotiateRawSqlFilter(arg);
	// 		// let sqlFilter = filter.sql();
	// 		// //_3.id is not null
	// 		// return subFilter(relations.slice(-1), filter);
	// 	}
	// 	return any;
	// 	// db.order.lines.any(x => x.order.deliveryAddress.id.notEqual(null));
	// }

	// function _newRelatedTable() {
	// 	newRelatedTable = require('../newRelatedTable');
	// 	return newRelatedTable.apply(null, arguments);
	// }

	// module.exports = newAny;
	return any;
}

var all;
var hasRequiredAll;

function requireAll () {
	if (hasRequiredAll) return all;
	hasRequiredAll = 1;
	const negotiateRawSqlFilter = requireNegotiateRawSqlFilter();
	let subFilter = requireSubFilter();
	let isShallow = true;

	function newAll(newRelatedTable, relations, depth) {

		function all(context, fn) {
			let relatedTable = newRelatedTable(relations, isShallow, depth + 1);
			let arg = typeof fn === 'function' ? fn(relatedTable) : fn;
			let anyFilter = negotiateRawSqlFilter(context, arg);
			let anySubFilter = subFilter(context, relations, anyFilter, depth);
			let notFilter = subFilter(context, relations, anyFilter.not(), depth).not();
			return anySubFilter.and(context, notFilter);
		}
		return all;
	}

	all = newAll;
	return all;
}

var where$1;
var hasRequiredWhere$1;

function requireWhere$1 () {
	if (hasRequiredWhere$1) return where$1;
	hasRequiredWhere$1 = 1;
	const negotiateRawSqlFilter = requireNegotiateRawSqlFilter();

	function newWhere(_relations, _depth) {

		function where(context, fn) {
			let { relations, alias } = extract(_relations);
			const table = relations[relations.length - 1].childTable;
			if (!relations[0].isMany)
				table._rootAlias = alias;

			try {
				let arg = typeof fn === 'function' ? fn(table) : fn;
				let anyFilter = negotiateRawSqlFilter(context, arg, table, true);
				delete table._rootAlias;
				return anyFilter;
			}
			catch (e) {
				delete table._rootAlias;
				throw e;
			}
		}
		return where;

		function extract(relations) {
			let alias = relations[0].toLeg().table._dbName;
			let result = [];
			for (let i = 0; i < relations.length; i++) {
				if (relations[i].isMany) {
					result = [relations[i]];
					alias = relations[i].toLeg().table._dbName;
				}
				else {
					result.push(relations[i]);
					alias += relations[i].toLeg().name;
				}
			}
			return { relations: result, alias };
		}

	}

	where$1 = newWhere;
	return where$1;
}

var aggregate$1;
var hasRequiredAggregate$1;

function requireAggregate$1 () {
	if (hasRequiredAggregate$1) return aggregate$1;
	hasRequiredAggregate$1 = 1;
	function newAggregate(_relations) {

		function aggregate(context, fn) {
			let { relations, alias } = extract(_relations);
			const table = relations[relations.length - 1].childTable;
			if (!relations[0].isMany)
				table._rootAlias = alias;

			try {
				const query = fn(table);
				delete table._rootAlias;
				return query;
			}
			catch (e) {
				delete table._rootAlias;
				throw e;
			}
		}
		return aggregate;

		function extract(relations) {
			let alias = relations[0].toLeg().table._dbName;
			let result = [];
			for (let i = 0; i < relations.length; i++) {
				if (relations[i].isMany) {
					result = [relations[i]];
					alias = relations[i].toLeg().table._dbName;
				}
				else {
					result.push(relations[i]);
					alias += relations[i].toLeg().name;
				}
			}
			return { relations: result, alias };
		}

	}

	aggregate$1 = newAggregate;
	return aggregate$1;
}

var none;
var hasRequiredNone;

function requireNone () {
	if (hasRequiredNone) return none;
	hasRequiredNone = 1;
	const negotiateRawSqlFilter = requireNegotiateRawSqlFilter();
	let subFilter = requireSubFilter();
	let isShallow = true;

	function newNone(newRelatedTable, relations, depth) {

		function none(context, fn) {
			let relatedTable = newRelatedTable(relations, isShallow, depth + 1);
			let arg = typeof fn === 'function' ? fn(relatedTable) : fn;
			let filter = negotiateRawSqlFilter(context, arg);
			return subFilter(context, relations, filter, depth).not();
		}
		return none;
	}

	none = newNone;
	return none;
}

var count;
var hasRequiredCount$1;

function requireCount$1 () {
	if (hasRequiredCount$1) return count;
	hasRequiredCount$1 = 1;
	const negotiateRawSqlFilter = requireNegotiateRawSqlFilter();
	const newJoin = requireJoinSql();
	const newWhere = requireWhereSql();
	const getSessionSingleton = requireGetSessionSingleton();
	const newParameterized = requireNewParameterized();
	const newBoolean = requireNewBoolean();

	const nullOperator = ' is ';
	const notNullOperator = ' is not ';
	const isShallow = true;

	function newCount(newRelatedTable, relations, depth) {

		function count(context, fn) {
			let shallowFilter;

			if (fn !== undefined) {
				let relatedTable = newRelatedTable(relations, isShallow, depth + 1);
				let arg = typeof fn === 'function' ? fn(relatedTable) : fn;
				shallowFilter = negotiateRawSqlFilter(context, arg);
			}

			const subQuery = newCountSubQuery(context, relations, shallowFilter, depth);
			return newCountFilter(subQuery);
		}

		return count;
	}

	function newCountSubQuery(context, relations, shallowFilter, depth) {
		const quote = getSessionSingleton(context, 'quote');
		const relationCount = relations.length;
		const alias = 'x' + relationCount;
		const table = relations[relationCount - 1].childTable;
		const select = newParameterized(`SELECT COUNT(*) FROM ${quote(table._dbName)} ${quote(alias)}`);
		const join = newJoin(context, relations, depth);
		const where = newWhere(context, relations, shallowFilter, depth);

		return select.append(join).append(where);
	}

	function newCountFilter(subQuery) {
		let c = {};

		c.equal = function(context, arg) {
			return compare(context, '=', arg);
		};

		c.notEqual = function(context, arg) {
			return compare(context, '<>', arg);
		};

		c.lessThan = function(context, arg) {
			return compare(context, '<', arg);
		};

		c.lessThanOrEqual = function(context, arg) {
			return compare(context, '<=', arg);
		};

		c.greaterThan = function(context, arg) {
			return compare(context, '>', arg);
		};

		c.greaterThanOrEqual = function(context, arg) {
			return compare(context, '>=', arg);
		};

		c.between = function(context, from, to) {
			from = c.greaterThanOrEqual(context, from);
			to = c.lessThanOrEqual(context, to);
			return from.and(context, to);
		};

		c.in = function(context, values) {
			if (values.length === 0)
				return newBoolean(newParameterized('1=2'));

			let sqlParts = new Array(values.length);
			let params = [];
			for (let i = 0; i < values.length; i++) {
				const encoded = encodeArg(context, values[i]);
				sqlParts[i] = encoded.sql();
				params = params.concat(encoded.parameters);
			}

			const sql = toSubQuery().sql() + ' in (' + sqlParts.join(',') + ')';
			const allParams = toSubQuery().parameters.concat(params);
			return newBoolean(newParameterized(sql, allParams));
		};

		c.notIn = function(context, values) {
			return c.in(context, values).not(context);
		};

		c.eq = c.equal;
		c.EQ = c.eq;
		c.ne = c.notEqual;
		c.NE = c.ne;
		c.gt = c.greaterThan;
		c.GT = c.gt;
		c.ge = c.greaterThanOrEqual;
		c.GE = c.ge;
		c.lt = c.lessThan;
		c.LT = c.lt;
		c.le = c.lessThanOrEqual;
		c.LE = c.le;
		c.IN = c.in;

		return c;

		function compare(context, operator, arg) {
			let encoded = encodeArg(context, arg);
			let operatorSql = ' ' + operator + ' ';
			if (encoded.sql() === 'null') {
				if (operator === '=')
					operatorSql = nullOperator;
				else if (operator === '<>')
					operatorSql = notNullOperator;
			}

			let sql = toSubQuery().append(operatorSql).append(encoded);
			return newBoolean(sql);
		}

		function encodeArg(context, arg) {
			if (arg && typeof arg._toFilterArg === 'function')
				return arg._toFilterArg(context);
			if (arg == null)
				return newParameterized('null');
			return newParameterized('?', [arg]);
		}

		function toSubQuery() {
			return subQuery.prepend('(').append(')');
		}
	}

	count = newCount;
	return count;
}

var newRelatedTable_1;
var hasRequiredNewRelatedTable;

function requireNewRelatedTable () {
	if (hasRequiredNewRelatedTable) return newRelatedTable_1;
	hasRequiredNewRelatedTable = 1;
	var newRelatedColumn = requireRelatedColumn();
	var subFilter = requireSubFilter();
	var any = requireAny();
	var all = requireAll();
	var where = requireWhere$1();
	var aggregate = requireAggregate$1();
	var none = requireNone();
	var count = requireCount$1();

	function newRelatedTable(relations, isShallow, depth = 0) {
		var table = relations[relations.length - 1].childTable;
		var columns = table._columns;

		let c;
		// if (isShallow)
		// 	c = any(relations.slice(-1), depth);
		// else
		c = any(newRelatedTable, relations, depth);
		// @ts-ignore
		c.all = all(newRelatedTable, relations, depth);
		// @ts-ignore
		c.any = c;

		// @ts-ignore
		c.none = none(newRelatedTable, relations, depth);

		// @ts-ignore
		c.where =  where(relations, depth);

		// @ts-ignore
		c.count = count(newRelatedTable, relations, depth);

		// @ts-ignore
		c._aggregate = aggregate(relations);

		Object.defineProperty(c, '_relation', {
			value: relations[relations.length - 1],
			writable: false
		});

		for (var i = 0; i < columns.length; i++) {
			var col = columns[i];
			if (col.alias === 'name')
				c._name = newRelatedColumn(col, relations, isShallow, depth);
			else
				c[col.alias] = newRelatedColumn(col, relations, isShallow, depth);
		}
		defineChildren();

		function defineChildren() {
			var childRelations = table._relations;
			for (var alias in childRelations) {
				defineChild(alias);
			}
		}

		function defineChild(alias) {
			var relation = table._relations[alias];
			var children = relations.slice(0);
			children.push(relation);

			Object.defineProperty(c, alias, {
				get: function() {
					return newRelatedTable(children, false, depth);
				}
			});
		}


		// @ts-ignore
		c.exists = function(context) {
			if (isShallow)
				return '';
			return subFilter(context, relations, false, depth);
		};

		let cProxy = new Proxy(c, {
			get: function(target, prop) {
				if (prop === 'name') {
					return target._name !== undefined ? target._name : target.name;
				}
				return target[prop];
			},
			set: function(target, prop, value) {
				if (prop === 'name') {
					target._name = value;
				} else {
					target[prop] = value;
				}
				return true;
			}
		});

		return cProxy;
	}

	newRelatedTable_1 = newRelatedTable;
	return newRelatedTable_1;
}

var join;
var hasRequiredJoin;

function requireJoin () {
	if (hasRequiredJoin) return join;
	hasRequiredJoin = 1;
	var newJoinRelation = requireNewJoinRelation();
	var newRelatedTable = requireNewRelatedTable();

	function newJoin(parentTable, childTable) {
		var c = {};
		var columnNames = [];
		var relation;

		c.by = function() {
			for (var i = 0; i < arguments.length; i++) {
				columnNames.push(getColumnName(arguments[i]));
			}
			relation = newJoinRelation(parentTable, childTable, columnNames);
			relation.as = c.as;
			return relation;
		};

		function getColumnName(columnName) {
			var columns = parentTable._columns;
			for (var i = 0; i < columns.length; i++) {
				if (columns[i]._dbName === columnName || columns[i].alias === columnName)
					return columns[i]._dbName;
			}
			throw new Error('Unknown column: ' + columnName);
		}

		c.as = function(alias) {
			relation.leftAlias = alias;
			parentTable._relations[alias] = relation;

			Object.defineProperty(parentTable, alias, {
				get: function() {
					return newRelatedTable([relation]);
				}
			});

			return relation;
		};

		c.notNullExceptInsert = function() {
			return c;
		};

		c.notNull = function() {
			return c;
		};

		return c;
	}

	join = newJoin;
	return join;
}

var newOneLeg;
var hasRequiredNewOneLeg;

function requireNewOneLeg () {
	if (hasRequiredNewOneLeg) return newOneLeg;
	hasRequiredNewOneLeg = 1;
	var newCollection = requireNewCollection();
	var newQueryContext = requireNewQueryContext();

	function newLeg(relation) {

		var joinRelation = relation.joinRelation;
		var c = {};
		c.name = joinRelation.rightAlias;
		var span = {};
		span.queryContext = newQueryContext();
		span.table = joinRelation.parentTable;
		span.legs = newCollection();
		c.span = span;
		c.table = joinRelation.childTable;
		c.columns = joinRelation.columns;
		c.expand = relation.expand;

		c.accept = function(visitor) {
			return visitor.visitOne(c);
		};

		return c;
	}

	newOneLeg = newLeg;
	return newOneLeg;
}

var newManyLeg;
var hasRequiredNewManyLeg;

function requireNewManyLeg () {
	if (hasRequiredNewManyLeg) return newManyLeg;
	hasRequiredNewManyLeg = 1;
	var newOneLeg = requireNewOneLeg();

	function newLeg(relation) {
		var c = newOneLeg(relation);
		c.name = relation.joinRelation.rightAlias;
		c.accept = function(visitor) {
			return visitor.visitMany(c);
		};

		c.expand = relation.expand;

		return c;
	}

	newManyLeg = newLeg;
	return newManyLeg;
}

var extractParentKey_1;
var hasRequiredExtractParentKey;

function requireExtractParentKey () {
	if (hasRequiredExtractParentKey) return extractParentKey_1;
	hasRequiredExtractParentKey = 1;
	function extractParentKey(joinRelation, child) {

		var childTable = joinRelation.childTable;
		var primaryColumns = childTable._primaryColumns;
		var parent = {};

		joinRelation.columns.forEach(addKeyToParent);

		function addKeyToParent(childPk, index) {
			var primaryColumn = primaryColumns[index];
			parent[primaryColumn.alias] = child[childPk.alias];
		}

		return parent;
	}

	extractParentKey_1 = extractParentKey;
	return extractParentKey_1;
}

var synchronizeChanged_1;
var hasRequiredSynchronizeChanged;

function requireSynchronizeChanged () {
	if (hasRequiredSynchronizeChanged) return synchronizeChanged_1;
	hasRequiredSynchronizeChanged = 1;
	var extractParentKey = requireExtractParentKey();

	function synchronizeChanged(context, manyCache, joinRelation, parent, child) {
		var columns = joinRelation.columns;
		columns.forEach(subscribeColumn);
		child = null;

		function subscribeColumn(column) {
			child.subscribeChanged(onChanged, column.alias);
		}

		function unsubscribe(child) {
			columns.forEach(unsubscribeColumn);

			function unsubscribeColumn(column) {
				child.unsubscribeChanged(onChanged, column.alias);
			}
		}

		function onChanged(child) {
			unsubscribe(child);
			manyCache.tryRemove(context, parent, child);
			var newParent = extractParentKey(joinRelation, child);
			manyCache.tryAdd(context, newParent, child);
		}



	}

	synchronizeChanged_1 = synchronizeChanged;
	return synchronizeChanged_1;
}

var synchronizeAdded_1;
var hasRequiredSynchronizeAdded;

function requireSynchronizeAdded () {
	if (hasRequiredSynchronizeAdded) return synchronizeAdded_1;
	hasRequiredSynchronizeAdded = 1;
	var extractParentKey = requireExtractParentKey();

	function synchronizeAdded(context, action, joinRelation) {
		var cache = joinRelation.parentTable._cache;
		cache.subscribeAdded(context, onAdded);

		function onAdded(child) {
			var parent = extractParentKey(joinRelation, child);
			action(parent, child);
		}
	}

	synchronizeAdded_1 = synchronizeAdded;
	return synchronizeAdded_1;
}

var synchronizeRemoved_1;
var hasRequiredSynchronizeRemoved;

function requireSynchronizeRemoved () {
	if (hasRequiredSynchronizeRemoved) return synchronizeRemoved_1;
	hasRequiredSynchronizeRemoved = 1;
	var extractParentKey = requireExtractParentKey();

	function synchronizeRemoved(context, action, joinRelation) {
		var cache = joinRelation.parentTable._cache;
		cache.subscribeRemoved(context, onRemoved);

		function onRemoved(child) {
			var parent = extractParentKey(joinRelation, child);
			action(parent, child);
		}
	}

	synchronizeRemoved_1 = synchronizeRemoved;
	return synchronizeRemoved_1;
}

var newCache;
var hasRequiredNewCache;

function requireNewCache () {
	if (hasRequiredNewCache) return newCache;
	hasRequiredNewCache = 1;
	var newEmitEvent = requireEmitEvent();

	function cacheCore() {
		var emitAdded = newEmitEvent();
		var emitRemoved = newEmitEvent();
		var c = {};
		var cache = {};
		var keyLength;

		c.tryGet = function(key) {
			var index = 0;
			var keyLength = key.length;

			return tryGetCore(cache, index);

			function tryGetCore(cache, index) {
				var keyValue = key[index];
				var cacheValue = cache[keyValue];
				if (typeof cacheValue === 'undefined')
					return null;
				if (keyLength - 1 === index)
					return cacheValue;
				return tryGetCore(cache[keyValue], ++index);
			}

		};

		c.tryAdd = function(key, result) {
			var index = 0;
			keyLength = key.length;

			return  addCore(cache, index);

			function addCore(cache, index) {
				var keyValue = key[index];

				if (keyLength - 1 === index) {
					if (keyValue in cache)
						return cache[keyValue];

					cache[keyValue] = result;
					emitAdded(result);
					return result;
				}
				if (! (keyValue in cache))
					cache[keyValue] = {};
				return addCore(cache[keyValue], ++index);
			}
		};

		c.tryRemove = function(key) {
			var index = 0;
			var keyLength = key.length;

			return tryRemoveCore(cache, index);

			function tryRemoveCore(cache, index) {
				var keyValue = key[index];
				if (!(keyValue in cache))
					return null;
				var cacheValue = cache[keyValue];
				if (keyLength - 1 === index) {
					delete cache[keyValue];
					emitRemoved(cacheValue);
					return cacheValue;
				}

				return tryRemoveCore(cache[keyValue], ++index);
			}

		};

		c.getAll = function() {
			var index = 0;
			var result = [];
			getAllCore(cache, index);

			function getAllCore(cache, index) {
				for (var name in cache) {
					var value = cache[name];
					if (index === keyLength - 1)
						result.push(value);
					else
						getAllCore(value, index+1);
				}
			}
			return result;
		};

		c.subscribeAdded = emitAdded.add;
		c.subscribeRemoved = emitRemoved.add;

		return c;
	}

	newCache = cacheCore;
	return newCache;
}

var newManyCacheCore;
var hasRequiredNewManyCacheCore;

function requireNewManyCacheCore () {
	if (hasRequiredNewManyCacheCore) return newManyCacheCore;
	hasRequiredNewManyCacheCore = 1;
	var newCacheCore = requireNewCache();
	var newRowArray = requireRowArray();

	function newManyCache(joinRelation) {
		var c = {};
		var cache = newCacheCore();
		var primaryColumns = joinRelation.childTable._primaryColumns;

		c.tryGet = function(parentRow) {
			var key = toKey(parentRow);
			var rows =  cache.tryGet(key);
			if (!rows)
				return newArray();
			return rows;
		};

		function tryAdd(parentRow, childRow) {
			var key = toKey(parentRow);
			var existing = cache.tryGet(key);
			if(existing) {
				existing.push(childRow);
				return;
			}
			var rows = newArray();
			rows.push(childRow);
			cache.tryAdd(key, rows);
		}

		function newArray() {
			return newRowArray(joinRelation.parentTable);
		}

		c.tryAdd = tryAdd;

		c.tryRemove = function(parentRow, childRow) {
			var key = toKey(parentRow);
			var existing = cache.tryGet(key);
			var index = existing.indexOf(childRow);
			existing.splice(index,1);
		};

		function toKey(row) {
			return primaryColumns.map(onColumn);

			function onColumn(column) {
				return row[column.alias];
			}
		}

		return c;
	}

	newManyCacheCore = newManyCache;
	return newManyCacheCore;
}

var newId;
var hasRequiredNewId;

function requireNewId () {
	if (hasRequiredNewId) return newId;
	hasRequiredNewId = 1;
	newId = requireNewMemoryId();
	return newId;
}

var getSessionCache_1;
var hasRequiredGetSessionCache;

function requireGetSessionCache () {
	if (hasRequiredGetSessionCache) return getSessionCache_1;
	hasRequiredGetSessionCache = 1;
	const getSessionSingleton = requireGetSessionSingleton();

	function getSessionCache(context, id) {
		const cache = getSessionSingleton(context, 'cache');
		return cache[id];
	}

	getSessionCache_1 = getSessionCache;
	return getSessionCache_1;
}

var setSessionCache_1;
var hasRequiredSetSessionCache;

function requireSetSessionCache () {
	if (hasRequiredSetSessionCache) return setSessionCache_1;
	hasRequiredSetSessionCache = 1;
	const getSessionSingleton = requireGetSessionSingleton();

	function setSessionCache(context, id, value) {
		const cache = getSessionSingleton(context, 'cache');
		cache[id] = value;
	}

	setSessionCache_1 = setSessionCache;
	return setSessionCache_1;
}

var newManyCache_1;
var hasRequiredNewManyCache;

function requireNewManyCache () {
	if (hasRequiredNewManyCache) return newManyCache_1;
	hasRequiredNewManyCache = 1;
	var synchronizeChanged = requireSynchronizeChanged();
	var synchronizeAdded = requireSynchronizeAdded();
	var synchronizeRemoved = requireSynchronizeRemoved();
	var extractParentKey = requireExtractParentKey();
	var newCacheCore = requireNewManyCacheCore();
	var newId = requireNewId();
	var getSessionCache = requireGetSessionCache();
	var setSessionCache = requireSetSessionCache();

	function newManyCache(joinRelation) {
		var c = {};
		var key;

		c.tryAdd = function(context, parent, child) {
			c.getInnerCache(context).tryAdd(parent, child);
			synchronizeChanged(context, c, joinRelation, parent, child);
		};

		c.tryRemove = function(context, parent, child) {
			c.getInnerCache(context).tryRemove(parent, child);
		};

		c.tryGet = function(context, parentRow) {
			return c.getInnerCache(context).tryGet(parentRow);
		};

		c.getInnerCache = function(context) {
			const theKey = negotiateKey();
			var cache = getSessionCache(context, theKey);
			if (!cache) {
				cache = newCacheCore(joinRelation);
				setSessionCache(context, theKey, cache);
				fillCache(context);
				synchronizeAdded(context, c.tryAdd.bind(null, context), joinRelation);
				synchronizeRemoved(context, c.tryRemove.bind(null, context), joinRelation);
			}
			return cache;
		};


		function fillCache(context) {
			var childTable = joinRelation.parentTable;
			var childCache = childTable._cache;
			var children = childCache.getAll(context);
			children.forEach(addToCache);

			function addToCache(child) {
				var parent = extractParentKey(joinRelation, child);
				c.tryAdd(context, parent, child);
			}
		}

		function negotiateKey() {
			if (key)
				return key;
			key = newId();
			return key;

		}


		return c;
	}

	newManyCache_1 = newManyCache;
	return newManyCache_1;
}

var newForeignKeyFilter_1;
var hasRequiredNewForeignKeyFilter;

function requireNewForeignKeyFilter () {
	if (hasRequiredNewForeignKeyFilter) return newForeignKeyFilter_1;
	hasRequiredNewForeignKeyFilter = 1;
	function newForeignKeyFilter(context, joinRelation, parentRow) {
		var columns = joinRelation.columns;
		var rightTable = joinRelation.childTable;

		var filter = getNextFilterPart(0);

		for (var i = 1; i < columns.length; i++) {

			filter = filter.and(getNextFilterPart(i));
		}

		function getNextFilterPart(index) {
			var column = columns[index];
			var pk = rightTable._primaryColumns[index];
			return column.eq(context, parentRow[pk.alias]);
		}
		return filter;
	}

	newForeignKeyFilter_1 = newForeignKeyFilter;
	return newForeignKeyFilter_1;
}

var getRelatives_1;
var hasRequiredGetRelatives;

function requireGetRelatives () {
	if (hasRequiredGetRelatives) return getRelatives_1;
	hasRequiredGetRelatives = 1;
	let emptyFilter = requireEmptyFilter();
	let newForeignKeyFilter = requireNewForeignKeyFilter();
	let negotiateExpandInverse = requireNegotiateExpandInverse();

	function getRelatives(context, parent, relation) {
		let queryContext = parent.queryContext;
		let strategy = queryContext && queryContext.strategy[relation.joinRelation.rightAlias];


		let filter;
		let parentTable = relation.joinRelation.childTable;

		if (parentTable._primaryColumns.length === 1)
			filter = createInFilter();
		else
			filter = createCompositeFilter();


		function createInFilter() {
			let parentAlias = parentTable._primaryColumns[0].alias;
			let ids = queryContext.rows.map(function(row) {
				return row[parentAlias];
			});
			let column = relation.joinRelation.columns[0];
			return column.in(context, ids);
		}

		function createCompositeFilter() {
			let filters = queryContext.rows.map(function(row) {
				return newForeignKeyFilter(context, relation.joinRelation, row);
			});
			return emptyFilter.or.apply(emptyFilter, [context, ...filters]);
		}

		return relation.childTable.getMany(context, filter, strategy).then(onRows);

		function onRows(rows) {
			queryContext.expand(relation);
			negotiateExpandInverse(parent, relation, rows);
			return rows;
		}

	}

	getRelatives_1 = getRelatives;
	return getRelatives_1;
}

var newManyRelation_1;
var hasRequiredNewManyRelation;

function requireNewManyRelation () {
	if (hasRequiredNewManyRelation) return newManyRelation_1;
	hasRequiredNewManyRelation = 1;
	var newLeg = requireNewManyLeg();
	var newManyCache = requireNewManyCache();
	var newForeignKeyFilter = requireNewForeignKeyFilter();
	var getRelatives = requireGetRelatives();
	var fuzzyPromise = requireFuzzyPromise();
	var newGetRelated = requireNewGetRelated();

	function newManyRelation(joinRelation) {
		var c = {};
		var manyCache = newManyCache(joinRelation);

		c.joinRelation = joinRelation;
		c.childTable = joinRelation.parentTable;
		c.parentTable = joinRelation.childTable;
		c.isMany = true;

		c.accept = function(visitor) {
			visitor.visitMany(c);
		};

		c.getFromCache = function(parent) {
			var result = c.getRowsSync(parent);
			return fuzzyPromise(result);
		};

		c.getFromDb = function(context, parent) {
			var filter = newForeignKeyFilter(context, joinRelation, parent);
			return c.childTable.getMany(context, filter, null);
		};

		c.getRelatives = function(context, parent) {
			return getRelatives(context, parent, c);
		};

		c.toGetRelated = function(context, parent) {
			return newGetRelated(context, parent, c);
		};

		c.expand = function(parent) {
			return parent.expand(joinRelation.rightAlias);
		};

		c.getRowsSync = function(parent) {
			let cache = parent._relationCacheMap.get(c);
			if (!cache)
				return [];
			return cache.tryGet(parent);
		};

		c.toLeg = function() {
			return newLeg(c);
		};

		c.getInnerCache = function(context) {
			return manyCache.getInnerCache(context);
		};

		return c;
	}

	newManyRelation_1 = newManyRelation;
	return newManyRelation_1;
}

var hasMany;
var hasRequiredHasMany;

function requireHasMany () {
	if (hasRequiredHasMany) return hasMany;
	hasRequiredHasMany = 1;
	var newManyRelation = requireNewManyRelation();
	var newRelatedTable = requireNewRelatedTable();

	function newOne(joinRelation) {
		var c = {};
		var parentTable = joinRelation.childTable;

		c.as = function(alias) {
			joinRelation.rightAlias = alias;
			var relation = newManyRelation(joinRelation);
			parentTable._relations[alias] = relation;

			Object.defineProperty(parentTable, alias, {
				get: function() {
					return newRelatedTable([relation]);
				}
			});

			return relation;
		};

		c.notNullExceptInsert = function() {
			return c;
		};

		c.notNull = function() {
			return c;
		};

		return c;
	}

	hasMany = newOne;
	return hasMany;
}

var newOneCache_1;
var hasRequiredNewOneCache;

function requireNewOneCache () {
	if (hasRequiredNewOneCache) return newOneCache_1;
	hasRequiredNewOneCache = 1;
	let newManyCache = requireNewManyCache();

	function newOneCache(joinRelation) {
		let c = {};
		let cache = newManyCache(joinRelation);

		c.tryGet = function(context, parent) {
			let res = cache.tryGet(context, parent);
			if (res.length === 0)
				return null;
			return res[0];
		};

		c.getInnerCache = function(context) {
			let _cache = cache.getInnerCache(context);
			let _c = {};
			_c.tryGet = function(context, parent) {
				let res = _cache.tryGet(context, parent);
				if (res.length === 0)
					return null;
				return res[0];
			};
			return _c;
		};
		return c;
	}

	newOneCache_1 = newOneCache;
	return newOneCache_1;
}

var newOneRelation_1;
var hasRequiredNewOneRelation;

function requireNewOneRelation () {
	if (hasRequiredNewOneRelation) return newOneRelation_1;
	hasRequiredNewOneRelation = 1;
	var newLeg = requireNewOneLeg();
	var newOneCache = requireNewOneCache();
	var newForeignKeyFilter = requireNewForeignKeyFilter();
	var getRelatives = requireGetRelatives();
	var fuzzyPromise = requireFuzzyPromise();
	var newGetRelated = requireNewGetRelated();

	function newOneRelation(joinRelation) {
		var c = {};
		var oneCache = newOneCache(joinRelation);

		c.joinRelation = joinRelation;
		c.childTable = joinRelation.parentTable;
		c.parentTable = joinRelation.childTable;
		c.isOne = true;

		c.accept = function(visitor) {
			visitor.visitOne(c);
		};

		c.getFromCache = function(parent) {
			let row = c.getRowsSync(parent);
			return fuzzyPromise(row);
		};

		c.getFromDb = function(context, parent) {
			var filter = newForeignKeyFilter(context, joinRelation, parent);
			return c.childTable.tryGetFirst(context, filter, null);
		};

		c.getRelatives = function(context, parent) {
			return getRelatives(context, parent, c);
		};

		c.toGetRelated = function(context, parent) {
			return newGetRelated(context, parent, c);
		};

		c.expand = function(parent) {
			return parent.expand(joinRelation.rightAlias);
		};

		c.getRowsSync = function(parent) {
			let cache = parent._relationCacheMap.get(c);
			if (!cache)
				return null;
			return cache.tryGet(parent);
		};

		c.toLeg = function() {
			return newLeg(c);
		};

		c.getInnerCache = function(context) {
			return oneCache.getInnerCache(context);
		};

		return c;
	}

	newOneRelation_1 = newOneRelation;
	return newOneRelation_1;
}

var hasOne;
var hasRequiredHasOne;

function requireHasOne () {
	if (hasRequiredHasOne) return hasOne;
	hasRequiredHasOne = 1;
	var newOneRelation = requireNewOneRelation();
	var newRelatedTable = requireNewRelatedTable();

	function newOne(joinRelation) {
		var c = {};
		var parentTable = joinRelation.childTable;

		c.as = function(alias) {
			joinRelation.rightAlias = alias;
			var relation = newOneRelation(joinRelation);
			parentTable._relations[alias] = relation;

			Object.defineProperty(parentTable, alias, {
				get: function() {
					return newRelatedTable([relation]);
				}
			});
			return relation;
		};

		c.notNullExceptInsert = function() {
			return c;
		};

		c.notNull = function() {

			return c;
		};


		return c;
	}

	hasOne = newOne;
	return hasOne;
}

var count_1;
var hasRequiredCount;

function requireCount () {
	if (hasRequiredCount) return count_1;
	hasRequiredCount = 1;
	const executeQueries = requireExecuteQueries();
	const negotiateRawSqlFilter = requireNegotiateRawSqlFilter();
	const extractFilter = requireExtractFilter();
	const newWhereSql = requireNewWhereSql();
	const quote = requireQuote$2();

	async function count(context, table, filter) {
		let alias = table._dbName;
		filter = negotiateRawSqlFilter(context,filter, table);
		let query = newQuery(context, table, filter, alias);
		let allResults = await executeQueries(context, [query]);
		let count = await allResults[0].then((rows) => {

			const count = Number.parseInt(rows[0]._count);
			return count;
		});
		return count;
	}

	function newQuery(context, table, filter, alias) {
		filter = extractFilter(filter);
		var name = quote(context, table._dbName);
		alias = quote(context, alias);
		var whereSql = newWhereSql(context, table, filter, alias);

		return whereSql.prepend('select count(*) "_count" from ' + name + ' ' + alias);


	}

	count_1 = count;
	return count_1;
}

var newSingleQuery;
var hasRequiredNewSingleQuery;

function requireNewSingleQuery () {
	if (hasRequiredNewSingleQuery) return newSingleQuery;
	hasRequiredNewSingleQuery = 1;
	var newColumnSql = requireNewColumnSql();
	var newWhereSql = requireNewWhereSql();
	var newJoinSql = requireNewJoinSql();
	var newParameterized = requireNewParameterized();
	var getSessionSingleton = requireGetSessionSingleton();

	function _new(context,table,filter,span, alias,orderBy,limit,offset,distinct = false) {
		var quote = getSessionSingleton(context, 'quote');
		var name = quote(table._dbName);
		var columnSql = newColumnSql(context,table,span,alias,true);
		var joinSql = newJoinSql(context, span, alias);
		var whereSql = newWhereSql(context,table,filter,alias);
		if (limit)
			limit = limit + ' ';
		const selectClause = distinct ? 'select distinct ' : 'select ';

		return newParameterized(selectClause + limit + columnSql + ' from ' + name + ' ' + quote(alias)).append(joinSql).append(whereSql).append(orderBy + offset);

	}

	newSingleQuery = _new;
	return newSingleQuery;
}

var newQuery_1$1;
var hasRequiredNewQuery$1;

function requireNewQuery$1 () {
	if (hasRequiredNewQuery$1) return newQuery_1$1;
	hasRequiredNewQuery$1 = 1;
	var newSingleQuery = requireNewSingleQuery();
	var extractFilter = requireExtractFilter();
	var extractOrderBy = requireExtractOrderBy();
	var extractLimit = requireExtractLimit();
	var newParameterized = requireNewParameterized();
	var extractOffset = requireExtractOffset();

	function newQuery(context,table,filter,span,alias) {
		filter = extractFilter(filter);
		var orderBy = extractOrderBy(context,table,alias,span.orderBy);
		var limit = extractLimit(context, span);
		var offset = extractOffset(context, span);

		var query = newSingleQuery(context,table,filter,span,alias,orderBy,limit,offset);
		return newParameterized(query.sql(), query.parameters);
	}

	newQuery_1$1 = newQuery;
	return newQuery_1$1;
}

var getManyDto_1$1;
var hasRequiredGetManyDto$1;

function requireGetManyDto$1 () {
	if (hasRequiredGetManyDto$1) return getManyDto_1$1;
	hasRequiredGetManyDto$1 = 1;
	const emptyFilter = requireEmptyFilter();
	const newQuery = requireNewQuery$1();
	const negotiateRawSqlFilter = requireNegotiateRawSqlFilter();
	const strategyToSpan = requireStrategyToSpan();
	const executeQueries = requireExecuteQueries();
	const getSessionSingleton = requireGetSessionSingleton();

	async function getManyDto(context, table, filter, strategy, spanFromParent, updateParent) {
		filter = negotiateRawSqlFilter(context, filter, table);
		if (strategy && strategy.where) {
			let arg = typeof strategy.where === 'function' ? strategy.where(context, table) : strategy.where;
			filter = filter.and(context, arg);
		}

		let span = spanFromParent || strategyToSpan(table, strategy);
		let alias = table._dbName;

		const query = newQuery(context, table, filter, span, alias);
		const res = await executeQueries(context, [query]);
		return decode(context, strategy, span, await res[0], undefined, updateParent);
	}

	function newCreateRow(span) {
		let columnsMap = span.columns;
		const columns = span.table._columns.filter(column => !columnsMap || columnsMap.get(column));
		const protoRow = createProto(columns, span);
		const manyNames = [];

		const c = {};
		c.visitJoin = () => { };
		c.visitOne = () => { };
		c.visitMany = function(leg) {
			manyNames.push(leg.name);
		};

		span.legs.forEach(onEachLeg);
		return createRow;

		function onEachLeg(leg) {
			leg.accept(c);
		}

		function createRow() {
			const obj = Object.create(protoRow);
			for (let i = 0; i < manyNames.length; i++) {
				obj[manyNames[i]] = [];
			}
			return obj;
		}
	}

	function createProto(columns, span) {
		let obj = {};
		for (let i = 0; i < columns.length; i++) {
			obj[columns[i].alias] = null;
		}
		for (let key in span.aggregates) {
			obj[key] = null;
		}
		const c = {};

		c.visitJoin = function(leg) {
			obj[leg.name] = null;
		};
		c.visitOne = c.visitJoin;
		c.visitMany = function(leg) {
			obj[leg.name] = null;
		};

		span.legs.forEach(onEachLeg);

		function onEachLeg(leg) {
			leg.accept(c);
		}

		return obj;
	}

	function hasManyRelations(span) {
		let result;
		const c = {};
		c.visitJoin = () => { };
		c.visitOne = c.visitJoin;
		c.visitMany = function() {
			result = true;
		};

		span.legs.forEach(onEachLeg);
		return result;

		function onEachLeg(leg) {
			leg.accept(c);
		}
	}

	async function decode(context, strategy, span, rows, keys = rows.length > 0 ? Object.keys(rows[0]) : [], updateParent) {
		const table = span.table;
		let columnsMap = span.columns;
		const columns = table._columns.filter(column => !columnsMap || columnsMap.get(column));
		const rowsLength = rows.length;
		const columnsLength = columns.length;
		const primaryColumns = table._primaryColumns;
		const primaryColumnsLength = primaryColumns.length;
		const rowsMap = new Map();
		const fkIds = new Array(rows.length);
		const getIds = createGetIds();
		const aggregateKeys = Object.keys(span.aggregates);

		const outRows = new Array(rowsLength);
		const createRow = newCreateRow(span);
		const shouldCreateMap = hasManyRelations(span);
		for (let i = 0; i < rowsLength; i++) {
			const row = rows[i];
			let outRow = createRow();
			let pkWithNullCount = 0;
			for (let j = 0; j < columnsLength; j++) {
				if (j < primaryColumnsLength) {
					if (row[keys[j]] === null)
						pkWithNullCount++;
					if (pkWithNullCount === primaryColumnsLength) {
						outRow = null;
						break;
					}
				}
				const column = columns[j];
				outRow[column.alias] = column.decode(context, row[keys[j]]);
			}

			if (outRow) {
				for (let j = 0; j < aggregateKeys.length; j++) {
					const key = aggregateKeys[j];
					const parse = span.aggregates[key].column?.decode || ((context, arg) => Number.parseFloat(arg));
					outRow[key] = parse(context, row[keys[j + columnsLength]]);
				}
			}

			outRows[i] = outRow;
			if (updateParent)
				updateParent(outRow, i);
			if (shouldCreateMap && outRow) {
				fkIds[i] = getIds(outRow);
				addToMap(rowsMap, fkIds[i], outRow);
			}
		}
		span._rowsMap = rowsMap;
		span._ids = fkIds;

		keys.splice(0, columnsLength + aggregateKeys.length);
		if (span.legs.toArray().length === 0)
			return outRows;

		const all = [];

		if (shouldCreateMap) {
			all.push(decodeManyRelations(context, strategy, span));
			all.push(decodeRelations2(context, strategy, span, rows, outRows, keys));
		}
		else
			all.push(decodeRelations2(context, strategy, span, rows, outRows, keys));

		await Promise.all(all);

		return outRows;


		function createGetIds() {
			const primaryColumns = table._primaryColumns;
			const length = primaryColumns.length;
			if (length === 1) {
				const alias = table._primaryColumns[0].alias;
				return (row) => row[alias];
			}
			else
				return (row) => {
					const result = new Array(length);
					for (let i = 0; i < length; i++) {
						result[i] = row[primaryColumns[i].alias];
					}
					return result;
				};
		}

	}

	async function decodeManyRelations(context, strategy, span) {
		const maxParameters = getSessionSingleton(context, 'maxParameters');

		const promises = [];
		const c = {};
		c.visitJoin = () => { };
		c.visitOne = c.visitJoin;

		// Helper function to split an array into chunks
		function chunk(array, size) {
			const results = [];
			for (let i = 0; i < array.length; i += size) {
				results.push(array.slice(i, i + size));
			}
			return results;
		}

		c.visitMany = function(leg) {
			const name = leg.name;
			const table = span.table;
			const relation = table._relations[name];
			const parametersPerRow = relation.joinRelation.columns.length;
			const maxRows = maxParameters
				? Math.max(1, Math.floor((maxParameters - 1) / parametersPerRow))
				: undefined;
			const rowsMap = span._rowsMap;

			const extractKey = createExtractKey(leg);
			const extractFromMap = createExtractFromMap(rowsMap, table._primaryColumns);

			if (span._ids.length === 0) {
				return;
			}

			// If maxRows is defined, chunk the IDs before calling getManyDto
			if (maxRows) {
				const chunkedIds = chunk(span._ids, maxRows);
				for (const idsChunk of chunkedIds) {
					const filter = createOneFilter(context, relation, idsChunk);
					const p = getManyDto(
						context,
						relation.childTable,
						filter,
						strategy[name],
						leg.span,
						updateParent
					);
					promises.push(p);
				}
			} else {
				// Otherwise, do the entire set in one go
				const filter = createOneFilter(context, relation, span._ids);
				const p = getManyDto(
					context,
					relation.childTable,
					filter,
					strategy[name],
					leg.span,
					updateParent
				);
				promises.push(p);
			}

			function updateParent(subRow) {
				const key = extractKey(subRow);
				const parentRows = extractFromMap(key) || [];
				parentRows.forEach(parentRow => {
					parentRow[name].push(subRow);
				});
			}
		};

		function createExtractKey(leg) {
			if (leg.columns.length === 1) {
				const alias = leg.columns[0].alias;
				return (row) => row[alias];
			} else {
				const aliases = leg.columns.map(column => column.alias);
				return (row) => aliases.map(alias => row[alias]);
			}
		}

		function createExtractFromMap(map, primaryColumns) {
			if (primaryColumns.length === 1) {
				return (key) => map.get(key);
			} else {
				return getFromMap.bind(null, map, primaryColumns);
			}
		}

		// Visit all legs
		span.legs.forEach(onEachLeg);

		function onEachLeg(leg) {
			leg.accept(c);
		}

		// Wait until all promises resolve
		await Promise.all(promises);
	}

	async function decodeRelations2(context, strategy, span, rawRows, resultRows, keys) {
		const c = {};
		c.visitJoin = function(leg) {
			const name = leg.name;
			return decode(context, strategy[name], leg.span, rawRows, keys, updateParent);

			function updateParent(subRow, i) {
				if (resultRows[i])
					resultRows[i][name] = subRow;
			}
		};

		c.visitOne = c.visitJoin;
		c.visitMany = () => { };

		async function processLegsSequentially(legs) {
			for (const leg of legs.toArray()) {
				await leg.accept(c);
			}
		}

		await processLegsSequentially(span.legs);
	}

	function createOneFilter(context, relation, ids) {
		const columns = relation.joinRelation.columns;

		if (columns.length === 1)
			return columns[0].in(context, ids);

		else
			return createCompositeFilter();

		function createCompositeFilter() {
			let filter = emptyFilter;
			for (let id of ids) {
				let nextFilter;
				for (let i = 0; i < columns.length; i++) {
					if (nextFilter)
						nextFilter = nextFilter.and(context, columns[i].eq(context, id[i]));
					else
						nextFilter = columns[i].eq(context, id[i]);
				}
				filter = filter.or(context, nextFilter);
			}
			return filter;
		}
	}

	function addToMap(map, values, row) {
		if (Array.isArray(values)) {
			let m = map;
			const lastIndex = values.length - 1;
			for (let i = 0; i < lastIndex; i++) {
				const id = values[i];
				if (!m.has(id)) {
					m.set(id, new Map());
				}
				m = m.get(id);
			}
			const leafKey = values[lastIndex];
			if (!m.has(leafKey)) {
				m.set(leafKey, [row]);
			} else {
				m.get(leafKey).push(row);
			}
		}
		else {
			if (!map.has(values)) {
				map.set(values, [row]);
			} else {
				map.get(values).push(row);
			}
		}
	}

	function getFromMap(map, primaryColumns, values) {
		if (Array.isArray(values)) {
			const length = primaryColumns.length;
			for (let i = 0; i < length; i++) {
				map = map.get(values[i]);
			}
			return map;
		}
		else
			return map.get(values);
	}

	getManyDto_1$1 = getManyDto;
	return getManyDto_1$1;
}

var getManyDto_1;
var hasRequiredGetManyDto;

function requireGetManyDto () {
	if (hasRequiredGetManyDto) return getManyDto_1;
	hasRequiredGetManyDto = 1;
	const getSessionSingleton = requireGetSessionSingleton();
	const getManyDtoCore = requireGetManyDto$1();

	function getManyDto(context, _table, _filter, _strategy) {
		const _getManyDto = getSessionSingleton(context, 'getManyDto') || getManyDtoCore;
		return _getManyDto.apply(null, arguments);
	}

	getManyDto_1 = getManyDto;
	return getManyDto_1;
}

var tryGetById;
var hasRequiredTryGetById;

function requireTryGetById () {
	if (hasRequiredTryGetById) return tryGetById;
	hasRequiredTryGetById = 1;
	var tryGetFromCacheById = requireTryGetFromCacheById();
	var tryGetFromDbById = requireTryGetFromDbById();
	var resultToPromise = requireResultToPromise();

	function get() {
		var cached =  tryGetFromCacheById.apply(null,arguments);
		if (cached)
			return resultToPromise(cached);
		return tryGetFromDbById.apply(null,arguments);
	}
	get.exclusive = tryGetFromDbById.exclusive;

	tryGetById = get;
	return tryGetById;
}

var newRowCache_1;
var hasRequiredNewRowCache;

function requireNewRowCache () {
	if (hasRequiredNewRowCache) return newRowCache_1;
	hasRequiredNewRowCache = 1;
	let newCache = requireNewCache();
	let getSessionCache = requireGetSessionCache();
	let setSessionCache = requireSetSessionCache();

	function newRowCache(table) {
		let id = Symbol();
		let c = {};

		c.tryGet = function(context, row) {
			return getCache(context, table, id).tryGet(row);
		};

		c.tryAdd = function(context, row) {
			return getCache(context, table, id).tryAdd(row);
		};

		c.tryRemove = function(context, row) {
			return getCache(context, table, id).tryRemove(row);
		};

		c.subscribeAdded = function(context, ...rest) {
			return getCache(context, table, id).subscribeAdded.apply(null, rest);
		};

		c.subscribeRemoved = function(context, ...rest) {
			return getCache(context, table, id).subscribeRemoved.apply(null, rest);
		};

		c.getAll = function(context) {
			return getCache(context, table, id).getAll.apply(null, arguments);
		};

		c.getInnerCache = function(context) {
			return getCache(context, table, id);
		};
		return c;
	}


	function getCache(context, table, id) {
		let cache = getSessionCache(context, id);
		if (cache)
			return cache;
		cache = _newRowCache(table);
		setSessionCache(context, id, cache);
		return cache;
	}


	function _newRowCache(table) {
		let c = {};
		let cache = newCache();
		let pkNames;
		let rowToKey = firstRowToKey;

		function getPkNames() {
			let names = {};
			let primaryColumns = table._primaryColumns;
			let keyLength = primaryColumns.length;
			for (let i = 0; i < keyLength; i++) {
				let column = primaryColumns[i];
				names[column.alias] = null;
			}
			return names;
		}

		c.tryGet = function(row) {
			let key = rowToKey(row);
			return cache.tryGet(key);

		};

		function firstRowToKey(row) {
			pkNames = getPkNames();
			rowToKey = nextRowToKey;
			table = null;
			return rowToKey(row);
		}

		function nextRowToKey(row) {
			let key = [];
			for(let pkName in pkNames) {
				key.push(row[pkName]);
			}
			return key;
		}

		c.tryAdd = function(row) {
			let key = rowToKey(row);
			return cache.tryAdd(key, row);
		};

		c.tryRemove = function(row) {
			let key = rowToKey(row);
			return cache.tryRemove(key);
		};

		c.subscribeAdded = cache.subscribeAdded;
		c.subscribeRemoved = cache.subscribeRemoved;

		c.getAll = cache.getAll;

		return c;
	}

	newRowCache_1 = newRowCache;
	return newRowCache_1;
}

var newRow_1;
var hasRequiredNewRow;

function requireNewRow () {
	if (hasRequiredNewRow) return newRow_1;
	hasRequiredNewRow = 1;
	var decodeDbRow = requireDecodeDbRow();
	var flags = requireFlags();

	function newRow(context, {table, _options, shouldValidate = true}) {
		var dto = {};
		table._columns.forEach(addColumn);

		function addColumn(column) {
			var alias = column.alias;
			if ('default' in column) {
				if (typeof column.default === 'function')
					dto[alias] = column.default();
				else if (column.toDto)
					dto[alias] = column.toDto(column.default);
				else
					dto[alias] = column.default;
			}
			else if (flags.useLazyDefaults && 'lazyDefault' in column && !column.isPrimary) {
				if (typeof column.lazyDefault === 'function')
					dto[alias] = column.lazyDefault();
				else if (column.toDto)
					dto[alias] = column.toDto(column.lazyDefault);
				else
					dto[alias] = column.lazyDefault;
			}
			else if (column.dbNull !== null)
				dto[alias] = null;
			else
				dto[alias] = undefined;
		}
		const arg = arguments[2];
		if (isObject(arg))
			for (let name in arg) {
				if (table[name] && table[name].equal)
					dto[name] = arg[name];
			}
		else
			for (var i = 2; i < arguments.length; i++) {
				var pkValue = arguments[i];
				var column = table._primaryColumns[i - 1];
				dto[column.alias] = pkValue;
			}

		return decodeDbRow(context, table, table, dto, shouldValidate, true);
	}

	function isObject(object) {
		return (object === Object(object) && !Array.isArray(object) && !(object instanceof Date));
	}

	newRow_1 = newRow;
	return newRow_1;
}

var insert_1;
var hasRequiredInsert$2;

function requireInsert$2 () {
	if (hasRequiredInsert$2) return insert_1;
	hasRequiredInsert$2 = 1;
	let getSessionContext = requireGetSessionContext();
	let newRow = requireNewRow();

	function insert(context, { table, options }, arg) {
		if (Array.isArray(arg)) {
			let all = [];
			for (let i = 0; i < arg.length; i++) {
				all.push(insert(context, table, arg[i]));
			}
			return Promise.all(all);
		}
		let row = newRow.apply(null, [...arguments]);
		let hasPrimary = getHasPrimary(table, row);
		if (hasPrimary) {
			row = table._cache.tryAdd(context, row);
		}
		expand(table, row);
		Object.defineProperty(row, 'then', {
			value: then,
			writable: true,
			enumerable: false,
			configurable: true
		});
		const rdb = getSessionContext(context);
		const insertP = rdb.insert(context, table, row, options).then(onResult);


		// }
		// else {
		// 	// Non-PG case, use Promise
		// 	result = new Promise((resolve, reject) => {
		// 		([result]) => {
		// 			row.hydrate(result);
		// 			if (!hasPrimary) {
		// 				row = table._cache.tryAdd(row);
		// 			}
		// 			table._cache.tryAdd(row);
		// 			resolve(row);qq
		// 		};
		// 	});
		// }

		async function then(fn, efn) {
			delete row.then;
			return insertP.then(() => fn(row), efn);
		}

		return row;

		function onResult([result]) {
			row.hydrate(context, result);
			// if (!hasPrimary)
			// 	row = table._cache.tryAdd(context, row);
			row = table._cache.tryAdd(context, row);
			return row;
		}
	}

	function expand(table, row) {
		let relationName;
		let visitor = {};
		visitor.visitJoin = function() { };

		visitor.visitMany = function() {
			row.expand(relationName);
		};

		visitor.visitOne = function() {
			row.expand(relationName);
		};

		for (relationName in table._relations) {
			let relation = table._relations[relationName];
			relation.accept(visitor);
		}
	}

	function getHasPrimary(table, row) {
		for (let i = 0; i < table._primaryColumns.length; i++) {
			let column = table._primaryColumns[i];
			if (row[column.alias] === null) {
				return false;
			}
		}
		return true;
	}

	insert_1 = insert;
	return insert_1;
}

var fromCompareObject_1;
var hasRequiredFromCompareObject;

function requireFromCompareObject () {
	if (hasRequiredFromCompareObject) return fromCompareObject_1;
	hasRequiredFromCompareObject = 1;
	function fromCompareObject(object) {
		if (object === null || object === undefined) return object;
		if (object.__patchType === 'Array') {
			let copy = [];
			let i = 0;
			for (let id in object) {
				if (id !== '__patchType') {
					copy[i] = fromCompareObject(object[id]);
					i++;
				}
			}
			return copy;
		} else if (object === Object(object)) {
			let copy = {};
			for (let name in object) {
				if (name !== '__patchType')
					copy[name] = fromCompareObject(object[name]);
			}
			return copy;
		}
		return object;
	}

	fromCompareObject_1 = fromCompareObject;
	return fromCompareObject_1;
}

var insertAndForget_1;
var hasRequiredInsertAndForget;

function requireInsertAndForget () {
	if (hasRequiredInsertAndForget) return insertAndForget_1;
	hasRequiredInsertAndForget = 1;
	const fromCompareObject = requireFromCompareObject();
	const getSessionContext = requireGetSessionContext();
	const newRow = requireNewRow();

	async function insertAndForget(context, { table, options = {} }, values) {
		if (!Array.isArray(values) || values.length === 0)
			return false;

		const normalizedValues = [];
		for (let i = 0; i < values.length; i++) {
			if (!isFlatColumnValue(values[i], table))
				return false;
			normalizedValues.push(normalizeValue(values[i], table));
		}

		const insertOptions = { ...options, skipSelectAfterInsert: true };
		const rows = normalizedValues.map(value => newRow(context, { table }, value));
		const rdb = getSessionContext(context);
		if (rows.length > 1 && rdb.batchInsert && table._emitChanged.callbacks.length === 0) {
			const inserted = await rdb.batchInsert(context, table, rows, insertOptions);
			if (inserted)
				return true;
		}

		for (let i = 0; i < normalizedValues.length; i++)
			await table.insertWithConcurrency(context, insertOptions, normalizedValues[i]);
		return true;
	}

	function isFlatColumnValue(value, table) {
		if (!isPlainObject(value))
			return false;
		for (let name in value) {
			if (!isColumn(name, table))
				return false;
		}
		return true;
	}

	function normalizeValue(value, table) {
		const normalized = {};
		for (let name in value) {
			if (isColumn(name, table))
				normalized[name] = fromCompareObject(value[name]);
		}
		clearTemporaryPrimaryKeys(normalized, table);
		return normalized;
	}

	function clearTemporaryPrimaryKeys(value, table) {
		for (let i = 0; i < table._primaryColumns.length; i++) {
			const pkName = table._primaryColumns[i].alias;
			const keyValue = value[pkName];
			if (keyValue && typeof keyValue === 'string' && keyValue.indexOf('~') === 0)
				value[pkName] = undefined;
		}
	}

	function isColumn(name, table) {
		return table[name] && table[name].equal;
	}

	function isPlainObject(value) {
		return value === Object(value) && !Array.isArray(value) && !(value instanceof Date);
	}

	insertAndForget_1 = insertAndForget;
	return insertAndForget_1;
}

var _delete_1;
var hasRequired_delete;

function require_delete () {
	if (hasRequired_delete) return _delete_1;
	hasRequired_delete = 1;
	var pushCommand = requirePushCommand();
	var newDeleteCommand = requireNewDeleteCommand();
	var extractDeleteStrategy = requireExtractDeleteStrategy();
	var negotiateRawSqlFilter = requireNegotiateRawSqlFilter();
	var emptyPromise = requireResultToPromise()();

	function _delete(context, table, filter, strategy) {
		filter = negotiateRawSqlFilter(context, filter, table);
		strategy = extractDeleteStrategy(strategy);
		var relations = [];
		var cmds = [];

		cmds = newDeleteCommand(context, cmds, table, filter, strategy, relations);
		cmds.forEach(function(cmd) {
			pushCommand(context, cmd);
		});
		return emptyPromise;
	}

	_delete_1 = _delete;
	return _delete_1;
}

var cascadeDelete_1;
var hasRequiredCascadeDelete;

function requireCascadeDelete () {
	if (hasRequiredCascadeDelete) return cascadeDelete_1;
	hasRequiredCascadeDelete = 1;
	var _delete = require_delete();
	var newObject = requireNewObject();
	var newCascadeDeleteStrategy = requireNewCascadeDeleteStrategy();

	function cascadeDelete(context, table, filter) {
		var empty = newObject();
		var strategy = newCascadeDeleteStrategy(empty, table);
		return _delete(context, table, filter, strategy);
	}

	cascadeDelete_1 = cascadeDelete;
	return cascadeDelete_1;
}

var toCompareObject_1;
var hasRequiredToCompareObject;

function requireToCompareObject () {
	if (hasRequiredToCompareObject) return toCompareObject_1;
	hasRequiredToCompareObject = 1;
	const dateToISOString = requireDateToISOString();
	const isNode = (typeof window === 'undefined');

	function toCompareObject(object) {
		if (Array.isArray(object)) {
			let copy = {};
			Object.defineProperty(copy, '__patchType', {
				value: 'Array',
				writable: true,
				enumerable: true
			});

			for (var i = 0; i < object.length; i++) {
				let element = toCompareObject(object[i]);
				if (element === Object(element) && 'id' in element)
					copy[element.id] = element;
				else
					copy[i] = element;
			}
			return copy;
		}
		if (isNode && isNodeBuffer(object))
			return object.toString('base64');
		// @ts-ignore
		else if (object instanceof Date && !isNaN(object))
			return dateToISOString(object);
		else if (object === Object(object)) {
			let copy = {};
			for (let name in object) {
				copy[name] = toCompareObject(object[name]);
			}
			return copy;
		}
		return object;
	}

	function isNodeBuffer(object) {
		return typeof Buffer !== 'undefined'
			&& typeof Buffer.isBuffer === 'function'
			&& Buffer.isBuffer(object);
	}

	toCompareObject_1 = toCompareObject;
	return toCompareObject_1;
}

var applyPatch_1;
var hasRequiredApplyPatch;

function requireApplyPatch () {
	if (hasRequiredApplyPatch) return applyPatch_1;
	hasRequiredApplyPatch = 1;
	const fastjson = require$$0$1;
	let fromCompareObject = requireFromCompareObject();
	let toCompareObject = requireToCompareObject();
	let getSessionSingleton = requireGetSessionSingleton();
	let newConcurrencyConflictError = requireNewConcurrencyConflictError();

	function applyPatch({ options = {}, context }, dto, changes, column) {
		let dtoCompare = toCompareObject(dto);
		changes = validateReadonly(dtoCompare, changes);
		if (column.tsType === 'JSONColumn') {
			const engine = context ? getSessionSingleton(context, 'engine') : undefined;
			if(column && engine === 'sap') {
				changes = validateConflict(dtoCompare, changes);
				fastjson.applyPatch(dtoCompare, changes, true, true);
			}
		}
		else
			fastjson.applyPatch(dtoCompare, changes, true, true);

		let result = fromCompareObject(dtoCompare);

		if (Array.isArray(dto))
			dto.length = 0;
		else
			for (let name in dto) {
				delete dto[name];
			}

		for (let name in result) {
			dto[name] = result[name];
		}

		return dto;

		function validateReadonly(object, changes) {
			return changes.filter(change => {
				const option = getOption(change.path);
				let readonly = option.readonly;
				if (readonly) {
					const e = new Error(`Cannot update column ${change.path.replace('/', '')} because it is readonly`);
					// @ts-ignore
					e.status = 405;
					throw e;
				}
				return true;
			});
		}

		function getOption(path) {
			let splitPath = path.split('/');
			splitPath.shift();
			return splitPath.reduce(extract, options);

			function extract(obj, name) {
				if (Array.isArray(obj))
					return obj[0] || options;
				if (obj === Object(obj))
					return obj[name] || options;
				return obj;
			}

		}



		function validateConflict(object, changes) {
			return changes.filter(change => {
				let expectedOldValue = change.oldValue;
				const option = getOption(change.path);
				let readonly = option.readonly;
				if (readonly) {
					const e = new Error(`Cannot update column ${change.path.replace('/', '')} because it is readonly`);
					// @ts-ignore
					e.status = 405;
					throw e;
				}
				let concurrency = option.concurrency || 'optimistic';
				if ((concurrency === 'optimistic') || (concurrency === 'skipOnConflict')) {
					let oldValue = getOldValue(object, change.path);
					try {
						if (column && column.tsType === 'DateColumn')
							assertDatesEqual(oldValue, expectedOldValue);
						else
							assertDeepEqual(oldValue, expectedOldValue);
					}
					catch (e) {
						if (concurrency === 'skipOnConflict')
							return false;
						throw newConcurrencyConflictError();
					}
				}
				return true;
			});

			function getOldValue(obj, path) {
				let splitPath = path.split('/');
				splitPath.shift();
				return splitPath.reduce(extract, obj);

				function extract(obj, name) {
					if (obj === Object(obj))
						return obj[name];
					return;
				}
			}

		}

	}

	function assertDatesEqual(a, b) {
		const dateA = normalizeDateForCompare(a);
		const dateB = normalizeDateForCompare(b);
		if (dateA !== undefined && dateB !== undefined) {
			if (dateA !== dateB)
				throw new Error('A, b are not equal');
			return;
		}
		assertDeepEqual(a, b);
	}

	function normalizeDateForCompare(value) {
		if (value == null)
			return value;
		if (value instanceof Date)
			return value.getTime();
		if (typeof value !== 'string')
			return undefined;
		let normalized = value.replace(' ', 'T');
		if (/[+-]\d{2}$/.test(normalized))
			normalized += ':00';
		else if (/^\d{4}-\d{2}-\d{2}T/.test(normalized) && !/(Z|[+-]\d{2}:?\d{2})$/.test(normalized))
			normalized += 'Z';
		const time = Date.parse(normalized);
		return Number.isNaN(time) ? undefined : time;
	}

	function assertDeepEqual(a, b) {
		if (JSON.stringify(a) !== JSON.stringify(b))
			throw new Error('A, b are not equal');
	}

	applyPatch_1 = applyPatch;
	return applyPatch_1;
}

var validateDeleteAllowed_1;
var hasRequiredValidateDeleteAllowed;

function requireValidateDeleteAllowed () {
	if (hasRequiredValidateDeleteAllowed) return validateDeleteAllowed_1;
	hasRequiredValidateDeleteAllowed = 1;
	async function validateDeleteAllowed({ row, options, table }) {
		if (options.readonly) {
			const e = new Error(`Cannot delete ${table._dbName} because it is readonly`);
			// @ts-ignore
			e.status = 405;
			throw e;
		}
		if (!hasReadonlyTrue(options))
			return;
		for (let p in options) {
			if (isManyRelation(p, table)) {
				const childTable = table[p]._relation.childTable;
				const childOptions = inferOptions(options, p);
				if (!hasReadonlyTrue(childOptions))
					continue;
				const children = await row[p];
				for (let i = 0; i < children.length; i++) {
					const childRow = children[i];
					await validateDeleteAllowed({ row: childRow, options: childOptions, table: childTable });
				}
			}
			else if (isOneRelation(p, table)) {
				const childOptions = inferOptions(options, p);
				if (!hasReadonlyTrue(childOptions))
					continue;
				const childTable = table[p]._relation.childTable;
				let childRow = await row[p];
				await validateDeleteAllowed({ row: childRow, options: childOptions, table: childTable });
			}
		}
	}


	function isManyRelation(name, table) {
		return table[name] && table[name]._relation && table[name]._relation.isMany;
	}

	function isOneRelation(name, table) {
		return table[name] && table[name]._relation && table[name]._relation.isOne;
	}

	function inferOptions(defaults, property) {
		const parent = {};
		if ('readonly' in defaults)
			parent.readonly = defaults.readonly;
		if ('concurrency' in defaults)
			parent.concurrency = defaults.concurrency;
		return {...parent,  ...(defaults[property] || {})};
	}

	function hasReadonlyTrue(options) {
		if (!options || options !== Object(options))
			return false;
		if (options.readonly === true)
			return true;
		for (let p in options) {
			const value = options[p];
			if (!value || value !== Object(value))
				continue;
			if (hasReadonlyTrue(value))
				return true;
		}
		return false;
	}

	validateDeleteAllowed_1 = validateDeleteAllowed;
	return validateDeleteAllowed_1;
}

var clearCache_1;
var hasRequiredClearCache;

function requireClearCache () {
	if (hasRequiredClearCache) return clearCache_1;
	hasRequiredClearCache = 1;
	var setSessionSingleton = requireSetSessionSingleton();

	function clearCache(context) {
		setSessionSingleton(context, 'cache', {});
	}

	clearCache_1 = clearCache;
	return clearCache_1;
}

/* eslint-disable require-atomic-updates */

var patchTable_1;
var hasRequiredPatchTable;

function requirePatchTable () {
	if (hasRequiredPatchTable) return patchTable_1;
	hasRequiredPatchTable = 1;
	let applyPatch = requireApplyPatch();
	let fromCompareObject = requireFromCompareObject();
	let validateDeleteAllowed = requireValidateDeleteAllowed();
	let clearCache = requireClearCache();
	const getSessionSingleton = requireGetSessionSingleton();


	async function patchTable() {
		// const dryrun = true;
		//traverse all rows you want to update before updatinng or inserting anything.
		//this is to avoid page locks in ms sql
		// await patchTableCore.apply(null, [...arguments, dryrun]);
		const result = await patchTableCore.apply(null, arguments);
		clearCache(arguments[0]);
		return result;
	}

	async function patchTableCore(context, table, patches, { strategy = undefined, deduceStrategy = false, ...options } = {}, dryrun) {
		const engine = getSessionSingleton(context, 'engine');
		options = cleanOptions(options);
		strategy = JSON.parse(JSON.stringify(strategy || {}));
		if (!dryrun && strategy['insertAndForget'] && await tryInsertAndForget(context, table, patches, options))
			return { changed: [], strategy };
		let changed = new Set();
		for (let i = 0; i < patches.length; i++) {
			let patch = { path: undefined, value: undefined, op: undefined };
			Object.assign(patch, patches[i]);
			patch.path = patches[i].path.split('/').slice(1);
			let result;
			if (patch.op === 'add' || patch.op === 'replace') {
				result = await add({ path: patch.path, value: patch.value, op: patch.op, oldValue: patch.oldValue, strategy: deduceStrategy ? strategy : {}, options }, table);
			}
			else if (patch.op === 'remove')
				result = await remove({ path: patch.path, op: patch.op, oldValue: patch.oldValue, options }, table);

			if (result.inserted)
				changed.add(result.inserted);
			else if (result.updated)
				changed.add(result.updated);
		}
		if (strategy['insertAndForget'])
			return {
				changed: [], strategy
			};
		return { changed: await toDtos(changed), strategy };


		async function toDtos(set) {
			set = [...set];
			const result = await table.getManyDto(context, set, strategy);
			return result;
		}

		function toKey(property) {
			if (typeof property === 'string' && property.charAt(0) === '[')
				return JSON.parse(property);
			else
				return [property];
		}

		async function add({ path, value, op, oldValue, strategy, options }, table, row, parentRow, relation) {
			let property = path[0];
			path = path.slice(1);
			if (!row && path.length > 0) {
				row = await getOrCreateRow({
					table,
					strategy,
					property
				});
			}

			if (path.length === 0 && value === null) {
				return remove({ path, op, oldValue, options }, table, row);
			}
			if (path.length === 0) {
				if (dryrun) {
					return {};
				}
				let childInserts = [];
				for (let name in value) {
					if (isColumn(name, table))
						value[name] = fromCompareObject(value[name]);
					else if (isJoinRelation(name, table)) {
						strategy[name] = strategy[name] || {};
						value[name] && updateJoinedColumns(name, value, table, value);
					}
					else if (isManyRelation(name, table))
						value[name] && childInserts.push(insertManyRelation.bind(null, name, value, op, oldValue, table, strategy, options));
					else if (isOneRelation(name, table) && value)
						value[name] && childInserts.push(insertOneRelation.bind(null, name, value, op, oldValue, table, strategy, options));
				}
				for (let i = 0; i < table._primaryColumns.length; i++) {
					let pkName = table._primaryColumns[i].alias;
					let keyValue = value[pkName];
					if (keyValue && typeof (keyValue) === 'string' && keyValue.indexOf('~') === 0)
						value[pkName] = undefined;
				}

				if (relation && relation.joinRelation) {
					for (let i = 0; i < relation.joinRelation.columns.length; i++) {
						let column = relation.joinRelation.columns[i];
						let fkName = column.alias;
						let parentPk = relation.joinRelation.childTable._primaryColumns[i].alias;
						if (!value[fkName]) {
							value[fkName] = parentRow[parentPk];
						}
					}
				}
				const insertOptions = childInserts.length === 0
					? options
					: withoutSkipSelectAfterInsert(options);
				let row = table.insertWithConcurrency.apply(null, [context, insertOptions, value]);
				row = await row;

				for (let i = 0; i < childInserts.length; i++) {
					await childInserts[i](row);
				}
				return { inserted: row };
			}
			property = path[0];
			if (isColumn(property, table)) {
				if (dryrun)
					return { updated: row };
				const column = table[property];
				const oldColumnValue = row[property];
				let dto = {};
				dto[property] = oldColumnValue;
				const _oldValue = fromCompareObject(oldValue);
				const _value = fromCompareObject(value);
				let result = applyPatch({ options, context }, dto, [{ path: '/' + path.join('/'), op, value, oldValue }], table[property]);

				const patchInfo = column.tsType === 'JSONColumn' ? {
					path,
					op,
					value: _value,
					oldValue : _oldValue,
					fullOldValue: oldColumnValue
				} : undefined;
				await table.updateWithConcurrency(context, options, row, property, result[property], _oldValue, patchInfo);
				return { updated: row };
			}
			else if (isOneRelation(property, table)) {
				let relation = table[property]._relation;
				let subRow = await row[property];
				strategy[property] = strategy[property] || {};
				options[property] = inferOptions(options, property);

				await add({ path, value, op, oldValue, strategy: strategy[property], options: options[property] }, relation.childTable, subRow, row, relation);
				return { updated: row };
			}
			else if (isManyRelation(property, table)) {
				let relation = table[property]._relation;
				strategy[property] = strategy[property] || {};
				options[property] = inferOptions(options, property);


				if (path.length === 1) {
					for (let id in value) {
						if (id === '__patchType')
							continue;
						await add({ path: [id], value: value[id], op, oldValue, strategy: strategy[property], options: options[property] }, relation.childTable, undefined, row, relation);
					}
				}
				else {
					await add({ path: path.slice(1), value, oldValue, op, strategy: strategy[property], options: options[property] }, relation.childTable, undefined, row, relation);
				}
				return { updated: row };
			}
			else if (isJoinRelation(property, table) && path.length === 1) {
				let dto = toJoinedColumns(property, { [property]: value }, table);
				oldValue = toJoinedColumns(property, { [property]: oldValue }, table);
				let result;
				for (let p in dto) {
					result = await add({ path: ['dummy', p], value: dto[p], oldValue: (oldValue || {})[p], op, strategy: strategy, options: options }, table, row, parentRow, relation) || result;
				}
				return result || {};
			}
			else if (isJoinRelation(property, table) && path.length === 2) {
				let dto = toJoinedColumns(property, { [property]: { [path[1]]: value } }, table);
				oldValue = toJoinedColumns(property, { [property]: { [path[1]]: oldValue } }, table);
				let result;
				for (let p in dto) {
					result = await add({ path: ['dummy', p], value: dto[p], oldValue: (oldValue || {})[p], op, strategy: strategy, options: options }, table, row, parentRow, relation) || result;
				}
				return result || {};
			}
			return {};
		}

		async function insertManyRelation(name, value, op, oldValue, table, strategy, options, row) {
			let relation = table[name]._relation;
			for (let childKey in value[name]) {
				if (childKey != '__patchType') {
					let child = value[name][childKey];
					strategy[name] = strategy[name] || {};
					options[name] = inferOptions(options, name);

					await add({ path: [childKey], value: child, op, oldValue, strategy: strategy[name], options: options[name] }, relation.childTable, {}, row, relation);
				}
			}
		}

		async function insertOneRelation(name, value, op, oldValue, table, strategy, options, row) {
			let relation = table[name]._relation;
			let child = value[name];
			strategy[name] = strategy[name] || {};
			options[name] = inferOptions(options, name);

			await add({ path: [name], value: child, op, oldValue, strategy: strategy[name], options: options[name] }, relation.childTable, {}, row, relation);
		}

		function updateJoinedColumns(name, value, table, row) {
			let relation = table[name]._relation;
			for (let i = 0; i < relation.columns.length; i++) {
				let parentKey = relation.columns[i].alias;
				let childKey = relation.childTable._primaryColumns[i].alias;
				if (childKey in value[name])
					row[parentKey] = fromCompareObject(value[name][childKey]);
			}
		}
		function toJoinedColumns(name, valueObject, table) {
			let relation = table[name]._relation;
			let dto = {};
			for (let i = 0; i < relation.columns.length; i++) {
				let parentKey = relation.columns[i].alias;
				let childKey = relation.childTable._primaryColumns[i].alias;
				if (valueObject && valueObject[name] && childKey in valueObject[name])
					dto[parentKey] = fromCompareObject(valueObject[name][childKey]);
				else
					dto[parentKey] = null;
			}
			return dto;
		}

		async function remove({ path, op, oldValue, options }, table, row) {
			let property = path[0];
			path = path.slice(1);
			if (!row)
				row = await getOrCreateRow({ table, strategy: {}, property });
			if (path.length === 0) {
				await validateDeleteAllowed({ row, options, table });
				applyDeleteConcurrencyState(row, oldValue, options, table);
				await row.deleteCascade();
			}
			property = path[0];
			if (isColumn(property, table)) {
				const column = table[property];
				const oldColumnValue = row[property];
				let dto = {};
				dto[property] = oldColumnValue;
				const _oldValue = fromCompareObject(oldValue);

				let result = applyPatch({ options, context }, dto, [{ path: '/' + path.join('/'), op, oldValue }], table[property]);
				if (column.tsType === 'JSONColumn') {
					const patchInfo = {
						path,
						op,
						value: undefined,
						oldValue: _oldValue,
						fullOldValue: oldColumnValue
					};
					await table.updateWithConcurrency(context, options, row, property, result[property], _oldValue, patchInfo);
				}
				else
					row[property] = result[property];
				return { updated: row };
			}
			else if (isJoinRelation(property, table) && path.length === 1) {
				oldValue = toJoinedColumns(property, { [property]: oldValue }, table);
				let relation = table[property]._relation;
				let result;
				for (let i = 0; i < relation.columns.length; i++) {
					let p = relation.columns[i].alias;
					result = await remove({ path: ['dummy', p], oldValue: (oldValue || {})[p], op, options: options }, table, row) || result;
				}
				return result || {};
			}
			else if (isJoinRelation(property, table) && path.length === 2) {
				let relation = table[property]._relation;
				oldValue = toJoinedColumns(property, { [property]: { [path[1]]: oldValue } }, table);
				let result;
				for (let i = 0; i < relation.columns.length; i++) {
					let p = relation.columns[i].alias;
					let childKey = relation.childTable._primaryColumns[i].alias;
					if (path[1] === childKey) {
						result = await remove({ path: ['dummy', p], oldValue: oldValue[p], op, options: options }, table, row) || result;
						break;
					}
				}
				return result || {};
			}
			else if (isOneRelation(property, table)) {
				let child = await row[property];
				if (!child)
					throw new Error(property + ' does not exist');
				options[property] = inferOptions(options, property);

				await remove({ path, op, oldValue, options: options[property] }, table[property], child);
				return { updated: row };
			}
			else if (isManyRelation(property, table)) {
				let relation = table[property]._relation;
				options[property] = inferOptions(options, property);
				if (path.length === 1) {
					let children = (await row[property]).slice(0);
					for (let i = 0; i < children.length; i++) {
						let child = children[i];
						await remove({ path: path.slice(1), op, oldValue, options: options[property] }, table[property], child);
					}
				}
				else {
					await remove({ path: path.slice(1), op, oldValue, options: options[property] }, relation.childTable);
				}
				return { updated: row };
			}
			return {};
		}

		function isColumn(name, table) {
			return table[name] && table[name].equal;
		}

		function shouldFetchFromDb(table) {
			return engine === 'sap'
				&& table._columns.some(x => x.tsType === 'JSONColumn');
		}


		function getOrCreateRow({ table, strategy, property }) {
			const key = toKey(property);

			if (shouldFetchFromDb(table))
				return fetchFromDb({context, table, strategy, key});
			return createRowInCache({ context, table, key });
		}

		async function fetchFromDb({context, table, strategy, key}) {
			const row = await table.tryGetById.apply(null, [context, ...key, strategy]);
			if (!row)
				throw new Error(`Row ${table._dbName} with id ${key} was not found.`);
			return row;

		}



		function createRowInCache({ context, table, key }) {
			const tryGetFromCacheById = getOrCreateRow.tryGetFromCacheById || (getOrCreateRow.tryGetFromCacheById = requireTryGetFromCacheById());
			const cachedRow = tryGetFromCacheById(context, table, ...key);
			if (cachedRow)
				return cachedRow;
			const newRow = getOrCreateRow.cachedNewRow || (getOrCreateRow.cachedNewRow = requireNewRow());
			const pkDto = {};
			for (let i = 0; i < key.length && i < table._primaryColumns.length; i++) {
				pkDto[table._primaryColumns[i].alias] = key[i];
			}
			let row = newRow(context, { table, shouldValidate: false }, pkDto);
			return table._cache.tryAdd(context, row);
		}

		function isManyRelation(name, table) {
			return table[name] && table[name]._relation.isMany;
		}

		function isOneRelation(name, table) {
			return table[name] && table[name]._relation.isOne;

		}

		function isJoinRelation(name, table) {
			return table[name] && table[name]._relation.columns;
		}

		function applyDeleteConcurrencyState(row, oldValue, options, table) {
			const state = { columns: {} };
			if (oldValue && oldValue === Object(oldValue)) {
				for (let p in oldValue) {
					if (!isColumn(p, table))
						continue;
					const columnOptions = inferOptions(options, p);
					const concurrency = columnOptions.concurrency || 'optimistic';
					if (concurrency === 'overwrite')
						continue;
					state.columns[p] = { oldValue: fromCompareObject(oldValue[p]), concurrency };
				}
			}
			if (Object.keys(state.columns).length === 0) {
				const concurrency = options.concurrency || 'optimistic';
				if (concurrency !== 'overwrite') {
					for (let i = 0; i < table._primaryColumns.length; i++) {
						const pkName = table._primaryColumns[i].alias;
						state.columns[pkName] = { oldValue: row[pkName], concurrency };
					}
				}
			}
			if (Object.keys(state.columns).length > 0)
				row._concurrencyState = state;
		}

		function inferOptions(defaults, property) {
			const parent = {};
			if ('readonly' in defaults)
				parent.readonly = defaults.readonly;
			if ('concurrency' in defaults)
				parent.concurrency = defaults.concurrency;
			return { ...parent, ...(defaults[property] || {}) };
		}

		function cleanOptions(options) {
			const { table, transaction, db, client, ..._options } = options;
			return _options;
		}

		async function tryInsertAndForget(context, table, patches, options) {
			if (!table.insertAndForget || !Array.isArray(patches))
				return false;
			const values = [];
			for (let i = 0; i < patches.length; i++) {
				const patch = patches[i];
				if (!isRootAdd(patch))
					return false;
				values.push(patch.value);
			}
			return table.insertAndForget(context, options, values);
		}

		function isRootAdd(patch) {
			return patch && patch.op === 'add' && isRootPath(patch.path);
		}

		function isRootPath(path) {
			if (typeof path !== 'string')
				return false;
			return path.split('/').slice(1).length === 1;
		}

		function withoutSkipSelectAfterInsert(options) {
			if (!options || !options.skipSelectAfterInsert)
				return options;
			const { skipSelectAfterInsert, ...rest } = options;
			return rest;
		}
	}

	patchTable_1 = patchTable;
	return patchTable_1;
}

var where;
var hasRequiredWhere;

function requireWhere () {
	if (hasRequiredWhere) return where;
	hasRequiredWhere = 1;
	const negotiateRawSqlFilter = requireNegotiateRawSqlFilter();

	function newWhere(table) {

		function where(context, fn) {
			let arg = typeof fn === 'function' ? fn(table) : fn;
			return negotiateRawSqlFilter(context, arg, table, true);
		}
		return where;
	}

	where = newWhere;
	return where;
}

var aggregate;
var hasRequiredAggregate;

function requireAggregate () {
	if (hasRequiredAggregate) return aggregate;
	hasRequiredAggregate = 1;
	function newAggregate(table) {

		function aggregate(_context, fn) {
			return fn(table);
		}
		return aggregate;
	}

	aggregate = newAggregate;
	return aggregate;
}

var newQuery_1;
var hasRequiredNewQuery;

function requireNewQuery () {
	if (hasRequiredNewQuery) return newQuery_1;
	hasRequiredNewQuery = 1;
	var newSingleQuery = requireNewSingleQuery();
	var extractFilter = requireExtractFilter();
	var extractLimit = requireExtractLimit();
	var newParameterized = requireNewParameterized();
	var extractOffset = requireExtractOffset();

	function newQuery(context, table,filter,span,alias,options = {}) {
		filter = extractFilter(filter);
		var orderBy = '';
		var limit = extractLimit(context, span);
		var offset = extractOffset(context, span);
		const useDistinct = options.distinct && canUseDistinct(span);

		var query = newSingleQuery(context, table,filter,span,alias,orderBy,limit,offset,useDistinct);
		if (useDistinct)
			return query;

		const groupClause = groupBy(span);
		return newParameterized(query.sql(), query.parameters).append(groupClause);
	}

	function groupBy(span) {
		const keys =  Object.keys(span.aggregates).filter(x => span.aggregates[x].column);
		if (keys.length === 0)
			return '';
		return ' GROUP BY ' + keys.map(key => span.aggregates[key].groupBy).join(',');
	}

	function canUseDistinct(span) {
		const keys = Object.keys(span.aggregates);
		return keys.every(key => !!span.aggregates[key].column);
	}

	newQuery_1 = newQuery;
	return newQuery_1;
}

var groupBy_1;
var hasRequiredGroupBy;

function requireGroupBy () {
	if (hasRequiredGroupBy) return groupBy_1;
	hasRequiredGroupBy = 1;
	const newQuery = requireNewQuery();
	const negotiateRawSqlFilter = requireNegotiateRawSqlFilter();
	const strategyToSpan = requireStrategyToSpan();
	const executeQueries = requireExecuteQueries();

	async function groupBy(context, table, filter, strategy, options) {
		filter = negotiateRawSqlFilter(context, filter, table);
		if (strategy && strategy.where) {
			let arg = typeof strategy.where === 'function' ? strategy.where(table) : strategy.where;
			filter = filter.and(context, arg);
		}

		let span = strategyToSpan(table, strategy);
		span.columns = new Map();

		let alias = table._dbName;

		const query = newQuery(context, table, filter, span, alias, options);
		const res = await executeQueries(context, [query]);
		return decode(context, span, await res[0]);
	}

	function newCreateRow(span) {
		const protoRow = createProto(span);

		return createRow;

		function createRow() {
			return Object.create(protoRow);
		}
	}

	function createProto(span) {
		let obj = {};
		for (let key in span.aggregates) {
			obj[key] = null;
		}

		return obj;
	}


	async function decode(context, span, rows, keys = rows.length > 0 ? Object.keys(rows[0]) : []) {
		const rowsLength = rows.length;
		const aggregateKeys = Object.keys(span.aggregates);

		const outRows = new Array(rowsLength);
		const createRow = newCreateRow(span);
		for (let i = 0; i < rowsLength; i++) {
			const row = rows[i];
			let outRow = createRow();

			for (let j = 0; j < aggregateKeys.length; j++) {
				const key = aggregateKeys[j];
				const parse = span.aggregates[key].column?.decode || ((_context, arg) => Number.parseFloat(arg));
				outRow[key] =  parse(context, row[keys[j]]);
			}

			outRows[i] = outRow;
		}

		return outRows;
	}

	groupBy_1 = groupBy;
	return groupBy_1;
}

var table;
var hasRequiredTable;

function requireTable () {
	if (hasRequiredTable) return table;
	hasRequiredTable = 1;
	const newColumn = requireNewColumn();
	const column = requireColumn();
	const join = requireJoin();
	const hasMany = requireHasMany();
	const hasOne = requireHasOne();
	const getMany = requireGetMany();
	const count = requireCount();
	const getManyDto = requireGetManyDto();
	const getById = requireGetById();
	const tryGetById = requireTryGetById();
	const tryGetFirst = requireTryGetFirstFromDb();
	const newCache = requireNewRowCache();
	const newContext = requireNewObject();
	const insert = requireInsert$2();
	const insertAndForget = requireInsertAndForget();
	const _delete = require_delete();
	const cascadeDelete = requireCascadeDelete();
	const patchTable = requirePatchTable();
	const newEmitEvent = requireEmitEvent();
	const hostLocal = requireHostLocal();
	const getSessionSingleton = requireGetSessionSingleton();
	const isJsonUpdateSupported = requireIsJsonUpdateSupported();
	// const getTSDefinition = require('./getTSDefinition'); //todo: unused ?
	const where = requireWhere();
	const aggregate = requireAggregate();
	const groupBy = requireGroupBy();


	function _new(tableName) {
		var table = newContext();
		table._dbName = tableName;
		table._primaryColumns = [];
		table._aliases = new Set();
		table._columns = [];
		table._columnDiscriminators = [];
		table._formulaDiscriminators = [];
		table._relations = {};
		table._cache = newCache(table);
		table._emitChanged = newEmitEvent();

		table.primaryColumn = function(columnName) {
			var columnDef = newColumn(table, columnName);
			columnDef.isPrimary = true;
			table._primaryColumns.push(columnDef);
			return column(columnDef, table);
		};

		table.column = function(columnName) {
			var columnDef = newColumn(table, columnName);
			return column(columnDef, table);
		};

		table.join = function(relatedTable) {
			return join(table, relatedTable);
		};

		table.hasMany = function(joinRelation) {
			return hasMany(joinRelation);
		};

		table.hasOne = function(joinRelation) {
			return hasOne(joinRelation);
		};

		table.count = function(context, ...rest) {
			const args = [context, table, ...rest];
			return Promise.resolve().then(() => count.apply(null, args));
		};

		table.getMany = function(context, ...rest) {
			const args = [context, table, ...rest];
			return Promise.resolve().then(() => getMany.apply(null, args));
		};
		table.getManyDto = function(context, ...rest) {
			const args = [context, table, ...rest];
			return Promise.resolve().then(() => getManyDto.apply(null, args));
		};

		table.aggregate = function(context, ...rest) {
			const args = [context, table, ...rest];
			return groupBy.apply(null, args);
		};
		table.distinct = function(context, ...rest) {
			const args = [context, table, ...rest, { distinct: true }];
			return groupBy.apply(null, args);
		};

		table.getMany.exclusive = function(context, ...rest) {
			const args = [context, table, ...rest];
			return Promise.resolve().then(() => getMany.exclusive.apply(null, args));
		};

		table.tryGetFirst = function(context, ...rest) {
			const args = [context, table, ...rest];
			return Promise.resolve().then(() => tryGetFirst.apply(null, args));
		};
		table.tryGetFirst.exclusive = function(context, ...rest) {
			const args = [context, table, ...rest];
			return Promise.resolve().then(() => tryGetFirst.exclusive.apply(null, args));
		};

		table.getOne = table.tryGetFirst;
		table.getOne.exclusive = table.tryGetFirst.exclusive;

		table.getById = function(context, ...rest) {
			const args = [context, table, ...rest];
			return Promise.resolve().then(() => getById.apply(null, args));
		};

		table.getById.exclusive = function(context, ...rest) {
			const args = [context, table, ...rest];
			return Promise.resolve().then(() => getById.exclusive.apply(null, args));
		};

		table.tryGetById = function(context, ...rest) {
			const args = [context, table, ...rest];
			return Promise.resolve().then(() => tryGetById.apply(null, args));
		};

		table.tryGetById.exclusive = function(context, ...rest) {
			const args = [context, table, ...rest];
			return Promise.resolve().then(() => tryGetById.exclusive.apply(null, args));
		};


		table.columnDiscriminators = function() {
			for (var i = 0; i < arguments.length; i++) {
				table._columnDiscriminators.push(arguments[i]);
			}
			return table;
		};

		table.formulaDiscriminators = function() {
			for (var i = 0; i < arguments.length; i++) {
				table._formulaDiscriminators.push(arguments[i]);
			}
			return table;
		};

		table.insert = function(context, ...rest) {
			const concurrency = undefined;
			let args = [context, {table, concurrency}, ...rest];
			return insert.apply(null, args);
		};

		table.insertWithConcurrency = function(context, options, ...rows) {
			let args = [context, {table, options}].concat([].slice.call(rows));
			return insert.apply(null, args);
		};

		table.insertAndForget = function(context, options, values) {
			return insertAndForget(context, { table, options }, values);
		};

		table.updateWithConcurrency = function(context, options, row, property, value, oldValue, patchInfo) {
			options = options || {};
			const columnOptions = inferColumnOptions(options, property);
			const concurrency = columnOptions.concurrency || 'optimistic';
			const column = table[property];

			if (patchInfo && column && column.tsType === 'JSONColumn' && Array.isArray(patchInfo.path) && patchInfo.path.length > 1) {
				const engine = getSessionSingleton(context, 'engine');
				if (isJsonUpdateSupported(engine)) {
					const jsonPath = patchInfo.path.slice(1);
					const jsonUpdateState = row._jsonUpdateState || {};
					const columnState = jsonUpdateState[property] || { patches: [] };
					columnState.patches.push({
						path: jsonPath,
						op: patchInfo.op,
						value: patchInfo.value,
						oldValue: patchInfo.oldValue
					});
					jsonUpdateState[property] = columnState;
					row._jsonUpdateState = jsonUpdateState;
					if (concurrency !== 'overwrite') {
						const state = row._concurrencyState || { columns: {} };
						const columnConcurrency = state.columns[property] || {};
						columnConcurrency.concurrency = concurrency;
						columnConcurrency.paths = columnConcurrency.paths || [];
						columnConcurrency.paths.push({
							path: jsonPath,
							oldValue: patchInfo.oldValue
						});
						delete columnConcurrency.oldValue;
						state.columns[property] = columnConcurrency;
						row._concurrencyState = state;
					}
				}
				else if (concurrency !== 'overwrite') {
					const state = row._concurrencyState || { columns: {} };
					const fullOldValue = Object.prototype.hasOwnProperty.call(patchInfo, 'fullOldValue') ? patchInfo.fullOldValue : oldValue;
					state.columns[property] = { oldValue: fullOldValue, concurrency };
					row._concurrencyState = state;
				}
			}
			else if (concurrency !== 'overwrite') {
				const state = row._concurrencyState || { columns: {} };
				state.columns[property] = { oldValue, concurrency };
				row._concurrencyState = state;
			}
			row[property] = value;
		};

		table.delete = function(context, ...rest) {
			const args = [context, table, ...rest];
			return _delete.apply(null, args);
		};
		table.cascadeDelete = function(context, ...rest) {
			const args = [context, table, ...rest];
			return cascadeDelete.apply(null, args);
		};

		table.deleteCascade = table.cascadeDelete;
		table.exclusive = function() {
			table._exclusive = true;
			return table;
		};
		table.patch = function(context, ...rest) {
			const args = [context, table, ...rest];
			return patchTable.apply(null, args);
		};

		// table.subscribeChanged = table._emitChanged.add; //legacy
		// table.unsubscribeChanged = table._emitChanged.remove; //legacy

		table.hostLocal = function(options) {
			return hostLocal({table, ...options});
		};

		// table.ts = function(name) { //unused ?
		// 	return getTSDefinition(table, {name});
		// };

		table.where = where(table);
		table._aggregate = aggregate(table);

		return table;
	}

	function inferColumnOptions(defaults, property) {
		const parent = {};
		if (!defaults)
			return parent;
		if ('readonly' in defaults)
			parent.readonly = defaults.readonly;
		if ('concurrency' in defaults)
			parent.concurrency = defaults.concurrency;
		return { ...parent, ...(defaults[property] || {}) };
	}

	table = _new;
	return table;
}

var createProviders_1;
var hasRequiredCreateProviders;

function requireCreateProviders () {
	if (hasRequiredCreateProviders) return createProviders_1;
	hasRequiredCreateProviders = 1;
	const connectionCache = new WeakMap();


	function createProviders(index) {

		function dbMap(fn) {
			fn = new Proxy(fn, {});
			return (() => negotiateCachedPool(fn, dbMap));
		}

		Object.defineProperty(dbMap, 'pg', {
			get:  function() {
				return createPool.bind(null, 'pg');
			}
		});
		Object.defineProperty(dbMap, 'pglite', {
			get:  function() {
				return createPool.bind(null, 'pglite');
			}
		});
		Object.defineProperty(dbMap, 'postgres', {
			get:  function() {
				return createPool.bind(null, 'pg');
			}
		});
		Object.defineProperty(dbMap, 'mssql', {
			get:  function() {
				return createPool.bind(null, 'mssql');
			}
		});
		Object.defineProperty(dbMap, 'mssqlNative', {
			get:  function() {
				return createPool.bind(null, 'mssqlNative');
			}
		});
		Object.defineProperty(dbMap, 'mysql', {
			get:  function() {
				return createPool.bind(null, 'mysql');
			}
		});
		Object.defineProperty(dbMap, 'mariadb', {
			get:  function() {
				return createPool.bind(null, 'mariadb');
			}
		});
		Object.defineProperty(dbMap, 'sap', {
			get:  function() {
				return createPool.bind(null, 'sap');
			}
		});
		Object.defineProperty(dbMap, 'oracle', {
			get:  function() {
				return createPool.bind(null, 'oracle');
			}
		});
		Object.defineProperty(dbMap, 'sqlite', {
			get:  function() {
				return createPool.bind(null, 'sqlite');
			}
		});
		Object.defineProperty(dbMap, 'sqliteOPFS', {
			get:  function() {
				return createPool.bind(null, 'sqliteOPFS');
			}
		});
		Object.defineProperty(dbMap, 'd1', {
			get:  function() {
				return createPool.bind(null, 'd1');
			}
		});
		Object.defineProperty(dbMap, 'http', {
			get:  function() {
				return createPool.bind(null, 'http');
			}
		});

		dbMap.express = index.express;
		dbMap.hono = index.hono;

		function createPool(providerName, ...args) {
			const provider = index[providerName];
			return provider.apply(null, args);
		}

		return dbMap;

	}

	function negotiateCachedPool(fn, providers) {
		let cache = connectionCache.get(fn);
		if (!cache) {
			cache = {};
			connectionCache.set(fn, cache);
		}

		const dbMap = {
			get pg() {
				return createPool.bind(null, 'pg');
			},
			get pglite() {
				return createPool.bind(null, 'pglite');
			},
			get postgres() {
				return createPool.bind(null, 'pg');
			},
			get mssql() {
				return createPool.bind(null, 'mssql');
			},
			get mssqlNative() {
				return createPool.bind(null, 'mssqlNative');
			},
			get mysql() {
				return createPool.bind(null, 'mysql');
			},
			get mariadb() {
				return createPool.bind(null, 'mariadb');
			},
			get sap() {
				return createPool.bind(null, 'sap');
			},
			get oracle() {
				return createPool.bind(null, 'oracle');
			},
			get sqlite() {
				return createPool.bind(null, 'sqlite');
			},
			get sqliteOPFS() {
				return createPool.bind(null, 'sqliteOPFS');
			},
			get d1() {
				return createPool.bind(null, 'd1');
			},
			get http() {
				return createPool.bind(null, 'http');
			}
		};

		function createPool(providerName, ...args) {
			// D1 bindings are request-scoped and should not be cached. Browser SQLite/OPFS must be cached to avoid creating a worker per query.
			if (providerName === 'd1') {
				return providers[providerName].apply(null, args);
			}
			const key = JSON.stringify(args);
			if (!cache[providerName])
				cache[providerName] = {};
			let pool = cache[providerName][key];
			if (!pool) {
				pool = providers[providerName].apply(null, args);
				cache[providerName][key] = pool;
			}
			return pool;
		}
		return fn(dbMap);
	}



	createProviders_1 = createProviders;
	return createProviders_1;
}

var map_1;
var hasRequiredMap;

function requireMap () {
	if (hasRequiredMap) return map_1;
	hasRequiredMap = 1;
	const _newTable = requireTable();
	const createProviders = requireCreateProviders();

	function mapRoot(index, fn) {

		const providers = createProviders(index);

		return map(index, context, providers, fn);

		function context(arg) {

			const tables = {};
			for (let name in context) {
				if (context[name] && context[name]._dbName)
					tables[name] = context[name];
			}

			if (arg && arg.db && typeof arg.db === 'function') {
				return index({
					...arg,
					db: providers(arg.db),
					tables, providers
				});
			}
			else
				return index({
					...arg, tables, providers
				});
		}
	}


	function map(index, context, providers, fn) {
		let next = fn({ table: newTable, ...context });

		for (let name in next) {
			if (next[name] && next[name]._dbName) {
				context[name] = next[name];
				context[name].map = mapTable.bind(null, context[name]);
			}
		}
		context.map = map.bind(null, index, context, providers);
		context.pg = connect.bind(null, 'pg');
		context.pglite = connect.bind(null, 'pglite');
		context.postgres = connect.bind(null, 'pg');
		context.mssql = connect.bind(null, 'mssql');
		context.mssqlNative = connect.bind(null, 'mssqlNative');
		context.mysql = connect.bind(null, 'mysql');
		context.mariadb = connect.bind(null, 'mariadb');
		context.sap = connect.bind(null, 'sap');
		context.oracle = connect.bind(null, 'oracle');
		context.sqlite = connect.bind(null, 'sqlite');
		context.sqliteOPFS = connect.bind(null, 'sqliteOPFS');
		context.d1 = connect.bind(null, 'd1');
		context.http = function(url) {
			return index({ db: url, providers});
		};

		function connect(name, ...args) {
			const provider = index[name];
			const pool = provider.apply(null, args);

			const tables = {};
			for (let name in context) {
				if (context[name] && context[name]._dbName)
					tables[name] = context[name];
			}

			return index({ db: pool, tables, providers });
		}

		return context;

		function newTable() {
			let table = _newTable.apply(null, arguments);
			table.map = mapTable.bind(null, table);
			return table;
		}
	}

	function mapTable(table, fn) {
		let next = fn({ column: table.column, primaryColumn: table.primaryColumn, references: table.join, hasMany, hasOne });
		for (let name in next) {
			if (next[name].as)
				next[name] = next[name].as(name);
		}

		function hasMany(to) {
			if (!to)
				throw new Error('Missing \'to\' table');
			return { by };

			function by() {
				const join = to.join(table).by.apply(null, arguments);
				return table.hasMany(join);
			}
		}

		function hasOne(to) {
			if (!to)
				throw new Error('Missing \'to\' table');
			return { by };

			function by() {
				const join = to.join(table).by.apply(null, arguments);
				return table.hasOne(join);
			}
		}

		return table;

	}

	map_1 = mapRoot;
	return map_1;
}

var dbWorkerClient;
var hasRequiredDbWorkerClient;

function requireDbWorkerClient () {
	if (hasRequiredDbWorkerClient) return dbWorkerClient;
	hasRequiredDbWorkerClient = 1;
	const {
		finalizeSyncOperationMemory,
		serializeSyncPayload,
		withSyncOperationMemory
	} = requireOperationContext();

	function createDbWorkerClient(worker) {
		if (!worker || typeof worker.postMessage !== 'function')
			throw new Error('DB worker client requires a Worker-like object.');

		let nextId = 1;
		const pending = new Map();
		const listeners = new Map();

		worker.addEventListener('message', onMessage);

		const client = {
			__orangeDbWorkerClient: true,
			__createSyncClient,
			hostLocal,
			query: request.bind(null, 'query', {}),
			sqliteFunction: request.bind(null, 'sqliteFunction', {}),
			createTransaction,
			end: close,
			close,
			syncClient: {
				sync: syncRequest.bind(null, 'sync'),
				resetLocal: syncRequest.bind(null, 'resetLocal'),
				start: syncRequest.bind(null, 'start'),
				stop: syncRequest.bind(null, 'stop'),
				isRunning: syncRequest.bind(null, 'isRunning'),
				getConfig: syncRequest.bind(null, 'getConfig'),
				onOperation,
				on,
				off,
				once,
				waitForInitialReady: syncRequest.bind(null, 'waitForInitialReady'),
				close
			}
		};

		return client;

		function __createSyncClient() {
			return client.syncClient;
		}

		function hostLocal(options = {}) {
			const tableName = options.syncTableName;
			return {
				get: requestInTransaction.bind(null, options.transaction, 'get', { tableName }),
				post: requestInTransaction.bind(null, options.transaction, 'post', { tableName }),
				patch: requestInTransaction.bind(null, options.transaction, 'patch', { tableName }),
				syncCommand: requestInTransaction.bind(null, options.transaction, 'syncCommand', {}),
				query: requestInTransaction.bind(null, options.transaction, 'query', {}),
				sqliteFunction: requestInTransaction.bind(null, options.transaction, 'sqliteFunction', {})
			};
		}

		function createTransaction(options) {
			const transactionId = nextId++;
			const begin = request('transaction.begin', { transactionId }, options);
			const context = { __orangeDbWorkerTransactionId: transactionId };

			async function transaction(fn) {
				await begin;
				return fn(context);
			}
			transaction.commit = async function(_context) {
				await request('transaction.commit', { transactionId });
			};
			transaction.rollback = async function(error, _context) {
				await request('transaction.rollback', { transactionId, error: serializeError(error) });
			};
			transaction.setSyncContext = async function(sync) {
				await request('transaction.syncContext', { transactionId }, serializeSyncPayload(sync));
			};
			transaction.flushSyncContext = async function(sync) {
				return request('transaction.flushSyncContext', { transactionId }, serializeSyncPayload(sync));
			};
			return transaction;
		}

		function syncRequest(method, options) {
			return request(`sync.${method}`, {}, options);
		}

		function request(method, meta, ...args) {
			const id = nextId++;
			return new Promise((resolve, reject) => {
				pending.set(id, { resolve, reject });
				worker.postMessage({
					type: 'orange-db-request',
					id,
					method,
					...meta,
					args
				});
			});
		}

		function requestInTransaction(transaction, method, meta, ...args) {
			if (typeof transaction !== 'function')
				return request(method, meta, ...args);
			return transaction((context) => {
				return request(method, {
					...meta,
					transactionId: getTransactionId(context)
				}, ...args);
			});
		}

		function on(event, listener) {
			if (typeof listener !== 'function')
				return () => {};
			let eventListeners = listeners.get(event);
			if (!eventListeners) {
				eventListeners = new Set();
				listeners.set(event, eventListeners);
			}
			eventListeners.add(listener);
			request('sync.on', {}, event).catch(() => {});
			return () => off(event, listener);
		}

		function off(event, listener) {
			const eventListeners = listeners.get(event);
			if (!eventListeners)
				return;
			eventListeners.delete(listener);
			if (eventListeners.size === 0) {
				listeners.delete(event);
				request('sync.off', {}, event).catch(() => {});
			}
		}

		function once(event, listener) {
			if (typeof listener !== 'function')
				return () => {};
			const unsubscribe = on(event, (payload) => {
				unsubscribe();
				listener(payload);
			});
			return unsubscribe;
		}

		function onOperation(operation, listener) {
			if (typeof operation !== 'string' || typeof listener !== 'function')
				return () => {};
			return on(`operation:${operation}`, listener);
		}

		function close() {
			worker.removeEventListener('message', onMessage);
			for (const entry of pending.values())
				entry.reject(new Error('DB worker client closed.'));
			pending.clear();
			listeners.clear();
			if (typeof worker.terminate === 'function') {
				try {
					worker.terminate();
				}
				catch (_e) {
					// Closing is best-effort for Worker-backed clients.
				}
			}
			else if (typeof worker.close === 'function') {
				try {
					worker.close();
				}
				catch (_e) {
					// Closing is best-effort for MessagePort-backed worker clients.
				}
			}
		}

		function onMessage(event) {
			const message = event && event.data;
			if (!message || message.type === undefined)
				return;
			if (message.type === 'orange-db-event') {
				emit(message.event, message.payload);
				return;
			}
			if (message.type !== 'orange-db-response')
				return;
			const entry = pending.get(message.id);
			if (!entry)
				return;
			pending.delete(message.id);
			if (message.error)
				entry.reject(toError(message.error));
			else
				entry.resolve(message.result);
		}

		function emit(event, payload) {
			if (event && event.startsWith && event.startsWith('operation:')) {
				payload = withSyncOperationMemory(payload);
				finalizeSyncOperationMemory(payload);
			}
			const eventListeners = listeners.get(event);
			if (!eventListeners)
				return;
			for (const listener of Array.from(eventListeners))
				listener(payload);
		}
	}

	function getTransactionId(transaction) {
		return transaction && transaction.__orangeDbWorkerTransactionId;
	}

	function serializeError(error) {
		if (!error)
			return undefined;
		return {
			name: error.name,
			message: error.message || String(error),
			stack: error.stack
		};
	}

	function toError(error) {
		const e = new Error(error && error.message ? error.message : 'DB worker request failed.');
		if (error && error.name)
			e.name = error.name;
		if (error && error.stack)
			e.stack = error.stack;
		return e;
	}

	dbWorkerClient = createDbWorkerClient;
	return dbWorkerClient;
}

var dbWorkerHandler;
var hasRequiredDbWorkerHandler;

function requireDbWorkerHandler () {
	if (hasRequiredDbWorkerHandler) return dbWorkerHandler;
	hasRequiredDbWorkerHandler = 1;
	const { acquireSyncWrite } = requireWriteGate();
	const {
		createSyncTransactionContext,
		flushSyncTransactionContext,
		serializeSyncPayload,
		setSyncTransactionContext
	} = requireOperationContext();

	function createDbWorkerHandler(client, options = {}) {
		if (!client)
			throw new Error('DB worker handler requires a client.');

		const transactions = new Map();
		const syncEventUnsubscribers = new Map();
		const postMessage = options.postMessage || ((message) => {
			const target = getPostTarget();
			if (target)
				target.postMessage(message);
		});

		if (options.autoStart !== false && client.syncClient && typeof client.syncClient.start === 'function')
			void client.syncClient.start();

		return {
			handleMessage,
			stop
		};

		async function handleMessage(event) {
			const message = event && event.data;
			if (!message || message.type !== 'orange-db-request')
				return;
			try {
				const result = await dispatch(message);
				postResponse(message.id, result);
			}
			catch (e) {
				postResponse(message.id, undefined, e);
			}
		}

		async function dispatch(message) {
			if (message.method === 'transaction.begin')
				return beginTransaction(message.transactionId, message.args && message.args[0]);
			if (message.method === 'transaction.syncContext')
				return setTransactionSyncContext(message.transactionId, message.args && message.args[0]);
			if (message.method === 'transaction.flushSyncContext')
				return flushTransactionSyncContext(message.transactionId, message.args && message.args[0]);
			if (message.method === 'transaction.commit')
				return endTransaction(message.transactionId, 'commit');
			if (message.method === 'transaction.rollback')
				return endTransaction(message.transactionId, 'rollback', message.error);
			if (message.method && message.method.startsWith('sync.'))
				return dispatchSync(message.method.slice(5), message.args);
			if (message.method === 'query')
				return callQuery(message.transactionId, message.args);
			if (message.method === 'sqliteFunction')
				return callSqliteFunction(message.transactionId, message.args);
			if (message.method === 'syncCommand')
				return callSyncCommand(message.transactionId, message.args);
			return callTable(message.method, message.tableName, message.transactionId, message.args);
		}

		async function beginTransaction(transactionId, txOptions) {
			const pool = await getPool();
			if (!pool.createTransaction)
				throw new Error('Transaction not supported by DB worker client.');
			if (transactions.has(transactionId))
				return { transactionId };
			const releaseSyncWrite = await acquireSyncWrite(pool, txOptions);
			let transaction;
			try {
				transaction = pool.createTransaction(txOptions);
			}
			catch (e) {
				releaseSyncWrite();
				throw e;
			}
			transaction.__orangeSyncWriteRelease = releaseSyncWrite;
			transactions.set(transactionId, transaction);
			return { transactionId };
		}

		async function setTransactionSyncContext(transactionId, sync) {
			const transaction = transactions.get(transactionId);
			if (!transaction)
				return { transactionId, missing: true };
			const syncContext = createSyncTransactionContext(serializeSyncPayload(sync));
			transaction.__orangeSyncTransactionContext = syncContext;
			await transaction((context) => {
				setSyncTransactionContext(context, syncContext);
			});
			return { transactionId };
		}

		async function flushTransactionSyncContext(transactionId, sync) {
			const transaction = transactions.get(transactionId);
			if (!transaction)
				return null;
			const syncContext = transaction.__orangeSyncTransactionContext || createSyncTransactionContext();
			syncContext.sync = serializeSyncPayload(sync);
			transaction.__orangeSyncTransactionContext = syncContext;
			return transaction((context) => {
				setSyncTransactionContext(context, syncContext);
				return flushSyncTransactionContext(context);
			});
		}

		async function endTransaction(transactionId, method, error) {
			const transaction = transactions.get(transactionId);
			if (!transaction)
				return { transactionId, missing: true };
			transactions.delete(transactionId);
			try {
				if (method === 'commit')
					await transaction(transaction.commit);
				else
					await transaction(transaction.rollback.bind(null, toError(error)));
			}
			finally {
				releaseSyncWrite(transaction);
			}
			return { transactionId };
		}

		function dispatchSync(method, args = []) {
			const syncClient = client.syncClient;
			if (!syncClient)
				throw new Error('Sync client is not configured in DB worker.');
			if (method === 'on')
				return subscribeSyncEvent(args[0]);
			if (method === 'off')
				return unsubscribeSyncEvent(args[0]);
			const fn = syncClient[method];
			if (typeof fn !== 'function')
				throw new Error(`Sync method "${method}" is not implemented.`);
			return fn.apply(syncClient, args);
		}

		function subscribeSyncEvent(event) {
			if (typeof event !== 'string' || syncEventUnsubscribers.has(event))
				return;
			if (!client.syncClient || typeof client.syncClient.on !== 'function')
				return;
			const unsubscribe = client.syncClient.on(event, (payload) => {
				postMessage({
					type: 'orange-db-event',
					event,
					payload
				});
			});
			syncEventUnsubscribers.set(event, unsubscribe);
		}

		function unsubscribeSyncEvent(event) {
			const unsubscribe = syncEventUnsubscribers.get(event);
			if (!unsubscribe)
				return;
			unsubscribe();
			syncEventUnsubscribers.delete(event);
		}

		async function callQuery(transactionId, args = []) {
			const transaction = transactions.get(transactionId);
			if (transaction)
				return (await host(undefined, transaction)).query.apply(null, args);
			return client.query.apply(null, args);
		}

		async function callSqliteFunction(transactionId, args = []) {
			const transaction = transactions.get(transactionId);
			if (transaction)
				return (await host(undefined, transaction)).sqliteFunction.apply(null, args);
			return client.function.apply(null, args);
		}

		async function callSyncCommand(transactionId, args = []) {
			const transaction = transactions.get(transactionId);
			return (await host(undefined, transaction)).syncCommand.apply(null, args);
		}

		async function callTable(method, tableName, transactionId, args = []) {
			if (!tableName)
				throw new Error('DB worker table request requires tableName.');
			const table = client.tables && client.tables[tableName];
			if (!table)
				throw new Error(`Table "${tableName}" is not configured in DB worker.`);
			const localHost = await host(table, transactions.get(transactionId));
			const fn = localHost[method];
			if (typeof fn !== 'function')
				throw new Error(`DB worker method "${method}" is not implemented.`);
			return fn.apply(null, args);
		}

		async function host(table, transaction) {
			const pool = await getPool();
			return pool.hostLocal({
				db: pool,
				table,
				transaction,
				client,
				syncTableName: getTableName(table)
			});
		}

		async function getPool() {
			let db = client.db || client;
			if (typeof db === 'function') {
				db = db();
				if (db && db.then)
					db = await db;
			}
			return db;
		}

		function getTableName(table) {
			if (!client.tables)
				return undefined;
			for (const name in client.tables) {
				if (client.tables[name] === table)
					return name;
			}
		}

		function stop() {
			for (const unsubscribe of syncEventUnsubscribers.values())
				unsubscribe();
			syncEventUnsubscribers.clear();
			for (const [id, transaction] of transactions) {
				transactions.delete(id);
				void Promise.resolve(transaction(transaction.rollback)).finally(() => releaseSyncWrite(transaction));
			}
			if (options.stopSyncClient !== false && client.syncClient && typeof client.syncClient.stop === 'function')
				client.syncClient.stop();
		}

		function postResponse(id, result, error) {
			postMessage({
				type: 'orange-db-response',
				id,
				result,
				error: error ? serializeError(error) : undefined
			});
		}

		function releaseSyncWrite(transaction) {
			const release = transaction && transaction.__orangeSyncWriteRelease;
			if (typeof release !== 'function')
				return;
			transaction.__orangeSyncWriteRelease = undefined;
			release();
		}
	}

	function serializeError(error) {
		return {
			name: error && error.name,
			message: error && error.message ? error.message : String(error),
			stack: error && error.stack
		};
	}

	function toError(error) {
		if (!error)
			return undefined;
		const e = new Error(error.message || 'DB worker transaction failed.');
		if (error.name)
			e.name = error.name;
		if (error.stack)
			e.stack = error.stack;
		return e;
	}

	function getPostTarget() {
		if (typeof self !== 'undefined' && typeof self.postMessage === 'function')
			return self;
		if (typeof globalThis !== 'undefined' && typeof globalThis.postMessage === 'function')
			return globalThis;
	}

	dbWorkerHandler = createDbWorkerHandler;
	return dbWorkerHandler;
}

var sharedDbWorkerClient;
var hasRequiredSharedDbWorkerClient;

function requireSharedDbWorkerClient () {
	if (hasRequiredSharedDbWorkerClient) return sharedDbWorkerClient;
	hasRequiredSharedDbWorkerClient = 1;
	const createDbWorkerClient = requireDbWorkerClient();

	function createSharedDbWorkerClient(sharedWorkerOrUrl, options = {}) {
		const sharedWorker = resolveSharedWorker(sharedWorkerOrUrl, options);
		const port = sharedWorker && sharedWorker.port || sharedWorker;
		if (!port || typeof port.postMessage !== 'function')
			throw new Error('Shared DB worker client requires a SharedWorker, MessagePort, or worker URL.');
		if (typeof port.start === 'function')
			port.start();
		return createDbWorkerClient(toWorkerLike(port));
	}

	function resolveSharedWorker(sharedWorkerOrUrl, options) {
		if (isWorkerUrl(sharedWorkerOrUrl)) {
			if (typeof SharedWorker === 'undefined')
				throw new Error('Shared DB worker requires SharedWorker support or an existing SharedWorker-like object.');
			return new SharedWorker(sharedWorkerOrUrl, getSharedWorkerOptions(options));
		}
		return sharedWorkerOrUrl;
	}

	function isWorkerUrl(value) {
		return typeof value === 'string'
			|| typeof URL !== 'undefined' && value instanceof URL;
	}

	function getSharedWorkerOptions(options = {}) {
		if (options.workerOptions)
			return options.workerOptions;
		const workerOptions = {
			type: options.type || 'module'
		};
		if (options.name)
			workerOptions.name = options.name;
		if (options.credentials)
			workerOptions.credentials = options.credentials;
		return workerOptions;
	}

	function toWorkerLike(port) {
		let closed = false;
		return {
			postMessage(message) {
				port.postMessage(message);
			},
			addEventListener(type, listener) {
				port.addEventListener(type, listener);
			},
			removeEventListener(type, listener) {
				port.removeEventListener(type, listener);
			},
			close() {
				if (closed)
					return;
				closed = true;
				try {
					port.postMessage({ type: 'orange-shared-db-port-close' });
				}
				catch (_e) {
					// The port may already be gone.
				}
				if (typeof port.close === 'function')
					port.close();
			}
		};
	}

	sharedDbWorkerClient = createSharedDbWorkerClient;
	return sharedDbWorkerClient;
}

var sharedDbWorkerHandler;
var hasRequiredSharedDbWorkerHandler;

function requireSharedDbWorkerHandler () {
	if (hasRequiredSharedDbWorkerHandler) return sharedDbWorkerHandler;
	hasRequiredSharedDbWorkerHandler = 1;
	const createDbWorkerHandler = requireDbWorkerHandler();

	function createSharedDbWorkerHandler(createClient, options = {}) {
		if (typeof createClient !== 'function')
			throw new Error('Shared DB worker handler requires a client factory.');

		const ports = new Map();
		let client;
		let clientPromise;
		let stoppingClientPromise;
		let stopped = false;
		let removeConnectListener;

		if (options.autoConnect !== false)
			removeConnectListener = attachConnectListener(options.target, handleConnect);

		return {
			handleConnect,
			connect: handleConnect,
			stop
		};

		function handleConnect(event) {
			if (stopped)
				throw new Error('Shared DB worker handler is stopped.');
			const port = resolvePort(event);
			if (!port)
				throw new Error('Shared DB worker handler requires a MessagePort.');

			const state = {
				port,
				handler: null,
				backlog: [],
				closed: false,
				error: null,
				listener: null
			};
			state.listener = onMessage.bind(null, state);
			ports.set(port, state);
			port.addEventListener('message', state.listener);
			if (typeof port.start === 'function')
				port.start();

			ensureClient()
				.then((resolvedClient) => {
					if (state.closed)
						return;
					state.handler = createDbWorkerHandler(resolvedClient, {
						autoStart: false,
						stopSyncClient: false,
						postMessage: (message) => safePostMessage(port, message)
					});
					drainBacklog(state);
				})
				.catch((error) => {
					state.error = error;
					failBacklog(state, error);
				});
		}

		function onMessage(state, event) {
			const message = event && event.data;
			if (message && message.type === 'orange-shared-db-port-close') {
				closePort(state);
				return;
			}
			if (state.closed)
				return;
			if (state.error) {
				postRequestError(state.port, message, state.error);
				return;
			}
			if (!state.handler) {
				state.backlog.push(event);
				return;
			}
			void state.handler.handleMessage(event);
		}

		function drainBacklog(state) {
			const backlog = state.backlog.splice(0);
			for (let i = 0; i < backlog.length; i++)
				onMessage(state, backlog[i]);
		}

		function failBacklog(state, error) {
			const backlog = state.backlog.splice(0);
			for (let i = 0; i < backlog.length; i++) {
				const message = backlog[i] && backlog[i].data;
				postRequestError(state.port, message, error);
			}
		}

		function ensureClient() {
			if (clientPromise)
				return clientPromise;
			clientPromise = Promise.resolve()
				.then(createClient)
				.then((resolvedClient) => {
					client = resolvedClient;
					if (options.autoStart !== false && client && client.syncClient && typeof client.syncClient.start === 'function')
						void client.syncClient.start();
					return client;
				});
			return clientPromise;
		}

		function closePort(state, closeMessagePort = true) {
			if (!state || state.closed)
				return;
			state.closed = true;
			if (state.port && state.listener && typeof state.port.removeEventListener === 'function')
				state.port.removeEventListener('message', state.listener);
			if (state.handler)
				state.handler.stop();
			ports.delete(state.port);
			if (closeMessagePort && state.port && typeof state.port.close === 'function')
				state.port.close();
			if (ports.size === 0 && options.closeOnLastPort !== false)
				void stopClient();
		}

		async function stop() {
			stopped = true;
			if (removeConnectListener) {
				removeConnectListener();
				removeConnectListener = undefined;
			}
			for (const state of Array.from(ports.values()))
				closePort(state, true);
			await stopClient();
		}

		async function stopClient() {
			if (stoppingClientPromise)
				return stoppingClientPromise;
			stoppingClientPromise = Promise.resolve()
				.then(async () => {
					const resolvedClient = client || await clientPromise.catch(() => null);
					if (resolvedClient && resolvedClient.syncClient && typeof resolvedClient.syncClient.stop === 'function')
						resolvedClient.syncClient.stop();
					if (resolvedClient && typeof resolvedClient.close === 'function')
						await resolvedClient.close();
					else if (resolvedClient && typeof resolvedClient.end === 'function')
						await resolvedClient.end();
					client = undefined;
					clientPromise = undefined;
				})
				.finally(() => {
					stoppingClientPromise = undefined;
				});
			return stoppingClientPromise;
		}
	}

	function attachConnectListener(target, handleConnect) {
		const connectTarget = target || (typeof globalThis !== 'undefined' ? globalThis : undefined);
		if (!connectTarget || typeof connectTarget.addEventListener !== 'function')
			return undefined;
		const listener = (event) => handleConnect(event);
		connectTarget.addEventListener('connect', listener);
		return () => connectTarget.removeEventListener('connect', listener);
	}

	function resolvePort(event) {
		if (!event)
			return null;
		if (event.ports && event.ports[0])
			return event.ports[0];
		if (event.port)
			return event.port;
		if (typeof event.postMessage === 'function')
			return event;
		return null;
	}

	function postRequestError(port, message, error) {
		if (!message || message.type !== 'orange-db-request')
			return;
		safePostMessage(port, {
			type: 'orange-db-response',
			id: message.id,
			error: serializeError(error)
		});
	}

	function safePostMessage(port, message) {
		try {
			port.postMessage(message);
		}
		catch (_e) {
			// The tab may have closed while a request was resolving.
		}
	}

	function serializeError(error) {
		return {
			name: error && error.name,
			message: error && error.message ? error.message : String(error),
			stack: error && error.stack
		};
	}

	sharedDbWorkerHandler = createSharedDbWorkerHandler;
	return sharedDbWorkerHandler;
}

var syncWorkerClient;
var hasRequiredSyncWorkerClient;

function requireSyncWorkerClient () {
	if (hasRequiredSyncWorkerClient) return syncWorkerClient;
	hasRequiredSyncWorkerClient = 1;
	function createSyncWorkerClient(worker) {
		if (!worker || typeof worker.postMessage !== 'function')
			throw new Error('Sync worker client requires a Worker-like object.');

		let nextId = 1;
		const pending = new Map();
		const listeners = new Map();

		worker.addEventListener('message', onMessage);

		return {
			sync: request.bind(null, 'sync'),
			resetLocal: request.bind(null, 'resetLocal'),
			onOperation,
			on,
			off,
			once,
			close
		};

		function request(method, options) {
			const id = nextId++;
			worker.postMessage({
				type: 'orange-sync-request',
				id,
				method,
				options
			});
			return new Promise((resolve, reject) => {
				pending.set(id, { resolve, reject });
			});
		}

		function on(event, listener) {
			if (typeof listener !== 'function')
				return () => {};
			let eventListeners = listeners.get(event);
			if (!eventListeners) {
				eventListeners = new Set();
				listeners.set(event, eventListeners);
			}
			eventListeners.add(listener);
			request('on', event).catch(() => {});
			return () => off(event, listener);
		}

		function off(event, listener) {
			const eventListeners = listeners.get(event);
			if (!eventListeners)
				return;
			eventListeners.delete(listener);
			if (eventListeners.size === 0) {
				listeners.delete(event);
				request('off', event).catch(() => {});
			}
		}

		function once(event, listener) {
			if (typeof listener !== 'function')
				return () => {};
			const unsubscribe = on(event, (payload) => {
				unsubscribe();
				listener(payload);
			});
			return unsubscribe;
		}

		function onOperation(operation, listener) {
			if (typeof operation !== 'string' || typeof listener !== 'function')
				return () => {};
			return on(`operation:${operation}`, listener);
		}

		function close() {
			worker.removeEventListener('message', onMessage);
			for (const entry of pending.values()) {
				entry.reject(new Error('Sync worker client closed.'));
			}
			pending.clear();
			listeners.clear();
		}

		function onMessage(event) {
			const message = event && event.data;
			if (!message || message.type === undefined)
				return;
			if (message.type === 'orange-sync-event') {
				emit(message.event, message.payload);
				return;
			}
			if (message.type !== 'orange-sync-response')
				return;
			const entry = pending.get(message.id);
			if (!entry)
				return;
			pending.delete(message.id);
			if (message.error)
				entry.reject(toError(message.error));
			else
				entry.resolve(message.result);
		}

		function emit(event, payload) {
			const eventListeners = listeners.get(event);
			if (!eventListeners)
				return;
			for (const listener of Array.from(eventListeners)) {
				listener(payload);
			}
		}
	}

	function toError(error) {
		const e = new Error(error && error.message ? error.message : 'Sync worker request failed.');
		if (error && error.name)
			e.name = error.name;
		if (error && error.stack)
			e.stack = error.stack;
		return e;
	}

	syncWorkerClient = createSyncWorkerClient;
	return syncWorkerClient;
}

var syncWorkerHandler;
var hasRequiredSyncWorkerHandler;

function requireSyncWorkerHandler () {
	if (hasRequiredSyncWorkerHandler) return syncWorkerHandler;
	hasRequiredSyncWorkerHandler = 1;
	const { createSyncAuto } = requireSyncAuto();

	function createSyncWorkerHandler(syncClient, options = {}) {
		if (!syncClient)
			throw new Error('Sync worker handler requires a sync client.');

		let running = false;
		let currentDrainPromise = Promise.resolve();
		const pending = {
			sync: [],
			resetLocal: []
		};
		let auto;
		const syncEventUnsubscribers = new Map();
		const postMessage = options.postMessage || ((message) => {
			const target = getPostTarget();
			if (target)
				target.postMessage(message);
		});

		if (options.autoStart !== false)
			startAuto();

		return {
			handleMessage,
			sync: requestSyncCycle,
			resetLocal: requestResetLocal,
			stop
		};

		async function handleMessage(event) {
			const message = event && event.data;
			if (!message || message.type !== 'orange-sync-request')
				return;
			try {
				let result;
				if (message.method === 'sync')
					result = await requestSyncCycle(message.options);
				else if (message.method === 'resetLocal')
					result = await requestResetLocal(message.options);
				else if (message.method === 'on')
					result = subscribeSyncEvent(message.options);
				else if (message.method === 'off')
					result = unsubscribeSyncEvent(message.options);
				else
					throw new Error(`Unknown sync worker method "${message.method}".`);
				postResponse(message.id, result);
			}
			catch (e) {
				postResponse(message.id, undefined, e);
			}
		}

		function requestSyncCycle(options) {
			return requestSync('sync', options);
		}

		function requestResetLocal(options) {
			return requestSync('resetLocal', options);
		}

		function stop() {
			for (const unsubscribe of syncEventUnsubscribers.values())
				unsubscribe();
			syncEventUnsubscribers.clear();
			if (auto)
				auto.stop();
			else if (syncClient && typeof syncClient.stop === 'function')
				syncClient.stop();
		}

		function requestSync(method, options) {
			return new Promise((resolve, reject) => {
				pending[method].push({ options, resolve, reject });
				drainSyncQueue();
			});
		}

		function drainSyncQueue() {
			if (running)
				return currentDrainPromise;
			running = true;
			currentDrainPromise = run()
				.finally(() => {
					running = false;
					if (hasPending())
						drainSyncQueue();
				});
			return currentDrainPromise;
		}

		async function run() {
			while (hasPending()) {
				const method = pending.resetLocal.length > 0 ? 'resetLocal' : 'sync';
				const batch = pending[method].splice(0);
				const options = batch[batch.length - 1].options;
				try {
					const result = await callSyncMethod(method, options);
					resolveBatch(batch, result);
				}
				catch (e) {
					rejectBatch(batch, e);
				}
			}
		}

		function callSyncMethod(method, options) {
			const fn = syncClient && syncClient[method];
			if (typeof fn !== 'function') {
				return {
					method,
					skipped: true,
					reason: `${method}_not_implemented`
				};
			}
			return fn.call(syncClient, options);
		}

		function hasPending() {
			return pending.resetLocal.length > 0 || pending.sync.length > 0;
		}

		function resolveBatch(batch, result) {
			for (let i = 0; i < batch.length; i++)
				batch[i].resolve(result);
		}

		function rejectBatch(batch, error) {
			for (let i = 0; i < batch.length; i++)
				batch[i].reject(error);
		}

		function startAuto() {
			if (typeof syncClient.getConfig === 'function') {
				auto = createSyncAuto({
					sync: requestSyncCycle
				}, () => syncClient.getConfig());
				void auto.start();
				return;
			}
			if (typeof syncClient.start === 'function')
				void syncClient.start();
		}

		function postResponse(id, result, error) {
			postMessage({
				type: 'orange-sync-response',
				id,
				result,
				error: error ? serializeError(error) : undefined
			});
		}

		function subscribeSyncEvent(event) {
			if (typeof event !== 'string' || syncEventUnsubscribers.has(event))
				return;
			if (!syncClient || typeof syncClient.on !== 'function')
				return;
			const unsubscribe = syncClient.on(event, (payload) => {
				postMessage({
					type: 'orange-sync-event',
					event,
					payload
				});
			});
			syncEventUnsubscribers.set(event, unsubscribe);
		}

		function unsubscribeSyncEvent(event) {
			const unsubscribe = syncEventUnsubscribers.get(event);
			if (!unsubscribe)
				return;
			unsubscribe();
			syncEventUnsubscribers.delete(event);
		}
	}

	function serializeError(error) {
		return {
			name: error && error.name,
			message: error && error.message ? error.message : String(error),
			stack: error && error.stack
		};
	}

	function getPostTarget() {
		if (typeof self !== 'undefined' && typeof self.postMessage === 'function')
			return self;
		if (typeof globalThis !== 'undefined' && typeof globalThis.postMessage === 'function')
			return globalThis;
	}

	syncWorkerHandler = createSyncWorkerHandler;
	return syncWorkerHandler;
}

var commitCommand;
var hasRequiredCommitCommand;

function requireCommitCommand () {
	if (hasRequiredCommitCommand) return commitCommand;
	hasRequiredCommitCommand = 1;
	var newParameterized = requireNewParameterized();

	var command = newParameterized('COMMIT');
	function empty() {}

	command.endEdit = empty;
	command.matches = empty;

	commitCommand = command;
	return commitCommand;
}

var deleteSessionContext_1;
var hasRequiredDeleteSessionContext;

function requireDeleteSessionContext () {
	if (hasRequiredDeleteSessionContext) return deleteSessionContext_1;
	hasRequiredDeleteSessionContext = 1;
	function deleteSessionContext(context) {
		delete context.rdb;
	}

	deleteSessionContext_1 = deleteSessionContext;
	return deleteSessionContext_1;
}

var releaseDbClient;
var hasRequiredReleaseDbClient;

function requireReleaseDbClient () {
	if (hasRequiredReleaseDbClient) return releaseDbClient;
	hasRequiredReleaseDbClient = 1;
	var getSessionSingleton = requireGetSessionSingleton();
	var deleteSessionContext = requireDeleteSessionContext();

	function release(context) {
		var done = getSessionSingleton(context, 'dbClientDone');
		var pool = getSessionSingleton(context, 'pool');
		deleteSessionContext(context);
		if (done)
			done();
		if (pool)
			return pool.end();

	}

	releaseDbClient = release;
	return releaseDbClient;
}

var commit_1;
var hasRequiredCommit;

function requireCommit () {
	if (hasRequiredCommit) return commit_1;
	hasRequiredCommit = 1;
	let commitCommand = requireCommitCommand();
	let pushCommand = requirePushCommand();
	let executeChanges = requireExecuteChanges();
	let releaseDbClient = requireReleaseDbClient();
	let popChanges = requirePopChanges();
	const getSessionSingleton = requireGetSessionSingleton();

	function _commit(context, result) {
		let hookError;
		return popAndPushChanges()
			.then(callAfterCommit)
			.then(releaseDbClient.bind(null, context))
			.then(onReleased)
			.then(throwHookErrorIfAny);

		function onReleased() {
			return result;
		}

		function throwHookErrorIfAny(res) {
			if (hookError)
				throw hookError;
			return res;
		}

		function callAfterCommit() {
			const hook = getSessionSingleton(context, 'afterCommitHook');
			if (!hook)
				return Promise.resolve();
			return Promise.resolve()
				.then(() => hook())
				.catch((e) => {
					hookError = e;
				});
		}

		async function popAndPushChanges() {
			let changes = popChanges(context);
			while (changes.length > 0) {
				await executeChanges(context, changes);
				changes = popChanges(context);
			}
			if (!getSessionSingleton(context, 'transactionLess'))
				pushCommand(context, commitCommand);
			return executeChanges(context, popChanges(context));
		}
	}

	function commit(context, result) {
		return Promise.resolve()
			.then(() => _commit(context, result));
	}

	commit_1 = commit;
	return commit_1;
}

var rollbackCommand;
var hasRequiredRollbackCommand;

function requireRollbackCommand () {
	if (hasRequiredRollbackCommand) return rollbackCommand;
	hasRequiredRollbackCommand = 1;
	var newParameterized = requireNewParameterized();

	var command = newParameterized('ROLLBACK');
	function empty() {}

	// @ts-ignore
	command.endEdit = empty;
	// @ts-ignore
	command.matches = empty;

	rollbackCommand = command;
	return rollbackCommand;
}

var tryReleaseDbClient_1;
var hasRequiredTryReleaseDbClient;

function requireTryReleaseDbClient () {
	if (hasRequiredTryReleaseDbClient) return tryReleaseDbClient_1;
	hasRequiredTryReleaseDbClient = 1;
	var release = requireReleaseDbClient();

	function tryReleaseDbClient(context) {
		try {
			release(context);
		}
		// eslint-disable-next-line no-empty
		catch (e) {

		}

	}

	tryReleaseDbClient_1 = tryReleaseDbClient;
	return tryReleaseDbClient_1;
}

var newThrow_1;
var hasRequiredNewThrow;

function requireNewThrow () {
	if (hasRequiredNewThrow) return newThrow_1;
	hasRequiredNewThrow = 1;
	var tryReleaseDbClient = requireTryReleaseDbClient();

	function newThrow(context, e, previousPromise) {
		return previousPromise.then(throwError, throwError);
		function throwError() {
			tryReleaseDbClient(context);
			throw e;
		}
	}

	newThrow_1 = newThrow;
	return newThrow_1;
}

var rollback_1;
var hasRequiredRollback;

function requireRollback () {
	if (hasRequiredRollback) return rollback_1;
	hasRequiredRollback = 1;
	const rollbackCommand = requireRollbackCommand();
	const executeQuery = requireExecuteQuery();
	const releaseDbClient = requireReleaseDbClient();
	const popChanges = requirePopChanges();
	const newThrow = requireNewThrow();
	const resultToPromise = requireResultToPromise();
	const conflictId = '12345678-1234-1234-1234-123456789012';
	const getSessionSingleton = requireGetSessionSingleton();

	function _rollback(context, e) {
		let hookError;
		var chain = resultToPromise()
			.then(() => popChanges(context))
			.then(executeRollback)
			.then(callAfterRollback)
			.then(() => releaseDbClient(context))
			.then(throwHookErrorIfAny);


		function executeRollback() {
			const transactionLess =  getSessionSingleton(context, 'transactionLess');
			if (transactionLess)
				return Promise.resolve();
			return executeQuery(context, rollbackCommand);
		}

		function callAfterRollback() {
			const hook = getSessionSingleton(context, 'afterRollbackHook');
			if (!hook)
				return Promise.resolve();
			return Promise.resolve()
				.then(() => hook(e))
				.catch((err) => {
					hookError = err;
				});
		}

		function throwHookErrorIfAny(res) {
			if (hookError)
				throw hookError;
			return res;
		}

		if (e) {
			if (e.message?.indexOf('ORA-01476: divisor is equal to zero') > -1)
				return newThrow(context, new Error('Conflict when updating a column'), chain);
			let errors = e.message && e.message.split(conflictId) || [];
			if (errors.length > 1) {
				return newThrow(context, new Error(errors[1]), chain);
			}
			else
				return newThrow(context, e, chain);
		}
		return chain;
	}

	function rollback(context, e) {
		return Promise.resolve().then(() => _rollback(context, e));
	}

	rollback_1 = rollback;
	return rollback_1;
}

var pools_1;
var hasRequiredPools;

function requirePools () {
	if (hasRequiredPools) return pools_1;
	hasRequiredPools = 1;
	var pools = requireNewObject()();

	Object.defineProperty(pools, 'end', {
		enumerable: false,
		value: end
	});

	function end() {
		var all = [];
		for (var poolId in pools) {
			var endPool = pools[poolId].end();
			all.push(endPool);
		}
		return Promise.all(all);
	}

	pools_1 = pools;
	return pools_1;
}

var log_1;
var hasRequiredLog;

function requireLog () {
	if (hasRequiredLog) return log_1;
	hasRequiredLog = 1;
	var newEmitEvent = requireEmitEvent();

	var emitters = {
		query: newEmitEvent(),
		queryComplete: newEmitEvent(),
		sqliteOpen: newEmitEvent()
	};

	var logger = function() {
	};

	function log() {
		logger.apply(null, arguments);
	}
	function emitQuery({ sql, parameters }) {
		emitters.query.apply(null, arguments);
		log(sql);
		log('parameters: ' + parameters);
	}

	log.emitQuery = emitQuery;

	log.emitQueryComplete = function() {
		emitters.queryComplete.apply(null, arguments);
	};

	log.emitSqliteOpen = function() {
		emitters.sqliteOpen.apply(null, arguments);
	};

	log.startQuery = function({ sql, parameters }) {
		const startedAt = now();
		log.emitQuery({ sql, parameters });
		return function(error) {
			log.emitQueryComplete({ sql, parameters, elapsedMs: now() - startedAt, error });
		};
	};

	log.registerLogger = function(cb) {
		logger = cb;
	};

	log.on = function(type, cb) {
		if (type === 'query')
			emitters.query.add(cb);
		else if (type === 'queryComplete')
			emitters.queryComplete.add(cb);
		else if (type === 'sqliteOpen')
			emitters.sqliteOpen.add(cb);
		else
			throw new Error('unknown event type: ' + type);
	};

	log.off = function(type, cb) {
		if (type === 'query')
			emitters.query.tryRemove(cb);
		else if (type === 'queryComplete')
			emitters.queryComplete.tryRemove(cb);
		else if (type === 'sqliteOpen')
			emitters.sqliteOpen.tryRemove(cb);
		else
			throw new Error('unknown event type: ' + type);
	};

	log_1 = log;

	function now() {
		if (typeof performance !== 'undefined' && performance.now)
			return performance.now();
		return Date.now();
	}
	return log_1;
}

var toIntKey_1;
var hasRequiredToIntKey;

function requireToIntKey () {
	if (hasRequiredToIntKey) return toIntKey_1;
	hasRequiredToIntKey = 1;
	function toIntKey(key) {
		if (isInteger())
			return key;
		if (isIntegerString())
			return trim(key);
		var intKey = '';
		for (var i = 0; i < key.length; ++i) {
			var value = key[i].toUpperCase();
			value = parseInt(value, 16);
			if (!isNaN(value))
				intKey += value;
		}

		return trim(intKey);

		function isIntegerString() {
			var pattern = /^-?\d+\.?\d*$/;
			var reg = new RegExp(pattern);
			return (typeof key === 'string' && reg.test(key));
		}

		function isInteger() {
			return (typeof key === 'number') && (Math.floor(key) === key);
		}

		function trim(value) {
			var maxBigInt = '9223372036854775807';
			value = value.substring(0, 19);
			if (value > maxBigInt)
				return value.substring(0,18);
			return value;
		}
	}

	toIntKey_1 = toIntKey;
	return toIntKey_1;
}

var lock_1;
var hasRequiredLock;

function requireLock () {
	if (hasRequiredLock) return lock_1;
	hasRequiredLock = 1;
	var query = requireQuery();
	var toIntKey = requireToIntKey();

	function lock(key, func) {
		key = toIntKey(key);
		if(typeof func === 'function') {
			return inLock(key, func);
		} else {
			var sql = 'SELECT pg_advisory_xact_lock(' + key + ')';
			return query(sql);
		}
	}

	async function inLock(key, func) {
		await query('SELECT pg_advisory_lock(' + key + ')');
		try {
			let result = await func();
			await query('SELECT pg_advisory_unlock(' + key + ')');
			return result;
		} catch(e) {
			await query('SELECT pg_advisory_unlock(' + key + ')');
			throw e;
		}
	}

	lock_1 = lock;
	return lock_1;
}

var schema;
var hasRequiredSchema;

function requireSchema () {
	if (hasRequiredSchema) return schema;
	hasRequiredSchema = 1;
	var query = requireQuery();

	function executeSchema(context, schema) {
		if (!schema)
			throw new Error('Missing schema');
		if (!Array.isArray(schema))
			schema = [schema];
		return query(context, 'SET LOCAL search_path TO ' + schema.join(','));
	}

	schema = executeSchema;
	return schema;
}

var createDomain_1;
var hasRequiredCreateDomain;

function requireCreateDomain () {
	if (hasRequiredCreateDomain) return createDomain_1;
	hasRequiredCreateDomain = 1;
	function createDomain() {
		let c = {};
		function run(fn) {
			return fn(c);
		}
		c.run = run;
		return c;
	}

	createDomain_1 = createDomain;
	return createDomain_1;
}

var wrapQuery_1$2;
var hasRequiredWrapQuery$2;

function requireWrapQuery$2 () {
	if (hasRequiredWrapQuery$2) return wrapQuery_1$2;
	hasRequiredWrapQuery$2 = 1;
	var log = requireLog();

	function wrapQuery(_context, client) {

		return runQuery;

		function runQuery(query, onCompleted) {

			var params = query.parameters;
			var sql = query.sql();
			var completeQuery = log.startQuery({sql, parameters: params});
			client.d1.prepare(sql, params).bind(...params).all().then(onInnerCompleted, onError);

			function onInnerCompleted(response) {
				completeQuery();
				onCompleted(null, response.results);
			}

			function onError(e) {
				completeQuery(e);
				onCompleted(e);
			}

		}

	}

	wrapQuery_1$2 = wrapQuery;
	return wrapQuery_1$2;
}

var wrapCommand_1$2;
var hasRequiredWrapCommand$2;

function requireWrapCommand$2 () {
	if (hasRequiredWrapCommand$2) return wrapCommand_1$2;
	hasRequiredWrapCommand$2 = 1;
	var log = requireLog();

	function wrapCommand(_context, client) {
		return runQuery;

		function runQuery(query, onCompleted) {
			var params = Array.isArray(query.parameters) ? query.parameters : [];
			var sql = query.sql();
			var completeQuery = log.startQuery({ sql, parameters: params });

			client.d1
				.prepare(sql)
				.bind.apply(null, params)
				.run()
				.then(onInnerCompleted, onError);

			function onInnerCompleted(response) {
				var affectedRows = 0;

				if (response) {
					if (typeof response.changes === 'number') affectedRows = response.changes;
					else if (typeof response.meta === 'object' && response.meta && typeof response.meta.changes === 'number') {
						affectedRows = response.meta.changes;
					} else if (typeof response.affectedRows === 'number') {
						affectedRows = response.affectedRows;
					}
				}

				completeQuery();
				onCompleted(null, { rowsAffected: affectedRows });
			}

			function onError(e) {
				completeQuery(e);
				onCompleted(e, { rowsAffected: 0 });
			}
		}
	}

	wrapCommand_1$2 = wrapCommand;
	return wrapCommand_1$2;
}

var encodeBoolean_1$1;
var hasRequiredEncodeBoolean$1;

function requireEncodeBoolean$1 () {
	if (hasRequiredEncodeBoolean$1) return encodeBoolean_1$1;
	hasRequiredEncodeBoolean$1 = 1;
	function encodeBoolean(bool) {
		if (bool)
			return 1;
		return 0;
	}

	encodeBoolean_1$1 = encodeBoolean;
	return encodeBoolean_1$1;
}

var quote$1;
var hasRequiredQuote$1;

function requireQuote$1 () {
	if (hasRequiredQuote$1) return quote$1;
	hasRequiredQuote$1 = 1;
	quote$1 = (name) => `"${name}"`;
	return quote$1;
}

var formatBigintOut_1;
var hasRequiredFormatBigintOut;

function requireFormatBigintOut () {
	if (hasRequiredFormatBigintOut) return formatBigintOut_1;
	hasRequiredFormatBigintOut = 1;
	const quote = requireQuote$1();

	function formatBigintOut(column, alias) {
		const quotedCol = quote(column._dbName);
		if (alias)
			return `CAST(${alias}.${quotedCol} AS TEXT)`;
		else
			return `CAST(${quotedCol} AS TEXT)`;
	}

	formatBigintOut_1 = formatBigintOut;
	return formatBigintOut_1;
}

var format_1;
var hasRequiredFormat;

function requireFormat () {
	if (hasRequiredFormat) return format_1;
	hasRequiredFormat = 1;
	function format(template, ...values) {
		let index = 0;
		return template.replace(/%s/g, () => {
			// If there aren't enough values, this will insert 'undefined'
			// for placeholders that don't have a corresponding array item.
			return values[index++];
		});
	}
	format_1 = format;
	return format_1;
}

var deleteFromSql_1$1;
var hasRequiredDeleteFromSql$1;

function requireDeleteFromSql$1 () {
	if (hasRequiredDeleteFromSql$1) return deleteFromSql_1$1;
	hasRequiredDeleteFromSql$1 = 1;
	const format = 'delete from %s where %s.rowId in (SELECT %s.rowId FROM %s %s%s)';
	const formatString = requireFormat();
	const quote = requireQuote$1();

	function deleteFromSql(table, alias, whereSql) {
		const name = quote(table._dbName);
		alias = quote(alias);
		return formatString(format, name, name, alias, name, alias, whereSql);
	}
	deleteFromSql_1$1 = deleteFromSql;
	return deleteFromSql_1$1;
}

var selectForUpdateSql$1;
var hasRequiredSelectForUpdateSql$1;

function requireSelectForUpdateSql$1 () {
	if (hasRequiredSelectForUpdateSql$1) return selectForUpdateSql$1;
	hasRequiredSelectForUpdateSql$1 = 1;
	const quote = requireQuote$2();

	selectForUpdateSql$1 = function(context, alias) {
		return ' FOR UPDATE OF ' + quote(context, alias);
	};
	return selectForUpdateSql$1;
}

var lastInsertedSql_1$1;
var hasRequiredLastInsertedSql$1;

function requireLastInsertedSql$1 () {
	if (hasRequiredLastInsertedSql$1) return lastInsertedSql_1$1;
	hasRequiredLastInsertedSql$1 = 1;
	function lastInsertedSql(context, table, keyValues) {
		return keyValues.map((value,i) => {
			let column = table._primaryColumns[i];
			if (value === undefined && (column.tsType === 'NumberColumn' || column.tsType === 'BigintColumn'))
				return 'rowid IN (select last_insert_rowid())';
			else
				return column.eq(context, value);
		});

	}

	lastInsertedSql_1$1 = lastInsertedSql;
	return lastInsertedSql_1$1;
}

var limitAndOffset_1$1;
var hasRequiredLimitAndOffset$1;

function requireLimitAndOffset$1 () {
	if (hasRequiredLimitAndOffset$1) return limitAndOffset_1$1;
	hasRequiredLimitAndOffset$1 = 1;
	function limitAndOffset(span) {
		if (span.offset)
			return ` limit ${limit()} offset ${span.offset}`;
		else if (span.limit || span.limit === 0)
			return ` limit ${span.limit}`;
		else
			return '';

		function limit() {
			if (span.limit || span.limit === 0)
				return span.limit;
			else
				return '-1';
		}

	}

	limitAndOffset_1$1 = limitAndOffset;
	return limitAndOffset_1$1;
}

var insertSql_1$1;
var hasRequiredInsertSql$1;

function requireInsertSql$1 () {
	if (hasRequiredInsertSql$1) return insertSql_1$1;
	hasRequiredInsertSql$1 = 1;
	const quote = requireQuote$1();

	function insertSql(_context, table, row, options) {
		let columnNames = [];
		let conflictColumnUpdateSql = '';
		let values = [];

		let sql = 'INSERT INTO ' + quote(table._dbName) + ' ';
		addDiscriminators();
		addColumns();

		if (columnNames.length === 0) {
			sql += 'DEFAULT VALUES';
		} else {
			sql = sql + '(' + columnNames.join(',') + ') ' + 'VALUES (' + values.join(',') + ')' + onConflict();
		}

		return sql;

		function onConflict() {
			if (options.concurrency === 'skipOnConflict' || options.concurrency === 'overwrite') {
				const primaryKeys = table._primaryColumns.map(x => quote(x._dbName)).join(',');
				return ` ON CONFLICT(${primaryKeys}) ${conflictColumnUpdateSql}`;
			} else {
				return '';
			}
		}

		function addDiscriminators() {
			let discriminators = table._columnDiscriminators;
			for (let i = 0; i < discriminators.length; i++) {
				let parts = discriminators[i].split('=');
				columnNames.push(quote(parts[0]));
				values.push(parts[1]);
			}
		}

		function addColumns() {
			let conflictColumnUpdates = [];
			let columns = table._columns;
			for (let i = 0; i < columns.length; i++) {
				let column = columns[i];
				const columnName = quote(column._dbName);
				if (row['__' + column.alias] !== undefined) {
					columnNames.push(columnName);
					values.push('%s');
					addConflictUpdate(column);
				}
			}
			if (conflictColumnUpdates.length === 0)
				conflictColumnUpdateSql =  'DO NOTHING';
			else
				conflictColumnUpdateSql = 'DO UPDATE SET ' + conflictColumnUpdates.join(',');

			function addConflictUpdate(column) {
				let concurrency = options[column.alias]?.concurrency || options.concurrency;
				const tableName = table._dbName;
				const columnName = quote(column._dbName);
				if (concurrency === 'overwrite') {
					conflictColumnUpdates.push(`${columnName}=excluded.${columnName}`);
				} else if (concurrency === 'optimistic')
					conflictColumnUpdates.push(`${columnName} = CASE WHEN ${tableName}.${columnName} <> excluded.${columnName} THEN '12345678-1234-1234-1234-123456789012Conflict when updating ${columnName}12345678-1234-1234-1234-123456789012' ELSE ${tableName}.${columnName} END`);
			}
		}
	}

	insertSql_1$1 = insertSql;
	return insertSql_1$1;
}

var newInsertCommand_1;
var hasRequiredNewInsertCommand;

function requireNewInsertCommand () {
	if (hasRequiredNewInsertCommand) return newInsertCommand_1;
	hasRequiredNewInsertCommand = 1;
	var newImmutable = requireNewImmutable();
	var createPatch = requireCreatePatch();
	var createDto = requireCreateDto();

	function newInsertCommand(newInsertCommandCore, table, row, options) {
		return new InsertCommand(newInsertCommandCore, table, row,  options);
	}

	function InsertCommand(newInsertCommandCore, table, row, options) {
		this.__getCoreCommand = newImmutable(newInsertCommandCore);
		this._table = table;
		this._row = row;
		this._options = options;
	}

	InsertCommand.prototype._getCoreCommand = function() {
		return this.__getCoreCommand(this._table, this._row, this._options);
	};

	InsertCommand.prototype.sql = function() {
		return this._getCoreCommand().sql();
	};

	InsertCommand.prototype.matches = function(otherRow) {
		return this._row === otherRow;
	};


	InsertCommand.prototype.endEdit = function() {
		this.sql();
		var dto = createDto(this._table, this._row);
		if (this._disallowCompress || this._table._emitChanged.callbacks.length > 0)
			this._patch = createPatch([], [dto]);
	};

	InsertCommand.prototype.emitChanged = function() {
		return this._table._emitChanged({row: this._row, patch: this._patch});
	};

	Object.defineProperty(InsertCommand.prototype, 'parameters', {
		get: function() {
			return this._getCoreCommand().parameters;

		}
	});

	Object.defineProperty(InsertCommand.prototype, 'disallowCompress', {
		get: function() {
			return this._disallowCompress || this._table._emitChanged.callbacks.length > 0;

		},
		set: function(value) {
			this._disallowCompress = value;
		}
	});


	newInsertCommand_1 = newInsertCommand;
	return newInsertCommand_1;
}

var getSqlTemplate_1;
var hasRequiredGetSqlTemplate;

function requireGetSqlTemplate () {
	if (hasRequiredGetSqlTemplate) return getSqlTemplate_1;
	hasRequiredGetSqlTemplate = 1;
	let getSessionContext = requireGetSessionContext();
	let quote = requireQuote$2();

	function getSqlTemplate(context, _table, _row) {
		let rdb = getSessionContext(context);
		if (rdb.insertSql)
			return rdb.insertSql.apply(null, arguments);
		else
			return getSqlTemplateDefault.apply(null, arguments);

	}

	function getSqlTemplateDefault(context, table, row) {
		let columnNames = [];
		let values = [];
		let sql = 'INSERT INTO ' + quote(context, table._dbName) + ' ';
		addDiscriminators();
		addColumns();
		if (columnNames.length === 0)
			sql += `${outputInserted()}${defaultValues()}${lastInserted()}`;
		else
			sql = sql + '('+ columnNames.join(',') + ') ' + outputInserted() +  'VALUES (' + values.join(',') + ')' + lastInserted() ;
		return sql;

		function addDiscriminators() {
			let discriminators = table._columnDiscriminators;
			for (let i = 0; i < discriminators.length; i++) {
				let parts = discriminators[i].split('=');
				columnNames.push(quote(context, parts[0]));
				values.push(parts[1]);
			}
		}

		function addColumns() {
			let columns = table._columns;
			for (let i = 0; i < columns.length; i++) {
				let column = columns[i];
				if (row['__' + column.alias] !== undefined) {
					columnNames.push(quote(context, column._dbName));
					values.push('%s');
				}
			}
		}

		function lastInserted() {
			let rdb = getSessionContext(context);
			if (!rdb.lastInsertedIsSeparate && rdb.lastInsertedSql)
				return ' ' + rdb.lastInsertedSql(table);
			return '';
		}

		function outputInserted() {
			let rdb = getSessionContext(context);
			if (!rdb.lastInsertedIsSeparate && rdb.outputInsertedSql)
				return ' ' + rdb.outputInsertedSql(table) + ' ';
			return '';
		}

		function defaultValues() {
			let rdb = getSessionContext(context);
			let _default = rdb.insertDefault || 'DEFAULT VALUES';
			return `${_default}${lastInserted()}`;

		}
	}

	getSqlTemplate_1 = getSqlTemplate;
	return getSqlTemplate_1;
}

var newInsertCommandCore_1;
var hasRequiredNewInsertCommandCore;

function requireNewInsertCommandCore () {
	if (hasRequiredNewInsertCommandCore) return newInsertCommandCore_1;
	hasRequiredNewInsertCommandCore = 1;
	const newParameterized = requireNewParameterized();
	const getSqlTemplate = requireGetSqlTemplate();
	const formatString = requireFormat();

	function newInsertCommandCore(context, table, row, options = {}) {
		let parameters = [];
		let values = [getSqlTemplate(context, table, row, options)];

		let columns = table._columns;
		for (let i = 0; i < columns.length; i++) {
			let column = columns[i];
			let alias = column.alias;
			if (row['__' + column.alias] !== undefined) {
				let encoded = column.encode(context, row[alias]);
				if (encoded.parameters.length > 0) {
					values.push(encoded.sql());
					parameters.push(encoded.parameters[0]);
				} else
					values.push(encoded.sql());
			}
		}

		let sql = formatString.apply(null, values);
		return newParameterized(sql, parameters);
	}

	newInsertCommandCore_1 = newInsertCommandCore;
	return newInsertCommandCore_1;
}

var newGetLastInsertedCommandCore_1;
var hasRequiredNewGetLastInsertedCommandCore;

function requireNewGetLastInsertedCommandCore () {
	if (hasRequiredNewGetLastInsertedCommandCore) return newGetLastInsertedCommandCore_1;
	hasRequiredNewGetLastInsertedCommandCore = 1;
	const newParameterized = requireNewParameterized();
	const getSessionContext = requireGetSessionContext();
	const newDiscriminatorSql = requireNewDiscriminatorSql$1();
	const quote = requireQuote$2();

	function newGetLastInsertedCommandCore(context, table, row) {
		let parameters = [];
		let keyValues = table._primaryColumns.map(column => row['__' + column.alias]);
		let sql = `SELECT ${columnNames()} FROM ${quote(context, table._dbName)} WHERE ${whereSql()}`;
		return newParameterized(sql, parameters);

		function columnNames() {
			return table._columns.map(formatColumn).join(',');
		}

		function formatColumn(column) {
			const formatted = column.formatOut ? column.formatOut(context)  + ' as ' + quote(context, column._dbName) :  quote(context, column._dbName);
			if (column.dbNull === null)
				return formatted;
			else {
				const encoded = column.encode.unsafe(context, column.dbNull);
				return `CASE WHEN ${formatted}=${encoded} THEN null ELSE ${formatted} END`;
			}
		}

		function whereSql() {
			let parameterized;
			let filter = getSessionContext(context).lastInsertedSql(context, table, keyValues);
			if (Array.isArray(filter)) {
				for (let i = 0; i < filter.length; i++) {
					const sep = i === 0 ? '' : ' AND ';
					if (!filter[i].sql) {
						const sql = filter[i];
						filter[i] = {sql : () => sql};
					}
					let next = newParameterized(sep + filter[i].sql(), filter[i].parameters);
					if (parameterized)
						parameterized = parameterized.append(next);
					else
						parameterized = next;
				}
			}
			else
				parameterized = newParameterized(filter);
			parameters = parameters.concat(parameterized.parameters);
			return [discriminators(), parameterized.sql()].filter(x => x).join(' AND ');
		}

		function discriminators() {
			return newDiscriminatorSql(context, table, table._dbName);
		}
	}

	newGetLastInsertedCommandCore_1 = newGetLastInsertedCommandCore;
	return newGetLastInsertedCommandCore_1;
}

var newGetLastInsertedCommand_1;
var hasRequiredNewGetLastInsertedCommand;

function requireNewGetLastInsertedCommand () {
	if (hasRequiredNewGetLastInsertedCommand) return newGetLastInsertedCommand_1;
	hasRequiredNewGetLastInsertedCommand = 1;
	var newGetLastInsertedCommandCore = requireNewGetLastInsertedCommandCore();
	var newImmutable = requireNewImmutable();

	function newGetLastInsertedCommand(context, table, row, insertCommand) {
		let cmd =  new InsertCommand(context, table, row, insertCommand);
		insertCommand.endEdit = () => {};
		return cmd;
	}

	function InsertCommand(context, table, row, insertCommand) {
		this._insertCommand = insertCommand;
		this.__getCoreCommand = newImmutable(newGetLastInsertedCommandCore.bind(null, context));
		this._table = table;
		this._row = row;
	}

	InsertCommand.prototype._getCoreCommand = function() {
		return this.__getCoreCommand(this._table, this._row);
	};

	InsertCommand.prototype.sql = function() {
		return this._getCoreCommand().sql();
	};

	InsertCommand.prototype.matches = function(otherRow) {
		return this._row === otherRow;
	};


	InsertCommand.prototype.endEdit = function() {
		this._insertCommand.endEdit();
		this.sql();
	};

	Object.defineProperty(InsertCommand.prototype, 'parameters', {
		get: function() {
			return this._getCoreCommand().parameters;

		}
	});

	Object.defineProperty(InsertCommand.prototype, 'disallowCompress', {
		get: function() {
			return true;
		}
	});


	newGetLastInsertedCommand_1 = newGetLastInsertedCommand;
	return newGetLastInsertedCommand_1;
}

var insert$1;
var hasRequiredInsert$1;

function requireInsert$1 () {
	if (hasRequiredInsert$1) return insert$1;
	hasRequiredInsert$1 = 1;
	let newInsertCommand = requireNewInsertCommand();
	let newInsertCommandCore = requireNewInsertCommandCore();
	let newGetLastInsertedCommand = requireNewGetLastInsertedCommand();
	let executeQueries = requireExecuteQueries();
	let pushCommand = requirePushCommand();


	function insertDefault(context, table, row, options) {
		let commands = [];
		let insertCmd = newInsertCommand(newInsertCommandCore.bind(null, context), table, row, options);
		insertCmd.disallowCompress = true;
		pushCommand(context, insertCmd);

		if (options && options.skipSelectAfterInsert)
			return executeQueries(context, []).then(() => [toDbRow(table, row)]);

		let selectCmd = newGetLastInsertedCommand(context, table, row, insertCmd);
		commands.push(selectCmd);

		return executeQueries(context, commands).then((result) => result[result.length - 1]);

	}

	function toDbRow(table, row) {
		const dbRow = {};
		const columns = table._columns || [];
		for (let i = 0; i < columns.length; i++) {
			const column = columns[i];
			dbRow[column._dbName] = row[column.alias];
		}
		return dbRow;
	}

	insert$1 = insertDefault;
	return insert$1;
}

var batchInsert_1;
var hasRequiredBatchInsert;

function requireBatchInsert () {
	if (hasRequiredBatchInsert) return batchInsert_1;
	hasRequiredBatchInsert = 1;
	const executeCommand = requireExecuteCommand();
	const newParameterized = requireNewParameterized();
	const quote = requireQuote$1();

	async function batchInsert(context, table, rows, options = {}) {
		const groups = groupRows(table, rows);
		for (let i = 0; i < groups.length; i++) {
			if (groups[i].columns.length === 0)
				return false;
		}
		for (let i = 0; i < groups.length; i++) {
			const group = groups[i];
			await executeGroup(context, table, group, options);
		}
		return true;
	}

	async function executeGroup(context, table, group, options) {
		const maxParameters = context.rdb.maxParameters || 999;
		const columns = group.columns;
		const chunks = chunkRows(context, group.rows, columns, maxParameters);

		for (let i = 0; i < chunks.length; i++)
			await executeCommand(context, buildCommand(context, table, columns, chunks[i], options));
	}

	function buildCommand(context, table, columns, rows, options) {
		const parameters = [];
		const columnNames = discriminatorColumnNames(table).concat(columns.map(column => quote(column._dbName)));
		const valueRows = rows.map(row => {
			const values = discriminatorValues(table).concat(columns.map(column => {
				const encoded = column.encode(context, row[column.alias]);
				parameters.push(...encoded.parameters);
				return encoded.sql();
			}));
			return '(' + values.join(',') + ')';
		});

		const sql = 'INSERT INTO ' + quote(table._dbName) + ' (' + columnNames.join(',') + ') VALUES '
			+ valueRows.join(',') + onConflict(table, columns, options);
		return newParameterized(sql, parameters);
	}

	function groupRows(table, rows) {
		const groups = [];
		const groupsByKey = {};
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const columns = table._columns.filter(column => row['__' + column.alias] !== undefined);
			const key = columns.map(column => column.alias).join('\0');
			let group = groupsByKey[key];
			if (!group) {
				group = { columns, rows: [] };
				groupsByKey[key] = group;
				groups.push(group);
			}
			group.rows.push(row);
		}
		return groups;
	}

	function countParameterColumns(context, row, columns) {
		let count = 0;
		for (let i = 0; i < columns.length; i++) {
			const encoded = columns[i].encode(context, row[columns[i].alias]);
			count += encoded.parameters.length;
		}
		return count;
	}

	function chunkRows(context, rows, columns, maxParameters) {
		const chunks = [];
		let chunk = [];
		let parameterCount = 0;
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const rowParameterCount = countParameterColumns(context, row, columns);
			if (chunk.length > 0 && parameterCount + rowParameterCount > maxParameters) {
				chunks.push(chunk);
				chunk = [];
				parameterCount = 0;
			}
			chunk.push(row);
			parameterCount += rowParameterCount;
		}
		if (chunk.length > 0)
			chunks.push(chunk);
		return chunks;
	}

	function discriminatorColumnNames(table) {
		return table._columnDiscriminators.map(discriminator => quote(discriminator.split('=')[0]));
	}

	function discriminatorValues(table) {
		return table._columnDiscriminators.map(discriminator => discriminator.split('=')[1]);
	}

	function onConflict(table, columns, options) {
		if (options.concurrency !== 'skipOnConflict' && options.concurrency !== 'overwrite')
			return '';

		const primaryKeys = table._primaryColumns.map(x => quote(x._dbName)).join(',');
		const updates = [];
		for (let i = 0; i < columns.length; i++) {
			const column = columns[i];
			const concurrency = options[column.alias]?.concurrency || options.concurrency;
			const columnName = quote(column._dbName);
			if (concurrency === 'overwrite')
				updates.push(`${columnName}=excluded.${columnName}`);
			else if (concurrency === 'optimistic')
				updates.push(`${columnName} = CASE WHEN ${table._dbName}.${columnName} <> excluded.${columnName} THEN '12345678-1234-1234-1234-123456789012Conflict when updating ${columnName}12345678-1234-1234-1234-123456789012' ELSE ${table._dbName}.${columnName} END`);
		}

		if (updates.length === 0)
			return ` ON CONFLICT(${primaryKeys}) DO NOTHING`;
		return ` ON CONFLICT(${primaryKeys}) DO UPDATE SET ${updates.join(',')}`;
	}

	batchInsert_1 = batchInsert;
	return batchInsert_1;
}

var newTransaction$3;
var hasRequiredNewTransaction$3;

function requireNewTransaction$3 () {
	if (hasRequiredNewTransaction$3) return newTransaction$3;
	hasRequiredNewTransaction$3 = 1;
	const wrapQuery = requireWrapQuery$2();
	const wrapCommand = requireWrapCommand$2();
	const encodeBoolean = requireEncodeBoolean$1();
	const formatBigintOut = requireFormatBigintOut();
	const deleteFromSql = requireDeleteFromSql$1();
	const selectForUpdateSql = requireSelectForUpdateSql$1();
	const lastInsertedSql = requireLastInsertedSql$1();
	const limitAndOffset = requireLimitAndOffset$1();
	const insertSql = requireInsertSql$1();
	const insert = requireInsert$1();
	const batchInsert = requireBatchInsert();

	function newResolveTransaction(domain, pool, { readonly = false } = {})  {
		var rdb = {poolFactory: pool};
		if (!pool.connect) {
			pool = pool();
			rdb.pool = pool;
		}
		rdb.engine = 'sqlite';
		rdb.maxParameters = 100;
		rdb.encodeBoolean = encodeBoolean;
		rdb.decodeJSON = decodeJSON;
		rdb.encodeJSON = JSON.stringify;
		rdb.formatBigintOut = formatBigintOut;
		rdb.deleteFromSql = deleteFromSql;
		rdb.selectForUpdateSql = selectForUpdateSql;
		rdb.lastInsertedSql = lastInsertedSql;
		rdb.insertSql = insertSql;
		rdb.insert = insert;
		rdb.batchInsert = batchInsert;
		rdb.lastInsertedIsSeparate = true;
		rdb.multipleStatements = false;
		rdb.limitAndOffset = limitAndOffset;
		rdb.accept = function(caller) {
			caller.visitSqlite();
		};
		rdb.aggregateCount = 0;
		rdb.quote = (name) => `"${name}"`;
		rdb.cache = {};
		rdb.changes = [];

		if (readonly) {
			rdb.dbClient = {
				executeQuery: function(query, callback) {
					pool.connect((err, client, done) => {
						if (err) {
							return callback(err);
						}
						try {
							wrapQuery(domain, client)(query, (err, res) => {
								done();
								callback(err, res);
							});
						} catch (e) {
							done();
							callback(e);
						}
					});
				},
				executeCommand: function(query, callback) {
					pool.connect((err, client, done) => {
						if (err) {
							return callback(err);
						}
						try {
							wrapCommand(domain, client)(query, (err, res) => {
								done();
								callback(err, res);
							});
						} catch (e) {
							done();
							callback(e);
						}
					});
				}
			};
			domain.rdb = rdb;
			return (onSuccess) => onSuccess();
		}

		return function(onSuccess, onError) {
			pool.connect(onConnected);

			function onConnected(err, client, done) {
				try {
					if (err) {
						onError(err);
						return;
					}
					client.executeQuery = wrapQuery(domain, client);
					client.executeCommand = wrapCommand(domain, client);
					rdb.dbClient = client;
					rdb.dbClientDone = done;
					domain.rdb = rdb;
					onSuccess();
				} catch (e) {
					onError(e);
				}
			}
		};
	}

	function decodeJSON(value) {
		return JSON.parse(value);
	}

	newTransaction$3 = newResolveTransaction;
	return newTransaction$3;
}

var beginCommand;
var hasRequiredBeginCommand;

function requireBeginCommand () {
	if (hasRequiredBeginCommand) return beginCommand;
	hasRequiredBeginCommand = 1;
	let newParameterized = requireNewParameterized();
	let getSessionContext = requireGetSessionContext();

	beginCommand = function(context) {
		let command = newParameterized(getSessionContext(context).begin || 'BEGIN');
		command.endEdit = empty;
		command.matches = empty;

		function empty() {}

		return command;

	};
	return beginCommand;
}

var begin_1;
var hasRequiredBegin;

function requireBegin () {
	if (hasRequiredBegin) return begin_1;
	hasRequiredBegin = 1;
	let beginCommand = requireBeginCommand();
	let executeQuery = requireExecuteQuery();
	let setSessionSingleton = requireSetSessionSingleton();

	function begin(context, options) {
		if (options && options.suppressSyncOutbox)
			setSessionSingleton(context, 'suppressSyncOutbox', true);
		if (isTransactionLess(options)) {
			setSessionSingleton(context, 'transactionLess', true);
			return Promise.resolve();
		}
		return executeQuery(context, beginCommand(context));
	}

	function isTransactionLess(options) {
		if (options && options.transactionLess)
			return true;
		if (options && options.readonly)
			return true;
		return false;
	}

	begin_1 = begin;
	return begin_1;
}

var promisify_1;
var hasRequiredPromisify;

function requirePromisify () {
	if (hasRequiredPromisify) return promisify_1;
	hasRequiredPromisify = 1;
	function promisify(original) {
		if (typeof original !== 'function') {
			throw new TypeError('The "original" argument must be of type Function');
		}

		return function(...args) {
			return new Promise((resolve, reject) => {
				// Add the callback that Node-style APIs expect
				function callback(err, ...values) {
					if (err) {
						return reject(err);
					}
					// If there's exactly one success value, return it;
					// otherwise, return all values as an array.
					return resolve(values.length > 1 ? values : values[0]);
				}

				// Call the original function, appending our callback
				original.call(this, ...args, callback);
			});
		};
	}

	promisify_1 = promisify;
	return promisify_1;
}

var end$2;
var hasRequiredEnd$2;

function requireEnd$2 () {
	if (hasRequiredEnd$2) return end$2;
	hasRequiredEnd$2 = 1;
	var pools = requirePools();

	function endPool(genericPool, id, done) {
		genericPool.drain(onDrained);

		function onDrained() {
			genericPool.destroyAllNow();
			delete pools[id];
			done();
		}
	}

	end$2 = endPool;
	return end$2;
}

var poolDefaults;
var hasRequiredPoolDefaults;

function requirePoolDefaults () {
	if (hasRequiredPoolDefaults) return poolDefaults;
	hasRequiredPoolDefaults = 1;
	poolDefaults = {
		//Connection pool options - see https://github.com/coopernurse/node-pool
		//number of connections to use in connection pool
		//0 will disable connection pooling
		poolSize: 0,

		//max milliseconds a client can go unused before it is removed
		//from the pool and destroyed
		poolIdleTimeout: 30000,

		//frequeny to check for idle clients within the client pool
		reapIntervalMillis: 1000,

	};
	return poolDefaults;
}

/* eslint-disable @typescript-eslint/no-this-alias */

var genericPool;
var hasRequiredGenericPool;

function requireGenericPool () {
	if (hasRequiredGenericPool) return genericPool;
	hasRequiredGenericPool = 1;
	/* @ts-nocheck */

	/**
	 * A helper function to schedule a callback in a cross-platform manner:
	 * - Uses setImmediate if available (Node).
	 * - Else uses queueMicrotask if available (Deno, modern browsers).
	 * - Else falls back to setTimeout(fn, 0).
	 */
	function queueTask(fn) {
		if (typeof setImmediate === 'function') {
			setImmediate(fn);
		}
		else if
		(typeof queueMicrotask === 'function') {
			queueMicrotask(fn);
		} else {
			setTimeout(fn, 0);
		}
	}

	/**
	   * @class
	   * @private
	   */
	function PriorityQueue(size) {
		if (!(this instanceof PriorityQueue)) {
			return new PriorityQueue(size);
		}

		this._size = Math.max(+size | 0, 1);
		this._slots = [];
		this._total = null;

		// initialize arrays to hold queue elements
		for (let i = 0; i < this._size; i += 1) {
			this._slots.push([]);
		}
	}

	PriorityQueue.prototype.size = function size() {
		if (this._total === null) {
			this._total = 0;
			for (let i = 0; i < this._size; i += 1) {
				this._total += this._slots[i].length;
			}
		}
		return this._total;
	};

	PriorityQueue.prototype.enqueue = function enqueue(obj, priority) {
		// Convert to integer with a default value of 0.
		priority = priority && +priority | 0 || 0;
		this._total = null;
		if (priority < 0 || priority >= this._size) {
			console.error(
				'invalid priority: ' + priority + ' must be between 0 and ' + (this._size - 1)
			);
			priority = this._size - 1; // put obj at the end of the line
		}
		this._slots[priority].push(obj);
	};

	PriorityQueue.prototype.dequeue = function dequeue() {
		let obj = null;
		this._total = null;
		for (let i = 0, sl = this._slots.length; i < sl; i += 1) {
			if (this._slots[i].length) {
				obj = this._slots[i].shift();
				break;
			}
		}
		return obj;
	};

	function doWhileAsync(conditionFn, iterateFn, callbackFn) {
		const next = function() {
			if (conditionFn()) {
				iterateFn(next);
			} else {
				callbackFn();
			}
		};
		next();
	}

	/**
	   * Generate an Object pool with a specified `factory`.
	   *
	   * @class
	   * @param {Object} factory
	   *   Factory to be used for generating and destroying the items.
	   * @param {String} factory.name
	   * @param {Function} factory.create
	   * @param {Function} factory.destroy
	   * @param {Function} factory.validate
	   * @param {Function} factory.validateAsync
	   * @param {Number} factory.max
	   * @param {Number} factory.min
	   * @param {Number} factory.idleTimeoutMillis
	   * @param {Number} factory.reapIntervalMillis
	   * @param {Boolean|Function} factory.log
	   * @param {Number} factory.priorityRange
	   * @param {Boolean} factory.refreshIdle
	   * @param {Boolean} [factory.returnToHead=false]
	   */
	function Pool(factory) {
		if (!(this instanceof Pool)) {
			return new Pool(factory);
		}
		if (factory.validate && factory.validateAsync) {
			throw new Error('Only one of validate or validateAsync may be specified');
		}

		// defaults
		factory.idleTimeoutMillis = factory.idleTimeoutMillis || 30000;
		factory.returnToHead = factory.returnToHead || false;
		factory.refreshIdle = ('refreshIdle' in factory) ? factory.refreshIdle : true;
		factory.reapInterval = factory.reapIntervalMillis || 1000;
		factory.priorityRange = factory.priorityRange || 1;
		factory.validate = factory.validate || function() {
			return true;
		};

		factory.max = parseInt(factory.max, 10);
		factory.min = parseInt(factory.min, 10);
		factory.max = Math.max(isNaN(factory.max) ? 1 : factory.max, 1);
		factory.min = Math.min(isNaN(factory.min) ? 0 : factory.min, factory.max - 1);

		this._factory = factory;
		this._inUseObjects = [];
		this._draining = false;
		this._waitingClients = new PriorityQueue(factory.priorityRange);
		this._availableObjects = [];
		this._asyncTestObjects = [];
		this._count = 0;
		this._removeIdleTimer = null;
		this._removeIdleScheduled = false;

		// create initial resources (if factory.min > 0)
		this._ensureMinimum();
	}

	/**
	   * logs to console or user-defined log function
	   * @private
	   * @param {string} str
	   * @param {string} level
	   */
	Pool.prototype._log = function _log(str, level) {
		if (typeof this._factory.log === 'function') {
			this._factory.log(str, level);
		} else if (this._factory.log) {
			console.log(level.toUpperCase() + ' pool ' + this._factory.name + ' - ' + str);
		}
	};

	/**
	   * Request the client to be destroyed. The factory's destroy handler
	   * will also be called.
	   *
	   * This should be called within an acquire() block as an alternative to release().
	   *
	   * @param {Object} obj
	   *   The acquired item to be destroyed.
	   * @param {Function} [cb]
	   *   Optional. Callback invoked after client is destroyed
	   */
	Pool.prototype.destroy = function destroy(obj, cb) {
		this._count -= 1;
		if (this._count < 0) this._count = 0;

		this._availableObjects = this._availableObjects.filter(
			(objWithTimeout) => objWithTimeout.obj !== obj
		);
		this._inUseObjects = this._inUseObjects.filter(
			(objInUse) => objInUse !== obj
		);

		this._factory.destroy(obj, cb);

		// keep compatibility with old interface
		if (this._factory.destroy.length === 1 && cb && typeof cb === 'function') {
			cb();
		}

		this._ensureMinimum();
	};

	/**
	   * Checks and removes the available (idle) clients that have timed out.
	   * @private
	   */
	Pool.prototype._removeIdle = function _removeIdle() {
		const now = new Date().getTime();
		const refreshIdle = this._factory.refreshIdle;
		const maxRemovable = this._count - this._factory.min;
		const toRemove = [];

		this._removeIdleScheduled = false;

		for (let i = 0; i < this._availableObjects.length; i++) {
			const objWithTimeout = this._availableObjects[i];
			if (
				now >= objWithTimeout.timeout &&
				(refreshIdle || toRemove.length < maxRemovable)
			) {
				this._log(
					'removeIdle() destroying obj - now:' +
					now +
					' timeout:' +
					objWithTimeout.timeout,
					'verbose'
				);
				toRemove.push(objWithTimeout.obj);
			}
		}

		toRemove.forEach((obj) => this.destroy(obj));

		if (this._availableObjects.length > 0) {
			this._log(
				'this._availableObjects.length=' + this._availableObjects.length,
				'verbose'
			);
			this._scheduleRemoveIdle();
		} else {
			this._log('removeIdle() all objects removed', 'verbose');
		}
	};

	/**
	   * Schedule removal of idle items in the pool.
	   *
	   * More schedules cannot run concurrently.
	   */
	Pool.prototype._scheduleRemoveIdle = function _scheduleRemoveIdle() {
		if (!this._removeIdleScheduled) {
			this._removeIdleScheduled = true;
			this._removeIdleTimer = setTimeout(() => {
				this._removeIdle();
			}, this._factory.reapInterval);
		}
	};

	/**
	   * Try to get a new client to work, and clean up pool unused (idle) items.
	   *
	   *  - If there are available clients waiting, shift the first one out,
	   *    and call its callback.
	   *  - If there are no waiting clients, try to create one if it won't exceed
	   *    the maximum number of clients.
	   *  - If creating a new client would exceed the maximum, add the client to
	   *    the wait list.
	   * @private
	   */
	Pool.prototype._dispense = function _dispense() {
		const waitingCount = this._waitingClients.size();
		this._log(
			'dispense() clients=' +
			waitingCount +
			' available=' +
			this._availableObjects.length,
			'info'
		);

		if (waitingCount < 1) {
			return;
		}

		if (this._factory.validateAsync) {
			doWhileAsync(
				() => this._availableObjects.length > 0,
				this._createAsyncValidator(),
				() => {
					if (this._count < this._factory.max) {
						this._createResource();
					}
				}
			);
			return;
		}

		while (this._availableObjects.length > 0) {
			this._log('dispense() - reusing obj', 'verbose');
			const objWithTimeout = this._availableObjects[0];

			if (!this._factory.validate(objWithTimeout.obj)) {
				this.destroy(objWithTimeout.obj);
				continue;
			}

			this._availableObjects.shift();
			this._inUseObjects.push(objWithTimeout.obj);
			const clientCb = this._waitingClients.dequeue();
			return clientCb(null, objWithTimeout.obj);
		}

		if (this._count < this._factory.max) {
			this._createResource();
		}
	};

	Pool.prototype._createAsyncValidator = function _createAsyncValidator() {
		return (next) => {
			this._log('dispense() - reusing obj', 'verbose');
			const objWithTimeout = this._availableObjects.shift();
			this._asyncTestObjects.push(objWithTimeout);

			this._factory.validateAsync(objWithTimeout.obj, (valid) => {
				const pos = this._asyncTestObjects.indexOf(objWithTimeout);
				this._asyncTestObjects.splice(pos, 1);

				if (!valid) {
					this.destroy(objWithTimeout.obj);
					return next();
				}
				if (this._waitingClients.size() < 1) {
					// no longer anyone waiting for a resource
					this._addResourceToAvailableObjects(objWithTimeout.obj);
					return;
				}

				this._inUseObjects.push(objWithTimeout.obj);
				const clientCb = this._waitingClients.dequeue();
				clientCb(null, objWithTimeout.obj);
			});
		};
	};

	/**
	   * @private
	   */
	Pool.prototype._createResource = function _createResource() {
		this._count += 1;
		this._log(
			'createResource() - creating obj - count=' +
			this._count +
			' min=' +
			this._factory.min +
			' max=' +
			this._factory.max,
			'verbose'
		);

		this._factory.create((...args) => {
			let err, obj;
			if (args.length > 1) {
				[err, obj] = args;
			} else {
				err = args[0] instanceof Error ? args[0] : null;
				obj = args[0] instanceof Error ? null : args[0];
			}

			const clientCb = this._waitingClients.dequeue();

			if (err) {
				this._count -= 1;
				if (this._count < 0) this._count = 0;
				if (clientCb) {
					clientCb(err, obj);
				}
				// queueTask to simulate process.nextTick
				queueTask(() => {
					this._dispense();
				});
			} else {
				this._inUseObjects.push(obj);
				if (clientCb) {
					clientCb(null, obj);
				} else {
					this._addResourceToAvailableObjects(obj);
				}
			}
		});
	};

	Pool.prototype._addResourceToAvailableObjects = function(obj) {
		const objWithTimeout = {
			obj,
			timeout: new Date().getTime() + this._factory.idleTimeoutMillis,
		};
		if (this._factory.returnToHead) {
			this._availableObjects.unshift(objWithTimeout);
		} else {
			this._availableObjects.push(objWithTimeout);
		}
		this._dispense();
		this._scheduleRemoveIdle();
	};

	/**
	   * @private
	   */
	Pool.prototype._ensureMinimum = function _ensureMinimum() {
		if (!this._draining && this._count < this._factory.min) {
			const diff = this._factory.min - this._count;
			for (let i = 0; i < diff; i++) {
				this._createResource();
			}
		}
	};

	/**
	   * Request a new client. The callback will be called
	   * when a new client is available.
	   *
	   * @param {Function} callback
	   * @param {Number} [priority]
	   * @returns {Boolean} true if the pool is not fully utilized, false otherwise
	   */
	Pool.prototype.acquire = function acquire(callback, priority) {
		if (this._draining) {
			throw new Error('pool is draining and cannot accept work');
		}
		this._waitingClients.enqueue(callback, priority);
		this._dispense();
		return this._count < this._factory.max;
	};

	/**
	   * @deprecated
	   */
	Pool.prototype.borrow = function borrow(callback, priority) {
		this._log('borrow() is deprecated. use acquire() instead', 'warn');
		return this.acquire(callback, priority);
	};

	/**
	   * Return the client to the pool, indicating it is no longer needed.
	   *
	   * @param {Object} obj
	   */
	Pool.prototype.release = function release(obj) {
		// Check whether this object has already been released
		const alreadyReleased = this._availableObjects.some(o => o.obj === obj);
		if (alreadyReleased) {
			this._log(
				'release called twice for the same resource: ' + new Error().stack,
				'error'
			);
			return;
		}

		// remove from in-use list
		const index = this._inUseObjects.indexOf(obj);
		if (index < 0) {
			this._log(
				'attempt to release an invalid resource: ' + new Error().stack,
				'error'
			);
			return;
		}

		this._inUseObjects.splice(index, 1);
		this._addResourceToAvailableObjects(obj);
	};

	/**
	   * @deprecated
	   */
	Pool.prototype.returnToPool = function returnToPool(obj) {
		this._log('returnToPool() is deprecated. use release() instead', 'warn');
		this.release(obj);
	};

	function invoke(cb) {
		queueTask(cb);
	}

	/**
	   * Disallow any new requests and let the request backlog dissipate.
	   *
	   * @param {Function} [callback]
	   *   Callback invoked when all work is done and all clients have been released.
	   */
	Pool.prototype.drain = function drain(callback) {
		this._log('draining', 'info');
		this._draining = true;

		const check = () => {
			if (this._waitingClients.size() > 0) {
				// wait until all client requests have been satisfied
				return setTimeout(check, 100);
			}
			if (this._asyncTestObjects.length > 0) {
				// wait until async validations are done
				return setTimeout(check, 100);
			}
			if (this._availableObjects.length !== this._count) {
				// wait until in-use objects have been released
				return setTimeout(check, 100);
			}
			if (callback) {
				invoke(callback);
			}
		};
		check();
	};

	/**
	   * Forcibly destroys all clients regardless of timeout.
	   * Does not prevent creation of new clients from subsequent calls to acquire.
	   *
	   * If factory.min > 0, the pool will destroy all idle resources
	   * but replace them with newly created resources up to factory.min.
	   * If this is not desired, set factory.min to zero before calling.
	   *
	   * @param {Function} [callback]
	   *   Invoked after all existing clients are destroyed.
	   */
	Pool.prototype.destroyAllNow = function destroyAllNow(callback) {
		this._log('force destroying all objects', 'info');
		const willDie = this._availableObjects;
		this._availableObjects = [];
		const todo = willDie.length;
		let done = 0;

		this._removeIdleScheduled = false;
		clearTimeout(this._removeIdleTimer);

		if (todo === 0 && callback) {
			invoke(callback);
			return;
		}

		while (willDie.length > 0) {
			const { obj } = willDie.shift();
			this.destroy(obj, () => {
				done += 1;
				if (done === todo && callback) {
					invoke(callback);
				}
			});
		}
	};

	/**
	   * Decorates a function to use an acquired client from the pool when called.
	   *
	   * @param {Function} decorated
	   * @param {Number} [priority]
	   */
	Pool.prototype.pooled = function pooled(decorated, priority) {
		return (...args) => {
			const callerCallback = args[args.length - 1];
			const callerHasCallback = typeof callerCallback === 'function';

			this.acquire((err, client) => {
				if (err) {
					if (callerHasCallback) {
						callerCallback(err);
					}
					return;
				}

				// We pass everything except the user's final callback
				const invokeArgs = [client].concat(
					args.slice(0, callerHasCallback ? -1 : undefined)
				);
				// then the final callback after we release the resource
				invokeArgs.push((...cbArgs) => {
					this.release(client);
					if (callerHasCallback) {
						callerCallback(...cbArgs);
					}
				});

				decorated(...invokeArgs);
			}, priority);
		};
	};

	Pool.prototype.getPoolSize = function getPoolSize() {
		return this._count;
	};

	Pool.prototype.getName = function getName() {
		return this._factory.name;
	};

	Pool.prototype.availableObjectsCount = function availableObjectsCount() {
		return this._availableObjects.length;
	};

	Pool.prototype.inUseObjectsCount = function inUseObjectsCount() {
		return this._inUseObjects.length;
	};

	Pool.prototype.waitingClientsCount = function waitingClientsCount() {
		return this._waitingClients.size();
	};

	Pool.prototype.getMaxPoolSize = function getMaxPoolSize() {
		return this._factory.max;
	};

	Pool.prototype.getMinPoolSize = function getMinPoolSize() {
		return this._factory.min;
	};

	genericPool = { Pool };
	return genericPool;
}

/* eslint-disable no-prototype-builtins */

var newGenericPool_1;
var hasRequiredNewGenericPool;

function requireNewGenericPool () {
	if (hasRequiredNewGenericPool) return newGenericPool_1;
	hasRequiredNewGenericPool = 1;
	var defaults = requirePoolDefaults();
	var genericPool = requireGenericPool();

	function newGenericPool(d1Database, poolOptions) {
		poolOptions = poolOptions || {};
		// @ts-ignore
		var pool = genericPool.Pool({
			min: poolOptions.min || 0,
			max: 1,
			idleTimeoutMillis: poolOptions.idleTimeout || defaults.poolIdleTimeout,
			reapIntervalMillis: poolOptions.reapIntervalMillis || defaults.reapIntervalMillis,
			log: poolOptions.log || defaults.poolLog,
			create: function(cb) {
				var client = {d1: d1Database, poolCount: 0};

				return cb(null, client);
			},

			destroy: function() {
			}
		});
		//monkey-patch with connect method
		pool.connect = function(cb) {

			pool.acquire(function(err, client) {
				if(err)  return cb(err, null, function() {/*NOOP*/});
				client.poolCount++;
				cb(null, client, function(err) {
					if(err) {
						pool.destroy(client);
					} else {
						pool.release(client);
					}
				});
			});
		};
		return pool;
	}

	newGenericPool_1 = newGenericPool;
	return newGenericPool_1;
}

var newPool_1$3;
var hasRequiredNewPool$3;

function requireNewPool$3 () {
	if (hasRequiredNewPool$3) return newPool_1$3;
	hasRequiredNewPool$3 = 1;
	const promisify = requirePromisify();
	const pools = requirePools();
	const end = requireEnd$2();
	const newGenericPool = requireNewGenericPool();
	const newId = requireNewId();

	function newPool(d1Database, poolOptions) {
		var pool = newGenericPool(d1Database, poolOptions);
		var id = newId();
		var boundEnd = end.bind(null, pool, id);
		var c = {};

		c.connect = pool.connect;
		c.end = promisify(boundEnd);
		pools[id] = c;
		return c;
	}

	newPool_1$3 = newPool;
	return newPool_1$3;
}

var newDatabase_1$3;
var hasRequiredNewDatabase$3;

function requireNewDatabase$3 () {
	if (hasRequiredNewDatabase$3) return newDatabase_1$3;
	hasRequiredNewDatabase$3 = 1;
	let createDomain = requireCreateDomain();
	let newTransaction = requireNewTransaction$3();
	let _begin = requireBegin();
	let commit = requireCommit();
	let rollback = requireRollback();
	let newPool = requireNewPool$3();
	let express = requireHostExpress();
	let hono = requireHostHono();
	let hostLocal = requireHostLocal();
	let doQuery = requireQuery();
	let releaseDbClient = requireReleaseDbClient();

	function newDatabase(d1Database, poolOptions) {
		if (!d1Database)
			throw new Error('Missing d1Database');
		poolOptions = poolOptions || { min: 1 };
		var pool = newPool(d1Database, poolOptions);

		let c = { poolFactory: pool, hostLocal, express, hono };

		c.transaction = function(options, fn) {
			if ((arguments.length === 1) && (typeof options === 'function')) {
				fn = options;
				options = undefined;
			}
			let domain = createDomain();

			if (!fn)
				throw new Error('transaction requires a function');
			return domain.run(runInTransaction);

			async function runInTransaction() {
				let result;
				let transaction = newTransaction(domain, pool, options);
				await new Promise(transaction)
					.then(begin)
					.then(() => fn(domain))
					.then((res) => result = res)
					.then(() => c.commit(domain))
					.then(null, (e) =>  c.rollback(domain,e));
				return result;
			}

			function begin() {
				return _begin(domain, { transactionLess: true });
			}


		};

		c.createTransaction = function(options) {
			let domain = createDomain();
			let transaction = newTransaction(domain, pool, options);
			let p = domain.run(() => new Promise(transaction).then(begin));

			function run(fn) {
				return p.then(domain.run.bind(domain, fn));
			}

			function begin() {
				return _begin(domain, options);
			}

			run.rollback = rollback.bind(null, domain);
			run.commit = commit.bind(null, domain);

			return run;

		};

		c.query = function(query) {
			let domain = createDomain();
			let transaction = newTransaction(domain, pool);
			let p = domain.run(() => new Promise(transaction)
				.then(() => doQuery(domain, query).then(onResult, onError)));
			return p;

			function onResult(result) {
				releaseDbClient(domain);
				return result;
			}

			function onError(e) {
				releaseDbClient(domain);
				throw e;
			}
		};

		c.rollback = rollback;
		c.commit = commit;

		c.end = function() {
			if (poolOptions)
				return pool.end();
			else
				return Promise.resolve();
		};

		c.accept = function(caller) {
			caller.visitSqlite();
		};

		return c;
	}

	newDatabase_1$3 = newDatabase;
	return newDatabase_1$3;
}

var replaceParamChar_1;
var hasRequiredReplaceParamChar;

function requireReplaceParamChar () {
	if (hasRequiredReplaceParamChar) return replaceParamChar_1;
	hasRequiredReplaceParamChar = 1;
	function replaceParamChar(query, params) {
		if (params.length === 0)
			return query.sql();
		var splitted = query.sql().split('?');
		var sql = '';
		var lastIndex = splitted.length - 1;
		for (var i = 0; i < lastIndex; i++) {
			sql += splitted[i] + '$' + (i + 1);
		}
		sql += splitted[lastIndex];
		return sql;
	}

	replaceParamChar_1 = replaceParamChar;
	return replaceParamChar_1;
}

var wrapQuery_1$1;
var hasRequiredWrapQuery$1;

function requireWrapQuery$1 () {
	if (hasRequiredWrapQuery$1) return wrapQuery_1$1;
	hasRequiredWrapQuery$1 = 1;
	var log = requireLog();
	var replaceParamChar = requireReplaceParamChar();

	function wrapQuery(_context, connection) {
		var runOriginalQuery = connection.query;
		return runQuery;

		function runQuery(query, onCompleted) {
			var params = query.parameters;
			var sql = replaceParamChar(query, params);
			var completeQuery = log.startQuery({sql, parameters: params});
			runOriginalQuery.call(connection, sql, params).then((result) => onInnerCompleted(null, result), (e) => onInnerCompleted(e));

			function onInnerCompleted(err, result) {
				completeQuery(err);
				if (err)
					onCompleted(err);
				else {
					if (Array.isArray(result))
						result = result[result.length-1];
					onCompleted(null, result.rows);
				}
			}
		}

	}

	wrapQuery_1$1 = wrapQuery;
	return wrapQuery_1$1;
}

var wrapCommand_1$1;
var hasRequiredWrapCommand$1;

function requireWrapCommand$1 () {
	if (hasRequiredWrapCommand$1) return wrapCommand_1$1;
	hasRequiredWrapCommand$1 = 1;
	var log = requireLog();
	var replaceParamChar = requireReplaceParamChar();

	function wrapCommand(_context, connection) {
		var runOriginalQuery = connection.query;
		return runQuery;

		function runQuery(query, onCompleted) {
			var params = query.parameters;
			var sql = replaceParamChar(query, params);
			var completeQuery = log.startQuery({ sql, parameters: params });

			runOriginalQuery
				.call(connection, sql, params)
				.then(
					(result) => onInnerCompleted(null, result),
					(e) => onInnerCompleted(e)
				);

			function onInnerCompleted(err, result) {
				completeQuery(err);
				if (err) return onCompleted(err);

				if (Array.isArray(result)) result = result[result.length - 1];

				onCompleted(null, { rowsAffected: result.affectedRows });
			}
		}
	}

	wrapCommand_1$1 = wrapCommand;
	return wrapCommand_1$1;
}

var encodeDate_1;
var hasRequiredEncodeDate;

function requireEncodeDate () {
	if (hasRequiredEncodeDate) return encodeDate_1;
	hasRequiredEncodeDate = 1;
	function encodeDate(date) {
		if (date.toISOString)
			return  '\'' + date.toISOString() + '\'';
		return '\'' + date + '\'';
	}

	encodeDate_1 = encodeDate;
	return encodeDate_1;
}

var encodeBinary_1;
var hasRequiredEncodeBinary;

function requireEncodeBinary () {
	if (hasRequiredEncodeBinary) return encodeBinary_1;
	hasRequiredEncodeBinary = 1;
	function encodeBinary(base64) {
		// Decode base64 to a binary string
		const binaryString = atob(base64);

		// Create a new Uint8Array with the same length as the binary string
		const len = binaryString.length;
		const bytes = new Uint8Array(len);

		// Populate the Uint8Array with numeric character codes
		for (let i = 0; i < len; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}

		return bytes;
	}

	encodeBinary_1 = encodeBinary;
	return encodeBinary_1;
}

var decodeBinary_1;
var hasRequiredDecodeBinary;

function requireDecodeBinary () {
	if (hasRequiredDecodeBinary) return decodeBinary_1;
	hasRequiredDecodeBinary = 1;
	function decodeBinary(u8Arr) {
		let binaryString = '';
		for (let i = 0; i < u8Arr.length; i++) {
			binaryString += String.fromCharCode(u8Arr[i]);
		}
		return btoa(binaryString);
	}

	decodeBinary_1 = decodeBinary;
	return decodeBinary_1;
}

var quote;
var hasRequiredQuote;

function requireQuote () {
	if (hasRequiredQuote) return quote;
	hasRequiredQuote = 1;
	quote = (name) => `"${name}"`;
	return quote;
}

var deleteFromSql_1;
var hasRequiredDeleteFromSql;

function requireDeleteFromSql () {
	if (hasRequiredDeleteFromSql) return deleteFromSql_1;
	hasRequiredDeleteFromSql = 1;
	const format = 'delete from %s %s%s';
	const formatString = requireFormat();
	const quote = requireQuote();

	function deleteFromSql(table, alias, whereSql) {
		const name = quote(table._dbName);
		alias = quote(alias);
		return formatString(format, name, alias, whereSql);
	}
	deleteFromSql_1 = deleteFromSql;
	return deleteFromSql_1;
}

var selectForUpdateSql;
var hasRequiredSelectForUpdateSql;

function requireSelectForUpdateSql () {
	if (hasRequiredSelectForUpdateSql) return selectForUpdateSql;
	hasRequiredSelectForUpdateSql = 1;
	const quote = requireQuote$2();

	selectForUpdateSql = function(alias) {
		return ' FOR UPDATE OF ' + quote(alias);
	};
	return selectForUpdateSql;
}

var limitAndOffset_1;
var hasRequiredLimitAndOffset;

function requireLimitAndOffset () {
	if (hasRequiredLimitAndOffset) return limitAndOffset_1;
	hasRequiredLimitAndOffset = 1;
	function limitAndOffset(span) {
		if (span.offset)
			return ` limit ${limit()} offset ${span.offset}`;
		else if (span.limit || span.limit === 0)
			return ` limit ${span.limit}`;
		else
			return '';

		function limit() {
			if (span.limit || span.limit === 0)
				return span.limit;
			else
				return 'all';
		}

	}

	limitAndOffset_1 = limitAndOffset;
	return limitAndOffset_1;
}

var formatDateOut_1;
var hasRequiredFormatDateOut;

function requireFormatDateOut () {
	if (hasRequiredFormatDateOut) return formatDateOut_1;
	hasRequiredFormatDateOut = 1;
	function formatDateOut(column, alias) {
		if (alias)
			return `${alias}."${(column._dbName)}"::text`;
		else
			return `"${(column._dbName)}"::text`;
	}

	formatDateOut_1 = formatDateOut;
	return formatDateOut_1;
}

var lastInsertedSql_1;
var hasRequiredLastInsertedSql;

function requireLastInsertedSql () {
	if (hasRequiredLastInsertedSql) return lastInsertedSql_1;
	hasRequiredLastInsertedSql = 1;
	const quote = requireQuote();

	function lastInsertedSql(table) {
		let separator = '';
		let result = 'RETURNING ';
		for (let i = 0; i < table._columns.length; i++) {
			result += separator + quote(table._columns[i]._dbName);
			separator = ',';
		}
		return result;
	}

	lastInsertedSql_1 = lastInsertedSql;
	return lastInsertedSql_1;
}

var insertSql_1;
var hasRequiredInsertSql;

function requireInsertSql () {
	if (hasRequiredInsertSql) return insertSql_1;
	hasRequiredInsertSql = 1;
	let lastInsertedSql = requireLastInsertedSql();
	const quote = requireQuote();

	function insertSql(_context, table, row, options) {
		let columnNames = [];
		let conflictColumnUpdateSql = '';
		let values = [];
		let sql = 'INSERT INTO ' + quote(table._dbName) + ' ';
		addDiscriminators();
		addColumns();
		if (columnNames.length === 0)
			sql += `${outputInserted()}DEFAULT VALUES ${lastInsertedSql(table)}`;
		else
			sql = sql + '(' + columnNames.join(',') + ') ' + outputInserted() + 'VALUES (' + values.join(',') + ')' + onConflict() + lastInsertedSql(table);
		return sql;

		function onConflict() {
			if (options.concurrency === 'skipOnConflict' || options.concurrency === 'overwrite') {
				const primaryKeys = table._primaryColumns.map(x => quote(x._dbName)).join(',');
				return ` ON CONFLICT(${primaryKeys}) ${conflictColumnUpdateSql} `;
			}
			else return '';
		}

		function addDiscriminators() {
			let discriminators = table._columnDiscriminators;
			for (let i = 0; i < discriminators.length; i++) {
				let parts = discriminators[i].split('=');
				columnNames.push(quote(parts[0]));
				values.push(parts[1]);
			}
		}

		function addColumns() {
			let conflictColumnUpdates = [];
			let columns = table._columns;
			for (let i = 0; i < columns.length; i++) {
				let column = columns[i];
				const columnName = quote(column._dbName);
				if (row['__' + column.alias] !== undefined) {
					columnNames.push(columnName);
					values.push('%s');
					addConflictUpdate(column);
				}
			}
			if (conflictColumnUpdates.length === 0)
				conflictColumnUpdateSql = 'DO NOTHING';
			else
				conflictColumnUpdateSql = 'DO UPDATE SET ' + conflictColumnUpdates.join(',');

			function addConflictUpdate(column) {
				let concurrency = options[column.alias]?.concurrency || options.concurrency;
				const columnName = quote(column._dbName);
				const tableName = quote(table._dbName);
				if (concurrency === 'overwrite')
					conflictColumnUpdates.push(`${columnName}=EXCLUDED.${columnName}`);
				else if (concurrency === 'optimistic')
					conflictColumnUpdates.push(`${columnName} = CASE WHEN ${tableName}.${columnName} <> EXCLUDED.${columnName} THEN CAST(random()::int || '12345678-1234-1234-1234-123456789012Conflict when updating ${columnName}12345678-1234-1234-1234-123456789012' AS INTEGER) ELSE ${tableName}.${columnName} END`);
			}
		}


		function outputInserted() {
			return '';
		}
	}

	insertSql_1 = insertSql;
	return insertSql_1;
}

var insert;
var hasRequiredInsert;

function requireInsert () {
	if (hasRequiredInsert) return insert;
	hasRequiredInsert = 1;
	let newInsertCommand = requireNewInsertCommand();
	let newInsertCommandCore = requireNewInsertCommandCore();
	let executeQueries = requireExecuteQueries();


	function insertDefault(context, table, row, options) {
		let insertCmd = newInsertCommand(newInsertCommandCore.bind(null, context), table, row, options);
		insertCmd.disallowCompress = true;

		return executeQueries(context, [insertCmd]).then((result) => result[result.length - 1]);

	}

	insert = insertDefault;
	return insert;
}

var newTransaction$2;
var hasRequiredNewTransaction$2;

function requireNewTransaction$2 () {
	if (hasRequiredNewTransaction$2) return newTransaction$2;
	hasRequiredNewTransaction$2 = 1;
	var wrapQuery = requireWrapQuery$1();
	var wrapCommand = requireWrapCommand$1();
	var encodeDate = requireEncodeDate();
	const encodeBinary = requireEncodeBinary();
	const decodeBinary = requireDecodeBinary();
	var deleteFromSql = requireDeleteFromSql();
	var selectForUpdateSql = requireSelectForUpdateSql();
	var limitAndOffset = requireLimitAndOffset();
	var formatDateOut = requireFormatDateOut();
	var insertSql = requireInsertSql();
	var insert = requireInsert();
	var quote = requireQuote();

	function newResolveTransaction(domain, pool, { readonly = false } = {}) {
		var rdb = { poolFactory: pool };
		if (!pool.connect)
			pool = pool();

		rdb.engine = 'pg';
		rdb.encodeDate = encodeDate;
		rdb.encodeBinary = encodeBinary;
		rdb.decodeBinary = decodeBinary;
		rdb.formatDateOut = formatDateOut;
		rdb.deleteFromSql = deleteFromSql;
		rdb.selectForUpdateSql = selectForUpdateSql;
		rdb.lastInsertedIsSeparate = false;
		rdb.insertSql = insertSql;
		rdb.insert = insert;
		rdb.multipleStatements = true;
		rdb.limitAndOffset = limitAndOffset;
		rdb.accept = function(caller) {
			caller.visitPg();
		};
		rdb.aggregateCount = 0;
		rdb.quote = quote;
		rdb.cache = {};
		rdb.changes = [];

		if (readonly) {
			rdb.dbClient = {
				executeQuery: function(query, callback) {
					pool.connect((err, client, done) => {
						if (err) {
							return callback(err);
						}
						try {
							wrapQuery(domain, client)(query, (err, res) => {
								done();
								callback(err, res);
							});
						} catch (e) {
							done();
							callback(e);
						}
					});
				},
				executeCommand: function(query, callback) {
					pool.connect((err, client, done) => {
						if (err) {
							return callback(err);
						}
						try {
							wrapCommand(domain, client)(query, (err, res) => {
								done();
								callback(err, res);
							});
						} catch (e) {
							done();
							callback(e);
						}
					});
				}
			};
			domain.rdb = rdb;
			return (onSuccess) => onSuccess();
		}

		return function(onSuccess, onError) {
			pool.connect(onConnected);

			function onConnected(err, client, done) {
				try {
					if (err) {
						onError(err);
						return;
					}
					client.executeQuery = wrapQuery(domain, client);
					client.executeCommand = wrapCommand(domain, client);
					rdb.dbClient = client;
					rdb.dbClientDone = done;
					domain.rdb = rdb;
					onSuccess();
				} catch (e) {
					onError(e);
				}
			}
		};
	}

	newTransaction$2 = newResolveTransaction;
	return newTransaction$2;
}

var end$1;
var hasRequiredEnd$1;

function requireEnd$1 () {
	if (hasRequiredEnd$1) return end$1;
	hasRequiredEnd$1 = 1;
	var pools = requirePools();

	function endPool(pgPool, id, done) {
		pgPool.drain(onDrained);

		function onDrained() {
			//todo await
			pgPool.destroyAllNow();
			delete pools[id];
			done();
		}
	}

	end$1 = endPool;
	return end$1;
}

/* eslint-disable no-prototype-builtins */

var newPgPool_1$1;
var hasRequiredNewPgPool$1;

function requireNewPgPool$1 () {
	if (hasRequiredNewPgPool$1) return newPgPool_1$1;
	hasRequiredNewPgPool$1 = 1;
	// Simplified pool creator using URL API and handling search_path param

	const log = requireLog();
	const defaults = requirePoolDefaults();
	const genericPool = requireGenericPool();
	let PGlite;

	function newPgPool(connectionString, poolOptions = {}) {
		let { connStr, searchPath } = extractSearchPath(connectionString);

		//@ts-ignore
		const pool = genericPool.Pool({
			min: poolOptions.min || 0,
			max: poolOptions.size || poolOptions.poolSize || defaults.poolSize,
			idleTimeoutMillis: poolOptions.idleTimeout || defaults.poolIdleTimeout,
			reapIntervalMillis: poolOptions.reapIntervalMillis || defaults.reapIntervalMillis,
			log: poolOptions.log,

			create: async (cb) => {
				try {
					if (!PGlite) ({ PGlite } = await import('@electric-sql/pglite'));
					const client = connStr === undefined ? new PGlite() : new PGlite(connStr);
					client.poolCount = 0;
					await applySearchPath(client, searchPath);
					cb(null, client);
				} catch (err) {
					cb(err, null);
				}
			},

			destroy: (client) => {
				client._destroying = true;
				client.poolCount = undefined;
				client.close();
			},
		});

		pool.connect = (cb) => {
			pool.acquire((err, client) => {
				if (err) return cb(err, null, () => { });
				client.poolCount++;
				cb(null, client, (releaseErr) => {
					releaseErr ? pool.destroy(client) : pool.release(client);
				});
			});
		};

		return pool;
	}

	async function applySearchPath(client, searchPath) {
		if (searchPath) {
			const sql = `SET search_path TO ${searchPath}`;
			const completeQuery = log.startQuery({ sql, parameters: [] });
			try {
				await client.exec(sql);
				completeQuery();
			}
			catch (e) {
				completeQuery(e);
				throw e;
			}
		}
	}

	function extractSearchPath(connectionString) {
		let connStr = connectionString;
		let searchPath;

		// Guard: nothing to do
		if (typeof connectionString !== 'string' || connectionString.length === 0) {
			return { connStr, searchPath };
		}

		// Split on the *first* "?" only
		const qPos = connectionString.indexOf('?');
		if (qPos === -1) {
			// No query-string segment
			return { connStr, searchPath };
		}

		const pathPart = connectionString.slice(0, qPos);
		const qsPart = connectionString.slice(qPos + 1);

		// Robust query-string handling via URLSearchParams
		const params = new URLSearchParams(qsPart);

		const paramName = 'search_path';

		{
			searchPath = params.get(paramName);
			params.delete(paramName);
		}

		// Re-assemble the cleaned connection string
		const remainingQs = params.toString();
		connStr = remainingQs ? `${pathPart}?${remainingQs}` : pathPart;

		return { connStr, searchPath };
	}


	newPgPool_1$1 = newPgPool;
	return newPgPool_1$1;
}

var newPool_1$2;
var hasRequiredNewPool$2;

function requireNewPool$2 () {
	if (hasRequiredNewPool$2) return newPool_1$2;
	hasRequiredNewPool$2 = 1;
	const promisify = requirePromisify();
	const pools = requirePools();
	const end = requireEnd$1();
	const newPgPool = requireNewPgPool$1();
	const newId = requireNewId();

	function newPool(connectionString, poolOptions) {
		let pool = newPgPool(connectionString, poolOptions);
		let id = newId();
		let boundEnd = end.bind(null, pool, id);
		let c = {};

		c.connect = pool.connect;
		c.end = promisify(boundEnd);
		pools[id] = c;
		return c;
	}

	newPool_1$2 = newPool;
	return newPool_1$2;
}

var newDatabase_1$2;
var hasRequiredNewDatabase$2;

function requireNewDatabase$2 () {
	if (hasRequiredNewDatabase$2) return newDatabase_1$2;
	hasRequiredNewDatabase$2 = 1;
	let createDomain = requireCreateDomain();
	let newTransaction = requireNewTransaction$2();
	let _begin = requireBegin();
	let commit = requireCommit();
	let rollback = requireRollback();
	let newPool = requireNewPool$2();
	let lock = requireLock();
	let executeSchema = requireSchema();
	let express = requireHostExpress();
	let hono = requireHostHono();
	let hostLocal = requireHostLocal();
	let doQuery = requireQuery();
	let releaseDbClient = requireReleaseDbClient();

	function newDatabase(connectionString, poolOptions) {
		poolOptions = poolOptions || { min: 1 };
		var pool = newPool(connectionString, poolOptions);

		let c = { poolFactory: pool, hostLocal, express, hono };

		c.transaction = function(options, fn) {
			if ((arguments.length === 1) && (typeof options === 'function')) {
				fn = options;
				options = undefined;
			}
			let domain = createDomain();

			if (!fn)
				throw new Error('transaction requires a function');
			return domain.run(runInTransaction);

			async function runInTransaction() {
				let result;
				let transaction = newTransaction(domain, pool, options);
				await new Promise(transaction)
					.then(begin)
					.then(negotiateSchema)
					.then(() => fn(domain))
					.then((res) => result = res)
					.then(() => commit(domain))
					.then(null, (e) => rollback(domain,e));
				return result;
			}

			function begin() {
				return _begin(domain, options);
			}


			function negotiateSchema(previous) {
				let schema = options && options.schema;
				if (!schema)
					return previous;
				return executeSchema(domain, schema);
			}
		};

		c.createTransaction = function(options) {
			let domain = createDomain();
			let transaction = newTransaction(domain, pool, options);
			let p = domain.run(() => new Promise(transaction)
				.then(begin).then(negotiateSchema));

			function run(fn) {
				return p.then(domain.run.bind(domain, fn));
			}

			function begin() {
				return _begin(domain, options);
			}

			function negotiateSchema(previous) {
				let schema = options && options.schema;
				if (!schema)
					return previous;
				return executeSchema(domain,schema);
			}

			run.rollback = rollback.bind(null, domain);
			run.commit = commit.bind(null, domain);

			return run;
		};

		c.query = function(query) {
			let domain = createDomain();
			let transaction = newTransaction(domain, pool);
			let p = domain.run(() => new Promise(transaction)
				.then(() => doQuery(domain, query).then(onResult, onError)));
			return p;

			function onResult(result) {
				releaseDbClient(domain);
				return result;
			}

			function onError(e) {
				releaseDbClient(domain);
				throw e;
			}
		};

		c.rollback = rollback;
		c.commit = commit;
		c.lock = lock;
		c.schema = executeSchema;

		c.end = function() {
			if (poolOptions)
				return pool.end();
			else
				return Promise.resolve();
		};

		c.accept = function(caller) {
			caller.visitPg();
		};

		return c;
	}

	newDatabase_1$2 = newDatabase;
	return newDatabase_1$2;
}

var newTransaction$1;
var hasRequiredNewTransaction$1;

function requireNewTransaction$1 () {
	if (hasRequiredNewTransaction$1) return newTransaction$1;
	hasRequiredNewTransaction$1 = 1;
	const encodeBoolean = requireEncodeBoolean$1();
	const encodeBinary = requireEncodeBinary();
	const decodeBinary = requireDecodeBinary();
	const deleteFromSql = requireDeleteFromSql$1();
	const selectForUpdateSql = requireSelectForUpdateSql$1();
	const lastInsertedSql = requireLastInsertedSql$1();
	const limitAndOffset = requireLimitAndOffset$1();
	const formatBigintOut = requireFormatBigintOut();
	const insertSql = requireInsertSql$1();
	const insert = requireInsert$1();
	const batchInsert = requireBatchInsert();
	const quote = requireQuote$1();

	function newResolveTransaction(domain, pool, { readonly = false } = {})  {
		var rdb = { poolFactory: pool };
		rdb.engine = 'sqlite';
		rdb.encodeBoolean = encodeBoolean;
		rdb.encodeBinary = encodeBinary;
		rdb.decodeBinary = decodeBinary;
		rdb.decodeJSON = decodeJSON;
		rdb.encodeJSON = JSON.stringify;
		rdb.formatBigintOut = formatBigintOut;
		rdb.deleteFromSql = deleteFromSql;
		rdb.selectForUpdateSql = selectForUpdateSql;
		rdb.lastInsertedSql = lastInsertedSql;
		rdb.insertSql = insertSql;
		rdb.insert = insert;
		rdb.batchInsert = batchInsert;
		rdb.lastInsertedIsSeparate = true;
		rdb.multipleStatements = false;
		rdb.limitAndOffset = limitAndOffset;
		rdb.accept = function(caller) {
			caller.visitSqlite();
		};
		rdb.aggregateCount = 0;
		rdb.quote = quote;
		rdb.cache = {};
		rdb.changes = [];

		if (readonly && typeof pool.connectRead === 'function') {
			rdb.dbClient = {
				executeQuery: function(query, callback) {
					pool.connectRead((err, client, done) => {
						if (err)
							return callback(err);
						try {
							client.executeQuery(query, (err, res) => {
								done(err);
								callback(err, res);
							});
						}
						catch (e) {
							done(e);
							callback(e);
						}
					});
				},
				executeCommand: function(query, callback) {
					pool.connect((err, client, done) => {
						if (err)
							return callback(err);
						try {
							client.executeCommand(query, (err, res) => {
								done(err);
								callback(err, res);
							});
						}
						catch (e) {
							done(e);
							callback(e);
						}
					});
				}
			};
			domain.rdb = rdb;
			return (onSuccess) => onSuccess();
		}

		return function(onSuccess, onError) {
			pool.connect(onConnected);

			function onConnected(err, client, done) {
				try {
					if (err) {
						onError(err);
						return;
					}
					rdb.dbClient = client;
					rdb.dbClientDone = done;
					domain.rdb = rdb;
					onSuccess();
				} catch (e) {
					onError(e);
				}
			}
		};
	}

	function decodeJSON(value) {
		return JSON.parse(value);
	}

	newTransaction$1 = newResolveTransaction;
	return newTransaction$1;
}

var inlineWorker;
var hasRequiredInlineWorker;

function requireInlineWorker () {
	if (hasRequiredInlineWorker) return inlineWorker;
	hasRequiredInlineWorker = 1;
	function createInlineSqliteOPFSWorker(options = {}) {
		const listeners = new Map();
		const sqliteModuleUrl = options.sqliteModuleUrl || getDefaultSqliteModuleUrl() || '@sqlite.org/sqlite-wasm';
		const sqliteInitConfig = {};
		const opfsSahPoolOptions = normalizeOpfsSahPoolOptions(options);
		let sqlite3Promise;
		let db;
		let queue = Promise.resolve();
		let closed = false;

		return {
			addEventListener,
			removeEventListener,
			postMessage,
			terminate
		};

		function addEventListener(type, listener) {
			const entries = listeners.get(type) || [];
			entries.push(listener);
			listeners.set(type, entries);
		}

		function removeEventListener(type, listener) {
			const entries = listeners.get(type) || [];
			listeners.set(type, entries.filter((entry) => entry !== listener));
		}

		function postMessage(message) {
			if (closed || !message || message.type !== 'orange-sqlite-opfs-request')
				return;
			queue = queue
				.then(() => dispatchTimed(message))
				.then(({ result, elapsedMs }) => postResponse(message.id, result, undefined, elapsedMs))
				.catch((error) => postResponse(message.id, undefined, error));
		}

		function terminate() {
			closed = true;
			listeners.clear();
			if (db && typeof db.close === 'function') {
				try {
					db.close();
				}
				catch (_e) {
					// Nothing useful to do during worker shutdown.
				}
			}
			db = null;
		}

		async function dispatchTimed(message) {
			const startedAt = now();
			const result = await dispatch(message);
			return {
				result,
				elapsedMs: now() - startedAt
			};
		}

		async function dispatch(message) {
			if (message.method === 'open')
				return openDb(message.connectionString, message.busyTimeoutMs, message.vfs);
			if (message.method === 'close')
				return closeDb();
			if (!db)
				await openDb(message.connectionString || 'orange.sqlite3');
			if (message.method === 'query')
				return query(message.sql, message.parameters);
			if (message.method === 'command')
				return command(message.sql, message.parameters);
			throw new Error('Unknown sqliteOPFS worker method "' + message.method + '".');
		}

		async function openDb(connectionString, busyTimeoutMs = 5000, vfs) {
			if (db)
				return { opened: true, reused: true };
			const sqlite3 = await getSqlite3();
			const filename = normalizeFilename(connectionString);
			const dbInfo = await createDb(sqlite3, filename, vfs);
			db = dbInfo.db;
			db.exec('PRAGMA busy_timeout=' + (Number.parseInt(busyTimeoutMs, 10) || 5000));
			return {
				opened: true,
				opfs: dbInfo.opfs === true,
				vfs: dbInfo.vfs,
				filename: db.filename
			};
		}

		function closeDb() {
			if (db && typeof db.close === 'function')
				db.close();
			db = null;
			return { closed: true };
		}

		async function createDb(sqlite3, filename, vfs) {
			if (!vfs || vfs === 'opfs')
				return createOpfsDb(sqlite3, filename);
			if (vfs === 'opfs-wl')
				return createOpfsWlDb(sqlite3, filename);
			if (vfs === 'opfs-sahpool')
				return createOpfsSahPoolDb(sqlite3, filename);
			if (vfs && vfs !== 'opfs')
				throw new Error('sqliteOPFS vfs "' + vfs + '" is not supported.');
		}

		function createOpfsDb(sqlite3, filename) {
			const DbClass = sqlite3.oo1 && sqlite3.oo1.OpfsDb;
			if (typeof DbClass !== 'function')
				throw new Error('sqliteOPFS vfs "opfs" is not available in this sqlite-wasm build.');
			return {
				db: new DbClass(filename),
				vfs: 'opfs',
				opfs: true
			};
		}

		function createOpfsWlDb(sqlite3, filename) {
			const DbClass = sqlite3.oo1 && sqlite3.oo1.OpfsWlDb;
			if (typeof DbClass !== 'function')
				throw new Error('sqliteOPFS vfs "opfs-wl" is not available in this sqlite-wasm build.');
			return {
				db: new DbClass(filename),
				vfs: 'opfs-wl',
				opfs: true
			};
		}

		async function createOpfsSahPoolDb(sqlite3, filename) {
			if (!sqlite3 || typeof sqlite3.installOpfsSAHPoolVfs !== 'function')
				throw new Error('sqliteOPFS vfs "opfs-sahpool" is not available in this sqlite-wasm build.');
			const pool = await sqlite3.installOpfsSAHPoolVfs(opfsSahPoolOptions);
			const DbClass = pool && pool.OpfsSAHPoolDb;
			if (typeof DbClass !== 'function')
				throw new Error('sqliteOPFS vfs "opfs-sahpool" is not available in this sqlite-wasm build.');
			return {
				db: new DbClass(filename),
				vfs: pool.vfsName || 'opfs-sahpool',
				opfs: true
			};
		}

		async function getSqlite3() {
			if (!sqlite3Promise) {
				sqlite3Promise = loadSqliteModule().then((sqlite3InitModule) => {
					if (typeof sqlite3InitModule !== 'function')
						throw new Error('sqliteOPFS could not load sqlite-wasm module from ' + sqliteModuleUrl + '.');
					return sqlite3InitModule(sqliteInitConfig);
				});
			}
			return sqlite3Promise;
		}

		function loadSqliteModule() {
			if (typeof options.sqlite3InitModule === 'function')
				return Promise.resolve(options.sqlite3InitModule);
			if (typeof options.loadSqlite3 === 'function')
				return Promise.resolve(options.loadSqlite3(sqliteInitConfig));
			return import(sqliteModuleUrl).then((module) => module && module.default || module);
		}

		function query(sql, parameters = []) {
			return db.exec({
				sql,
				bind: normalizeParameters(parameters),
				rowMode: 'object',
				returnValue: 'resultRows'
			});
		}

		function command(sql, parameters = []) {
			const before = Number(db.changes(true) || 0);
			db.exec({
				sql,
				bind: normalizeParameters(parameters)
			});
			const after = Number(db.changes(true) || 0);
			return {
				rowsAffected: Math.max(0, after - before),
				lastInsertRowid: Number(db.selectValue('SELECT last_insert_rowid()'))
			};
		}

		function postResponse(id, result, error, elapsedMs) {
			emit('message', {
				data: {
					type: 'orange-sqlite-opfs-response',
					id,
					result,
					elapsedMs,
					error: error ? serializeError(error) : undefined
				}
			});
		}

		function emit(type, event) {
			for (const listener of listeners.get(type) || [])
				listener(event);
		}
	}

	function getDefaultSqliteModuleUrl() {
		return typeof globalThis !== 'undefined' && typeof globalThis.__orangeOrmSqliteOPFSModuleUrl === 'string'
			? globalThis.__orangeOrmSqliteOPFSModuleUrl
			: null;
	}

	function normalizeOpfsSahPoolOptions(options = {}) {
		const source = options.opfsSahPool || options.opfsSAHPool || options.sahPool;
		if (!source || source !== Object(source))
			return {};
		return { ...source };
	}

	function normalizeFilename(connectionString) {
		const value = String(connectionString || 'orange.sqlite3');
		return value.startsWith('/') ? value : '/' + value;
	}

	function normalizeParameters(parameters) {
		return Array.isArray(parameters) ? parameters.map(normalizeParameter) : parameters;
	}

	function normalizeParameter(value) {
		if (value instanceof ArrayBuffer)
			return new Uint8Array(value);
		return value;
	}

	function now() {
		if (typeof performance !== 'undefined' && performance.now)
			return performance.now();
		return Date.now();
	}

	function serializeError(error) {
		return {
			name: error && error.name,
			message: error && error.message ? error.message : String(error),
			stack: error && error.stack
		};
	}

	inlineWorker = createInlineSqliteOPFSWorker;
	return inlineWorker;
}

var workerClient;
var hasRequiredWorkerClient;

function requireWorkerClient () {
	if (hasRequiredWorkerClient) return workerClient;
	hasRequiredWorkerClient = 1;
	const log = requireLog();
	const createInlineSqliteOPFSWorker = requireInlineWorker();

	function createSqliteOPFSWorkerClient(connectionString, options = {}) {
		const worker = options.worker || createWorker(connectionString, options);
		let nextId = 1;
		const pending = new Map();
		const readonly = !!options.readonly;
		const lane = readonly ? 'reader' : 'writer';
		let closed = false;

		worker.addEventListener('message', onMessage);
		worker.addEventListener('error', onWorkerError);
		worker.addEventListener('messageerror', onWorkerError);

		const requestedVfs = options.vfs || 'opfs';
		const fallbackVfs = normalizeFallbackVfs(options.fallbackVfs, requestedVfs);
		const ready = openWorkerDb(requestedVfs, fallbackVfs).then(({ result, fallback, fallbackError }) => {
			const event = {
				connectionString,
				filename: result && result.filename,
				requestedVfs,
				vfs: result && result.vfs || requestedVfs,
				fallback,
				fallbackVfs,
				fallbackError,
				readonly
			};
			log.emitSqliteOpen(event);
			return {
				...result,
				requestedVfs,
				fallback,
				fallbackVfs,
				fallbackError
			};
		});

		return {
			executeQuery,
			executeCommand,
			close,
			reset,
			ready
		};

		function executeQuery(query, callback) {
			if (closed)
				return callback(new Error('sqliteOPFS worker client closed.'));
			const sql = query.sql();
			const parameters = query.parameters || [];
			log.emitQuery({ sql, parameters, readonly, lane });
			const startedAt = now();
			ready
				.then(() => request('query', { sql, parameters }))
				.then(({ result, workerElapsedMs }) => {
					log.emitQueryComplete({ sql, parameters, elapsedMs: now() - startedAt, workerElapsedMs, readonly, lane });
					callback(null, result);
				})
				.catch((error) => {
					log.emitQueryComplete({ sql, parameters, elapsedMs: now() - startedAt, error, readonly, lane });
					callback(error);
				});
		}

		function executeCommand(query, callback) {
			if (closed)
				return callback(new Error('sqliteOPFS worker client closed.'));
			const sql = query.sql();
			const parameters = query.parameters || [];
			log.emitQuery({ sql, parameters, readonly, lane });
			const startedAt = now();
			ready
				.then(() => request('command', { sql, parameters }))
				.then(({ result, workerElapsedMs }) => {
					log.emitQueryComplete({ sql, parameters, elapsedMs: now() - startedAt, workerElapsedMs, readonly, lane });
					callback(null, result);
				})
				.catch((error) => {
					log.emitQueryComplete({ sql, parameters, elapsedMs: now() - startedAt, error, readonly, lane });
					callback(error);
				});
		}

		function request(method, payload = {}) {
			if (closed && method !== 'close')
				return Promise.reject(new Error('sqliteOPFS worker client closed.'));
			const id = nextId++;
			return new Promise((resolve, reject) => {
				pending.set(id, { resolve, reject });
				try {
					worker.postMessage({
						type: 'orange-sqlite-opfs-request',
						id,
						method,
						...payload
					});
				}
				catch (e) {
					pending.delete(id);
					reject(e);
				}
			});
		}

		async function openWorkerDb(vfs, fallbackVfs) {
			try {
				const response = await request('open', {
					connectionString,
					busyTimeoutMs: options.busyTimeoutMs || 5000,
					vfs: vfs === 'opfs' ? options.vfs : vfs
				});
				return {
					result: response.result,
					fallback: false
				};
			}
			catch (e) {
				if (!fallbackVfs)
					throw e;
				const response = await request('open', {
					connectionString,
					busyTimeoutMs: options.busyTimeoutMs || 5000,
					vfs: fallbackVfs
				});
				return {
					result: response.result,
					fallback: true,
					fallbackError: e && e.message ? e.message : String(e)
				};
			}
		}

		function close() {
			if (closed)
				return Promise.resolve();
			closed = true;
			const closeRequest = withTimeout(request('close'), 1000).catch(() => {});
			return closeRequest.finally(() => {
				worker.removeEventListener('message', onMessage);
				worker.removeEventListener('error', onWorkerError);
				worker.removeEventListener('messageerror', onWorkerError);
				rejectPending(new Error('sqliteOPFS worker client closed.'));
				if (typeof worker.terminate === 'function')
					worker.terminate();
			});
		}

		function reset() {
			// The worker serializes all requests, so there is no pooled connection state to reset.
		}

		function onMessage(event) {
			const message = event && event.data;
			if (!message || message.type !== 'orange-sqlite-opfs-response')
				return;
			const entry = pending.get(message.id);
			if (!entry)
				return;
			pending.delete(message.id);
			if (message.error)
				entry.reject(toError(message.error));
			else
				entry.resolve({
					result: message.result,
					workerElapsedMs: message.elapsedMs
				});
		}

		function onWorkerError(event) {
			rejectPending(toWorkerError(event));
		}

		function rejectPending(error) {
			for (const entry of pending.values())
				entry.reject(error);
			pending.clear();
		}

		function withTimeout(promise, timeoutMs) {
			let timeoutId;
			const timeout = new Promise((resolve) => {
				timeoutId = setTimeout(resolve, timeoutMs);
			});
			return Promise.race([promise, timeout])
				.finally(() => clearTimeout(timeoutId));
		}
	}

	function now() {
		if (typeof performance !== 'undefined' && performance.now)
			return performance.now();
		return Date.now();
	}

	function createWorker(connectionString, options) {
		if (typeof options.createWorker === 'function')
			return options.createWorker(connectionString, options);
		if (typeof globalThis !== 'undefined' && typeof globalThis.__orangeOrmCreateSqliteOPFSWorker === 'function')
			return globalThis.__orangeOrmCreateSqliteOPFSWorker(connectionString, options);
		if (options.inlineWorker)
			return createInlineSqliteOPFSWorker(options);
		if (options.workerUrl && typeof Worker !== 'undefined')
			return new Worker(options.workerUrl, { type: 'module' });
		if (typeof Worker !== 'undefined') {
			try {
				const source = createWorkerSource(options.sqliteModuleUrl || getDefaultSqliteModuleUrl() || '@sqlite.org/sqlite-wasm', options);
				const blob = new Blob([source], { type: 'text/javascript' });
				const url = URL.createObjectURL(blob);
				return new Worker(url, { type: 'module' });
			}
			catch (e) {
				throw new Error(`sqliteOPFS could not create its worker automatically: ${e.message}`);
			}
		}
		throw new Error('sqliteOPFS requires Worker support or an explicit worker/createWorker option.');
	}

	function getDefaultSqliteModuleUrl() {
		return typeof globalThis !== 'undefined' && typeof globalThis.__orangeOrmSqliteOPFSModuleUrl === 'string'
			? globalThis.__orangeOrmSqliteOPFSModuleUrl
			: null;
	}

	function createWorkerSource(sqliteModuleUrl, options = {}) {
		const sqliteInitConfig = {};
		const opfsSahPoolOptions = normalizeOpfsSahPoolOptions(options);
		return `
const sqliteModuleUrl = ${JSON.stringify(sqliteModuleUrl)};
const sqliteInitConfig = ${JSON.stringify(sqliteInitConfig)};
const opfsSahPoolOptions = ${JSON.stringify(opfsSahPoolOptions)};
let sqlite3Promise;
let db;
let queue = Promise.resolve();

self.onmessage = (event) => {
	const message = event && event.data;
	if (!message || message.type !== 'orange-sqlite-opfs-request')
		return;
	queue = queue
		.then(() => dispatchTimed(message))
		.then(({ result, elapsedMs }) => postResponse(message.id, result, undefined, elapsedMs))
		.catch((error) => postResponse(message.id, undefined, error));
};

async function dispatchTimed(message) {
	const startedAt = now();
	const result = await dispatch(message);
	return {
		result,
		elapsedMs: now() - startedAt
	};
}

async function dispatch(message) {
	if (message.method === 'open')
		return openDb(message.connectionString, message.busyTimeoutMs, message.vfs);
	if (message.method === 'close')
		return closeDb();
	if (!db)
		await openDb(message.connectionString || 'orange.sqlite3');
	if (message.method === 'query')
		return query(message.sql, message.parameters);
	if (message.method === 'command')
		return command(message.sql, message.parameters);
	throw new Error('Unknown sqliteOPFS worker method "' + message.method + '".');
}

async function openDb(connectionString, busyTimeoutMs = 5000, vfs) {
	if (db)
		return { opened: true, reused: true };
	const sqlite3 = await getSqlite3();
	const filename = normalizeFilename(connectionString);
	const dbInfo = await createDb(sqlite3, filename, vfs);
	db = dbInfo.db;
	db.exec('PRAGMA busy_timeout=' + (Number.parseInt(busyTimeoutMs, 10) || 5000));
	return {
		opened: true,
		opfs: dbInfo.opfs === true,
		vfs: dbInfo.vfs,
		filename: db.filename
	};
}

function closeDb() {
	if (db && typeof db.close === 'function')
		db.close();
	db = null;
	return { closed: true };
}

async function createDb(sqlite3, filename, vfs) {
	if (!vfs || vfs === 'opfs')
		return createOpfsDb(sqlite3, filename);
	if (vfs === 'opfs-wl')
		return createOpfsWlDb(sqlite3, filename);
	if (vfs === 'opfs-sahpool')
		return createOpfsSahPoolDb(sqlite3, filename);
	if (vfs && vfs !== 'opfs')
		throw new Error('sqliteOPFS vfs "' + vfs + '" is not supported.');
}

function createOpfsDb(sqlite3, filename) {
	const DbClass = sqlite3.oo1 && sqlite3.oo1.OpfsDb;
	if (typeof DbClass !== 'function')
		throw new Error('sqliteOPFS vfs "opfs" is not available in this sqlite-wasm build.');
	return {
		db: new DbClass(filename),
		vfs: 'opfs',
		opfs: true
	};
}

function createOpfsWlDb(sqlite3, filename) {
	const DbClass = sqlite3.oo1 && sqlite3.oo1.OpfsWlDb;
	if (typeof DbClass !== 'function')
		throw new Error('sqliteOPFS vfs "opfs-wl" is not available in this sqlite-wasm build.');
	return {
		db: new DbClass(filename),
		vfs: 'opfs-wl',
		opfs: true
	};
}

async function createOpfsSahPoolDb(sqlite3, filename) {
	if (!sqlite3 || typeof sqlite3.installOpfsSAHPoolVfs !== 'function')
		throw new Error('sqliteOPFS vfs "opfs-sahpool" is not available in this sqlite-wasm build.');
	const pool = await sqlite3.installOpfsSAHPoolVfs(opfsSahPoolOptions);
	const DbClass = pool && pool.OpfsSAHPoolDb;
	if (typeof DbClass !== 'function')
		throw new Error('sqliteOPFS vfs "opfs-sahpool" is not available in this sqlite-wasm build.');
	return {
		db: new DbClass(filename),
		vfs: pool.vfsName || 'opfs-sahpool',
		opfs: true
	};
}

async function getSqlite3() {
	if (!sqlite3Promise) {
		sqlite3Promise = import(sqliteModuleUrl).then((module) => {
			const sqlite3InitModule = module && module.default || module;
			if (typeof sqlite3InitModule !== 'function')
				throw new Error('sqliteOPFS could not load sqlite-wasm module from ' + sqliteModuleUrl + '.');
			return sqlite3InitModule(sqliteInitConfig);
		});
	}
	return sqlite3Promise;
}

function query(sql, parameters = []) {
	return db.exec({
		sql,
		bind: normalizeParameters(parameters),
		rowMode: 'object',
		returnValue: 'resultRows'
	});
}

function command(sql, parameters = []) {
	const before = Number(db.changes(true) || 0);
	db.exec({
		sql,
		bind: normalizeParameters(parameters)
	});
	const after = Number(db.changes(true) || 0);
	return {
		rowsAffected: Math.max(0, after - before),
		lastInsertRowid: Number(db.selectValue('SELECT last_insert_rowid()'))
	};
}

function normalizeFilename(connectionString) {
	const value = String(connectionString || 'orange.sqlite3');
	return value.startsWith('/') ? value : '/' + value;
}

function normalizeParameters(parameters) {
	return Array.isArray(parameters) ? parameters.map(normalizeParameter) : parameters;
}

function normalizeParameter(value) {
	if (value instanceof ArrayBuffer)
		return new Uint8Array(value);
	return value;
}

function now() {
	if (typeof performance !== 'undefined' && performance.now)
		return performance.now();
	return Date.now();
}

function postResponse(id, result, error, elapsedMs) {
	self.postMessage({
		type: 'orange-sqlite-opfs-response',
		id,
		result,
		elapsedMs,
		error: error ? serializeError(error) : undefined
	});
}

function serializeError(error) {
	return {
		name: error && error.name,
		message: error && error.message ? error.message : String(error),
		stack: error && error.stack
	};
}

//# sourceURL=orange-orm-sqlite-opfs-worker.mjs
`;
	}

	function normalizeOpfsSahPoolOptions(options = {}) {
		const source = options.opfsSahPool || options.opfsSAHPool || options.sahPool;
		if (!source || source !== Object(source))
			return {};
		return { ...source };
	}

	function normalizeFallbackVfs(value, requestedVfs) {
		if (!value || value === requestedVfs)
			return undefined;
		if (value !== 'opfs' && value !== 'opfs-sahpool' && value !== 'opfs-wl')
			throw new Error(`sqliteOPFS fallbackVfs "${value}" is not supported.`);
		return value;
	}

	function toError(error) {
		const e = new Error(error && error.message ? error.message : 'sqliteOPFS worker request failed.');
		if (error && error.name)
			e.name = error.name;
		if (error && error.stack)
			e.stack = error.stack;
		return e;
	}

	function toWorkerError(event) {
		if (event instanceof Error)
			return event;
		if (event && event.error instanceof Error)
			return event.error;
		const message = event && event.message
			? event.message
			: 'sqliteOPFS worker failed before responding.';
		const e = new Error(message);
		if (event && event.filename)
			e.stack = `${message}\n${event.filename}:${event.lineno || 0}:${event.colno || 0}`;
		return e;
	}

	workerClient = createSqliteOPFSWorkerClient;
	return workerClient;
}

var newPool_1$1;
var hasRequiredNewPool$1;

function requireNewPool$1 () {
	if (hasRequiredNewPool$1) return newPool_1$1;
	hasRequiredNewPool$1 = 1;
	const pools = requirePools();
	const newId = requireNewId();
	const createSqliteOPFSWorkerClient = requireWorkerClient();

	function newPool(connectionString, poolOptions) {
		poolOptions = poolOptions || {};
		let id = newId();
		let client = createSqliteOPFSWorkerClient(connectionString, poolOptions);
		let readClient;
		let c = {};
		let ended = false;
		let writerBusy = false;
		const writerQueue = [];
		const singleWorker = shouldUseSingleWorker(poolOptions);
		c.__orangeSqliteOPFSConnectionString = connectionString;
		c.__orangeSqliteOPFSRequestedVfs = poolOptions.vfs || 'opfs';
		c.__orangeSqliteOPFSFallbackVfs = poolOptions.fallbackVfs;
		c.__orangeCrossTabWriteLock = normalizeCrossTabWriteLockConfig(poolOptions);
		c.__orangeSqliteOPFSReady = client.ready;

		if (client.ready && typeof client.ready.then === 'function') {
			client.ready.then((result) => {
				c.__orangeSqliteOPFSVfs = result && result.vfs || c.__orangeSqliteOPFSRequestedVfs;
				c.__orangeSqliteOPFSFallback = !!(result && result.fallback);
			}).catch(() => {});
		}

		prewarmReadClient();

		c.connect = function(cb) {
			if (ended)
				return cb(new Error('sqliteOPFS pool is closed.'), null, noop);
			writerQueue.push(cb);
			drainWriterQueue();
		};

		c.connectRead = function(cb) {
			if (singleWorker)
				return c.connect(cb);
			ensureReadClient();
			cb(null, readClient, function(err) {
				if (err && readClient.reset)
					readClient.reset();
			});
		};

		c.end = function() {
			ended = true;
			rejectQueuedWriters();
			const closes = [];
			if (client.close)
				closes.push(client.close());
			if (readClient && readClient.close)
				closes.push(readClient.close());
			delete pools[id];
			return Promise.all(closes).then(() => undefined);
		};

		pools[id] = c;
		return c;

		function prewarmReadClient() {
			if (singleWorker)
				return;
			if (poolOptions && poolOptions.prewarmRead === false)
				return;
			setTimeout(() => {
				try {
					ensureReadClient();
					if (readClient.ready && typeof readClient.ready.catch === 'function')
						readClient.ready.catch(() => {});
				}
				catch (e) {
					// The next readonly query will surface the same worker creation/open error.
				}
			}, 0);
		}

		function ensureReadClient() {
			if (!readClient)
				readClient = createSqliteOPFSWorkerClient(connectionString, { ...poolOptions, readonly: true });
			return readClient;
		}

		function drainWriterQueue() {
			if (writerBusy || ended)
				return;
			const cb = writerQueue.shift();
			if (!cb)
				return;
			writerBusy = true;
			let released = false;
			try {
				cb(null, client, done);
			}
			catch (e) {
				done(e);
				throw e;
			}

			function done(err) {
				if (released)
					return;
				released = true;
				if (err && client.reset)
					client.reset();
				writerBusy = false;
				drainWriterQueue();
			}
		}

		function rejectQueuedWriters() {
			const error = new Error('sqliteOPFS pool is closed.');
			while (writerQueue.length > 0) {
				const cb = writerQueue.shift();
				cb(error, null, noop);
			}
		}
	}

	function noop() {}

	function shouldUseSingleWorker(poolOptions = {}) {
		if (poolOptions.singleWorker === true)
			return true;
		const vfs = poolOptions.vfs || 'opfs';
		if (vfs === 'opfs' || vfs === 'opfs-sahpool' || vfs === 'opfs-wl')
			return poolOptions.singleWorker !== false;
		return false;
	}

	function normalizeCrossTabWriteLockConfig(poolOptions = {}) {
		const value = poolOptions.crossTabWriteLock;
		if (value === false)
			return { enabled: false };
		const defaultEnabled = poolOptions.vfs === 'opfs-wl' || poolOptions.fallbackVfs === 'opfs-wl';
		if (value === undefined || value === null)
			return { enabled: defaultEnabled };
		if (value === true)
			return { enabled: true };
		if (typeof value === 'string')
			return { enabled: true, name: value };
		if (value !== Object(value))
			throw new Error('Invalid sqliteOPFS crossTabWriteLock configuration');
		return {
			enabled: value.enabled !== false,
			name: typeof value.name === 'string' && value.name.length > 0 ? value.name : undefined,
			timeoutMs: normalizePositiveInteger(value.timeoutMs),
			staleMs: normalizePositiveInteger(value.staleMs),
			pollMs: normalizePositiveInteger(value.pollMs)
		};
	}

	function normalizePositiveInteger(value) {
		const parsed = Number.parseInt(value, 10);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
	}

	newPool_1$1 = newPool;
	return newPool_1$1;
}

var newDatabase_1$1;
var hasRequiredNewDatabase$1;

function requireNewDatabase$1 () {
	if (hasRequiredNewDatabase$1) return newDatabase_1$1;
	hasRequiredNewDatabase$1 = 1;
	let createDomain = requireCreateDomain();
	let newTransaction = requireNewTransaction$1();
	let _begin = requireBegin();
	let commit = requireCommit();
	let rollback = requireRollback();
	let newPool = requireNewPool$1();
	let express = requireHostExpress();
	let hono = requireHostHono();
	let hostLocal = requireHostLocal();
	let doQuery = requireQuery();
	let doSqliteFunction = requireSqliteFunction();
	let releaseDbClient = requireReleaseDbClient();

	function newDatabase(connectionString, poolOptions) {
		if (!connectionString)
			throw new Error('Connection string cannot be empty');
		poolOptions = poolOptions || { min: 1 };
		if ((poolOptions.worker || poolOptions.createWorker) && !('singleWorker' in poolOptions))
			poolOptions = { ...poolOptions, singleWorker: true };
		var pool = newPool(connectionString, poolOptions);
		pool.__sqliteSync = poolOptions && poolOptions.sync;
		pool.__orangeSyncIdentity = `sqliteOPFS:${connectionString}`;

		let c = { poolFactory: pool, hostLocal, express, hono };
		c.__orangeSyncIdentity = pool.__orangeSyncIdentity;

		c.transaction = function(options, fn) {
			if ((arguments.length === 1) && (typeof options === 'function')) {
				fn = options;
				options = undefined;
			}
			let domain = createDomain();

			if (!fn)
				throw new Error('transaction requires a function');
			return domain.run(runInTransaction);

			function begin() {
				return _begin(domain, options);
			}

			async function runInTransaction() {
				let result;
				let transaction = newTransaction(domain, pool, options);
				await new Promise(transaction)
					.then(begin)
					.then(() => fn(domain))
					.then((res) => result = res)
					.then(() => commit(domain))
					.then(null, (e) => rollback(domain, e));
				return result;
			}
		};

		c.createTransaction = function(options) {
			let domain = createDomain();
			let transaction = newTransaction(domain, pool);
			let p = domain.run(() => new Promise(transaction).then(begin));

			function run(fn) {
				return p.then(() => fn(domain));
			}
			run.rollback = rollback.bind(null, domain);
			run.commit = commit.bind(null, domain);
			return run;

			function begin() {
				return _begin(domain, options);
			}
		};

		c.query = function(query) {
			let domain = createDomain();
			let transaction = newTransaction(domain, pool);
			let p = domain.run(() => new Promise(transaction)
				.then(() => doQuery(domain, query).then(onResult, onError)));
			return p;

			function onResult(result) {
				releaseDbClient(domain);
				return result;
			}

			function onError(e) {
				releaseDbClient(domain);
				throw e;
			}
		};

		c.sqliteFunction = function(...args) {
			let domain = createDomain();
			let transaction = newTransaction(domain, pool);
			let p = domain.run(() => new Promise(transaction)
				.then(() => doSqliteFunction(domain, ...args).then(onResult, onError)));
			return p;

			function onResult(result) {
				releaseDbClient(domain);
				return result;
			}

			function onError(e) {
				releaseDbClient(domain);
				throw e;
			}
		};

		c.rollback = rollback;
		c.commit = commit;
		c.__sqliteSync = poolOptions && poolOptions.sync;

		c.end = function() {
			return pool.end ? pool.end() : Promise.resolve();
		};

		c.accept = function(caller) {
			caller.visitSqlite();
		};

		return c;
	}

	newDatabase_1$1 = newDatabase;
	return newDatabase_1$1;
}

var wrapQuery_1;
var hasRequiredWrapQuery;

function requireWrapQuery () {
	if (hasRequiredWrapQuery) return wrapQuery_1;
	hasRequiredWrapQuery = 1;
	var log = requireLog();
	var replaceParamChar = requireReplaceParamChar();

	function wrapQuery(_context, connection) {
		var runOriginalQuery = connection.query;
		return runQuery;

		function runQuery(query, onCompleted) {
			var params = query.parameters;
			var originalSql = query.sql();
			var completeQuery = log.startQuery({ sql: originalSql, parameters: params });
			var sql = replaceParamChar(query, params);
			query = {
				text: sql,
				values: params,
				types: query.types
			};

			runOriginalQuery.call(connection, query, onInnerCompleted);

			function onInnerCompleted(err, result) {
				completeQuery(err);
				if (err)
					onCompleted(err);
				else {
					if (Array.isArray(result))
						result = result[result.length-1];
					onCompleted(null, result.rows);
				}
			}
		}

	}

	wrapQuery_1 = wrapQuery;
	return wrapQuery_1;
}

var wrapCommand_1;
var hasRequiredWrapCommand;

function requireWrapCommand () {
	if (hasRequiredWrapCommand) return wrapCommand_1;
	hasRequiredWrapCommand = 1;
	var log = requireLog();
	var replaceParamChar = requireReplaceParamChar();

	function wrapCommand(_context, connection) {
		var runOriginalQuery = connection.query;
		return runCommand;

		function runCommand(query, onCompleted) {
			var params = query.parameters;
			var completeQuery = log.startQuery({ sql: query.sql(), parameters: params });
			var sql = replaceParamChar(query, params);
			query = {
				text: sql,
				values: params,
				types: query.types
			};

			runOriginalQuery.call(connection, query, onInnerCompleted);

			function onInnerCompleted(err, result) {
				completeQuery(err);
				if (err)
					onCompleted(err);
				else
					onCompleted(null, { rowsAffected: result.rowCount });

			}
		}

	}

	wrapCommand_1 = wrapCommand;
	return wrapCommand_1;
}

var encodeBoolean_1;
var hasRequiredEncodeBoolean;

function requireEncodeBoolean () {
	if (hasRequiredEncodeBoolean) return encodeBoolean_1;
	hasRequiredEncodeBoolean = 1;
	function encodeBoolean(bool) {
		return bool.toString();
	}

	encodeBoolean_1 = encodeBoolean;
	return encodeBoolean_1;
}

var encodeJSON;
var hasRequiredEncodeJSON;

function requireEncodeJSON () {
	if (hasRequiredEncodeJSON) return encodeJSON;
	hasRequiredEncodeJSON = 1;
	function encode(arg) {
		if (Array.isArray(arg))
			return new JsonBArrayParam(arg);
		else
			return arg;
	}

	class JsonBArrayParam {
		constructor(actualArray) { this.actualArray = actualArray; }
		toPostgres() {
			return JSON.stringify(this.actualArray);
		}
	}

	encodeJSON = encode;
	return encodeJSON;
}

var newTransaction;
var hasRequiredNewTransaction;

function requireNewTransaction () {
	if (hasRequiredNewTransaction) return newTransaction;
	hasRequiredNewTransaction = 1;
	var wrapQuery = requireWrapQuery();
	var wrapCommand = requireWrapCommand();
	var encodeDate = requireEncodeDate();
	var encodeBoolean = requireEncodeBoolean();
	var deleteFromSql = requireDeleteFromSql();
	var selectForUpdateSql = requireSelectForUpdateSql();
	var limitAndOffset = requireLimitAndOffset();
	var formatDateOut = requireFormatDateOut();
	var encodeJSON = requireEncodeJSON();
	var insertSql = requireInsertSql();
	var insert = requireInsert();
	var quote = requireQuote();

	function newResolveTransaction(domain, pool, { readonly = false } = {}) {
		var rdb = { poolFactory: pool };
		if (!pool.connect) {
			pool = pool();
			rdb.pool = pool;
		}

		rdb.engine = 'pg';
		rdb.encodeBoolean = encodeBoolean;
		rdb.encodeDate = encodeDate;
		rdb.encodeJSON = encodeJSON;
		rdb.formatDateOut = formatDateOut;
		rdb.deleteFromSql = deleteFromSql;
		rdb.selectForUpdateSql = selectForUpdateSql;
		rdb.lastInsertedIsSeparate = false;
		rdb.insertSql = insertSql;
		rdb.insert = insert;
		rdb.multipleStatements = true;
		rdb.limitAndOffset = limitAndOffset;
		rdb.accept = function(caller) {
			caller.visitPg();
		};
		rdb.aggregateCount = 0;
		rdb.quote = quote;
		rdb.cache = {};
		rdb.changes = [];

		if (readonly) {
			rdb.dbClient = {
				executeQuery: function(query, callback) {
					pool.connect((err, client, done) => {
						if (err) {
							return callback(err);
						}
						try {
							wrapQuery(domain, client)(query, (err, res) => {
								done();
								callback(err, res);
							});
						} catch (e) {
							done();
							callback(e);
						}
					});
				},
				executeCommand: function(query, callback) {
					pool.connect((err, client, done) => {
						if (err) {
							return callback(err);
						}
						try {
							wrapCommand(domain, client)(query, (err, res) => {
								done();
								callback(err, res);
							});
						} catch (e) {
							done();
							callback(e);
						}
					});
				}
			};
			domain.rdb = rdb;
			return (onSuccess) => onSuccess();
		}

		return function(onSuccess, onError) {
			pool.connect(onConnected);

			function onConnected(err, client, done) {
				try {
					if (err) {
						onError(err);
						return;
					}
					client.executeQuery = wrapQuery(domain, client);
					client.executeCommand = wrapCommand(domain, client);
					rdb.dbClient = client;
					rdb.dbClientDone = done;
					domain.rdb = rdb;
					onSuccess();
				} catch (e) {
					onError(e);
				}
			}
		};
	}

	newTransaction = newResolveTransaction;
	return newTransaction;
}

var end;
var hasRequiredEnd;

function requireEnd () {
	if (hasRequiredEnd) return end;
	hasRequiredEnd = 1;
	var pools = requirePools();

	function endPool(pgPool, id, done) {
		pgPool.drain(onDrained);

		function onDrained() {
			pgPool.destroyAllNow();
			delete pools[id];
			done();
		}
	}

	end = endPool;
	return end;
}

var parseSearchPathParam_1;
var hasRequiredParseSearchPathParam;

function requireParseSearchPathParam () {
	if (hasRequiredParseSearchPathParam) return parseSearchPathParam_1;
	hasRequiredParseSearchPathParam = 1;
	function parseSearchPathParam(connectionString = '') {
		const [, queryString] = connectionString.split('?');
		if (!queryString)
			return;
		const params = new URLSearchParams(queryString);
		const searchPath = params.get('search_path');
		return searchPath;
	}

	parseSearchPathParam_1 = parseSearchPathParam;
	return parseSearchPathParam_1;
}

/* eslint-disable no-prototype-builtins */

var newPgPool_1;
var hasRequiredNewPgPool;

function requireNewPgPool () {
	if (hasRequiredNewPgPool) return newPgPool_1;
	hasRequiredNewPgPool = 1;
	//slightly modified code from github.com/brianc/node-postgres
	var log = requireLog();

	var defaults = requirePoolDefaults();
	var genericPool = requireGenericPool();
	var pg;
	var parseSearchPathParam = requireParseSearchPathParam();

	function newPgPool(connectionString, poolOptions) {
		poolOptions = poolOptions || {};

		// @ts-ignore
		var pool = genericPool.Pool({
			min: poolOptions.min || 0,
			max: poolOptions.size || poolOptions.poolSize || defaults.poolSize,
			idleTimeoutMillis: poolOptions.idleTimeout || defaults.poolIdleTimeout,
			reapIntervalMillis: poolOptions.reapIntervalMillis || defaults.reapIntervalMillis,
			log: poolOptions.log,
			create: async function(cb) {
				try {
					if (!pg) {
						pg = await import('pg');
						pg  = pg.default || pg;
						let types = pg.types;
						types.setTypeParser(1700, function(val) {
							return parseFloat(val);
						});
					}
				}
				catch(e) {
					return cb(e, null);
				}
				var client = new pg.Client(connectionString);
				client.connect(function(err) {
					if (err) return cb(err, null);

					//handle connected client background errors by emitting event
					//via the pg object and then removing errored client from the pool
					client.on('error', function(e) {
						pool.emit('error', e, client);

						// If the client is already being destroyed, the error
						// occurred during stream ending. Do not attempt to destroy
						// the client again.
						if (!client._destroying) {
							pool.destroy(client);
						}
					});

					// Remove connection from pool on disconnect
					client.on('end', function(_e) {
						// Do not enter infinite loop between pool.destroy
						// and client 'end' event...
						if (!client._destroying) {
							pool.destroy(client);
						}
					});
					client.poolCount = 0;
					negotiateSearchPath(client, connectionString, (err) => cb(err, client));

				});
			},
			destroy: function(client) {
				client._destroying = true;
				client.poolCount = undefined;
				client.end();
			}
		});
		//monkey-patch with connect method
		pool.connect = function(cb) {
			pool.acquire(function(err, client) {
				if (err) return cb(err, null, function() {
					/*NOOP*/
				});
				client.poolCount++;
				cb(null, client, function(err) {
					if (err) {
						pool.destroy(client);
					} else {
						pool.release(client);
					}
				});
			});
		};
		return pool;
	}

	function negotiateSearchPath(client, connectionString, cb) {
		const searchPath = parseSearchPathParam(connectionString);
		if (searchPath) {
			const sql = `set search_path to ${searchPath}`;
			const completeQuery = log.startQuery({sql, parameters: []});
			return client.query(sql, (err, result) => {
				completeQuery(err);
				cb(err, result);
			});
		}
		else
			cb();


	}

	newPgPool_1 = newPgPool;
	return newPgPool_1;
}

var newPool_1;
var hasRequiredNewPool;

function requireNewPool () {
	if (hasRequiredNewPool) return newPool_1;
	hasRequiredNewPool = 1;
	const promisify = requirePromisify();
	const pools = requirePools();
	const end = requireEnd();
	const newPgPool = requireNewPgPool();
	const newId = requireNewId();

	function newPool(connectionString, poolOptions) {
		let pool = newPgPool(connectionString, poolOptions);
		let id = newId();
		let boundEnd = end.bind(null, pool, id);
		let c = {};

		c.connect = pool.connect;
		c.end = promisify(boundEnd);
		pools[id] = c;
		return c;
	}

	newPool_1 = newPool;
	return newPool_1;
}

var newDatabase_1;
var hasRequiredNewDatabase;

function requireNewDatabase () {
	if (hasRequiredNewDatabase) return newDatabase_1;
	hasRequiredNewDatabase = 1;
	let createDomain = requireCreateDomain();
	let newTransaction = requireNewTransaction();
	let _begin = requireBegin();
	let commit = requireCommit();
	let rollback = requireRollback();
	let newPool = requireNewPool();
	let lock = requireLock();
	let executeSchema = requireSchema();
	let express = requireHostExpress();
	let hono = requireHostHono();
	let hostLocal = requireHostLocal();
	let doQuery = requireQuery();
	let releaseDbClient = requireReleaseDbClient();

	function newDatabase(connectionString, poolOptions) {
		if (!connectionString)
			throw new Error('Connection string cannot be empty');
		poolOptions = poolOptions || { min: 1 };
		var pool = newPool(connectionString, poolOptions);

		let c = { poolFactory: pool, hostLocal, express, hono };

		c.transaction = function(options, fn) {
			if ((arguments.length === 1) && (typeof options === 'function')) {
				fn = options;
				options = undefined;
			}
			let domain = createDomain();

			if (!fn)
				throw new Error('transaction requires a function');
			return domain.run(runInTransaction);

			async function runInTransaction() {
				let result;
				let transaction = newTransaction(domain, pool, options);
				await new Promise(transaction)
					.then(begin)
					.then(negotiateSchema)
					.then(() => fn(domain))
					.then((res) => result = res)
					.then(() => commit(domain))
					.then(null, (e) => rollback(domain,e));
				return result;
			}

			function begin() {
				return _begin(domain, options);
			}

			function negotiateSchema(previous) {
				let schema = options && options.schema;
				if (!schema)
					return previous;
				return executeSchema(domain, schema);
			}
		};

		c.createTransaction = function(options) {
			let domain = createDomain();
			let transaction = newTransaction(domain, pool, options);
			let p = domain.run(() => new Promise(transaction)
				.then(begin).then(negotiateSchema));

			function run(fn) {
				return p.then(domain.run.bind(domain, fn));
			}

			function begin() {
				return _begin(domain, options);
			}

			function negotiateSchema(previous) {
				let schema = options && options.schema;
				if (!schema)
					return previous;
				return executeSchema(domain,schema);
			}

			run.rollback = rollback.bind(null, domain);
			run.commit = commit.bind(null, domain);

			return run;
		};

		c.query = function(query) {
			let domain = createDomain();
			let transaction = newTransaction(domain, pool);
			let p = domain.run(() => new Promise(transaction)
				.then(() => doQuery(domain, query).then(onResult, onError)));
			return p;

			function onResult(result) {
				releaseDbClient(domain);
				return result;
			}

			function onError(e) {
				releaseDbClient(domain);
				throw e;
			}
		};

		c.rollback = rollback;
		c.commit = commit;
		c.lock = lock;
		c.schema = executeSchema;

		c.end = function() {
			if (poolOptions)
				return pool.end();
			else
				return Promise.resolve();
		};

		c.accept = function(caller) {
			caller.visitPg();
		};

		return c;
	}

	newDatabase_1 = newDatabase;
	return newDatabase_1;
}

var indexBrowser$1;
var hasRequiredIndexBrowser;

function requireIndexBrowser () {
	if (hasRequiredIndexBrowser) return indexBrowser$1;
	hasRequiredIndexBrowser = 1;
	const hostExpress = requireHostExpress();
	const hostHono = requireHostHono();
	const hostLocal = requireHostLocal();
	const client = requireClient();
	const map = requireMap();
	let _d1;
	let _pg;
	let _pglite;
	let _sqliteOPFS;

	globalThis.__orangeOrmSqliteOPFSModuleUrl = new URL('../../@sqlite.org/sqlite-wasm/dist/index.mjs?import', import.meta.url).href;


	var connectViaPool = function() {
		return client.apply(null, arguments);
	};
	connectViaPool.createPatch = client.createPatch;
	connectViaPool.createDbWorkerClient = requireDbWorkerClient();
	connectViaPool.createDbWorkerHandler = requireDbWorkerHandler();
	connectViaPool.createSharedDbWorkerClient = requireSharedDbWorkerClient();
	connectViaPool.createSharedDbWorkerHandler = requireSharedDbWorkerHandler();
	connectViaPool.createSyncWorkerClient = requireSyncWorkerClient();
	connectViaPool.createSyncWorkerHandler = requireSyncWorkerHandler();
	connectViaPool.table = requireTable();
	connectViaPool.filter = requireEmptyFilter();
	connectViaPool.commit = requireCommit();
	connectViaPool.rollback = requireRollback();
	connectViaPool.end = requirePools().end;
	connectViaPool.close = connectViaPool.end;
	connectViaPool.log = requireLog().registerLogger;
	connectViaPool.on = requireLog().on;
	connectViaPool.off = requireLog().off;
	connectViaPool.query = requireQuery();
	connectViaPool.lock = requireLock();
	connectViaPool.schema = requireSchema();
	connectViaPool.map = map.bind(null, connectViaPool);

	connectViaPool.http = function(url) {
		return url;
	};


	Object.defineProperty(connectViaPool, 'd1', {
		get: function() {
			if (!_d1)
				_d1 = requireNewDatabase$3();
			return _d1;
		}
	});

	Object.defineProperty(connectViaPool, 'pglite', {
		get: function() {
			if (!_pglite)
				_pglite = requireNewDatabase$2();
			return _pglite;
		}
	});

	Object.defineProperty(connectViaPool, 'sqliteOPFS', {
		get: function() {
			if (!_sqliteOPFS)
				_sqliteOPFS = requireNewDatabase$1();
			return _sqliteOPFS;
		}
	});

	Object.defineProperty(connectViaPool, 'postgres', {
		get: function() {
			if (!_pg)
				_pg = requireNewDatabase();
			return _pg;
		}
	});

	Object.defineProperty(connectViaPool, 'pg', {
		get: function() {
			if (!_pg)
				_pg = requireNewDatabase();
			return _pg;
		}
	});


	connectViaPool.express = hostExpress.bind(null, hostLocal);
	connectViaPool.hono = hostHono.bind(null, hostLocal);

	indexBrowser$1 = connectViaPool;
	return indexBrowser$1;
}

var indexBrowserExports = requireIndexBrowser();
var indexBrowser = /*@__PURE__*/getDefaultExportFromCjs(indexBrowserExports);

export { indexBrowser as default };
