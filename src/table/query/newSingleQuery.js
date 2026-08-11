var newColumnSql = require('./singleQuery/newColumnSql');
var newJoinSql = require('./singleQuery/newJoinSql');
var newWhereSql = require('./singleQuery/newWhereSql');
var negotiateLimit = require('./singleQuery/negotiateLimit');
var lockSql = require('./singleQuery/lockSql');
var newParameterized = require('../../table/query/newParameterized');
var quote = require('../quote');

function _new(context, table, filter, span, alias, innerJoin, orderBy, limit, offset, exclusive) {

	var name = quote(context, table._dbName);
	var quotedAlias = quote(context, alias);
	var columnSql = newColumnSql(context, table, span, alias);
	var joinSql = newJoinSql(context, span, alias);
	var whereSql = newWhereSql(context, table, filter, alias);
	var safeLimit = negotiateLimit(limit);
	var lockClause = lockSql.selectLockSql(context, span, alias, exclusive);
	var tableHint = lockSql.tableHintSql(context, span, exclusive);
	return newParameterized('select' + safeLimit + ' ' + columnSql + ' from ' + name + ' ' + quotedAlias + tableHint)
		.append(innerJoin)
		.append(joinSql)
		.append(whereSql)
		.append(orderBy + offset + lockClause);
}

module.exports = _new;
