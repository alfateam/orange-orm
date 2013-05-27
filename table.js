var primaryColumn = require('./table/primaryColumn');
var column = require('./table/column');
var join = require('./table/join');
var hasMany = require('./table/hasMany');
var hasOne = require('./table/hasOne');
var getMany = require('./table/getMany');
var getById = require('./table/getById');

function _new(tableName) {
	var table = {};
	table.name = tableName;
	table.primaryColumns = [];
	table.columns = [];
	
	table.primaryColumn = function(columnName) {
		return primaryColumn(table,columnName);
	};

	table.column = function(columnName) {
		return column(table,columnName);
	};

	table.join = function(tableName) {
		return join(table,tableName);
	};

	table.hasMany = function(tableName) {
		return hasMany(table,tableName);
	};

	table.hasOne = function(tableName) {
		return hasOne(table,tableName);
	};

	table.getMany = function() {
		return call(getMany,arguments);
	};

	function call(func,args) {
		var mergedArgs = [table];
		for (var i = 0; i < args.length; i++) {
			mergedArgs.push(args[i]);
		};
		return func.apply(null,mergedArgs);
	}
	
	table.getById = function() {
		return call(getById,arguments);
	}

	return table;	
}

module.exports = _new;