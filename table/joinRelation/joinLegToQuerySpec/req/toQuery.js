var parentAlias = '_1',
	leg = {},
	legNo = 2,
	innerJoin = {},
	nextInnerJoin = {},
	table = {},
	childTable = {},
	span = {},
	alias = '_1_2',
	spanColumns = {},
	legColumns = {},
	shallowJoin = {},
	primaryColumns = {},
	queries = {},
	parameterized = {},
	limitQuery = {},
	filter = {};

function act(c) {
	c.query = {};
	leg.columns = legColumns;
	leg.span = span;		
	span.table = childTable;
	childTable._primaryColumns = primaryColumns;
	leg.table = table;

	shallowJoin.append = c.mock();
	shallowJoin.append.expect(innerJoin).return(nextInnerJoin);

	c.newShallowJoinSql.expect(table,primaryColumns,legColumns,alias,parentAlias,limitQuery).return(shallowJoin);
	c.newQuery.expect(queries, childTable,filter,span,alias,nextInnerJoin).return(c.query);
	c.returned = c.sut(queries, parentAlias,leg,legNo,filter, innerJoin, limitQuery);
}

module.exports = act;