var requireMock = require('a').requireMock;
var newColumnSql = requireMock('./singleQuery/newColumnSql');
var newJoinSql = requireMock('./singleQuery/newJoinSql');
var newWhereSql = requireMock('./singleQuery/newWhereSql');

var table = {};
var filter = {};
var span = {};
var alias = '_2';

function act(c) {
	c.alias = alias;
	c.table = table;
	c.filter = filter;
	c.span = span;
	c.newColumnSql = newColumnSql;
	c.newJoinSql = newJoinSql;
	c.newWhereSql = newWhereSql;
	c.sut = require('../newSingleQuery')(table,filter,span,alias);
}

module.exports = act;
