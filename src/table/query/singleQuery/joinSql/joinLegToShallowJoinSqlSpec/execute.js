var requireMock = require('a').requireMock;
var newShallowJoinSql = requireMock('./newShallowJoinSql');

var shallowJoinSql = ' <shallowJoinSql>';
var expected = ' LEFT <shallowJoinSql>';
var alias = {};
var childAlias = {};
var leftTable = {};
var rightTable = {};
var leg = {};
var span  = {};
var leftColumns = {};
var primaryColumns = {};
rightTable._primaryColumns = primaryColumns;

leg.table = leftTable;
leg.span = span;
leg.columns = leftColumns;
span.table = rightTable;

function act(c) {

	newShallowJoinSql.expect(rightTable,leftColumns,primaryColumns,alias,childAlias).return(shallowJoinSql);
	c.expected = expected;
	c.returned = require('../joinLegToShallowJoinSql')(leg,alias,childAlias);
}

module.exports = act;
