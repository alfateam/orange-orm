function act(c) {
    c.relations.length = 0;
    c.discriminatorSql = '<discriminatorSql>';

    c.whereSql = ' <whereSql>';
    c.tableName = '<tableName>';
    c.sql = 'delete from <tableName> _0 where <discriminatorSql>';

    c.table._dbName = c.tableName;
    
    c.newDiscriminatorSql.expect(c.tableName, '_0').return(c.discriminatorSql);
    c.filte = null;

    c.sut = c.newSut(c.table, c.filter, c.relations);
}

module.exports = act;
