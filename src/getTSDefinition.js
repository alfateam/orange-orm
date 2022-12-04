const tablesAdded = new Map();

const typeMap = {
	StringColumn: 'string',
	BooleanColumn: 'boolean',
	UUIDColumn: 'string',
	BinaryColumn: 'string',
	JSONColumn: 'object',
	DateColumn: 'Date | string',
	NumberColumn: 'number',
};

function getTSDefinition(table, options) {
	let {customFilters, name} = options;
	let Name = name.substr(0,1).toUpperCase() + name.substr(1);
	name = name.substr(0,1).toLowerCase() + name.substr(1);
	let result = '' + getTable(table, Name, name, customFilters);
	return result;
}

function getTable(table, Name, name, customFilters) {
	return `
    export interface ${Name}Table {
        getMany(filter?: RawFilter): Promise<${Name}Array>;
        getMany(filter: RawFilter, fetchingStrategy: ${Name}Strategy): Promise<${Name}Array>;
        getMany(${name}s: Array<${Name}>): Promise<${Name}Array>;
        getMany(${name}s: Array<${Name}>, fetchingStrategy: ${Name}Strategy): Promise<${Name}Array>;
        getOne(filter?: RawFilter): Promise<${Name}Row>;
        getOne(filter: RawFilter, fetchingStrategy: ${Name}Strategy): Promise<${Name}Row>;
        getOne(${name}: ${Name}): Promise<${Name}Row>;
        getOne(${name}: ${Name}, fetchingStrategy: ${Name}Strategy): Promise<${Name}Row>;
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
		express(config: ${Name}ExpressConfig): Express & RequestHandler;
        customFilters: ${Name}CustomFilters;
		${columns(table)}
		${tableRelations(table)}
    }

	export interface ${Name}ExpressConfig extends TablesConfig {
        db?: unknown | string | (() => unknown | string);
        customFilters?: ${Name}CustomFilters;
        baseFilter?: RawFilter | ((request?: import('express').Request, response?: import('express').Response) => RawFilter | Promise<RawFilter>);
        fetchingStrategy: ${Name}Strategy;
        defaultConcurrency?: Concurrency;
        concurrency?: ${Name}Concurrency;
	}

    export interface ${Name}CustomFilters {
        ${getCustomFilters(customFilters)}
    }

    export interface ${Name}Array extends Array<${Name}> {
        saveChanges(): Promise<void>;
        saveChanges(options: Save${Name}Options): Promise<void>;
        saveChanges(options: Save${Name}Options, fetchingStrategy: ${Name}Strategy): Promise<void>;
        acceptChanges(): void;
        clearChanges(): void;
        refresh(): Promise<void>;
        refresh(fetchingStrategy: ${Name}Strategy): Promise<void>;
        insert(): Promise<void>;
        delete(): Promise<void>;
        delete(options: Delete${Name}Options): Promise<void>;
    }

    export interface Save${Name}Options {
        defaultConcurrency?: Concurrency
        concurrency?: ${Name}Concurrency;
    }

    export interface Delete${Name}Options {
        defaultConcurrency?: Concurrency
        concurrency?: ${Name}Concurrency;
    }

    ${Concurrency(table, Name)}
    `;
}

function getIdArgs(table){
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
		const tableName = getTableName(relations[relationName], relationName, tablesAdded);
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

function Concurrency(table, name, tablesAdded) {
	name = pascalCase(name);
	let isRoot;
	if (!tablesAdded) {
		isRoot = true;
		tablesAdded = new Map();
	}
	else if (tablesAdded.has(table))
		return '';
	else
		tablesAdded.set(table, name);
	let otherConcurrency = '';
	let concurrencyRelations = '';
	let strategyRelations = '';
	let regularRelations = '';
	let relations = table._relations;
	let relationName;
	let tableName;

	let separator = `
        `;
	let visitor = {};
	visitor.visitJoin = function(relation) {
		otherConcurrency += `${Concurrency(relation.childTable, relationName, tablesAdded)}`;
		concurrencyRelations += `${relationName}?: ${tableName}Concurrency;${separator}`;
		strategyRelations += `${relationName}?: ${tableName}Strategy;${separator}`;
		regularRelations += `${relationName}?: ${tableName};${separator}`;
	};
	visitor.visitOne = visitor.visitJoin;
	visitor.visitMany = function(relation) {
		otherConcurrency += `${Concurrency(relation.childTable, relationName, tablesAdded)}`;
		concurrencyRelations += `${relationName}?: ${tableName}Concurrency;${separator}`;
		strategyRelations += `${relationName}?: ${tableName}Strategy ;${separator}`;
		regularRelations += `${relationName}?: ${tableName}[];${separator}`;
	};

	for (relationName in relations) {
		var relation = relations[relationName];
		tableName = getTableName(relation, relationName, tablesAdded);
		relation.accept(visitor);
	}

	let row = '';
	if (isRoot) {
		row = `export interface ${name}Row extends ${name} {
		saveChanges(): Promise<void>;
		saveChanges(options: Save${name}Options): Promise<void>;
        refresh(): Promise<void>;
        refresh(fetchingStrategy: ${name}Strategy): Promise<void>;
        acceptChanges(): void;
        clearChanges(): void;
        insert(): Promise<void>
        insert(fetchingStrategy: ${name}Strategy): Promise<void>
        delete(): Promise<void>;
		delete(options: Delete${name}Options): Promise<void>;

    }`;
	}
	else {
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

function getTableName(relation, relationName, tablesAdded) {
	return tablesAdded.get(relation.childTable) || pascalCase(relationName);
}

function regularColumns(table){
	let result = '';
	let separator = '';
	for (let i = 0; i < table._columns.length; i++) {
		let column = table._columns[i];
		result += `${separator}${column.alias}? : ${typeMap[column.tsType]};`;
		separator = `
        `;
	}
	return result;
}

function orderByColumns(table){
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
				result +=  '\n' + tabs + p + ': {' + tabs + getLeafNames(obj[p],  tabs + '\t');
				result += '\n' + tabs + '}';
			}
			else if (typeof obj[p] === 'function')
				result +=   '\n' + tabs + p + ': (' + getParamNames(obj[p]) + ') => import(\'rdb\').Filter;';
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
	return result.join(': any, ') + ': any';
}



module.exports = getTSDefinition;