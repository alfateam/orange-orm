var newColumn = require('./table/column/newColumn');
var column = require('./table/column');
var join = require('./table/join');
var hasMany = require('./table/hasMany');
var hasOne = require('./table/hasOne');
var getMany = require('./table/getMany');
var getManyDto = require('./table/getManyDto');
var getById = require('./table/getById');
var tryGetById = require('./table/tryGetById');
var tryGetFirst = require('./table/tryGetFirstFromDb');
var newCache = require('./table/newRowCache');
var newContext = require('./newObject');
var insert = require('./table/insert');
var insertAndForget = require('./table/insertAndForget');
var _delete = require('./table/delete');
var cascadeDelete = require('./table/cascadeDelete');
var createReadStream = require('./table/createReadStream');
var createJSONReadStream = require('./table/createJSONReadStream');
var getIdArgs = require('./table/getIdArgs');
var patchTable = require('./patchTable');
var newEmitEvent = require('./emitEvent');
var hostLocal = require('./hostLocal');
var getTSDefinition = require('./getTSDefinition');

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

	table.getMany = function(filter, strategy) {
		return Promise.resolve().then(() => getMany(table, filter, strategy));
	};

	table.getManyDto = function(filter, strategy) {
		return Promise.resolve().then(() => getManyDto(table, filter, strategy));
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
		let args = [table].concat([].slice.call(arguments));
		return insert.apply(null, args);
	};

	table.insertAndForget = function() {
		let args = [table].concat([].slice.call(arguments));
		return insertAndForget.apply(null, args);
	};

	table.delete = _delete.bind(null, table);
	table.cascadeDelete = cascadeDelete.bind(null, table);
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

	return table;
}

module.exports = _new;
