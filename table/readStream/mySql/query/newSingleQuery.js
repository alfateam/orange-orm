var newColumnSql = require('./singleQuery/newShallowColumnSql');
var newWhereSql = require('../../query/singleQuery/newWhereSql');
var template = 'select json_object(%s%s) from %s %s%s%s';
var util = require('util');

function _new(table,filter,alias,subQueries,orderBy) {
	var c = {};

	c.sql = function() {
		var name = table._dbName;
		var columnSql = newColumnSql(table,alias);
		var whereSql = newWhereSql(table,filter,alias);
		return util.format(template, columnSql, subQueries, name, alias, whereSql, orderBy);
	};
	
	c.parameters = filter.parameters;	

	return c;
}

module.exports = _new;