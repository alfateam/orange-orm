var newColumnSql = require('./singleQuery/newColumnSql');
var newJoinSql = require('./singleQuery/newJoinSql');
var newWhereSql = require('./singleQuery/newWhereSql');

function _new(table,filter,span,alias,innerJoin) {
	var c = {};

	c.sql = function() {
		var name = table._dbName;
		var columnSql = newColumnSql(table,span,alias);
		var innerJoinSql = innerJoin.sql();
		var joinSql = newJoinSql(span,alias);
		var whereSql = newWhereSql(table,filter,alias);
		var select = 'select ' + columnSql + ' from ' + name + ' ' + alias + innerJoinSql + joinSql + whereSql;
		return select.replace('  ', ' ');
	};

	c.parameters = filter.parameters;	

	return c;
}

module.exports = _new;