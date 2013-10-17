var requireMock = require('a').requireMock;
var newShallowColumnSql = requireMock('./newShallowColumnSql');
var newJoinedColumnSql;

var shallowColumnSql = '<shallowColumnSql>'
var joinedColumnSql = '<joinedColumnSql>';
var expected = ',<shallowColumnSql><joinedColumnSql>';
var leg = {};
var alias = 'alias';
var table = {};
var span = {};
var sut;

function act(c) {
	leg.span = span;
	span.table = table;
	newShallowColumnSql.expect(table,alias).return(shallowColumnSql);	
	sut = require('../joinLegToColumnSql');
	newJoinedColumnSql = requireMock('./newJoinedColumnSql');
	newJoinedColumnSql.expect(span,alias).return(joinedColumnSql);
	c.returned = sut(leg,alias);
	c.expected = expected;
}

module.exports = act;