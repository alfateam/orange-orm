function act(c) {
	c.filterSql = '<filter>';
    c.expected = 'delete from ' + c.tableName + ' ' + c.alias + ' where ' + c.filterSql;
    c.filter.sql.expect().return(c.filterSql);

    c.returned = c.sut.sql();
}

module.exports = act;
