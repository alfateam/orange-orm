var requireMock = require('a').requireMock;
var newColumnSql = requireMock('./singleQuery/newColumnSql');
var newJoinSql = requireMock('./singleQuery/newJoinSql');
var newWhereSql = requireMock('./singleQuery/newWhereSql');

var table = {};
var filter = {};
var span = {};
var alias = '_2';
var parameters = {};
var innerJoin = {};

function act(c) {	
	filter.parameters = parameters;
	c.parameters = parameters;
	c.alias = alias;
	c.table = table;
	c.filter = filter;
	c.span = span;
	c.innerJoin = innerJoin;
	c.newColumnSql = newColumnSql;
	c.newJoinSql = newJoinSql;
	c.newWhereSql = newWhereSql;
	c.queryContext = {filter: filter, alias : alias, innerJoin: innerJoin}
	c.sut = require('../newSingleQuery')(table,filter,span,alias,innerJoin);
}

module.exports = act;
