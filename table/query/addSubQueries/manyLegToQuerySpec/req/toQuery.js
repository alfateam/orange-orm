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
	shallowJoin = ' shallowJoin',
	primaryColumns = {},
	queries = {},
	parameterized = {},
	filter = {},
	orderBy = {};

function act(c) {
	c.query = {};
	leg.columns = legColumns;
	leg.span = span;		
	span.table = childTable;
	table._primaryColumns = primaryColumns;
	leg.table = table			

	c.extractOrderBy.expect(table,parentAlias).return(orderBy);

	c.newParameterized.expect(' INNER shallowJoin').return(parameterized);
	parameterized.append = c.mock();
	parameterized.append.expect(innerJoin).return(nextInnerJoin);

	c.newShallowJoinSql.expect(table,legColumns,primaryColumns,alias,parentAlias).return(shallowJoin);
	c.newQuery.expect(queries, childTable,filter,span,alias,nextInnerJoin,orderBy).return(c.query);
	c.returned = c.sut(queries, parentAlias,leg,legNo,filter,innerJoin);
}

module.exports = act;