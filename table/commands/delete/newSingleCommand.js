var newWhereSql = require('../../query/singleQuery/newWhereSql');
var newSelfJoin = require('./singleCommand/newSelfJoin');

function _new(table,filter,span,alias,innerJoin) {
	var c = {};

	c.sql = function() {
		var deleteAlias = alias + 'd';
		var name = table._dbName;
		var innerJoinSql = innerJoin.sql();
		var selfJoin = newSelfJoin(table, alias, alias + 'd');
		var whereSql = newWhereSql(table,filter,alias) + ' AND ' + selfJoin;
		return 'delete from ' + name + ' ' + deleteAlias + ' where (exists(select null from ' + name + ' ' + alias + innerJoinSql + whereSql + '))';
	};

	c.parameters = filter.parameters;	

	return c;
}

module.exports = _new;