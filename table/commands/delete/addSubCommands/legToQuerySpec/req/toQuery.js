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
	filter = {};

function act(c) {
	leg.columns = legColumns;
	leg.span = span;		
	span.table = childTable;
	table._primaryColumns = primaryColumns;
	leg.table = table			

	c.newParameterized.expect(' INNER shallowJoin').return(parameterized);
	parameterized.append = c.mock();
	parameterized.append.expect(innerJoin).return(nextInnerJoin);

	c.newShallowJoinSql.expect(table,legColumns,primaryColumns,alias,parentAlias).return(shallowJoin);
	c.newDeleteCommand.expect(queries, childTable,filter,span,alias,nextInnerJoin);
	c.sut(queries, parentAlias,leg,legNo,filter, innerJoin);
}

module.exports = act;