var newColumnSql = require('../singleQuery/newShallowColumnSql');
var template = 'json_object(%s%s)';
var util = require('util');

function _new(table,alias,subQueries) {
	var c = {};

	c.sql = function() {
		var name = table._dbName;
		var columnSql = newColumnSql(table,alias);
		return util.format(template, columnSql, subQueries);
	};
	
	c.parameters = [];	

	return c;
}

module.exports = _new;