var newColumnSql = require('./singleQuery/newColumnSql');
var newJoinSql = require('./singleQuery/newJoinSql');
var newWhereSql = require('./singleQuery/newWhereSql');
var negotiateLimit = require('./singleQuery/negotiateLimit');
var negotiateExclusive = require('./singleQuery/negotiateExclusive');
var newParameterized = require('../../table/query/newParameterized');
var quote = require('../quote');

function _new(context, table, filter, span, alias, innerJoin, orderBy, limit, offset, exclusive) {

	var name = quote(context, table._dbName);
	var columnSql = newColumnSql(context, table, span, alias);
	var joinSql = newJoinSql(context, span, alias);
	var whereSql = newWhereSql(context, table, filter, alias);
	var safeLimit = negotiateLimit(limit);
	var exclusiveClause = negotiateExclusive(table, alias, exclusive);
	return newParameterized('select' + safeLimit + ' ' + columnSql + ' from ' + name + ' ' + quote(context, alias))
		.append(innerJoin)
		.append(joinSql)
		.append(whereSql)
		.append(orderBy + offset + exclusiveClause);
}

module.exports = _new;