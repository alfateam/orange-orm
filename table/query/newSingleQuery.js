var newColumnSql = require('./singleQuery/newColumnSql');
var newJoinSql = require('./singleQuery/newJoinSql');
var newWhereSql = require('./singleQuery/newWhereSql');

function _new(table,filter,span,alias) {
	var c = {};
	
	c.sql = function() {
		var name = table._dbName;
		var columnSql = newColumnSql(table,span,alias);
		var joinSql = newJoinSql(span,alias);
		var whereSql = newWhereSql(filter);
		return 'select ' + columnSql + ' from ' + name + ' ' + alias + joinSql + whereSql;
	};

	c.parameters = filter.parameters;	

	return c;
}

module.exports = _new;