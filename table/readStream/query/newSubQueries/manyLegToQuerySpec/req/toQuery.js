var parentAlias = '_1',
	leg = {},
	legNo = 2,
	table = {},
	childTable = {},
	span = {},
	alias = '_1_2',
	spanColumns = {},
	legColumns = {},
	shallowJoin = {},
	primaryColumns = {},
	parameterized = {},
	filter = {},
	name = 'fooProp';
	orderBy = {};

function act(c) {
	c.query = {};
	leg.columns = legColumns;
	leg.name = name;
	leg.span = span;		
	span.table = childTable;
	table._primaryColumns = primaryColumns;
	leg.table = table			

	c.extractOrderBy.expect(table,parentAlias).return(orderBy);
	c.newParameterized.expect(shallowJoin).return(filter);
	c.newShallowJoinSql.expect(table,legColumns,primaryColumns,alias,parentAlias).return(shallowJoin);
	c.newQuery.expect(childTable,filter,span,alias,orderBy).return(c.query);	

	c.query.sql = c.mock();
	c.sql = '<selectSql>';
	c.query.sql.expect().return(c.sql);

	c.expected = ',(select array_to_json(array_agg(row_to_json(r))) from (<selectSql>) r ) "fooProp"' ;

	c.returned = c.sut(parentAlias,leg,legNo,filter);
}

module.exports = act;