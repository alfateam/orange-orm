var a = require('a');
var requireMock = a.requireMock;	
var newColumnSql = requireMock('../../query/singleQuery/columnSql/newShallowColumnSql');
var newWhereSql = requireMock('../../query/singleQuery/newWhereSql');

var table = {};
var filter = {};
var span = {};
var alias = '_2';
var parameters = {};
var subQueries = ' <subQueries>';
var orderBy = ' <orderBy>';

function act(c) {
	c.requireMock = a.requireMock;
	c.mock = a.mock;
    filter.parameters = parameters;
    c.parameters = parameters;
    c.alias = alias;
    c.table = table;
    c.filter = filter;
    c.span = span;
    c.subQueries = subQueries;
    c.newColumnSql = newColumnSql;
    c.newWhereSql = newWhereSql;

    c.sut = require('../newSingleQuery')(table, filter, span, alias, subQueries, orderBy);
}

module.exports = act;
