var newColumnSql = require('./singleQuery/newColumnSql');
var newJoinSql = require('./singleQuery/newJoinSql');
var newWhereSql = require('./singleQuery/newWhereSql');
var negotiateLimit = require('./singleQuery/negotiateLimit');
var negotiateExclusive = require('./singleQuery/negotiateExclusive');
var newParameterized = require('../../table/query/newParameterized');

function _new(table,filter,span,alias,innerJoin,orderBy,limit,offset,exclusive) {
	var c = {};

	// c.sql = function() {
		var name = table._dbName;
		var columnSql = newColumnSql(table,span,alias);
		var joinSql = newJoinSql(span,alias);
		var whereSql = newWhereSql(table,filter,alias);
		var safeLimit = negotiateLimit(limit);
		var exclusiveClause = negotiateExclusive(table,alias,exclusive);
		return newParameterized('select' + safeLimit + ' ' + columnSql + ' from ' + name + ' ' + alias)
			.append(innerJoin)
			.append(joinSql)
			.append(whereSql)
			.append(orderBy + offset + exclusiveClause);
	// };

	// c.parameters = innerJoin.parameters.concat(filter.parameters);

	// return c;
}

module.exports = _new;