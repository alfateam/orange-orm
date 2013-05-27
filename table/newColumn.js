function newColumn(columnName) {
	var column = {};
	column.name = columnName;
	column.string = function() {
		column.type =  require('./column/string')(column);
		return column;
	};

	column.guid = function() {
		column.type =  require('./column/guid')(column);
		return column;
	};

	column.integer = function() {
		column.type =  require('./column/integer')(column);
		return column;
	};

	column.float = function() {
		column.type = require('./column/float')(column);
		return column;
	};

	column.numeric = function(optionalPrecision,optionalScale) {
		column.type = require('./column/numeric')(column,optionalPrecision,optionalScale);
		return column;
	};

	column.boolean = function() {
		column.type =  require('./column/boolean')(column);
		return column;
	}

	column.blob = function() {
		column.type =  require('./column/blob')(column);
		return column;
	};

	column.default = function(value) {
		column.default = value;
		return column;
	};

	column.as = function(alias) {
		column.alias = alias;
		return column;
	};

	column.dbNull = function(value) {
		column.nullValue = value;
		return column;
	};

	column.encode = function(value) {
		return column.type.encode(value);
	};

	column.decode = function(value) {
		return column.type.decode(value);
	};

	return column;
}

module.exports = newColumn;