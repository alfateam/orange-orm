var newColumnSql = require('./singleQuery/newShallowColumnSql');
var newWhereSql = require('../../../table/query/singleQuery/newWhereSql');

function _new(table, filter, span, alias, innerJoin, orderBy, limit = '') {
	var c = {};

	c.sql = function() {
		var name = table._dbName;
		var columnSql = newColumnSql(table,alias,span);
		var whereSql = newWhereSql(table,filter,alias);
		return 'select ' + columnSql  + ' from ' + name + ' ' + alias + innerJoin +  whereSql + orderBy + limit;
	};

	c.parameters = filter.parameters;

	return c;
}

module.exports = _new;