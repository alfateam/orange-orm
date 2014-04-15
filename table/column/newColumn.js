var equal = require('./equal');
var notEqual = require('./notEqual');
var lessThan = require('./lessThan');
var lessThanOrEqual = require('./lessThanOrEqual');
var greaterThan = require('./greaterThan');
var greaterThanOrEqual = require('./greaterThanOrEqual');
var _in = require('./in');

module.exports = function(table,name) {	
	var c = {};
	c._dbName = name;
	c.alias = name;	
	c.dbNull = null;	
	table._columns.push(c);
	table[name] = c;
	
	c.equal = function(arg,optionalAlias) {
		return equal(c,arg,optionalAlias);
	};

	c.notEqual = function(arg,optionalAlias) {
		return notEqual(c,arg,optionalAlias);
	};

	c.lessThan = function(arg,optionalAlias) {
		return lessThan(c,arg,optionalAlias);
	};

	c.lessThanOrEqual = function(arg,optionalAlias) {
		return lessThanOrEqual(c,arg,optionalAlias);
	};

	c.greaterThan = function(arg,optionalAlias) {
		return greaterThan(c,arg,optionalAlias);
	};

	c.greaterThanOrEqual = function(arg,optionalAlias) {
		return greaterThanOrEqual(c,arg,optionalAlias);
	};

	c.between = function(from,to,optionalAlias) {
		var from = c.greaterThanOrEqual(from,optionalAlias);
		var to = c.lessThanOrEqual(to,optionalAlias);
		return from.and(to);
	};

	c.in = function(arg,optionalAlias) {
		return _in(c,arg,optionalAlias);
	};

	c.eq = c.equal;
	c.EQ = c.eq;
	c.ne = c.notEqual;
	c.NE = c.ne;
	c.gt = c.greaterThan;
	c.GT = c.gt;
	c.ge = c.greaterThanOrEqual;
	c.GE = c.ge;
	c.lt = c.lessThan;
	c.LT = c.lt;
	c.le = c.lessThanOrEqual;
	c.LE = c.le;
	return c;
};