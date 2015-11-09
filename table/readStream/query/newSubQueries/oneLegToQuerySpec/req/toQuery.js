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
	name = 'fooProp';
	filter = {};

function act(c) {
	c.query = {};
	leg.name = name;
	leg.columns = legColumns;
	leg.span = span;		
	span.table = childTable;
	table._primaryColumns = primaryColumns;
	leg.table = table			

	c.newShallowJoinSql.expect(table,legColumns,primaryColumns,alias,parentAlias).return(shallowJoin);
	c.newParameterized.expect(shallowJoin).return(filter);
	c.newQuery.expect(childTable,filter,span,alias).return(c.query);

    c.query.sql = c.mock();
    c.sql = '<selectSql>';
    c.query.sql.expect().return(c.sql);

    c.expected = ',(select row_to_json(r) from (<selectSql>) r ) "fooProp"';

	c.returned = c.sut(parentAlias,leg,legNo,filter);
}

module.exports = act;