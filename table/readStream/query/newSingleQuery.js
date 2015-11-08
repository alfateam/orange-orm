var newColumnSql = require('./singleQuery/newColumnSql');
var newJoinSql = require('./singleQuery/newJoinSql');
var newWhereSql = require('./singleQuery/newWhereSql');

function _new(table,filter,span,alias,subQueries,orderBy) {
	var c = {};

	c.sql = function() {
		var name = table._dbName;
		var columnSql = newColumnSql(table,alias);
		var joinSql = newJoinSql(span,alias);
		filter = filter.and(joinSql);
		var whereSql = newWhereSql(table,filter,alias);
		return 'select ' + columnSql + ' from ' + name + ' ' + alias  + whereSql + orderBy;
	};

	c.parameters = filter.parameters;	

	return c;
}

module.exports = _new;