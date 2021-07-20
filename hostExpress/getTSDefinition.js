function getTSDefinition(table, customFilters = {}, request) {
	let url = request.originalUrl[request.originalUrl.length - 1] === '/' ? request.originalUrl[request.originalUrl.length - 1].slice(0, -2) : request.originalUrl;
	let Name = url.split('/').pop()[0].toUpperCase() + url.split('/').pop().slice(1);
	let name = Name[0].toLowerCase() + Name.substr(1);
	let result = '' + getTable(table, Name, name, customFilters).replace(/\n\s*\n/g, '\n');
	return result.replace(/^..../gm, '').replace(/interface/g, '\ninterface').replace(/^ {4}/gm, '\t').substr(1);
}

function getTable(table, Name, name, customFilters) {
	return `
    interface ${Name}Table {
        getManyDto(filter?: import('rdb-client').RawFilter, strategy?: ${Name}Strategy): Promise<${Name}Array>;
        getManyDto(${name}s: Array<${Name}>, strategy?: ${Name}Strategy): Promise<${Name}Array>;
        getMany(filter?: import('rdb-client').RawFilter, strategy?: ${Name}Strategy): Promise<${Name}Array>;
        getMany(${name}s: Array<${Name}>, strategy?: ${Name}Strategy): Promise<${Name}Array>;
        tryGetFirst(filter?: import('rdb-client').RawFilter, strategy?: ${Name}Strategy): Promise<${Name}Row>;
        tryGetFirst(${name}s: Array<${Name}>, strategy?: ${Name}Strategy): Promise<${Name}Row>;
        getById(gid: string, strategy?: ${Name}Strategy): Promise<${Name}Row>;
        tryGetById(gid: string, strategy?: ${Name}Strategy): Promise<${Name}Row>;
        proxify(${name}s: ${Name}[]): ${Name}Array;
        ${columns(table)}
        customFilters: OrderCustomFilters;
    }

    interface ${Name}CustomFilters {
        ${getCustomFilters(customFilters)}
    }

    interface ${Name}Array extends Array<${Name}> {
        save(options?: Save${Name}Options): Promise<void>;
        acceptChanges(): void;
        clearChanges(): void;
        refresh(strategy?: ${Name}Strategy | undefined | null): Promise<void>;
        insert(): Promise<void>;
        delete(): Promise<void>;
    }

    interface Save${Name}Options {
        defaultConcurrency?: import('rdb-client').Concurrencies
        concurrency?: ${Name}Concurrency;
    }

    ${concurrencies(table, Name)}
    `;
}

function columns(table) {
	let result = '';
	let separator = '';
	for (let i = 0; i < table._columns.length; i++) {
		let column = table._columns[i];
		result += `${separator}${column.alias} : import('rdb-client').${column.tsType};`;
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
		tablesAdded = new Set();
	}
	else if (tablesAdded.has(table))
		return '';
	tablesAdded.add(table);
	let otherConcurrencies = '';
	let concurrencyRelations = '';
	let strategyRelations = '';
	let regularRelations = '';
	let relations = table._relations;
	let relationName;

	let separator = `
        `;
	let visitor = {};
	visitor.visitJoin = function(relation) {
		otherConcurrencies += `${concurrencies(relation.childTable, relationName, tablesAdded)}`;
		concurrencyRelations += `${relationName}?: ${pascalCase(relationName)}Concurrency;${separator}`;
		strategyRelations += `${relationName}?: ${pascalCase(relationName)}Strategy | null;${separator}`;
		regularRelations += `${relationName}?: ${pascalCase(relationName)} | null;${separator}`;
	};
	visitor.visitOne = visitor.visitJoin;
	visitor.visitMany = function(relation) {
		otherConcurrencies += `${concurrencies(relation.childTable, relationName, tablesAdded)}`;
		concurrencyRelations += `${relationName}?: ${pascalCase(relationName)}Concurrency;${separator}`;
		strategyRelations += `${relationName}?: ${pascalCase(relationName)}Strategy  | null;${separator}`;
		regularRelations += `${relationName}?: ${pascalCase(relationName)}[];${separator}`;
	};

	for (relationName in relations) {
		var relation = relations[relationName];
		relation.accept(visitor);
	}

	let row = '';
	if (isRoot) {
		row = `interface ${name}Row extends ${name} {
        save(): Promise<void>;
        refresh(strategy?: ${name}Strategy | undefined | null): Promise<void>;
        acceptChanges(): void;
        clearChanges(): void;
        insert(): Promise<void>
        delete(): Promise<void>;
    }`;
	}

	return `interface ${name}Concurrency {
        ${concurrencyColumns(table)}
        ${concurrencyRelations}
    }

    ${otherConcurrencies}

    interface ${name} {
        ${regularColumns(table)}
        ${regularRelations}
    }

    interface ${name}Strategy {
        ${strategyColumns(table)}
        ${strategyRelations}
        limit?: number;
        orderBy?: string | Array<string>;
    }

    ${row}
    `;
}

function regularColumns(table){
	const typeMap = {
		StringColumn: 'string',
		BooleanColumn: 'boolean',
		UUIDColumn: 'string',
		BinaryColumn: 'Buffer',
		JSONColumn: 'object',
		DateColumn: 'Date | string',
		NumericColumn: 'number',
	};

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
		result += `${separator}${column.alias}? : import('rdb-client').Concurrencies;`;
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
		result += `${separator}${column.alias}? : any;`;
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