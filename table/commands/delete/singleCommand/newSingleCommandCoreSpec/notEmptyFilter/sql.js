function act(c) {
	c.filterSql = '<filter>';
    c.expected = c.deleteSql + ' where ' + c.filterSql;
    c.filter.sql.expect().return(c.filterSql);

    c.returned = c.sut.sql();
}

module.exports = act;
