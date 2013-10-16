var primaryColumn = require('./table/primaryColumn');
var column = require('./table/column');
var join = require('./table/join');
var hasMany = require('./table/hasMany');
var hasOne = require('./table/hasOne');
var getMany = require('./table/getMany');
var getById = require('./table/getById');

function _new(tableName) {
	var table = {};
	table._dbName = tableName;
	table._primaryColumns = [];
	table._columns = [];
	table._columnDiscriminators = [];
	table._formulaDiscriminators = [];
	table._relations = {};	
	
	table.primaryColumn = function(columnName) {
		return primaryColumn(table,columnName);
	};

	table.column = function(columnName) {
		return column(table,columnName);
	};

	table.join = function(relatedTable) {
		return join(table,relatedTable);
	};

	table.hasMany = function(joinRelation) {
		return hasMany(joinRelation);
	};

	table.hasOne = function(joinRelation) {
		return hasOne(joinRelation);		
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

	table.columnDiscriminator = function(discriminator) {
		table._columnDiscriminators.push(discriminator);
		return table;		
	};

	table.formulaDiscriminator = function(discriminator) {
		table._formulaDiscriminators.push(discriminator);
		return table;
	};

	return table;	
}

module.exports = _new;