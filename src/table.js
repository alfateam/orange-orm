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
const patchTable = require('./patchTable');
const newEmitEvent = require('./emitEvent');
const hostLocal = require('./hostLocal');
// const getTSDefinition = require('./getTSDefinition'); //todo: unused ?
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

	table.delete = _delete.bind(null, table);
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

module.exports = _new;
