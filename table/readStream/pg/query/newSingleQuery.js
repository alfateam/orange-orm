var newColumnSql = require('./singleQuery/newShallowColumnSql');
var newWhereSql = require('../../../query/singleQuery/newWhereSql');

function _new(table,filter,alias,subQueries,orderBy,limit) {
	var c = {};

	c.sql = function() {
		var name = table._dbName;
		var columnSql = newColumnSql(table,alias);
		var whereSql = newWhereSql(table,filter,alias);
		return 'select ' + columnSql + subQueries + ' from ' + name + ' ' + alias  + whereSql + orderBy + limit;
	};

	c.parameters = filter.parameters;	

	return c;
}

module.exports = _new;