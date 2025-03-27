const equal = require('./equal');
const notEqual = require('./notEqual');
const lessThan = require('./lessThan');
const lessThanOrEqual = require('./lessThanOrEqual');
const greaterThan = require('./greaterThan');
const greaterThanOrEqual = require('./greaterThanOrEqual');
const _in = require('./in');
const _extractAlias = require('./extractAlias');
const quote = require('../../table/quote');
const aggregate = require('./columnAggregate');
const aggregateGroup = require('./columnAggregateGroup');

module.exports = function(table, name) {
	var c = {};
	var extractAlias = _extractAlias.bind(null, table);
	c._dbName = name;
	c.alias = name;
	table._aliases.add(name);

	c.dbNull = null;
	table._columns.push(c);
	table[name] = c;

	c.equal = function(context, arg, alias) {
		alias = extractAlias(alias);
		return equal(context, c, arg, alias);
	};

	c.notEqual = function(context, arg, alias) {
		alias = extractAlias(alias);
		return notEqual(context, c, arg, alias);
	};

	c.lessThan = function(context, arg, alias) {
		alias = extractAlias(alias);
		return lessThan(context, c, arg, alias);
	};

	c.lessThanOrEqual = function(context, arg, alias) {
		alias = extractAlias(alias);
		return lessThanOrEqual(context, c, arg, alias);
	};

	c.greaterThan = function(context, arg, alias) {
		alias = extractAlias(alias);
		return greaterThan(context, c, arg, alias);
	};

	c.greaterThanOrEqual = function(context, arg, alias) {
		alias = extractAlias(alias);
		return greaterThanOrEqual(context, c, arg, alias);
	};

	c.between = function(context, from, to, alias) {
		alias = extractAlias(alias);
		from = c.greaterThanOrEqual(context, from, alias);
		to = c.lessThanOrEqual(context, to, alias);
		return from.and(to);
	};

	c.in = function(context, arg, alias) {
		alias = extractAlias(alias);
		return _in(context, c, arg, alias);
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
	c.self = self;

	c.groupSum = (context, ...rest) => aggregateGroup.apply(null, [context, 'sum', c, table, ...rest]);
	c.groupAvg = (context, ...rest) => aggregateGroup.apply(null, [context, 'avg', c, table, ...rest]);
	c.groupMin = (context, ...rest) => aggregateGroup.apply(null, [context, 'min', c, table, ...rest]);
	c.groupMax = (context, ...rest) => aggregateGroup.apply(null, [context, 'max', c, table, ...rest]);
	c.groupCount = (context, ...rest) => aggregateGroup.apply(null, [context, 'count', c, table, false, ...rest]);
	c.sum = (context, ...rest) => aggregate.apply(null, [context, 'sum', c, table, ...rest]);
	c.avg = (context, ...rest) => aggregate.apply(null, [context, 'avg', c, table, ...rest]);
	c.min = (context, ...rest) => aggregate.apply(null, [context, 'min', c, table, ...rest]);
	c.max = (context, ...rest) => aggregate.apply(null, [context, 'max', c, table, ...rest]);
	c.count = (context, ...rest) => aggregate.apply(null, [context, 'count', c, table, false, ...rest]);

	function self(context) {
		const tableAlias = quote(context,table._rootAlias || table._dbName);
		const columnName = quote(context, c._dbName);

		return {
			expression: (alias) => `${tableAlias}.${columnName} ${quote(context, alias)}`,
			joins: [''],
			column: c,
			groupBy: `${tableAlias}.${columnName}`
		};
	}

	return c;
};