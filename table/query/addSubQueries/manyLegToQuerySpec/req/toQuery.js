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
	emptyFilter;

function act(c) {
	leg.columns = legColumns;
	leg.span = span;		
	span.table = childTable;
	table._primaryColumns = primaryColumns;
	leg.table = table			
	innerJoin.prepend  = c.mock();
	innerJoin.prepend.expect(' INNER shallowJoin').return(nextInnerJoin);
	c.newShallowJoinSql.expect(table,legColumns,primaryColumns,alias,parentAlias).return(shallowJoin);
	c.newQuery.expect(queries, childTable,emptyFilter,span,alias,nextInnerJoin);
	c.sut(queries, parentAlias,leg,legNo,innerJoin);
}

act.base = '../req';
module.exports = act;