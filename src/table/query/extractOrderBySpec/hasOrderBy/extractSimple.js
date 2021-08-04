function act(c) {
    c.orderBy = 'prop1';

	c.column1 = {};
	c.column1._dbName = 'colName1';
	c.table.prop1 = c.column1;

	c.expected = ' order by alias.colName1'
	c.returned = c.sut(c.table, c.alias, c.orderBy, c.originalOrderBy);
}

module.exports = act;
