var requireMock = require('a_mock').requireMock;
var newShallowJoinSql = requireMock('./newShallowJoinSql');

var expected = {};
var alias = {};
var childAlias = {};
var parentTable = {};
var childTable = {};
var leg = {};
var span  = {};
var joinedColumns = {};
var parentPrimaryColumns = {};
parentTable.primaryColumns = parentPrimaryColumns;

leg.table = parentTable;
leg.span = span;
leg.columns = joinedColumns;
span.table = childTable;

function act(c) {
	newShallowJoinSql.expect(childTable,parentPrimaryColumns,joinedColumns,alias,childAlias).return(expected);
	c.expected = expected;
	c.returned = require('../oneLegToShallowJoinSql')(leg,alias,childAlias);
}

module.exports = act;
