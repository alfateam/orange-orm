var newColumnSql = require('../../table/query/singleQuery/newColumnSql');
var newWhereSql = require('../../table/query/singleQuery/newWhereSql');
var newJoinSql = require('../../table/query/singleQuery/newJoinSql');
var newParameterized = require('../../table/query/newParameterized');
var getSessionSingleton = require('../../table/getSessionSingleton');

function _new(context,table,filter,span, alias,orderBy,limit,offset) {
	var quote = getSessionSingleton(context, 'quote');
	var name = quote(table._dbName);
	var columnSql = newColumnSql(context,table,span,alias,true);
	var joinSql = newJoinSql(context, span, alias);
	var whereSql = newWhereSql(context,table,filter,alias);
	if (limit)
		limit = limit + ' ';

	return newParameterized('select ' + limit + columnSql + ' from ' + name + ' ' + quote(alias)).append(joinSql).append(whereSql).append(orderBy + offset);

}

module.exports = _new;