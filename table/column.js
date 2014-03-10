function defineColumn(column) {	
	var c = {};

	c.string = function() {
		require('./column/string')(column);
		return c;
	};

	c.guid = function() {
		require('./column/guid')(column);
		return c;
	};

	c.date = function() {
		require('./column/date')(column);
		return c;
	};

	c.integer = function() {
		c.type =  require('./column/integer')(column);
		return c;
	};

	c.float = function() {
		c.type = require('./column/float')(column);
		return c;
	};

	c.numeric = function(optionalPrecision,optionalScale) {
		require('./column/numeric')(column,optionalPrecision,optionalScale);
		return c;
	};

	c.boolean = function() {
		require('./column/boolean')(column);
		return c;
	}

	c.binary = function() {
		require('./column/binary')(column);
		return c;
	};

	c.default = function(value) {
		column.default = value;
		return c;
	};

	c.as = function(alias) {
		column.alias = alias;
		return c;
	};

	c.dbNull = function(value) {
		column.dbNull = value;
		return c;
	};

	return c;
}

module.exports = defineColumn;