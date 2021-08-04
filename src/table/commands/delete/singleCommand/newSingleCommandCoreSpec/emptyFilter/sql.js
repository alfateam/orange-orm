function act(c) {
	c.filterSql = '';
    c.filter.sql.expect().return(c.filterSql);

    c.expected = {};
	c.deleteFromSqlFunc.expect(c.table, c.alias, '').return(c.expected);

    c.returned = c.sut.sql();
}

module.exports = act;
