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
	emptyFilter;

function act(c) {
	c.expected = {};
	leg.columns = legColumns;
	leg.span = span;		
	span.table = childTable;
	table._primaryColumns = primaryColumns;
	leg.table = table			
	innerJoin.prepend  = c.mock();
	innerJoin.prepend.expect(' INNER shallowJoin').return(nextInnerJoin);
	c.newShallowJoinSql.expect(table,legColumns,primaryColumns,alias,parentAlias).return(shallowJoin);
	c.newQuery.expect(childTable,emptyFilter,span,alias,nextInnerJoin).return(c.expected);
	c.returned = c.sut(parentAlias,leg,legNo,innerJoin);
}

act.base = '../req';
module.exports = act;