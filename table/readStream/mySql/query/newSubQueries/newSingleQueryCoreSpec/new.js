var a = require('a');
var requireMock = a.requireMock;	
var newColumnSql = requireMock('../singleQuery/newShallowColumnSql');

var table = {};
var alias = '_2';
var subQueries = ' <subQueries>';

function act(c) {
	c.requireMock = a.requireMock;
	c.mock = a.mock;
    c.alias = alias;
    c.table = table;
    c.subQueries = subQueries;
    c.newColumnSql = newColumnSql;

    c.sut = require('../newSingleQueryCore')(table, alias, subQueries);
}

module.exports = act;
