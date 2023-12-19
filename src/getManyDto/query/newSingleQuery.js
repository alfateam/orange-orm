var newColumnSql = require('../../table/query/singleQuery/newColumnSql');
var newWhereSql = require('../../table/query/singleQuery/newWhereSql');
var newJoinSql = require('../../table/query/singleQuery/newJoinSql');


function _new(table,filter,span, alias,orderBy,limit,offset) {
	var c = {};

	var name = table._dbName;
	var columnSql = newColumnSql(table,span,alias,true);
	var joinSql = newJoinSql(span,alias);
	var whereSql = newWhereSql(table,filter,alias);
	if (limit)
		limit = limit + ' ';


	c.sql = function() {
		return 'select ' + limit + columnSql + ' from ' + name + ' ' + alias + joinSql +  whereSql + orderBy +  offset;
	};

	c.parameters = filter.parameters;

	return c;
}

module.exports = _new;