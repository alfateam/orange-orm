var newColumnSql = require('./singleQuery/newShallowColumnSql');
var newWhereSql = require('../../../table/query/singleQuery/newWhereSql');

function _new(table,filter,span, alias,subQueries,orderBy,limit,offset) {
	var c = {};

	var name = table._dbName;
	var columnSql = newColumnSql(table,alias,span);
	var whereSql = newWhereSql(table,filter,alias);
	if (subQueries)
		columnSql = [columnSql, subQueries].join(',');
	if (limit)
		limit = limit + ' ';


	c.sql = function() {
		return 'select ' + limit + columnSql + ' from ' + name + ' ' + alias +  whereSql + orderBy +  offset;
	};

	c.parameters = filter.parameters;

	return c;
}

module.exports = _new;