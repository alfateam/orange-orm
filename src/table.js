const newColumn = require('./table/column/newColumn');
const column = require('./table/column');
const join = require('./table/join');
const hasMany = require('./table/hasMany');
const hasOne = require('./table/hasOne');
const getMany = require('./table/getMany');
const count = require('./table/count');
const getManyDto = require('./table/getManyDto');
const getById = require('./table/getById');
const tryGetById = require('./table/tryGetById');
const tryGetFirst = require('./table/tryGetFirstFromDb');
const newCache = require('./table/newRowCache');
const newContext = require('./newObject');
const insert = require('./table/insert');
const _delete = require('./table/delete');
const cascadeDelete = require('./table/cascadeDelete');
const createReadStream = require('./table/createReadStream');
const createJSONReadStream = require('./table/createJSONReadStream');
const getIdArgs = require('./table/getIdArgs');
const patchTable = require('./patchTable');
const newEmitEvent = require('./emitEvent');
const hostLocal = require('./hostLocal');
const getTSDefinition = require('./getTSDefinition');
const where = require('./table/where');
const aggregate = require('./table/aggregate');
const groupBy = require('./table/groupBy');


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

	table.count = function(filter) {
		return Promise.resolve().then(() => count(table, filter));
	};

	table.getMany = function(filter, strategy) {
		return Promise.resolve().then(() => getMany(table, filter, strategy));
	};
	table.getManyDto = function(filter, strategy) {
		return Promise.resolve().then(() => getManyDto(table, filter, strategy));
	};

	table.getManyDto = function(filter, strategy) {
		return groupBy(table, filter, strategy);
	};

	table.getMany.exclusive = function(filter, strategy) {
		return Promise.resolve().then(() => getMany.exclusive(table, filter, strategy));
	};

	table.tryGetFirst = function(filter, strategy) {
		return Promise.resolve().then(() => tryGetFirst(table, filter, strategy));
	};
	table.tryGetFirst.exclusive = function(filter, strategy) {
		return Promise.resolve().then(() => tryGetFirst.exclusive(table, filter, strategy));
	};
	table.getOne = table.tryGetFirst;
	table.getOne.exclusive = table.tryGetFirst.exclusive;

	function callAsync(func, args) {
		return Promise.resolve().then(() => call(func, args));
	}

	function call(func, args) {
		var mergedArgs = [table];
		for (var i = 0; i < args.length; i++) {
			mergedArgs.push(args[i]);
		}
		return func.apply(null, mergedArgs);
	}

	table.getById = function() {
		return callAsync(getById, getIdArgs(table, arguments));
	};

	table.getById.exclusive = function() {

		return callAsync(getById.exclusive, getIdArgs(table, arguments));
	};

	table.tryGetById = function() {
		return callAsync(tryGetById, getIdArgs(table, arguments));
	};

	table.tryGetById.exclusive = function() {
		return callAsync(tryGetById.exclusive, getIdArgs(table, arguments));
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

	table.insert = function() {
		const concurrency = undefined;
		let args = [{table, concurrency}].concat([].slice.call(arguments));
		return insert.apply(null, args);
	};

	table.insertWithConcurrency = function(options, ...rows) {
		let args = [{table, options}].concat([].slice.call(rows));
		return insert.apply(null, args);
	};

	table.delete = _delete.bind(null, table);
	table.cascadeDelete = cascadeDelete.bind(null, table);
	table.deleteCascade = cascadeDelete.bind(null, table);
	table.createReadStream = createReadStream.bind(null, table);
	table.createJSONReadStream = createJSONReadStream.bind(null, table);
	table.exclusive = function() {
		table._exclusive = true;
		return table;
	};
	table.patch = patchTable.bind(null, table);
	table.subscribeChanged = table._emitChanged.add;
	table.unsubscribeChanged = table._emitChanged.remove;

	table.hostLocal = function(options) {
		return hostLocal({table, ...options});
	};

	table.ts = function(name) {
		return getTSDefinition(table, {name});
	};

	table.where = where(table);
	table.aggregate = aggregate(table);

	return table;
}

module.exports = _new;
