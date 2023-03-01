var newColumnSql = require('./singleQuery/newShallowColumnSql');
var newWhereSql = require('../../../table/query/singleQuery/newWhereSql');

function _new(table,filter,span, alias,subQueries,orderBy,limit) {
	var c = {};

	c.sql = function() {
		var name = table._dbName;
		var columnSql = newColumnSql(table,alias,span);
		var whereSql = newWhereSql(table,filter,alias);
		if (subQueries)
			columnSql = [columnSql, subQueries].join(',');
		if (limit)
			limit = limit + ' ';
		return 'select ' + limit + columnSql + ' from ' + name + ' ' + alias +  whereSql + orderBy ;
	};

	c.parameters = filter.parameters;

	return c;
}

module.exports = _new;