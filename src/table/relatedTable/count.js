const negotiateRawSqlFilter = require('../column/negotiateRawSqlFilter');
const newJoin = require('./joinSql');
const newWhere = require('./whereSql');
const getSessionSingleton = require('../getSessionSingleton');
const newParameterized = require('../query/newParameterized');
const newBoolean = require('../column/newBoolean');

const nullOperator = ' is ';
const notNullOperator = ' is not ';
const isShallow = true;

function newCount(newRelatedTable, relations, depth) {

	function count(context, fn) {
		let shallowFilter;

		if (fn !== undefined) {
			let relatedTable = newRelatedTable(relations, isShallow, depth + 1);
			let arg = typeof fn === 'function' ? fn(relatedTable) : fn;
			shallowFilter = negotiateRawSqlFilter(context, arg);
		}

		const subQuery = newCountSubQuery(context, relations, shallowFilter, depth);
		return newCountFilter(subQuery);
	}

	return count;
}

function newCountSubQuery(context, relations, shallowFilter, depth) {
	const quote = getSessionSingleton(context, 'quote');
	const relationCount = relations.length;
	const alias = 'x' + relationCount;
	const table = relations[relationCount - 1].childTable;
	const select = newParameterized(`SELECT COUNT(*) FROM ${quote(table._dbName)} ${quote(alias)}`);
	const join = newJoin(context, relations, depth);
	const where = newWhere(context, relations, shallowFilter, depth);

	return select.append(join).append(where);
}

function newCountFilter(subQuery) {
	let c = {};

	c.equal = function(context, arg) {
		return compare(context, '=', arg);
	};

	c.notEqual = function(context, arg) {
		return compare(context, '<>', arg);
	};

	c.lessThan = function(context, arg) {
		return compare(context, '<', arg);
	};

	c.lessThanOrEqual = function(context, arg) {
		return compare(context, '<=', arg);
	};

	c.greaterThan = function(context, arg) {
		return compare(context, '>', arg);
	};

	c.greaterThanOrEqual = function(context, arg) {
		return compare(context, '>=', arg);
	};

	c.between = function(context, from, to) {
		from = c.greaterThanOrEqual(context, from);
		to = c.lessThanOrEqual(context, to);
		return from.and(context, to);
	};

	c.in = function(context, values) {
		if (values.length === 0)
			return newBoolean(newParameterized('1=2'));

		let sqlParts = new Array(values.length);
		let params = [];
		for (let i = 0; i < values.length; i++) {
			const encoded = encodeArg(context, values[i]);
			sqlParts[i] = encoded.sql();
			params = params.concat(encoded.parameters);
		}

		const sql = toSubQuery().sql() + ' in (' + sqlParts.join(',') + ')';
		const allParams = toSubQuery().parameters.concat(params);
		return newBoolean(newParameterized(sql, allParams));
	};

	c.notIn = function(context, values) {
		return c.in(context, values).not(context);
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

	function compare(context, operator, arg) {
		let encoded = encodeArg(context, arg);
		let operatorSql = ' ' + operator + ' ';
		if (encoded.sql() === 'null') {
			if (operator === '=')
				operatorSql = nullOperator;
			else if (operator === '<>')
				operatorSql = notNullOperator;
		}

		let sql = toSubQuery().append(operatorSql).append(encoded);
		return newBoolean(sql);
	}

	function encodeArg(context, arg) {
		if (arg && typeof arg._toFilterArg === 'function')
			return arg._toFilterArg(context);
		if (arg == null)
			return newParameterized('null');
		return newParameterized('?', [arg]);
	}

	function toSubQuery() {
		return subQuery.prepend('(').append(')');
	}
}

module.exports = newCount;
