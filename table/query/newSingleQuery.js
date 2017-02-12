var newColumnSql = require('./singleQuery/newColumnSql');
var newJoinSql = require('./singleQuery/newJoinSql');
var newWhereSql = require('./singleQuery/newWhereSql');
var newQueryContext = require('./singleQuery/newQueryContext');
var negotiateLimit = require('./singleQuery/negotiateLimit');
var negotiateExclusive = require('./singleQuery/negotiateExclusive');
var extractLimitQuery = require('./extractLimitQuery');

function _new(table,filter,span,alias,innerJoin,orderBy,limit,exclusive) {
	var c = {};

	c.sql = function() {
		var name = table._dbName;
		var columnSql = newColumnSql(table,span,alias);
		var innerJoinSql = innerJoin.sql();
		var joinSql = newJoinSql(span,alias);
		var whereSql = newWhereSql(table,filter,alias);
		var safeLimit = negotiateLimit(limit);
		var exclusiveClause = negotiateExclusive(table,alias,exclusive);
		return 'select ' + columnSql + ' from ' + name + ' ' + alias + innerJoinSql + joinSql + whereSql + orderBy + safeLimit + exclusiveClause;
	};

	c.parameters = innerJoin.parameters.concat(filter.parameters);
	c.queryContext = newQueryContext(filter, alias, innerJoin);

	return c;
}

module.exports = _new;