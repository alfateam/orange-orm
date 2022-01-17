var equal = require('./equal');
var notEqual = require('./notEqual');
var lessThan = require('./lessThan');
var lessThanOrEqual = require('./lessThanOrEqual');
var greaterThan = require('./greaterThan');
var greaterThanOrEqual = require('./greaterThanOrEqual');
var _in = require('./in');
var _extractAlias = require('./extractAlias');

module.exports = function(table,name) {
	var c = {};
	var extractAlias = _extractAlias.bind(null,table);
	c._dbName = name;
	c.alias = name;
	table._aliases.add(name);

	c.dbNull = null;
	table._columns.push(c);
	table[name] = c;

	c.equal = function(arg,alias) {
		alias = extractAlias(alias);
		return equal(c,arg, alias);
	};

	c.notEqual = function(arg,alias) {
		alias = extractAlias(alias);
		return notEqual(c,arg,alias);
	};

	c.lessThan = function(arg,alias) {
		alias = extractAlias(alias);
		return lessThan(c,arg,alias);
	};

	c.lessThanOrEqual = function(arg,alias) {
		alias = extractAlias(alias);
		return lessThanOrEqual(c,arg,alias);
	};

	c.greaterThan = function(arg,alias) {
		alias = extractAlias(alias);
		return greaterThan(c,arg,alias);
	};

	c.greaterThanOrEqual = function(arg,alias) {
		alias = extractAlias(alias);
		return greaterThanOrEqual(c,arg,alias);
	};

	c.between = function(from,to,alias) {
		alias = extractAlias(alias);
		from = c.greaterThanOrEqual(from,alias);
		to = c.lessThanOrEqual(to,alias);
		return from.and(to);
	};

	c.in = function(arg,alias) {
		alias = extractAlias(alias);
		return _in(c,arg,alias);
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
	c.IN = c.in;
	return c;
};