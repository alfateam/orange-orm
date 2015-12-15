var newColumnSql = require('./singleQuery/newColumnSql');
var newJoinSql = require('./singleQuery/newJoinSql');
var newWhereSql = require('./singleQuery/newWhereSql');
var newQueryContext = require('./singleQuery/newQueryContext');
var negotiateExclusive = require('./singleQuery/negotiateExclusive');

function _new(table,filter,span,alias,innerJoin,orderBy) {
	var c = {};

	c.sql = function() {
		var name = table._dbName;
		var columnSql = newColumnSql(table,span,alias);
		var innerJoinSql = innerJoin.sql();
		var joinSql = newJoinSql(span,alias);
		var whereSql = newWhereSql(table,filter,alias);
		var exclusive = negotiateExclusive(table);
		return 'select ' + columnSql + ' from ' + name + ' ' + alias + innerJoinSql + joinSql + whereSql + orderBy + exclusive;
	};

	c.parameters = filter.parameters;	
	c.queryContext = newQueryContext(filter, alias, innerJoin);

	return c;
}

module.exports = _new;