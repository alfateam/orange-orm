var parentAlias = '_1',
	leg = {},
	legNo = 2,
	innerJoin = {},
	nextInnerJoin = {},
	table = {},
	childTable = {},
	span = {},
	orderByOverride = {},
	alias = '_1_2',
	spanColumns = {},
	legColumns = {},
	shallowJoin = {},
	primaryColumns = {},
	queries = {},
	parameterized = {},
	filter = {},
	limitQuery = {},
	orderBy = {};

function act(c) {
	c.query = {};
	leg.columns = legColumns;
	leg.span = span;		
	span.orderBy = orderByOverride;
	span.table = childTable;
	table._primaryColumns = primaryColumns;
	leg.table = table			

	c.extractOrderBy.expect(childTable,alias,orderByOverride).return(orderBy);

	shallowJoin.append = c.mock();
	shallowJoin.append.expect(innerJoin).return(nextInnerJoin);

	c.newShallowJoinSql.expect(table,legColumns,primaryColumns,alias,parentAlias,limitQuery).return(shallowJoin);
	c.newQuery.expect(queries, childTable,filter,span,alias,nextInnerJoin,orderBy).return(c.query);
	c.returned = c.sut(queries, parentAlias,leg,legNo,filter,innerJoin,limitQuery);
}

module.exports = act;