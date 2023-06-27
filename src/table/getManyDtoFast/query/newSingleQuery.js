var newColumnSql = require('./singleQuery/newShallowColumnSql');
var newWhereSql = require('../../../table/query/singleQuery/newWhereSql');
var negotiateLimit = require('../../../table/query/singleQuery/negotiateLimit');

function _new(table, filter, span, alias, innerJoin, orderBy, limit, offset = '') {
	var c = {};

	c.sql = function() {
		var name = table._dbName;
		var columnSql = newColumnSql(table, alias, span);
		var whereSql = newWhereSql(table, filter, alias);
		var safeLimit = negotiateLimit(limit);
		innerJoin = innerJoin ? ' RIGHT' + innerJoin : '';
		return 'select ' + safeLimit + ' ' + columnSql + ' from ' + name + ' ' + alias + innerJoin + whereSql + orderBy + offset;
	};

	c.parameters = filter.parameters;

	return c;
}

module.exports = _new;