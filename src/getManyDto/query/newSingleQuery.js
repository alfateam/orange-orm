var newColumnSql = require('../../table/query/singleQuery/newColumnSql');
var newWhereSql = require('../../table/query/singleQuery/newWhereSql');
var newJoinSql = require('../../table/query/singleQuery/newJoinSql');
var newParameterized = require('../../table/query/newParameterized');

function _new(table,filter,span, alias,orderBy,limit,offset) {
//todo
	var name = table._dbName;
	var columnSql = newColumnSql(table,span,alias,true);
	var joinSql = newJoinSql(span, alias);
	var whereSql = newWhereSql(table,filter,alias);
	if (limit)
		limit = limit + ' ';

	return newParameterized('select ' + limit + columnSql + ' from ' + name + ' ' + alias).append(joinSql).append(whereSql).append(orderBy + offset);

}

module.exports = _new;