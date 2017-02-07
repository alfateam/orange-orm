function act(c) {
	c.filterSql = '<filterSql>';
	c.whereSql =  ' where ' + c.filterSql;	
    c.filter.sql.expect().return(c.filterSql);

    c.expected = {};
	c.deleteFromSqlFunc.expect(c.table, c.alias, c.whereSql).return(c.expected);

    c.returned = c.sut.sql();
}

module.exports = act;
