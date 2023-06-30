const _newTable = require('../table');

function mapRoot(index, fn) {
	return map(index, context, fn);

	function context(arg) {
		const dbMap = {
			pg: createPool.bind(null, index.pg),
			postgres: createPool.bind(null, index.pg),
			mssql: createPool.bind(null, index.mssql),
			mssqlNative: createPool.bind(null, index.mssqlNative),
			mysql: createPool.bind(null, index.mysql),
			sap: createPool.bind(null, index.sap),
			sqlite: createPool.bind(null, index.sqlite),
		};

		function createPool(provider, ...args) {
			const pool = provider.apply(null, args);
			const tables = {};
			for (let name in context) {
				if (context[name] && context[name]._dbName)
					tables[name] = context[name];
			}
			return index({ db: () => pool, tables });
		}

		if (arg && arg.db && typeof arg.db === 'function') {
			return arg.db(dbMap);
		}
		else
			return context;
	}
}

function map(index, context, fn) {
	let next = fn({ table: newTable, ...context });

	for (let name in next) {
		if (next[name] && next[name]._dbName) {
			context[name] = next[name];
			context[name].map = mapTable.bind(null, context[name]);
		}
	}
	context.map = map.bind(null, index, context);
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

module.exports = mapRoot;