var requireMock = require('a').requireMock;
var newShallowColumnSql = requireMock('./newShallowColumnSql');
var newJoinedColumnSql = requireMock('./newJoinedColumnSql');

var shallowColumnSql = '<shallowColumnSql>'
var joinedColumnSql = '<joinedColumnSql>';
var expected = ',<shallowColumnSql><joinedColumnSql>';
var leg = {};
var alias = 'alias';
var table = {};
var span = {};

function act(c) {
	leg.span = span;
	span.table = table;
	newShallowColumnSql.expect(table,alias).return(shallowColumnSql);
	newJoinedColumnSql.expect(span,alias).return(joinedColumnSql);
	c.returned = require('../joinLegToColumnSql')(leg,alias);
	c.expected = expected;
}

module.exports = act;