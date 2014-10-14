function act(c) {
    c.relations.length = 0;
    c.discriminatorSql = {};

    c.whereSql = ' <whereSql>';
    c.tableName = '<tableName>';
    c.sql = 'delete from <tableName> _0 where <filter>';

    c.table._dbName = c.tableName;
    c.filterSql = '<filter>';

   	c.filterWithDiscr = {};
   	c.filterWithDiscr.sql = c.mock();
    c.filterWithDiscr.sql.expect().return(c.filterSql);

   	c.filter.append = c.mock();
   	c.filter.append.expect(c.discriminatorSql).return(c.filterWithDiscr);
    
    c.newDiscriminatorSql.expect(c.tableName, '_0').return(c.discriminatorSql);

    c.sut = c.newSut(c.table, c.filter, c.relations);
}

module.exports = act;
