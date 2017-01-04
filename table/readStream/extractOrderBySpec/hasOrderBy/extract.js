function act(c) {
    c.span.orderBy = ['prop1', 'prop2 desc'];

	c.column1 = {};
	c.column1._dbName = 'colName1';
	c.table.prop1 = c.column1;

	c.column2 = {};
	c.column2._dbName = 'colName2';
	c.table.prop2 = c.column2;

	c.expected = ' order by alias.colName1,alias.colName2 desc'
	c.returned = c.sut(c.alias, c.span);
}

module.exports = act;
