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
        getManyDto(filter?: RawFilter, strategy?: ${Name}Strategy): Promise<${Name}Array>;
        getManyDto(${name}s: Array<${Name}>, strategy?: ${Name}Strategy): Promise<${Name}Array>;
        getMany(filter?: RawFilter, strategy?: ${Name}Strategy): Promise<${Name}Array>;
        getMany(${name}s: Array<${Name}>, strategy?: ${Name}Strategy): Promise<${Name}Array>;
        getOne(filter?: RawFilter, strategy?: ${Name}Strategy): Promise<${Name}Row>;
        getOne(${name}: ${Name}, strategy?: ${Name}Strategy): Promise<${Name}Row>;
        getById(${getIdArgs(table)}, strategy?: ${Name}Strategy): Promise<${Name}Row>;
        tryGetById(${getIdArgs(table)}, strategy?: ${Name}Strategy): Promise<${Name}Row>;
        insert(${name}s: ${Name}[]): Promise<${Name}Array>;
        insert(${name}: ${Name}): Promise<${Name}Row>;
        insertAndForget(${name}s: ${Name}[]): Promise<void>;
        insertAndForget(${name}: ${Name}): Promise<void>;
        delete(filter?: RawFilter): Promise<void>;
        cascadeDelete(filter?: RawFilter): Promise<void>;
        proxify(${name}s: ${Name}[]): ${Name}Array;
        proxify(${name}: ${Name}): ${Name}Row;
        customFilters: ${Name}CustomFilters;
		${columns(table)}
		${tableRelations(table)}
    }

    export interface ${Name}CustomFilters {
        ${getCustomFilters(customFilters)}
    }

    export interface ${Name}Array extends Array<${Name}> {
        save(options?: Save${Name}Options): Promise<void>;
        acceptChanges(): void;
        clearChanges(): void;
        refresh(strategy?: ${Name}Strategy | undefined | null): Promise<void>;
        insert(): Promise<void>;
        delete(): Promise<void>;
    }

    export interface Save${Name}Options {
        defaultConcurrency?: Concurrencies
        concurrency?: ${Name}Concurrency;
    }

    ${concurrencies(table, Name)}
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
		result += `${relationName}: ${tableName}Table;`;
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

function concurrencies(table, name, tablesAdded) {
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
	let otherConcurrencies = '';
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
		otherConcurrencies += `${concurrencies(relation.childTable, relationName, tablesAdded)}`;
		concurrencyRelations += `${relationName}?: ${tableName}Concurrency;${separator}`;
		strategyRelations += `${relationName}?: ${tableName}Strategy | null;${separator}`;
		regularRelations += `${relationName}?: ${tableName} | null;${separator}`;
	};
	visitor.visitOne = visitor.visitJoin;
	visitor.visitMany = function(relation) {
		otherConcurrencies += `${concurrencies(relation.childTable, relationName, tablesAdded)}`;
		concurrencyRelations += `${relationName}?: ${tableName}Concurrency;${separator}`;
		strategyRelations += `${relationName}?: ${tableName}Strategy  | null;${separator}`;
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
        save(): Promise<void>;
        refresh(strategy?: ${name}Strategy | undefined | null): Promise<void>;
        acceptChanges(): void;
        clearChanges(): void;
        insert(): Promise<void>
        delete(): Promise<void>;
    }`;
	}
	else {
		row = `export interface ${name}Table {
			${columns(table)}
			${tableRelations(table)}
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

    ${otherConcurrencies}

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
		result += `${separator}"${column.alias}" | "${column.alias} desc"`;
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
		result += `${separator}${column.alias}? : Concurrencies;`;
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
		result += `${separator}${column.alias}? : boolean | null;`;
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
				result +=   '\n' + tabs + p + ': (' + getParamNames(obj[p]) + ') => import(\'rdb-client\').Filter;';
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