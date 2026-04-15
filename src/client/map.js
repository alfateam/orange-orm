const _newTable = require('../table');
const createProviders = require('./createProviders');
const descriptorMarker = Symbol('orangeOrmTableDescriptor');

function mapRoot(index, fn) {

	const providers = createProviders(index);

	return map(index, createContext(index, providers, {}), providers, fn);
}


function map(index, context, providers, fn) {
	const previousDescriptors = context._descriptors || {};
	const nextContext = createContext(index, providers, previousDescriptors);
	let next = fn({ table: newTable, ...nextContext });
	const descriptors = { ...previousDescriptors };

	for (let name in next) {
		if (isTableDescriptor(next[name]))
			descriptors[name] = next[name];
	}
	return createContext(index, providers, descriptors);

	function newTable() {
		return newTableDescriptor(Object.freeze({ tableName: arguments[0] }));
	}
}

function createContext(index, providers, descriptors) {
	function context(arg) {
		const tables = materializeTables(descriptors);

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

	Object.defineProperty(context, '_descriptors', {
		value: descriptors,
		enumerable: false,
		writable: false
	});
	for (let name in descriptors)
		context[name] = descriptors[name];

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
	context.d1 = connect.bind(null, 'd1');
	context.http = function(url) {
		return index({ db: url, tables: materializeTables(descriptors), providers});
	};

	return context;

	function connect(name, ...args) {
		const provider = index[name];
		const pool = provider.apply(null, args);
		return index({ db: pool, tables: materializeTables(descriptors), providers });
	}
}

function newTableDescriptor(base, operations, parent) {
	operations = Object.freeze((operations || []).slice());
	const descriptor = {
		_dbName: base.tableName,
		_base: base,
		_parent: parent,
		map,
		columnDiscriminators: addTableOperation('columnDiscriminators'),
		formulaDiscriminators: addTableOperation('formulaDiscriminators'),
		exclusive,
		_operations: operations
	};
	Object.defineProperty(descriptor, descriptorMarker, {
		value: true,
		enumerable: false,
		writable: false
	});
	return Object.freeze(descriptor);

	function map(fn) {
		return newTableDescriptor(base, operations.concat([{ type: 'map', fn }]), descriptor);
	}

	function addTableOperation(name) {
		return function() {
			return newTableDescriptor(base, operations.concat([{
				type: 'table',
				name,
				args: Array.prototype.slice.call(arguments)
			}]), descriptor);
		};
	}

	function exclusive() {
		return newTableDescriptor(base, operations.concat([{ type: 'table', name: 'exclusive', args: [] }]), descriptor);
	}
}

function materializeTables(descriptors) {
	const tables = {};
	const descriptorToTable = new WeakMap();
	for (let name in descriptors) {
		const descriptor = descriptors[name];
		const table = _newTable(descriptor._dbName);
		tables[name] = table;
		let current = descriptor;
		while (current && !descriptorToTable.has(current)) {
			descriptorToTable.set(current, table);
			current = current._parent;
		}
	}

	const maxOperations = Object.keys(descriptors).reduce((max, name) => {
		return Math.max(max, descriptors[name]._operations.length);
	}, 0);

	for (let i = 0; i < maxOperations; i++) {
		for (let name in descriptors) {
			const operation = descriptors[name]._operations[i];
			if (operation)
				applyOperation(descriptorToTable.get(descriptors[name]), operation);
		}
	}
	return tables;

	function applyOperation(table, operation) {
		if (operation.type === 'map') {
			mapTable(table, operation.fn);
			return;
		}
		table[operation.name].apply(table, operation.args);
	}

	function resolveTable(table) {
		if (isTableDescriptor(table))
			return descriptorToTable.get(table);
		return table;
	}

	function mapTable(table, fn) {
		let next = fn({
			column: table.column,
			primaryColumn: table.primaryColumn,
			references,
			hasMany,
			hasOne
		});
		for (let name in next) {
			if (next[name].as)
				next[name] = next[name].as(name);
		}
		return table;

		function references(to) {
			if (!to)
				throw new Error('Missing \'to\' table');
			return table.join(resolveTable(to));
		}

		function hasMany(to) {
			if (!to)
				throw new Error('Missing \'to\' table');
			return { by };

			function by() {
				const join = resolveTable(to).join(table).by.apply(null, arguments);
				return table.hasMany(join);
			}
		}

		function hasOne(to) {
			if (!to)
				throw new Error('Missing \'to\' table');
			return { by };

			function by() {
				const join = resolveTable(to).join(table).by.apply(null, arguments);
				return table.hasOne(join);
			}
		}
	}
}

function isTableDescriptor(value) {
	return !!(value && value[descriptorMarker]);
}

module.exports = mapRoot;
