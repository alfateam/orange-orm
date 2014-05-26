var requireMock = require('a').requireMock;
var newShallowJoinSql = requireMock('./newShallowJoinSql');
var shallowJoinSql = ' <shallowJoinSql>';
var expected = ' LEFT <shallowJoinSql>';
var alias = {};
var childAlias = {};
var parentTable = {};
var childTable = {};
var leg = {};
var span  = {};
var joinedColumns = {};
var parentPrimaryColumns = {};
parentTable._primaryColumns = parentPrimaryColumns;

leg.table = parentTable;
leg.span = span;
leg.columns = joinedColumns;
span.table = childTable;

function act(c) {
	newShallowJoinSql.expect(childTable,parentPrimaryColumns,joinedColumns,alias,childAlias).return(shallowJoinSql);
	c.expected = expected;
	c.returned = require('../oneLegToShallowJoinSql')(leg,alias,childAlias);
}

module.exports = act;
