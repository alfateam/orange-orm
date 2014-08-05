var newWhereSql = require('../query/singleQuery/newWhereSql');

function _new(table,filter,span,alias,innerJoin) {
	var c = {};

	c.sql = function() {
		var name = table._dbName;
		var innerJoinSql = innerJoin.sql();
		var whereSql = newWhereSql(table,filter,alias);
		return 'delete ' + 'from ' + name + ' ' + alias + innerJoinSql + ' ' + whereSql;
	};

	c.parameters = filter.parameters;	

	return c;
}

module.exports = _new;